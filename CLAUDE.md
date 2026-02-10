# CLAUDE.md — NeuroFlow

> NeuroFlow is an ADHD-specific productivity app — an "external prefrontal cortex."
> Every pixel, interaction, and word must serve the ADHD brain. No decoration without function.

---

## Project Identity

- **What**: Dark-mode productivity app for adults with ADHD
- **Who**: Adults (25-45) diagnosed or self-identified with ADHD who've tried generic tools and bounced off them
- **Why**: Existing tools assume neurotypical executive function. NeuroFlow externalizes it.
- **Aesthetic DNA**: Linear × Raycast × Notion — signal-dense, dark, quietly luxurious. Never playful-cute. Never corporate-sterile.

---

## Tech Stack

| Layer       | Tech                                           |
|-------------|-------------------------------------------------|
| Framework   | Next.js 16 (App Router, React 19)              |
| Styling     | Tailwind CSS v4 (CSS-first config)              |
| State       | Zustand (4 stores: tasks, profile, session, UI) |
| Auth & DB   | Supabase (SSR auth, Postgres)                   |
| AI          | Anthropic Claude (coaching, breakdowns)         |
| Animation   | Framer Motion                                   |
| Audio       | Tone.js (focus soundscapes)                     |
| Drag & Drop | @dnd-kit                                        |
| Icons       | Lucide React                                    |

---

## Design Rules — Read Before Every Component

### 1. Dark-Only, Three-Layer Depth

```
bg-primary:   #0B0B0F  — page canvas
bg-secondary: #141419  — cards, sidebar, panels
bg-tertiary:  #1C1C25  — elevated: modals, dropdowns, hover surfaces
```

- **NEVER** use white/light backgrounds anywhere in the app
- Depth comes from background layers, NOT box-shadows or borders
- Borders: `white/[0.06]` to `white/[0.10]` max — whisper-thin, never harsh
- Shadows: Use sparingly. Only on modals/popovers, and make them `black/40` with wide spread

### 2. Energy-Coded Color System

Colors are FUNCTIONAL, not decorative. Every color maps to an energy state:

```
--accent-flow:  #7C6AFF  (purple)  → Flow state, primary actions, brand
--accent-grow:  #4ECDC4  (teal)    → Success, high energy, growth
--accent-sun:   #FFD93D  (yellow)  → Medium energy, warmth, caution
--accent-spark: #FF6B6B  (red)     → Low energy, danger, delete
--accent-bloom: #FF8ED4  (pink)    → Positive reinforcement, celebration
```

Rules:
- Tasks, time blocks, and habits ALWAYS show their energy color as a left border, dot, or indicator
- Interactive elements use `accent-flow` (purple) as default
- Success states use `accent-grow` (teal), NEVER generic green
- Destructive actions use `accent-spark` (red)
- NEVER use color purely for decoration. If a color appears, it means something.

### 3. Typography

```
Syne (700/800)      — Display headlines, landing page hero, section titles
Inter                — All UI body text, labels, descriptions
JetBrains Mono      — Timers, streaks, stats, XP numbers (use tabular-nums)
```

- Syne is ONLY for display/marketing. Never in the app UI body.
- Inter is the workhorse. Keep it clean.
- JetBrains Mono adds "data terminal" feel to numbers — always use for anything countable.
- Text colors: `white/[0.9]` primary, `white/[0.5]` secondary, `white/[0.3]` tertiary/disabled

### 4. Spacing & Layout

