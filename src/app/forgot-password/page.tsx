'use client';

import { useState } from 'react';
import { Brain, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const emailError =
    emailTouched && email.length > 0 && !validateEmail(email)
      ? 'Please enter a valid email address'
      : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setEmailTouched(true);
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-bg-primary landing-noise flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-bg-secondary rounded-2xl border border-white/[0.06] p-8 shadow-lg shadow-black/20">
            <div className="w-12 h-12 rounded-xl bg-accent-flow/10 flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-accent-flow" />
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Check your email</h1>
            <p className="text-sm text-text-secondary mb-6">
              If an account exists for <span className="text-text-primary font-medium">{email}</span>,
              we sent a password reset link. It expires in 24 hours.
            </p>
            <Link
              href="/login"
              className="text-sm text-accent-flow hover:underline transition-all duration-200"
            >
              Back to login
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
          <Link
            href="/login"
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors mb-4"
          >
            <ArrowLeft size={12} />
            Back to login
          </Link>

          <h1 className="text-xl font-semibold text-text-primary mb-1">Reset password</h1>
          <p className="text-sm text-text-muted mb-5">
            Enter your email and we&apos;ll send a reset link.
          </p>

          {error && (
            <div role="alert" className="mb-4 p-3 rounded-lg bg-accent-spark/10 border border-accent-spark/20">
              <p className="text-sm text-accent-spark">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
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

            <Button type="submit" loading={loading} className="w-full">
              Send reset link
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
