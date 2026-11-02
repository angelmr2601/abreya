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


update public.locksmiths
set
  description = case slug
    when 'cerrajeria-marchena-demo' then 'Profesional de prueba para el MVP de AbreYa. Atiende aperturas, incidencias con cerraduras y cambios de bombín en Marchena y alrededores.'
    when 'cerrajeria-centro-demo' then 'Perfil demo para probar la búsqueda y la ficha pública de profesionales en Sevilla.'
    when 'llave-rapida-demo' then 'Perfil destacado de prueba con atención rápida para servicios urgentes de cerrajería.'
    when 'cerrajero-sur-demo' then 'Perfil demo para comprobar disponibilidad, cobertura y servicios en Dos Hermanas.'
    else description
  end,
  years_experience = case slug
    when 'cerrajeria-marchena-demo' then 8
    when 'cerrajeria-centro-demo' then 12
    when 'llave-rapida-demo' then 15
    when 'cerrajero-sur-demo' then 6
    else years_experience
  end,
  response_time_min = case slug
    when 'cerrajeria-marchena-demo' then 20
    when 'cerrajeria-centro-demo' then 25
    when 'llave-rapida-demo' then 15
    when 'cerrajero-sur-demo' then 30
    else response_time_min
  end,
  works_24h = case slug
    when 'cerrajeria-marchena-demo' then true
    when 'cerrajeria-centro-demo' then false
    when 'llave-rapida-demo' then true
    when 'cerrajero-sur-demo' then false
    else works_24h
  end
where slug in (
  'cerrajeria-marchena-demo',
  'cerrajeria-centro-demo',
  'llave-rapida-demo',
  'cerrajero-sur-demo'
);
