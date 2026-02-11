'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check } from 'lucide-react';
import clsx from 'clsx';
import { useProfileStore } from '@/stores/useProfileStore';
import { useEnergyState } from '@/hooks/useEnergyState';
import { useGameLoop } from '@/hooks/useGameLoop';
import type { EnergyLevel, CheckIn } from '@/types/database';

const ENERGY_OPTIONS: { level: EnergyLevel; emoji: string; label: string; color: string }[] = [
  { level: 'high', emoji: '\u26A1', label: 'Wired', color: 'bg-energy-high/10 text-energy-high border-energy-high/20' },
  { level: 'medium', emoji: '\u2600\uFE0F', label: 'Steady', color: 'bg-energy-medium/10 text-energy-medium border-energy-medium/20' },
  { level: 'low', emoji: '\uD83D\uDE34', label: 'Low', color: 'bg-energy-low/10 text-energy-low border-energy-low/20' },
  { level: 'recharge', emoji: '\uD83D\uDCA4', label: 'Drained', color: 'bg-energy-recharge/10 text-energy-recharge border-energy-recharge/20' },
];

const ENERGY_LEVEL_MAP: Record<EnergyLevel, number> = {
  high: 5,
  medium: 3,
  low: 2,
  recharge: 1,
};

export function EnergyCheckIn() {
  const [selected, setSelected] = useState<EnergyLevel | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const setLatestCheckIn = useProfileStore((s) => s.setLatestCheckIn);
  const { needsCheckIn } = useEnergyState();
  const { onCheckIn } = useGameLoop();

  const profileId = useProfileStore((s) => s.profile?.id ?? '');

  const handleSelect = useCallback((level: EnergyLevel) => {
    setSelected(level);
    // Write check-in to profile store
    const checkIn: CheckIn = {
      id: `checkin-${Date.now()}`,
      user_id: profileId,
      mood: null,
      energy: ENERGY_LEVEL_MAP[level],
      focus_ability: null,
      emotions: [],
      note: null,
      created_at: new Date().toISOString(),
    };
    setLatestCheckIn(checkIn);
    onCheckIn();
  }, [setLatestCheckIn, onCheckIn, profileId]);

  // Hide if already checked in recently and dismissed
  if (dismissed) return null;
  // If already checked in this cycle and user hasn't interacted, still show but pre-selected
  if (!needsCheckIn && !selected) {
    // Don't show the prompt if they already checked in
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-bg-secondary rounded-xl border border-white/[0.06] px-5 py-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">
              {selected ? 'Energy logged' : "How\u2019s your energy right now?"}
            </span>
          </div>
          {selected && (
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss energy check-in"
              className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer rounded-lg px-1 py-0.5 focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
            >
              Dismiss
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {ENERGY_OPTIONS.map((opt) => {
            const isSelected = selected === opt.level;
            return (
              <button
                key={opt.level}
                type="button"
                onClick={() => handleSelect(opt.level)}
                className={clsx(
                  'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer active:scale-[0.98]',
                  'focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none',
                  isSelected
                    ? opt.color
                    : selected
                      ? 'bg-white/[0.02] border-white/[0.04] text-text-muted opacity-50'
                      : 'bg-white/[0.02] border-white/[0.06] text-text-secondary hover:bg-white/[0.04]',
                )}
              >
                <span className="text-base">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {selected && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-xs text-accent-grow mt-2.5 flex items-center gap-1"
          >
            <Check size={11} />
            <span>Logged. Your plan adapts to how you feel.</span>
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
