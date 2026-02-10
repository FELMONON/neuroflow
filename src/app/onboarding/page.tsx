'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { OnboardingProgress } from '@/components/features/onboarding/OnboardingProgress';
import { WelcomeStep } from '@/components/features/onboarding/WelcomeStep';
import { BrainStep } from '@/components/features/onboarding/BrainStep';
import { RhythmStep } from '@/components/features/onboarding/RhythmStep';
import { FirstWinStep } from '@/components/features/onboarding/FirstWinStep';
import { createClient } from '@/lib/supabase/client';
import type { ADHDSubtype, Subtask } from '@/types/database';

interface OnboardingData {
  name: string;
  adhdSubtype: ADHDSubtype | null;
  challenges: string[];
  peakStart: string;
  peakEnd: string;
  dipStart: string;
  dipEnd: string;
  workDuration: number;
  existingSystems: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    name: '',
    adhdSubtype: null,
    challenges: [],
    peakStart: '09:00',
    peakEnd: '12:00',
    dipStart: '14:00',
    dipEnd: '16:00',
    workDuration: 25,
    existingSystems: [],
  });

  // Pre-fill name from authenticated user's metadata, redirect if already onboarded
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // Check if onboarding is already complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.replace('/app/today');
        return;
      }

      const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name || '';
      if (displayName) {
        setData((d) => ({ ...d, name: displayName }));
      }
    }
    loadUser();
  }, [supabase, router]);

  const goForward = useCallback(() => setStep((s) => Math.min(s + 1, 4)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const handleComplete = useCallback(
    async (taskTitle: string, subtasks?: Subtask[]) => {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // Save onboarding data to profile
      await supabase
        .from('profiles')
        .update({
          display_name: data.name.trim(),
          adhd_subtype: data.adhdSubtype,
          energy_pattern: {
            peak_start: data.peakStart,
            peak_end: data.peakEnd,
            dip_start: data.dipStart,
            dip_end: data.dipEnd,
          },
          preferred_work_duration: data.workDuration,
          onboarding_completed: true,
          settings: {
            challenges: data.challenges,
            existing_systems: data.existingSystems,
          },
        })
        .eq('id', user.id);

      // Save the first task if the user entered one
      if (taskTitle.trim()) {
        const totalMinutes = subtasks?.reduce((sum, s) => sum + s.estimated_minutes, 0) ?? null;
        await supabase.from('tasks').insert({
          user_id: user.id,
          title: taskTitle.trim(),
          status: 'today',
          priority: 'high',
          energy_required: 'medium',
          estimated_minutes: totalMinutes,
          ai_subtasks: subtasks ?? null,
        });
      }

      setSaving(false);
      router.push('/app/today');
    },
    [supabase, router, data],
  );

  return (
    <div className="min-h-screen bg-bg-primary landing-noise flex flex-col">
      <div className="flex items-center justify-center pt-8 pb-12 px-4 relative">
        {step > 1 && (
          <button
            onClick={goBack}
            className="absolute left-4 top-8 text-sm text-text-muted hover:text-text-primary transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Back
          </button>
        )}
        <OnboardingProgress currentStep={step} />
        {step < 4 && (
          <button
            onClick={() => handleComplete('')}
            className="absolute right-4 top-8 text-sm text-text-muted hover:text-text-secondary transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Skip setup
          </button>
        )}
      </div>

      <div className="flex-1 flex items-start justify-center pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {step === 1 && (
              <WelcomeStep
                name={data.name}
                onNameChange={(name) => setData((d) => ({ ...d, name }))}
                onContinue={goForward}
              />
            )}
            {step === 2 && (
              <BrainStep
                selectedSubtype={data.adhdSubtype}
                onSubtypeChange={(adhdSubtype) => setData((d) => ({ ...d, adhdSubtype }))}
                challenges={data.challenges}
                onChallengesChange={(challenges) => setData((d) => ({ ...d, challenges }))}
                onContinue={goForward}
              />
            )}
            {step === 3 && (
              <RhythmStep
                peakStart={data.peakStart}
                peakEnd={data.peakEnd}
                dipStart={data.dipStart}
                dipEnd={data.dipEnd}
                onPeakChange={(peakStart, peakEnd) => setData((d) => ({ ...d, peakStart, peakEnd }))}
                onDipChange={(dipStart, dipEnd) => setData((d) => ({ ...d, dipStart, dipEnd }))}
                workDuration={data.workDuration}
                onWorkDurationChange={(workDuration) => setData((d) => ({ ...d, workDuration }))}
                existingSystems={data.existingSystems}
                onExistingSystemsChange={(existingSystems) => setData((d) => ({ ...d, existingSystems }))}
                onContinue={goForward}
              />
            )}
            {step === 4 && <FirstWinStep onComplete={handleComplete} saving={saving} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
