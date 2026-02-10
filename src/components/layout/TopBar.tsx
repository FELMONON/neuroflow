'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Target,
  Inbox,
  Timer,
  Calendar,
  Repeat,
  Users,
  Sparkles,
  Heart,
  Trophy,
  Settings,
  LogOut,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { createClient } from '@/lib/supabase/client';

const dropdownVariants = {
  initial: { opacity: 0, scale: 0.95, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -4 },
};
const dropdownTransition = { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as const };

const PAGE_META: Record<string, { title: string; icon: LucideIcon }> = {
  '/app/today': { title: 'Today', icon: Target },
  '/app/tasks': { title: 'Tasks', icon: Inbox },
  '/app/focus': { title: 'Focus', icon: Timer },
  '/app/plan': { title: 'Plan', icon: Calendar },
  '/app/habits': { title: 'Habits', icon: Repeat },
  '/app/body-double': { title: 'Co-work', icon: Users },
  '/app/dopamine-menu': { title: 'Recharge', icon: Sparkles },
  '/app/reflect': { title: 'Reflect', icon: Heart },
  '/app/achievements': { title: 'Achievements', icon: Trophy },
  '/app/settings': { title: 'Settings', icon: Settings },
};

function getPageMeta(pathname: string): { title: string; icon: LucideIcon | null } {
  if (PAGE_META[pathname]) return { ...PAGE_META[pathname] };
  for (const [path, meta] of Object.entries(PAGE_META)) {
    if (pathname.startsWith(path)) return { ...meta };
  }
  return { title: 'NeuroFlow', icon: null };
}

export function TopBar() {
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  const profile = useProfileStore((s) => s.profile);
  const { title, icon: PageIcon } = getPageMeta(pathname);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = profile?.display_name?.charAt(0).toUpperCase() ?? 'U';
  const displayName = profile?.display_name ?? 'User';

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenuOpen(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [menuOpen, handleClickOutside, handleKeyDown]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
      {/* Left: hamburger (mobile) + icon + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          className="md:hidden p-1.5 rounded-lg text-text-secondary hover:bg-white/[0.04] transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
        >
          <Menu size={18} />
        </button>
        {PageIcon && <PageIcon size={16} className="text-text-muted" />}
        <span className="text-sm font-medium text-text-primary">{title}</span>
      </div>

      {/* Right: avatar + dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="User menu"
          aria-expanded={menuOpen}
          className="w-8 h-8 rounded-full bg-accent-flow/15 flex items-center justify-center cursor-pointer hover:bg-accent-flow/25 transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
        >
          <span className="text-xs font-medium text-accent-flow select-none">{initial}</span>
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              role="menu"
              className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.10] bg-bg-tertiary shadow-2xl shadow-black/40 py-1.5 z-50 origin-top-right"
              variants={dropdownVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={dropdownTransition}
            >
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-white/[0.06]">
                <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
                {profile && (
                  <p className="text-xs text-text-muted mt-0.5">
                    Level {profile.level} &middot; {profile.xp_total.toLocaleString()} XP
                  </p>
                )}
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/app/settings"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:outline-none rounded-lg"
                >
                  <User size={15} className="shrink-0" />
                  Profile & Settings
                </Link>
              </div>

              <div className="border-t border-white/[0.06] py-1">
                <button
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-accent-spark/80 hover:text-accent-spark hover:bg-white/[0.04] transition-all duration-200 active:scale-[0.98] w-full text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:outline-none rounded-lg"
                >
                  <LogOut size={15} className="shrink-0" />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
