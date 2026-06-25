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
  -- Búsqueda full-text en español (generada automáticamente)
  search_vector tsvector generated always as (
    to_tsvector('spanish',
      coalesce(nombre,'')        || ' ' ||
      coalesce(apellido,'')      || ' ' ||
      coalesce(ciudad,'')        || ' ' ||
      coalesce(estado_region,'') || ' ' ||
      coalesce(descripcion,'')
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
