import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

const DELETE_CONFIRMATION_TEXT = 'DELETE MY ACCOUNT';
const RECENT_AUTH_WINDOW_MS = 15 * 60 * 1000;

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Rate limit: 3 delete attempts per hour per user
    const ip = getClientIP(request);
    const rl = await checkRateLimit(`delete-account:${user.id}:${ip}`, { max: 3, windowMs: 60 * 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { confirmation } = body as { confirmation?: string };
    if (
      typeof confirmation !== 'string' ||
      confirmation.trim().toUpperCase() !== DELETE_CONFIRMATION_TEXT
    ) {
      return NextResponse.json(
        { error: `Type "${DELETE_CONFIRMATION_TEXT}" to confirm account deletion.` },
        { status: 400 },
      );
    }

    const lastSignIn = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : Number.NaN;
    const isRecentAuth =
      Number.isFinite(lastSignIn) && Date.now() - lastSignIn <= RECENT_AUTH_WINDOW_MS;
    if (!isRecentAuth) {
      return NextResponse.json(
        { error: 'Please sign in again and retry account deletion within 15 minutes.' },
        { status: 403 },
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY for account deletion');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
    );

    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
      console.error('Failed to delete user account:', error.message);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    // Best-effort session cleanup after deletion.
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('delete-account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
