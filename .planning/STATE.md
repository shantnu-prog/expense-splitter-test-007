# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.
**Current focus:** Between milestones — v1.1 shipped, no active milestone

## Current Position

Phase: None active
Status: v1.1 milestone complete and archived
Last activity: 2026-02-24 — v1.1 archived (3 phases, 6 plans, 12 requirements)

Progress: No active milestone

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

## Accumulated Context

### Decisions

Full decision logs archived in:
- milestones/v1.0-ROADMAP.md
- milestones/v1.1-ROADMAP.md
- PROJECT.md Key Decisions table

### Pending Todos

None.

### Blockers/Concerns

None — all blockers resolved.

### Tech Debt (non-blocking)

- `as any` casts at undo restore boundary (PeoplePanel:81, ItemsPanel:49) — low severity (v1.0)
- `useEffect` on subtotal fires on mount in TipTaxPanel — low severity (v1.0)
- Payer state resets on tab navigation — low severity, by design (v1.1)
- UPI window.location.href is a no-op on desktop — low severity (v1.1)

## Session Continuity

Last session: 2026-02-24
Stopped at: v1.1 milestone archived
Resume file: None
