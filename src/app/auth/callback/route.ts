import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

/**
 * Validate the `next` param to prevent open-redirect attacks.
 * Only allows relative paths on the same origin.
 */
function sanitizeRedirectPath(raw: string | null, origin: string): string {
  const fallback = '/app/today';
  if (!raw) return fallback;

  try {
    // Resolve against origin to catch protocol-relative URLs, encoded slashes, etc.
    const resolved = new URL(raw, origin);
    if (resolved.origin !== origin) return fallback;
    // Only allow paths under /app, /onboarding, or /reset-password
    const allowed = ['/app', '/onboarding', '/reset-password'];
    if (!allowed.some((prefix) => resolved.pathname.startsWith(prefix))) {
      return fallback;
    }
    return resolved.pathname + resolved.search;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const siteUrl = request.nextUrl.origin;
  const next = sanitizeRedirectPath(searchParams.get('next'), siteUrl);

  if (code) {
    // Collect cookies set during code exchange so we can forward them on the redirect
    const cookiesToForward: { name: string; value: string; options: CookieOptions }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Also set on the request so subsequent getAll() calls see updated values
              request.cookies.set(name, value);
              cookiesToForward.push({
                name,
                value,
                options: {
                  ...options,
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                },
              });
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const redirectUrl = `${siteUrl}${next}`;
      const redirect = NextResponse.redirect(redirectUrl);

      // Forward all auth cookies with proper security options
      cookiesToForward.forEach(({ name, value, options }) => {
        redirect.cookies.set(name, value, options);
      });
      return redirect;
    }

    if (error.message.toLowerCase().includes('code verifier')) {
      return NextResponse.redirect(`${siteUrl}/login?error=pkce`);
    }

    console.error('[auth/callback] Code exchange failed:', error.message);
    return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent('auth_failed: ' + error.message)}`);
  }

  // Auth code exchange failed — redirect to login with error
  const errDesc = searchParams.get('error_description');
  const errCode = searchParams.get('error');
  if (errDesc || errCode) {
    return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(errDesc || errCode || 'auth')}`);
  }

  return NextResponse.redirect(`${siteUrl}/login?error=no_code_provided`);
}
