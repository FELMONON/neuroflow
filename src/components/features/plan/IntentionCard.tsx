'use client';

import { Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';

interface IntentionCardProps {
  intentionOpen: boolean;
  intention: string;
  onOpen: () => void;
  onClose: () => void;
  onChange: (value: string) => void;
}

export function IntentionCard({ intentionOpen, intention, onOpen, onClose, onChange }: IntentionCardProps) {
  if (!intentionOpen && !intention.trim()) {
    return (
      <button
        onClick={onOpen}
        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/[0.08] text-sm text-text-muted hover:text-text-secondary hover:border-white/[0.12] hover:bg-white/[0.02] transition-all duration-200 cursor-pointer"
      >
        <Sun size={14} />
        <span>Set a morning intention</span>
      </button>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-text-secondary">Morning intention</label>
        {!intention.trim() && (
          <button
            onClick={onClose}
            className="text-xs text-text-muted hover:text-text-secondary cursor-pointer transition-colors duration-150"
          >
            Skip
          </button>
        )}
      </div>
      <textarea
        value={intention}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What is your main focus for today?"
        rows={2}
        className="w-full bg-bg-tertiary border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-accent-flow/40 transition-colors duration-150"
      />
      {intention.trim() && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-accent-grow mt-2"
        >
          Intention set. You showed up. That counts.
        </motion.p>
      )}
    </Card>
  );
}
