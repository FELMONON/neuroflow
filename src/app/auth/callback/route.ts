import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeRedirectPath(searchParams.get('next'), origin);

  if (code) {
    const response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.headers.get('cookie')
              ?.split('; ')
              .filter(Boolean)
              .map((c) => {
                const idx = c.indexOf('=');
                if (idx === -1) return { name: c, value: '' };
                return { name: c.slice(0, idx), value: c.slice(idx + 1) };
              }) ?? [];
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Use NEXT_PUBLIC_SITE_URL env var to avoid host header injection.
      // Falls back to request origin (derived from Host header, not x-forwarded-host).
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
      const redirectUrl = `${siteUrl}${next}`;

      const redirect = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie.name, cookie.value);
      });
      return redirect;
    }

    console.error('[auth/callback] Code exchange failed:', error.message);
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
