'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Target,
  Inbox,
  Timer,
  Repeat,
  MoreHorizontal,
  Calendar,
  Users,
  Sparkles,
  Heart,
  Trophy,
  Settings,
  X,
  Plus,
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// Bottom bar: Today, Tasks, Capture (action), Focus, More
const primaryItems: NavItem[] = [
  { label: 'Today', href: '/app/today', icon: Target },
  { label: 'Tasks', href: '/app/tasks', icon: Inbox },
  { label: 'Focus', href: '/app/focus', icon: Timer },
];

const moreItems: NavItem[] = [
  { label: 'Plan', href: '/app/plan', icon: Calendar },
  { label: 'Habits', href: '/app/habits', icon: Repeat },
  { label: 'Co-work', href: '/app/body-double', icon: Users },
  { label: 'Recharge', href: '/app/dopamine-menu', icon: Sparkles },
  { label: 'Reflect', href: '/app/reflect', icon: Heart },
  { label: 'Achievements', href: '/app/achievements', icon: Trophy },
  { label: 'Settings', href: '/app/settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const toggleQuickCapture = useUIStore((s) => s.toggleQuickCapture);

  const isOnFocusPage = pathname === '/app/focus' || pathname?.startsWith('/app/focus/');
  const isMoreActive = moreItems.some(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/'),
  );

  // Close More popup on Escape
  const handleEscape = useCallback((e: globalThis.KeyboardEvent) => {
    if (e.key === 'Escape' && moreOpen) setMoreOpen(false);
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [moreOpen, handleEscape]);

  return (
    <>
      {/* More popover */}
      {moreOpen && (
        <>
          <div
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fadeIn"
          />
          <div role="dialog" aria-modal="true" aria-label="More navigation" className="fixed bottom-14 left-0 right-0 bg-bg-secondary border-t border-white/[0.06] rounded-t-xl z-50 md:hidden animate-fadeIn">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-text-primary">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="p-1 rounded-lg text-white/[0.4] hover:text-white/[0.7] hover:bg-white/[0.04] cursor-pointer transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 px-3 pb-4">
              {moreItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex flex-col items-center gap-1 rounded-lg py-3 px-2 text-[11px] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none ${
                      isActive
                        ? 'text-accent-flow bg-accent-flow/10'
                        : 'text-white/[0.5] hover:text-white/[0.8] hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom tab bar */}
      <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 md:hidden h-14 bg-bg-secondary border-t border-white/[0.06] z-30 pb-safe">
        <div className="flex items-center justify-around h-full px-2">
          {primaryItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 flex-1 py-1 focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none rounded-lg transition-all duration-200 ${
                  isActive ? 'text-accent-flow bg-accent-flow/10' : 'text-white/[0.4] hover:text-white/[0.7]'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}

          {/* Quick Capture — hidden during Focus to reduce distraction */}
          {!isOnFocusPage && (
            <button
              onClick={toggleQuickCapture}
              className="flex flex-col items-center gap-0.5 flex-1 py-1 cursor-pointer rounded-lg text-accent-flow focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-6 h-6 rounded-full bg-accent-flow/20 flex items-center justify-center">
                <Plus size={14} />
              </div>
              <span className="text-[10px]">Capture</span>
            </button>
          )}

          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-0.5 flex-1 py-1 cursor-pointer rounded-lg focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none transition-all duration-200 active:scale-[0.98] ${
              isMoreActive ? 'text-accent-flow bg-accent-flow/10' : 'text-white/[0.4] hover:text-white/[0.7]'
            }`}
          >
            <MoreHorizontal size={18} />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
