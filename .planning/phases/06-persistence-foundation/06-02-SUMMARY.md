---
phase: 06-persistence-foundation
plan: 02
subsystem: database
tags: [zustand, zustand-persist, immer, localStorage, branded-types]

# Dependency graph
requires:
  - phase: 06-01
    provides: safeLocalStorage adapter and deserializeBillConfig rehydration function
  - phase: 01-foundation
    provides: BillConfig types, Cents/PersonId/ItemId branded types, computeSplit engine
provides:
  - useHistoryStore — persist-wrapped Zustand store for saved bill history (bs-history key)
  - useHistoryStore.save/update/remove/restore actions with 50-entry cap
  - useBillStore — persist-wrapped with bill-splitter-active key and version:1
  - useBillStore.loadConfig and setCurrentSplitId actions
  - Branded type rehydration via deserializeBillConfig in persist merge function
  - createHistoryStore and createBillStore vanilla factories for test isolation
affects: [07-sharing-layer, 08-onboarding, any component that reads or writes bill splits]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "persist(immer(creator)) middleware order — persist MUST wrap immer, not the reverse"
    - "partialize: select only config for persistence — exclude currentSplitId (always null on refresh) and action functions (not serializable)"
    - "merge function calls deserializeBillConfig at the rehydration boundary — the ONLY place branded types need reconstruction in billStore"
    - "createXxxStore() vanilla factory pattern for test isolation — no persist middleware in test factories"
    - "50-entry cap enforced in save() via unshift + slice(0, 50)"

key-files:
  created:
    - src/store/historyStore.ts
    - src/store/historyStore.test.ts
  modified:
    - src/store/billStore.ts
    - src/store/billStore.test.ts

key-decisions:
  - "persist wraps immer (not immer wraps persist) — wrong order causes persist to silently capture only initial state"
  - "partialize on billStore selects config only — currentSplitId excluded (resets to null on refresh per design), actions excluded (not JSON serializable)"
  - "deserializeBillConfig called inside persist merge function — the rehydration boundary where branded types are lost and must be reconstructed"
  - "createHistoryStore() factory uses immer(creator) without persist — Node test environment has no localStorage, matches existing createBillStore() pattern"
  - "restore() is idempotent — checks for existing id before inserting, then re-sorts by savedAt DESC"

patterns-established:
  - "Branded type reconstruction at rehydration boundary: call deserializeBillConfig inside persist merge, not in actions or components"
  - "Test isolation via vanilla factory: createXxxStore() wraps immer(creator) only, no persist"
  - "localStorage key naming: 'bill-splitter-active' (bill store) and 'bs-history' (history store)"

requirements-completed: [PERS-01, PERS-02, PERS-03]

# Metrics
duration: 12min
completed: 2026-02-22
---

# Phase 06 Plan 02: Persistence Stores Summary

**Zustand persist middleware on both stores: useBillStore auto-saves active bill to localStorage with branded type rehydration via deserializeBillConfig merge, and useHistoryStore saves completed splits to 'bs-history' with 50-entry cap**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-21T21:19:17Z
- **Completed:** 2026-02-21T21:31:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- useHistoryStore with save/update/remove/restore actions, 50-entry cap, persist('bs-history'), version:1, migrate stub
- useBillStore extended with persist('bill-splitter-active'), partialize on config only, merge calling deserializeBillConfig to re-apply branded types (Cents, PersonId, ItemId) after JSON.parse at rehydration boundary
- New BillState fields: currentSplitId, loadConfig(), setCurrentSplitId(), and reset() updated to clear currentSplitId
- All 138 tests pass across 11 test files (6 new for history store, 3 new for bill store, 129 existing unchanged)
- Production build succeeds at 235KB (73.85KB gzip)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useHistoryStore with persist middleware and unit tests** - `7288132` (feat)
2. **Task 2: Add persist middleware with deserializeBillConfig rehydration to billStore** - `98a1aa8` (feat)

## Files Created/Modified
- `src/store/historyStore.ts` - SavedSplitId branded type, SavedSplit interface, HistoryState, useHistoryStore with persist(immer), createHistoryStore vanilla factory
- `src/store/historyStore.test.ts` - 6 unit tests: save/cap/update/remove/restore/idempotency using createHistoryStore factory
- `src/store/billStore.ts` - Added persist middleware wrapping immer, partialize for config only, merge with deserializeBillConfig, new fields currentSplitId/loadConfig/setCurrentSplitId, reset clears currentSplitId
- `src/store/billStore.test.ts` - Added 3 tests for loadConfig/setCurrentSplitId/reset-clears-id; all 21 existing tests unchanged

## Decisions Made
- persist wraps immer (critical order) — wrong order causes persist to silently capture only initial state and never update
- partialize on billStore selects config only — currentSplitId excluded (always null on refresh by design), action functions excluded (not JSON serializable)
- deserializeBillConfig called inside persist merge — the exact rehydration boundary where branded types are lost and must be reconstructed; this resolves RESEARCH.md Open Question 1
- createHistoryStore() factory uses immer(creator) without persist — Node environment has no localStorage, mirrors existing createBillStore() pattern
- restore() idempotency: skip if id already present, then sort by savedAt DESC to maintain chronological order

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — all implementation followed plan specifications precisely. Middleware ordering noted as a critical implementation detail and executed correctly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Persistence layer complete: both stores have localStorage persistence with version:1 and migrate stubs
- PERS-01: Active bill auto-saves through page refresh via useBillStore persist
- PERS-02: Completed bills can be saved to useHistoryStore with explicit save() call
- PERS-03: Both stores have version:1 and migrate stubs for future schema safety
- Branded types survive JSON round-trip: deserializeBillConfig in persist merge ensures computeSplit works identically on rehydrated config
- Phase 7 (sharing layer) can import useHistoryStore and useBillStore with full persistence support

---
*Phase: 06-persistence-foundation*
*Completed: 2026-02-22*

## Self-Check: PASSED

- FOUND: src/store/historyStore.ts
- FOUND: src/store/historyStore.test.ts
- FOUND: src/store/billStore.ts
- FOUND: src/store/billStore.test.ts
- FOUND: .planning/phases/06-persistence-foundation/06-02-SUMMARY.md
- FOUND commit: 7288132 (Task 1: Create useHistoryStore)
- FOUND commit: 98a1aa8 (Task 2: billStore persist middleware)
