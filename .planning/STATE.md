# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 0 of 3 in current phase
Status: Ready to plan
Last activity: 2026-02-19 — Roadmap created; Phase 1 ready to plan

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Stack — React 19 + TypeScript + Vite + Tailwind CSS 4 + Zustand 5 + Vitest (research-recommended; verify versions with npm info before install)
- [Init]: All monetary values stored as integer cents throughout the engine; convert to dollars only at display
- [Init]: Client-side only for v1; no backend, no auth, no persistence

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 3 planning]: Rounding surplus UX is not fully specified — the exact display format ("$0.67 extra goes to tip"? per-person or aggregate? shown always or only when > 0?) must be resolved before Phase 3 is planned. Flag during plan-phase for Phase 3.
- [Phase 1]: Verify current npm versions of React, Vite, Tailwind, Zustand before scaffolding — training cutoff means patch versions may have incremented.

## Session Continuity

Last session: 2026-02-19
Stopped at: Roadmap created — ROADMAP.md and STATE.md written, REQUIREMENTS.md traceability updated
Resume file: None
