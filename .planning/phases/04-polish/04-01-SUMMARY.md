---
phase: 04-polish
plan: 01
subsystem: ui-polish
tags: [keyboard-navigation, accessibility, mobile-ux, onboarding, empty-states]
dependency_graph:
  requires: []
  provides: [keyboard-navigation, onboarding-screen, empty-state-guidance, ios-mobile-polish]
  affects: [TabBar, AppShell, PeoplePanel, ItemsPanel, AssignmentPanel, SummaryPanel, ItemRow, TaxInput, TipSegmentedControl, PersonRow]
tech_stack:
  added: []
  patterns: [roving-tabindex, wai-aria-tabs, localStorage-gated-onboarding, cross-tab-navigation]
key_files:
  created:
    - src/components/layout/OnboardingScreen.tsx
    - src/hooks/useOnboarding.ts
  modified:
    - src/components/layout/TabBar.tsx
    - src/components/layout/AppShell.tsx
    - src/components/people/PeoplePanel.tsx
    - src/components/people/PeoplePanel.test.tsx
    - src/components/items/ItemsPanel.tsx
    - src/components/items/ItemRow.tsx
    - src/components/assignments/AssignmentPanel.tsx
    - src/components/assignments/AssignmentPanel.test.tsx
    - src/components/summary/SummaryPanel.tsx
    - src/components/tip-tax/TipSegmentedControl.tsx
    - src/components/tip-tax/TaxInput.tsx
    - src/components/people/PersonRow.tsx
    - src/index.css
decisions:
  - "[Phase 04-polish 04-01]: Roving tabindex with onFocus-follows-selection per WAI-ARIA APG — active tab tabIndex=0, all others -1, focus triggers tab switch"
  - "[Phase 04-polish 04-01]: Enter-to-submit removed from PeoplePanel input (locked CONTEXT.md decision) — user must Tab to Add button"
  - "[Phase 04-polish 04-01]: useOnboarding uses localStorage first-visit detection (key absent = first visit) — no expiry, dismissal is permanent"
  - "[Phase 04-polish 04-01]: SummaryPanel shows hint banner (not blocking) when tip+tax both zero — full split still renders, avoids blocking working summary"
metrics:
  duration: 4 min
  completed: 2026-02-21
  tasks_completed: 2
  files_changed: 13
---

# Phase 4 Plan 1: Keyboard Navigation, Onboarding, Empty States, and Mobile Polish Summary

WAI-ARIA roving tabindex tab navigation with arrow key support, first-visit onboarding splash gated by localStorage, empty state guidance panels with action buttons, and comprehensive mobile QA polish (iOS font-size fix, 44px touch targets, overscroll-none).

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Keyboard nav + remove Enter-submit + onboarding | 4d4ba94 | TabBar.tsx, AppShell.tsx, OnboardingScreen.tsx, useOnboarding.ts, PeoplePanel.tsx |
| 2 | Empty states + mobile QA polish | 6f0a785 | ItemsPanel.tsx, AssignmentPanel.tsx, SummaryPanel.tsx, ItemRow.tsx, TaxInput.tsx, TipSegmentedControl.tsx, index.css |

## What Was Built

### Keyboard Navigation (WAI-ARIA Tabs Pattern)
- `TabBar.tsx` implements roving tabindex: active tab `tabIndex=0`, inactive tabs `tabIndex=-1`
- `ArrowRight` / `ArrowLeft` move focus between tabs with wrapping
- `Home` / `End` jump to first / last tab
- `onFocus` triggers `onTabChange` — selection follows focus per WAI-ARIA APG specification
- `aria-orientation="horizontal"` added to `<nav role="tablist">`

### Onboarding Splash Screen
- `OnboardingScreen.tsx`: minimal splash with "SplitCheck" heading, "Split bills fairly" tagline, and "Start" button
- `useOnboarding.ts`: localStorage-backed hook — key absent on first visit triggers splash; dismissal stores `bill-splitter-onboarding-complete=true` permanently
- `AppShell.tsx`: `if (showOnboarding) return <OnboardingScreen />` gates entire app render

### Empty State Guidance
- **PeoplePanel**: centered empty state with "No people added yet" + "Add your first person" button that calls `addInputRef.current?.focus()`
- **ItemsPanel**: centered empty state with "No items on the bill" + instruction to use + button
- **AssignmentPanel**: cross-tab navigation — "Go to Items" and "Go to People" buttons call `onTabChange` prop; AssignmentPanel now accepts `onTabChange: (tab: Tab) => void`
- **SummaryPanel**: non-blocking hint banner "Configure tip and tax above to see the full split" when both tip and tax are zero; summary still renders

### Mobile QA Polish
- **iOS font-size fix**: `text-base` (16px) added to all inputs in PeoplePanel, ItemRow (name + price), TipSegmentedControl (custom input), TaxInput — prevents iOS Safari auto-zoom on focus
- **Touch targets**: PersonRow/ItemRow remove buttons and ItemRow quantity buttons bumped from `min-h-10 min-w-10` (40px) to `min-h-11 min-w-11` (44px) — meets Apple HIG minimum
- **TaxInput mode buttons**: `min-h-11` added — were missing min-h entirely
- **Overscroll**: `overscroll-none` on `html, body, #root` in `index.css` eliminates iOS rubber-band bounce; `overscroll-contain` on `<main>` scroll area

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated PeoplePanel test for Enter-key behavior**
- **Found during:** Task 1
- **Issue:** Existing test "adds a person on Enter key" was testing the behavior we intentionally removed (Enter-to-submit). It would fail after our change.
- **Fix:** Updated test to "does NOT add a person on Enter key" — verifies the new correct behavior: Enter does NOT submit, empty state is visible.
- **Files modified:** `src/components/people/PeoplePanel.test.tsx`
- **Commit:** 4d4ba94

**2. [Rule 1 - Bug] Updated AssignmentPanel tests for new prop + empty state text**
- **Found during:** Task 2
- **Issue:** Tests called `<AssignmentPanel />` without the new required `onTabChange` prop, and expected old empty state text ("Add items first" / "Add people first") that was replaced.
- **Fix:** Added `vi` import, added `mockOnTabChange = vi.fn()`, updated all renders to pass `onTabChange={mockOnTabChange}`, updated empty state assertions to match new text and verify action buttons.
- **Files modified:** `src/components/assignments/AssignmentPanel.test.tsx`
- **Commit:** 6f0a785

## Verification

All 125 tests pass. Zero regressions.

## Self-Check: PASSED

- FOUND: src/components/layout/OnboardingScreen.tsx
- FOUND: src/hooks/useOnboarding.ts
- FOUND: .planning/phases/04-polish/04-01-SUMMARY.md
- FOUND: commit 4d4ba94 (Task 1)
- FOUND: commit 6f0a785 (Task 2)
- All 125 tests pass
