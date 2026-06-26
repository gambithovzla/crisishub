-- ============================================================
-- CrisisHub — INSTALAR TODO DE UNA VEZ
-- Copia este archivo COMPLETO y pégalo en el SQL Editor de Supabase.
-- ============================================================

-- ============================================================================
-- CrisisHub — Esquema inicial (Fase 2)
-- Arquitectura centrada en "Evento". Reutilizable para cualquier desastre.
-- Re-ejecutable: puedes pegar este archivo entero en el SQL Editor de Supabase
-- varias veces sin que falle.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) Extensiones y búsqueda sin acentos
--    f_unaccent: envoltorio IMMUTABLE de unaccent para usar en columnas
--    generadas. Hace que "maria perez" encuentre a "María Pérez".
-- ----------------------------------------------------------------------------
create extension if not exists unaccent;

create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = extensions, public, pg_catalog
as $$ select unaccent($1) $$;

-- ----------------------------------------------------------------------------
-- 1) Tipos enumerados (conjuntos cerrados de valores)
--    Se pueden ampliar después con: ALTER TYPE <nombre> ADD VALUE '<nuevo>';
-- ----------------------------------------------------------------------------
do $$ begin
  create type event_type as enum
    ('terremoto','inundacion','incendio','huracan','deslizamiento','otro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type moderation_status as enum
    ('visible','hidden','false_info','merged');
exception when duplicate_object then null; end $$;

do $$ begin
  create type person_status as enum
    ('desaparecido','encontrado_vivo','fallecido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_method as enum
    ('llamada','whatsapp','sms','presencial','redes','otro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type marker_type as enum
    ('hospital','refugio','acopio','agua','calle_bloqueada','edificio_colapsado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type help_mode as enum ('necesito','ofrezco');
exception when duplicate_object then null; end $$;

do $$ begin
  create type help_category as enum
    ('agua','comida','medicinas','hospedaje','transporte',
     'electricidad','internet','ropa','otros');
exception when duplicate_object then null; end $$;

do $$ begin
  create type help_status as enum ('pendiente','en_proceso','resuelta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('admin','moderador');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2) Utilidad: updated_at automático
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ----------------------------------------------------------------------------
-- 3) Perfiles de staff (ligados a Supabase Auth)
--    Debe crearse ANTES de la función is_staff(), que lo consulta.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  rol         user_role not null default 'moderador',
  nombre      text,
  created_at  timestamptz not null default now()
);

-- ¿El usuario autenticado es admin/moderador? SECURITY DEFINER evita
-- recursión de RLS al consultar la tabla profiles dentro de las políticas.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid());
$$;

-- ----------------------------------------------------------------------------
-- 4) Eventos (el concepto raíz)
-- ----------------------------------------------------------------------------
create table if not exists public.events (
  id           bigint generated always as identity primary key,
  slug         text not null unique,
  nombre       text not null,
  tipo         event_type not null default 'terremoto',
  descripcion  text,
  pais         text not null default 'Venezuela',
  activo       boolean not null default true,
  center_lat   double precision,
  center_lng   double precision,
  center_zoom  smallint not null default 7,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5) Módulo 1 — Personas desaparecidas (incluye "Último contacto")
-- ----------------------------------------------------------------------------
create table if not exists public.missing_persons (
  id                        bigint generated always as identity primary key,
  event_id                  bigint not null references public.events(id) on delete cascade,
  nombre                    text not null,
  apellido                  text not null,
  edad_aprox                smallint check (edad_aprox is null or (edad_aprox >= 0 and edad_aprox < 130)),
  foto_url                  text,
  ciudad                    text,
  estado_region             text,
  descripcion               text,
  -- Bloque "Último contacto"
  ultima_lat                double precision,
  ultima_lng                double precision,
  ultima_ubicacion_texto    text,
  ultimo_contacto_at        timestamptz,
  ultimo_contacto_medio     contact_method,
  ultimo_contacto_actividad text,
  -- Familiar que reporta
  familiar_nombre           text not null,
  familiar_telefono         text not null,
  -- Estado y moderación
  estado                    person_status not null default 'desaparecido',
  moderation                moderation_status not null default 'visible',
  merged_into_id            bigint references public.missing_persons(id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  -- Búsqueda full-text en español, sin acentos (generada automáticamente)
  search_vector tsvector generated always as (
    to_tsvector('spanish',
      public.f_unaccent(
        coalesce(nombre,'')        || ' ' ||
        coalesce(apellido,'')      || ' ' ||
        coalesce(ciudad,'')        || ' ' ||
        coalesce(estado_region,'') || ' ' ||
        coalesce(descripcion,'')
      )
    )
  ) stored
);

create index if not exists idx_missing_event        on public.missing_persons(event_id);
create index if not exists idx_missing_estado        on public.missing_persons(estado);
create index if not exists idx_missing_moderation    on public.missing_persons(moderation);
create index if not exists idx_missing_created       on public.missing_persons(created_at desc);
create index if not exists idx_missing_apellido      on public.missing_persons(lower(apellido));
create index if not exists idx_missing_search        on public.missing_persons using gin(search_vector);

-- ----------------------------------------------------------------------------
-- 6) Módulo 2 — "Tengo información" (reportes asociados a una persona)
-- ----------------------------------------------------------------------------
create table if not exists public.tips (
  id                 bigint generated always as identity primary key,
  missing_person_id  bigint not null references public.missing_persons(id) on delete cascade,
  nombre             text,
  telefono           text,
  informacion        text not null,
  lat                double precision,
  lng                double precision,
  ubicacion_texto    text,
  foto_url           text,
  moderation         moderation_status not null default 'visible',
  created_at         timestamptz not null default now()
);

create index if not exists idx_tips_person on public.tips(missing_person_id);

-- ----------------------------------------------------------------------------
-- 7) Módulo 4 — Mapa colaborativo (marcadores)
-- ----------------------------------------------------------------------------
create table if not exists public.map_markers (
  id          bigint generated always as identity primary key,
  event_id    bigint not null references public.events(id) on delete cascade,
  tipo        marker_type not null,
  descripcion text,
  foto_url    text,
  lat         double precision not null,
  lng         double precision not null,
  usuario     text,
  moderation  moderation_status not null default 'visible',
  created_at  timestamptz not null default now()
);

