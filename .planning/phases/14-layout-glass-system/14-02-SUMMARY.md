---
phase: 14
plan: 02
subsystem: layout
tags: [subtotalbar, personcard, glass-card, glass-surface, ui-redesign]
dependency-graph:
  requires: [phase-14 plan-01 glass utilities, glass-card utility, glass-surface utility]
  provides: [glass SubtotalBar, glass PersonCard with detail drawer border]
  affects: [SubtotalBar.tsx, PersonCard.tsx]
tech-stack:
  added: []
  patterns: [glass-surface for sticky nav bars, glass-card for interactive cards, border-white/5 subtle dividers]
key-files:
  modified: [src/components/layout/SubtotalBar.tsx, src/components/summary/PersonCard.tsx]
decisions:
  - tracking-tight on tabular-nums amounts improves Inter digit spacing at text-lg
  - border-white/5 drawer divider is lighter than card border (white/10) for visual hierarchy
metrics:
  duration: 72s
  completed: 2026-02-24
---

# Phase 14 Plan 02: SubtotalBar Glass + PersonCard Glass Summary

**Glass-surface on SubtotalBar with tracking-tight amounts, glass-card on PersonCard with border-white/5 detail drawer divider**

## What Was Done

### Task 1: Apply glass-surface styling to SubtotalBar with tracking-tight
- Replaced `bg-gray-900 border-b border-gray-700` with `glass-surface` on the sticky outer div
- Added `tracking-tight` to the dollar amount span for tighter Inter digit spacing
- Preserved `sticky top-0 z-10` positioning and flexbox layout
- File: `src/components/layout/SubtotalBar.tsx`

### Task 2: Apply glass-card styling to PersonCard with glass detail drawer
- Replaced `bg-gray-900 border border-gray-800` with `glass-card` on the outer container div
- Added `border-t border-white/5` to the detail drawer content area for a subtle divider between header and Food/Tip/Tax rows
- Changed `pt-1` to `pt-2` for slightly more padding above the divider
- Preserved all accessibility attributes (role="button", tabIndex, aria-expanded, aria-label)
- Preserved grid-rows expand/collapse animation, CopyButton, and chevron rotation
- File: `src/components/summary/PersonCard.tsx`

### Task 3: Performance verification -- blur budget exit gate
- `npm run build`: Passed (256 KB JS, 52 KB CSS, 530 KB precache)
- `npx vitest run`: 144/144 tests passed across 12 test files
- Manual Chrome DevTools 4x CPU throttle test deferred to user (build and tests verified clean)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- `npm run build`: Succeeded with no errors or warnings
- `npx vitest run`: All 144 tests passed across 12 test files
- SubtotalBar: `glass-surface` with `tracking-tight` on amount
- PersonCard: `glass-card` with `border-t border-white/5` on detail drawer
- No accessibility attributes modified
- No animation behavior changed

## Commits

| Hash | Message | Files |
|------|---------|-------|
| f68dd39 | feat(phase-14): add glass styling to SubtotalBar and PersonCard | SubtotalBar.tsx, PersonCard.tsx |

## Decisions Made

1. **tracking-tight on tabular-nums**: Inter variable font renders tabular numbers slightly wide at text-lg. Adding tracking-tight (-0.025em) tightens digit spacing for a cleaner dollar amount display.
2. **border-white/5 for drawer divider**: The detail drawer separator uses white at 5% opacity, lighter than the card's own border (white/10 from glass-card), creating visual hierarchy between the card edge and internal content division.

## Self-Check: PASSED

- [x] src/components/layout/SubtotalBar.tsx exists
- [x] src/components/summary/PersonCard.tsx exists
- [x] 14-02-SUMMARY.md exists
- [x] Commit f68dd39 verified in git log
