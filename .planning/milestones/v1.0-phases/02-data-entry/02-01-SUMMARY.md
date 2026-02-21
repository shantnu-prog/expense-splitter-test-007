---
phase: 02-data-entry
plan: 01
subsystem: ui
tags: [react, tailwind, testing-library, vitest, zustand, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Zustand store (useBillStore), engine types (Cents, cents, Item), billStore actions
provides:
  - Dark-themed app shell with bg-gray-950 base styling
  - Bottom tab navigation (People, Items, Assign) with amber unassigned badge
  - Sticky subtotal bar showing running total from store
  - CSS-hidden panel mounting pattern preserving scroll/input state
  - Currency conversion utilities (dollarsToCents, centsToDollars, filterPriceInput)
  - Test infrastructure: @testing-library/react, jest-dom, jsdom configured
affects: [02-02, 02-03, 03-results]

# Tech tracking
tech-stack:
  added:
    - "@testing-library/react ^16.3.2"
    - "@testing-library/user-event ^14.6.1"
    - "@testing-library/jest-dom ^6.9.1"
    - "jsdom ^28.1.0"
  patterns:
    - "CSS hidden class to keep all panels mounted (preserves scroll position and input state)"
    - "Local useState for active tab — UI state not stored in Zustand"
    - "useShallow for multi-key store selectors in AppShell"
    - "setupFiles in vite.config.ts registers jest-dom matchers globally"
    - "IEEE 754 safe conversion via cents() constructor (Math.round)"

key-files:
  created:
    - src/test/setup.ts
    - src/utils/currency.ts
    - src/utils/currency.test.ts
    - src/hooks/useSubtotal.ts
    - src/components/layout/TabBar.tsx
    - src/components/layout/SubtotalBar.tsx
    - src/components/layout/AppShell.tsx
  modified:
    - vite.config.ts
    - src/index.css
    - src/App.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "All panels mounted with CSS hidden — preserves scroll position and input state on tab switch"
  - "Bottom tab bar (not top) — better for one-thumb mobile use at restaurant table"
  - "Tab UI state in local useState, not Zustand — anti-pattern to put ephemeral UI nav in global store"
  - "dollarsToCents checks for negative sign before stripping chars — prevents -5.00 being parsed as 500"

patterns-established:
  - "CSS hidden pattern: <div className={activeTab === 'people' ? '' : 'hidden'}> keeps all panels mounted"
  - "useSubtotal pattern: single-value selector returns stable primitive (Cents), no useShallow needed"
  - "Currency boundary pattern: convert to cents at entry point, display only via centsToDollars"
  - "Component test setup: per-file // @vitest-environment jsdom directive, global setup via setupFiles"

requirements-completed: [UX-01, ITEM-05]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 2 Plan 01: App Shell and Currency Utilities Summary

**Dark-themed React app shell with sticky subtotal bar, bottom tab navigation, CSS-hidden panels, and IEEE-754-safe dollar-to-cents currency conversion utilities**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T20:26:32Z
- **Completed:** 2026-02-18T20:29:31Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Installed and configured @testing-library/react, user-event, jest-dom, jsdom — component tests ready for Plans 02 and 03
- Built dark app shell: bg-gray-950 base theme, sticky SubtotalBar at top, three-tab TabBar fixed at bottom with amber unassigned badge
- Created currency utilities with IEEE 754-safe rounding (12.10 * 100 = 1210.0000000000002 handled correctly), all 12 unit tests pass
- All 78 tests pass (66 Phase 1 + 12 new currency tests), vite build succeeds with no TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install test dependencies and create currency utilities** - `e1b0bfa` (feat)
2. **Task 2: Build app shell with dark theme, bottom tabs, and sticky subtotal** - `5b9f84a` (feat)

## Files Created/Modified

- `src/test/setup.ts` - Registers jest-dom matchers via @testing-library/jest-dom/vitest
- `src/utils/currency.ts` - dollarsToCents, centsToDollars, filterPriceInput
- `src/utils/currency.test.ts` - 12 unit tests covering IEEE 754, null cases, input filtering
- `src/hooks/useSubtotal.ts` - Computes running subtotal via useBillStore selector
- `src/components/layout/TabBar.tsx` - Fixed bottom nav with People/Items/Assign tabs and amber unassigned badge
- `src/components/layout/SubtotalBar.tsx` - Sticky top bar with dollar amount from useSubtotal
- `src/components/layout/AppShell.tsx` - Root layout with CSS-hidden panel mounting and unassignedCount for badge
- `vite.config.ts` - Added setupFiles: ['./src/test/setup.ts']
- `src/index.css` - Dark base styles: html/body/#root with bg-gray-950 text-gray-100
- `src/App.tsx` - Replaced placeholder with AppShell component
- `package.json` / `package-lock.json` - New testing library dependencies

## Decisions Made

- **Tab position:** Bottom nav chosen over top — better one-thumb reach at restaurant table on mobile
- **Panel mounting:** CSS hidden class keeps all three panels mounted (preserves scroll position and input state), vs unmount/remount which loses state
- **Tab state in local useState:** Active tab is ephemeral UI navigation state, not domain data — storing in Zustand would be an anti-pattern per existing decisions
- **dollarsToCents negative check:** Checks for leading `-` before stripping non-numeric chars, so "-5.00" correctly returns null instead of 500

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed negative input handling in dollarsToCents**
- **Found during:** Task 1 (currency utility tests)
- **Issue:** `replace(/[^0-9.]/g, '')` strips the minus sign before the negative check, so `-5.00` becomes `5.00` → 500 cents instead of null
- **Fix:** Added explicit check `if (trimmed.startsWith('-')) return null` before character stripping
- **Files modified:** src/utils/currency.ts
- **Verification:** `dollarsToCents("-5.00")` returns null, all 12 currency tests pass
- **Committed in:** e1b0bfa (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correctness fix — negative price input would have silently produced positive cents value. No scope creep.

## Issues Encountered

None beyond the auto-fixed negative input bug above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Test infrastructure ready for component tests in Plans 02 and 03
- AppShell placeholder panels ready to be replaced by real panel components
- currency utilities ready for use in item price input
- Subtotal bar will automatically reflect any items added to the store
- Plans 02 (PeoplePanel + ItemsPanel) and 03 (AssignmentsPanel) can now be executed in parallel

---
*Phase: 02-data-entry*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: src/test/setup.ts
- FOUND: src/utils/currency.ts
- FOUND: src/utils/currency.test.ts
- FOUND: src/hooks/useSubtotal.ts
- FOUND: src/components/layout/TabBar.tsx
- FOUND: src/components/layout/SubtotalBar.tsx
- FOUND: src/components/layout/AppShell.tsx
- FOUND commit e1b0bfa: feat(02-01): install test dependencies and create currency utilities
- FOUND commit 5b9f84a: feat(02-01): build dark-themed app shell with tabs and subtotal bar
