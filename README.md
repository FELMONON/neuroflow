# NeuroFlow

**An external prefrontal cortex for ADHD brains.**

NeuroFlow is an ADHD-specific productivity app that replaces generic task managers with tools designed around how neurodivergent brains actually work — dopamine-aware scheduling, AI-assisted executive function, and built-in accountability structures.

---

## The Problem

Traditional productivity apps assume a neurotypical brain: one that can prioritize on demand, sustain focus through willpower, and self-regulate dopamine. For people with ADHD, these apps become yet another source of guilt and abandoned systems.

ADHD brains need:

- **External structure** — planning and reflection routines that don't rely on remembering to plan
- **Dopamine management** — awareness of reward-seeking patterns and healthy alternatives
- **Reduced activation energy** — AI that breaks overwhelming tasks into startable pieces
- **Accountability without shame** — body doubling, gamification, and gentle nudges instead of red overdue badges

NeuroFlow builds all of this into a single app.

---

## Features

### Planning & Reflection
- **Morning Planning** — AI-generated daily plans based on your tasks, energy, and patterns
- **Evening Reflection** — Guided end-of-day reviews to build self-awareness over time

### Task Management
- **Smart Task Lists** — Tasks with ADHD-friendly prioritization
- **AI Task Breakdown** — Overwhelmed by a task? AI splits it into concrete, startable subtasks
- **Quick Capture** — Global capture modal so fleeting thoughts don't disappear
- **AI Capture Classification** — Automatically categorize and route captured items

### Focus & Accountability
- **Focus Sessions** — Timer-based deep work sessions with session history
- **Body Doubling Rooms** — Virtual co-working spaces for accountability
- **AI Coaching Nudges** — Context-aware prompts to keep momentum without nagging

### Dopamine & Habits
- **Dopamine Menu** — A personalized list of healthy dopamine alternatives for when the brain is seeking stimulation
- **Habit Tracking** — Track routines with streaks and visual progress

### Gamification
- **Achievements** — Unlock milestones for consistency, not perfection

### Account & Settings
- **Onboarding Flow** — Guided setup for new users
- **Auth** — Email/password, magic link, and password recovery
- **Account Management** — Settings, account deletion, privacy policy, and terms

---

## Tech Stack

| Technology | Why |
|---|---|
| **Next.js 16** | App Router with React Server Components for fast initial loads and server-side AI calls |
| **React 19** | Latest concurrent features and server component support |
| **Supabase** | Auth, Postgres database, and real-time subscriptions without managing infrastructure |
| **Zustand** | Lightweight client state — no boilerplate, works naturally with React 19 |
| **pnpm** | Fast, disk-efficient package management with workspace support |
| **PLpgSQL** | Database migrations and server-side logic living close to the data |
| **GitHub Actions** | CI pipeline for automated checks |

---

## Architecture

NeuroFlow uses a **feature-based architecture** where code is organized by domain rather than by technical role:

```
src/
├── app/
│   ├── app/                    # Authenticated app routes
│   │   ├── tasks/              # Task management
│   │   ├── focus/              # Focus sessions & timer
│   │   │   └── [sessionId]/    # Individual session view
│   │   ├── habits/             # Habit tracking
│   │   ├── achievements/       # Gamification & milestones
│   │   ├── dopamine-menu/      # Healthy dopamine alternatives
│   │   ├── body-double/        # Virtual co-working rooms
│   │   ├── plan/               # Morning planning
│   │   ├── reflect/            # Evening reflection
│   │   └── settings/           # User settings
│   ├── api/
│   │   ├── ai/
│   │   │   ├── morning-plan/       # AI daily plan generation
│   │   │   ├── evening-reflection/ # AI reflection prompts
│   │   │   ├── break-down-task/    # AI task decomposition
│   │   │   ├── classify-capture/   # AI capture classification
│   │   │   └── coach-nudge/        # AI coaching nudges
│   │   └── gamification/           # Achievement & XP logic
│   ├── (auth)/                 # Auth routes (login, signup, etc.)
│   └── (marketing)/            # Landing, privacy, terms
├── components/
│   └── features/
│       └── capture/            # Quick capture modal
└── ...
```

Each feature owns its routes, components, and API endpoints. Shared UI components and utilities live in `src/components/` and `src/lib/`.

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/FelmonFekadu/neuroflow.git
cd neuroflow

# Copy environment variables
cp .env.example .env.local

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Environment Setup

NeuroFlow requires a Supabase project for auth and data storage. See **[SUPABASE-SETUP-INSTRUCTIONS.md](./SUPABASE-SETUP-INSTRUCTIONS.md)** for detailed setup steps including:

- Creating a Supabase project
- Configuring environment variables
- Running database migrations

---

## License

[MIT](./LICENSE)
