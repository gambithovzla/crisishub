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
