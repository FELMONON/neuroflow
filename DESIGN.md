# DESIGN.md — NeuroFlow Design System

> "An external prefrontal cortex." — Every design decision either reduces cognitive load or increases dopamine. If it does neither, cut it.

---

## 1. Design Philosophy

### The Three Principles

**1. Signal, Not Noise**
Every visual element must carry information. A purple dot means "flow-state energy." A teal border means "high energy." If a color, shape, or animation doesn't communicate something, it's noise. Remove it.

**2. Calm Structure, Not Rigid Structure**
ADHD brains need scaffolding but rebel against prison walls. The UI should feel like a well-organized workshop — everything has a place, but you're free to move things around. Think "suggested order" not "mandatory sequence."

**3. Celebrate the Attempt**
Neurotypical apps reward completion. NeuroFlow rewards engagement. Started a focus session but quit after 5 minutes? That's 5 minutes you didn't have before. The UI should reflect this — progress indicators that show partial completion as meaningful, not failed.

---

## 2. Color System — Deep Reference

### Why These Specific Colors

| Token         | Hex       | HSL              | Rationale |
|---------------|-----------|------------------|-----------|
| `accent-flow` | `#7C6AFF` | 248 100% 71%   | Purple = creativity, focus, flow. Dominant brand identity. High contrast on dark bg without being aggressive. |
| `accent-grow` | `#4ECDC4` | 174 57% 56%    | Teal = growth, calm success. Softer than pure green. Signals "good job" without clinical pass/fail energy. |
| `accent-sun`  | `#FFD93D` | 47 100% 62%    | Warm yellow = medium energy, approachable caution. Visible but not alarming. Maps to "I have some energy." |
| `accent-spark`| `#FF6B6B` | 0 100% 71%     | Warm red = low energy / destructive. Deliberately softened from pure red. Signals "careful" not "DANGER." |
| `accent-bloom`| `#FF8ED4` | 326 100% 78%   | Pink = celebration, positive reinforcement. Unexpected and delightful. Used for achievements, streaks. |

### Color Application Rules

```
Backgrounds:
  - Primary actions:     bg-accent-flow          (solid purple button)
  - Primary hover:       bg-accent-flow/80       (slightly transparent)
  - Subtle indicators:   bg-accent-flow/10       (tinted surface)
  - Energy tag surfaces: bg-{energy-color}/10    (match task energy)

Borders:
  - Active nav item:     border-l-2 border-accent-flow
  - Energy indicators:   border-l-3 border-{energy-color}
  - Card hover:          border-white/[0.10]
  - Card default:        border-white/[0.06]

Text:
  - Primary:             text-white/[0.9]
  - Secondary:           text-white/[0.5]
  - Tertiary/hint:       text-white/[0.3]
  - Links/interactive:   text-accent-flow
  - Success text:        text-accent-grow
  - Warning text:        text-accent-sun
  - Error text:          text-accent-spark
  - Celebration text:    text-accent-bloom

Icons:
  - Default:             text-white/[0.4]
  - Hover:               text-white/[0.7]
  - Active:              text-accent-flow
  - Match energy state when contextual
```

### Energy-to-Color Mapping

This is the core UX pattern. Every task, time block, and habit carries an energy level:

```
high     -> accent-grow  (#4ECDC4)  "I'm wired, give me the hard stuff"
medium   -> accent-sun   (#FFD93D)  "I'm okay, can handle moderate tasks"
low      -> accent-spark (#FF6B6B)  "Running on fumes, keep it simple"
recharge -> accent-flow  (#7C6AFF)  "I need to restore — break, walk, nap"
```

Visual treatment for energy-tagged items:
```tsx
// Task card with energy indicator
<div className="flex items-start gap-3 p-4 bg-secondary rounded-xl border border-white/[0.06]">
  <div className="w-1.5 h-1.5 mt-2 rounded-full bg-accent-grow" />  {/* energy dot */}
  <div>
    <p className="text-white/[0.9] text-sm font-medium">Write project proposal</p>
    <p className="text-white/[0.4] text-xs mt-0.5">High energy . 45 min</p>
  </div>
</div>
```

---

## 3. Typography — Deep Reference

### Font Stack

```css
/* In Tailwind CSS v4 / global CSS */
--font-display: 'Syne', sans-serif;        /* 700, 800 only */
--font-body: 'Inter', sans-serif;           /* 400, 500, 600 */
--font-mono: 'JetBrains Mono', monospace;   /* 400, 500 */
```

### Type Scale

```
Display XL:  Syne 800    2.5rem/1.1   tracking-tight   -> Landing hero
Display L:   Syne 700    2rem/1.15    tracking-tight   -> Landing sections
Heading 1:   Inter 600   1.5rem/1.3   tracking-tight   -> Page titles
Heading 2:   Inter 600   1.125rem/1.4 tracking-normal  -> Section titles
Heading 3:   Inter 500   1rem/1.4     tracking-normal  -> Card titles
Body:        Inter 400   0.875rem/1.5 tracking-normal  -> Main content
Body Small:  Inter 400   0.8125rem/1.5 tracking-normal -> Secondary info
Caption:     Inter 400   0.75rem/1.4  tracking-wide    -> Labels, hints
Mono:        JBMono 500  0.875rem/1.4 tabular-nums     -> Timers, stats
Mono Small:  JBMono 400  0.75rem/1.4  tabular-nums     -> XP, streaks
```

