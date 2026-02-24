---
phase: 07-history-edit-mode
plan: 02
subsystem: ui
tags: [zustand, history, save-update, editing-indicator, toast]

# Dependency graph
requires:
  - phase: 07-01
    provides: HistoryPanel with tap-to-load, AppShell with history tab and CSS-hidden panel mounting
  - phase: 06-02
    provides: useHistoryStore.save/update actions, useBillStore.currentSplitId/setCurrentSplitId/loadConfig
provides:
  - SummaryPanel Save/Update Split button that persists current bill to history
  - Unified toast state in SummaryPanel for both copy and save feedback
  - AppShell editing indicator banner showing "Editing saved split from [date]" with Back to History link
affects: [08-payment-text, any component that reads currentSplitId for edit-mode awareness]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Unified toast via useState + useRef timer — replaces useCopyToClipboard hook to support both copy and save toast from one state pair"
    - "useHistoryStore.getState() for imperative save/update calls — avoids subscribing SummaryPanel to full history state"
    - "Intl.DateTimeFormat for editing indicator date — locale-aware short date formatting"
    - "Conditional rendering with currentSplitId && activeTab !== 'history' — editing indicator hidden on history tab"

key-files:
  created: []
  modified:
    - src/components/summary/SummaryPanel.tsx
    - src/components/layout/AppShell.tsx

key-decisions:
  - "Unified toast state replaces useCopyToClipboard hook — single toast visible at a time, covers copy and save/update feedback with one state pair"
  - "Save button uses secondary style (gray-800 bg, border) to visually distinguish from primary Copy summary button (blue-600 bg)"
  - "useHistoryStore.getState() called imperatively in handleSave — SummaryPanel does not subscribe to splits array, only reads on action"
  - "Editing indicator placed between SubtotalBar and main content in AppShell — visible across all editor tabs but hidden on history tab"

patterns-established:
  - "Imperative store access via getState() for write-only operations — avoids unnecessary re-renders from subscribing to unneeded state slices"

requirements-completed: [HIST-02]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 07 Plan 02: Save/Update Button + Editing Indicator Summary

**Save/Update Split button in SummaryPanel with unified toast feedback, and editing indicator banner in AppShell showing saved split date with Back to History navigation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-24T01:21:09Z
- **Completed:** 2026-02-24T01:23:28Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- SummaryPanel now has a Save Split / Update Split button below the Copy summary button, with label driven by currentSplitId (null = Save, non-null = Update)
- Save creates new history entry via historyStore.save() and switches to Update mode by calling setCurrentSplitId with the new id
- Update overwrites existing entry via historyStore.update() preserving the same id
- Unified toast state (useState + useRef timer) replaces useCopyToClipboard hook, supporting both copy and save/update feedback through a single toast
- AppShell editing indicator banner appears below SubtotalBar when editing a saved split, showing "Editing saved split from [date]" with Intl.DateTimeFormat formatting
- "Back to History" link in the indicator navigates directly to history tab
- Indicator hidden on history tab and when not editing a saved split (currentSplitId is null)
- All 138 tests pass across 11 test files
- Production build succeeds at 240.66KB (74.93KB gzip)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Save/Update Split button to SummaryPanel** - `4bff2ea` (feat)
2. **Task 2: Add editing indicator to AppShell** - `2ec3b22` (feat)

## Files Created/Modified
- `src/components/summary/SummaryPanel.tsx` - Added historyStore import, currentSplitId/setCurrentSplitId/config to billStore selector, unified toast state (useState + useRef), handleSave function with save/update branching, Save/Update Split button with secondary styling, replaced useCopyToClipboard with direct navigator.clipboard calls
- `src/components/layout/AppShell.tsx` - Added currentSplitId to billStore selector, editingSplit lookup from historyStore, editingDate formatting via Intl.DateTimeFormat, editing indicator banner with conditional rendering and Back to History button

## Decisions Made
- Unified toast state replaces useCopyToClipboard hook — single toast visible at a time, simpler than managing two separate toast states
- Save button uses secondary gray styling to distinguish from primary blue Copy button — visual hierarchy makes primary action (copy) more prominent
- useHistoryStore.getState() for imperative write calls — SummaryPanel does not subscribe to splits array, avoiding re-renders when history changes
- Editing indicator positioned between SubtotalBar and main content — visible on all editor tabs (people, items, assign, split) but hidden on history tab

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] useRef requires explicit initial value for tsc -b build**
- **Found during:** Task 2 (npm run build verification)
- **Issue:** `useRef<ReturnType<typeof setTimeout>>()` without initial argument passes `npx tsc --noEmit` but fails `tsc -b` strict build used by `npm run build`
- **Fix:** Added explicit `undefined` initial value: `useRef<ReturnType<typeof setTimeout>>(undefined)`
- **Files modified:** src/components/summary/SummaryPanel.tsx
- **Commit:** 2ec3b22 (included in Task 2 commit)

## Issues Encountered
None beyond the useRef initial value fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full edit cycle complete: history panel (07-01) loads saved splits, editing indicator shows edit state, Save/Update button persists changes
- HIST-02: Users can save new splits and update existing saved splits from the Split tab
- currentSplitId flows through both AppShell (indicator) and SummaryPanel (button label) correctly
- Phase 8 (payment text / sharing) can build on the complete persistence + history + edit foundation

---
*Phase: 07-history-edit-mode*
*Completed: 2026-02-24*

## Self-Check: PASSED

- FOUND: src/components/summary/SummaryPanel.tsx
- FOUND: src/components/layout/AppShell.tsx
- FOUND: .planning/phases/07-history-edit-mode/07-02-SUMMARY.md
- FOUND commit: 4bff2ea (Task 1: Add Save/Update Split button to SummaryPanel)
- FOUND commit: 2ec3b22 (Task 2: Add editing indicator to AppShell)
