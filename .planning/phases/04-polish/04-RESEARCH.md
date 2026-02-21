# Phase 4: Polish - Research

**Researched:** 2026-02-21
**Domain:** Keyboard accessibility, undo/toast UX, empty-state UI, mobile QA (React 19 + Tailwind CSS 4)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Keyboard navigation
- Enter in text inputs does NOT submit — user must Tab to the Add button and press Enter/Space
- Tab switching does NOT auto-focus the first element in the new panel — focus stays neutral, user tabs into content manually
- Tab bar uses ARIA tabs pattern with Left/Right arrow key navigation between tabs
- Focus management after adding a person/item is Claude's discretion (focus new input for rapid entry vs focus added entry)
- No focus traps — user can always tab out of any panel

#### Deletion safety
- **Inline undo toast** (not confirmation dialog) — item/person disappears immediately, toast shows at bottom with Undo button
- Toast auto-dismisses after **5 seconds**
- Undo restores the person/item AND their assignments
- Toast shows a **warning about lost assignments**: "Deleted Alice (had 3 items assigned) — Undo"
- If a second delete happens while a toast is showing, the **first toast is replaced** (first undo opportunity is lost, new toast shows latest deletion)

#### Empty state guidance
- **Text + action button** style (no illustrations) — centered text explaining what's needed + a button that focuses the existing add input
- Action button focuses the existing add input at the top of the panel (no new inline input UI)
- Assign tab with missing data: **directs to the missing tab** — e.g., "Add items first to start assigning" with a button that switches to the Items tab
- Assign tab empty state keeps it simple — says what's missing without referencing the Split tab
- Split tab: shows **"Configure tip and tax above to see the split"** prompt until at least tip or tax is configured (not $0 defaults)
- **Minimal splash onboarding** on fresh load: app name + one-liner ("Split bills fairly") + "Start" button → goes to People tab
- Onboarding frequency (every fresh load vs first time only via localStorage) is Claude's discretion

#### Mobile QA refinements
- **iOS input zoom fix** — ensure all inputs use font-size >= 16px to prevent auto-zoom on focus
- **Full touch target audit** — all interactive elements meet 44x44px minimum
- **Scroll behavior fixes** — prevent overscroll bounce, lock body scroll when panels are scrollable, smooth scroll to newly added entries
- **Subtle transitions** — add transitions to tab switches, button presses, and state changes for perceived quality polish

### Claude's Discretion
- Focus destination after adding a person/item (new input vs added entry)
- Onboarding screen frequency (every empty load vs localStorage first-time-only)
- Specific transition timing and easing curves
- Exact empty state copy/wording
- Which elements need touch target enlargement (based on audit)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 4 is a pure-polish phase adding four distinct UX layers on top of an already-functional app: (1) WAI-ARIA keyboard navigation for the tab bar, (2) an undo toast for deletion safety, (3) empty-state guidance panels, and (4) mobile QA fixes. No new store actions are needed for empty states or keyboard navigation. The undo toast is the only piece that requires new Zustand state — a snapshot of a recently deleted person or item plus their assignments, held in local component state or a thin hook.

