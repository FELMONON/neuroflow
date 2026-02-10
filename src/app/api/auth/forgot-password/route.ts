import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { checkRateLimit, AUTH_RATE_LIMITS } from '@/lib/rate-limit';

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

    const ipLimit = checkRateLimit(`reset-ip:${ip}`, AUTH_RATE_LIMITS.passwordReset);
    const emailLimit = checkRateLimit(`reset-email:${email.toLowerCase()}`, AUTH_RATE_LIMITS.passwordReset);

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

    const supabase = createSSRServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No cookies needed for password reset request
          },
        },
      },
    );

    // Use env-based site URL to prevent open redirect via spoofed Origin header
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    });

    if (error) {
      // Always return success to prevent email enumeration
      console.error('[forgot-password] Reset error:', error.message);
    }

    // Always return success — don't reveal whether email exists
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
