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
