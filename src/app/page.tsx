'use client';

import { useRef, useState } from 'react';
import { useInView, motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Timer,
  Users,
  Sparkles,
  Heart,
  Trophy,
  Zap,
  ArrowRight,
  Play,
  ChevronRight,
  Brain,
  Flame,
  Star,
  SlidersHorizontal,
  CalendarClock,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────
   ANIMATION PRIMITIVES
   ───────────────────────────────────────────────────────── */

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION LABEL
   ───────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-px w-8 bg-accent-flow/40" />
      <span className="text-xs font-medium text-accent-flow uppercase tracking-[0.2em]">
        {children}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PRODUCT MOCKUP — Static, polished, Linear-style
   ───────────────────────────────────────────────────────── */

function ProductMockup() {
  const tasks = [
    { title: 'Finish API integration', energy: 'high', time: '45m', done: false, active: true },
    { title: 'Review pull request', energy: 'medium', time: '20m', done: false, active: false },
    { title: 'Morning journal entry', energy: 'low', time: '10m', done: true, active: false },
    { title: 'Design onboarding flow', energy: 'high', time: '60m', done: true, active: false },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111116] overflow-hidden relative mockup-shadow">
      {/* Top edge gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-flow/30 to-transparent" />

      {/* Title bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1.5 bg-white/[0.05] rounded-md px-3 py-1">
            <Brain size={11} className="text-accent-flow/70" />
            <span className="text-[11px] text-text-muted/70 font-mono">NeuroFlow</span>
          </div>
        </div>
        <div className="w-[46px]" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-44 border-r border-white/[0.06] p-3 hidden sm:block">
          <div className="space-y-0.5">
            {[
              { label: 'Today', active: true },
              { label: 'Tasks', active: false },
              { label: 'Focus', active: false },
              { label: 'Habits', active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] ${
                  item.active
                    ? 'bg-accent-flow/[0.08] text-accent-flow'
                    : 'text-text-muted/70'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded ${
                    item.active ? 'bg-accent-flow/20' : 'bg-white/[0.05]'
                  }`}
                />
                <span className={item.active ? 'font-medium' : ''}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="text-[9px] uppercase tracking-widest text-text-muted/50 mb-1.5">Energy</div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-grow to-accent-grow/60" style={{ width: '72%' }} />
              </div>
              <span className="text-[9px] text-accent-grow/80 font-medium">High</span>
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-[13px] text-text-muted/60">Good morning</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-medium text-text-primary/90">3 tasks for today</span>
              <div className="flex items-center gap-1 bg-accent-sun/[0.08] rounded-md px-1.5 py-0.5">
                <Flame size={9} className="text-accent-sun/70" />
                <span className="text-[9px] font-medium text-accent-sun/70">7 day streak</span>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-1 mb-4">
            {tasks.map((task, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${
                  task.active
                    ? 'bg-accent-flow/[0.06] border border-accent-flow/[0.12]'
                    : 'border border-transparent'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-[4px] border flex items-center justify-center ${
                    task.done
                      ? 'border-accent-flow/40 bg-accent-flow/10'
                      : task.active
                        ? 'border-accent-flow/20'
                        : 'border-white/[0.08]'
                  }`}
                >
                  {task.done && <Check size={8} className="text-accent-flow/80" />}
                </div>
                <span className={`text-[14px] flex-1 ${task.done ? 'text-text-muted/40 line-through' : 'text-text-primary/80'}`}>
                  {task.title}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    task.energy === 'high' ? 'bg-accent-grow/60' : task.energy === 'medium' ? 'bg-accent-sun/60' : 'bg-accent-spark/60'
                  }`} />
                  <span className="text-[10px] text-text-muted/40 font-mono">{task.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Timer bar */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.015] border border-white/[0.04]">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-flow/[0.08]">
              <Play size={12} className="text-accent-flow/70 ml-0.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-text-muted/50">Focus Session</span>
                <span className="text-[11px] font-mono text-accent-flow/60 font-medium">16:22</span>
              </div>
              <div className="h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-flow/60 to-accent-bloom/40" style={{ width: '35%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FEATURE DEEP-DIVE DEMOS
   ───────────────────────────────────────────────────────── */

function TaskBreakdownDemo() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="relative p-6 rounded-2xl bg-bg-secondary/80 border border-white/[0.06] backdrop-blur-sm">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-grow/20 to-transparent" />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-[18px] h-[18px] rounded-[5px] border border-white/[0.10]" />
        <span className="text-sm font-medium text-text-primary">Launch new feature by Friday</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto text-text-muted hover:text-text-secondary transition-all duration-200 active:scale-[0.98] cursor-pointer"
          aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
          aria-expanded={expanded}
        >
          <ChevronRight size={14} className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-4 pl-4 border-l border-white/[0.04] space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] text-accent-flow/60 uppercase tracking-widest font-medium mb-2">
                <Sparkles size={9} />
                <span>AI broke this down</span>
              </div>
              {[
                { text: 'Write API endpoint tests', energy: 'high', time: '30m', done: true },
                { text: 'Update database schema', energy: 'high', time: '45m', done: true },
                { text: 'Build UI components', energy: 'medium', time: '60m', done: false },
                { text: 'Write documentation', energy: 'low', time: '20m', done: false },
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    task.done ? 'border-accent-flow/30 bg-accent-flow/[0.08]' : 'border-white/[0.08]'
                  }`}>
                    {task.done && <Check size={7} className="text-accent-flow/70" />}
                  </div>
                  <span className={`text-[13px] flex-1 ${task.done ? 'text-text-muted/40 line-through' : 'text-text-secondary'}`}>
                    {task.text}
                  </span>
                  <span className="text-[10px] text-text-muted/30 font-mono">{task.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-[3px] rounded-full bg-white/[0.03] overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-accent-grow/50 to-accent-flow/40" />
        </div>
        <span className="text-[10px] text-text-muted/40 font-mono">2/4</span>
      </div>
    </div>
  );
}

function FocusTimerDemo() {
  return (
    <div className="relative p-6 rounded-2xl bg-bg-secondary/80 border border-white/[0.06] backdrop-blur-sm">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-flow/20 to-transparent" />

      <div className="flex flex-col items-center py-4">
        {/* Timer ring */}
        <div className="relative w-32 h-32 mb-5">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="none" />
            <circle
              cx="60" cy="60" r="52"
              stroke="url(#timerGrad)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * 0.35}`}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-flow)" stopOpacity="0.7" />
                <stop offset="100%" stopColor="var(--accent-bloom)" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-medium text-text-primary/90 tracking-wider">16:22</span>
            <span className="text-[10px] text-text-muted/40 mt-0.5">remaining</span>
          </div>
        </div>

        <div className="text-[13px] text-text-muted/50 text-center">
          Working on <span className="text-text-primary/70 font-medium">API Integration</span>
        </div>

        <div className="flex items-center gap-1.5 mt-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${
              i <= 2 ? 'bg-accent-flow/50' : i === 3 ? 'bg-accent-flow/15' : 'bg-white/[0.04]'
            }`} />
          ))}
          <span className="text-[9px] text-text-muted/30 ml-1 font-mono">3 / 4</span>
        </div>
      </div>
    </div>
  );
}

function HabitStreakDemo() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekData = [
    [true, true, true, true, true, false, true],
    [true, true, false, true, true, true, true],
    [true, true, true, true, false, true, true],
  ];
  const habits = ['Meditate', 'Exercise', 'Read'];

  return (
    <div className="relative p-6 rounded-2xl bg-bg-secondary/80 border border-white/[0.06] backdrop-blur-sm">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-sun/20 to-transparent" />

      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-medium text-text-primary/80">This week</span>
        <div className="flex items-center gap-1.5 text-accent-sun/60">
          <Flame size={12} />
          <span className="text-xs font-medium">12 day streak</span>
        </div>
      </div>

      <div className="grid grid-cols-[72px_repeat(7,1fr)] gap-1.5 mb-2">
        <div />
        {days.map((d, i) => (
          <div key={i} className="text-[9px] text-text-muted/30 text-center font-medium">{d}</div>
        ))}
      </div>

      <div className="space-y-1.5">
        {habits.map((habit, hi) => (
          <div key={habit} className="grid grid-cols-[72px_repeat(7,1fr)] gap-1.5 items-center">
            <span className="text-[11px] text-text-muted/50 truncate">{habit}</span>
            {weekData[hi].map((done, di) => (
              <div key={di} className="flex justify-center">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  done ? 'bg-accent-flow/[0.08] border border-accent-flow/[0.15]' : 'bg-white/[0.015] border border-white/[0.03]'
                }`}>
                  {done && <Check size={8} className="text-accent-flow/50" />}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 p-2.5 rounded-lg bg-accent-sun/[0.03] border border-accent-sun/[0.06]">
        <p className="text-[10px] text-accent-sun/40 leading-relaxed">
          Missed Tuesday? Your streak is safe. Resilience-based tracking keeps your momentum alive.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FEATURE SHOWCASE (alternating layout)
   ───────────────────────────────────────────────────────── */

