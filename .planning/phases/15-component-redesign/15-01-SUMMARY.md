---
phase: 15
plan: 01
subsystem: ui/components
tags: [glass-card, redesign, row-components, list-spacing]
dependency-graph:
  requires: [phase-14 glass utilities, design-system-foundation]
  provides: [glass row cards, consistent list spacing]
  affects: [PersonRow, ItemRow, HistoryRow, AssignmentRow, PaymentSection, PeoplePanel, ItemsPanel, HistoryPanel, AssignmentPanel]
tech-stack:
  added: []
  patterns: [glass-card utility on all row components, space-y-2 list container pattern, overflow-hidden for expandable cards]
key-files:
  created: []
  modified:
    - src/components/people/PersonRow.tsx
    - src/components/people/PeoplePanel.tsx
    - src/components/items/ItemRow.tsx
    - src/components/items/ItemsPanel.tsx
    - src/components/history/HistoryRow.tsx
    - src/components/history/HistoryPanel.tsx
    - src/components/assignments/AssignmentRow.tsx
    - src/components/assignments/AssignmentPanel.tsx
    - src/components/summary/PaymentSection.tsx
decisions: []
metrics:
  duration: 90s
  completed: 2026-02-24
  tests: 144 passed
  build: 256 KB (80 KB gzip)
---

# Phase 15 Plan 01: Row Cards + List Spacing Summary

All row components converted to glass-card with rounded-xl corners, border-b separators removed, list containers given px-4 pt-3 space-y-2 spacing pattern

## What Was Done

### Task 1: PersonRow glass-card + PeoplePanel list spacing
- Changed PersonRow outer div from `border-b border-gray-800` flat separator to `glass-card rounded-xl`
- Changed PeoplePanel list container from `flex-1 overflow-y-auto` to `flex-1 overflow-y-auto px-4 pt-3 space-y-2`
- **Commit:** e93e275

### Task 2: ItemRow glass-card + ItemsPanel list spacing
- Changed ItemRow outer div from `border-b border-gray-800` flat separator to `glass-card rounded-xl`
- Changed ItemsPanel list container from `flex-1 overflow-y-auto` to `flex-1 overflow-y-auto px-4 pt-3 space-y-2`
- **Commit:** e93e275

### Task 3: HistoryRow glass-card + press-scale + HistoryPanel list spacing
- Changed HistoryRow outer button from `border-b border-gray-800 bg-gray-900/50 hover:bg-gray-800` to `glass-card rounded-xl hover:bg-white/5 press-scale`
- Changed HistoryPanel split list container from `flex-1` to `flex-1 px-4 pt-3 space-y-2`
- **Commit:** e93e275

### Task 4: AssignmentRow glass-card + AssignmentPanel list spacing
- Changed AssignmentRow outer div from `border-b border-gray-800` to `glass-card rounded-xl overflow-hidden`
- overflow-hidden clips expanded checklist content within rounded corners
- Changed AssignmentPanel list container from `flex-1 overflow-y-auto` to `flex-1 overflow-y-auto px-4 pt-3 space-y-2`
- **Commit:** e93e275

### Task 5: PaymentSection debtor rows glass-card
- Changed debtor row div from `bg-gray-900 border border-gray-800 rounded-xl` to `glass-card rounded-xl`
- Parent already had `gap-2` so no additional spacing needed
- **Commit:** e93e275

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- All 144 tests pass (12 test files)
- Production build succeeds: 256 KB JS (80 KB gzip), 52 KB CSS (9 KB gzip)
- No test modifications required -- all className changes are purely visual

## Requirements Covered

- CARD-01: PersonRow uses glass-card with rounded-xl, no border-b separator
- CARD-02: ItemRow uses glass-card with rounded-xl
- CARD-03: HistoryRow uses glass-card with hover highlight and press-scale
- CARD-04: AssignmentRow uses glass-card with overflow-hidden
- CARD-06: PaymentSection uses glass-card rows
- CARD-07: List containers use px-4 pt-3 space-y-2 spacing pattern

## Self-Check: PASSED

All 9 modified files verified on disk. Commit e93e275 verified in git log.
