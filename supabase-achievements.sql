-- Achievement unlock + XP award atomicity for NeuroFlow
-- Run this in Supabase SQL editor after `supabase-setup.sql`.

create or replace function public.unlock_achievements_and_award_xp(
  p_user_id uuid,
  p_achievement_ids uuid[]
)
returns table (
  achievement_id uuid,
  xp_awarded integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or current_user_id <> p_user_id then
    raise exception 'forbidden';
  end if;

  if p_achievement_ids is null or coalesce(array_length(p_achievement_ids, 1), 0) = 0 then
    return;
  end if;

  return query
  with inserted as (
    insert into public.user_achievements (user_id, achievement_id)
    select p_user_id, ids.new_achievement_id
    from unnest(p_achievement_ids) as ids(new_achievement_id)
    on conflict (user_id, achievement_id) do nothing
    returning public.user_achievements.achievement_id as inserted_achievement_id
  ),
  awarded as (
    select
      i.inserted_achievement_id,
      a.xp_reward::integer as xp_awarded
    from inserted i
    join public.achievements a on a.id = i.inserted_achievement_id
  ),
  totals as (
    select coalesce(sum(a.xp_awarded), 0)::integer as total_xp
    from awarded a
  ),
  profile_update as (
    update public.profiles
    set xp_total = xp_total + t.total_xp
    from totals t
    where id = p_user_id and t.total_xp > 0
    returning public.profiles.id
  )
  select a.inserted_achievement_id, a.xp_awarded
  from awarded a;
end;
$$;

grant execute on function public.unlock_achievements_and_award_xp(uuid, uuid[]) to authenticated;
