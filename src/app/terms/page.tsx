import Link from 'next/link';
import { Brain, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — NeuroFlow',
  description: 'Terms of service for using NeuroFlow.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent-flow/[0.08] border border-accent-flow/[0.12] flex items-center justify-center">
              <Brain size={16} className="text-accent-flow/80" />
            </div>
            <span
              className="text-lg font-bold text-text-primary tracking-tight"
              style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
            >
              NeuroFlow
            </span>
          </div>

          <h1
            className="text-3xl font-bold text-text-primary tracking-[-0.03em] mb-2"
            style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
          >
            Terms of Service
          </h1>
          <p className="text-sm text-text-muted">Last updated: February 2026</p>
        </div>

        <div className="space-y-8 text-[15px] text-text-secondary/80 leading-[1.8]">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Welcome to NeuroFlow</h2>
            <p>
              By using NeuroFlow, you agree to these terms. We&apos;ve kept them as straightforward
              as possible because we know reading legal text is especially painful for the ADHD
              brain.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">The service</h2>
            <p>
              NeuroFlow provides ADHD-focused productivity tools including task management, focus
              timers, habit tracking, and AI-powered coaching. We offer both free and paid plans.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Your account</h2>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>You must provide accurate account information</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 13 years old to use NeuroFlow</li>
              <li>One person per account (no sharing credentials)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Your content</h2>
            <p>
              You own all the content you create in NeuroFlow (tasks, reflections, habit data, etc.).
              We only use it to provide the service to you. You can export or delete your data at
              any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Acceptable use</h2>
            <p>
              Use NeuroFlow for its intended purpose: personal productivity. Don&apos;t use it to
              violate laws, harass others, or attempt to compromise the service&apos;s security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Paid plans</h2>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>Pro plans are billed monthly or as a lifetime purchase</li>
              <li>You can cancel your subscription at any time</li>
              <li>Refunds are available within 14 days of purchase</li>
              <li>We will notify you before any price changes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Availability</h2>
            <p>
              We aim for high uptime but cannot guarantee 100% availability. We will notify users
              in advance of planned maintenance whenever possible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Changes to terms</h2>
            <p>
              We may update these terms occasionally. Significant changes will be communicated via
              email. Continued use of NeuroFlow after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Contact</h2>
            <p>
              Questions about these terms? Reach out at{' '}
              <a href="mailto:hello@neuroflow.app" className="text-accent-flow hover:underline">
                hello@neuroflow.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
