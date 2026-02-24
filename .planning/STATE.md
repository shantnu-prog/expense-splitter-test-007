# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.
**Current focus:** v1.3 shipped — no active milestone

## Current Position

Phase: —
Plan: —
Status: v1.3 UI Redesign shipped and archived
Last activity: 2026-02-24 — v1.3 milestone completed (4 phases, 8 plans, 30 requirements)

```
v1.3: SHIPPED
```

## Performance Metrics

**v1.0 (shipped 2026-02-22):**
- 5 phases, 11 plans
- 4,734 LOC, 125 tests across 9 files
- Timeline: 4 days (2026-02-19 to 2026-02-22)

**v1.1 (shipped 2026-02-24):**
- 3 phases, 6 plans, 15 tasks
- 3,413 lines added, 144 tests across 12 files
- Build: 244 KB (76 KB gzip)
- Timeline: 3 days (2026-02-22 to 2026-02-24)

**v1.2 (shipped 2026-02-24):**
- 4 phases, 7 plans, 17 tasks
- 16 files changed, 300 insertions, 87 deletions
- Build: 254 KB (79 KB gzip)
- Tests: 144 passing across 12 files
- LOC: 6,120 total

**v1.3 (shipped 2026-02-24):**
- 4 phases (13-16), 8 plans, 30 requirements
- 26 commits, 55 files changed, 4,255 insertions, 1,348 deletions
- Build: 263 KB JS (80.5 KB gzip), 54 KB CSS (9 KB gzip)
- LOC: 6,325 total
- Timeline: 2026-02-24 (single day)

## Accumulated Context

### Decisions

Full decision logs archived in:
- milestones/v1.0-ROADMAP.md
- milestones/v1.1-ROADMAP.md
- milestones/v1.2-ROADMAP.md
- PROJECT.md Key Decisions table

**v1.3 key decisions (research-driven):**
- Self-host Inter via `@fontsource-variable/inter` — Google Fonts CDN silently breaks offline in installed PWA
- Glass utilities via Tailwind CSS 4 `@utility` directive (not `@layer utilities`) — required for variant support
- Animation keyframes in `@theme { }` in CSS (not tailwind.config.js — deprecated in v4)
- Blur budget: max 4 simultaneous blurred elements per viewport, max 12-16px blur radius
- Phase 14 exit gate: blur performance verified on 4x CPU throttle before Phase 15 proceeds
- Phase 14 exit gate: axe-core contrast audit passes before Phase 15 proceeds
- Animate individual cards/list items only — NOT panel containers (AppShell keeps all panels mounted via CSS `hidden`; animating containers fires invisibly on app load)
- Only animate `transform` and `opacity` (compositor-only) — never `box-shadow`, `height`, `padding`, `margin`
- Icon decision deferred to Phase 14 start: `lucide-react` named imports vs inline SVG (5 tab icons + ~2 more elsewhere)
- Phase 14 Plan 01: Chose inline SVG over lucide-react for tab icons (zero bundle cost, full control over 20x20 stroke icons)

### Pending Todos

None.

### Blockers/Concerns

None.

### Tech Debt

None — all known tech debt resolved in v1.2 Phase 12.

## Session Continuity

Last session: 2026-02-24
Stopped at: v1.3 milestone archived
Resume with: `/gsd:new-milestone` to start next version
