'use client';

import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EnergyLevel } from '@/types/database';
import clsx from 'clsx';

const ENERGY_FILTERS: { level: EnergyLevel | 'all'; label: string; color: string }[] = [
  { level: 'all', label: 'All', color: 'bg-white/[0.06] text-text-secondary' },
  { level: 'high', label: 'Wired', color: 'bg-energy-high/10 text-energy-high border-energy-high/20' },
  { level: 'medium', label: 'Okay', color: 'bg-energy-medium/10 text-energy-medium border-energy-medium/20' },
  { level: 'low', label: 'Low', color: 'bg-energy-low/10 text-energy-low border-energy-low/20' },
  { level: 'recharge', label: 'Recharge', color: 'bg-energy-recharge/10 text-energy-recharge border-energy-recharge/20' },
];

const ENERGY_SUGGESTIONS: Record<EnergyLevel, string> = {
  high: 'Channel that energy into something physical or creative.',
  medium: 'A good reset will keep you steady. Try something engaging.',
  low: 'Be gentle with yourself. Small wins count.',
  recharge: 'Time to restore. No pressure, no guilt.',
};

interface EnergyFilterBarProps {
  energyFilter: EnergyLevel | 'all';
  onFilterChange: (level: EnergyLevel | 'all') => void;
}

export function EnergyFilterBar({ energyFilter, onFilterChange }: EnergyFilterBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-text-muted" />
        <span className="text-xs font-medium text-text-secondary uppercase tracking-widest">
          Show me activities for my energy
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ENERGY_FILTERS.map((filter) => (
          <button
            key={filter.level}
            type="button"
            onClick={() => onFilterChange(filter.level)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border',
              energyFilter === filter.level
                ? filter.color
                : 'bg-white/[0.04] text-text-muted border-white/[0.06] hover:bg-white/[0.06]',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {energyFilter !== 'all' && (
          <motion.p
            key={energyFilter}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-text-muted italic"
          >
            {ENERGY_SUGGESTIONS[energyFilter]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
