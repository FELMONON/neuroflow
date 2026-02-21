'use client';

import { useState, Suspense, useEffect } from 'react';
import { Brain, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAuthErrorMessage(authError: string | null): string {
  if (authError === 'pkce') {
    return 'Sign-in expired due to an auth redirect mismatch. Retry from this same URL.';
  }
  if (authError) {
    return 'Something went sideways. Try again?';
  }
  return '';
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic-link'>('password');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setAuthError(searchParams.get('error'));
  }, [searchParams]);

  const authErrorMessage = getAuthErrorMessage(authError);

  const supabase = createClient();

  const emailError = emailTouched && email.length > 0 && !validateEmail(email)
    ? 'Please enter a valid email address'
    : undefined;

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setEmailTouched(true);
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Invalid email or password.');
      } else {
        window.location.href = '/app/today';
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setEmailTouched(true);
      setError('Please enter a valid email address.');
      return;
    }

    setMagicLinkLoading(true);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
      } else {
        setMagicLinkSent(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setMagicLinkLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setGoogleLoading(true);
    const redirectTo = new URL('/auth/callback?next=/app/today', window.location.origin).toString();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      setGoogleLoading(false);
      setError(error.message);
    }
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-bg-primary landing-noise flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-bg-secondary rounded-2xl border border-white/[0.06] p-8 shadow-lg shadow-black/20">
            <div className="w-12 h-12 rounded-xl bg-accent-flow/10 flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-accent-flow" />
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Check your email</h1>
            <p className="text-sm text-text-secondary mb-6">
              We sent a magic link to <span className="text-text-primary font-medium">{email}</span>. Click the link to sign in.
            </p>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="text-sm text-accent-flow hover:underline cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary landing-noise flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2 group">
            <Brain size={24} className="text-accent-flow" />
            <span className="text-xl font-semibold text-text-primary">NeuroFlow</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-bg-secondary rounded-2xl border border-white/[0.06] p-6 shadow-lg shadow-black/20">
          <h1 className="text-xl font-semibold text-text-primary mb-1">Welcome back</h1>
          <p className="text-sm text-text-muted mb-5">Sign in to your account</p>

          {/* Google OAuth — fastest path */}
          <Button
            type="button"
            variant="secondary"
            loading={googleLoading}
            onClick={handleGoogleLogin}
            className="w-full"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.78 1.28 5.41l3.56-2.77.01-.55z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            }
          >
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {(error || authErrorMessage) && (
            <div role="alert" className="mb-4 p-3 rounded-lg bg-accent-spark/10 border border-accent-spark/20">
              <p className="text-sm text-accent-spark">
                {error || authErrorMessage}
              </p>
            </div>
          )}

          {/* Auth method tabs */}
          <div className="flex rounded-lg bg-white/[0.04] p-0.5 mb-4">
            <button
              type="button"
              onClick={() => { setMode('magic-link'); setError(''); }}
              className={`flex-1 text-xs font-medium py-2 rounded-md transition-all duration-200 cursor-pointer ${mode === 'magic-link'
                ? 'bg-bg-tertiary text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
                }`}
            >
              Magic link
            </button>
            <button
              type="button"
              onClick={() => { setMode('password'); setError(''); }}
              className={`flex-1 text-xs font-medium py-2 rounded-md transition-all duration-200 cursor-pointer ${mode === 'password'
                ? 'bg-bg-tertiary text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
                }`}
            >
              Password
            </button>
          </div>

          {mode === 'magic-link' ? (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <Input
                type="email"
                label="Email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                error={emailError}
                iconLeft={<Mail size={16} />}
                autoComplete="email"
              />

              <Button type="submit" loading={magicLinkLoading} className="w-full">
                Send magic link
              </Button>
              <p className="text-xs text-text-muted text-center">
                No password needed — we&apos;ll email you a sign-in link.
              </p>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-3">
              <Input
                type="email"
                label="Email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                error={emailError}
                iconLeft={<Mail size={16} />}
                autoComplete="email"
              />
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                iconLeft={<Lock size={16} />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="pointer-events-auto cursor-pointer text-text-muted hover:text-text-secondary transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:outline-none rounded"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                autoComplete="current-password"
              />

              <Button type="submit" loading={loading} className="w-full">
                Sign in
              </Button>
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-xs text-text-muted hover:text-accent-flow transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-sm text-text-muted mt-4 text-center">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent-flow hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
