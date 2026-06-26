-- ============================================================================
-- CrisisHub — Centros de salud y registro de pacientes/heridos (incremental)
-- Requiere 0001 (events, moderation_status, f_unaccent vía 0004).
-- Re-ejecutable.
-- ============================================================================

-- Tipos -----------------------------------------------------------------------
do $$ begin
  create type facility_type as enum
    ('hospital', 'clinica', 'ambulatorio', 'cdi', 'modulo', 'cruz_roja', 'otro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type patient_status as enum
    ('ingresado', 'en_observacion', 'estable', 'grave', 'alta',
     'fallecido', 'no_identificado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_type as enum
    ('cedula_v', 'cedula_e', 'pasaporte', 'otro', 'sin_documento');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 1) Directorio de centros de salud
-- ----------------------------------------------------------------------------
create table if not exists public.health_facilities (
  id          bigint generated always as identity primary key,
  event_id    bigint not null references public.events(id) on delete cascade,
  nombre      text not null,
  tipo        facility_type not null default 'hospital',
  estado      text,            -- estado de Venezuela
  ciudad      text,
  direccion   text,
  lat         double precision,
  lng         double precision,
  telefono    text,
  capacidad   text,            -- nota libre: operatividad / capacidad / insumos
  url         text,
  verificado  boolean not null default false,  -- proviene de directorio oficial / staff
  activo      boolean not null default true,
  moderation  moderation_status not null default 'visible',
  created_at  timestamptz not null default now()
);

create index if not exists idx_facilities_event  on public.health_facilities(event_id);
create index if not exists idx_facilities_estado on public.health_facilities(estado);

alter table public.health_facilities enable row level security;

drop policy if exists facilities_select on public.health_facilities;
create policy facilities_select on public.health_facilities
  for select using (moderation = 'visible' or public.is_staff());

drop policy if exists facilities_insert on public.health_facilities;
create policy facilities_insert on public.health_facilities
  for insert with check (moderation = 'visible');

drop policy if exists facilities_update on public.health_facilities;
create policy facilities_update on public.health_facilities
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists facilities_delete on public.health_facilities;
create policy facilities_delete on public.health_facilities
  for delete using (public.is_staff());

-- ----------------------------------------------------------------------------
-- 2) Pacientes ingresados / heridos (PII sensible)
--    Lectura directa SOLO para staff. El público accede por la función
--    buscar_pacientes(), que enmascara el documento.
-- ----------------------------------------------------------------------------
create table if not exists public.patient_records (
  id              bigint generated always as identity primary key,
  event_id        bigint not null references public.events(id) on delete cascade,
  facility_id     bigint references public.health_facilities(id) on delete set null,
  facility_nombre text,            -- respaldo si el centro no está en el directorio
  nombre          text not null,
  documento_tipo  document_type not null default 'cedula_v',
  documento       text,
  documento_norm  text generated always as
                    (upper(regexp_replace(coalesce(documento, ''), '[^a-zA-Z0-9]', '', 'g')))
                    stored,
  edad            int,
  sexo            text,            -- 'M' | 'F' | 'otro'
  estado          patient_status not null default 'ingresado',
  notas           text,            -- solo staff
  reportante_nombre   text,        -- solo staff
  reportante_contacto text,        -- solo staff
  search_vector   tsvector generated always as (
    to_tsvector('spanish',
      public.f_unaccent(coalesce(nombre, '') || ' ' || coalesce(facility_nombre, '')))
  ) stored,
  moderation      moderation_status not null default 'visible',
  created_at      timestamptz not null default now()
);

create index if not exists idx_patients_event  on public.patient_records(event_id);
create index if not exists idx_patients_fac     on public.patient_records(facility_id);
create index if not exists idx_patients_doc     on public.patient_records(documento_norm);
create index if not exists idx_patients_search  on public.patient_records using gin(search_vector);

alter table public.patient_records enable row level security;

-- Solo staff puede leer la tabla directamente (protege cédulas y notas).
drop policy if exists patients_select on public.patient_records;
create policy patients_select on public.patient_records
  for select using (public.is_staff());

-- El público puede registrar un ingreso (queda visible, moderable por staff).
drop policy if exists patients_insert on public.patient_records;
create policy patients_insert on public.patient_records
  for insert with check (moderation = 'visible');

