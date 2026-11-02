-- AbreYa - esquema inicial de búsqueda geográfica
-- Pensado para ejecutarse sobre un proyecto Supabase nuevo.
-- PostGIS se mantiene en el schema extensions para no exponer sus objetos
-- internos a través de la Data API.

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

create table if not exists public.locksmiths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  business_name text not null,
  slug text not null unique,
  phone text,
  whatsapp text,
  municipality text,
  province text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location extensions.geography(point, 4326)
    generated always as (
      extensions.st_setsrid(
        extensions.st_makepoint(longitude, latitude),
        4326
      )::extensions.geography
    ) stored,
  coverage_radius_km integer not null default 25
    check (coverage_radius_km between 1 and 100),
  is_available boolean not null default false,
  is_active boolean not null default true,
  verified boolean not null default false,
  plan text not null default 'free'
    check (plan in ('free', 'pro', 'premium')),
  rating numeric(2,1) not null default 0
    check (rating between 0 and 5),
  review_count integer not null default 0
    check (review_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists locksmiths_location_idx
  on public.locksmiths
  using gist (location);

create index if not exists locksmiths_availability_idx
  on public.locksmiths (is_active, is_available);

create table if not exists public.services (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  is_active boolean not null default true
);

create table if not exists public.locksmith_services (
  locksmith_id uuid not null
    references public.locksmiths(id) on delete cascade,
  service_id bigint not null
    references public.services(id) on delete cascade,
  starting_price numeric(10,2)
    check (starting_price is null or starting_price >= 0),
  primary key (locksmith_id, service_id)
);

insert into public.services (slug, name)
values
  ('door', 'Me he quedado fuera'),
  ('lost', 'He perdido las llaves'),
  ('broken', 'Cerradura averiada'),
  ('change', 'Cambiar cerradura')
on conflict (slug) do update
set
  name = excluded.name,
  is_active = true;

alter table public.locksmiths enable row level security;
alter table public.services enable row level security;
alter table public.locksmith_services enable row level security;

grant select on public.locksmiths to anon, authenticated;
grant select on public.services to anon, authenticated;
grant select on public.locksmith_services to anon, authenticated;

drop policy if exists "Public can read active locksmiths"
  on public.locksmiths;

create policy "Public can read active locksmiths"
  on public.locksmiths
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read active services"
  on public.services;

create policy "Public can read active services"
  on public.services
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read locksmith services"
  on public.locksmith_services;

create policy "Public can read locksmith services"
  on public.locksmith_services
  for select
  to anon, authenticated
  using (true);

create or replace function public.nearby_locksmiths(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 30,
  requested_service text default null
)
returns table (
  id uuid,
  business_name text,
  slug text,
  phone text,
  whatsapp text,
  municipality text,
  province text,
  rating numeric,
  review_count integer,
  verified boolean,
  is_available boolean,
  plan text,
  distance_km double precision,
  starting_price numeric
)
set search_path = ''
language sql
stable
security invoker
as $$
  with origin as (
    select
      extensions.st_setsrid(
        extensions.st_makepoint(user_lng, user_lat),
        4326
      )::extensions.geography as point
  )
  select
    l.id,
    l.business_name,
    l.slug,
    l.phone,
    l.whatsapp,
    l.municipality,
    l.province,
    l.rating,
    l.review_count,
    l.verified,
    l.is_available,
    l.plan,
    round(
      (
        extensions.st_distance(l.location, origin.point) / 1000.0
      )::numeric,
      2
    )::double precision as distance_km,
    ls.starting_price
  from public.locksmiths as l
  cross join origin
  left join public.services as s
    on s.slug = requested_service
    and s.is_active = true
  left join public.locksmith_services as ls
    on ls.locksmith_id = l.id
    and ls.service_id = s.id
  where
    l.is_active = true
    and extensions.st_dwithin(
      l.location,
      origin.point,
      least(radius_km, l.coverage_radius_km)::double precision * 1000
    )
    and (
      requested_service is null
      or ls.locksmith_id is not null
    )
  order by
    l.is_available desc,
    l.location operator(extensions.<->) origin.point,
    l.rating desc;
$$;

revoke all on function public.nearby_locksmiths(
  double precision,
  double precision,
  double precision,
  text
) from public;

grant execute on function public.nearby_locksmiths(
  double precision,
  double precision,
  double precision,
  text
) to anon, authenticated;
