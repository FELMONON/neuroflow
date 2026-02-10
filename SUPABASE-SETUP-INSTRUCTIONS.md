# NeuroFlow Supabase Setup — Handoff Instructions

## Project Info

- **Supabase Project URL:** `https://stgtzqpugodeyjhiwpam.supabase.co`
- **Supabase Dashboard:** https://supabase.com/dashboard/project/stgtzqpugodeyjhiwpam
- **App:** Next.js 16 app at `http://localhost:3000`

---

## What Needs To Be Done

There are 3 tasks. Do them in order.

---

### TASK 1: Run the Database Schema

The current database has the WRONG tables (meditation tables). We need the NeuroFlow tables.

1. Go to **Supabase Dashboard > SQL Editor** (left sidebar)
2. Click **"New Query"**
3. **First**, run this to drop the wrong tables (if they exist):

```sql
-- Drop meditation tables that were created by mistake
drop table if exists user_statistics cascade;
drop table if exists daily_reflections cascade;
drop table if exists guided_meditations cascade;
drop table if exists meditation_reviews cascade;
drop table if exists meditation_favorites cascade;
drop table if exists meditation_streak cascade;
drop table if exists meditation_goals cascade;
drop table if exists user_achievements cascade;
drop table if exists achievements cascade;
drop table if exists meditation_sessions cascade;
drop table if exists meditations cascade;
drop table if exists profiles cascade;
drop type if exists meditation_difficulty cascade;
drop type if exists achievement_type cascade;
drop type if exists meditation_type cascade;
drop function if exists public.handle_new_user() cascade;
```

4. Click **"Run"**
5. Then create a **new query** and paste the ENTIRE contents of the file `supabase-setup.sql` (located in the project root: `neuroflow/supabase-setup.sql`)
6. Click **"Run"**

This creates:
- 10 enums
- 13 tables (profiles, tasks, focus_sessions, daily_plans, habits, habit_completions, parking_lot, body_double_rooms, room_participants, dopamine_menu, check_ins, achievements, user_achievements)
- Row Level Security on all tables
- Auto-profile creation trigger (creates a profile row when a user signs up)
- 15 seed achievement records
- Performance indexes
- updated_at triggers

---

### TASK 2: Get the API Keys and Update .env.local

1. Go to **Supabase Dashboard > Settings > API** (left sidebar > gear icon > API)
2. You'll see:
   - **Project URL** — already set, it's `https://stgtzqpugodeyjhiwpam.supabase.co`
   - **anon / public** key — copy this
   - **service_role** key — click "Reveal" and copy this

3. Open the file `neuroflow/.env.local` and replace the placeholder values:

```
NEXT_PUBLIC_SUPABASE_URL=https://stgtzqpugodeyjhiwpam.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste the anon key here>
SUPABASE_SERVICE_ROLE_KEY=<paste the service_role key here>
ANTHROPIC_API_KEY=sk-ant-placeholder
```

---

### TASK 3: Verify Auth Settings

These should already be configured, but double-check:

#### 3a. Email Auth
1. Go to **Authentication > Providers** (left sidebar)
2. **Email** provider should be **enabled**
3. Go to **Authentication > Settings**
4. "Enable email confirmations" should be **ON**

#### 3b. Google OAuth
1. Go to **Authentication > Providers > Google**
2. Should be **enabled** with Client ID and Client Secret filled in
3. If NOT configured, you need Google OAuth credentials:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Authorized redirect URI: `https://stgtzqpugodeyjhiwpam.supabase.co/auth/v1/callback`
   - Paste Client ID + Client Secret into Supabase Google provider settings

#### 3c. URL Configuration
1. Go to **Authentication > URL Configuration**
2. **Site URL:** `http://localhost:3000`
3. **Redirect URLs** — must include:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`

---

## How To Verify It Works

After completing all 3 tasks:

```bash
cd neuroflow
npm run dev
```

Then test:
1. Visit `http://localhost:3000/login` — should show login form
2. Visit `http://localhost:3000/signup` — should show signup form
3. Try signing up with an email/password — should show "Check your email" message
4. Visit `http://localhost:3000/app/today` — should redirect to `/login` (not logged in)

---

## Database Schema Summary

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, auto-created on signup. Stores name, ADHD subtype, energy patterns, XP, level, streaks |
| `tasks` | Task management with status, priority, energy level, estimated time, AI subtasks |
| `focus_sessions` | Pomodoro-style focus tracking with quality rating, distractions count |
| `daily_plans` | Daily planning with time blocks, intentions, reflections, mood tracking |
| `habits` | Habit definitions with frequency, routine type, streaks |
| `habit_completions` | Daily habit completion records |
| `parking_lot` | Quick-capture items during focus sessions |
| `body_double_rooms` | Virtual co-working rooms for accountability |
| `room_participants` | Users currently in a body double room |
| `dopamine_menu` | Personal list of rewarding activities by category |
| `check_ins` | Mood, energy, and focus check-ins with emotions |
| `achievements` | Achievement definitions (seeded with 15 achievements) |
| `user_achievements` | Tracks which achievements each user has unlocked |
