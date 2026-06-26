-- Solicitudes de acceso al panel (pendiente de aprobación del admin).

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
