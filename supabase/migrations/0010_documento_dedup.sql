-- ============================================================================
-- CrisisHub — Documento de identidad + detección de duplicados (incremental)
-- El documento (cédula/pasaporte) es el identificador único: si dos reportes
-- traen el mismo documento, es casi seguro la misma persona. Si no hay
-- documento, se usa similitud de texto (pg_trgm) sobre el nombre completo.
-- Requiere 0001 (missing_persons, f_unaccent) y 0007 (mask_documento).
-- Re-ejecutable.
-- ============================================================================

create extension if not exists pg_trgm;

-- 1) Columnas de documento -----------------------------------------------------
alter table public.missing_persons
  add column if not exists documento text;

alter table public.missing_persons
  add column if not exists documento_tipo document_type;

-- Normalizado: SOLO dígitos (evita fallos de match por espacios/puntos/símbolos).
alter table public.missing_persons
  add column if not exists documento_norm text
  generated always as (regexp_replace(coalesce(documento, ''), '[^0-9]', '', 'g'))
  stored;

-- 2) Índices -------------------------------------------------------------------
-- Match exacto por documento.
create index if not exists idx_missing_doc_norm
  on public.missing_persons(documento_norm)
  where documento_norm <> '';

-- Respaldo difuso por nombre completo (sin acentos).
create index if not exists idx_missing_nombre_trgm
  on public.missing_persons
  using gin (public.f_unaccent(nombre || ' ' || apellido) gin_trgm_ops);

-- 3) Posibles duplicados -------------------------------------------------------
-- Devuelve candidatos al reportar: primero match exacto de documento, luego
-- similitud de nombre (umbral 0.4) dentro del mismo evento. Solo visibles y no
-- fusionados. SECURITY DEFINER para no exponer la tabla, pero solo expone datos
-- ya públicos de la ficha (nada de teléfono del familiar) y el documento
-- ENMASCARADO.
create or replace function public.posibles_duplicados(
  p_event_id  bigint,
  p_documento text default '',
  p_nombre    text default '',
  p_apellido  text default ''
)
returns table (
  id               bigint,
  nombre           text,
  apellido         text,
  foto_url         text,
  ciudad           text,
  estado_region    text,
  estado           person_status,
  documento_masked text,
  exact_doc        boolean,
  score            real
)
language sql
stable
security definer
set search_path = public, extensions, pg_catalog
as $$
  with params as (
    select
      regexp_replace(coalesce(p_documento, ''), '[^0-9]', '', 'g') as doc,
      public.f_unaccent(btrim(coalesce(p_nombre, '') || ' ' || coalesce(p_apellido, ''))) as fullname
  )
  select
    mp.id,
    mp.nombre,
    mp.apellido,
    mp.foto_url,
    mp.ciudad,
    mp.estado_region,
    mp.estado,
    public.mask_documento(mp.documento) as documento_masked,
    (p.doc <> '' and mp.documento_norm = p.doc) as exact_doc,
    case
      when p.doc <> '' and mp.documento_norm = p.doc then 1.0::real
      else similarity(public.f_unaccent(mp.nombre || ' ' || mp.apellido), p.fullname)
    end as score
  from public.missing_persons mp, params p
  where mp.event_id = p_event_id
    and mp.moderation = 'visible'
    and mp.merged_into_id is null
    and (
      (p.doc <> '' and mp.documento_norm = p.doc)
      or (
        btrim(p.fullname) <> ''
        and similarity(public.f_unaccent(mp.nombre || ' ' || mp.apellido), p.fullname) > 0.4
      )
    )
  order by exact_doc desc, score desc
  limit 5;
$$;

grant execute on function public.posibles_duplicados(bigint, text, text, text)
  to anon, authenticated;
