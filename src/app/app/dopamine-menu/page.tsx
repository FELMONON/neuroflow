'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card, Input, Modal } from '@/components/ui';
import { DopamineCard } from '@/components/features/dopamine/DopamineCard';
import { DopamineCategory } from '@/components/features/dopamine/DopamineCategory';
import { QuickPickCard } from '@/components/features/dopamine/QuickPickCard';
import { EnergyFilterBar } from '@/components/features/dopamine/EnergyFilterBar';
import { useProfileStore } from '@/stores/useProfileStore';
import { createClient } from '@/lib/supabase/client';
import { SEED_DOPAMINE_ITEMS } from '@/lib/seed-data';
import type { EnergyLevel, DopamineCategory as DopamineCategoryType } from '@/types/database';

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
  { key: 'quick', label: 'Quick Hits' },
  { key: 'medium', label: 'Medium Resets' },
  { key: 'pair', label: 'Pair with Tasks' },
  { key: 'rewards', label: 'Earned Rewards' },
] as const;

const DB_CATEGORY_MAP: Record<string, string> = { appetizer: 'quick', side: 'pair', entree: 'medium', dessert: 'rewards' };
const UI_CATEGORY_MAP: Record<string, string> = { quick: 'appetizer', pair: 'side', medium: 'entree', rewards: 'dessert' };

// Derive energy level from category + duration when not explicitly stored
function deriveEnergyLevel(category: string, durationMinutes: number | null): EnergyLevel {
  // Physical / high-engagement activities tend to be "side" (pair with tasks)
  // Quick hits are low-energy, desserts are rewards (recharge)
  const catMap: Record<string, EnergyLevel> = {
    appetizer: 'low',
    side: 'high',
    entree: 'medium',
    dessert: 'recharge',
  };
  const base = catMap[category];
  if (base) return base;
  // Fallback based on duration
  if (durationMinutes && durationMinutes <= 5) return 'low';
  if (durationMinutes && durationMinutes >= 30) return 'high';
  return 'medium';
}

const ENERGY_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: 'high', label: 'Wired' },
  { value: 'medium', label: 'Okay' },
  { value: 'low', label: 'Low' },
  { value: 'recharge', label: 'Recharge' },
];

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
  return `${Math.floor(days / 7)}w ago`;
}

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes === 0) return 'ongoing';
  if (minutes >= 60) return `${Math.round(minutes / 60)} hr`;
  return `${minutes} min`;
}