The most technically nuanced decision is accessibility for the undo toast. Accessibility authorities (Scott O'Hara, Sara Soueidan, Adrian Roselli) are clear: a toast with an interactive button must move focus to it — a `role=status` live region alone is not sufficient for WCAG 2.1 keyboard compliance. The user decision locks in the Gmail-style undo pattern (immediate delete + timed undo window), which is the right UX choice; the implementation just needs to ensure keyboard users can reach the Undo button. The pragmatic approach is to make the toast a focusable region with `tabIndex={0}` on the undo button (which is already in the tab order by being a real `<button>`) and pair it with an `aria-live="assertive"` announcement so screen readers hear the deletion immediately.

All other areas are well-covered by the existing Tailwind CSS 4 utility set. The tab bar already has the right `role="tablist"` / `role="tab"` / `aria-selected` structure; it just needs roving tabindex (tabIndex 0/-1) and an `onKeyDown` handler for Left/Right/Home/End. Empty states are pure JSX with `useRef` focus imperatives. Mobile fixes are additive CSS utility classes (`text-base` on inputs, `overscroll-contain` on scroll containers, `transition-opacity duration-150` on tab panels, `motion-reduce:transition-none` for accessibility).

**Primary recommendation:** Implement all four areas without adding any new npm dependencies. Use existing React primitives (`useRef`, `useState`, `useEffect`) and Tailwind CSS 4 utilities throughout.

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | `useRef` for focus management, `useEffect` for scroll-to-new-item, `useState` for undo snapshot | Already in project |
| Tailwind CSS | 4.2.0 | `transition-opacity`, `overscroll-contain`, `text-base`, `motion-reduce:` variants, `min-h-11`/`min-w-11` touch targets | Already in project |
| Zustand | 5.0.11 | Undo toast needs a snapshot of the deleted entity + its assignments | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-dom/flushSync` | (bundled with React 19) | Force synchronous DOM update before calling `scrollIntoView()` on newly added item | Use in `addItem`/`addPerson` handlers when scrolling to new entry |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom undo hook | `zundo` middleware | zundo adds full undo/redo history to entire store — overkill for single-entity delete; custom hook stores one snapshot only |
| Custom toast with undo | react-hot-toast / sonner | External library adds bundle weight and opinionated styling; the existing `Toast.tsx` is already built and just needs interactive-button support |
| `flushSync` for scroll | `useEffect` + `setTimeout(0)` | Both work; `flushSync` is the React-recommended pattern from official docs for "scroll to newly added DOM node"; `setTimeout` is a workaround |

**Installation:** No new packages required for Phase 4.

---

## Architecture Patterns

### Recommended Project Structure

No new directories needed. New files fit into existing component folders:

```
src/
├── components/
│   ├── layout/
│   │   ├── TabBar.tsx          # MODIFY: add roving tabindex + onKeyDown
│   │   ├── AppShell.tsx        # MODIFY: add tab panel transitions, onboarding gate
│   │   └── OnboardingScreen.tsx  # NEW: minimal splash screen
│   ├── people/
│   │   └── PeoplePanel.tsx     # MODIFY: empty state + focus-after-add + undo hook
│   ├── items/
│   │   └── ItemsPanel.tsx      # MODIFY: empty state + scroll-to-new + undo hook
│   └── shared/
│       └── UndoToast.tsx       # NEW: reusable undo toast component
├── hooks/
│   └── useUndoDelete.ts        # NEW: undo snapshot state + timer logic
└── index.css                   # MODIFY: overscroll-contain on html/body, scroll-smooth
```

### Pattern 1: Roving Tabindex for Tab Bar

**What:** The active tab has `tabIndex={0}`; all others have `tabIndex={-1}`. Arrow keys call `.focus()` on the target tab button via refs. The active tab is also updated by `onFocus` so focus and selection stay in sync.

**When to use:** Any composite widget where a single Tab stop navigates a group with arrow keys (WAI-ARIA tablist, radiogroup, toolbar patterns).

**Example:**
```typescript
// Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
// Source: https://amanexplains.com/how-to-create-an-accessible-tabs-component-in-react/

const tabRefs = useRef<Record<number, HTMLButtonElement | null>>({});

function handleKeyDown(event: React.KeyboardEvent, currentIndex: number) {
  const count = TABS.length;
  const keyMap: Record<string, () => void> = {
    ArrowRight: () => focusTab((currentIndex + 1) % count),
    ArrowLeft: () => focusTab((currentIndex - 1 + count) % count),
    Home:       () => focusTab(0),
    End:        () => focusTab(count - 1),
  };
  const action = keyMap[event.key];
  if (action) { event.preventDefault(); action(); }
}

function focusTab(index: number) {
  tabRefs.current[index]?.focus();
}

// In JSX: each tab button gets:
//   tabIndex={isActive ? 0 : -1}
//   ref={(el) => (tabRefs.current[index] = el)}
//   onKeyDown={(e) => handleKeyDown(e, index)}
//   onFocus={() => onTabChange(tab.id)}   // selection follows focus
```

**Key detail:** The existing `TabBar.tsx` already has `role="tablist"`, `role="tab"`, and `aria-selected`. It is missing: `tabIndex` management, `ref` array, and `onKeyDown`. The `aria-controls` / `aria-labelledby` connection between tabs and panels can be added for full ARIA compliance but is not required to pass the success criterion (keyboard navigation).

### Pattern 2: Undo Toast with Deletion Snapshot

**What:** When a user deletes a person or item, the store action executes immediately (optimistic delete). A snapshot of the deleted entity + its assignments is saved in a hook. A toast appears with an Undo button. A 5-second timer fires to discard the snapshot. If Undo is clicked before the timer fires, the snapshot is re-inserted into the store.

**When to use:** Single-entity delete where the cost of undo is low (restore one record) and confirmation dialogs would interrupt flow.

**Example:**
```typescript
// src/hooks/useUndoDelete.ts

import { useState, useRef, useCallback } from 'react';

export interface DeletedPerson {
  kind: 'person';
  person: Person;
  assignments: Record<ItemId, PersonId[]>; // full snapshot of assignments at delete time
}

export interface DeletedItem {
  kind: 'item';
  item: Item;
  assignedIds: PersonId[];
}

export type DeletedSnapshot = DeletedPerson | DeletedItem | null;

export function useUndoDelete(onRestore: (snapshot: DeletedSnapshot) => void) {
  const [snapshot, setSnapshot] = useState<DeletedSnapshot>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleDelete = useCallback((snap: DeletedSnapshot) => {
    // Replace any existing toast (first undo opportunity lost per CONTEXT.md)
    if (timerRef.current) clearTimeout(timerRef.current);
    setSnapshot(snap);
    timerRef.current = setTimeout(() => {
      setSnapshot(null);
      timerRef.current = null;
    }, 5000);
  }, []);

  const handleUndo = useCallback(() => {
    if (!snapshot) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    onRestore(snapshot);
    setSnapshot(null);
  }, [snapshot, onRestore]);

  return { snapshot, scheduleDelete, handleUndo };
}
```

**Store-side:** `removePerson` and `removeItem` already exist in `billStore.ts`. No store changes needed for the snapshot — the snapshot lives in the hook's local state. To restore, call `addPerson` (or reconstruct with a new store action) then `assignItem` for each assignment. Note: `addPerson` uses `crypto.randomUUID()` so a restored person gets a new ID. The restoration needs to call a new store action `restorePerson(person: Person, assignments: Record<ItemId, PersonId[]>)` that inserts the exact original person object (preserving the original ID so assignment references still match).

### Pattern 3: Empty State with Focus-Forwarding Action Button

**What:** When a panel list is empty, render a centered message and a button. The button calls `.focus()` on the panel's add-input via a ref that the panel already controls.

**When to use:** Any panel that has a primary add input and no items to display.

**Example:**
```typescript
// In PeoplePanel.tsx
const addInputRef = useRef<HTMLInputElement>(null);

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
      <p className="text-gray-400">No people added yet</p>
      <button
        onClick={() => addInputRef.current?.focus()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg min-h-11"
      >
        Add your first person
      </button>
    </div>
  );
}

