---
phase: 04-polish
plan: 02
subsystem: ui-polish
tags: [undo-toast, accessibility, zustand, react, optimistic-delete]

requires:
  - phase: 04-polish
    provides: [keyboard-navigation, onboarding-screen, empty-state-guidance, ios-mobile-polish]
provides:
  - undo-delete-system
  - store-restore-actions
  - gmail-style-undo-toast
affects: [PeoplePanel, ItemsPanel, billStore, useUndoDelete, UndoToast]

tech-stack:
  added: []
  patterns: [optimistic-delete-undo, snapshot-capture-before-mutation, gmail-style-undo, accessible-aria-live-toast]

key-files:
  created:
    - src/hooks/useUndoDelete.ts
    - src/components/shared/UndoToast.tsx
  modified:
    - src/store/billStore.ts
    - src/components/people/PeoplePanel.tsx
    - src/components/items/ItemsPanel.tsx

key-decisions:
  - "[Phase 04-polish 04-02]: Snapshot captured BEFORE store mutation — people/assignments read from current store state, then removePerson called, preserving original data for undo"
  - "[Phase 04-polish 04-02]: restorePerson/restoreItem are idempotent guards — only restore if entity ID not already present (prevents double-restore)"
  - "[Phase 04-polish 04-02]: useUndoDelete.handleUndo accepts snapshot as parameter to avoid stale closure — caller passes undo.snapshot at call time"
  - "[Phase 04-polish 04-02]: Second delete replaces first toast — timer cleared and snapshot replaced (first undo opportunity intentionally lost, per CONTEXT.md)"
  - "[Phase 04-polish 04-02]: restoreItem filters assignedIds to only include PersonIds still present in store — person may have been deleted while toast was showing"

patterns-established:
  - "Optimistic delete: entity removed immediately, undo window via toast with 5s timer"
  - "Snapshot before mutation: capture state for restore before calling store action"
  - "aria-live assertive + tabIndex toggle: accessible toast that doesn't trap keyboard focus when hidden"

requirements-completed: []

duration: 3min
completed: 2026-02-21
---

# Phase 4 Plan 2: Undo Toast Deletion Safety System Summary

**Gmail-style optimistic delete with 5-second undo toast for people and items, preserving original IDs and full assignment snapshots on restore.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-21T10:46:24Z
- **Completed:** 2026-02-21T10:49:00Z
- **Tasks:** 2 of 3 (Task 3 is a human-verify checkpoint — awaiting human verification)
- **Files modified:** 5

## Accomplishments
- `restorePerson` and `restoreItem` store actions added — preserve original entity IDs critical for assignment re-linking
- `useUndoDelete` hook manages snapshot state, 5-second auto-dismiss timer, toast message generation
- `UndoToast` component with `aria-live="assertive"`, accessible Undo/dismiss buttons, `tabIndex` toggle for keyboard accessibility
- PeoplePanel and ItemsPanel wired: optimistic delete, snapshot capture, undo restore with assignment recovery

## Task Commits

Each task was committed atomically:

1. **Task 1: Store restore actions + useUndoDelete hook + UndoToast component** - `2b230a9` (feat)
2. **Task 2: Wire undo toast into PeoplePanel and ItemsPanel** - `c171aeb` (feat)
3. **Task 3: Final polish verification** - CHECKPOINT — awaiting human verification

## Files Created/Modified
- `src/store/billStore.ts` - Added `restorePerson` and `restoreItem` actions to BillState interface and stateCreator
- `src/hooks/useUndoDelete.ts` - New hook: snapshot state, 5s timer, scheduleDelete/handleUndo/dismiss, toast message builder
- `src/components/shared/UndoToast.tsx` - New accessible toast: aria-live, Undo/dismiss buttons, tabIndex toggle
- `src/components/people/PeoplePanel.tsx` - Wired useUndoDelete: handleRemove captures snapshot + schedules toast, handleUndo calls restorePerson
- `src/components/items/ItemsPanel.tsx` - Wired useUndoDelete: handleRemove captures assignedIds + schedules toast, handleUndo calls restoreItem

## Decisions Made
- Snapshot captured BEFORE store mutation: `people.find()` and `Object.entries(assignments)` called before `removePerson()` — ensures correct data for undo
- `useUndoDelete.handleUndo` accepts snapshot as explicit parameter (not from closure) — avoids React stale closure issue where `snapshot` state might be null at callback time
- `restorePerson` re-applies only the assignment entries where this person appeared (not full assignments map) — targeted restoration avoids overwriting other people's assignments
- `restoreItem` filters assignedIds to only include PersonIds still present — handles concurrent deletion case

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] useUndoDelete.handleUndo signature changed to accept snapshot parameter**
- **Found during:** Task 2 (wiring PeoplePanel/ItemsPanel)
- **Issue:** Original plan's `handleUndo()` returned `snapshot` from closure — stale closure risk since React state may be null at callback call time. Callers need to pass `undo.snapshot` at call time.
- **Fix:** Changed `handleUndo` to accept `(currentSnapshot: DeletedSnapshot | null)` parameter. Callers pass `undo.snapshot` directly which is always current at render time.
- **Files modified:** `src/hooks/useUndoDelete.ts`, `src/components/people/PeoplePanel.tsx`, `src/components/items/ItemsPanel.tsx`
- **Verification:** TypeScript compiles cleanly, all 125 tests pass

---

**Total deviations:** 1 auto-fixed (1 bug — stale closure prevention)
**Impact on plan:** Fix ensures undo works reliably under React concurrent mode. No scope creep.

## Issues Encountered
None beyond the auto-fixed stale closure issue above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All automated tasks complete; awaiting human verification at Task 3 checkpoint
- Once human approves, Phase 4 is complete and project is production-ready
- Human verification covers: keyboard navigation (arrow keys), onboarding, empty states, undo toast (all 22 steps)

## Self-Check: PASSED

- FOUND: src/hooks/useUndoDelete.ts
- FOUND: src/components/shared/UndoToast.tsx
- FOUND: src/store/billStore.ts (restorePerson + restoreItem)
- FOUND: src/components/people/PeoplePanel.tsx (undo wired)
- FOUND: src/components/items/ItemsPanel.tsx (undo wired)
- FOUND: commit 2b230a9 (Task 1)
- FOUND: commit c171aeb (Task 2)
- All 125 tests pass, zero TypeScript errors

---
*Phase: 04-polish*
*Completed: 2026-02-21*