### Typography Rules

- **NEVER use Syne inside the app UI**. Syne is for the landing page and marketing only.
- **ALWAYS use JetBrains Mono for numbers** that change: timers, XP, streaks, stats, percentages.
- **Line heights are tight**. ADHD users scan, not read. Dense but breathable.
- **Uppercase text**: Only for tiny labels (`text-xs uppercase tracking-widest text-white/[0.3]`).
- **Bold sparingly**: Use `font-medium` (500) for emphasis, `font-semibold` (600) for titles only.

---

## 4. Surface & Elevation System

### The Three Layers

```
Layer 0 — Canvas     #0B0B0F   bg-primary     The void. Page background.
Layer 1 — Surface    #141419   bg-secondary   Cards, sidebar, panels. Where content lives.
Layer 2 — Elevated   #1C1C25   bg-tertiary    Modals, dropdowns, tooltips, hover states.
```

### Why No Shadows?

Traditional shadow-based elevation is noisy on dark backgrounds. Instead:
- Depth = background color shift (darker -> lighter = further forward)
- Separation = ultra-subtle borders (`border-white/[0.06]`)
- Focus = backdrop blur for modals (`backdrop-blur-xl bg-black/60`)

### Surface Patterns

```tsx
// Standard card
<div className="bg-secondary rounded-xl border border-white/[0.06] p-5">

// Elevated card (on hover or important)
<div className="bg-tertiary rounded-xl border border-white/[0.08] p-5">

// Modal overlay
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm">
  <div className="bg-tertiary rounded-2xl border border-white/[0.10] p-6 shadow-2xl shadow-black/40">

// Sidebar
<aside className="bg-secondary border-r border-white/[0.06] w-64">

// Input field
<input className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2
                   focus:border-accent-flow/50 focus:ring-2 focus:ring-accent-flow/20
                   text-white/[0.9] placeholder:text-white/[0.3]" />
```

---

## 5. Component Patterns

### Buttons

```tsx
// Primary — main actions
<button className="bg-accent-flow hover:bg-accent-flow/80 text-white
                   px-4 py-2 rounded-lg font-medium text-sm
                   transition-all duration-200
                   active:scale-[0.98]">
  Start Focus Session
</button>

// Secondary — alternative actions
<button className="bg-white/[0.06] hover:bg-white/[0.10] text-white/[0.8]
                   px-4 py-2 rounded-lg font-medium text-sm
                   border border-white/[0.08]
                   transition-all duration-200">
  View All Tasks
</button>

// Ghost — minimal actions
<button className="hover:bg-white/[0.04] text-white/[0.5] hover:text-white/[0.8]
                   px-3 py-1.5 rounded-lg text-sm
                   transition-all duration-200">
  Skip
</button>

// Danger — destructive actions
<button className="bg-accent-spark/10 hover:bg-accent-spark/20 text-accent-spark
                   px-4 py-2 rounded-lg font-medium text-sm
                   border border-accent-spark/20
                   transition-all duration-200">
  Delete Task
</button>
```

### Cards — The Core Container

```tsx
// Standard task card
<div className="group bg-secondary rounded-xl border border-white/[0.06]
               hover:border-white/[0.10] transition-all duration-200 p-4">
  <div className="flex items-center gap-3">
    {/* Completion checkbox */}
    <button className="w-5 h-5 rounded-full border-2 border-white/[0.2]
                       hover:border-accent-flow transition-colors
                       flex items-center justify-center">
      {/* Checkmark icon on complete */}
    </button>

    {/* Energy dot */}
    <div className="w-2 h-2 rounded-full bg-accent-grow" />

    {/* Content */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white/[0.9] truncate">Task name</p>
      <p className="text-xs text-white/[0.4] mt-0.5">High energy . 30 min</p>
    </div>

    {/* Actions (visible on hover) */}
    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="p-1 hover:bg-white/[0.06] rounded-md">
        <MoreHorizontal className="w-4 h-4 text-white/[0.4]" />
      </button>
    </div>
  </div>
</div>
```

### Sidebar Navigation

```tsx
// Nav item — inactive
<a className="flex items-center gap-3 px-3 py-2 rounded-lg
              text-white/[0.5] hover:text-white/[0.8] hover:bg-white/[0.04]
              transition-all duration-200 text-sm">
  <Calendar className="w-4 h-4" />
  <span>Today</span>
</a>

// Nav item — active
<a className="flex items-center gap-3 px-3 py-2 rounded-lg
              text-accent-flow bg-accent-flow/10
              border-l-2 border-accent-flow
              text-sm font-medium">
  <Calendar className="w-4 h-4" />
  <span>Today</span>
</a>
```

### Empty States

