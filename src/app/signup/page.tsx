'use client';

import { useState, useMemo } from 'react';
import { Brain, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak' };
  if (score <= 2) return { score: 2, label: 'Fair' };
  if (score <= 3) return { score: 3, label: 'Good' };
  return { score: 4, label: 'Strong' };
}

const strengthColors: Record<number, string> = {
  1: 'bg-accent-spark',
  2: 'bg-accent-sun',
  3: 'bg-accent-flow',
  4: 'bg-accent-grow',
};

const strengthTextColors: Record<number, string> = {
  1: 'text-accent-spark',
  2: 'text-accent-sun',
  3: 'text-accent-flow',
  4: 'text-accent-grow',
};

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const emailError = emailTouched && email.length > 0 && !validateEmail(email)
    ? 'Please enter a valid email address'
    : undefined;

  const passwordStrength = useMemo(
    () => password.length > 0 ? getPasswordStrength(password) : null,
    [password],
  );

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError('');
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    if (error) {
      setGoogleLoading(false);
      setError(error.message);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary landing-noise flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-bg-secondary rounded-2xl border border-white/[0.06] p-8 shadow-lg shadow-black/20">
            <div className="w-12 h-12 rounded-xl bg-accent-grow/10 flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-accent-grow" />
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Check your email</h1>
            <p className="text-sm text-text-secondary mb-6">
              We sent a confirmation link to <span className="text-text-primary font-medium">{email}</span>. Click the link to activate your account.
            </p>
            <button
              onClick={() => setSuccess(false)}
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
          <h1 className="text-xl font-semibold text-text-primary mb-1">Create your account</h1>
          <p className="text-sm text-text-muted mb-5">Your external prefrontal cortex is ready.</p>

          {/* Google OAuth — one-click signup, lowest friction */}
          <Button
            type="button"
            variant="secondary"
            loading={googleLoading}
            onClick={handleGoogleSignup}
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
            <span className="text-xs text-text-muted">or sign up with email</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {error && (
            <div role="alert" className="mb-4 p-3 rounded-lg bg-accent-spark/10 border border-accent-spark/20">
              <p className="text-sm text-accent-spark">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3">
            <Input
              type="text"
              label="Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              iconLeft={<User size={16} />}
              autoComplete="name"
            />
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
            <div>
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="At least 8 characters"
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
                autoComplete="new-password"
              />
              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                          level <= passwordStrength.score
                            ? strengthColors[passwordStrength.score]
                            : 'bg-white/[0.06]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 ${strengthTextColors[passwordStrength.score]}`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-sm text-text-muted mt-4 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-flow hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
