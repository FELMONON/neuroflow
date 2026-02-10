'use client';

import { useEffect, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { useUIStore } from '@/stores/useUIStore';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const toggleQuickCapture = useUIStore((s) => s.toggleQuickCapture);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleQuickCapture();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleQuickCapture]);

  return (
    <div className="flex h-dvh bg-bg-primary overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-accent-flow focus:text-white focus:rounded-lg focus:text-sm">
        Skip to content
      </a>
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main id="main-content" className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>

      <MobileNav />
    </div>
  );
}
