---
phase: 10-swipe-tab-ux
plan: 01
title: "Swipe navigation and unassigned count badge"
subsystem: layout/ux
tags: [swipe, navigation, badge, mobile, touch]

dependency_graph:
  requires: []
  provides: [swipe-navigation, tab-count-badge]
  affects: [AppShell, TabBar]

tech_stack:
  added: [react-swipeable@7.0.2]
  patterns: [useSwipeable-hook, touch-action-pan-y, input-exclusion]

key_files:
  created: []
  modified:
    - src/components/layout/AppShell.tsx
    - src/components/layout/TabBar.tsx
    - package.json

key_decisions:
  - "touch-action: pan-y via style prop (not Tailwind) for reliable compositor-level scroll handling"
  - "preventScrollOnSwipe: false — CSS handles scroll conflicts more reliably than JS"
  - "trackMouse: false — swipe is a mobile-only touch gesture"
  - "50px delta, 500ms swipeDuration — conservative thresholds to avoid accidental triggers"
  - "No wrapping at edges — swiping past first/last tab is a no-op"

metrics:
  duration_seconds: 89
  completed: "2026-02-24T06:18:00Z"
  tasks_completed: 3
  tasks_total: 3
  tests_passed: 144
  tests_total: 144
  build_size: "252 KB (79 KB gzip)"
---

# Phase 10 Plan 01: Swipe Navigation and Unassigned Count Badge Summary

Horizontal swipe gestures on main content area using react-swipeable v7.0.2 with touch-action: pan-y for scroll conflict prevention, plus upgraded Assign tab badge from dot to numeric count.

## What Was Done

### Task 1: Install react-swipeable and export TABS
- Installed react-swipeable v7.0.2 as production dependency
- Exported `TABS` array from `TabBar.tsx` so `AppShell.tsx` can use it for index-based navigation
- TypeScript check confirmed no breakage from the new export

### Task 2: Add swipe handlers to AppShell
- Added `useSwipeable` hook with `onSwipedLeft` (next tab) and `onSwipedRight` (prev tab) handlers
- Input exclusion: swipes on `INPUT`, `TEXTAREA`, `SELECT` elements are ignored
- Edge clamping: no wrapping — swiping right on History or left on Split does nothing
- Attached `{...swipeHandlers}` to `<main>` element with `style={{ touchAction: 'pan-y' }}`
- Hook placement before onboarding guard ensures React rules of hooks compliance

### Task 3: Upgrade Assign tab badge to count number
- Replaced small amber dot (`w-2 h-2 bg-amber-400`) with numeric count badge
- New badge: `min-w-5 h-5 bg-amber-500 text-[10px] font-bold text-white` with `rounded-full`
- Positioned at `left-1/2 ml-1 -top-0.5` for visibility next to tab label
- Preserved `aria-label` for accessibility

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- TypeScript: `npx tsc --noEmit` passes (clean)
- Tests: 144/144 pass across 12 test files
- Build: succeeds with 252 KB output (79 KB gzip)
- PWA: 11 precache entries generated correctly

## Commits

| Hash | Message |
|------|---------|
| a60fa91 | feat(ux): add swipe navigation and unassigned count badge |

## Self-Check: PASSED

- FOUND: src/components/layout/AppShell.tsx
- FOUND: src/components/layout/TabBar.tsx
- FOUND: .planning/phases/10-swipe-tab-ux/10-01-SUMMARY.md
- FOUND: commit a60fa91