drop policy if exists patients_update on public.patient_records;
create policy patients_update on public.patient_records
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists patients_delete on public.patient_records;
create policy patients_delete on public.patient_records
  for delete using (public.is_staff());

-- ----------------------------------------------------------------------------
-- 3) Búsqueda pública segura (enmascara el documento)
-- ----------------------------------------------------------------------------
create or replace function public.mask_documento(doc text)
returns text
language plpgsql
immutable
as $$
declare d text;
begin
  d := regexp_replace(coalesce(doc, ''), '[^a-zA-Z0-9]', '', 'g');
  if length(d) < 4 then
    return null;
  end if;
  return left(d, 2) || repeat('*', length(d) - 4) || right(d, 2);
end;
$$;

create or replace function public.buscar_pacientes(q text default '', fac bigint default null)
returns table (
  id              bigint,
  nombre          text,
  facility_id     bigint,
  facility_nombre text,
  estado          patient_status,
  edad            int,
  sexo            text,
  documento_tipo  document_type,
  documento_masked text,
  created_at      timestamptz
)
language sql
stable
security definer
set search_path = public, extensions, pg_catalog
as $$
  select pr.id,
         pr.nombre,
         pr.facility_id,
         coalesce(hf.nombre, pr.facility_nombre) as facility_nombre,
         pr.estado,
         pr.edad,
         pr.sexo,
         pr.documento_tipo,
         public.mask_documento(pr.documento) as documento_masked,
         pr.created_at
  from public.patient_records pr
  left join public.health_facilities hf on hf.id = pr.facility_id
  where pr.moderation = 'visible'
    and (fac is null or pr.facility_id = fac)
    and (
      coalesce(trim(q), '') = ''
      or pr.search_vector @@ websearch_to_tsquery('spanish', public.f_unaccent(q))
      or pr.documento_norm = upper(regexp_replace(coalesce(q, ''), '[^a-zA-Z0-9]', '', 'g'))
    )
  order by pr.created_at desc
  limit 60;
$$;

grant execute on function public.buscar_pacientes(text, bigint) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4) Seed: hospitales públicos conocidos (solo si la tabla está vacía)
-- ----------------------------------------------------------------------------
insert into public.health_facilities (event_id, nombre, tipo, estado, ciudad, verificado)
select e.id, x.nombre, x.tipo::facility_type, x.estado, x.ciudad, true
from (values
  ('Hospital Universitario de Caracas',                'hospital', 'Distrito Capital', 'Caracas'),
  ('Hospital Vargas de Caracas',                       'hospital', 'Distrito Capital', 'Caracas'),
  ('Hospital de Niños J. M. de los Ríos',              'hospital', 'Distrito Capital', 'Caracas'),
  ('Hospital Dr. Miguel Pérez Carreño',                'hospital', 'Distrito Capital', 'Caracas'),
  ('Hospital General Dr. Domingo Luciani (El Llanito)','hospital', 'Miranda',          'Caracas'),
  ('Hospital Universitario de Maracaibo (SAHUM)',      'hospital', 'Zulia',            'Maracaibo'),
  ('Ciudad Hospitalaria Dr. Enrique Tejera (CHET)',    'hospital', 'Carabobo',         'Valencia'),
  ('Hospital Universitario Dr. Ángel Larralde',        'hospital', 'Carabobo',         'Valencia'),
  ('Hospital Central de Maracay',                      'hospital', 'Aragua',           'Maracay'),
  ('Instituto Autónomo Hospital Universitario de Los Andes (IAHULA)', 'hospital', 'Mérida', 'Mérida'),
  ('Hospital Central de San Cristóbal',                'hospital', 'Táchira',          'San Cristóbal'),
  ('Hospital Universitario Ruiz y Páez',               'hospital', 'Bolívar',          'Ciudad Bolívar'),
  ('Hospital Central Universitario Dr. Antonio María Pineda', 'hospital', 'Lara',      'Barquisimeto'),
  ('Hospital Universitario Dr. Luis Razetti',          'hospital', 'Anzoátegui',       'Barcelona'),
  ('Hospital Universitario Antonio Patricio de Alcalá (HUAPA)', 'hospital', 'Sucre',   'Cumaná')
) as x(nombre, tipo, estado, ciudad),
     public.events e
where e.slug = 'terremoto-venezuela-2026'
  and not exists (select 1 from public.health_facilities);
