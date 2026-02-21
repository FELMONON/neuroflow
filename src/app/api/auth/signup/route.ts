import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { checkRateLimit, AUTH_RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    const rl = await checkRateLimit(`signup:${ip}`, AUTH_RATE_LIMITS.signup);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
        },
      );
    }

    const body = await request.json();
    const { email, password, name } = body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 },
      );
    }
    if (password.length > 128) {
      return NextResponse.json({ error: 'Password is too long.' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    const supabase = createSSRServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name: n, value, options }) => {
              response.cookies.set(n, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
              });
            });
          },
        },
      },
    );

    const siteUrl = request.nextUrl.origin;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: name ? { display_name: name.trim() } : undefined,
        emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      // Generic message to prevent email enumeration
      // Supabase returns "User already registered" which leaks info
      if (error.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'Unable to create account. Please try again.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
