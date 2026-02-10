'use client';

import { useState, useEffect } from 'react';
import {
  Lock,
  Zap,
  Brain,
  Sunrise,
  Moon,
  RotateCcw,
  Flame,
  Users,
  Inbox,
  Award,
  Clock,
  Heart,
  CheckCircle,
  Shield,
  Crown,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import type { AchievementDefinition } from '@/lib/achievements';
import type { AchievementCategory } from '@/types/database';
import clsx from 'clsx';

const CATEGORY_COLORS: Record<AchievementCategory, { bg: string; text: string }> = {
  streak: { bg: 'bg-accent-grow/10', text: 'text-accent-grow' },
  focus: { bg: 'bg-accent-flow/10', text: 'text-accent-flow' },
  tasks: { bg: 'bg-accent-sun/10', text: 'text-accent-sun' },
  habits: { bg: 'bg-accent-bloom/10', text: 'text-accent-bloom' },
  social: { bg: 'bg-accent-flow/10', text: 'text-accent-flow' },
  emotional: { bg: 'bg-accent-spark/10', text: 'text-accent-spark' },
};

const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  brain: Brain,
  sunrise: Sunrise,
  moon: Moon,
  'rotate-ccw': RotateCcw,
  flame: Flame,
  users: Users,
  inbox: Inbox,
  award: Award,
  clock: Clock,
  heart: Heart,
  'check-circle': CheckCircle,
  shield: Shield,
  crown: Crown,
  star: Star,
};

interface AchievementCardProps {
  achievement: AchievementDefinition;
  unlocked: boolean;
  unlockedAt?: string;
  className?: string;
}

function AchievementCard({ achievement, unlocked, unlockedAt, className }: AchievementCardProps) {
  const formattedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  // Check if unlocked within last 7 days for glow effect
  const [isRecent, setIsRecent] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (unlockedAt) {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const recent = (Date.now() - new Date(unlockedAt).getTime()) < sevenDaysMs;
      if (recent) {
        const t = setTimeout(() => {
          setIsRecent(true);
          setShowConfetti(true);
        }, 0);
        const hideConfetti = setTimeout(() => setShowConfetti(false), 800);
        return () => { clearTimeout(t); clearTimeout(hideConfetti); };
      }
    }
  }, [unlockedAt]);

  return (
    <div
      className={clsx(
        'relative flex items-start gap-3 p-4 rounded-xl border shadow-sm shadow-black/20 transition-all duration-200',
        unlocked
          ? 'bg-bg-secondary border-white/[0.06] hover:border-white/[0.10]'
          : 'bg-bg-secondary/50 border-dashed border-white/[0.06]',
        isRecent && 'ring-1 ring-accent-flow/20 shadow-accent-flow/10',
        className,
      )}
    >
      {/* Confetti celebration burst */}
      {showConfetti && (
        <div className="absolute top-4 left-7 pointer-events-none" aria-hidden="true">
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
        </div>
      )}
      {unlocked ? (() => {
        const IconComponent = ICON_MAP[achievement.icon];
        const colors = CATEGORY_COLORS[achievement.category];
        return (
          <div className={clsx('flex items-center justify-center w-10 h-10 rounded-lg shrink-0', colors.bg)}>
            {IconComponent ? <IconComponent size={18} className={colors.text} /> : <Star size={18} className={colors.text} />}
          </div>
        );
      })() : (
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.04] shrink-0">
          <Lock size={16} className="text-white/[0.3]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium', unlocked ? 'text-text-primary' : 'text-text-muted')}>
          {achievement.title}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{achievement.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={unlocked ? 'accent' : 'muted'}>{achievement.category}</Badge>
          {formattedDate && <span className="text-xs text-text-muted">{formattedDate}</span>}
        </div>
      </div>
    </div>
  );
}

export { AchievementCard };
export type { AchievementCardProps };
