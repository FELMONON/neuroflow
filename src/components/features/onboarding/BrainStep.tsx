'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ADHDSubtype } from '@/types/database';

interface BrainStepProps {
  selectedSubtype: ADHDSubtype | null;
  onSubtypeChange: (subtype: ADHDSubtype) => void;
  challenges: string[];
  onChallengesChange: (challenges: string[]) => void;
  onContinue: () => void;
}

const subtypeCards: { type: ADHDSubtype; label: string; description: string }[] = [
  { type: 'inattentive', label: 'Inattentive', description: 'Difficulty sustaining focus, easily distracted' },
  { type: 'hyperactive', label: 'Hyperactive', description: 'Restlessness, difficulty sitting still' },
  { type: 'combined', label: 'Combined', description: 'Mix of inattentive and hyperactive traits' },
  { type: 'unsure', label: 'Not sure', description: 'You can always update this later' },
];

const challengeOptions = [
  'Starting tasks',
  'Losing track of time',
  'Staying organized',
  'Sustaining focus',
  'Forgetting things',
  'Emotional regulation',
];

export function BrainStep({
  selectedSubtype,
  onSubtypeChange,
  challenges,
  onChallengesChange,
  onContinue,
}: BrainStepProps) {
  const toggleChallenge = (challenge: string) => {
    if (challenges.includes(challenge)) {
      onChallengesChange(challenges.filter((c) => c !== challenge));
    } else if (challenges.length < 3) {
      onChallengesChange([...challenges, challenge]);
    }
  };

  return (
    <div className="flex flex-col items-center px-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-text-primary text-center">
        Which sounds most like you?
      </h2>

      <div className="grid grid-cols-2 gap-3 w-full mt-8">
        {subtypeCards.map((card) => {
          const selected = selectedSubtype === card.type;
          return (
            <motion.button
              key={card.type}
              onClick={() => onSubtypeChange(card.type)}
              aria-pressed={selected}
              whileTap={{ scale: 0.97 }}
              animate={selected ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`text-left bg-bg-secondary rounded-xl border p-4 transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none ${
                selected ? 'border-accent-flow bg-accent-flow/5' : 'border-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">{card.label}</p>
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <Check size={14} className="text-accent-flow" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-xs text-text-secondary mt-1">{card.description}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="w-full mt-10">
        <p className="text-sm font-medium text-text-primary text-center">
          Biggest challenges?
        </p>
        <p className="text-sm text-text-muted text-center mt-1">Select up to 3</p>

        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {challengeOptions.map((challenge) => {
            const selected = challenges.includes(challenge);
            const disabled = !selected && challenges.length >= 3;
            return (
              <motion.button
                key={challenge}
                onClick={() => toggleChallenge(challenge)}
                aria-pressed={selected}
                disabled={disabled}
                whileTap={disabled ? undefined : { scale: 0.95 }}
                animate={selected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none ${
                  selected
                    ? 'bg-accent-flow/10 text-accent-flow border-accent-flow/20'
                    : 'bg-white/[0.04] text-text-secondary border-white/[0.06]'
                } ${disabled ? 'opacity-40' : ''}`}
              >
                {challenge}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <Button size="lg" disabled={!selectedSubtype} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

export type { BrainStepProps };
