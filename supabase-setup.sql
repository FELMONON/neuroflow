-- ============================================================
-- NeuroFlow — Complete Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. ENUMS
-- ============================================================

create type energy_level as enum ('high', 'medium', 'low', 'recharge');
create type task_status as enum ('inbox', 'today', 'scheduled', 'in_progress', 'done', 'archived');
create type task_priority as enum ('critical', 'high', 'medium', 'low');
create type adhd_subtype as enum ('inattentive', 'hyperactive', 'combined', 'unsure');
create type session_type as enum ('focus', 'break', 'body_double');
create type room_type as enum ('open', 'invite_only');
create type dopamine_category as enum ('appetizer', 'entree', 'side', 'dessert');
create type routine_type as enum ('morning', 'evening', 'anytime', 'custom');
create type habit_frequency as enum ('daily', 'weekdays', 'weekends', 'custom');
create type achievement_category as enum ('streak', 'focus', 'tasks', 'habits', 'social', 'emotional');

-- 2. PROFILES (linked to auth.users)
-- ============================================================

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  timezone text not null default 'America/New_York',
  onboarding_completed boolean not null default false,
  adhd_subtype adhd_subtype,
  energy_pattern jsonb not null default '{"peak_start":"09:00","peak_end":"12:00","dip_start":"14:00","dip_end":"16:00"}'::jsonb,
  preferred_work_duration integer not null default 25,
  preferred_break_duration integer not null default 5,
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  xp_total integer not null default 0,
  level integer not null default 1,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. TASKS
-- ============================================================

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  status task_status not null default 'inbox',
  priority task_priority not null default 'medium',
  energy_required energy_level not null default 'medium',
  estimated_minutes integer,
  actual_minutes integer,
  interest_level integer not null default 3,
  due_date date,
  due_time time,
  scheduled_date date,
  scheduled_block text,
  parent_task_id uuid references tasks(id) on delete set null,
  sort_order integer not null default 0,
  tags text[] not null default '{}',
  ai_subtasks jsonb,
  completed_at timestamptz,
  xp_value integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on tasks(user_id);
create index tasks_status_idx on tasks(user_id, status);
create index tasks_scheduled_date_idx on tasks(user_id, scheduled_date);

-- 4. FOCUS SESSIONS
-- ============================================================

create table focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  task_id uuid references tasks(id) on delete set null,
  session_type session_type not null default 'focus',
  planned_duration integer not null,
  actual_duration integer,
  focus_quality integer check (focus_quality between 1 and 5),
  distractions_count integer not null default 0,
  notes text,
  soundscape text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index focus_sessions_user_id_idx on focus_sessions(user_id);

-- 5. DAILY PLANS
-- ============================================================

create table daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  plan_date date not null,
  energy_forecast text not null default 'unknown',
  main_focus text,
  time_blocks jsonb not null default '[]'::jsonb,
  morning_intention text,
  evening_reflection text,
  mood_morning integer check (mood_morning between 1 and 5),
  mood_evening integer check (mood_evening between 1 and 5),
  wins text[] not null default '{}',
  struggles text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, plan_date)
);

-- 6. HABITS
-- ============================================================

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  cue text,
  routine_type routine_type not null default 'anytime',
  frequency habit_frequency not null default 'daily',
  custom_days integer[] not null default '{}',
  estimated_minutes integer not null default 5,
  sort_order integer not null default 0,
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index habits_user_id_idx on habits(user_id);

-- 7. HABIT COMPLETIONS
-- ============================================================

create table habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  completed_date date not null,
  completed_at timestamptz not null default now(),
  notes text,
  unique(habit_id, completed_date)
);

create index habit_completions_user_date_idx on habit_completions(user_id, completed_date);

-- 8. PARKING LOT (quick capture during focus sessions)
-- ============================================================

