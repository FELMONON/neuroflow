-- Shared rate limiting backend for NeuroFlow
-- Run this in Supabase SQL editor after `supabase-setup.sql`.

create table if not exists public.rate_limit_windows (
  "key" text primary key,
  window_start timestamptz not null,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_windows_updated_at
  on public.rate_limit_windows (updated_at);

create or replace function public.check_rate_limit(
  p_key text,
  p_max integer,
  p_window_ms integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_ms integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := clock_timestamp();
  window_interval interval := make_interval(secs => p_window_ms / 1000.0);
  current_window_start timestamptz;
  current_count integer;
begin
  if p_key is null or p_key = '' then
    raise exception 'p_key is required';
  end if;
  if p_max <= 0 then
    raise exception 'p_max must be > 0';
  end if;
  if p_window_ms <= 0 then
    raise exception 'p_window_ms must be > 0';
  end if;

  insert into public.rate_limit_windows ("key", window_start, count, updated_at)
  values (p_key, now_ts, 0, now_ts)
  on conflict ("key") do nothing;

  select window_start, count
    into current_window_start, current_count
  from public.rate_limit_windows
  where "key" = p_key
  for update;

  if now_ts - current_window_start >= window_interval then
    update public.rate_limit_windows
    set window_start = now_ts,
        count = 1,
        updated_at = now_ts
    where "key" = p_key;

    return query
    select true, p_max - 1, 0;
    return;
  end if;

  if current_count >= p_max then
    return query
    select
      false,
      0,
      greatest(
        0,
        floor(extract(epoch from (window_interval - (now_ts - current_window_start))) * 1000)::integer
      );
    return;
  end if;

  update public.rate_limit_windows
  set count = current_count + 1,
      updated_at = now_ts
  where "key" = p_key;

  return query
  select true, greatest(0, p_max - (current_count + 1)), 0;
end;
$$;

grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
