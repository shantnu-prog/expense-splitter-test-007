---
phase: 01-foundation
plan: 02
subsystem: testing
tags: [vitest, tdd, engine, cents, largest-remainder, bill-splitting]

# Dependency graph
requires:
  - phase: 01-01
    provides: src/engine/types.ts with BillConfig, EngineResult, PersonResult, Cents branded types
provides:
  - Pure calculation engine: computeSplit(BillConfig) -> EngineResult
  - distributeIntegerCents helper with largest-remainder guarantee
  - 45-test Vitest suite covering all bill-splitting edge cases
affects:
  - 01-03 (Zustand store wraps computeSplit)
  - 02+ (UI displays PersonResult fields: foodCents, tipCents, taxCents, roundedTotalCents)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Largest-remainder (Hamilton) algorithm for integer cent distribution — guarantees sum invariant
    - Proportional distribution via floating-point weights then largest-remainder on fractional parts
    - Pure function engine: no React/Zustand/DOM dependencies; all arithmetic on integer cents

key-files:
  created:
    - src/engine/engine.ts
    - src/engine/engine.test.ts
  modified: []

key-decisions:
  - "distributeIntegerCents uses floor-then-award-remainders pattern: assigns extra cents to first N indices (all have equal fractional part in uniform split), producing deterministic output [4,3,3] for 10/3"
  - "distributeProportionalCents uses floating-point weights for exact ratios, then applies largest-remainder on fractional parts for fair integer rounding — avoids off-by-one cent errors"
  - "includeZeroFoodPeople is ignored for proportional splits — weight=0 mathematically produces 0 share regardless of flag; only affects equal split eligibility"
  - "Empty bill (no items) is valid: returns ok:true with all-zero per-person results rather than an error"

patterns-established:
  - "Largest-remainder pattern: floor division then award extras to indices with highest fractional parts, guaranteeing sum == input"
  - "Validation-first pattern: computeSplit validates all items assigned before any computation, returns typed error immediately"
  - "foodMap pattern: build Record<PersonId, number> incrementally per item, initialize all people to 0"

requirements-completed: [ASGN-02, TPTX-02, TPTX-04, SUMM-02]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 1 Plan 02: Bill-Splitting Calculation Engine Summary

**Pure TypeScript calculation engine using largest-remainder integer-cent distribution — 45 tests covering shared items, proportional tip/tax, rounding, unassigned-item error path, and party sizes 1-10, all green.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T19:21:19Z
- **Completed:** 2026-02-18T19:24:18Z
- **Tasks:** 2 (RED + GREEN, TDD)
- **Files modified:** 2

## Accomplishments

- Wrote 45 failing tests first (RED) covering all engine behaviors: shared item distribution, equal and proportional tip/tax, rounding invariants, unassigned-item errors, party sizes 1-10, and 5 edge cases
- Implemented `distributeIntegerCents` using largest-remainder algorithm guaranteeing sum == input total for any partition
- Implemented `distributeProportionalCents` using floating-point weight ratios with largest-remainder fractional correction
- Implemented `computeSplit` orchestrating validation + food/tip/tax distribution into per-person `PersonResult` records
- All 45 tests pass; zero TypeScript errors; engine is pure (no React/Zustand dependencies)

## Task Commits

Each task was committed atomically:

1. **RED: Add failing tests for bill-splitting engine** - `fe9ba35` (test)
2. **GREEN: Implement calculation engine — all tests pass** - `215a81f` (feat)

**Plan metadata:** (docs commit below)

_Note: TDD plan — RED commit (failing tests) then GREEN commit (passing implementation). No REFACTOR needed._

## Files Created/Modified

- `src/engine/engine.ts` - Pure calculation engine: `distributeIntegerCents`, `distributeProportionalCents` (internal), `distributeItems` (internal), `distributeCharge` (internal), `computeSplit` (exported) — 276 lines, all arithmetic on integer cents
- `src/engine/engine.test.ts` - 45-test Vitest suite: 8 distributeIntegerCents tests, 4 shared item tests, 4 equal tip tests, 3 proportional tip tests, 4 tax tests, 4 rounding tests, 3 unassigned error tests, 10 party-size tests (test.each 1-10), 5 edge case tests — 310 lines

## Decisions Made

- **Largest-remainder for uniform distribution:** For `distributeIntegerCents`, all elements have the same fractional part (totalCents % count) / count, so the algorithm awards extra cents to the first N indices by index order. This produces [4,3,3] for 10/3 (largest bucket first), matching the spec.

- **Proportional with floating-point intermediates:** `distributeProportionalCents` computes `(weight / totalWeight) * total` as a float, then applies largest-remainder on fractional parts. This avoids integer rounding errors in the weight-to-share mapping while still guaranteeing integer output summing exactly to the total.

- **`includeZeroFoodPeople` only affects equal splits:** For proportional splits, a person with 0 food has weight=0, giving 0 share regardless. The flag is only meaningful for equal splits to determine eligibility. This matches the CONTEXT.md locked decision and the spec's test case ("B gets 0 proportional tip").

- **Empty bill is valid:** Zero-item BillConfig returns `ok: true` with all-zero results. This is correct behavior — the validation only blocks items that exist but have no assignees.

## Deviations from Plan

None - plan executed exactly as written. All behaviors specified in the plan's `<behavior>` section were implemented and tested.

## Issues Encountered

None. The TDD flow executed cleanly: tests failed as expected in RED (module not found), all 45 passed in GREEN, TypeScript reported zero errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `computeSplit` and `distributeIntegerCents` are exported from `src/engine/engine.ts` and ready for the Zustand store (plan 01-03)
- All type imports (`BillConfig`, `EngineResult`, `PersonResult`) flow from `types.ts` with zero type errors
- Engine is pure (no side effects, no I/O) — store can call it synchronously on every state change
- No blockers for plan 01-03

## Self-Check: PASSED

- FOUND: src/engine/engine.ts
- FOUND: src/engine/engine.test.ts
- FOUND commit: fe9ba35 (RED - failing tests)
- FOUND commit: 215a81f (GREEN - implementation)
- 45 tests passing, 0 TypeScript errors verified

---
*Phase: 01-foundation*
*Completed: 2026-02-19*
