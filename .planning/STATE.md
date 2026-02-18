# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 1 of 3 in current phase
Status: In Progress — executing plans
Last activity: 2026-02-19 — 01-01 complete: project scaffold + TypeScript types

Progress: [█░░░░░░░░░] 8%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 4 min
- Total execution time: 0.07 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 1 | 4 min | 4 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min)
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Stack — React 19 + TypeScript + Vite + Tailwind CSS 4 + Zustand 5 + Vitest (research-recommended; verify versions with npm info before install)
- [Init]: All monetary values stored as integer cents throughout the engine; convert to dollars only at display
- [Init]: Client-side only for v1; no backend, no auth, no persistence
- [Phase 01-foundation]: Vitest passWithNoTests: true — Vitest 4.x exits code 1 when no test files; passWithNoTests required for zero-test phase
- [Phase 01-foundation]: Cents branded type: number & { __brand: 'Cents' } — encodes integer-cents-everywhere contract at compile time
- [Phase 01-foundation]: TipTaxConfig.includeZeroFoodPeople is per-split (on each TipTaxConfig) not global — encodes locked CONTEXT.md decision
- [Phase 01-foundation]: EngineResult discriminated union with unassigned_items error — blocks calculation when any item has no assigned people

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 3 planning]: Rounding surplus UX is not fully specified — the exact display format ("$0.67 extra goes to tip"? per-person or aggregate? shown always or only when > 0?) must be resolved before Phase 3 is planned. Flag during plan-phase for Phase 3.
- [Phase 1]: Verify current npm versions of React, Vite, Tailwind, Zustand before scaffolding — training cutoff means patch versions may have incremented.

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 01-foundation-01-PLAN.md — ready for 01-02 (engine TDD)
Resume file: None
