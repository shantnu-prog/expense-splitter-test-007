# Swipe Gesture Tab Navigation - Research

**Researched:** 2026-02-24
**Domain:** Touch gestures, horizontal swipe for tab navigation
**Confidence:** HIGH

## Summary

The project needs horizontal swipe gestures to navigate between 5 tabs (History, People, Items, Assign, Split) in a React 19 + TypeScript PWA. The current architecture uses CSS-hidden panels (all panels mounted, visibility toggled via `hidden` class), with `activeTab` state in `AppShell.tsx` and tab changes driven by `setActiveTab`.

**Primary recommendation:** Use `react-swipeable` (v7.0.2). It is explicitly React 19 compatible, ~3KB gzipped, provides a clean `useSwipeable` hook, and handles all the edge cases (scroll conflicts, threshold tuning, velocity detection) that would take 50+ lines to DIY correctly.

## Decision: react-swipeable vs Native Touch Events

### Use react-swipeable

| Factor | react-swipeable | Native DIY |
|--------|-----------------|------------|
| Bundle size | ~3KB gzipped | 0KB |
| Lines of code to integrate | ~15 lines | ~50-70 lines |
| Scroll conflict handling | Built-in `touch-action` + `preventScrollOnSwipe` | Must implement manually |
| Velocity detection | Built-in via `swipeDuration` | Must calculate manually |
| Per-direction delta thresholds | Built-in (object form) | Must implement manually |
| React 19 support | Yes (peer dep: `^19.0.0`) | N/A |
| Mouse swipe (desktop testing) | `trackMouse: true` | Extra work |
| Maintenance | Active, NearForm/Formidable maintained | You maintain it |

**Verdict:** The 3KB cost is trivially small for a PWA. The library eliminates ~4 edge cases you would otherwise hand-roll. Use it.

### Package Details

```
Name: react-swipeable
Version: 7.0.2
Peer deps: react ^16.8.3 || ^17 || ^18 || ^19.0.0
Size: ~87KB unpacked, ~3KB min+gzip
License: MIT
```

**Install:**
```bash
npm install react-swipeable
```

## Integration Pattern

### How It Fits the Current Architecture

The current flow:
1. `AppShell` holds `activeTab` state (`Tab` type: `'history' | 'people' | 'items' | 'assignments' | 'split'`)
2. `TabBar` calls `onTabChange(tab)` on click
3. Panels use `className={activeTab === 'xxx' ? '' : 'hidden'}` (CSS visibility, all stay mounted)

Swipe changes nothing about this architecture. It just adds another trigger for `setActiveTab` -- the swipe handler calls the same function the TabBar does.

### Tab Order Array

The `TABS` array already exists in `TabBar.tsx`:
```typescript
const TABS: { id: Tab; label: string }[] = [
  { id: 'history', label: 'History' },
  { id: 'people', label: 'People' },
  { id: 'items', label: 'Items' },
  { id: 'assignments', label: 'Assign' },
  { id: 'split', label: 'Split' },
];
```

This same array (or the `Tab` type) should be used to compute next/previous tab. Export `TABS` from `TabBar.tsx` so `AppShell` can reference it.

### Implementation Code

In `AppShell.tsx`:

```typescript
import { useSwipeable } from 'react-swipeable';
import { TABS } from './TabBar';  // export TABS from TabBar.tsx

// Inside AppShell component:
const handlers = useSwipeable({
  onSwipedLeft: () => {
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    if (currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1].id);
    }
  },
  onSwipedRight: () => {
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1].id);
    }
  },
  delta: 50,                    // min px before swipe registers
  swipeDuration: 500,           // max ms for a valid swipe
  preventScrollOnSwipe: false,  // let CSS touch-action handle it
  trackMouse: false,            // mobile-only; set true for dev testing
  trackTouch: true,
});

// Attach to the main content area:
return (
  <div className="flex flex-col h-screen">
    {/* ... SubtotalBar, editing indicator ... */}
    <main
      {...handlers}
      className="flex-1 overflow-y-auto pb-16 overscroll-contain"
      style={{ touchAction: 'pan-y' }}
    >
      {/* panels */}
    </main>
    <TabBar ... />
  </div>
);
```

**Key points:**
- No wrapping -- do NOT wrap at edges (History is first, Split is last, no circular navigation)
- `style={{ touchAction: 'pan-y' }}` allows vertical scroll but lets the browser yield horizontal gestures to JavaScript
- `preventScrollOnSwipe: false` is correct when using `touch-action: pan-y` (the CSS property is more reliable than JS preventDefault)
- No animation needed -- the `hidden` class swap is instant, which is fine

## Configuration Recommendations

### Threshold / Delta

