'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ActiveSession } from '@/components/features/focus/ActiveSession';
import { useSessionStore } from '@/stores/useSessionStore';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const rawSessionId = params.sessionId;
  const sessionId = typeof rawSessionId === 'string' ? rawSessionId : Array.isArray(rawSessionId) ? rawSessionId[0] : '';
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-32 h-32 rounded-full bg-white/[0.04] animate-pulse" />
          <div className="w-48 h-4 rounded bg-white/[0.04] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <ActiveSession onComplete={() => router.push('/app/focus')} />
    </div>
  );
}
