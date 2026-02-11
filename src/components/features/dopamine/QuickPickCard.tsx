'use client';

import { Shuffle, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card } from '@/components/ui';
import clsx from 'clsx';

interface QuickPickItem {
  id: string;
  title: string;
  duration: string;
  durationMinutes: number;
}

interface QuickPickCardProps {
  quickPick: QuickPickItem | null;
  isSpinning: boolean;
  onQuickPick: () => void;
}

export function QuickPickCard({ quickPick, isSpinning, onQuickPick }: QuickPickCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="flex items-center gap-2">
          <Shuffle size={14} className="text-accent-bloom" />
          <span className="text-sm font-medium text-text-secondary">Can&apos;t decide?</span>
        </div>
        <AnimatePresence mode="wait">
          {quickPick && (
            <motion.div
              key={quickPick.id + (isSpinning ? '-spin' : '')}
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: isSpinning ? 0.1 : 0.3 }}
              className={clsx(
                'text-center px-4 py-3 rounded-xl border w-full max-w-xs',
                isSpinning ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-accent-bloom/10 border-accent-bloom/20',
              )}
            >
              <p className={clsx('text-sm font-medium', isSpinning ? 'text-text-secondary' : 'text-accent-bloom')}>
                {quickPick.title}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{quickPick.duration}</p>
              {!isSpinning && quickPick.durationMinutes > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2">
                  <Button variant="ghost" size="sm" icon={<Timer size={12} />}>
                    Do this for {quickPick.duration}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <Button variant="secondary" size="sm" icon={<Shuffle size={14} />} onClick={onQuickPick} disabled={isSpinning}>
          {isSpinning ? 'Picking...' : 'Quick pick'}
        </Button>
      </div>
    </Card>
  );
}
