---
phase: 02-data-entry
plan: "03"
subsystem: ui
tags: [react, zustand, tailwind, vitest, testing-library, typescript]

# Dependency graph
requires:
  - phase: 02-02
    provides: PeoplePanel, ItemsPanel, AppShell with tab slots, useShallow store pattern, component test setup
  - phase: 02-01
    provides: AppShell skeleton, SubtotalBar, currency utils, useBillStore with assignItem action
  - phase: 01-foundation
    provides: Cents branded type, Item/Person/ItemId/PersonId types, assignments map in BillConfig

provides:
  - AssignmentRow component with expand/collapse, person checkboxes, Everyone toggle button, amber warning badge
  - AssignmentPanel with item-centric assignment list, empty states for no items / no people
  - AppShell fully wired with all three real panels (People, Items, Assignments)
  - 10 component tests for assign/unassign/everyone-select/everyone-deselect/warning/count
  - Complete data entry flow verified by human on mobile viewport (dark theme, touch targets)

affects:
  - 03 (Summary/results phase: all assigned items + people drive computeSplit engine)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Item-centric assignment pattern: expand item row to show person checklist (vs person-centric)
    - Everyone toggle: allAssigned ? deselect-all : select-all, computed from assignedIds.length === people.length
    - Amber warning badge on zero-assignment items — subtle "!" aria-label="Unassigned" (not alarming red)
    - TabBar unassigned count badge driven by items with empty assignment arrays

key-files:
  created:
    - src/components/assignments/AssignmentRow.tsx
    - src/components/assignments/AssignmentPanel.tsx
    - src/components/assignments/AssignmentPanel.test.tsx
  modified:
    - src/components/layout/AppShell.tsx

key-decisions:
  - "Item-centric expand-to-assign: each item row expands to show people checklist — matches mental model of 'who ate this item'"
  - "Everyone button shows Deselect All when all assigned — single toggle serves both mass-assign and mass-deselect"
  - "Amber ! badge (not red) for unassigned items — visible but not alarming in dim restaurant lighting"
  - "Assignment tab badge in TabBar shows count of unassigned items — gives at-a-glance indication before switching tabs"

patterns-established:
  - "Expand/collapse pattern: local useState(false) per row, chevron rotates on expand — consistent with mobile accordion"
  - "onAssign callback signature: (itemId, personIds[]) — replaces full assignment array (not toggle), enables Everyone and individual toggle in same handler"
  - "assignments[item.id] || [] defensive access — store may not have entry yet for new items"

requirements-completed: [ASGN-01, UX-01]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 2 Plan 03: Assignment Panel Summary

**Item-centric assignment panel with expand/collapse checklists, Everyone toggle, and amber unassigned warnings — completes the full data entry flow with human-verified mobile UX**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-18T20:44:00Z
- **Completed:** 2026-02-18T20:49:29Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- AssignmentRow: expandable item row with per-person checkboxes, Everyone/Deselect All toggle button, amber "!" warning badge on zero-assignment items, assignment count display ("2/2")
- AssignmentPanel: item-centric list with graceful empty states ("Add items first" / "Add people first"), full store integration via useShallow
- AppShell fully wired: all three tab slots now render real functional panels (PeoplePanel, ItemsPanel, AssignmentPanel)
- 10 component tests covering: assign, unassign, everyone-select, everyone-deselect, warning badge, count update, empty states, expand/collapse
- Human approved complete data entry flow on mobile viewport — dark theme, touch targets, tab switching, subtotal updates all verified

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Assignment panel with item-centric checklists, Everyone button, and unassigned warnings** - `5064dce` (feat)
2. **Task 2: Visual verification of complete data entry flow on mobile viewport** - no files modified (visual checkpoint)

**Plan metadata:** _(docs commit below)_

## Files Created/Modified

- `src/components/assignments/AssignmentRow.tsx` - Expandable item row: person checkboxes, Everyone toggle, amber "!" warning, assignment count
- `src/components/assignments/AssignmentPanel.tsx` - Item list with empty states, passes assignItem from store to each AssignmentRow
- `src/components/assignments/AssignmentPanel.test.tsx` - 10 tests: items/counts display, empty states (no items, no people), expand to show checkboxes, assign person, unassign person, Everyone select all, Everyone deselect all, amber warning, count update
- `src/components/layout/AppShell.tsx` - Imports AssignmentPanel, replaces assignments tab placeholder — all three panels now live

## Decisions Made

- **Item-centric layout (not person-centric):** Matches the mental model at a restaurant table — "who ate this item?" rather than "what did this person eat?" Locked decision from CONTEXT.md.
- **Everyone toggle button:** Computes `allAssigned = assignedIds.length === people.length` — shows "Everyone" when not all assigned, "Deselect All" when all assigned. Single button serves both mass-assign and mass-unassign.
- **Amber "!" badge for unassigned:** Not red — keeps the warning visible but non-alarming in dim restaurant lighting. `text-amber-400`, not `text-red-400`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Complete data entry flow is functional and human-verified: People -> Items -> Assignments works end-to-end on mobile viewport
- All three panels persist data across tab switches (CSS hidden mount pattern from 02-01)
- 103 tests pass (Phase 1 engine + currency + PeoplePanel + ItemsPanel + AssignmentPanel)
- Store has populated assignments — Phase 3 (output/results) can call `getResult()` with fully assigned bills
- Remaining concern: rounding surplus UX display format for Phase 3 still unspecified — must be resolved during Phase 3 planning

## Self-Check: PASSED

- AssignmentRow.tsx found on disk
- AssignmentPanel.tsx found on disk
- AssignmentPanel.test.tsx found on disk
- Task 1 commit verified: 5064dce
- 103 tests pass (vitest run confirmed — 6 test files, all passing)
- ROADMAP.md phase 2 updated: 3/3 plans, status Complete
- REQUIREMENTS.md: ASGN-01 marked complete

---
*Phase: 02-data-entry*
*Completed: 2026-02-19*