Every view needs one. Never show a blank screen.

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-12 h-12 rounded-full bg-accent-flow/10 flex items-center justify-center mb-4">
    <Inbox className="w-6 h-6 text-accent-flow" />
  </div>
  <h3 className="text-sm font-medium text-white/[0.8] mb-1">No tasks yet</h3>
  <p className="text-xs text-white/[0.4] max-w-[240px] mb-4">
    Capture what's on your mind — we'll help you break it down.
  </p>
  <button className="bg-accent-flow hover:bg-accent-flow/80 text-white
                     px-4 py-2 rounded-lg text-sm font-medium transition-all">
    Add your first task
  </button>
</div>
```

---

## 6. Animation Reference

### Framer Motion Defaults

```tsx
// Standard page transition
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }

// Staggered list
const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } }
}
const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } }
}

// Card hover (use CSS for this, not Framer)
// -> scale-[1.01] on hover, duration-200

// Completion celebration
const checkVariants = {
  initial: { scale: 0, rotate: -45 },
  animate: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 400, damping: 15 } }
}
```

### Micro-Interactions

```
Button press:     active:scale-[0.98]           CSS only
Card hover:       hover:border-white/[0.10]     CSS only
Nav highlight:    bg-accent-flow/10             CSS only
Checkbox check:   Spring animation              Framer Motion
Task complete:    Strikethrough + fade           Framer Motion
XP gain:          Number count-up + pop          Framer Motion
Timer tick:       SVG stroke-dashoffset          Framer Motion
Modal open:       Scale 0.95->1 + fade           Framer Motion
Toast appear:     Slide in from top + auto-close Framer Motion
```

### What NOT to Animate

- Layout shifts that move content the user is reading
- Color changes on text (jarring for ADHD)
- Continuous/looping animations (distracting)
- Anything longer than 400ms (feels sluggish)

---

## 7. Responsive Strategy

### Breakpoints

```
Mobile:     < 768px    Single column, bottom nav, full-width cards
Tablet:     768-1024px Collapsible sidebar, 2-column where useful
Desktop:    > 1024px   Full sidebar, multi-column dashboard
```

### Mobile-Specific Rules

- Bottom tab navigation (5 primary items + "More" overflow)
- Full-width cards, no horizontal scrolling
- Quick-capture via floating action button (bottom-right)
- Modals become full-screen sheets (slide up from bottom)
- Timer ring scales down but stays usable
- Swipe gestures: left to complete, right to reschedule

### Desktop-Specific

- Sidebar always visible (collapsible to icon-only)
- Keyboard shortcuts prominent (Cmd+K for quick capture)
- Hover states for progressive disclosure
- Multi-column layouts for Today dashboard

---

## 8. Gamification Visual Language

### XP & Levels

```
Display: JetBrains Mono, accent-bloom for XP numbers
Bar:     Rounded-full, bg-white/[0.06] track, bg-accent-bloom fill
Pop:     "+15 XP" floats up and fades on task completion
```

### Streak Display

```
Active streak:    accent-grow number, flame emoji optional
Broken streak:    text-white/[0.3], no judgment copy
Best streak:      accent-bloom highlight, "Personal best!" label
```

### Achievement Badges

```
Locked:    bg-white/[0.04], grayscale icon, text-white/[0.3]
Unlocked:  bg-{category-color}/10, colored icon, celebration animation
Categories map to energy colors (streaks->grow, focus->flow, etc.)
```

---

## 9. Copy & Voice Guidelines

### The Voice

NeuroFlow speaks like a knowledgeable friend who also has ADHD. Warm but not saccharine. Direct but not bossy. The voice is:

- **Encouraging without being patronizing**: "Nice — 3 for 3 on morning habits" not "Great job! You're doing amazing!"
- **Honest without being harsh**: "Tough day. That happens. Tomorrow's a reset." not "You didn't complete any tasks."
- **Practical without being clinical**: "Your energy dips around 2pm most days — maybe schedule breaks then?" not "Data suggests suboptimal performance in afternoon hours."

### Copy Patterns

```
Empty states:     "Nothing here yet — and that's okay."
Completion:       "Done." (brief, satisfying)
Encouragement:    "You showed up. That counts."
Error:            "Something went sideways. Try again?"
Streak broken:    "Streaks reset. The habit didn't."
Session end:      "25 minutes of focus. That's real."
```

### Words to AVOID

```
"Productive"      -> too corporate
"Optimize"        -> too clinical
"Should"          -> too judgmental
"Just"            -> minimizes difficulty ("just do it")
"Simple"          -> nothing feels simple with ADHD
"Lazy"            -> never, ever, ever
"Failed"          -> reframe as "incomplete" or "paused"
```

---

## 10. Landing Page Specifics

The landing page is a separate aesthetic context from the app:

- **Font**: Syne for headlines (the ONLY place Syne appears)
- **Layout**: Long-scroll, section-based, Linear/Raycast-inspired
- **Animations**: Framer Motion scroll-triggered reveals, staggered
- **Product shots**: Static mockups, no animated demos (they distract)
- **Social proof**: Honest stats only. No fake user counts.
- **Pricing**: Free ($0 forever) and Pro ($7/mo or $149 lifetime)
- **CTA**: Single clear action per viewport — never competing buttons
- **Tone**: More aspirational than the app. "Your brain works differently. Your tools should too."
