'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Sparkles } from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { getEveningReflection } from '@/lib/ai';

interface EveningReflectionProps {
  onSubmit: (data: { wins: string[]; struggles: string[]; tomorrow: string }) => void;
  className?: string;
}

interface AIReflection {
  summary: string;
  encouragement: string;
  tomorrowTip: string;
}

function ListInput({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[idx] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
            wrapperClassName="flex-1"
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              aria-label={`Remove item ${idx + 1}`}
              className="p-1.5 rounded-lg text-text-muted hover:text-accent-spark transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-all duration-200 active:scale-[0.98] cursor-pointer w-fit focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none rounded"
      >
        <Plus size={12} />
        Add another
      </button>
    </div>
  );
}

export function EveningReflection({ onSubmit, className }: EveningReflectionProps) {
  const [wins, setWins] = useState(['']);
  const [struggles, setStruggles] = useState(['']);
  const [tomorrow, setTomorrow] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReflection, setAiReflection] = useState<AIReflection | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(async () => {
    const cleanWins = wins.filter((w) => w.trim());
    const cleanStruggles = struggles.filter((s) => s.trim());

    // Save to DB via parent handler
    onSubmit({
      wins: cleanWins,
      struggles: cleanStruggles,
      tomorrow: tomorrow.trim(),
    });

    setSubmitted(true);

    // Call AI for reflection summary (non-blocking — don't fail the save)
    if (cleanWins.length > 0 || cleanStruggles.length > 0) {
      setAiLoading(true);
      try {
        const data = await getEveningReflection(cleanWins, cleanStruggles);
        if (data.summary && data.encouragement && data.tomorrowTip) {
          setAiReflection(data as AIReflection);
        }
      } catch (err) {
        console.warn('[EveningReflection] AI summary unavailable:', err);
        // Graceful degradation — just don't show the AI section
      } finally {
        setAiLoading(false);
      }
    }
  }, [wins, struggles, tomorrow, onSubmit]);

  return (
    <Card className={className}>
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text-primary">Evening Reflection</h2>

        {!submitted ? (
          <>
            <ListInput label="What went well?" items={wins} onChange={setWins} placeholder="Something that went well..." />
            <ListInput label="What was hard?" items={struggles} onChange={setStruggles} placeholder="Something that was hard..." />

            <Input
              label="One thing for tomorrow"
              value={tomorrow}
              onChange={(e) => setTomorrow(e.target.value)}
              placeholder="Tomorrow I want to..."
            />

            <Button onClick={handleSubmit}>Save</Button>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Saved confirmation */}
            <p className="text-sm text-accent-grow">Reflection saved.</p>

            {/* AI summary */}
            <AnimatePresence>
              {aiLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 py-4"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-accent-flow animate-pulse"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-text-muted">AI is reflecting on your day...</span>
                </motion.div>
              )}

              {aiReflection && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="rounded-xl bg-accent-flow/[0.04] border border-accent-flow/[0.08] p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-accent-flow" />
                    <span className="text-xs font-medium text-accent-flow">AI Reflection</span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">
                    {aiReflection.summary}
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {aiReflection.encouragement}
                  </p>
                  <div className="pt-1 border-t border-white/[0.06]">
                    <p className="text-xs text-text-muted">
                      <span className="font-medium text-text-secondary">Tomorrow tip:</span>{' '}
                      {aiReflection.tomorrowTip}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reset to reflect again */}
            <button
              onClick={() => {
                setSubmitted(false);
                setAiReflection(null);
                setWins(['']);
                setStruggles(['']);
                setTomorrow('');
              }}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer w-fit"
            >
              Reflect again
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
