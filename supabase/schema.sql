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
  description text,
  years_experience integer
    check (years_experience is null or years_experience between 0 and 80),
  response_time_min integer
    check (response_time_min is null or response_time_min between 1 and 240),
  works_24h boolean not null default false,
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

create index if not exists locksmith_services_service_id_idx
  on public.locksmith_services (service_id);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  locksmith_id uuid not null
    references public.locksmiths(id) on delete restrict,
  service_id bigint not null
    references public.services(id) on delete restrict,
  customer_name text,
  customer_phone text not null,
  address_text text not null,
  latitude double precision
    check (latitude is null or latitude between -90 and 90),
  longitude double precision
    check (longitude is null or longitude between -180 and 180),
  details text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'on_the_way', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  check (
    (latitude is null and longitude is null)
    or
    (latitude is not null and longitude is not null)
  ),
  check (char_length(customer_phone) between 7 and 30),
  check (char_length(address_text) between 3 and 300),
  check (customer_name is null or char_length(customer_name) <= 100),
  check (details is null or char_length(details) <= 1000)
);

create index if not exists service_requests_locksmith_status_created_idx
  on public.service_requests (locksmith_id, status, created_at desc);

create index if not exists service_requests_service_id_idx
  on public.service_requests (service_id);

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
alter table public.service_requests enable row level security;

grant select on public.locksmiths to anon, authenticated;
grant select on public.services to anon, authenticated;
grant select on public.locksmith_services to anon, authenticated;
revoke all on table public.service_requests from anon, authenticated;
grant insert on table public.service_requests to anon, authenticated;
grant select on table public.service_requests to authenticated;
grant update (status) on table public.service_requests to authenticated;

revoke update on table public.locksmiths from authenticated;
grant update (is_available) on table public.locksmiths to authenticated;

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

drop policy if exists "Public can create pending service requests"
  on public.service_requests;

create policy "Public can create pending service requests"
  on public.service_requests
  for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "Locksmith owners can read own requests"
  on public.service_requests;

create policy "Locksmith owners can read own requests"
  on public.service_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.locksmiths as l
      where l.id = service_requests.locksmith_id
        and l.user_id = (select auth.uid())
    )
  );

drop policy if exists "Locksmith owners can update own requests"
  on public.service_requests;

create policy "Locksmith owners can update own requests"
  on public.service_requests
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.locksmiths as l
      where l.id = service_requests.locksmith_id
        and l.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.locksmiths as l
      where l.id = service_requests.locksmith_id
        and l.user_id = (select auth.uid())
    )
  );

drop policy if exists "Locksmith owners can update availability"
  on public.locksmiths;

create policy "Locksmith owners can update availability"
  on public.locksmiths
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.guard_service_request_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'pending' and new.status in ('accepted', 'cancelled'))
    or (old.status = 'accepted' and new.status in ('on_the_way', 'cancelled'))
    or (old.status = 'on_the_way' and new.status in ('completed', 'cancelled'))
  ) then
    raise exception 'Invalid service request status transition: % -> %',
      old.status,
      new.status;
  end if;

  if new.status = 'accepted' and old.accepted_at is null then
    new.accepted_at := now();
  end if;

  if new.status = 'completed' and old.completed_at is null then
    new.completed_at := now();
  end if;

  return new;
end;
$;

revoke all on function public.guard_service_request_status_transition()
from public, anon, authenticated;

drop trigger if exists service_requests_guard_status_transition
  on public.service_requests;

create trigger service_requests_guard_status_transition
before update of status on public.service_requests
for each row
execute function public.guard_service_request_status_transition();

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
