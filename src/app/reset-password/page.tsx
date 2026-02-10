'use client';

import { useState, useMemo } from 'react';
import { Brain, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const passwordStrength = useMemo(
    () => (password.length > 0 ? getPasswordStrength(password) : null),
    [password],
  );

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary landing-noise flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-bg-secondary rounded-2xl border border-white/[0.06] p-8 shadow-lg shadow-black/20">
            <div className="w-12 h-12 rounded-xl bg-accent-grow/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} className="text-accent-grow" />
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Password updated</h1>
            <p className="text-sm text-text-secondary mb-6">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <Link
              href="/app/today"
              className="text-sm text-accent-flow hover:underline transition-all duration-200"
            >
              Go to app
            </Link>
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
          <h1 className="text-xl font-semibold text-text-primary mb-1">Set new password</h1>
          <p className="text-sm text-text-muted mb-5">Choose a strong password for your account.</p>

          {error && (
            <div role="alert" className="mb-4 p-3 rounded-lg bg-accent-spark/10 border border-accent-spark/20">
              <p className="text-sm text-accent-spark">{error}</p>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-3">
            <div>
              <Input
                type={showPassword ? 'text' : 'password'}
                label="New password"
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

            <Input
              type={showPassword ? 'text' : 'password'}
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              iconLeft={<Lock size={16} />}
              autoComplete="new-password"
              error={
                confirmPassword.length > 0 && password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
            />

            <Button type="submit" loading={loading} className="w-full">
              Reset password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
