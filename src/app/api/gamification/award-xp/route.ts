import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateLevel } from '@/lib/achievements';
import { checkRateLimit } from '@/lib/rate-limit';

type XPAction =
  | 'complete_task'
  | 'complete_focus_session'
  | 'complete_habit'
  | 'daily_checkin'
  | 'body_double'
  | 'inbox_zero'
  | 'complete_daily_plan'
  | 'streak_bonus';

const VALID_ACTIONS: XPAction[] = [
  'complete_task',
  'complete_focus_session',
  'complete_habit',
  'daily_checkin',
  'body_double',
  'inbox_zero',
  'complete_daily_plan',
  'streak_bonus',
];

function calculateXP(
  action: XPAction,
  metadata?: Record<string, unknown>
): number {
  switch (action) {
    case 'complete_task': {
      const priority = (metadata?.priority as string) ?? 'low';
      const xpMap: Record<string, number> = {
        critical: 50,
        high: 30,
        medium: 20,
        low: 10,
      };
      return xpMap[priority] ?? 10;
    }

    case 'complete_focus_session': {
      const duration = (metadata?.duration_minutes as number) ?? 25;
      const quality = (metadata?.quality_rating as number) ?? 3;
      // Cap values to prevent abuse
      const safeDuration = Math.min(Math.max(0, duration), 480);
      const safeQuality = Math.min(Math.max(1, quality), 5);
      return Math.round(safeDuration * safeQuality * 0.5);
    }

    case 'complete_habit':
      return 5;

    case 'daily_checkin':
      return 10;

    case 'body_double':
      return 20;

    case 'inbox_zero':
      return 50;

    case 'complete_daily_plan':
      return 25;

    case 'streak_bonus': {
      const streakDays = (metadata?.streak_days as number) ?? 1;
      const safeStreak = Math.min(Math.max(1, streakDays), 365);
      return safeStreak * 5;
    }

    default:
      return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Rate limit: 30 XP awards per minute per user
    const rl = checkRateLimit(`award-xp:${user.id}`, { max: 30, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { action, metadata } = body as {
      action: string;
      metadata?: Record<string, unknown>;
    };

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(action as XPAction)) {
      return NextResponse.json(
        { error: `Invalid action. Valid actions: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const xpAwarded = calculateXP(action as XPAction, metadata);

    // Use the authenticated user's ID, not a client-provided one
    const userId = user.id;

    const { data: profileData, error: fetchError } = await supabase
      .from('profiles')
      .select('xp_total, level')
      .eq('id', userId)
      .single();

    if (fetchError || !profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const newTotal = profileData.xp_total + xpAwarded;
    const newLevel = calculateLevel(newTotal);
    const levelUp = newLevel > profileData.level;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ xp_total: newTotal, level: newLevel })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update XP:', updateError);
      return NextResponse.json(
        { error: 'Failed to update XP' },
        { status: 500 }
      );
    }

    const response: {
      xp_awarded: number;
      new_total: number;
      level_up?: boolean;
      new_level?: number;
    } = {
      xp_awarded: xpAwarded,
      new_total: newTotal,
    };

    if (levelUp) {
      response.level_up = true;
      response.new_level = newLevel;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('award-xp error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