| Parameter | Value | Why |
|-----------|-------|-----|
| `delta` | `50` (px) | Default is 10px which is too sensitive. 50px prevents accidental triggers from slight diagonal scrolling. For a 5-tab layout where accidental swipes are costly, be conservative. |
| `swipeDuration` | `500` (ms) | Prevents slow drags from triggering tab changes. Default is `Infinity`. 500ms means only deliberate flick gestures register. |

The `delta` parameter can also be an object for per-direction tuning:
```typescript
delta: { left: 50, right: 50, up: Infinity, down: Infinity }
```
Setting up/down to `Infinity` ensures only horizontal swipes are detected. However, `touch-action: pan-y` already handles this at the browser level, so the simple `delta: 50` is sufficient.

### Why 50px Delta

- 10px (default): Too sensitive. Users scrolling vertically with slight horizontal drift will accidentally change tabs.
- 30px: Reasonable but still triggers on sloppy scrolls.
- 50px: Good balance. A deliberate horizontal swipe easily covers 50px. Accidental drift rarely does.
- 100px: Too conservative. Requires exaggerated gesture.

## Edge Cases and Pitfalls

### 1. Vertical Scroll Interference

**Problem:** User scrolls vertically inside a panel, finger drifts horizontally, triggers tab change.

**Solution:** `touch-action: pan-y` on the swipe container. This tells the browser "vertical panning is native; horizontal gestures go to JavaScript." This is more reliable than `preventScrollOnSwipe` because it works at the compositor level, not in JS.

```css
/* Applied via style prop on the <main> element */
touch-action: pan-y;
```

### 2. Horizontal Scrolling Inside Panels

**Problem:** If any panel has horizontally scrollable content (e.g., a wide table), swiping that content should scroll it, not change tabs.

**Current status:** Looking at the panel types (People, Items, Assign, Split, History), none appear to have horizontal scroll. But if added later:

**Solution:** On any horizontally-scrollable child, add `touch-action: pan-x pan-y` to override the parent's `pan-y` and let the child handle horizontal touch natively. Or use the `onSwiping` callback to check `event.target` and abort if inside a scrollable container.

### 3. Input Fields and Form Elements

**Problem:** Swiping on text inputs, textareas, or number inputs should not trigger tab changes (users may be selecting text or adjusting input).

**Solution:** Check the event target in the swipe handler:

```typescript
onSwipedLeft: (eventData) => {
  const tag = (eventData.event.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  // ... proceed with tab change
},
```

Alternatively, add `data-no-swipe` attribute to containers that should not trigger swipes, and check for it via `closest()`.

### 4. Known iOS Safari Issue

**Problem:** `preventScrollOnSwipe` does not work when an input field is focused on iOS Safari (known react-swipeable issue #335).

**Solution:** Since we use `touch-action: pan-y` instead of `preventScrollOnSwipe`, this issue does not affect us. The CSS approach is the correct workaround for this exact bug.

### 5. Five-Tab Boundary Behavior

**Problem:** What happens when swiping right on History (index 0) or left on Split (index 4)?

**Solution:** Nothing. The handler checks bounds and does nothing at edges. No wrapping. This is the expected UX for linear tab layouts (consistent with iOS and Android tab patterns).

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `react-swipeable` dependency |
| `src/components/layout/TabBar.tsx` | Export `TABS` array (add `export` keyword) |
| `src/components/layout/AppShell.tsx` | Import `useSwipeable` + `TABS`, add handlers to `<main>`, add `touch-action: pan-y` |

That is it. Three files, minimal changes. No new components needed.

## Anti-Patterns to Avoid

- **Do NOT use `react-swipeable-views`** -- it is unmaintained (last update 2020), designed for animated view transitions, and incompatible with the CSS-hidden panel architecture.
- **Do NOT add transition animations** to panel visibility -- the `hidden` class approach is instant and preserves scroll position. Animation would require unmounting/remounting or transform logic.
- **Do NOT wrap around edges** -- swiping left on the last tab should not go to the first tab. Linear navigation matches the mental model of a multi-step flow.
- **Do NOT put swipe handlers on individual panels** -- attach to the shared `<main>` container so one handler covers all panels.

## Sources

- [react-swipeable npm](https://www.npmjs.com/package/react-swipeable) - Version, peer deps, description
- [react-swipeable GitHub](https://github.com/FormidableLabs/react-swipeable) - API docs, configuration
- [react-swipeable official docs](https://nearform.com/open-source/react-swipeable/docs/api/) - API reference, FAQ
- [react-swipeable issue #335](https://github.com/FormidableLabs/react-swipeable/issues/335) - iOS Safari input focus bug
- [react-swipeable issue #194](https://github.com/FormidableLabs/react-swipeable/issues/194) - Scroll conflict handling