- Base unit: 4px (use Tailwind's default scale)
- Page padding: `p-6` on desktop, `p-4` on mobile
- Card padding: `p-5` standard, `p-4` compact
- Gap between cards/sections: `gap-4` standard, `gap-6` between major sections
- Sidebar width: `w-64` expanded, `w-16` collapsed
- Max content width: `max-w-4xl` for single-column views, full-width for dashboards

### 5. Motion Principles

```
Transition defaults: duration-200 ease-out
Page transitions:    Framer Motion, fade + subtle Y translate (8px)
Micro-interactions:  Scale on press (0.98), opacity on hover
Celebrations:        Confetti/particles ONLY on meaningful milestones
Loading:             Skeleton shimmer, never spinners (except buttons)
```

- Motion should feel like breathing — smooth, organic, never bouncy or elastic
- Stagger children by 50ms on list reveals
- NEVER animate layout shifts that cause content to jump
- Reduced motion: respect `prefers-reduced-motion`, fall back to opacity-only

### 6. Interaction States

```
Default:   bg-transparent or bg-secondary
Hover:     bg-white/[0.04]
Active:    bg-white/[0.06] OR left accent-flow border
Focus:     ring-2 ring-accent-flow/50 ring-offset-2 ring-offset-bg-primary
Disabled:  opacity-40, pointer-events-none
Selected:  bg-accent-flow/10, border-accent-flow
```

### 7. ADHD-Specific UX Mandates

These are NON-NEGOTIABLE design constraints:

- **Information density over hidden menus**: Show data upfront. Collapse is okay, hide is not.
- **One primary action per view**: Every screen has ONE obvious thing to do. Make it unmissable.
- **No guilt, ever**: Copy must never shame. "You missed 3 habits" → "You completed 2 habits today!"
- **Transitions are dangerous**: Moving between contexts is hard for ADHD. Minimize page changes. Use modals/slide-overs for quick actions.
- **Capture everywhere**: Quick-add must be accessible from ANY screen (Cmd+K or floating button)
- **Time is visual**: Always show time as blocks/bars/rings, never just numbers
- **Celebrate small wins**: Micro-celebrations (checkmark animation, XP pop) on EVERY completion

---

## Component Conventions

### File Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Authenticated app routes
│   │   ├── today/
│   │   ├── tasks/
│   │   ├── focus/
│   │   ├── plan/
│   │   ├── habits/
│   │   ├── reflect/
│   │   └── ...
│   ├── (auth)/             # Login/signup
│   └── (marketing)/        # Landing page
├── components/
│   ├── ui/                 # Primitives: Button, Card, Input, Modal, Badge
│   ├── layout/             # AppShell, Sidebar, TopBar, MobileNav
│   ├── tasks/              # Task-specific components
│   ├── focus/              # Timer, Soundscape, ParkingLot
│   ├── habits/             # HabitGrid, StreakCounter
│   └── shared/             # Cross-domain: EnergyBadge, QuickCapture
├── stores/                 # Zustand stores
├── lib/                    # Supabase client, AI helpers, utils
├── types/                  # TypeScript types, database types
└── styles/                 # Global CSS, Tailwind config
```

### Naming
- Components: PascalCase (`TimerRing.tsx`)
- Hooks: camelCase with `use` prefix (`useTaskStore.ts`)
- Utils: camelCase (`formatDuration.ts`)
- Types: PascalCase (`EnergyLevel`, `TaskStatus`)
- CSS variables: kebab-case (`--accent-flow`)

### Component Pattern
```tsx
// Always: named export, Props interface, forwardRef for primitives
interface TaskCardProps {
  task: Task
  onComplete?: (id: string) => void
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  // Zustand selectors at top
  // Derived state next
  // Handlers next
  // Return JSX
}
```

### Do NOT:
- Use `any` type — ever
- Create god components over 200 lines — split them
- Put business logic in components — use stores/hooks
- Import from parent directories (`../../`) — use `@/` alias
- Use inline styles — Tailwind only
- Use generic green/red — use the energy color tokens

---

## AI Coach Personality

When writing prompts or copy for the AI features:

- **Tone**: Warm, direct, gently funny. Like a friend who also has ADHD.
- **Never**: Guilt, shame, "you should have," "you failed to," passive aggression
- **Always**: Celebrate what WAS done, normalize struggle, suggest breaks
- **Format**: Short paragraphs, use emoji sparingly, never walls of text
- **Example**: "You crushed 4 tasks today — and honestly, that parking lot capture during your focus session? Chef's kiss. Tomorrow, maybe front-load that report when your energy's fresh."

---

## Quality Checklist

Before considering any component done:

- [ ] Works on mobile (375px+) and desktop
- [ ] Energy colors applied correctly (not decorative)
- [ ] Keyboard navigable (Tab, Enter, Escape)
- [ ] Loading states (skeleton, not spinner)
- [ ] Empty states (helpful, never blank)
- [ ] Error states (kind, never scary)
- [ ] Dark theme consistent (no white flashes, no wrong bg level)
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Copy is ADHD-friendly (no guilt, no overwhelm)
- [ ] TypeScript strict — no `any`, no `@ts-ignore`
