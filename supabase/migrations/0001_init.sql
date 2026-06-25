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
-- 2) Utilidades: updated_at automático y comprobación de rol de staff
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

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
-- 3) Perfiles de staff (ligados a Supabase Auth)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  rol         user_role not null default 'moderador',
  nombre      text,
  created_at  timestamptz not null default now()
);

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
