-- ============================================================================
-- CrisisHub — Datos iniciales (seed)
-- Crea el primer evento. Re-ejecutable gracias al UNIQUE en slug.
-- Centro del mapa: aprox. Caracas, Venezuela.
-- ============================================================================

insert into public.events
  (slug, nombre, tipo, descripcion, pais, activo, center_lat, center_lng, center_zoom)
values
  ('terremoto-venezuela-2026',
   'Terremoto Venezuela 2026',
   'terremoto',
   'Plataforma ciudadana de información para la respuesta al terremoto de Venezuela de 2026.',
   'Venezuela',
   true,
   10.4806, -66.9036, 7)
on conflict (slug) do nothing;