create index if not exists idx_markers_event on public.map_markers(event_id);
create index if not exists idx_markers_tipo  on public.map_markers(tipo);

-- ----------------------------------------------------------------------------
-- 8) Módulo 5 — Ayuda (necesito / ofrezco)
-- ----------------------------------------------------------------------------
create table if not exists public.help_requests (
  id              bigint generated always as identity primary key,
  event_id        bigint not null references public.events(id) on delete cascade,
  modo            help_mode not null,
  categoria       help_category not null,
  descripcion     text not null,
  lat             double precision,
  lng             double precision,
  ubicacion_texto text,
  contacto        text,
  estado          help_status not null default 'pendiente',
  moderation      moderation_status not null default 'visible',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_help_event     on public.help_requests(event_id);
create index if not exists idx_help_modo       on public.help_requests(modo);
create index if not exists idx_help_categoria  on public.help_requests(categoria);
create index if not exists idx_help_estado     on public.help_requests(estado);

-- ----------------------------------------------------------------------------
-- 9) Registro de auditoría (acciones de moderación)
-- ----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users(id) on delete set null,
  accion      text not null,
  tabla       text not null,
  registro_id text,
  detalle     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_created on public.audit_log(created_at desc);

-- ----------------------------------------------------------------------------
-- 10) Triggers updated_at
-- ----------------------------------------------------------------------------
drop trigger if exists trg_events_updated  on public.events;
create trigger trg_events_updated  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists trg_missing_updated on public.missing_persons;
create trigger trg_missing_updated before update on public.missing_persons
  for each row execute function public.set_updated_at();

