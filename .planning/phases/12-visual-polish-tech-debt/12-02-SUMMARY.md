---
phase: 12-visual-polish-tech-debt
plan: 02
subsystem: ui
tags: [typescript, branded-types, react, error-boundary, upi, useEffect, useRef]

# Dependency graph
requires:
  - phase: 11-payer-selector-upi
    provides: PaymentSection with UPI link generation
  - phase: 12-01
    provides: visual polish foundation

provides:
  - Zero as-any casts in undo restore boundary (branded PersonId/ItemId types)
  - TipTaxPanel useEffect skips mount (prev-value ref pattern)
  - ErrorBoundary class component with Reload App fallback
  - Desktop UPI detection showing actionable message instead of silent no-op

affects: [future ui phases, any phase touching useUndoDelete, PaymentSection, TipTaxPanel]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "prev-value ref pattern for skipping useEffect on mount"
    - "React class ErrorBoundary with getDerivedStateFromError"
    - "Mobile user-agent detection for UPI deep link gating"

key-files:
  created:
    - src/components/ErrorBoundary.tsx
  modified:
    - src/hooks/useUndoDelete.ts
    - src/components/people/PeoplePanel.tsx
    - src/components/items/ItemsPanel.tsx
    - src/components/tip-tax/TipTaxPanel.tsx
    - src/App.tsx
    - src/components/summary/PaymentSection.tsx

key-decisions:
  - "Used {} as Record<ItemId, PersonId[]> cast + Object.entries typed as [ItemId, PersonId[]][] to propagate branded types without as-any"
  - "prevSubtotalRef initialized to current subtotal value — skips effect when subtotal unchanged on mount"
  - "ReloadPrompt stays outside ErrorBoundary so PWA SW updates work even if main app crashes"
  - "Mobile detection via /Android|iPhone|iPad|iPod/i regex on navigator.userAgent — client-side only, no server involvement"

patterns-established:
  - "Prev-value ref pattern: useRef(value) + early return in effect when ref.current === value"
  - "ErrorBoundary: class component wrapping AppShell, sibling to ReloadPrompt"

requirements-completed: [DEBT-01, DEBT-02, DEBT-03, DEBT-04]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 12 Plan 02: Tech Debt Cleanup Summary

**Eliminated all 4 known tech debt items: branded-type undo restore, mount-skipping useEffect with prev-value ref, ErrorBoundary with Reload fallback, and desktop UPI guard with 3-second toast**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-24T07:15:58Z
- **Completed:** 2026-02-24T07:18:50Z
- **Tasks:** 4 of 4
- **Files modified:** 7 (1 created, 6 modified)

## Accomplishments

- Removed all `as any` casts at undo restore boundary using branded `ItemId`/`PersonId` types throughout `useUndoDelete`, `PeoplePanel`, and `ItemsPanel`
- Fixed TipTaxPanel `useEffect` firing on mount by introducing a `prevSubtotalRef` that skips the effect when subtotal hasn't changed; removed the eslint-disable comment
- Created `ErrorBoundary` class component with "Something went wrong" fallback UI and "Reload App" button; wrapped `AppShell` in `App.tsx` while keeping `ReloadPrompt` outside
- Added mobile detection to `handleUpiClick` in `PaymentSection` — desktop users see "Open on your mobile device to use UPI payments" for 3 seconds instead of a silent no-op

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix as-any casts with branded types (DEBT-01)** - `22c6c24` (fix)
2. **Task 2: Fix useEffect mount firing in TipTaxPanel (DEBT-02)** - `3fb4c5a` (fix)
3. **Task 3: Add error boundary (DEBT-03)** - `a568ee1` (feat)
4. **Task 4: Desktop UPI message (DEBT-04)** - `dc51c64` (feat)

## Files Created/Modified

- `src/components/ErrorBoundary.tsx` - New React class component; getDerivedStateFromError returns { hasError: true }; renders "Something went wrong" + Reload App button
- `src/hooks/useUndoDelete.ts` - Updated `DeletedPerson.assignments` to `Record<ItemId, PersonId[]>`; `DeletedItem.assignedIds` to `PersonId[]`; added `ItemId`/`PersonId` imports
- `src/components/people/PeoplePanel.tsx` - Added `ItemId` import; `assignmentSnapshot` typed as `Record<ItemId, PersonId[]>`; removed eslint-disable and `as any` in `restorePerson` call
- `src/components/items/ItemsPanel.tsx` - Removed eslint-disable and `as any` in `restoreItem` call
- `src/components/tip-tax/TipTaxPanel.tsx` - Added `useRef` import; added `prevSubtotalRef`; useEffect skips when `prevSubtotalRef.current === subtotal`; removed eslint-disable comment
- `src/App.tsx` - Added `ErrorBoundary` import; wrapped `AppShell` inside `<ErrorBoundary>`
- `src/components/summary/PaymentSection.tsx` - Added `useState` import; `desktopUpiMsg` state; `handleUpiClick` detects mobile via userAgent regex; shows 3s desktop message

## Decisions Made

- Used `{} as Record<ItemId, PersonId[]>` + `Object.entries(...) as [ItemId, PersonId[]][]` to propagate branded types through the snapshot loop without `as any`
- `prevSubtotalRef` initialized to the initial `subtotal` value — effect early-returns if ref equals current value, which it always does on mount
- `ReloadPrompt` kept as sibling to `ErrorBoundary` (not nested inside) so PWA service worker update notifications still display even when `AppShell` crashes
- Mobile detection regex `/Android|iPhone|iPad|iPod/i` covers the major UPI-capable mobile platforms without requiring a library

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all TypeScript checks passed cleanly, all 144 tests passed, and production build succeeded on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All tech debt tracked in STATE.md is now resolved
- Phase 12 (Visual Polish & Tech Debt) is fully complete
- App is in clean state: zero `as any` casts in undo restore, correct useEffect semantics, error recovery UI, and better desktop UPI UX

---
*Phase: 12-visual-polish-tech-debt*
*Completed: 2026-02-24*
