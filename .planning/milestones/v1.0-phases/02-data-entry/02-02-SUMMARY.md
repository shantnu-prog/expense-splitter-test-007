---
phase: 02-data-entry
plan: "02"
subsystem: ui
tags: [react, zustand, tailwind, vitest, testing-library, typescript]

# Dependency graph
requires:
  - phase: 02-01
    provides: AppShell with tab slots, SubtotalBar, currency utils (dollarsToCents, centsToDollars, filterPriceInput), useBillStore with addPerson/removePerson/addItem/removeItem/updateItem
  - phase: 01-foundation
    provides: Cents branded type, Item/Person/ItemId types, billStore Zustand state creator

provides:
  - PeoplePanel with add-by-name, duplicate validation, remove, 7 component tests
  - PersonRow component for accessible person display with remove action
  - ItemsPanel with + button empty-row creation, inline name/price editing, quantity stepper, remove, 8 component tests
  - ItemRow component with dollarsToCents blur conversion, filterPriceInput on change, local state synced on item.id change
  - AppShell wired with real panels replacing both placeholders

affects:
  - 02-03 (Assign panel: needs people and items list from store, same useShallow pattern)
  - 03 (Summary/results phase: item data populated by these panels drives the engine)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useShallow selector pattern for Zustand store subscriptions in React components
    - Local state + blur-to-commit pattern for controlled price/name inputs (avoids fighting user typing)
    - item.id dependency in useEffect to reset local state on new item mount (NOT item.priceCents)
    - filterPriceInput on onChange, dollarsToCents on onBlur for price inputs

key-files:
  created:
    - src/components/people/PersonRow.tsx
    - src/components/people/PeoplePanel.tsx
    - src/components/people/PeoplePanel.test.tsx
    - src/components/items/ItemRow.tsx
    - src/components/items/ItemsPanel.tsx
    - src/components/items/ItemsPanel.test.tsx
  modified:
    - src/components/layout/AppShell.tsx

key-decisions:
  - "ItemRow syncs local state on item.id change only (not priceCents) — prevents fighting user typing while active input"
  - "addItem('', 0, 1) creates empty row — user types inline, no modal or dialog needed"
  - "Label revert on empty blur — if user clears name and tabs away, field reverts to store value"

patterns-established:
  - "Price input pattern: filterPriceInput on onChange, dollarsToCents on blur, centsToDollars for display normalization"
  - "People/Items panels use useShallow to select only needed slice of store — avoids unnecessary re-renders"
  - "Component tests reset store via useBillStore.getState().reset() in beforeEach — ensures test isolation"

requirements-completed: [PEOP-01, PEOP-02, ITEM-01, ITEM-02, ITEM-03, ITEM-04, ITEM-05]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 2 Plan 02: Data Entry Panels Summary

**People panel (add/remove with name validation) and Items panel (inline edit, dollar-to-cents price, quantity stepper) wired into AppShell with 15 component tests (93 total)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T20:32:32Z
- **Completed:** 2026-02-18T20:34:52Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- PeoplePanel: add by name (button + Enter), case-insensitive duplicate rejection, empty-name validation, remove, input clear on success — 7 tests
- ItemsPanel: + button creates empty row, inline name editing (blur-to-commit with revert on empty), dollar price input (filterPriceInput on change, dollarsToCents on blur, revert on invalid), quantity stepper (min 1, disabled at 1), remove button — 8 tests
- AppShell people and items tab placeholders replaced with real functional panels; SubtotalBar in header reflects item changes immediately via useSubtotal hook

## Task Commits

Each task was committed atomically:

1. **Task 1: Build People panel with add/remove and name validation** - `00b672a` (feat)
2. **Task 2: Build Items panel with inline editing, price input, quantity stepper** - `096bb0b` (feat)

**Plan metadata:** _(docs commit below)_

## Files Created/Modified

- `src/components/people/PersonRow.tsx` - Single person row with name and accessible remove button (aria-label="Remove {name}")
- `src/components/people/PeoplePanel.tsx` - Add form with validation (empty/duplicate), people list, store integration via useShallow
- `src/components/people/PeoplePanel.test.tsx` - 7 tests: add, Enter key, empty error, duplicate error, error clear on typing, remove, input clear
- `src/components/items/ItemRow.tsx` - Inline name/price inputs (blur-to-commit), quantity stepper, remove; useEffect on item.id for local state sync
- `src/components/items/ItemsPanel.tsx` - + button creates empty row via addItem('', 0, 1), items list with ItemRow, store integration via useShallow
- `src/components/items/ItemsPanel.test.tsx` - 8 tests: add row, name update, price conversion, invalid revert, stepper inc, stepper dec (min 1), remove, subtotal calc
- `src/components/layout/AppShell.tsx` - Imports PeoplePanel and ItemsPanel, replaces both placeholder divs

## Decisions Made

- **ItemRow local state synced on item.id (not priceCents):** Prevents the useEffect from overwriting the user's in-progress price entry when the store updates priceCents on blur — per pitfall #6 in research.
- **addItem('', 0, 1) for + button:** Creates an empty row the user fills in inline. No modal needed — consistent with locked CONTEXT.md decision.
- **Label revert on empty blur:** If user clears item name and tabs away, field reverts to previous store value — avoids empty-string labels in the store.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- People and Items panels are fully functional with store integration — Assign panel (Plan 02-03) can read people and items from the same store
- SubtotalBar already reflects item changes via useSubtotal hook
- All 93 tests pass including Phase 1 foundation suite

## Self-Check: PASSED

- All 6 component files found on disk
- Both task commits verified: 00b672a (Task 1), 096bb0b (Task 2)
- 93 tests pass (vitest run confirmed)
- Vite build succeeds with no TypeScript errors

---
*Phase: 02-data-entry*
*Completed: 2026-02-19*