drop trigger if exists trg_help_updated    on public.help_requests;
create trigger trg_help_updated    before update on public.help_requests
  for each row execute function public.set_updated_at();


-- ============================================================================
-- CrisisHub — Seguridad a nivel de fila (RLS)
-- Modelo:
--   • Público (anon): LEE lo que está 'visible' y CREA registros nuevos.
--     (El anti-spam real —rate limit, captcha, validación— vive en la app.)
--   • Staff (admin/moderador autenticado): control total (editar/ocultar/borrar).
-- Re-ejecutable: cada política se elimina antes de recrearse.
-- ============================================================================

alter table public.profiles       enable row level security;
alter table public.events         enable row level security;
alter table public.missing_persons enable row level security;
alter table public.tips           enable row level security;
alter table public.map_markers    enable row level security;
alter table public.help_requests  enable row level security;
alter table public.audit_log      enable row level security;

-- ---------------------------------------------------------------------------
-- PROFILES — cada quien ve su perfil; el staff ve todos. Cambios solo staff.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_write on public.profiles;
create policy profiles_write on public.profiles
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- EVENTS — lectura pública; escritura solo staff.
-- ---------------------------------------------------------------------------
drop policy if exists events_select on public.events;
create policy events_select on public.events
  for select using (true);

drop policy if exists events_write on public.events;
create policy events_write on public.events
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- MISSING_PERSONS — lee lo visible (o staff todo); crea cualquiera; edita staff.
-- ---------------------------------------------------------------------------
drop policy if exists missing_select on public.missing_persons;
create policy missing_select on public.missing_persons
  for select using (moderation = 'visible' or public.is_staff());

drop policy if exists missing_insert on public.missing_persons;
create policy missing_insert on public.missing_persons
  for insert with check (moderation = 'visible' and merged_into_id is null);

drop policy if exists missing_update on public.missing_persons;
create policy missing_update on public.missing_persons
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists missing_delete on public.missing_persons;
create policy missing_delete on public.missing_persons
  for delete using (public.is_staff());

-- ---------------------------------------------------------------------------
-- TIPS ("Tengo información") — igual patrón.
-- ---------------------------------------------------------------------------
drop policy if exists tips_select on public.tips;
create policy tips_select on public.tips
  for select using (moderation = 'visible' or public.is_staff());

drop policy if exists tips_insert on public.tips;
create policy tips_insert on public.tips
  for insert with check (moderation = 'visible');

drop policy if exists tips_update on public.tips;
create policy tips_update on public.tips
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists tips_delete on public.tips;
create policy tips_delete on public.tips
  for delete using (public.is_staff());

-- ---------------------------------------------------------------------------
-- MAP_MARKERS — igual patrón.
-- ---------------------------------------------------------------------------
drop policy if exists markers_select on public.map_markers;
create policy markers_select on public.map_markers
  for select using (moderation = 'visible' or public.is_staff());

drop policy if exists markers_insert on public.map_markers;
create policy markers_insert on public.map_markers
  for insert with check (moderation = 'visible');

drop policy if exists markers_update on public.map_markers;
create policy markers_update on public.map_markers
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists markers_delete on public.map_markers;
create policy markers_delete on public.map_markers
  for delete using (public.is_staff());

-- ---------------------------------------------------------------------------
-- HELP_REQUESTS — crea cualquiera (siempre 'pendiente'); gestiona staff.
-- ---------------------------------------------------------------------------
drop policy if exists help_select on public.help_requests;
create policy help_select on public.help_requests
  for select using (moderation = 'visible' or public.is_staff());

drop policy if exists help_insert on public.help_requests;
create policy help_insert on public.help_requests
  for insert with check (moderation = 'visible' and estado = 'pendiente');

drop policy if exists help_update on public.help_requests;
create policy help_update on public.help_requests
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists help_delete on public.help_requests;
create policy help_delete on public.help_requests
  for delete using (public.is_staff());

-- ---------------------------------------------------------------------------
-- AUDIT_LOG — solo staff lee y escribe.
-- ---------------------------------------------------------------------------
drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log
  for select using (public.is_staff());

drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log
  for insert with check (public.is_staff());


-- ============================================================================
-- CrisisHub — Almacenamiento de fotos (Supabase Storage)
-- Bucket público "fotos": lectura abierta (CDN), subida abierta (la app
-- comprime/valida antes), y borrado/edición solo para staff.
-- Organización sugerida de rutas:
--   fotos/desaparecidos/<id>.jpg · fotos/tips/<id>.jpg · fotos/marcadores/<id>.jpg
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos', 'fotos', true,
  5242880,  -- 5 MB máximo por archivo
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública de objetos del bucket "fotos".
drop policy if exists "fotos lectura publica" on storage.objects;
create policy "fotos lectura publica" on storage.objects
  for select using (bucket_id = 'fotos');

-- Subida abierta al bucket "fotos" (anti-abuso en la capa de aplicación).
drop policy if exists "fotos subida publica" on storage.objects;
create policy "fotos subida publica" on storage.objects
  for insert with check (bucket_id = 'fotos');

-- Actualizar/borrar solo staff.
drop policy if exists "fotos update staff" on storage.objects;
create policy "fotos update staff" on storage.objects
  for update using (bucket_id = 'fotos' and public.is_staff())
  with check (bucket_id = 'fotos' and public.is_staff());

drop policy if exists "fotos delete staff" on storage.objects;
create policy "fotos delete staff" on storage.objects
  for delete using (bucket_id = 'fotos' and public.is_staff());


-- ============================================================================
-- CrisisHub — Centros de acopio internacionales (incremental)
-- Directorio de puntos físicos donde la diáspora puede llevar insumos
-- (Lima, Miami, Santiago, Tokio…) para un evento. Re-ejecutable.
-- ============================================================================

create table if not exists public.collection_points (
  id            bigint generated always as identity primary key,
  event_id      bigint not null references public.events(id) on delete cascade,
  pais          text not null,
  ciudad        text,
  nombre        text not null,
  direccion     text,
  lat           double precision,
  lng           double precision,
  categorias    help_category[] not null default '{}',
  instrucciones text,
  horario       text,
  contacto      text,
  url           text,
  activo        boolean not null default true,
  moderation    moderation_status not null default 'visible',
  created_at    timestamptz not null default now()
);

create index if not exists idx_acopio_event on public.collection_points(event_id);
create index if not exists idx_acopio_pais  on public.collection_points(pais);

alter table public.collection_points enable row level security;

drop policy if exists acopio_select on public.collection_points;
create policy acopio_select on public.collection_points
  for select using (moderation = 'visible' or public.is_staff());

drop policy if exists acopio_insert on public.collection_points;
create policy acopio_insert on public.collection_points
  for insert with check (moderation = 'visible');

drop policy if exists acopio_update on public.collection_points;
create policy acopio_update on public.collection_points
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists acopio_delete on public.collection_points;
create policy acopio_delete on public.collection_points
  for delete using (public.is_staff());


-- ============================================================================
-- CrisisHub — Solicitudes de acceso staff (0006)
-- ============================================================================

do $$ begin
  create type staff_application_status as enum ('pendiente', 'aprobado', 'rechazado');
exception when duplicate_object then null;
end $$;

