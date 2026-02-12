import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { checkRateLimit, AUTH_RATE_LIMITS } from '@/lib/rate-limit';
import { getSiteUrlOrThrow } from '@/lib/site-url';

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const ip = getClientIP(request);

    // Rate limit by both IP and email
    const ipLimit = await checkRateLimit(`magic-link-ip:${ip}`, AUTH_RATE_LIMITS.magicLink);
    const emailLimit = await checkRateLimit(`magic-link-email:${email.toLowerCase()}`, AUTH_RATE_LIMITS.magicLink);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil(Math.max(ipLimit.retryAfterMs, emailLimit.retryAfterMs) / 1000),
            ),
          },
        },
      );
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
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
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

    let siteUrl: string;
    try {
      siteUrl = getSiteUrlOrThrow();
    } catch (error) {
      console.error('[magic-link] Invalid NEXT_PUBLIC_SITE_URL:', error);
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });

    if (error) {
      // Always return success to prevent email enumeration
      console.error('[magic-link] OTP error:', error.message);
    }

    // Always return success — don't reveal whether email exists
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
