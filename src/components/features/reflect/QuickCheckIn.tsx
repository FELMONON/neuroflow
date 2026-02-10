'use client';

import { useState, useCallback } from 'react';
import { Card, Button, ScaleInput } from '@/components/ui';
import clsx from 'clsx';

interface CheckInData {
  mood: number;
  energy: number;
  focus: number;
  emotions: string[];
  note: string;
}

interface QuickCheckInProps {
  onSubmit: (data: CheckInData) => void;
  className?: string;
}

const EMOTIONS = [
  'Anxious', 'Motivated', 'Overwhelmed', 'Calm', 'Frustrated',
  'Excited', 'Sad', 'Grateful', 'Scattered', 'Focused',
];

export function QuickCheckIn({ onSubmit, className }: QuickCheckInProps) {
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [focus, setFocus] = useState(3);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const toggleEmotion = useCallback((label: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(label) ? prev.filter((e) => e !== label) : [...prev, label],
    );
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit({ mood, energy, focus, emotions: selectedEmotions, note });
  }, [mood, energy, focus, selectedEmotions, note, onSubmit]);

  return (
    <Card className={className}>
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text-primary">How are you right now?</h2>

        <ScaleInput value={mood} onChange={setMood} label="Mood" lowLabel="Rough" highLabel="Great" />
        <ScaleInput value={energy} onChange={setEnergy} label="Energy" lowLabel="Drained" highLabel="Energized" />
        <ScaleInput value={focus} onChange={setFocus} label="Focus" lowLabel="Foggy" highLabel="Clear" />

        <div>
          <span className="text-sm font-medium text-text-secondary block mb-3">Emotions</span>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((label) => {
              const selected = selectedEmotions.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleEmotion(label)}
                  aria-pressed={selected}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer',
                    'focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none',
                    selected
                      ? 'bg-accent-flow/10 text-accent-flow'
                      : 'bg-white/[0.04] text-text-secondary hover:bg-white/[0.08]',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Note (optional)</label>
          <textarea
            className="w-full h-20 rounded-xl bg-bg-tertiary border border-white/[0.08] text-text-primary placeholder:text-text-muted px-3 py-2 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary transition-colors duration-150"
            placeholder="Anything on your mind..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <Button onClick={handleSubmit}>Save</Button>
      </div>
    </Card>
  );
}
