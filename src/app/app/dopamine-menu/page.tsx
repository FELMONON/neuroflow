'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Shuffle, Timer, Sparkles, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Modal } from '@/components/ui';
import { DopamineCard } from '@/components/features/dopamine/DopamineCard';
import { DopamineCategory } from '@/components/features/dopamine/DopamineCategory';
import { useProfileStore } from '@/stores/useProfileStore';
import { createClient } from '@/lib/supabase/client';
import type { EnergyLevel, DopamineCategory as DopamineCategoryType } from '@/types/database';
import clsx from 'clsx';

interface DopamineItem {
  id: string;
  title: string;
  duration: string;
  durationMinutes: number;
  notes?: string;
  category: string;
  energyLevel: EnergyLevel;
  lastUsed?: string;
}

const CATEGORIES = [
  { key: 'quick', label: 'Quick Hits', subtitle: '2-5 min' },
  { key: 'medium', label: 'Medium Resets', subtitle: '15-30 min' },
  { key: 'pair', label: 'Pair with Tasks', subtitle: 'ongoing' },
  { key: 'rewards', label: 'Earned Rewards', subtitle: 'treat yourself' },
] as const;

const ENERGY_FILTERS: { level: EnergyLevel | 'all'; label: string; color: string }[] = [
  { level: 'all', label: 'All', color: 'bg-white/[0.06] text-text-secondary' },
  { level: 'high', label: 'Wired', color: 'bg-energy-high/10 text-energy-high border-energy-high/20' },
  { level: 'medium', label: 'Okay', color: 'bg-energy-medium/10 text-energy-medium border-energy-medium/20' },
  { level: 'low', label: 'Low', color: 'bg-energy-low/10 text-energy-low border-energy-low/20' },
  { level: 'recharge', label: 'Recharge', color: 'bg-energy-recharge/10 text-energy-recharge border-energy-recharge/20' },
];

// Category mapping from DB DopamineCategory to UI categories
const DB_CATEGORY_MAP: Record<string, string> = {
  appetizer: 'quick',
  side: 'pair',
  entree: 'medium',
  dessert: 'rewards',
};
const UI_CATEGORY_MAP: Record<string, string> = {
  quick: 'appetizer',
  pair: 'side',
  medium: 'entree',
  rewards: 'dessert',
};

function formatLastUsed(isoDate: string | null): string | undefined {
  if (!isoDate) return undefined;
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes === 0) return 'ongoing';
  if (minutes >= 60) return `${Math.round(minutes / 60)} hr`;
  return `${minutes} min`;
}

