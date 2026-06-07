# MVP Implementation Roadmap

## Phase 1: Foundation (Week 1) ✅

**Goal:** Runnable app with database, core logic, and basic UI.

- [x] Next.js 15 project setup with Tailwind CSS
- [x] Supabase schema + SQL migration
- [x] TypeScript types for all entities
- [x] Supabase client (browser + server)
- [x] Deterministic metrics engine
- [x] Goal and task services with audit trail
- [x] Basic dashboard UI (Today, Goals, Calendar, Chat, Insights)
- [x] Environment variable template

**Exit criteria:** App runs locally, pages render (empty state without Supabase config).

---

## Phase 2: Agent + Planning (Week 2)

**Goal:** AI agent can plan days, manage tasks, and hold user accountable.

- [x] OpenAI Agent with 11 tool definitions
- [x] Agent chat UI with suggested prompts
- [x] Daily planning engine (calendar + priority + pace)
- [x] Conversation storage in Supabase
- [ ] End-to-end test: "Plan my day" → tasks created and scheduled
- [ ] End-to-end test: "Mark algorithms complete" → status updated + goal progress

**Exit criteria:** User can chat with agent to plan day, create tasks, log progress.

---

## Phase 3: Calendar + Cron (Week 3)

**Goal:** Automated daily/weekly workflows run on schedule.

- [x] Google Calendar read integration
- [x] Available slot detection
- [x] Vercel cron jobs (daily plan, daily summary, weekly summary)
- [ ] Google OAuth setup guide
- [ ] Test cron endpoints locally
- [ ] Deploy to Vercel with cron enabled

**Exit criteria:** 6 AM auto-plan, 9 PM auto-summary, Sunday weekly summary all work in production.

---

## Phase 4: Summaries + Insights (Week 4)

**Goal:** Rich reflections and behavioral pattern detection.

- [x] Daily summary generation (deterministic + AI reflection)
- [x] Weekly summary generation
- [x] Behavioral insight detection (productivity windows, estimation accuracy, miss patterns)
- [ ] Daily summary UI page
- [ ] Weekly summary UI page
- [ ] Insight refresh on weekly cron

**Exit criteria:** User sees daily reflection and weekly insights without asking.

---

## Phase 5: Polish + Hardening (Week 5)

**Goal:** Production-ready single-user experience.

- [ ] Goal creation form in UI (not just via agent)
- [ ] Task quick-actions (complete, skip, reschedule) from Today view
- [ ] Error boundaries and loading states
- [ ] Mobile-responsive layout
- [ ] Seed data script for demo/testing
- [ ] README with full setup instructions

**Exit criteria:** App is usable daily without touching code or agent for basic operations.

---

## Future (Post-MVP)

| Feature | Priority | Notes |
|---------|----------|-------|
| Authentication | Medium | Supabase Auth when multi-device needed |
| Task timer (in_progress tracking) | Medium | Start/pause with elapsed time |
| Weekly goal creation wizard | Medium | Structured onboarding each Monday |
| Historical trend charts | Medium | Execution rate over time |
| Notification reminders | Low | Push/email before scheduled tasks |
| Export data (CSV/JSON) | Low | Data portability |
| Multi-week goal tracking | Low | Goals spanning multiple weeks |
| Custom priority levels | Low | Beyond P0/P1/P2 |
| Integration with Apple Health / fitness | Low | Auto-track gym attendance |
| Voice interface | Low | Previously excluded (no Vapi) |

---

## Setup Checklist

```bash
# 1. Clone and install
git clone <repo> && cd primetime && npm install

# 2. Create Supabase project
#    Run supabase/migrations/001_initial_schema.sql in SQL editor

# 3. Configure environment
cp .env.example .env.local
# Fill in Supabase URL, keys, OpenAI key

# 4. Google Calendar (optional)
#    Create OAuth2 credentials in Google Cloud Console
#    Generate refresh token via OAuth playground
#    Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN

# 5. Run locally
npm run dev

# 6. Deploy to Vercel
vercel deploy
# Set all env vars in Vercel dashboard
# CRON_SECRET is required for cron endpoints
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Database owns state, not LLM | Prevents hallucinated tasks/goals, ensures auditability |
| Deterministic metrics | Reproducible, testable, no LLM cost for math |
| Google Calendar read-only | Calendar is availability input, not source of truth |
| Single-user, no auth | Minimizes MVP complexity |
| Task event audit trail | Never lose execution history, powers analytics |
| Agent tools as bridge | Clean separation between AI reasoning and app logic |
| Vercel cron over external scheduler | Zero additional infrastructure |
