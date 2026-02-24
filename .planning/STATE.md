# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.
**Current focus:** v1.3 UI Redesign — Phase 15: Component Redesign

## Current Position

Phase: 15 — Component Redesign
Plan: 01 complete, 02 next
Status: Phase 15 Plan 01 complete (5/5 tasks), Plan 02 next
Last activity: 2026-02-24 — Phase 15 Plan 01 executed

```
v1.3 Progress: [██████████░░░░░░░░░░] 2/4 phases
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

**v1.3 (in progress):**
- 4 phases planned (13-16), 30 requirements
- Phase 13: 2 plans complete
- Phase 14: 2 plans complete (TabBar icons + glass, SubtotalBar + PersonCard glass)
- Phase 15: Plan 01 complete (row cards + list spacing, 5 tasks, 90s)

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
Stopped at: Completed 15-01-PLAN.md
Resume with: `/gsd:execute-phase 15` (Plan 02 next)
