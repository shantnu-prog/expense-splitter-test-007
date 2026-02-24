---
phase: 07-history-edit-mode
plan: 01
subsystem: ui
tags: [history, tab-navigation, undo-delete, zustand, react]

# Dependency graph
requires:
  - "useHistoryStore: save/update/remove/restore actions from Phase 6"
  - "useBillStore: loadConfig, setCurrentSplitId, reset actions from Phase 6"
  - "useUndoDelete: existing undo hook with DeletedPerson and DeletedItem kinds"
provides:
  - "HistoryRow component: single history entry row with date, people names, computed total"
  - "HistoryPanel component: history list with empty state, delete with undo, New Split, tap-to-load"
  - "DeletedSplit kind in useUndoDelete: enables undo for history entry deletion"
  - "History tab in TabBar and AppShell: 5-tab navigation with history as first tab"
affects:
  - "07-02 (save/update button, editing indicator) — builds on HistoryPanel and AppShell changes"
  - "Phase 8 (payment text) — no direct impact, but SummaryPanel context unchanged"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "History row derives total via computeSplit — no stored totals, inputs-only philosophy"
    - "Initial tab computed from history store getState() in useState initializer — synchronous, no subscription"
    - "DeletedSnapshot union extended with new kind — existing hook logic works generically"

key-files:
  created:
    - "src/components/history/HistoryRow.tsx"
    - "src/components/history/HistoryPanel.tsx"
  modified:
    - "src/hooks/useUndoDelete.ts"
    - "src/components/layout/TabBar.tsx"
    - "src/components/layout/AppShell.tsx"

key-decisions:
  - "HistoryRow computes total on render via computeSplit — no stale cached totals, 50-entry cap makes this fast"
  - "Initial tab uses getState() not hook subscription — only needed once at mount, avoids unnecessary re-renders"
  - "SubtotalBar conditionally hidden on history tab — no active bill to show total for"
  - "People names show first 2 + overflow count — keeps row compact on mobile"

patterns-established:
  - "Pattern: Extend DeletedSnapshot union for new deletable entity types — hook logic is kind-agnostic"
  - "Pattern: Panel components receive onTabChange prop for cross-tab navigation"

requirements-completed: [HIST-01, HIST-03, HIST-04]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 07 Plan 01: History Panel, Tab Integration, Delete with Undo Summary

**History list UI with HistoryRow/HistoryPanel components, 5-tab navigation with history as default for returning users, and delete-with-undo via extended DeletedSnapshot union**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T01:16:47Z
- **Completed:** 2026-02-24T01:19:20Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Extended `useUndoDelete` hook with `DeletedSplit` kind for history entry deletion, including formatted toast message with date and people count
- Created `HistoryRow` component displaying formatted date, people names (first 2 + overflow), and computed total with separate tap targets for load and delete
- Created `HistoryPanel` component with empty state (New Split CTA), list view with delete-and-undo, load-split navigation, and new-split flow
- Added 'history' tab to TabBar (5 tabs total) and mounted HistoryPanel in AppShell with CSS hidden pattern, conditional SubtotalBar, and smart initial tab selection

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend useUndoDelete with DeletedSplit kind** - `3e81752` (feat)
2. **Task 2: Create HistoryRow component** - `5a99cf8` (feat)
3. **Task 3: Create HistoryPanel component** - `141f6ec` (feat)
4. **Task 4: Add history tab to TabBar and mount HistoryPanel in AppShell** - `55b1163` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/hooks/useUndoDelete.ts` - Added DeletedSplit interface, extended DeletedSnapshot union, added savedSplit toast message
- `src/components/history/HistoryRow.tsx` - New component: formatted date, people names with +N overflow, computed total, delete button
- `src/components/history/HistoryPanel.tsx` - New component: empty state, split list with HistoryRow, delete with undo toast, load and new-split handlers
- `src/components/layout/TabBar.tsx` - Extended Tab type with 'history', added History to front of TABS array
- `src/components/layout/AppShell.tsx` - Imported and mounted HistoryPanel, smart initial tab from history store, conditional SubtotalBar

## Decisions Made

- HistoryRow computes total on render via `computeSplit` — no stale cached totals; 50-entry cap makes this performant
- Initial tab uses `getState()` (not a hook subscription) — only needed once at mount, avoids unnecessary re-renders
- SubtotalBar conditionally hidden on history tab — no active bill context to display
- People names show first 2 names with +N overflow — keeps row compact on mobile screens

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HistoryPanel is mounted and functional — users can see, load, and delete saved splits
- Plan 07-02 can add save/update button to SummaryPanel and editing indicator to AppShell
- All 138 tests pass, TypeScript clean, production build succeeds

---
*Phase: 07-history-edit-mode*
*Completed: 2026-02-24*
