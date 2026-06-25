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
