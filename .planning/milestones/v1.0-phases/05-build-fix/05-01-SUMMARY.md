---
phase: 05-build-fix
plan: 01
subsystem: ui
tags: [typescript, vite, react, zustand, vitest]

# Dependency graph
requires:
  - phase: 04-polish
    provides: all application UI features including undo/delete, keyboard navigation, onboarding
provides:
  - Zero-error production build via npm run build (tsc -b && vite build)
  - Test files excluded from production TypeScript compilation
  - Type-safe EngineResult narrowing in SummaryPanel
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Exclude test files from tsconfig.app.json via exclude glob — standard Vite scaffold pattern for production builds"
    - "Narrow discriminated union after early-return guard with explicit cast (result as EngineSuccess) for closure safety"

key-files:
  created: []
  modified:
    - tsconfig.app.json
    - src/components/summary/SummaryPanel.tsx
    - src/store/billStore.ts
    - src/components/layout/TabBar.tsx

key-decisions:
  - "Use 'result as EngineSuccess' cast after early-return guard rather than type predicate — simpler, no runtime overhead, TypeScript accepts post-guard context"
  - "Remove activeIndex from TabBar.tsx entirely — computed from activeTab but only used for focus tracking which TABS.map/index already provides"

patterns-established:
  - "tsconfig.app.json excludes src/**/*.test.ts and src/**/*.test.tsx — production build never includes test files"

requirements-completed: []

# Metrics
duration: 1min
completed: 2026-02-22
---

# Phase 05 Plan 01: Build Fix Summary

**TypeScript production build fixed: excluded test files from tsc-b compilation, narrowed EngineResult to EngineSuccess in SummaryPanel closures, and removed three unused variables — npm run build exits 0 with all 125 tests passing**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-21T20:02:39Z
- **Completed:** 2026-02-21T20:03:39Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- `npm run build` (tsc -b && vite build) completes with exit code 0 — was failing with 100+ TypeScript errors
- All 125 existing tests pass with zero regressions after changes
- Test files completely excluded from production TypeScript compilation (0 test files in tsc --listFiles output)

## Task Commits

Each task was committed atomically:

1. **Task 1: Exclude test files from tsconfig.app.json and fix TypeScript type errors** - `1eabce7` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `tsconfig.app.json` - Added `"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]` — prevents Vitest globals from polluting production tsc compilation
- `src/components/summary/SummaryPanel.tsx` - Imported `EngineSuccess` type; added `const successResult = result as EngineSuccess` after early-return guard; replaced all `result.results` and `result.totalSurplusCents` references with `successResult.*`
- `src/store/billStore.ts` - Changed `for (const [itemId, personIds] of ...)` to `for (const [itemId] of ...)` in `restorePerson` — `personIds` was unused, triggering `noUnusedLocals` error
- `src/components/layout/TabBar.tsx` - Removed unused `activeIndex` variable (auto-fix — not in original plan scope)

## Decisions Made
- Used `result as EngineSuccess` explicit cast (Option A from plan) — clean, zero runtime overhead, makes intent clear that we've already narrowed via the early-return `if (!result.ok)` guard
- `activeIndex` in `TabBar.tsx` was removed entirely; it was computed but never actually referenced in JSX or event handlers (roving tabindex uses `isActive` boolean and `TABS.map` index directly)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `activeIndex` variable in TabBar.tsx**
- **Found during:** Task 1 (running `npm run build` to see all errors)
- **Issue:** `src/components/layout/TabBar.tsx(29,9): error TS6133: 'activeIndex' is declared but its value is never read` — a compile error introduced in Phase 4 keyboard navigation work that was not identified in the build audit
- **Fix:** Removed the line `const activeIndex = TABS.findIndex((t) => t.id === activeTab);` — the computed value was never used; roving tabindex logic uses `isActive` and per-map `index` directly
- **Files modified:** `src/components/layout/TabBar.tsx`
- **Verification:** `npm run build` exits 0; `npx vitest run` 125/125 pass
- **Committed in:** `1eabce7` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug: unused declared variable)
**Impact on plan:** Required for the build to succeed; zero scope creep. The audit missed this error but it follows the same root cause category (noUnusedLocals).

## Issues Encountered
None — all three planned root causes were exactly as described, plus one additional noUnusedLocals error in TabBar.tsx discovered during the build run.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Production build is clean — `npm run build` exits 0
- All 125 tests pass — zero regressions
- v1.0 release is now unblocked from a build perspective
- No further phases planned

## Self-Check: PASSED

- FOUND: tsconfig.app.json
- FOUND: src/components/summary/SummaryPanel.tsx
- FOUND: src/store/billStore.ts
- FOUND: src/components/layout/TabBar.tsx
- FOUND: .planning/phases/05-build-fix/05-01-SUMMARY.md
- FOUND: commit 1eabce7

---
*Phase: 05-build-fix*
*Completed: 2026-02-22*
