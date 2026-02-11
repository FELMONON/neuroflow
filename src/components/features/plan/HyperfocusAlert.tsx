'use client';

import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface HyperfocusAlertProps {
  minutes: number;
  blockLabel: string;
  onStartNext: () => void;
}

export function HyperfocusAlert({ minutes, blockLabel, onStartNext }: HyperfocusAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-4 rounded-xl bg-accent-sun/[0.06] border border-accent-sun/[0.12]"
    >
      <div className="w-8 h-8 rounded-lg bg-accent-sun/10 flex items-center justify-center shrink-0">
        <AlertCircle size={14} className="text-accent-sun" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary font-medium">Hyperfocus check</p>
        <p className="text-xs text-text-secondary mt-0.5">
          You&apos;re {minutes}min past <span className="font-medium">{blockLabel}</span>. Take a breath — keep going or transition?
        </p>
      </div>
      <button
        onClick={onStartNext}
        className="text-xs text-accent-flow font-medium px-3 py-1.5 rounded-lg bg-accent-flow/10 hover:bg-accent-flow/15 transition-colors shrink-0 cursor-pointer"
      >
        Start next
      </button>
    </motion.div>
  );
}
