# Dashboard Wireframes

## Navigation

```
┌──────────────────────────────────────────────────────────┐
│ ┌──────────┐  ┌──────────────────────────────────────┐ │
│ │ Primetime│  │                                      │ │
│ │          │  │         Main Content Area            │ │
│ │ Today    │  │                                      │ │
│ │ Goals    │  │                                      │ │
│ │ Calendar │  │                                      │ │
│ │ Agent    │  │                                      │ │
│ │ Insights │  │                                      │ │
│ │          │  │                                      │ │
│ │ Planned  │  │                                      │ │
│ │ vs Actual│  │                                      │ │
│ └──────────┘  └──────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Today View

Primary dashboard. Answers: "What did I commit to today? How am I doing?"

```
┌─────────────────────────────────────────────────────────┐
│ Today                                                    │
│ Friday, June 5, 2026                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │Execution │ │ Missed   │ │ Partial  │ │ Planning │   │
│ │  Rate    │ │          │ │          │ │ Accuracy │   │
│ │   62%    │ │    3     │ │    1     │ │   78%    │   │
│ │ 5 of 8   │ │ tasks    │ │ partial  │ │ est/actual│  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│ ┌─────────────────────┐ ┌─────────────────────┐       │
│ │ P0 — Critical (3)   │ │ P1 — Important (2)  │       │
│ │                     │ │                     │       │
│ │ ○ Algorithms 1hr    │ │ ● Gym session       │       │
│ │   P0 · 60m · 9:00   │ │   P1 · 45m · done   │       │
│ │                     │ │                     │       │
│ │ ○ Cold emails x3    │ │ ○ System design 1hr │       │
│ │   P0 · 30m          │ │   P1 · 60m · 2:00   │       │
│ │                     │ │                     │       │
│ │ ● Interview prep    │ │                     │       │
│ │   P0 · 90m · done   │ │                     │       │
│ └─────────────────────┘ └─────────────────────┘       │
│                                                          │
│ ┌─────────────────────┐ ┌─────────────────────┐       │
│ │ Scheduled (4)       │ │ Completed (3)       │       │
│ │ ...                 │ │ ...                 │       │
│ └─────────────────────┘ └─────────────────────┘       │
│                                                          │
│ ┌─────────────────────┐ ┌─────────────────────┐       │
│ │ Missed (2)          │ │ P2 — Nice to Have   │       │
│ │ ...                 │ │ ...                 │       │
│ └─────────────────────┘ └─────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## Weekly Goals View

Answers: "Am I on track for my weekly commitments?"

```
┌─────────────────────────────────────────────────────────┐
│ Weekly Goals                                             │
│ Jun 2 – Jun 8, 2026                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Behind Pace (2)                                          │
│ ┌─────────────────────────┐ ┌─────────────────────────┐│
│ │ Cold Emails        P0 ↓│ │ Algorithms         P0 ↓││
│ │ ████████░░░░  15/20    │ │ ██████░░░░░░  4/7 hrs  ││
│ │ Daily: 2.5 remaining   │ │ Daily: 1.0 hr remaining││
│ │ 3 days left · behind   │ │ 3 days left · behind    ││
│ └─────────────────────────┘ └─────────────────────────┘│
│                                                          │
│ On Track (2)                                             │
│ ┌─────────────────────────┐ ┌─────────────────────────┐│
│ │ Gym                P1 — │ │ Reading            P2 — ││
│ │ ██████████░░  8/10     │ │ ████████████  3/3       ││
│ │ Daily: 1.0 remaining   │ │ met                      ││
│ │ 3 days left · on track │ │                          ││
│ └─────────────────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Calendar View

Answers: "When am I free? What blocks my time?"

```
┌─────────────────────────────────────────────────────────┐
│ Friday, Jun 5                                            │
│ 4 events · 3 open slots                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Calendar Events          │  Available Slots              │
│ ┌──────────────────────┐ │ ┌──────────────────────┐   │
│ │ Team standup         │ │ │ 10:00 – 12:00        │   │
│ │ 9:00 – 9:30 AM      │ │ │ 2h free              │   │
│ ├──────────────────────┤ │ ├──────────────────────┤   │
│ │ Doctor appointment   │ │ │ 1:00 – 3:00 PM       │   │
│ │ 12:00 – 1:00 PM     │ │ │ 2h free              │   │
│ ├──────────────────────┤ │ ├──────────────────────┤   │
│ │ Founder call         │ │ │ 5:00 – 7:00 PM       │   │
│ │ 3:00 – 5:00 PM      │ │ │ 2h free              │   │
│ ├──────────────────────┤ │ └──────────────────────┘   │
│ │ Dinner with family   │ │                              │
│ │ 7:00 – 9:00 PM      │ │                              │
│ └──────────────────────┘ │                              │
└─────────────────────────────────────────────────────────┘
```

---

## Agent Chat View

Answers: "What should I do? Why am I behind? Hold me accountable."

```
┌─────────────────────────────────────────────────────────┐
│ Agent                                                    │
│ Your execution accountability coach                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│              Execution Accountability Agent               │
│     Ask me to plan your day, track progress,             │
│            or hold you accountable.                       │
│                                                          │
│   [Plan my day]  [What should I do next?]              │
│   [Why am I behind?]  [Summarize today]                  │
│                                                          │
│ ┌─────────────────────────────────────────────┐         │
│ │ You have 3 P0 tasks unscheduled today.       │         │
│ │ Cold emails are behind pace (15/20).         │         │
│ │                                             │         │
│ │ Recommended schedule:                       │         │
│ │ 10:00–11:00 Algorithms (P0, behind pace)   │         │
│ │ 1:00–1:30 Cold emails x3 (P0, behind)     │         │
│ │ 5:00–6:00 System design (P1, on track)     │         │
│ └─────────────────────────────────────────────┘         │
│                                                          │
│ ┌──────────────────────────────────┐ [Send]           │
│ │ Ask about your execution...      │                   │
│ └──────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## Insights View

Answers: "What patterns are emerging in my execution habits?"

```
┌─────────────────────────────────────────────────────────┐
│ Behavioral Insights                                      │
│ Long-term patterns about your execution habits           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────────┐ ┌─────────────────────────┐│
│ │ Most productive 8–11am  │ │ Underestimates algo     ││
│ │ 85% confidence          │ │ duration                ││
│ │                         │ │ 70% confidence          ││
│ │ You complete the most   │ │ On average, algorithms  ││
│ │ tasks between 8-11am.   │ │ takes 140% of estimated ││
│ │ Schedule deep work then.│ │ time across 5 instances.││
│ │ productivity window     │ │ estimation accuracy     ││
│ └─────────────────────────┘ └─────────────────────────┘│
│                                                          │
│ ┌─────────────────────────┐ ┌─────────────────────────┐│
│ │ Misses evening deep work│ │ Gym before noon         ││
│ │ 75% confidence          │ │ 80% confidence          ││
│ │                         │ │                         ││
│ │ Tasks scheduled after   │ │ You complete gym 90%    ││
│ │ 6pm are missed 70% of   │ │ when scheduled before   ││
│ │ the time.               │ │ noon vs 40% after.      ││
│ │ miss pattern            │ │ scheduling habit        ││
│ └─────────────────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```
