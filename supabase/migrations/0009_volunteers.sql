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
