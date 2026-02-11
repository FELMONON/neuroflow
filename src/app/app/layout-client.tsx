'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { QuickCaptureModal } from '@/components/features/capture/QuickCaptureModal';
import { useProfileStore } from '@/stores/useProfileStore';
import { useHydrateStores } from '@/hooks/useHydrateStores';
import type { Profile } from '@/types/database';

interface AppLayoutClientProps {
  children: React.ReactNode;
  serverProfile: Profile | null;
}

export function AppLayoutClient({ children, serverProfile }: AppLayoutClientProps) {
  const setProfile = useProfileStore((s) => s.setProfile);

  useEffect(() => {
    setProfile(serverProfile);
  }, [serverProfile, setProfile]);

  // Hydrate all stores from Supabase (or seed data) on mount
  useHydrateStores();

  return (
    <AppShell>
      {children}
      <QuickCaptureModal />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: 'var(--accent-grow)', secondary: 'var(--bg-secondary)' },
          },
          error: {
            iconTheme: { primary: 'var(--accent-spark)', secondary: 'var(--bg-secondary)' },
          },
        }}
      />
    </AppShell>
  );
}
