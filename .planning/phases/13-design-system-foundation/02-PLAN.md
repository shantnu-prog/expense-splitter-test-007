# Plan 02: AppShell Layout Adjustments

**Phase:** 13 — Design System Foundation
**Goal:** Apply background gradient tint for glass blur visibility and increase bottom padding for the taller tab bar
**Requirements:** LYOT-04, LYOT-05
**Depends on:** Plan 01 (glass utilities must exist to visually verify gradient tint)

## Tasks

<task id="1">
<title>Add background gradient tint to AppShell</title>
<description>
Change the AppShell root div background from flat gray-950 to a subtle gradient that provides visual contrast for glassmorphism effects.

**Edit `src/components/layout/AppShell.tsx`:**

Change the root div (line 83):
```tsx
// Before:
<div className="flex flex-col h-screen">

// After:
<div className="flex flex-col h-screen bg-gradient-to-br from-gray-950 via-gray-950 to-blue-950/30">
```

**Key details:**
- `bg-gradient-to-br` creates a gradient from top-left to bottom-right
- `from-gray-950 via-gray-950` keeps most of the background nearly black
- `to-blue-950/30` adds a subtle blue tint at the bottom-right corner at 30% opacity
- This provides enough color variation for `backdrop-filter: blur()` to produce a visible frosted-glass effect
- The gradient is intentionally very subtle — it should not distract from content

**Verification:** When a `glass-card` element is placed over the gradient area, the blur effect produces a visible frosting. The gradient itself is barely noticeable as a standalone element.
</description>
<requirements>LYOT-04</requirements>
</task>

<task id="2">
<title>Increase AppShell bottom padding for taller tab bar</title>
<description>
Change the main content area's bottom padding from pb-16 to pb-20 to accommodate the future taller tab bar (min-h-14 in Phase 14).

**Edit `src/components/layout/AppShell.tsx`:**

Change the main element (line 104):
```tsx
// Before:
<main {...swipeHandlers} className="flex-1 overflow-y-auto pb-16 overscroll-contain" style={{ touchAction: 'pan-y' }}>

// After:
<main {...swipeHandlers} className="flex-1 overflow-y-auto pb-20 overscroll-contain" style={{ touchAction: 'pan-y' }}>
```

**Key detail:** pb-20 = 5rem = 80px. The current tab bar is ~56px (pb-16 = 64px). Phase 14 will increase it to min-h-14 (56px) plus SVG icons, so pb-20 provides sufficient clearance to prevent content cutoff behind the fixed tab bar.

**Verification:** Scroll to the bottom of any panel with content — the last item is fully visible and not obscured by the tab bar.
</description>
<requirements>LYOT-05</requirements>
</task>

## Completion Criteria

All of the following must be true:
1. AppShell background shows a subtle gradient tint visible behind glass-blurred elements (glass blur is not invisible against a flat background)
2. AppShell bottom padding is pb-20 and accommodates the taller tab bar without content cutoff
3. All 144 existing tests still pass
4. `npm run build` succeeds
