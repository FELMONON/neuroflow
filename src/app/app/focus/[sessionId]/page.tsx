'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ActiveSession } from '@/components/features/focus/ActiveSession';
import { useSessionStore } from '@/stores/useSessionStore';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { currentSession, status } = useSessionStore();

  useEffect(() => {
    if (!currentSession || currentSession.id !== sessionId) {
      if (status !== 'running' && status !== 'paused') {
        router.replace('/app/focus');
      }
    }
  }, [currentSession, sessionId, status, router]);

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <ActiveSession onComplete={() => router.push('/app/focus')} />
    </div>
  );
}
