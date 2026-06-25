-- ============================================================================
-- CrisisHub — Búsqueda insensible a acentos (incremental)
-- Ejecutar en bases ya creadas con 0001. Hace que "maria perez" encuentre
-- a "María Pérez". Re-ejecutable.
-- ============================================================================

create extension if not exists unaccent;

create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = extensions, public, pg_catalog
as $$ select unaccent($1) $$;

-- Recrear la columna de búsqueda usando f_unaccent (sin acentos).
alter table public.missing_persons drop column if exists search_vector;

alter table public.missing_persons
  add column search_vector tsvector generated always as (
    to_tsvector('spanish',
      public.f_unaccent(
        coalesce(nombre,'')        || ' ' ||
        coalesce(apellido,'')      || ' ' ||
        coalesce(ciudad,'')        || ' ' ||
        coalesce(estado_region,'') || ' ' ||
        coalesce(descripcion,'')
      )
    )
  ) stored;

create index if not exists idx_missing_search
  on public.missing_persons using gin(search_vector);
