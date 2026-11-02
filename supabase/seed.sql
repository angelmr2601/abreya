-- Datos ficticios únicamente para desarrollo local/MVP.
-- No representan negocios reales.

insert into public.locksmiths (
  business_name,
  slug,
  phone,
  whatsapp,
  municipality,
  province,
  latitude,
  longitude,
  coverage_radius_km,
  is_available,
  verified,
  plan,
  rating,
  review_count
)
values
  (
    'Cerrajería Centro Demo',
    'cerrajeria-centro-demo',
    null,
    null,
    'Sevilla',
    'Sevilla',
    37.3891,
    -5.9845,
    35,
    true,
    true,
    'free',
    4.8,
    48
  ),
  (
    'Llave Rápida Demo',
    'llave-rapida-demo',
    null,
    null,
    'Sevilla',
    'Sevilla',
    37.3978,
    -5.9752,
    35,
    true,
    true,
    'premium',
    4.9,
    91
  ),
  (
    'Cerrajero Sur Demo',
    'cerrajero-sur-demo',
    null,
    null,
    'Dos Hermanas',
    'Sevilla',
    37.2829,
    -5.9209,
    35,
    false,
    false,
    'free',
    4.5,
    17
  ),
  (
    'Cerrajería Marchena Demo',
    'cerrajeria-marchena-demo',
    null,
    null,
    'Marchena',
    'Sevilla',
    37.329,
    -5.416,
    30,
    true,
    true,
    'free',
    4.7,
    23
  )
on conflict (slug) do nothing;

insert into public.locksmith_services (
  locksmith_id,
  service_id,
  starting_price
)
select
  l.id,
  s.id,
  case
    when l.slug = 'cerrajeria-marchena-demo' and s.slug = 'door' then 65
    when l.slug = 'cerrajeria-marchena-demo' and s.slug = 'lost' then 75
    when l.slug = 'cerrajeria-marchena-demo' and s.slug = 'broken' then 60
    when l.slug = 'cerrajeria-marchena-demo' and s.slug = 'change' then 85
    when s.slug = 'door' then 70
    when s.slug = 'lost' then 80
    when s.slug = 'broken' then 65
    when s.slug = 'change' then 90
    else null
  end
from public.locksmiths as l
cross join public.services as s
where l.slug in (
  'cerrajeria-centro-demo',
  'llave-rapida-demo',
  'cerrajero-sur-demo',
  'cerrajeria-marchena-demo'
)
on conflict (locksmith_id, service_id) do nothing;
