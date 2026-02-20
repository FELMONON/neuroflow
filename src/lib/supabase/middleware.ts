import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // Enforce a single canonical host in production to avoid PKCE verifier loss
  // when auth starts on one domain and returns on another.
  if (process.env.VERCEL_ENV === 'production' && process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      const canonical = new URL(process.env.NEXT_PUBLIC_SITE_URL.trim());
      if (request.nextUrl.host !== canonical.host) {
        const url = request.nextUrl.clone();
        url.protocol = canonical.protocol;
        url.host = canonical.host;
        return NextResponse.redirect(url);
      }
    } catch {
      // Ignore malformed site URL here; auth route validation handles strict checks.
    }
  }

  const { pathname, searchParams } = request.nextUrl;

  // If OAuth params land on "/", forward to callback route before rendering landing page.
  if (pathname === '/' && (searchParams.get('code') || searchParams.get('token_hash'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /reset-password requires a valid recovery session — allow if user is present
  // (user gets set from the recovery token exchanged at /auth/callback).
  // If no session, redirect to login instead of showing a broken form.
  if (pathname === '/reset-password' && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Protect /app/* and /onboarding routes — redirect to login if no session
  if ((pathname.startsWith('/app') || pathname === '/onboarding') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login/signup (but NOT from /reset-password)
  if ((pathname === '/login' || pathname === '/signup') && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/app/today';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from landing into app.
  if (pathname === '/' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/app/today';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