// Input JSX gets: ref={addInputRef}
```

**Assign tab special case:** When either people or items list is empty, show a cross-tab navigation button. This requires the `onTabChange` callback to be threaded down to `AssignmentPanel`. Currently `AssignmentPanel` is not aware of the active tab. The solution is to pass `onTabChange` as a prop or hoist tab control via a context.

### Pattern 4: Scroll to Newly Added Item

**What:** When the user adds a person or item, the new entry should scroll into view automatically, especially if the list is long.

**When to use:** Any list where new items are appended and the list may overflow the viewport.

**Example:**
```typescript
// Source: https://react.dev/learn/manipulating-the-dom-with-refs (flushSync pattern)
import { flushSync } from 'react-dom';

function handleAdd() {
  flushSync(() => {
    addPerson(trimmed);  // Zustand store update
  });
  // DOM is now updated — safe to scroll
  listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
```

**Alternative (simpler):** Use `useEffect` watching the list length:
```typescript
useEffect(() => {
  if (people.length > 0) {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}, [people.length]);
```
The `useEffect` approach is preferred because `flushSync` is noted in official React docs as a rare escape hatch that can hurt performance. For this use case (appending to a list), `useEffect` watching list length is sufficient.

### Pattern 5: iOS Font-Size Fix for Input Zoom

**What:** Safari on iOS zooms the viewport when focusing an input whose computed `font-size` is less than 16px. All inputs must have `text-base` (16px) or larger.

**When to use:** Every `<input>` and `<select>` element in the app.

**Current state audit (from codebase scan):**

| Component | Input Element | Current Classes | Has text-base? |
|-----------|--------------|----------------|----------------|
| PeoplePanel | name input | `flex-1 min-h-12 px-4 bg-gray-800...` | NO — inherits body default |
| ItemRow | name input | `flex-1 bg-transparent text-gray-100...` | NO |
| ItemRow | price input | `w-24 min-h-10 bg-gray-800...` | NO |
| TipSegmentedControl | custom tip input | (unseen, likely missing) | NO |
| TaxInput | dollar/percent input | (unseen, likely missing) | NO |

**Fix:** Add `text-base` to all `<input>` className strings. Since Tailwind CSS 4 `text-base` = `font-size: 1rem` (16px), this resolves the Safari zoom issue.

### Anti-Patterns to Avoid

- **Dialog for deletion confirmation:** User decision locked in to undo toast. Do not add `window.confirm()` or a modal.
- **Auto-focus on tab switch:** CONTEXT.md explicitly prohibits auto-focusing the first element in a new panel.
- **Enter key submits forms:** CONTEXT.md explicitly prohibits. Remove the `onKeyDown={(e) => e.key === 'Enter' && handleAdd()}` handlers currently in `PeoplePanel.tsx`.
- **`role=status` alone for the undo toast:** Accessibility authorities confirm this is insufficient for a toast containing an interactive button. The undo button must be reachable via keyboard. Since it's a real `<button>` it is naturally in tab order — this is sufficient for this app (not a WCAG-strict product) but `aria-live="assertive"` should also announce the deletion to screen readers.
- **`flushSync` everywhere:** Use only for the scroll-to-new-item case. Prefer `useEffect` watching list length where feasible.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Undo middleware for whole store | Full temporal store (past/future stacks) | Single-snapshot hook in local state | Zundo tracks all state changes; for one-entity undo, a simple hook with one `useState` snapshot is 10x simpler |
| Focus trap in the tab bar | Custom focus trap | No focus trap — CONTEXT.md forbids it | Tab bar uses roving tabindex, not a trap |
| Toast notification system | Custom context/provider/reducer | Simple `useState` + `setTimeout` in `useUndoDelete` hook | The existing `Toast.tsx` already handles display; only the interactive variant needs a new component |
| Touch target CSS utilities | Custom `.touch-target` class | Tailwind `min-h-11 min-w-11` (44px = `h-11` in Tailwind 4) | `h-11` = 2.75rem = 44px exactly — the Apple HIG minimum |
| Reduced-motion detection | `window.matchMedia()` | Tailwind `motion-reduce:transition-none` variant | Tailwind's `motion-reduce:` prefix applies `@media (prefers-reduced-motion: reduce)` automatically |

**Key insight:** Every problem in this polish phase has a native React + Tailwind solution. Adding npm packages would increase bundle size with no quality gain.

---

## Common Pitfalls

### Pitfall 1: Undo Restores Wrong Person ID

**What goes wrong:** `addPerson(name)` in `billStore.ts` calls `crypto.randomUUID()` to assign a new ID. If you call `addPerson` to "restore" a deleted person, the restored person gets a different ID. The assignments map uses `PersonId` keys — the old ID is now orphaned and the person appears with no assignments.

**Why it happens:** The store's `addPerson` action does not accept an existing `PersonId`.

**How to avoid:** Add a `restorePerson(person: Person, assignments: Record<ItemId, PersonId[]>)` store action that inserts the original person object directly and re-applies the assignment entries. Similarly add `restoreItem(item: Item, assignedIds: PersonId[])`.

**Warning signs:** After undo, the person appears in the list but the Assign tab shows 0 assignments for all items they previously had.

### Pitfall 2: Timer Leaks on Unmount

**What goes wrong:** If the component that renders the undo toast unmounts (e.g., user navigates away) while the 5-second timer is pending, the `setTimeout` callback fires after unmount, calling `setState` on an unmounted component.

**Why it happens:** `useRef`-held timers are not automatically cleared on unmount.

**How to avoid:** Return a cleanup function from `useEffect` that clears the timer:
```typescript
useEffect(() => {
  return () => { if (timerRef.current) clearTimeout(timerRef.current); };
}, []);
```
Or store the timer in a ref and clear it in the `useUndoDelete` cleanup.

### Pitfall 3: Enter Key on PeoplePanel Still Submits

**What goes wrong:** `PeoplePanel.tsx` currently has `onKeyDown={(e) => e.key === 'Enter' && handleAdd()}` on the name input. The CONTEXT.md locked decision is that Enter does NOT submit — user must Tab to the Add button.

**Why it happens:** The Enter-to-submit behavior was implemented in Phase 2 before the keyboard-nav decision was made.

**How to avoid:** Remove the `onKeyDown` handler from the people name input. Verify no other inputs have Enter-submit handlers (ItemRow price/name inputs do not — they use `onBlur`).

### Pitfall 4: Tab Panel Hidden Class Breaks `aria-controls`

**What goes wrong:** The tab panels use `className={activeTab === 'people' ? '' : 'hidden'}` in `AppShell.tsx`. The `hidden` CSS class applies `display: none`. Elements inside `display: none` containers are removed from the accessibility tree. If `aria-controls` on tabs points to hidden panels, some screen readers may not announce the association correctly.

**Why it happens:** All panels are kept mounted (correct for scroll/state preservation), but only the active panel is visible.

**How to avoid:** Either (a) do not add `aria-controls` and rely on `aria-selected` alone (acceptable per WAI-ARIA APG), or (b) swap `hidden` for `visibility: hidden` + `display: block` so panels remain in the accessibility tree. The `hidden` attribute (vs CSS class) on the `<section>` element properly removes inactive panels from the accessibility tree, which is actually the correct behavior. Keep current approach; add `aria-controls` only if desired, accepting the limitation.

### Pitfall 5: iOS Overscroll Bounce on the Whole Page

**What goes wrong:** On iOS Safari, the `<body>` itself can rubber-band bounce when the user scrolls past the top or bottom. `overscroll-contain` on the `<main>` scroll container stops child-to-parent scroll propagation but does not prevent the body from bouncing.

**Why it happens:** iOS Safari's overscroll applies at the document level, not just scrollable children.

**How to avoid:** Add `overscroll-none` to `html` and `body` in `index.css`:
```css
html, body, #root {
  @apply min-h-screen bg-gray-950 text-gray-100 overscroll-none;
}
```
Then add `overscroll-contain` to `<main>` to keep panel scrolling self-contained. Note: `overscroll-none` eliminates the bounce entirely; if the design wants bounce within the panel (but not body), use `overscroll-contain` on `<main>` and leave `body` with `overscroll-none`.

### Pitfall 6: Undo Toast WCAG Timing Concern

**What goes wrong:** WCAG 2.2.1 (Timing Adjustable) requires that auto-dismissing elements give users enough time or a way to extend. A 5-second window with no extension mechanism may fail strict WCAG audits.

**Why it happens:** The toast is locked to 5 seconds per CONTEXT.md. This is a deliberate UX decision.

**How to avoid:** For this app (v1, no WCAG compliance requirement stated), 5 seconds matches the Gmail pattern and is acceptable. To mitigate: pause the timer when the user hovers over or focuses the toast. This is a "nice to have" implementation detail Claude can decide on.

---

## Code Examples

Verified patterns from official sources and codebase analysis:

### Roving Tabindex TabBar (complete updated implementation)

```typescript
// Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
// Source: amanexplains.com/how-to-create-an-accessible-tabs-component-in-react/

import { useRef } from 'react';

export function TabBar({ activeTab, onTabChange, unassignedCount }: TabBarProps) {
  const tabRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  function focusTab(index: number) {
    tabRefs.current[index]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent, currentIndex: number) {
    const count = TABS.length;
    const keyMap: Record<string, () => void> = {
      ArrowRight: () => focusTab((currentIndex + 1) % count),
      ArrowLeft:  () => focusTab((currentIndex - 1 + count) % count),
      Home:       () => focusTab(0),
      End:        () => focusTab(count - 1),
    };
    const action = keyMap[e.key];
    if (action) { e.preventDefault(); action(); }
  }

  return (
    <nav role="tablist" aria-orientation="horizontal" ...>
      <div className="flex">
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onFocus={() => onTabChange(tab.id)}  // selection follows focus
              onKeyDown={(e) => handleKeyDown(e, index)}
              ...
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

### UndoToast Component (interactive — keyboard reachable)

```typescript
// src/components/shared/UndoToast.tsx
// The Undo button is a real <button> so it is naturally in tab order.
// aria-live="assertive" on the container announces the message immediately.

interface UndoToastProps {
  message: string;        // e.g. "Deleted Alice (3 items assigned)"
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ message, visible, onUndo, onDismiss }: UndoToastProps) {
  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      role="status"
      className={`fixed bottom-20 inset-x-4 flex items-center justify-between
                  bg-gray-800 text-gray-100 text-sm font-medium px-4 py-3 rounded-xl
                  shadow-lg transition-opacity duration-200 pointer-events-auto
                  ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <span className="flex-1 mr-3">{message}</span>
      <button
        onClick={onUndo}
        className="text-blue-400 font-semibold min-h-10 px-2 shrink-0"
        aria-label="Undo deletion"
        tabIndex={visible ? 0 : -1}
      >
        Undo
      </button>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-gray-400 min-h-10 min-w-10 flex items-center justify-center shrink-0"
        tabIndex={visible ? 0 : -1}
      >
        ×
      </button>
    </div>
  );
}
```

**Note on accessibility:** The Undo button is a real `<button>` element in the DOM even when the toast is hidden (opacity-0). Setting `tabIndex={visible ? 0 : -1}` removes it from tab order when hidden, preventing a user from tabbing to an invisible button. The `aria-live="assertive"` region announces the deletion message immediately to screen readers.

### Store Additions for Undo Restoration

```typescript
// Addition to billStore.ts BillState interface:
restorePerson: (person: Person, assignments: Record<ItemId, PersonId[]>) => void;
restoreItem: (item: Item, assignedIds: PersonId[]) => void;

// stateCreator additions:
restorePerson(person: Person, assignments: Record<ItemId, PersonId[]>) {
  set((state) => {
    // Only restore if person is not already in list (idempotent)
    if (!state.config.people.find((p) => p.id === person.id)) {
      state.config.people.push(person);
    }
    // Merge restored assignments (only for items that still exist)
    for (const [itemId, personIds] of Object.entries(assignments) as [ItemId, PersonId[]][]) {
      if (state.config.assignments[itemId] !== undefined) {
        // Add the restored person back to the item's assignment list
        const existing = state.config.assignments[itemId];
        if (!existing.includes(person.id)) {
          state.config.assignments[itemId] = [...existing, person.id];
        }
      }
    }
  });
},

restoreItem(item: Item, assignedIds: PersonId[]) {
  set((state) => {
    if (!state.config.items.find((i) => i.id === item.id)) {
      state.config.items.push(item);
      state.config.assignments[item.id] = assignedIds;
    }
  });
},
```

### Empty State — PeoplePanel

```typescript
// Inside PeoplePanel — people.length === 0 branch:
const addInputRef = useRef<HTMLInputElement>(null);

// ...render:
{people.length === 0 && (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
    <p className="text-gray-400 text-base">No people added yet.</p>
    <p className="text-gray-500 text-sm">Add the people splitting this bill.</p>
    <button
      onClick={() => addInputRef.current?.focus()}
      className="px-5 py-2 bg-blue-600 text-white rounded-lg min-h-11 text-sm font-medium"
    >
      Add your first person
    </button>
  </div>
)}
```

### iOS Font-Size Fix

```typescript
// All <input> elements must add text-base (16px) to className:
// Before:
className="flex-1 min-h-12 px-4 bg-gray-800 text-gray-100 rounded-lg ..."
// After:
className="flex-1 min-h-12 px-4 bg-gray-800 text-gray-100 text-base rounded-lg ..."
```

### Tab Panel Transitions

```typescript
// AppShell.tsx — replace hidden class with opacity transition:
// Option A: Keep hidden (simpler, preferred to preserve scroll state):
<div className={activeTab === 'people' ? '' : 'hidden'}>

// Option B: Opacity-only transition (panels always rendered, no layout shift):
// This requires position:absolute or similar to avoid stacking panels.
// Recommendation: Keep 'hidden' approach (it works); add transition only to
// the VISIBLE panel appearing, via a CSS class swap or Tailwind animate-in.
// For subtle quality: add transition-opacity when panel becomes active:
<div className={`transition-opacity duration-150 ${activeTab === 'people' ? 'opacity-100' : 'hidden opacity-0'}`}>
// Note: opacity-0 + hidden together may not transition; test in browser.
// Safest: use only 'hidden' and skip tab-switch transition to avoid hidden/display conflict.
```

**Recommendation for tab transitions:** The `display: none` + opacity transition conflict is a known CSS gotcha. The safest Tailwind 4 approach is to not try to animate the display change. Instead, add a subtle `animate-in` effect only on the newly visible panel using a CSS keyframe. Alternatively, keep `hidden` as-is and add transitions only to buttons and state changes (hover, active states) which do not suffer from this conflict.

### Onboarding Screen (localStorage first-time-only)

```typescript
// src/hooks/useOnboarding.ts
import { useState } from 'react';

const ONBOARDING_KEY = 'bill-splitter-onboarding-complete';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    // Show if never completed before
    return localStorage.getItem(ONBOARDING_KEY) === null;
  });

  function dismissOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }

  return { showOnboarding, dismissOnboarding };
}
```

**Recommendation (Claude's discretion):** Use localStorage first-time-only approach. Every-load onboarding would interrupt returning users who know the app. The localStorage check costs one synchronous read during initial render — negligible.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `role=status` alone for interactive toasts | Move focus or use `alertdialog` per WCAG | Interactive toasts need focus movement; use `aria-live="assertive"` + real `<button>` in tab order |
| `flushSync` for all post-state DOM operations | `useEffect` watching list length | Prefer `useEffect`; `flushSync` is escape hatch for library authors |
| Custom focus trap implementations | Radix UI / React Aria focus management | For this app, no focus traps needed (CONTEXT.md); native `<button>` tab order is sufficient |
| CSS `@keyframes` for panel transitions | Tailwind `transition-opacity duration-150` | Tailwind 4 has full transition utilities; avoid raw keyframes for simple opacity |
| Global font-size hack for iOS | `text-base` per input | Per-input `text-base` class is more targeted than setting global font-size |

**Deprecated/outdated:**
- `tabIndex="0"` on ALL tab buttons (old pattern): Only the active tab gets `tabIndex={0}`; inactive tabs get `-1`. The current `TabBar.tsx` does not set `tabIndex` at all — this is the bug to fix.
- `onKeyDown` Enter-to-submit in text inputs: Remove from `PeoplePanel.tsx`. This was implemented before the keyboard-nav decision was locked.

---

## Open Questions

1. **Assignment tab `onTabChange` threading**
   - What we know: `AssignmentPanel` needs to navigate to Items or People tab from its empty state
   - What's unclear: How to pass `onTabChange` down — currently `AppShell` controls tab state; `AssignmentPanel` is unaware of it
   - Recommendation: Pass `onTabChange` as a prop to `AssignmentPanel`; update `AppShell` to thread it through

2. **Undo toast positioning with existing Toast component**
   - What we know: The existing `Toast.tsx` (used in `SummaryPanel`) is `pointer-events-none` and shows at `bottom-20`. The new `UndoToast` must have `pointer-events-auto` (Undo button must be clickable).
   - What's unclear: Whether both toasts could appear simultaneously (copy toast + undo toast)
   - Recommendation: Keep the two toast components separate — copy toast stays `pointer-events-none` (no interaction needed), undo toast gets a separate component positioned at `bottom-20` with `pointer-events-auto`. They can stack visually if both trigger at once (rare edge case, acceptable for v1).

3. **Split tab empty state trigger condition**
   - What we know: Show "Configure tip and tax above to see the split" when tip and tax are both at $0 default
   - What's unclear: Whether this message overlaps with the unassigned-items error in `SummaryPanel`
   - Recommendation: The Split tab renders `TipTaxPanel` then `SummaryPanel` in sequence. The empty state for the split should appear between them or within `SummaryPanel` only when both tip and tax are $0 AND items are all assigned. Simplest: show the empty state at the top of the `SummaryPanel` when `tipConfig.amountCents === 0 && taxConfig.amountCents === 0 && result.ok`.

---

## Sources

### Primary (HIGH confidence)

- W3C WAI-ARIA APG — Tabs Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ — keyboard interactions, ARIA attributes, roving tabindex
- React Official Docs — Manipulating DOM with Refs: https://react.dev/learn/manipulating-the-dom-with-refs — `flushSync` + `scrollIntoView` pattern
- React Official Docs — `flushSync`: https://react.dev/reference/react-dom/flushSync — use sparingly
- Tailwind CSS Docs — Transition Property: https://tailwindcss.com/docs/transition-property — `transition-opacity`, `duration-*`, `motion-reduce:` variants
- Tailwind CSS Docs — Overscroll Behavior: https://tailwindcss.com/docs/overscroll-behavior — `overscroll-contain`, `overscroll-none`
- Codebase analysis — `TabBar.tsx`, `AppShell.tsx`, `PeoplePanel.tsx`, `ItemRow.tsx`, `Toast.tsx`, `billStore.ts`

### Secondary (MEDIUM confidence)

- Sara Soueidan — Accessible Notifications with ARIA Live Regions Part 2: https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-2/ — interactive toast requires focus movement, not live region alone
- Adrian Roselli — Defining Toast Messages: https://adrianroselli.com/2020/01/defining-toast-messages.html — `alertdialog` for interactive content
- Aman Explains — Accessible Tabs in React: https://amanexplains.com/how-to-create-an-accessible-tabs-component-in-react/ — complete roving tabindex implementation
- CSS-Tricks — 16px prevents iOS form zoom: https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/

### Tertiary (LOW confidence)

- WebSearch synthesis on localStorage onboarding pattern — well-known pattern, no official source needed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all existing libraries cover requirements
- Architecture: HIGH — patterns verified against W3C APG and React official docs
- Pitfalls: HIGH — timer leak and ID-mismatch pitfalls are deterministic bugs, not hypothetical
- Accessibility nuances (interactive toast): MEDIUM — primary sources agree on direction but practical implementation varies by screen reader

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable domain — WAI-ARIA patterns and Tailwind 4 utilities unlikely to change)
