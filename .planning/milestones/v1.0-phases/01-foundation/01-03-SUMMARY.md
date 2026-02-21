---
phase: 01-foundation
plan: "03"
subsystem: store
tags: [zustand, immer, state-management, react, typescript, vitest]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: "TypeScript type definitions: BillConfig, EngineResult, Cents, PersonId, ItemId, Person, Item, Assignments, TipTaxConfig"
  - phase: 01-foundation/01-02
    provides: "computeSplit() engine with distributeIntegerCents and distributeProportionalCents"
provides:
  - "Zustand 5 store (useBillStore) with immer middleware for React consumers"
  - "createBillStore() vanilla factory for isolated test instances"
  - "All bill mutation actions: addPerson, removePerson, updatePerson, addItem, removeItem, updateItem, assignItem, setTip, setTax, reset"
  - "getResult() derived computation calling computeSplit() — no stored derived data"
  - "21-test suite covering all store actions and store+engine integration"
affects:
  - ui
  - 02-ui-foundation
  - 03-ui-features
  - 04-polish

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Input-only store: Zustand holds only config (people, items, assignments, tip, tax) — zero derived data in state"
    - "Derived-on-read: getResult() calls computeSplit() fresh every time, result never stored"
    - "Dual export pattern: useBillStore (React hook via create) + createBillStore (vanilla factory via createStore) from single shared stateCreator"
    - "Immer middleware: mutable-style mutations in set callbacks preserve immutability"
    - "Test isolation: createBillStore() in beforeEach creates fresh store per test, no cross-test state leaks"

key-files:
  created:
    - src/store/billStore.ts
    - src/store/billStore.test.ts
  modified: []

key-decisions:
  - "Dual export: useBillStore (React) + createBillStore (vanilla for tests) from shared stateCreator — avoids code duplication"
  - "removePerson leaves unassigned items in-place with empty assignment array — engine returns unassigned_items error, blocking calc until user reassigns"
  - "getResult() is a method on the store (not a selector or hook) — called as store.getState().getResult() in tests, useBillStore((s) => s.getResult) in React"

patterns-established:
  - "Input-only Zustand store: state holds raw user input, derived values computed on read"
  - "Engine abstraction: UI never calls computeSplit directly — always goes through store.getResult()"
  - "Vanilla factory pattern: export createBillStore for test isolation alongside React useBillStore hook"

requirements-completed: [ASGN-02, TPTX-02, TPTX-04, SUMM-02]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 1 Plan 03: Zustand Bill Store Summary

**Zustand 5 store with immer middleware wrapping the computeSplit engine: input-only state, 10 mutation actions, getResult() derived computation, and 21 passing integration tests validating the full store-to-engine pipeline**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T19:27:19Z
- **Completed:** 2026-02-18T19:29:42Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created Zustand 5 + immer store holding only input config (people, items, assignments, tip, tax) — no derived totals ever stored in state
- Implemented all 10 mutation actions including person-removal redistribution that correctly unassigns sole-owned items (letting the engine return the unassigned_items error)
- Exported both `useBillStore` (React hook) and `createBillStore` (vanilla factory for tests) from a single shared `stateCreator` function
- Wrote 21 test cases (14 unit + 7 integration) covering every action and the full store->engine pipeline including tip/tax proportional splits and includeZeroFoodPeople toggle

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Zustand store with immer middleware and all bill actions** - `958db50` (feat)
2. **Task 2: Write store unit tests and integration tests using zustand/vanilla** - `2ab10ae` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/store/billStore.ts` - Zustand store with BillState interface, 10 actions, dual export (useBillStore + createBillStore)
- `src/store/billStore.test.ts` - 21 tests: 14 unit (all store actions) + 7 integration (store->engine pipeline)

## Decisions Made
- Shared `stateCreator` function used by both `create` (React) and `createStore` (vanilla) — eliminates code duplication while enabling isolated test instances
- `removePerson` does not auto-delete unassigned items after sole-owner removal — items remain with empty assignment, engine blocks calculation, user must explicitly reassign or delete
- `getResult()` implemented as a store method (not a computed selector) — consistent with Zustand 5 patterns and callable as `store.getState().getResult()` in tests

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 1 is fully complete: types (01-01), engine with 45 tests (01-02), and store with 21 tests (01-03)
- 66 total tests passing across the full foundation suite
- All Phase 1 success criteria verified through integration tests:
  - SC1: Test suite passes for party sizes 1-10 across all split methods (engine tests)
  - SC2: Sum of per-person shares equals tip/tax total — no penny gaps (engine invariant tests)
  - SC3: Each person's total rounded up with surplus accessible (engine + store integration)
  - SC4: Shared items split among only sharers (engine + store integration test 15, 16)
  - SC5: Store holds only input data — getResult() is derived (store test 21)
- `useBillStore` is ready for Phase 2 UI consumption — no further foundation work needed

---
*Phase: 01-foundation*
*Completed: 2026-02-19*

## Self-Check: PASSED

- src/store/billStore.ts: FOUND (198 lines, min 60)
- src/store/billStore.test.ts: FOUND (477 lines, min 100)
- .planning/phases/01-foundation/01-03-SUMMARY.md: FOUND
- Commit 958db50 (Task 1): FOUND
- Commit 2ab10ae (Task 2): FOUND
- useBillStore export: FOUND
- createBillStore export: FOUND