const ENERGY_SUGGESTIONS: Record<EnergyLevel, string> = {
  high: 'Channel that energy into something physical or creative.',
  medium: 'A good reset will keep you steady. Try something engaging.',
  low: 'Be gentle with yourself. Small wins count.',
  recharge: 'Time to restore. No pressure, no guilt.',
};

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function DopamineMenuPage() {
  const [items, setItems] = useState<DopamineItem[]>([]);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [energyFilter, setEnergyFilter] = useState<EnergyLevel | 'all'>('all');
  const [quickPick, setQuickPick] = useState<DopamineItem | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const profileId = useProfileStore((s) => s.profile?.id ?? '');

  // Load items from Supabase
  useEffect(() => {
    if (!profileId) return;
    const supabase = createClient();
    supabase
      .from('dopamine_menu')
      .select('*')
      .eq('user_id', profileId)
      .order('created_at')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setItems(data.map((d) => ({
            id: d.id,
            title: d.title,
            duration: formatDuration(d.duration_minutes),
            durationMinutes: d.duration_minutes ?? 0,
            notes: d.notes ?? undefined,
            category: DB_CATEGORY_MAP[d.category] ?? 'quick',
            energyLevel: 'medium' as EnergyLevel,
            lastUsed: formatLastUsed(d.last_used_at),
          })));
        }
      });
  }, [profileId]);

  const filteredItems = useMemo(() => {
    if (energyFilter === 'all') return items;
    return items.filter((i) => i.energyLevel === energyFilter);
  }, [items, energyFilter]);

  const handleAdd = useCallback(() => {
    if (!newTitle.trim() || !addingTo || !profileId) return;
    const id = crypto.randomUUID();
    const durationMinutes = parseInt(newDuration) || 5;
    const newItem: DopamineItem = {
      id,
      title: newTitle.trim(),
      duration: newDuration.trim() || '5 min',
      durationMinutes,
      category: addingTo,
      energyLevel: energyFilter === 'all' ? 'medium' : energyFilter,
    };
    setItems((prev) => [...prev, newItem]);
    setNewTitle('');
    setNewDuration('');
    setAddingTo(null);

    // Persist to Supabase
    const supabase = createClient();
    supabase
      .from('dopamine_menu')
      .insert({
        id,
        user_id: profileId,
        title: newItem.title,
        category: (UI_CATEGORY_MAP[addingTo] ?? 'appetizer') as DopamineCategoryType,
        duration_minutes: durationMinutes,
        notes: null,
        last_used_at: null,
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.error('[DopamineMenu] Failed to save item:', error);
      });
  }, [newTitle, newDuration, addingTo, energyFilter, profileId]);

  const handleQuickPick = useCallback(() => {
    const pool = filteredItems.length > 0 ? filteredItems : items;
    if (pool.length === 0) return;
    setIsSpinning(true);
    setQuickPick(null);

    // Simulate a fun spin through several options
    let count = 0;
    const maxSpins = 8;
    const interval = setInterval(() => {
      const randomItem = pool[Math.floor(Math.random() * pool.length)];
      setQuickPick(randomItem);
      count++;
      if (count >= maxSpins) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 120);
  }, [filteredItems, items]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
      className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6 pb-24 md:pb-8"
    >
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-text-primary">Recharge</h1>
        <p className="text-sm text-text-muted">
          Your dopamine menu — things that feel good. Use them between tasks, as rewards, or when you need a reset.
        </p>
      </div>

      {/* Energy filter */}
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
              onClick={() => setEnergyFilter(filter.level)}
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

      {/* Quick pick */}
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
                  isSpinning
                    ? 'bg-white/[0.04] border-white/[0.06]'
                    : 'bg-accent-bloom/10 border-accent-bloom/20',
                )}
              >
                <p className={clsx('text-sm font-medium', isSpinning ? 'text-text-secondary' : 'text-accent-bloom')}>
                  {quickPick.title}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{quickPick.duration}</p>
                {!isSpinning && quickPick.durationMinutes > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-2"
                  >
                    <Button variant="ghost" size="sm" icon={<Timer size={12} />}>
                      Do this for {quickPick.duration}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="secondary"
            size="sm"
            icon={<Shuffle size={14} />}
            onClick={handleQuickPick}
            disabled={isSpinning}
          >
            {isSpinning ? 'Picking...' : 'Quick pick'}
          </Button>
        </div>
      </Card>

      {/* Categories */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="flex flex-col gap-4">
        {CATEGORIES.map((cat) => {
          const catItems = filteredItems.filter((i) => i.category === cat.key);
          return (
            <motion.div key={cat.key} variants={itemVariants}>
              <Card>
                <DopamineCategory
                  title={cat.label}
                  count={catItems.length}
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() => setAddingTo(cat.key)}
                    >
                      Add
                    </Button>
                  }
                >
                  {catItems.length === 0 && (
                    <p className="text-sm text-text-muted py-2">
                      {energyFilter !== 'all'
                        ? 'No activities match this energy level. Try a different filter or add one.'
                        : 'Nothing here yet \u2014 add something that brings you joy.'}
                    </p>
                  )}
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <DopamineCard
                          title={item.title}
                          duration={item.duration}
                          notes={item.notes}
                        />
                      </div>
                      {item.lastUsed && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-text-muted shrink-0">
                          <Clock size={10} />
                          {item.lastUsed}
                        </span>
                      )}
                    </div>
                  ))}
                </DopamineCategory>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Add item modal */}
      <Modal open={addingTo !== null} onClose={() => setAddingTo(null)} title="Add to your menu">
        <div className="flex flex-col gap-4">
          <Input
            label="Activity"
            placeholder="What brings you joy?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Input
            label="Duration"
            placeholder="e.g. 5 min"
            value={newDuration}
            onChange={(e) => setNewDuration(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={!newTitle.trim()}>
            Add to menu
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