create table parking_lot (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  captured_during_session_id uuid references focus_sessions(id) on delete set null,
  processed boolean not null default false,
  converted_to_task_id uuid references tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

create index parking_lot_user_id_idx on parking_lot(user_id);

-- 9. BODY DOUBLE ROOMS
-- ============================================================

create table body_double_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users on delete cascade not null,
  title text not null default 'Focus Room',
  room_type room_type not null default 'open',
  max_participants integer not null default 5,
  current_focus text,
  soundscape text,
  is_active boolean not null default true,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- 10. ROOM PARTICIPANTS
-- ============================================================

create table room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references body_double_rooms(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  current_task text,
  joined_at timestamptz not null default now(),
  left_at timestamptz
);

-- 11. DOPAMINE MENU
-- ============================================================

create table dopamine_menu (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  category dopamine_category not null default 'side',
  duration_minutes integer,
  notes text,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index dopamine_menu_user_id_idx on dopamine_menu(user_id);

-- 12. CHECK-INS (mood/energy tracking)
-- ============================================================

create table check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  mood integer check (mood between 1 and 5),
  energy integer check (energy between 1 and 5),
  focus_ability integer check (focus_ability between 1 and 5),
  emotions text[] not null default '{}',
  note text,
  created_at timestamptz not null default now()
);

create index check_ins_user_id_idx on check_ins(user_id);
create index check_ins_created_at_idx on check_ins(user_id, created_at);

-- 13. ACHIEVEMENTS
-- ============================================================

create table achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  icon text,
  xp_reward integer not null default 50,
  category achievement_category not null
);

-- 14. USER ACHIEVEMENTS (join table)
-- ============================================================

create table user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  achievement_id uuid references achievements(id) on delete cascade not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

create index user_achievements_user_id_idx on user_achievements(user_id);

-- 15. SEED ACHIEVEMENTS DATA
-- ============================================================

insert into achievements (slug, title, description, icon, xp_reward, category) values
  ('first_focus', 'First Focus', 'Complete your first focus session', 'zap', 50, 'focus'),
  ('brain_dump', 'Brain Dump', 'Capture 10 parking lot items in one session', 'brain', 75, 'focus'),
  ('early_bird', 'Early Bird', 'Complete a task before 8 AM', 'sunrise', 50, 'tasks'),
  ('night_owl', 'Night Owl', 'Complete a focus session after 10 PM', 'moon', 50, 'focus'),
  ('comeback_kid', 'Comeback Kid', 'Return after 7+ days away', 'rotate-ccw', 100, 'streak'),
  ('flow_state', 'Flow State', 'Rate 5/5 focus quality', 'flame', 75, 'focus'),
  ('body_buddy', 'Body Buddy', 'Complete 10 body doubling sessions', 'users', 100, 'social'),
  ('inbox_hero', 'Inbox Hero', 'Process all inbox items', 'inbox', 75, 'tasks'),
  ('habit_master', 'Habit Master', '30-day resilience streak', 'award', 200, 'habits'),
  ('time_detective', 'Time Detective', 'Track actual time for 20 tasks', 'clock', 100, 'tasks'),
  ('feeling_it', 'Feeling It', 'Complete 30 emotional check-ins', 'heart', 100, 'emotional'),
  ('task_crusher', 'Task Crusher', 'Complete 100 tasks', 'check-circle', 150, 'tasks'),
  ('week_warrior', 'Week Warrior', '7-day streak', 'shield', 100, 'streak'),
  ('month_master', 'Month Master', '30-day streak', 'crown', 300, 'streak'),
  ('centurion', 'Centurion', 'Reach level 10', 'star', 500, 'streak');

-- 16. ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles enable row level security;
alter table tasks enable row level security;
alter table focus_sessions enable row level security;
alter table daily_plans enable row level security;
alter table habits enable row level security;
alter table habit_completions enable row level security;
alter table parking_lot enable row level security;
alter table body_double_rooms enable row level security;
alter table room_participants enable row level security;
alter table dopamine_menu enable row level security;
alter table check_ins enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Tasks: full CRUD on own tasks
create policy "Users can view own tasks" on tasks for select using (auth.uid() = user_id);
create policy "Users can create own tasks" on tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on tasks for delete using (auth.uid() = user_id);

