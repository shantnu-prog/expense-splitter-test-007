# Plan 02: SubtotalBar Glass + PersonCard Glass

**Phase:** 14 — Layout + Glass System
**Goal:** Apply glass styling to SubtotalBar and PersonCard, proving the glass pattern works before Phase 15 propagates it to all components
**Requirements:** LYOT-03, CARD-05
**Depends on:** Plan 01 (TabBar glass establishes the visual pattern)

## Tasks

<task id="1">
<title>Apply glass-surface styling to SubtotalBar with tracking-tight</title>
<description>
Replace the opaque SubtotalBar background with glass-surface and add tighter number tracking.

**Edit `src/components/layout/SubtotalBar.tsx`:**

1. Change the outer div classes:

```tsx
// Before:
className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between"

// After:
className="sticky top-0 z-10 glass-surface px-4 py-2 flex items-center justify-between"
```

2. Add `tracking-tight` to the amount span:

```tsx
// Before:
className="text-white font-semibold text-lg tabular-nums"

// After:
className="text-white font-semibold text-lg tabular-nums tracking-tight"
```

**Key changes:**
- `bg-gray-900 border-b border-gray-700` → `glass-surface` — glass-surface provides its own border and semi-transparent background
- `tracking-tight` on amount for tighter digit spacing (Inter looks better with tracking-tight on tabular numbers)
- Keep `sticky top-0 z-10` — backdrop-filter works on sticky elements
- Keep all other structure unchanged

**Verification:**
1. SubtotalBar has a frosted glass appearance — list content scrolling behind it shows through with blur
2. Dollar amount digits are slightly tighter spaced
3. SubtotalBar still hidden on History tab
</description>
<requirements>LYOT-03</requirements>
</task>

<task id="2">
<title>Apply glass-card styling to PersonCard with glass detail drawer</title>
<description>
Replace the opaque PersonCard background with glass-card and add a subtle border to the detail drawer.

**Edit `src/components/summary/PersonCard.tsx`:**

1. Change the outer container div classes:

```tsx
// Before:
className="bg-gray-900 border border-gray-800 rounded-xl mb-3"

// After:
className="glass-card rounded-xl mb-3"
```

2. Add a subtle top border to the detail drawer content area (the div containing Food/Tip/Tax rows):

```tsx
// Before:
<div className="px-4 pb-3 pt-1 space-y-1">

// After:
<div className="px-4 pb-3 pt-2 space-y-1 border-t border-white/5">
```

**Key changes:**
- `bg-gray-900 border border-gray-800` → `glass-card` — glass-card provides backdrop-blur(12px), bg-white/0.05, border-white/0.1, and box-shadow
- Keep `rounded-xl mb-3` for consistent card shape and spacing
- Detail drawer gets `border-t border-white/5` — a very subtle divider that's lighter than the card's own border (white/10 on card, white/5 on drawer divider)
- `pt-1` → `pt-2` — slightly more padding above the divider line
- Keep all accessibility attributes, animations (grid-rows transition), and interactive behavior unchanged

**Verification:**
1. PersonCard has a frosted glass appearance with rounded corners
2. Expanding a card shows the detail rows (Food/Tip/Tax) separated from the header by a subtle border
3. The expand/collapse animation still works smoothly
4. CopyButton and chevron still function correctly
5. Settlement direction text ("owes X" / "Paid") still visible
</description>
<requirements>CARD-05</requirements>
</task>

<task id="3">
<title>Performance verification — blur budget exit gate</title>
<description>
Verify that the glass blur effects maintain acceptable performance under constrained conditions. This is the Phase 14 exit gate.

**Test procedure:**
1. Open the app in Chrome DevTools
2. Add at least 4 people and 4 items, assign all items, configure tip and tax
3. Navigate to the Split tab (so PersonCards, SubtotalBar, and TabBar are all visible)
4. Open DevTools → Performance tab → CPU: 4x slowdown
5. Record a performance trace while scrolling through the PersonCard list
6. Check the FPS meter — must maintain at least 50 FPS during scrolling

**If FPS drops below 50:**
- First: reduce glass-card blur from 12px to 8px in index.css
- Second: remove glass-card from PersonCard and use `bg-white/5 border border-white/10 rounded-xl` instead (visual approximation without blur)
- Third: limit glass to TabBar and SubtotalBar only (both use lighter 8px blur)

**Accessibility check:**
- Verify all text remains readable against glass backgrounds
- Check contrast ratio of gray-400 text on glass-surface (should pass WCAG AA for large text)

**Verification:**
1. Scrolling through PersonCards at 4x CPU throttle shows no visible jank
2. All text is readable — no contrast issues with glass backgrounds
3. All 144 existing tests pass
4. `npm run build` succeeds
</description>
<requirements>LYOT-01, LYOT-02, LYOT-03, CARD-05</requirements>
</task>

## Completion Criteria

All of the following must be true:
1. SubtotalBar has a frosted-glass appearance with tighter amount tracking
2. PersonCard renders as a glass card with visible blur effect and rounded corners
3. PersonCard detail drawer has a subtle `border-white/5` top separator
4. On Chrome DevTools 4x CPU throttle, scrolling through populated summary maintains ≥50 FPS
5. All text remains readable against glass backgrounds
6. Expand/collapse animation on PersonCard still works smoothly
7. All 144 existing tests pass
8. `npm run build` succeeds