const pageVariants = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 } };
const containerVariants = { animate: { transition: { staggerChildren: 0.05 } } };
const itemVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function DopamineMenuPage() {
  const [items, setItems] = useState<DopamineItem[]>([]);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newEnergy, setNewEnergy] = useState<EnergyLevel>('medium');
  const [energyFilter, setEnergyFilter] = useState<EnergyLevel | 'all'>('all');
  const [quickPick, setQuickPick] = useState<DopamineItem | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const profileId = useProfileStore((s) => s.profile?.id ?? '');

  useEffect(() => {
    if (!profileId) return;
    const supabase = createClient();
    supabase.from('dopamine_menu').select('*').eq('user_id', profileId).order('created_at').then(({ data }) => {
      if (data && data.length > 0) {
        setItems(data.map((d) => ({
          id: d.id, title: d.title, duration: formatDuration(d.duration_minutes),
          durationMinutes: d.duration_minutes ?? 0, notes: d.notes ?? undefined,
          category: DB_CATEGORY_MAP[d.category] ?? 'quick',
          energyLevel: deriveEnergyLevel(d.category, d.duration_minutes),
          lastUsed: formatLastUsed(d.last_used_at),
        })));
      }
    });
  }, [profileId]);

  const filteredItems = useMemo(() => energyFilter === 'all' ? items : items.filter((i) => i.energyLevel === energyFilter), [items, energyFilter]);

  const handleAdd = useCallback(() => {
    if (!newTitle.trim() || !addingTo || !profileId) return;
    const id = crypto.randomUUID();
    const durationMinutes = parseInt(newDuration) || 5;
    setItems((prev) => [...prev, { id, title: newTitle.trim(), duration: newDuration.trim() || '5 min', durationMinutes, category: addingTo, energyLevel: newEnergy }]);
    setNewTitle(''); setNewDuration(''); setNewEnergy('medium'); setAddingTo(null);
    createClient().from('dopamine_menu').insert({ id, user_id: profileId, title: newTitle.trim(), category: (UI_CATEGORY_MAP[addingTo] ?? 'appetizer') as DopamineCategoryType, duration_minutes: durationMinutes, notes: null, last_used_at: null, created_at: new Date().toISOString() })
      .then(({ error }) => { if (error) console.error('[DopamineMenu] Failed to save item:', error); });
  }, [newTitle, newDuration, addingTo, newEnergy, profileId]);

  const handleQuickPick = useCallback(() => {
    const pool = filteredItems.length > 0 ? filteredItems : items;
    if (pool.length === 0) return;
    setIsSpinning(true); setQuickPick(null);
    let count = 0;
    const interval = setInterval(() => {
      setQuickPick(pool[Math.floor(Math.random() * pool.length)]);
      if (++count >= 8) { clearInterval(interval); setIsSpinning(false); }
    }, 120);
  }, [filteredItems, items]);

  const handleLoadStarter = useCallback(() => {
    if (!profileId) return;
    const supabase = createClient();
    const now = new Date().toISOString();
    const newItems: DopamineItem[] = [];
    for (const seed of SEED_DOPAMINE_ITEMS) {
      const id = crypto.randomUUID();
      newItems.push({
        id,
        title: seed.title,
        duration: formatDuration(seed.duration_minutes),
        durationMinutes: seed.duration_minutes,
        category: DB_CATEGORY_MAP[seed.category] ?? 'quick',
        energyLevel: seed.energy,
      });
      supabase.from('dopamine_menu').insert({
        id,
        user_id: profileId,
        title: seed.title,
        category: seed.category,
        duration_minutes: seed.duration_minutes,
        notes: null,
        last_used_at: null,
        created_at: now,
      }).then(({ error }) => {
        if (error) console.error('[DopamineMenu] Failed to seed item:', error);
      });
    }
    setItems((prev) => [...prev, ...newItems]);
  }, [profileId]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }} className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6 pb-24 md:pb-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-text-primary">Recharge</h1>
        <p className="text-sm text-text-muted">Your dopamine menu — things that feel good. Use them between tasks, as rewards, or when you need a reset.</p>
      </div>

      <EnergyFilterBar energyFilter={energyFilter} onFilterChange={setEnergyFilter} />
      <QuickPickCard quickPick={quickPick} isSpinning={isSpinning} onQuickPick={handleQuickPick} />

      <motion.div variants={containerVariants} initial="initial" animate="animate" className="flex flex-col gap-4">
        {CATEGORIES.map((cat) => {
          const catItems = filteredItems.filter((i) => i.category === cat.key);
          return (
            <motion.div key={cat.key} variants={itemVariants}>
              <Card>
                <DopamineCategory title={cat.label} count={catItems.length} action={<Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setAddingTo(cat.key)}>Add</Button>}>
                  {catItems.length === 0 && <p className="text-sm text-text-muted py-2">{energyFilter !== 'all' ? 'No activities match this energy level. Try a different filter or add one.' : 'Nothing here yet \u2014 add something that brings you joy.'}</p>}
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="flex-1"><DopamineCard title={item.title} duration={item.duration} notes={item.notes} /></div>
                      {item.lastUsed && <span className="hidden sm:inline-flex items-center gap-1 text-xs text-text-muted shrink-0"><Clock size={10} />{item.lastUsed}</span>}
                    </div>
                  ))}
                </DopamineCategory>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {items.length === 0 && (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={handleLoadStarter}>
            Load starter activities
          </Button>
        </div>
      )}

      <Modal open={addingTo !== null} onClose={() => setAddingTo(null)} title="Add to your menu">
        <div className="flex flex-col gap-4">
          <Input label="Activity" placeholder="What brings you joy?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Input label="Duration" placeholder="e.g. 5 min" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-secondary">Energy level</span>
            <div className="flex gap-2">
              {ENERGY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewEnergy(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border ${
                    newEnergy === opt.value
                      ? opt.value === 'high' ? 'bg-energy-high/10 text-energy-high border-energy-high/20'
                      : opt.value === 'medium' ? 'bg-energy-medium/10 text-energy-medium border-energy-medium/20'
                      : opt.value === 'low' ? 'bg-energy-low/10 text-energy-low border-energy-low/20'
                      : 'bg-energy-recharge/10 text-energy-recharge border-energy-recharge/20'
                      : 'bg-white/[0.04] text-text-muted border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!newTitle.trim()}>Add to menu</Button>
        </div>
      </Modal>
    </motion.div>
  );
}
