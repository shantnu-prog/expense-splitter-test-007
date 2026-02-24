---
phase: 14
plan: 01
subsystem: layout
tags: [tabbar, svg-icons, glass-surface, ui-redesign]
dependency-graph:
  requires: [phase-13 design tokens, glass-surface utility class]
  provides: [glass TabBar with SVG icons]
  affects: [TabBar.tsx]
tech-stack:
  added: [inline SVG icons]
  patterns: [TAB_ICONS record map, icon+label flex-col layout]
key-files:
  modified: [src/components/layout/TabBar.tsx]
decisions:
  - Inline SVG chosen over lucide-react for 5 tab icons (zero bundle cost, full control)
  - Removed border-t-2 active indicator in favor of blue text color on icon+label
metrics:
  duration: 85s
  completed: 2026-02-24
---

# Phase 14 Plan 01: TabBar SVG Icons + Glass Styling Summary

**Inline SVG icons for all 5 tabs with glass-surface frosted blur replacing opaque bg-gray-900 TabBar**

## What Was Done

### Task 1: Add inline SVG icons to all 5 TabBar tabs
- Created `TAB_ICONS` record mapping each tab ID to a 20x20 stroke-based SVG element
- Icons: clock (History), two-person silhouette (People), receipt/document (Items), linked-nodes (Assign), pie-chart (Split)
- All icons use `currentColor` to inherit active/inactive text color
- All icons have `aria-hidden="true"` since button labels provide accessible names
- Wrapped icon + label in `flex flex-col items-center gap-0.5` layout
- Label text reduced to `text-[10px] leading-tight` for compact display below icon

### Task 2: Apply glass-surface styling and increase height
- Replaced `bg-gray-900 border-t border-gray-700` with `glass-surface` on nav element
- Increased button min height from `min-h-12` (48px) to `min-h-14` (56px)
- Reduced vertical padding from `py-3` to `py-2` (icon+label fills the space)
- Removed `border-t-2 border-blue-400` from active state (blue text color is sufficient indicator)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- `npm run build`: Passed (256 KB JS, 52 KB CSS)
- `npx vitest run`: 144/144 tests passed across 12 test files
- All 5 tabs render SVG icon above label
- Active tab: blue-400 icon + label; Inactive tabs: gray-400
- Badge on Assign tab preserved (absolute positioned, unaffected by icon layout change)
- Keyboard navigation (ArrowLeft/Right, Home/End) unaffected

## Commits

| Hash | Message | Files |
|------|---------|-------|
| afea73d | feat(phase-14): add TabBar SVG icons and glass-surface styling | src/components/layout/TabBar.tsx |

## Decisions Made

1. **Inline SVG over icon library**: 5 inline SVGs add zero JS bundle cost vs lucide-react which would add ~7KB even with tree-shaking. Icons are simple enough that hand-authored SVG is maintainable.
2. **Removed active border-t-2**: The blue icon+label color is a strong enough active indicator. The top border conflicted with glass-surface's own subtle border (border-white/[0.06]).

## Self-Check: PASSED

- [x] src/components/layout/TabBar.tsx exists
- [x] 14-01-SUMMARY.md exists
- [x] Commit afea73d verified in git log
