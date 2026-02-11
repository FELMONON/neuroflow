import Link from 'next/link';
import { Brain, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — NeuroFlow',
  description: 'How NeuroFlow handles your data. Your privacy matters to us.',
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-text-muted">Last updated: February 2026</p>
        </div>

        <div className="space-y-8 text-[15px] text-text-secondary/80 leading-[1.8]">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Your data, your brain</h2>
            <p>
              NeuroFlow is built for people with ADHD, by people with ADHD. We understand that trust
              is everything. Your productivity data, habits, and personal reflections are yours. We
              will never sell your data or use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">What we collect</h2>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>Account information (email, name) to provide the service</li>
              <li>Task, habit, and focus session data to power your productivity tools</li>
              <li>Usage analytics (anonymized) to improve the product</li>
              <li>Energy and mood check-in data to personalize your experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">How we use it</h2>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>To provide and improve NeuroFlow&apos;s features</li>
              <li>To generate AI-powered task breakdowns and coaching (processed securely)</li>
              <li>To send account-related emails (confirmations, password resets)</li>
              <li>To detect and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">What we never do</h2>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>Sell your personal data to third parties</li>
              <li>Use your data for targeted advertising</li>
              <li>Share your health or productivity data without your consent</li>
              <li>Train AI models on your personal data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Data storage and security</h2>
            <p>
              Your data is stored securely on Supabase infrastructure with encryption at rest and
              in transit. We follow industry-standard security practices to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Your rights</h2>
            <p>
              You can export or delete your data at any time from your account settings. If you
              delete your account, all associated data is permanently removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Contact</h2>
            <p>
              Questions about your privacy? Reach out at{' '}
              <a href="mailto:privacy@neuroflow.app" className="text-accent-flow hover:underline">
                privacy@neuroflow.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
