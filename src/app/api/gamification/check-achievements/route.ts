import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ACHIEVEMENTS, type AchievementDefinition } from '@/lib/achievements';
import { checkRateLimit } from '@/lib/rate-limit';

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

interface AchievementCheckContext {
  userId: string;
  supabase: SupabaseClient;
}

type AchievementChecker = (
  ctx: AchievementCheckContext
) => Promise<boolean>;

const achievementCheckers: Record<string, AchievementChecker> = {
  first_focus: async ({ userId, supabase }) => {
    const { count } = await supabase
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('ended_at', 'is', null);
    return (count ?? 0) >= 1;
  },

  brain_dump: async ({ userId, supabase }) => {
    // Single query: group parking lot items by session and check if any session has 10+
    const { data } = await supabase
      .from('parking_lot')
      .select('captured_during_session_id')
      .eq('user_id', userId)
      .not('captured_during_session_id', 'is', null);

    if (!data || data.length === 0) return false;

    const countBySession = new Map<string, number>();
    for (const item of data) {
      const sid = item.captured_during_session_id;
      if (sid) countBySession.set(sid, (countBySession.get(sid) ?? 0) + 1);
    }
    return [...countBySession.values()].some((count) => count >= 10);
  },

  early_bird: async ({ userId, supabase }) => {
    const { data } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'done')
      .not('completed_at', 'is', null);

    if (!data) return false;
    return data.some((task) => {
      if (!task.completed_at) return false;
      const hour = new Date(task.completed_at).getHours();
      return hour < 8;
    });
  },

  night_owl: async ({ userId, supabase }) => {
    const { data } = await supabase
      .from('focus_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .not('ended_at', 'is', null);

    if (!data) return false;
    return data.some((session) => {
      const hour = new Date(session.started_at).getHours();
      return hour >= 22;
    });
  },

  comeback_kid: async ({ userId, supabase }) => {
    const { data } = await supabase
      .from('check_ins')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!data || data.length < 2) return false;

    for (let i = 1; i < data.length; i++) {
      const prev = new Date(data[i - 1].created_at).getTime();
      const curr = new Date(data[i].created_at).getTime();
      const daysDiff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (daysDiff >= 7) return true;
    }
    return false;
  },

  flow_state: async ({ userId, supabase }) => {
    const { count } = await supabase
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('focus_quality', 5);
    return (count ?? 0) >= 1;
  },

  body_buddy: async ({ userId, supabase }) => {
    const { count } = await supabase
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('session_type', 'body_double')
      .not('ended_at', 'is', null);
    return (count ?? 0) >= 10;
  },

  inbox_hero: async ({ userId, supabase }) => {
    const { count: total } = await supabase
      .from('parking_lot')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!total || total === 0) return false;

    const { count: unprocessed } = await supabase
      .from('parking_lot')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('processed', false);

    return (unprocessed ?? 0) === 0;
  },

  habit_master: async ({ userId, supabase }) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_current')
      .eq('id', userId)
      .single();
    return (profile?.streak_current ?? 0) >= 30;
  },

  time_detective: async ({ userId, supabase }) => {
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('actual_minutes', 'is', null);
    return (count ?? 0) >= 20;
  },

  feeling_it: async ({ userId, supabase }) => {
    const { count } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count ?? 0) >= 30;
  },

  task_crusher: async ({ userId, supabase }) => {
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'done');
    return (count ?? 0) >= 100;
  },

  week_warrior: async ({ userId, supabase }) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_current, streak_best')
      .eq('id', userId)
      .single();
    const best = Math.max(profile?.streak_current ?? 0, profile?.streak_best ?? 0);
    return best >= 7;
  },

  month_master: async ({ userId, supabase }) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_current, streak_best')
      .eq('id', userId)
      .single();
    const best = Math.max(profile?.streak_current ?? 0, profile?.streak_best ?? 0);
    return best >= 30;
  },

  centurion: async ({ userId, supabase }) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('level')
      .eq('id', userId)
      .single();
    return (profile?.level ?? 0) >= 10;
  },
};

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Rate limit: 10 checks per minute per user
    const rl = checkRateLimit(`check-achievements:${user.id}`, { max: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const userId = user.id;

    // Get already-unlocked achievements for this user
    const { data: existingUnlocks } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    // Get achievement rows from the achievements table to map slug -> id
    const { data: achievementRows } = await supabase
      .from('achievements')
      .select('id, slug');

    const slugToId: Record<string, string> = {};
    const idToSlug: Record<string, string> = {};
    if (achievementRows) {
      for (const row of achievementRows) {
        slugToId[row.slug] = row.id;
        idToSlug[row.id] = row.slug;
      }
    }

    const unlockedIds = new Set(
      (existingUnlocks ?? []).map((u) => u.achievement_id)
    );
    const unlockedSlugs = new Set(
      [...unlockedIds].map((id) => idToSlug[id]).filter(Boolean)
    );

    const ctx: AchievementCheckContext = { userId, supabase };
    const newlyUnlocked: (AchievementDefinition & { id?: string })[] = [];

    // Check all unchecked achievements in parallel
    const uncheckedSlugs = Object.entries(achievementCheckers)
      .filter(([slug]) => !unlockedSlugs.has(slug) && ACHIEVEMENTS[slug] && slugToId[slug]);

    const checkResults = await Promise.all(
      uncheckedSlugs.map(async ([slug, checker]) => {
        const achieved = await checker(ctx);
        return { slug, achieved };
      })
    );

    // Insert newly achieved ones and accumulate total XP to award
    let totalXpToAward = 0;
    for (const { slug, achieved } of checkResults) {
      if (!achieved) continue;

      const definition = ACHIEVEMENTS[slug];
      const achievementId = slugToId[slug];
      if (!definition || !achievementId) continue;

      const { error: insertError } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
        });

      if (!insertError) {
        newlyUnlocked.push({ ...definition, id: achievementId });
        totalXpToAward += definition.xp_reward;
      }
    }

    // Award all achievement XP in a single atomic update (avoid race condition)
    if (totalXpToAward > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_total')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ xp_total: profile.xp_total + totalXpToAward })
          .eq('id', userId);
      }
    }

    return NextResponse.json({
      newly_unlocked: newlyUnlocked,
      total_unlocked: unlockedIds.size + newlyUnlocked.length,
    });
  } catch (error) {
    console.error('check-achievements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