function FeatureShowcase({
  label,
  title,
  description,
  children,
  reversed = false,
}: {
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
  reversed?: boolean;
}) {
  return (
    <Reveal>
      <div className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 lg:gap-20 items-center`}>
        <div className="flex-1 max-w-md">
          <SectionLabel>{label}</SectionLabel>
          <h3
            className="text-2xl sm:text-[1.75rem] font-bold text-text-primary tracking-[-0.03em] leading-[1.2]"
            style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
          >
            {title}
          </h3>
          <p className="text-text-secondary/80 mt-3 leading-[1.7] text-[17px]">{description}</p>
        </div>
        <div className="flex-1 w-full max-w-lg">{children}</div>
      </div>
    </Reveal>
  );
}

/* ─────────────────────────────────────────────────────────
   TOOLKIT CARD
   ───────────────────────────────────────────────────────── */

function FeaturedToolkitCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <Reveal delay={index * 0.05}>
      <div className="group relative p-7 rounded-xl bg-white/[0.03] border border-accent-flow/[0.10] hover:border-accent-flow/[0.20] hover:bg-white/[0.04] transition-all duration-300 h-full">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-flow/20 to-transparent" />
        <div className="w-11 h-11 rounded-xl bg-accent-flow/[0.08] border border-accent-flow/[0.12] flex items-center justify-center mb-5 group-hover:bg-accent-flow/[0.12] transition-colors duration-300">
          <Icon size={20} className="text-accent-flow/80" />
        </div>
        <h3 className="text-[17px] font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-[15px] text-text-secondary/70 leading-relaxed">{description}</p>
      </div>
    </Reveal>
  );
}

function ToolkitCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <Reveal delay={index * 0.05}>
      <div className="group p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.10] hover:bg-white/[0.03] transition-all duration-300 h-full">
        <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3 group-hover:bg-white/[0.06] transition-colors duration-300">
          <Icon size={16} className="text-text-secondary/70" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary/90 mb-1">{title}</h3>
        <p className="text-[14px] text-text-secondary/70 leading-relaxed">{description}</p>
      </div>
    </Reveal>
  );
}

/* ─────────────────────────────────────────────────────────
   TESTIMONIAL CARD
   ───────────────────────────────────────────────────────── */

function TestimonialCard({
  quote,
  name,
  detail,
}: {
  quote: string;
  name: string;
  detail: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] h-full flex flex-col">
      <div className="flex gap-0.5 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={13} className="text-accent-sun/50 fill-accent-sun/50" />
        ))}
      </div>
      <p className="text-sm text-text-secondary/80 leading-relaxed flex-1">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/[0.04]">
        <div className="w-8 h-8 rounded-full bg-accent-flow/[0.06] border border-accent-flow/[0.10] flex items-center justify-center">
          <span className="text-[11px] font-semibold text-accent-flow/60">{name.charAt(0)}</span>
        </div>
        <div>
          <div className="text-sm font-medium text-text-primary/80">{name}</div>
          <div className="text-xs text-text-muted/50">{detail}</div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════
   DATA
   ═════════════════════════════════════════════════════════ */

const featuredTools = [
  {
    title: 'Focus Timer',
    description: 'Pomodoro sessions calibrated to your attention span, with ambient soundscapes and gentle nudges.',
    icon: Timer,
  },
  {
    title: 'Body Doubling',
    description: 'Virtual co-working rooms where you work alongside others in real time. Accountability without pressure.',
    icon: Users,
  },
  {
    title: 'Dopamine Menu',
    description: 'A curated list of healthy recharges to reach for instead of doomscrolling between tasks.',
    icon: Sparkles,
  },
];

const supportingTools = [
  {
    title: 'Emotional Check-ins',
    description: 'Quick mood and energy logs that surface patterns — so you can adjust before your energy tanks.',
    icon: Heart,
  },
  {
    title: 'Gamification',
    description: 'XP, streaks, and achievements that reward showing up — without punishing bad days.',
    icon: Trophy,
  },
  {
    title: 'Quick Capture',
    description: 'Dump thoughts instantly so they stop looping. Sort later, or let AI do it.',
    icon: Zap,
  },
];

const testimonials = [
  {
    quote: 'I have tried every productivity app. This is the first one that understands my brain does not work like everyone else.',
    name: 'Sarah K.',
    detail: 'Software engineer \u00B7 ADHD diagnosed at 28',
  },
  {
    quote: 'The resilient streaks changed everything. I used to give up after one bad day. Now I keep going.',
    name: 'Marcus T.',
    detail: 'Freelance designer \u00B7 Combined type',
  },
  {
    quote: 'Body doubling with strangers sounds weird but it is genuinely the only way I can do my taxes.',
    name: 'Jess L.',
    detail: 'Graduate student \u00B7 Inattentive type',
  },
  {
    quote: 'Between managing the kids and deadlines, my brain was fried. The energy-based scheduling means I finally do hard things when I can actually handle them.',
    name: 'Diana R.',
    detail: 'Parent & project manager \u00B7 Combined type',
  },
  {
    quote: 'The focus timer with ambient sounds is the only thing that gets me into a writing flow. I have written more in two weeks than I did in two months.',
    name: 'Amir J.',
    detail: 'Freelance writer \u00B7 Inattentive type',
  },
];

const freePlanFeatures = [
  'Task management with AI breakdown',
  '3 focus sessions per day',
  'Habit tracking with resilient streaks',
  'Daily planner & time blocks',
  'Emotional check-ins',
  'Quick capture',
];

const proPlanFeatures = [
  'Everything in Free, plus:',
  'Unlimited focus sessions',
  'Body doubling rooms',
  'Advanced energy insights',
  'Custom themes & sounds',
  'Priority support',
];

/* ═════════════════════════════════════════════════════════
   MAIN PAGE
   ═════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary font-sans relative">
      {/* Noise texture */}
      <div className="fixed inset-0 pointer-events-none landing-noise z-0" />

      {/* ─── Navbar ─── */}
      <nav
        aria-label="Main navigation"
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-bg-primary/80 border-b border-white/[0.03]"
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-md bg-accent-flow/[0.10] border border-accent-flow/[0.15] flex items-center justify-center group-hover:bg-accent-flow/[0.15] transition-colors">
              <Brain size={12} className="text-accent-flow/80" />
            </div>
            <span
              className="font-bold text-[15px] text-text-primary tracking-tight"
              style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
            >
              NeuroFlow
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-6">
              <a href="#features" className="text-sm text-text-muted/60 hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:outline-none rounded">
                Features
              </a>
              <a href="#community" className="text-sm text-text-muted/60 hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:outline-none rounded">
                Community
              </a>
              <a href="#pricing" className="text-sm text-text-muted/60 hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:outline-none rounded">
                Pricing
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-text-secondary/60 hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:outline-none rounded">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-accent-flow text-white text-sm h-8 px-3.5 rounded-lg inline-flex items-center font-medium hover:brightness-110 transition-all focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* ─── Hero ─── */}
        <section className="relative pt-36 sm:pt-44 pb-4 overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none" aria-hidden="true">
            <div
              className="w-full h-full"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(124,106,255,0.05) 0%, transparent 70%)',
              }}
            />
          </div>
          <div className="absolute inset-0 landing-grid-bg opacity-20 pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-6">
            {/* Eyebrow */}
            <motion.div
              className="flex justify-center mb-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] rounded-full px-4 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-grow/60 animate-pulse" />
                <span className="text-[11px] text-text-muted/60">Built for ADHD brains, by ADHD brains</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1
                className="text-center max-w-3xl mx-auto"
                style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
              >
                <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[4.5rem] font-extrabold tracking-[-0.04em] text-text-primary leading-[1.0] sm:leading-[0.92]">
                  Your external
                </span>
                <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[4.5rem] font-extrabold tracking-[-0.04em] leading-[1.0] sm:leading-[0.92] text-gradient-hero mt-2">
                  prefrontal cortex.
                </span>
              </h1>
            </motion.div>

            {/* Sub */}
            <motion.p
              className="text-center text-lg sm:text-xl text-text-secondary/70 max-w-lg mx-auto mt-6 leading-[1.6]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              Task management, focus tools, and habit tracking designed for how your brain
              <span className="text-text-primary/90 italic"> actually</span> works.
            </motion.p>

            {/* CTA */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href="/signup"
                className="group bg-accent-flow text-white h-11 px-6 rounded-xl inline-flex items-center font-medium text-[15px] hover:brightness-110 transition-all glow-accent cta-press focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
              >
                Start for free
                <ArrowRight size={15} className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <span className="text-[13px] text-text-muted/40">No credit card required</span>
            </motion.div>

            {/* Metrics */}
            <motion.div
              className="flex items-center justify-center mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <div className="inline-flex items-center gap-6 sm:gap-8 px-6 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {[
                  { value: '6', label: 'Core tools' },
                  { value: '100%', label: 'ADHD-designed' },
                  { value: '0', label: 'Guilt trips' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-bold text-text-primary font-mono tracking-tight">
                      {stat.value}
                    </span>
                    <span className="text-sm text-text-secondary/60">{stat.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Product Mockup */}
            <motion.div
              className="mt-16 mx-auto max-w-2xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative mockup-perspective">
                <div className="mockup-tilt">
                  {/* Glow */}
                  <div
                    className="absolute -inset-8 rounded-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(124,106,255,0.06) 0%, transparent 70%)' }}
                  />
                  <ProductMockup />
                </div>
              </div>
            </motion.div>

            {/* Gradient fade */}
            <div className="h-32 mt-[-64px] relative z-10 bg-gradient-to-b from-transparent to-bg-primary" />
          </div>
        </section>

        {/* ─── Why NeuroFlow ─── */}
        <section className="relative py-24 bg-[#101018]">
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-transparent to-bg-primary pointer-events-none" />
          <div className="relative max-w-5xl mx-auto px-6">
            <Reveal>
              <div className="max-w-xl">
                <SectionLabel>Why NeuroFlow</SectionLabel>
                <h2
                  className="text-3xl sm:text-[2.25rem] font-bold text-text-primary tracking-[-0.03em] leading-[1.12]"
                  style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
                >
                  Productivity tools assume a neurotypical brain.
                  <span className="text-text-muted/50"> We don&apos;t.</span>
                </h2>
                <p className="text-text-secondary/80 mt-4 text-[17px] leading-[1.7] max-w-md">
                  Every feature is built around executive function support — reducing friction,
                  matching your energy, and never punishing you for being human.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="relative py-24">
          <div className="max-w-5xl mx-auto px-6">
            <Reveal>
              <div className="text-center mb-14">
                <SectionLabel>
                  <span className="mx-auto flex items-center gap-3">
                    <span className="h-px w-8 bg-accent-flow/40" />
                    How it works
                    <span className="h-px w-8 bg-accent-flow/40" />
                  </span>
                </SectionLabel>
                <h2
                  className="text-3xl sm:text-[2.25rem] font-bold text-text-primary tracking-[-0.03em] leading-[1.12]"
                  style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
                >
                  Your first day in 3 steps.
                </h2>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {[
                {
                  step: '1',
                  icon: SlidersHorizontal,
                  title: 'Set up your brain profile',
                  description: 'Tell us your ADHD subtype, peak energy hours, and preferred work duration. This takes 2 minutes.',
                },
                {
                  step: '2',
                  icon: CalendarClock,
                  title: 'Plan around your energy',
                  description: 'We build your day around when your brain is sharpest. Hard tasks go in peak hours, not when you\u2019re drained.',
                },
                {
                  step: '3',
                  icon: TrendingUp,
                  title: 'Focus, track, and grow',
                  description: 'Work in timed sessions, build resilient streaks, earn XP. The system adapts to you, not the other way around.',
                },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className="relative flex flex-col items-center text-center p-6 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-accent-flow flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white font-mono">{item.step}</span>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-accent-flow/[0.06] border border-accent-flow/[0.10] flex items-center justify-center mt-2 mb-4">
                      <item.icon size={20} className="text-accent-flow/70" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2">{item.title}</h3>
                    <p className="text-sm text-text-secondary/70 leading-relaxed">{item.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Feature Showcases ─── */}
        <section id="features" className="relative py-8 bg-[#101018]">
          <div className="max-w-5xl mx-auto px-6 space-y-32">
            <FeatureShowcase
              label="AI Task Breakdown"
              title="Break the overwhelm into action."
              description="Paste a daunting task and watch AI split it into concrete next steps. Each subtask gets an energy tag and time estimate so you always know what matches your current state."
            >
              <TaskBreakdownDemo />
            </FeatureShowcase>

            <FeatureShowcase
              label="Focus Timer"
              title="Time is visible. Finally."
              description="A focus timer calibrated to your attention span, not a rigid 25-minute box. Visual progress, ambient soundscapes, and gentle nudges that feel supportive."
              reversed
            >
              <FocusTimerDemo />
            </FeatureShowcase>

            <FeatureShowcase
              label="Resilient Streaks"
              title="Streaks that bend, not break."
              description="Traditional habit trackers punish one missed day by resetting everything. NeuroFlow uses resilience-based tracking — consistency is not the same as perfection."
            >
              <HabitStreakDemo />
            </FeatureShowcase>
          </div>
        </section>

        {/* ─── Toolkit Grid ─── */}
        <section className="relative py-28">
          <div className="max-w-5xl mx-auto px-6">
            <Reveal>
              <div className="text-center mb-16">
                <SectionLabel>
                  <span className="mx-auto flex items-center gap-3">
                    <span className="h-px w-8 bg-accent-flow/40" />
                    The full toolkit
                    <span className="h-px w-8 bg-accent-flow/40" />
                  </span>
                </SectionLabel>
                <h2
                  className="text-3xl sm:text-[2.25rem] font-bold text-text-primary tracking-[-0.03em] leading-[1.12]"
                  style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
                >
                  Everything your brain has been asking for.
                </h2>
              </div>
            </Reveal>

            {/* Featured — the big 3 differentiators */}
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              {featuredTools.map((f, i) => (
                <FeaturedToolkitCard key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
              ))}
            </div>

            {/* Supporting tools */}
            <div className="grid sm:grid-cols-3 gap-3">
              {supportingTools.map((f, i) => (
                <ToolkitCard key={f.title} icon={f.icon} title={f.title} description={f.description} index={i + 3} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <section id="community" className="relative py-20">
          <div className="max-w-5xl mx-auto px-6">
            <Reveal>
              <div className="text-center mb-14">
                <SectionLabel>
                  <span className="mx-auto flex items-center gap-3">
                    <span className="h-px w-8 bg-accent-flow/40" />
                    Community
                    <span className="h-px w-8 bg-accent-flow/40" />
                  </span>
                </SectionLabel>
                <h2
                  className="text-3xl sm:text-[2.25rem] font-bold text-text-primary tracking-[-0.03em] leading-[1.12]"
                  style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
                >
                  Built with the community, not for them.
                </h2>

                {/* Social proof stats */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
                  {[
                    { value: '1,200+', label: 'ADHD brains trust NeuroFlow' },
                    { value: '4.9/5', label: 'average rating' },
                    { value: '92%', label: 'weekly retention' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02]"
                    >
                      <span className="text-sm sm:text-base font-bold text-text-primary font-mono tracking-tight">
                        {stat.value}
                      </span>
                      <span className="text-xs sm:text-sm text-text-secondary/60">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {testimonials.map((t, i) => (
                <Reveal key={i} delay={i * 0.06}>
                  <TestimonialCard quote={t.quote} name={t.name} detail={t.detail} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section className="relative py-28 bg-[#101018]" id="pricing">
          <div className="max-w-3xl mx-auto px-6">
            <Reveal>
              <div className="text-center mb-14">
                <SectionLabel>
                  <span className="mx-auto flex items-center gap-3">
                    <span className="h-px w-8 bg-accent-flow/40" />
                    Pricing
                    <span className="h-px w-8 bg-accent-flow/40" />
                  </span>
                </SectionLabel>
                <h2
                  className="text-3xl sm:text-[2.25rem] font-bold text-text-primary tracking-[-0.03em] leading-[1.12]"
                  style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
                >
                  Start free. Upgrade when ready.
                </h2>
                <p className="text-text-secondary/60 mt-3 text-base">
                  No trials, no bait-and-switch. The free plan is genuinely useful.
                </p>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Free */}
              <Reveal>
                <div className="relative p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col h-full hover:border-white/[0.10] transition-colors duration-300">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-text-primary/90">Free</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-semibold text-text-primary font-mono">$0</span>
                      <span className="text-sm text-text-muted/40">/forever</span>
                    </div>
                    <p className="text-sm text-text-secondary/50 mt-1.5">Everything you need to get started.</p>
                  </div>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {freePlanFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-white/[0.03] flex items-center justify-center mt-0.5 shrink-0">
                          <Check className="w-2.5 h-2.5 text-text-muted/40" />
                        </div>
                        <span className="text-sm text-text-secondary/60">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className="h-10 rounded-lg bg-white/[0.08] border border-white/[0.10] text-text-primary text-[13px] font-medium inline-flex items-center justify-center hover:bg-white/[0.12] hover:border-white/[0.14] transition-all cta-press focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
                  >
                    Start for free
                  </Link>
                </div>
              </Reveal>

              {/* Pro */}
              <Reveal delay={0.06}>
                <div className="relative p-6 rounded-xl border border-accent-flow/[0.15] bg-accent-flow/[0.02] flex flex-col h-full hover:border-accent-flow/[0.25] transition-colors duration-300">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-flow/30 to-transparent" />

                  <div className="absolute top-4 right-4">
                    <div className="bg-accent-flow/[0.08] border border-accent-flow/[0.12] rounded-full px-2 py-0.5">
                      <span className="text-[9px] font-medium text-accent-flow/60 uppercase tracking-wider">Popular</span>
                    </div>
                  </div>

                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-text-primary/90">Pro</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-semibold text-text-primary font-mono">$9</span>
                      <span className="text-sm text-text-muted/40">/month</span>
                    </div>
                    <p className="text-sm text-text-secondary/50 mt-1.5">Unlock the full toolkit.</p>
                  </div>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {proPlanFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-accent-flow/[0.06] flex items-center justify-center mt-0.5 shrink-0">
                          <Check className="w-2.5 h-2.5 text-accent-flow/60" />
                        </div>
                        <span className="text-sm text-text-secondary/60">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className="group h-10 rounded-lg bg-accent-flow text-white text-[13px] font-medium inline-flex items-center justify-center hover:brightness-110 transition-all cta-press focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
                  >
                    Upgrade to Pro
                    <ArrowRight size={13} className="ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                  <p className="text-[11px] text-text-muted/30 mt-2.5 text-center">Or $149 for lifetime access</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="relative py-28">
          <div className="max-w-5xl mx-auto px-6">
            <Reveal>
              <div className="relative rounded-2xl border border-white/[0.05] bg-white/[0.01] overflow-hidden">
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at 30% 50%, rgba(124,106,255,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(78,205,196,0.03) 0%, transparent 60%)',
                  }}
                />
                <div className="absolute inset-0 landing-grid-bg opacity-15 pointer-events-none" />

                <div className="relative px-8 sm:px-14 py-16 sm:py-20 text-center">
                  <h2
                    className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-text-primary tracking-[-0.03em] leading-[1.1] max-w-xl mx-auto"
                    style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
                  >
                    Your brain is not broken.
                    <br />
                    <span className="text-gradient-accent">Your tools were.</span>
                  </h2>
                  <p className="text-text-secondary/70 mt-6 text-[17px] max-w-md mx-auto leading-[1.7]">
                    Built by someone with ADHD, for people with ADHD. A system that works with your brain, not against it.
                  </p>
                  <div className="mt-8">
                    <Link
                      href="/signup"
                      className="group bg-accent-flow text-white h-11 px-7 rounded-xl inline-flex items-center font-medium text-[15px] hover:brightness-110 transition-all glow-accent cta-press focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
                    >
                      Start for free
                      <ArrowRight size={15} className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative py-10 border-t border-white/[0.03]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-accent-flow/[0.08] flex items-center justify-center">
                <Brain size={10} className="text-accent-flow/60" />
              </div>
              <span
                className="text-[13px] font-bold text-text-muted/40"
                style={{ fontFamily: 'var(--font-display), var(--font-sans)' }}
              >
                NeuroFlow
              </span>
            </div>

            <div className="flex items-center gap-5 text-xs text-text-muted/40">
              <Link href="/login" className="hover:text-text-primary/60 transition-colors">Sign in</Link>
              <Link href="/privacy" className="hover:text-text-primary/60 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-text-primary/60 transition-colors">Terms</Link>
              <a href="https://x.com/neuroflowapp" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary/60 transition-colors">
                Twitter
              </a>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/[0.02] text-center">
            <p className="text-[11px] text-text-muted/20">
              &copy; {new Date().getFullYear()} NeuroFlow. Made with focus for the ADHD community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