create table if not exists public.staff_applications (
  id           bigint generated always as identity primary key,
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  email        text not null,
  nombre       text not null,
  mensaje      text,
  estado       staff_application_status not null default 'pendiente',
  reviewed_by  uuid references public.profiles(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_staff_applications_estado
  on public.staff_applications(estado);

alter table public.staff_applications enable row level security;

drop policy if exists staff_applications_select on public.staff_applications;
create policy staff_applications_select on public.staff_applications
  for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists staff_applications_insert on public.staff_applications;
create policy staff_applications_insert on public.staff_applications
  for insert with check (
    user_id = auth.uid()
    and estado = 'pendiente'
    and not exists (select 1 from public.profiles p where p.id = auth.uid())
    and not exists (
      select 1 from public.staff_applications sa
      where sa.user_id = auth.uid()
        and sa.estado in ('pendiente', 'aprobado')
    )
  );

drop policy if exists staff_applications_update on public.staff_applications;
create policy staff_applications_update on public.staff_applications
  for update using (public.is_staff()) with check (public.is_staff());


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


-- ============================================================================
-- CrisisHub — Centros de salud y registro de pacientes/heridos (0007)
-- ============================================================================

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

create table if not exists public.health_facilities (
  id          bigint generated always as identity primary key,
  event_id    bigint not null references public.events(id) on delete cascade,
  nombre      text not null,
  tipo        facility_type not null default 'hospital',
  estado      text,
  ciudad      text,
  direccion   text,
  lat         double precision,
  lng         double precision,
  telefono    text,
  capacidad   text,
  url         text,
  verificado  boolean not null default false,
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

create table if not exists public.patient_records (
  id              bigint generated always as identity primary key,
  event_id        bigint not null references public.events(id) on delete cascade,
  facility_id     bigint references public.health_facilities(id) on delete set null,
  facility_nombre text,
  nombre          text not null,
  documento_tipo  document_type not null default 'cedula_v',
  documento       text,
  documento_norm  text generated always as
                    (upper(regexp_replace(coalesce(documento, ''), '[^a-zA-Z0-9]', '', 'g')))
                    stored,
  edad            int,
  sexo            text,
  estado          patient_status not null default 'ingresado',
  notas           text,
  reportante_nombre   text,
  reportante_contacto text,
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

drop policy if exists patients_select on public.patient_records;
create policy patients_select on public.patient_records
  for select using (public.is_staff());

drop policy if exists patients_insert on public.patient_records;
create policy patients_insert on public.patient_records
  for insert with check (moderation = 'visible');

drop policy if exists patients_update on public.patient_records;
create policy patients_update on public.patient_records
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists patients_delete on public.patient_records;
create policy patients_delete on public.patient_records
  for delete using (public.is_staff());

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


-- ============================================================================
-- CrisisHub — Rate limiting por IP (anti-spam) — incremental, re-ejecutable
-- Registra "hits" por bucket (acción + IP) y permite/bloquea según una ventana.
-- Funciona en serverless (estado en la BD). No requiere servicios externos.
-- ============================================================================

create table if not exists public.rate_limit_hits (
  id         bigint generated always as identity primary key,
  bucket     text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_bucket
  on public.rate_limit_hits (bucket, created_at);

-- RLS activado y SIN políticas: nadie accede directo (solo la función SECURITY DEFINER).
alter table public.rate_limit_hits enable row level security;

-- Devuelve true si la acción está permitida (y registra el hit); false si excede.
create or replace function public.check_rate_limit(
  p_bucket text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  cnt int;
begin
  -- Limpia hits viejos de este bucket (mantiene la tabla acotada).
  delete from public.rate_limit_hits
   where bucket = p_bucket
     and created_at < now() - make_interval(secs => p_window_seconds);

  select count(*) into cnt
    from public.rate_limit_hits
   where bucket = p_bucket;

  if cnt >= p_max then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket) values (p_bucket);
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated;


-- ============================================================================
-- CrisisHub — Profesionales voluntarios (psicólogos/médicos) — incremental
-- Se registran para ofrecer atención gratuita. Un admin verifica su credencial
-- (privada) y solo los VERIFICADOS aparecen al público. Re-ejecutable.
-- ============================================================================

do $$ begin
  create type profession as enum
    ('psicologo','psiquiatra','medico_general','pediatra','enfermeria',
     'trabajo_social','nutricion','fisioterapia','odontologia','otro');
exception when duplicate_object then null; end $$;

create table if not exists public.volunteers (
  id             bigint generated always as identity primary key,
  event_id       bigint not null references public.events(id) on delete cascade,
  nombre         text not null,
  profesion      profession not null default 'psicologo',
  especialidad   text,
  modalidades    text[] not null default '{}', -- online/telefono/presencial/whatsapp
  zona           text,                          -- estado/ciudad o "Online / Todo el país"
  idiomas        text,
  bio            text,
  contacto       text not null,                 -- público: para que la gente contacte
  colegio_numero text,                          -- nº de colegiatura (prueba)
  credencial_path text,                         -- PRIVADO: foto del diploma/carnet
  verified       boolean not null default false, -- lo marca el staff
  moderation     moderation_status not null default 'visible',
  created_at     timestamptz not null default now()
);

create index if not exists idx_vol_event    on public.volunteers(event_id);
create index if not exists idx_vol_profesion on public.volunteers(profesion);
create index if not exists idx_vol_verified  on public.volunteers(verified);

alter table public.volunteers enable row level security;

-- Lectura DIRECTA de la tabla: SOLO staff (protege la credencial privada).
-- El público accede por la función listar_voluntarios() (sin credencial).
drop policy if exists vol_select on public.volunteers;
create policy vol_select on public.volunteers
  for select using (public.is_staff());

-- Registro público: queda SIN verificar y no puede autoverificarse.
drop policy if exists vol_insert on public.volunteers;
create policy vol_insert on public.volunteers
  for insert with check (verified = false and moderation = 'visible');

drop policy if exists vol_update on public.volunteers;
create policy vol_update on public.volunteers
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists vol_delete on public.volunteers;
create policy vol_delete on public.volunteers
  for delete using (public.is_staff());

-- Listado público seguro: solo verificados/visibles, SIN la credencial.
create or replace function public.listar_voluntarios(prof text default '')
returns table (
  id             bigint,
  nombre         text,
  profesion      profession,
  especialidad   text,
  modalidades    text[],
  zona           text,
  idiomas        text,
  bio            text,
  contacto       text,
  colegio_numero text,
  created_at     timestamptz
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select v.id, v.nombre, v.profesion, v.especialidad, v.modalidades, v.zona,
         v.idiomas, v.bio, v.contacto, v.colegio_numero, v.created_at
  from public.volunteers v
  where v.verified = true
    and v.moderation = 'visible'
    and (coalesce(trim(prof), '') = '' or v.profesion::text = prof)
  order by v.profesion, v.created_at desc
  limit 200;
$$;

grant execute on function public.listar_voluntarios(text) to anon, authenticated;

-- Bucket PRIVADO para credenciales (solo staff lo lee, vía signed URL).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('credenciales', 'credenciales', false, 5242880,
        array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "credenciales subir" on storage.objects;
create policy "credenciales subir" on storage.objects
  for insert with check (bucket_id = 'credenciales');

drop policy if exists "credenciales leer staff" on storage.objects;
create policy "credenciales leer staff" on storage.objects
  for select using (bucket_id = 'credenciales' and public.is_staff());

drop policy if exists "credenciales borrar staff" on storage.objects;
create policy "credenciales borrar staff" on storage.objects
  for delete using (bucket_id = 'credenciales' and public.is_staff());

-- ============================================================================
-- CrisisHub — Documento de identidad + detección de duplicados (incremental)
-- El documento (cédula/pasaporte) es el identificador único: si dos reportes
-- traen el mismo documento, es casi seguro la misma persona. Si no hay
-- documento, se usa similitud de texto (pg_trgm) sobre el nombre completo.
-- Re-ejecutable.
-- ============================================================================

create extension if not exists pg_trgm;

alter table public.missing_persons
  add column if not exists documento text;

alter table public.missing_persons
  add column if not exists documento_tipo document_type;

alter table public.missing_persons
  add column if not exists documento_norm text
  generated always as (regexp_replace(coalesce(documento, ''), '[^0-9]', '', 'g'))
  stored;

create index if not exists idx_missing_doc_norm
  on public.missing_persons(documento_norm)
  where documento_norm <> '';

create index if not exists idx_missing_nombre_trgm
  on public.missing_persons
  using gin (public.f_unaccent(nombre || ' ' || apellido) gin_trgm_ops);

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