-- Focus sessions: full CRUD
create policy "Users can view own sessions" on focus_sessions for select using (auth.uid() = user_id);
create policy "Users can create own sessions" on focus_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on focus_sessions for update using (auth.uid() = user_id);
create policy "Users can delete own sessions" on focus_sessions for delete using (auth.uid() = user_id);

-- Daily plans: full CRUD
create policy "Users can view own plans" on daily_plans for select using (auth.uid() = user_id);
create policy "Users can create own plans" on daily_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own plans" on daily_plans for update using (auth.uid() = user_id);
create policy "Users can delete own plans" on daily_plans for delete using (auth.uid() = user_id);

-- Habits: full CRUD
create policy "Users can view own habits" on habits for select using (auth.uid() = user_id);
create policy "Users can create own habits" on habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on habits for delete using (auth.uid() = user_id);

-- Habit completions: full CRUD
create policy "Users can view own completions" on habit_completions for select using (auth.uid() = user_id);
create policy "Users can create own completions" on habit_completions for insert with check (auth.uid() = user_id);
create policy "Users can update own completions" on habit_completions for update using (auth.uid() = user_id);
create policy "Users can delete own completions" on habit_completions for delete using (auth.uid() = user_id);

-- Parking lot: full CRUD
create policy "Users can view own captures" on parking_lot for select using (auth.uid() = user_id);
create policy "Users can create own captures" on parking_lot for insert with check (auth.uid() = user_id);
create policy "Users can update own captures" on parking_lot for update using (auth.uid() = user_id);
create policy "Users can delete own captures" on parking_lot for delete using (auth.uid() = user_id);

-- Body double rooms: anyone can view active, owners can manage
create policy "Anyone can view active rooms" on body_double_rooms for select using (is_active = true);
create policy "Users can create rooms" on body_double_rooms for insert with check (auth.uid() = host_id);
create policy "Hosts can update own rooms" on body_double_rooms for update using (auth.uid() = host_id);
create policy "Hosts can delete own rooms" on body_double_rooms for delete using (auth.uid() = host_id);

-- Room participants: users can view room members, manage own participation
create policy "Users can view participants" on room_participants for select using (true);
create policy "Users can join rooms" on room_participants for insert with check (auth.uid() = user_id);
create policy "Users can update own participation" on room_participants for update using (auth.uid() = user_id);
create policy "Users can leave rooms" on room_participants for delete using (auth.uid() = user_id);

-- Dopamine menu: full CRUD
create policy "Users can view own menu" on dopamine_menu for select using (auth.uid() = user_id);
create policy "Users can create menu items" on dopamine_menu for insert with check (auth.uid() = user_id);
create policy "Users can update menu items" on dopamine_menu for update using (auth.uid() = user_id);
create policy "Users can delete menu items" on dopamine_menu for delete using (auth.uid() = user_id);

-- Check-ins: full CRUD
create policy "Users can view own checkins" on check_ins for select using (auth.uid() = user_id);
create policy "Users can create checkins" on check_ins for insert with check (auth.uid() = user_id);
create policy "Users can update own checkins" on check_ins for update using (auth.uid() = user_id);
create policy "Users can delete own checkins" on check_ins for delete using (auth.uid() = user_id);

-- Achievements: anyone can read (they're global definitions)
create policy "Anyone can view achievements" on achievements for select using (true);

-- User achievements: users can read their own
create policy "Users can view own achievements" on user_achievements for select using (auth.uid() = user_id);
create policy "Users can unlock achievements" on user_achievements for insert with check (auth.uid() = user_id);

-- 17. UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();
create trigger tasks_updated_at before update on tasks for each row execute function update_updated_at();
create trigger daily_plans_updated_at before update on daily_plans for each row execute function update_updated_at();
