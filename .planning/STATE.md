# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.
**Current focus:** v1.1 Persistence + Sharing — Phase 6 in progress

## Current Position

Phase: 6 of 8 (Persistence Foundation)
Plan: 2 of 2 complete in current phase
Status: Phase complete
Last activity: 2026-02-22 — 06-02 complete: useHistoryStore + billStore persist middleware with branded type rehydration

Progress: [██░░░░░░░░] 20% (v1.1)

## Performance Metrics

**Velocity (v1.0 completed):**
- Total plans completed: 11
- v1.0 phases: 5 phases, 11 plans

**By Phase (v1.0):**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation | 3 | Complete 2026-02-19 |
| 2. Data Entry | 3 | Complete 2026-02-18 |
| 3. Output | 2 | Complete 2026-02-21 |
| 4. Polish | 2 | Complete 2026-02-21 |
| 5. Build Fix | 1 | Complete 2026-02-22 |

*v1.1 metrics will populate as plans complete*

## Accumulated Context

### Decisions

Full v1.0 decision log in PROJECT.md Key Decisions table and milestones/v1.0-ROADMAP.md.

**v1.1 decisions (from research):**
- Explicit save (not auto-save-to-history): avoids cluttering history with incomplete bills
- Two-store architecture: `useHistoryStore` (persist) + `useBillStore` (ephemeral)
- Inputs-only storage: `BillConfig` stored, never derived outputs; engine re-computes on demand
- 50-entry history cap: single guard in `save()` to prevent localStorage quota errors
- Payer state stays local (component `useState`): must NOT enter bill store or history

**06-01 decisions:**
- No validation in deserializeBillConfig — engine computeSplit handles invalid data; parse boundary only does type reconstruction
- safeLocalStorage.setItem logs console.warn on failure, never throws — app continues in memory-only mode on storage errors
- Round-trip tests run in node environment — deserializeBillConfig is a pure function, no jsdom required

**06-02 decisions:**
- persist wraps immer (critical middleware order) — wrong order causes persist to silently capture only initial state
- partialize on billStore selects config only — currentSplitId excluded (always null on refresh), actions excluded (not serializable)
- deserializeBillConfig called inside persist merge — the rehydration boundary where branded types must be reconstructed
- createHistoryStore() factory uses immer(creator) without persist — mirrors createBillStore() pattern for test isolation
- restore() is idempotent: skip if id already present, re-sort by savedAt DESC

### Pending Todos

None.

### Blockers/Concerns

- [Phase 6]: Middleware ordering — `persist` must wrap `immer`, not the reverse; silent failure mode
- [RESOLVED 06-01]: Branded types (`Cents`, `PersonId`, `ItemId`) lose brand on JSON round-trip — deserializeBillConfig() implemented and tested
- [Phase 7]: `useAppEntry` hook coordinates onboarding + history hydration; exact React 19 hook design left to Phase 7 planning

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 06-02-PLAN.md — useHistoryStore + billStore persist middleware with branded type rehydration
Resume file: None
