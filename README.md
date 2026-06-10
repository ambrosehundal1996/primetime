# Primetime

**What you said you'd do vs what you actually did.**

A personal execution tracking and accountability system. Not a todo app. Not a calendar app. A personal operating system for measuring and improving execution.

## Features

- **Weekly Goals** — Set commitments with priorities (P0/P1/P2) and track progress
- **Action Tasks** — Daily executable work units with full audit trail
- **Daily Planning** — AI-powered scheduling based on calendar availability and goal pace
- **Execution Metrics** — Execution rate, planning accuracy, priority reliability
- **Agent Chat** — Accountability coach that reads your data and holds you to commitments
- **Daily/Weekly Summaries** — Automated reflections on planned vs actual
- **Behavioral Insights** — Long-term pattern detection from execution history
- **Google Calendar** — Read-only integration for availability (not source of truth)

## Tech Stack

- **Frontend:** Next.js 15, React, Tailwind CSS
- **Backend:** Next.js Route Handlers, Server Actions
- **Database:** Supabase Postgres
- **AI:** OpenAI Agents SDK
- **Calendar:** Google Calendar API
- **Deploy:** Vercel + Cron Jobs

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Fill in your Supabase and OpenAI credentials

# Run database migration
# Copy supabase/migrations/001_initial_schema.sql into Supabase SQL editor

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to the Today dashboard.

## Environment Variables

See [`.env.example`](.env.example) for all required variables:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side DB access |
| `OPENAI_API_KEY` | Yes | Agent chat + reflections |
| `GOOGLE_CLIENT_ID` | No | Calendar integration |
| `GOOGLE_CLIENT_SECRET` | No | Calendar integration |
| `GOOGLE_REFRESH_TOKEN` | No | Calendar integration |
| `CRON_SECRET` | Deploy | Protects cron endpoints |

## Project Structure

```
src/
├── app/           # Pages (today, goals, calendar, chat, insights) + API routes
├── actions/       # Server Actions for client mutations
├── agent/         # OpenAI Agent, prompts, tool definitions
├── components/    # React UI components
├── lib/           # Utilities, Supabase client, date helpers
├── services/      # Business logic (goals, tasks, metrics, planning, calendar)
└── types/         # TypeScript types matching DB schema
supabase/
└── migrations/    # SQL schema
docs/              # Architecture, wireframes, roadmap
```

## Architecture

The database is the source of truth. The LLM reads state via tools and proposes actions — it never owns state. All calculations (metrics, progress, availability) are deterministic backend code.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

## Cron Jobs

| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| 6:00 AM daily | `/api/cron/daily-plan` | Generate tasks from goals + schedule |
| 9:00 PM daily | `/api/cron/daily-summary` | End-of-day execution summary |
| 8:00 PM Sunday | `/api/cron/weekly-summary` | Weekly review + insights |

## AI Agent

The `/chat` tab runs an accountability agent powered by the OpenAI Agents SDK. It reads your Supabase data and Google Calendar through tools — it never owns state itself.

See **[docs/AGENT.md](docs/AGENT.md)** for full documentation: permissions, tools, workflows, and limitations.

**13 tools:** `get_active_goals` · `get_goal_progress` · `get_tasks_for_day` · `get_tasks_for_week` · `get_calendar_availability` · `create_weekly_goal` · `create_task` · `update_task_status` · `log_task_progress` · `generate_daily_plan` · `generate_daily_summary` · `generate_weekly_summary` · `get_behavior_insights`

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System design, data flow, layer separation
- [AI Agent](docs/AGENT.md) — How the agent works, permissions, and workflows
- [Wireframes](docs/WIREFRAMES.md) — Dashboard UI layouts
- [Roadmap](docs/ROADMAP.md) — MVP phases and future features
- [Google Calendar Setup](docs/GOOGLE_CALENDAR_SETUP.md) — OAuth and refresh token guide

## License

Private — personal use only.
