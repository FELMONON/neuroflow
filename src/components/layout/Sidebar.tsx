'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
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
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useTaskStore } from '@/stores/useTaskStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// Core workflow: the natural daily loop
// Today → Tasks → Plan → Focus → Habits
const coreItems: NavItem[] = [
  { label: 'Today', href: '/app/today', icon: Target },
  { label: 'Tasks', href: '/app/tasks', icon: Inbox },
  { label: 'Plan', href: '/app/plan', icon: Calendar },
  { label: 'Focus', href: '/app/focus', icon: Timer },
  { label: 'Habits', href: '/app/habits', icon: Repeat },
];

// Supporting tools: collapsed by default, 3 items only
const toolItems: NavItem[] = [
  { label: 'Co-work', href: '/app/body-double', icon: Users },
  { label: 'Recharge', href: '/app/dopamine-menu', icon: Sparkles },
  { label: 'Reflect', href: '/app/reflect', icon: Heart },
];

function NavLink({ item, isActive, sidebarOpen }: { item: NavItem; isActive: boolean; sidebarOpen: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={`
        group/nav relative flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200
        focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none
        ${sidebarOpen ? '' : 'justify-center'}
        ${
          isActive
            ? 'bg-accent-flow/10 text-accent-flow font-medium shadow-[inset_2px_0_0_0_var(--color-accent-flow)]'
            : 'text-white/[0.5] hover:text-white/[0.8] hover:bg-white/[0.04] rounded-lg'
        }
      `}
    >
      <Icon size={18} className="shrink-0" />
      {sidebarOpen ? (
        <span className="truncate">{item.label}</span>
      ) : (
        <span className="sidebar-tooltip group-hover/nav:opacity-100">{item.label}</span>
      )}
    </Link>
  );
}

/** Tiny progress ring for the Today nav item */
function TodayProgress({ sidebarOpen }: { sidebarOpen: boolean }) {
  const tasks = useTaskStore((s) => s.tasks);
  const todayTasks = tasks.filter((t) => t.status === 'today' || t.status === 'in_progress' || t.status === 'done');
  const done = todayTasks.filter((t) => t.status === 'done').length;
  const total = todayTasks.length;

  if (total === 0) return null;

  const pct = Math.round((done / total) * 100);

  if (!sidebarOpen) {
    // Collapsed: tiny dot indicator (green if all done, purple if in progress)
    return (
      <span
        className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
          pct === 100 ? 'bg-accent-grow' : 'bg-accent-flow'
        }`}
      />
    );
  }

  return (
    <span
      className={`ml-auto text-[10px] font-mono tabular-nums font-medium ${
        pct === 100 ? 'text-accent-grow' : 'text-white/[0.4]'
      }`}
    >
      {done}/{total}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, toggleQuickCapture, focusModeActive } = useUIStore();
  // Tools collapsed by default — only auto-expand when user is on a Tools page
  const isOnToolPage = toolItems.some((item) => pathname === item.href || pathname?.startsWith(item.href + '/'));
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const showTools = toolsExpanded || isOnToolPage;

  const isOnFocusPage = pathname === '/app/focus' || pathname?.startsWith('/app/focus/');
  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/');

  return (
    <aside
      style={{ width: sidebarOpen ? 256 : 64 }}
      className="hidden md:flex flex-col h-screen bg-bg-secondary border-r border-white/[0.06] shrink-0 transition-all duration-200 overflow-hidden"
    >
      {/* Header: Logo + Collapse + Capture */}
      <div className="flex items-center gap-1.5 px-2 h-12 shrink-0">
        {sidebarOpen ? (
          <>
            <button
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              className="p-1.5 rounded-md text-white/[0.3] hover:text-white/[0.6] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:outline-none"
            >
              <PanelLeftClose size={16} />
            </button>
            <span className="text-sm font-semibold text-text-primary whitespace-nowrap flex-1">
              NeuroFlow
            </span>
            {!isOnFocusPage && (
              <button
                onClick={toggleQuickCapture}
                aria-label="Quick capture (⌘K)"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-accent-flow/10 text-accent-flow/70 hover:bg-accent-flow/20 hover:text-accent-flow transition-all duration-200 active:scale-[0.95] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:outline-none"
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 w-full">
            <button
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="p-1.5 rounded-md text-white/[0.3] hover:text-white/[0.6] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:outline-none"
            >
              <PanelLeftOpen size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation — dimmed during focus mode to reduce temptation */}
      <nav aria-label="Main navigation" className={`flex-1 overflow-y-auto py-1 px-2 transition-opacity duration-300${focusModeActive ? ' opacity-40' : ''}`} suppressHydrationWarning>
        {/* Core workflow — always visible, 5 items */}
        <div className="space-y-0.5">
          {coreItems.map((item) => {
            const active = isActive(item.href);
            const isToday = item.href === '/app/today';
            return (
              <div key={item.href} className="relative">
                <NavLink item={item} isActive={active} sidebarOpen={sidebarOpen} />
                {isToday && <TodayProgress sidebarOpen={sidebarOpen} />}
              </div>
            );
          })}
        </div>

        {/* Tools — collapsed by default, only 3 items */}
        <div className="mt-3">
          {sidebarOpen ? (
            <button
              onClick={() => setToolsExpanded(!toolsExpanded)}
              aria-expanded={showTools}
              aria-label="Toggle tools section"
              className="flex items-center gap-1 w-full px-3 mb-1 text-[10px] uppercase tracking-widest text-white/[0.3] hover:text-white/[0.5] transition-colors cursor-pointer rounded-lg focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
            >
              <span>Tools</span>
              <ChevronDown
                size={10}
                className={`transition-transform duration-200 ${showTools ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>
          ) : (
            <div className="my-2 mx-3 border-t border-white/[0.06]" />
          )}

          {(showTools || !sidebarOpen) && (
            <div className="space-y-0.5">
              {toolItems.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} sidebarOpen={sidebarOpen} />
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom: Achievements + Settings (meta/profile items) */}
      <div className="border-t border-white/[0.06] px-2 py-2 space-y-0.5 shrink-0">
        <NavLink item={{ label: 'Achievements', href: '/app/achievements', icon: Trophy }} isActive={isActive('/app/achievements')} sidebarOpen={sidebarOpen} />
        <NavLink item={{ label: 'Settings', href: '/app/settings', icon: Settings }} isActive={isActive('/app/settings')} sidebarOpen={sidebarOpen} />

        {/* Capture shortcut hint — collapsed mode (hidden during Focus to reduce distraction) */}
        {!sidebarOpen && !isOnFocusPage && (
          <button
            onClick={toggleQuickCapture}
            aria-label="Quick capture"
            className="flex items-center justify-center w-8 h-8 mx-auto rounded-lg bg-accent-flow/10 text-accent-flow/70 hover:bg-accent-flow/20 hover:text-accent-flow transition-all duration-200 active:scale-[0.95] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:outline-none"
          >
            <Plus size={15} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </aside>
  );
}
