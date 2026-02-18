# Phase 2: Data Entry - Research

**Researched:** 2026-02-19
**Domain:** React mobile-first UI components, tabbed interface, dark theme, dollar-to-cents input handling, Zustand-connected forms, component testing
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Panel layout & flow:**
- Tabbed panels -- three tabs: People, Items, Assignments
- All tabs freely accessible at all times (no guided unlock or sequential flow)
- Running subtotal always visible across all tabs (sticky header or footer)
- Tab position: Claude's discretion (pick best for mobile thumb reach)

**Item entry interaction:**
- Add item via "+" button that creates a new empty row in the list -- user types name and price inline
- Price input in dollar format ($12.50) -- app converts to integer cents internally
- Quantity adjustment via plus/minus stepper buttons on each item row
- Editing existing items: Claude's discretion (pick fastest mobile-friendly approach)

**Assignment interaction:**
- Checkbox list -- each item expands to show a checklist of all people, user checks who's sharing
- Prominent "Everyone" button at the top of the checklist -- one tap to select/deselect all people
- Unassigned items show a subtle warning badge/icon (not alarming red highlight)
- Assignment tab layout: Claude's discretion (item-centric vs person-centric -- pick clearest approach)

**Mobile input & validation:**
- Empty person name: show inline error message ("Name required") when user taps Add
- Duplicate person names: blocked -- prevent adding a person with a name that already exists
- Invalid price input handling: Claude's discretion (pick approach that prevents most frustration)
- Dark mode color scheme -- dark background with light text for dim restaurant use

**Specific Ideas:**
- Primary use case is at a restaurant table on a phone -- every interaction should be one-thumb friendly
- Price input should trigger numeric decimal keyboard on iOS and Android (inputmode="decimal")
- The "Everyone" button on assignments is important -- most restaurant items (like shared appetizers) go to everyone

### Claude's Discretion
- Tab position (top vs bottom)
- Item editing interaction (tap inline vs edit button)
- Price input validation approach (real-time filtering vs validate on submit)
- Assignment tab layout (item-centric vs person-centric)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PEOP-01 | User can add people to the bill by name | People panel component with name input, inline validation for empty/duplicate names, store `addPerson()` action |
| PEOP-02 | User can remove a person from the bill | Remove button on each person row, store `removePerson()` action already handles assignment cleanup |
| ITEM-01 | User can add line items with a name and price | Items panel with "+" button creating empty row, inline name/price fields, dollar-to-cents conversion via `cents()` helper |
| ITEM-02 | User can edit an existing item's name or price | Inline editable fields on each item row, store `updateItem()` action |
| ITEM-03 | User can remove an item from the bill | Remove button on each item row, store `removeItem()` action handles assignment cleanup |
| ITEM-04 | User can set a quantity for each item | Plus/minus stepper on each item row, store `updateItem({ quantity })` action |
| ITEM-05 | Running subtotal updates as items are added/edited/removed | Computed subtotal derived from `config.items` on every render, displayed in sticky header/footer |
| ASGN-01 | User can assign each item to one or more people | Assignment panel with checkbox list per item, "Everyone" toggle button, store `assignItem()` action |
| UX-01 | Mobile-responsive layout with large tap targets for phone use at the table | Tailwind min-h-12 (48px) touch targets, dark color scheme, inputmode="decimal" for price inputs |
</phase_requirements>

---

## Summary

Phase 2 transforms the tested-but-invisible Phase 1 engine and store into a fully functional mobile data entry UI. The app already has a complete Zustand store with `addPerson`, `removePerson`, `addItem`, `removeItem`, `updateItem`, `assignItem`, and `getResult` actions, plus a pure calculation engine. This phase builds three tabbed panels (People, Items, Assignments) that drive those store actions, with a running subtotal visible across all tabs.

The core technical challenges are: (1) dollar-to-cents input conversion at the UI boundary without floating-point corruption, (2) mobile-optimized touch targets and numeric keyboards in a dark-themed interface, (3) efficient Zustand selector patterns to avoid unnecessary re-renders, and (4) component testing with Vitest + jsdom + React Testing Library, which requires new dev dependencies.

The dark mode decision is simplified by the fact that this app is ALWAYS dark -- there is no light/dark toggle. Rather than using Tailwind's `dark:` variant prefix, the most straightforward approach is to use dark-colored utility classes directly (e.g., `bg-gray-900`, `text-gray-100`). This avoids the overhead of `@custom-variant` configuration and the `dark` class on the HTML element entirely.

**Primary recommendation:** Build three tab panels as separate component directories, use `type="text" inputmode="decimal"` for price inputs with format-on-blur to cents conversion, place tabs at the bottom for thumb reach, use item-centric layout for assignments, and validate prices via real-time character filtering.

---

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | UI components | Already installed; Phase 1 decision |
| TypeScript | 5.9.3 | Type safety | Already installed; Phase 1 decision |
| Zustand | 5.0.11 | State management | Already installed with immer middleware; all store actions exist from Phase 1 |
| Tailwind CSS | 4.2.0 | Utility-first styling | Already installed with Vite plugin; dark colors used directly |
| Vite | 7.3.1 | Dev server + build | Already installed |
| Vitest | 4.0.18 | Test runner | Already installed; currently environment: 'node' |

### New Dependencies Required

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | latest | Component rendering in tests | All component tests: rendering, interaction verification |
| @testing-library/user-event | latest | Simulating user interactions | Click, type, keyboard events in component tests |
| @testing-library/jest-dom | latest | DOM assertion matchers | `toBeInTheDocument()`, `toHaveTextContent()`, `toBeVisible()` matchers |
| jsdom | latest | DOM environment for Vitest | Required by @testing-library/react; Vitest needs `environment: 'jsdom'` for component tests |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct dark Tailwind classes | `dark:` variant with `@custom-variant` | Unnecessary complexity for an always-dark app; no toggle needed |
| `type="text" inputmode="decimal"` | `type="number"` | `type="number"` causes browser-native formatting conflicts, spinner buttons, and inconsistent behavior across mobile browsers; `type="text"` with `inputmode` gives full control |
| Custom price input | react-currency-input-field | External dependency for simple dollar-to-cents conversion; the conversion logic is ~15 lines and well-understood |
| happy-dom | jsdom | happy-dom is faster but jsdom has broader compatibility and is the industry standard with @testing-library |

**Installation:**
```bash
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── engine/              # (Phase 1 - unchanged)
│   ├── types.ts
│   ├── engine.ts
│   └── engine.test.ts
├── store/               # (Phase 1 - unchanged)
│   ├── billStore.ts
│   └── billStore.test.ts
├── components/          # NEW in Phase 2
│   ├── layout/
│   │   ├── TabBar.tsx           # Bottom tab navigation
│   │   ├── SubtotalBar.tsx      # Sticky running subtotal display
│   │   └── AppShell.tsx         # Root layout: SubtotalBar + content + TabBar
│   ├── people/
│   │   ├── PeoplePanel.tsx      # Tab content: list + add form
│   │   ├── PersonRow.tsx        # Single person row with remove button
│   │   └── PeoplePanel.test.tsx # Component tests
│   ├── items/
│   │   ├── ItemsPanel.tsx       # Tab content: list + add button
│   │   ├── ItemRow.tsx          # Single item with inline edit fields + stepper
│   │   └── ItemsPanel.test.tsx  # Component tests
│   └── assignments/
│       ├── AssignmentPanel.tsx   # Tab content: item list with expandable checklists
│       ├── AssignmentRow.tsx     # Single item with person checklist
│       └── AssignmentPanel.test.tsx
├── hooks/               # NEW in Phase 2
│   └── useSubtotal.ts           # Derived subtotal from store items
├── utils/               # NEW in Phase 2
│   ├── currency.ts              # Dollar string <-> Cents conversion helpers
│   └── currency.test.ts         # Unit tests for conversion
├── test/                # NEW in Phase 2
│   └── setup.ts                 # Vitest setup file for @testing-library/jest-dom
├── App.tsx              # Updated: renders AppShell
├── App.css              # Can be removed or emptied
├── index.css            # Updated: dark base styles
└── main.tsx             # Unchanged
```

### Pattern 1: Always-Dark Color Scheme (No Toggle)

**What:** Since this app is always dark (restaurant table use), use dark-colored Tailwind utility classes directly. No `dark:` prefix, no `@custom-variant`, no `.dark` class on HTML.

**When to use:** Every component in this app.

```tsx
// Use dark colors directly -- no dark: prefix needed
<div className="min-h-screen bg-gray-950 text-gray-100">
  <header className="bg-gray-900 border-b border-gray-800">
    <h1 className="text-white font-semibold">Bill Splitter</h1>
  </header>
</div>
```

**Color palette recommendation for dark restaurant UI:**
| Element | Tailwind Class | Purpose |
|---------|---------------|---------|
| Page background | `bg-gray-950` | Deepest background, OLED-friendly |
| Card/panel background | `bg-gray-900` | Slight contrast from page |
| Input fields | `bg-gray-800` | Distinguishable from panel |
| Borders | `border-gray-700` | Subtle separation |
| Primary text | `text-gray-100` | High contrast on dark |
| Secondary text | `text-gray-400` | Labels, hints |
| Accent/interactive | `text-blue-400` / `bg-blue-600` | Buttons, active tabs |
| Danger | `text-amber-400` | Warning badges (not red, per user decision) |
| Error text | `text-red-400` | Validation errors |

### Pattern 2: Bottom Tab Navigation

**What:** Three-tab bar fixed to the bottom of the screen for thumb reach on mobile.

**When to use:** Root layout -- always visible.

**Recommendation: Bottom tabs.** Mobile UX research consistently shows bottom tabs are easier to reach with one-thumb operation. iOS and Android both place primary navigation at the bottom. Material Design recommends 48dp minimum height for bottom nav.

```tsx
// src/components/layout/TabBar.tsx
type Tab = 'people' | 'items' | 'assignments';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  unassignedCount: number; // For warning badge on Assignments tab
}

function TabBar({ activeTab, onTabChange, unassignedCount }: TabBarProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'people', label: 'People' },
    { id: 'items', label: 'Items' },
    { id: 'assignments', label: 'Assign' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-700 flex">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 min-h-12 py-3 text-sm font-medium relative
            ${activeTab === tab.id
              ? 'text-blue-400 border-t-2 border-blue-400'
              : 'text-gray-400'
            }`}
        >
          {tab.label}
          {tab.id === 'assignments' && unassignedCount > 0 && (
            <span className="absolute top-1 right-1/4 w-2 h-2 bg-amber-400 rounded-full" />
          )}
        </button>
      ))}
    </nav>
  );
}
```

### Pattern 3: Dollar-to-Cents Input with Format-on-Blur

**What:** Price inputs use `type="text" inputmode="decimal"` for mobile numeric keyboard. User types dollar amounts (`12.50`). The value is converted to integer cents on blur and committed to the store.

**When to use:** All price/monetary input fields.

**Recommendation: Real-time character filtering with format-on-blur.**
- While typing: filter out non-numeric characters except `.` and prevent multiple decimals
- On blur: parse to float, multiply by 100, round, commit as Cents to store
- Display: format from Cents back to dollar string

```tsx
// src/utils/currency.ts
import { cents, type Cents } from '../engine/types';

/** Convert a dollar string like "12.50" to integer cents. Returns null if invalid. */
export function dollarsToCents(input: string): Cents | null {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (cleaned === '' || cleaned === '.') return null;
  const parsed = parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return cents(Math.round(parsed * 100));
}

/** Convert integer cents to a display dollar string like "12.50". */
export function centsToDollars(value: Cents): string {
  return (value / 100).toFixed(2);
}

/** Filter input to allow only valid price characters (digits and one decimal point). */
export function filterPriceInput(value: string): string {
  // Remove everything except digits and dots
  let filtered = value.replace(/[^0-9.]/g, '');
  // Allow only one decimal point
  const parts = filtered.split('.');
  if (parts.length > 2) {
    filtered = parts[0] + '.' + parts.slice(1).join('');
  }
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    filtered = parts[0] + '.' + parts[1].slice(0, 2);
  }
  return filtered;
}
```

```tsx
// Price input component pattern
function PriceInput({ value, onChange }: { value: Cents; onChange: (c: Cents) => void }) {
  const [display, setDisplay] = useState(centsToDollars(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplay(filterPriceInput(e.target.value));
  };

  const handleBlur = () => {
    const parsed = dollarsToCents(display);
    if (parsed !== null) {
      onChange(parsed);
      setDisplay(centsToDollars(parsed)); // Normalize display
    } else {
      setDisplay(centsToDollars(value)); // Revert to last valid value
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-full pl-7 pr-3 py-2 min-h-12 bg-gray-800 text-gray-100 rounded-lg
                   border border-gray-700 focus:border-blue-500 focus:outline-none"
        placeholder="0.00"
      />
    </div>
  );
}
```

### Pattern 4: Quantity Stepper

**What:** Plus/minus buttons flanking a number display for adjusting item quantity.

**When to use:** Each item row.

```tsx
function QuantityStepper({ value, onChange }: { value: number; onChange: (q: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="min-w-10 min-h-10 rounded-lg bg-gray-800 text-gray-100
                   disabled:opacity-30 active:bg-gray-700"
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className="min-w-8 text-center text-gray-100 tabular-nums">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="min-w-10 min-h-10 rounded-lg bg-gray-800 text-gray-100
                   active:bg-gray-700"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
```

### Pattern 5: Item-Centric Assignment Layout

**What:** The Assignments tab lists items. Each item row expands to show a checklist of people. The "Everyone" button is at the top of each checklist.

**Recommendation: Item-centric layout.** This matches how people think about splitting: "who shares THIS item?" rather than "what items does THIS person have?" The item-centric approach maps directly to the store's `Assignments` type (`Record<ItemId, PersonId[]>`) and makes the "Everyone" button contextually obvious.

```tsx
// Assignment row pattern
function AssignmentRow({ item, people, assignedIds, onAssign }: Props) {
  const [expanded, setExpanded] = useState(false);
  const allAssigned = assignedIds.length === people.length;
  const noneAssigned = assignedIds.length === 0;

  const togglePerson = (personId: PersonId) => {
    const next = assignedIds.includes(personId)
      ? assignedIds.filter(id => id !== personId)
      : [...assignedIds, personId];
    onAssign(item.id, next);
  };

  const toggleEveryone = () => {
    onAssign(item.id, allAssigned ? [] : people.map(p => p.id));
  };

  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-4 min-h-12"
      >
        <span className="text-gray-100">{item.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">
            {assignedIds.length}/{people.length}
          </span>
          {noneAssigned && (
            <span className="text-amber-400 text-xs" aria-label="Unassigned">!</span>
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-3 space-y-1">
          <button
            onClick={toggleEveryone}
            className="w-full min-h-10 rounded-lg text-sm font-medium
                       bg-blue-600/20 text-blue-400 active:bg-blue-600/30"
          >
            {allAssigned ? 'Deselect All' : 'Everyone'}
          </button>
          {people.map(person => (
            <label
              key={person.id}
              className="flex items-center gap-3 min-h-10 px-2 rounded-lg
                         active:bg-gray-800 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={assignedIds.includes(person.id)}
                onChange={() => togglePerson(person.id)}
                className="w-5 h-5 rounded accent-blue-500"
              />
              <span className="text-gray-100">{person.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Pattern 6: Zustand Selectors with useShallow

**What:** Components that read multiple values from the store must use `useShallow` to prevent infinite re-renders in Zustand 5.

**When to use:** Any component selecting more than one field from the store.

```tsx
import { useShallow } from 'zustand/react/shallow';
import { useBillStore } from '../../store/billStore';

// CORRECT -- useShallow prevents re-render when references haven't changed
const { people, items, assignments } = useBillStore(
  useShallow((s) => ({
    people: s.config.people,
    items: s.config.items,
    assignments: s.config.assignments,
  }))
);

// ALSO CORRECT -- single primitive value needs no useShallow
const addPerson = useBillStore((s) => s.addPerson);

// WRONG -- creates new object each render, causes infinite loop
// const { people, items } = useBillStore((s) => ({ people: s.config.people, items: s.config.items }));
```

### Pattern 7: Vitest Per-File Environment Directive

**What:** Phase 1 engine/store tests use `environment: 'node'`. Phase 2 component tests need `environment: 'jsdom'`. Use per-file directives rather than changing the global config to keep engine tests fast.

**When to use:** At the top of every component test file.

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { PeoplePanel } from './PeoplePanel';
```

**Vitest setup file for jest-dom matchers:**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

**Vite config update:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'node', // Keep node as default for engine/store tests
    setupFiles: ['./src/test/setup.ts'], // jest-dom matchers for component tests
  },
});
```

### Anti-Patterns to Avoid

- **Storing tab state in Zustand:** Tab selection is local UI state, not bill data. Use `useState` in the App component, not the store.
- **Computing subtotal inside JSX:** Always compute subtotal via a selector or hook that reads from `config.items`, never inline in render.
- **Using `type="number"` for price inputs:** Causes browser-native spinner buttons, inconsistent decimal handling across browsers, and prevents custom formatting. Use `type="text" inputmode="decimal"` instead.
- **Forgetting `useShallow` on multi-value selectors:** Causes infinite re-renders in Zustand 5. Every selector returning an object/array needs `useShallow`.
- **Dollar values crossing the store boundary:** Convert dollars to cents at the UI edge (in `handleBlur`). Never pass dollar floats into store actions. The store expects `Cents`.
- **Using `dark:` prefix classes:** This app is always dark. Use dark colors directly. Adding `dark:` prefix requires unnecessary `@custom-variant` setup and HTML class management.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOM test environment | Custom DOM mocking | jsdom + @testing-library/react | Standard React testing ecosystem; handles React 19 concurrent features correctly |
| User interaction simulation | `fireEvent` for complex interactions | @testing-library/user-event | Simulates real user behavior (focus, blur, keyboard events) rather than raw DOM events |
| DOM assertion matchers | Custom `expect` extensions | @testing-library/jest-dom | `toBeInTheDocument()`, `toHaveTextContent()`, `toBeVisible()` are battle-tested |
| Mobile numeric keyboard | Native `type="number"` | `type="text" inputmode="decimal"` | Full control over input formatting without browser interference |
| Currency formatting library | react-currency-input-field | `dollarsToCents()` / `centsToDollars()` helpers (~15 lines) | Too simple to warrant a dependency; our Cents branded type makes it trivial |
| Tab routing | react-router | `useState` for active tab | Three local tabs with no URL routing needed; a router adds unnecessary complexity |

**Key insight:** The store layer is already complete from Phase 1. Phase 2 is pure UI -- the components call existing store actions and read existing store state. No new business logic beyond dollar-to-cents conversion at the input boundary.

---

## Common Pitfalls

### Pitfall 1: Dollar-to-Cents Conversion Precision
**What goes wrong:** `parseFloat("12.10") * 100` yields `1210.0000000000002` in JavaScript. If passed directly to the store without rounding, the branded Cents type masks a non-integer value.
**Why it happens:** IEEE 754 floating-point cannot represent 0.10 exactly.
**How to avoid:** Always use `Math.round(parseFloat(input) * 100)` at the conversion boundary. The `cents()` constructor in `types.ts` already calls `Math.round()`, so pass through it.
**Warning signs:** Subtotal showing values like `$12.100000000000001`.

### Pitfall 2: inputmode="decimal" Keyboard Differences
**What goes wrong:** iOS shows a decimal-capable numeric keyboard with `inputmode="decimal"`, but Android may show a slightly different layout. Neither prevents alphabetic input programmatically.
**Why it happens:** `inputmode` is a hint to the browser, not a constraint. Users can still paste text or switch keyboards.
**How to avoid:** Always validate input content in the `onChange` handler (filter non-numeric characters) AND in the `onBlur` handler (parse and validate the final value). Never rely solely on the keyboard type.
**Warning signs:** Users pasting "abc" into price field and seeing NaN in subtotal.

### Pitfall 3: Zustand useShallow Infinite Re-renders
**What goes wrong:** A component using `useBillStore((s) => ({ a: s.x, b: s.y }))` creates a new object reference every render, triggering an infinite re-render loop.
**Why it happens:** Zustand 5 uses reference equality by default. New object = different reference = re-render = new object.
**How to avoid:** Wrap all multi-value selectors with `useShallow` from `zustand/react/shallow`.
**Warning signs:** Browser tab freezes or React DevTools shows thousands of renders per second.

### Pitfall 4: Tab State Loss When Switching Tabs
**What goes wrong:** A user is typing a person's name, switches to the Items tab, switches back -- the partially typed name is gone because the People panel unmounts and remounts.
**Why it happens:** Conditional rendering (`{activeTab === 'people' && <PeoplePanel />}`) unmounts inactive panels.
**How to avoid:** Two options: (a) keep all panels mounted and hide inactive ones with CSS (`display: none` / `hidden`), or (b) store form input state in the component's parent or in Zustand. Option (a) is simpler and preserves scroll position too.
**Warning signs:** Users losing partially-entered data when exploring tabs.

### Pitfall 5: Missing Touch Target Sizes
**What goes wrong:** Buttons and interactive elements are smaller than 44x44px, causing mis-taps on phone screens.
**Why it happens:** Desktop-first development where elements look fine at cursor precision.
**How to avoid:** Apply `min-h-12 min-w-12` (48px) to all interactive elements. WCAG 2.5.5 (Level AAA) requires 44x44px; Google Material Design recommends 48dp. Use Tailwind's `min-h-12` class (48px = 3rem).
**Warning signs:** User complaints about difficulty tapping small buttons; "rage taps" on mobile.

### Pitfall 6: Uncontrolled vs Controlled Input Confusion with Price Fields
**What goes wrong:** Price input shows stale value after blur because the component reads from the store (Cents) but the user sees a dollar string. If the store update triggers a re-render before blur formatting completes, the display flickers.
**Why it happens:** Dual-source-of-truth: the display string is local state, the canonical value is in Zustand.
**How to avoid:** Use local `useState` for the display string. Sync from store to local state only when the item ID changes (not on every store update). Commit to store only on blur.
**Warning signs:** Price field "jumping" to a different value while the user is still typing.

---

## Code Examples

Verified patterns from official sources and the existing codebase:

### Running Subtotal Hook
```tsx
// src/hooks/useSubtotal.ts
import { useBillStore } from '../store/billStore';
import type { Cents } from '../engine/types';
import { cents } from '../engine/types';

/** Compute the running subtotal (food items only, no tip/tax) from store state. */
export function useSubtotal(): Cents {
  const items = useBillStore((s) => s.config.items);
  return items.reduce(
    (sum, item) => cents(sum + item.priceCents * item.quantity),
    cents(0)
  );
}
```

### SubtotalBar Component
```tsx
// src/components/layout/SubtotalBar.tsx
import { useSubtotal } from '../../hooks/useSubtotal';
import { centsToDollars } from '../../utils/currency';

export function SubtotalBar() {
  const subtotal = useSubtotal();
  return (
    <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-4 py-2
                    flex items-center justify-between">
      <span className="text-gray-400 text-sm">Subtotal</span>
      <span className="text-white font-semibold text-lg tabular-nums">
        ${centsToDollars(subtotal)}
      </span>
    </div>
  );
}
```

### People Panel with Validation
```tsx
// src/components/people/PeoplePanel.tsx
import { useState } from 'react';
import { useBillStore } from '../../store/billStore';
import { useShallow } from 'zustand/react/shallow';

export function PeoplePanel() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const { people, addPerson, removePerson } = useBillStore(
    useShallow((s) => ({
      people: s.config.people,
      addPerson: s.addPerson,
      removePerson: s.removePerson,
    }))
  );

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name required');
      return;
    }
    if (people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Name already exists');
      return;
    }
    addPerson(trimmed);
    setName('');
    setError('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add person form */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Person name"
            className="flex-1 min-h-12 px-4 bg-gray-800 text-gray-100 rounded-lg
                       border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            className="min-h-12 px-6 bg-blue-600 text-white font-medium rounded-lg
                       active:bg-blue-700"
          >
            Add
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>

      {/* People list */}
      <div className="flex-1 overflow-y-auto">
        {people.map((person) => (
          <div key={person.id} className="flex items-center justify-between px-4 py-3
                                          border-b border-gray-800">
            <span className="text-gray-100">{person.name}</span>
            <button
              onClick={() => removePerson(person.id)}
              className="min-h-10 min-w-10 text-gray-400 active:text-red-400"
              aria-label={`Remove ${person.name}`}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Component Test Pattern
```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
// Note: jest-dom matchers loaded globally via setup file

describe('PeoplePanel', () => {
  beforeEach(() => {
    // Reset Zustand store before each test
    useBillStore.setState({
      config: {
        items: [],
        people: [],
        assignments: {},
        tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
        tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      },
    });
  });

  it('adds a person when name is entered and Add is clicked', async () => {
    const user = userEvent.setup();
    render(<PeoplePanel />);

    await user.type(screen.getByPlaceholderText('Person name'), 'Alice');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows error for empty name', async () => {
    const user = userEvent.setup();
    render(<PeoplePanel />);

    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Name required')).toBeInTheDocument();
  });

  it('prevents duplicate names', async () => {
    const user = userEvent.setup();
    useBillStore.getState().addPerson('Alice');
    render(<PeoplePanel />);

    await user.type(screen.getByPlaceholderText('Person name'), 'Alice');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Name already exists')).toBeInTheDocument();
  });
});
```

---

## Discretion Recommendations

These are areas where the user granted Claude's discretion. Research findings support these recommendations:

### Tab Position: Bottom

**Recommendation:** Bottom tabs.

Mobile UX research consistently shows bottom-positioned navigation is easier to reach with one-thumb operation. Both iOS (UITabBarController) and Android (BottomNavigationView) place primary navigation at the bottom. The running subtotal can sit at the very top as a sticky header, giving a natural layout: subtotal at top, content in the middle, tab navigation at the bottom.

### Item Editing: Inline Tap-to-Edit

**Recommendation:** Tap inline fields to edit.

All item fields (name, price) are always visible as text. Tapping a field converts it to an editable input. This is faster than an "edit mode" toggle button because it eliminates one tap per edit. On blur, changes are committed to the store. This matches common mobile patterns (iOS Notes, Google Sheets) where tapping content makes it editable.

### Price Validation: Real-Time Character Filtering

**Recommendation:** Real-time character filtering (not validate-on-submit).

Filter invalid characters (letters, symbols) as the user types via `onChange`. Additionally, on blur, validate the full value (reject empty, negative, NaN). If invalid on blur, revert to the last valid value.

Rationale: validate-on-submit frustrates users who see an error only after moving on. Real-time filtering prevents the error state entirely for character-level issues, while format-on-blur handles structural issues (like "$..50").

### Assignment Tab Layout: Item-Centric

**Recommendation:** Item-centric (not person-centric).

Each row in the Assignment tab is an item. Tapping an item expands a checklist of people. This directly maps to the question "who shares this appetizer?" which is how people naturally think at a restaurant. The store's `Assignments` type (`Record<ItemId, PersonId[]>`) is item-indexed, making this approach a direct mapping.

Person-centric ("what did Alice order?") requires mental inversion and is harder to verify visually -- you'd need to cross-check multiple person panels to confirm all items are assigned.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `type="number"` for price inputs | `type="text" inputmode="decimal"` | Widely adopted 2020+ | Eliminates browser spinner buttons, gives full formatting control |
| Tailwind v3 `darkMode: 'class'` in config | Tailwind v4 `@custom-variant dark (...)` in CSS | Tailwind v4 (Jan 2025) | Config-less; but for always-dark apps, just use dark colors directly |
| `import shallow from 'zustand/shallow'` | `import { useShallow } from 'zustand/react/shallow'` | Zustand v5 (Oct 2024) | Old import path removed; must use `useShallow` hook |
| `fireEvent` for React testing | `userEvent.setup()` from @testing-library/user-event | @testing-library v14+ | `userEvent` simulates real browser behavior (focus, blur sequencing) |
| `@testing-library/jest-dom` extend-expect | `@testing-library/jest-dom/vitest` import | Recent | Direct Vitest integration without manual extend |

**Deprecated/outdated:**
- `type="number"` for currency inputs: Causes mobile spinner, prevents custom formatting, inconsistent decimal handling
- `shallow` default import from Zustand: Removed in v5; use `useShallow` hook
- `fireEvent.click()` for user interactions in tests: Use `userEvent.click()` which fires the full event sequence

---

## Open Questions

1. **Store reset in component tests: `setState` vs `getState().reset()`**
   - What we know: The store has a `reset()` action. For tests, we can either call `useBillStore.getState().reset()` or use `useBillStore.setState(initialState)`.
   - What's unclear: Whether `setState` on the global store works correctly across test isolation with Vitest's parallel execution.
   - Recommendation: Use `useBillStore.getState().reset()` in `beforeEach` for component tests (uses the existing action). For store-level tests, continue using `createBillStore` factory from `zustand/vanilla` as established in Phase 1.

2. **Keep all panels mounted or conditionally render?**
   - What we know: Keeping all panels mounted (with CSS `hidden`) preserves scroll position, input state, and avoids remount costs. Conditional rendering (`{activeTab === 'people' && ...}`) unmounts inactive panels.
   - What's unclear: Whether three simple panels have enough weight to justify always-mounted approach.
   - Recommendation: Keep all panels mounted using CSS `hidden` class. The panels are lightweight, and this prevents the "lost input state" pitfall described above. Use `className={activeTab === 'people' ? '' : 'hidden'}` pattern.

3. **Accessibility: ARIA roles for the tab bar**
   - What we know: WAI-ARIA tab pattern requires `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`.
   - What's unclear: How much ARIA is needed for a v1 restaurant app.
   - Recommendation: Add basic ARIA roles (`role="tablist"`, `role="tab"`) for correctness. Full keyboard tab navigation (arrow keys) can be deferred to Phase 4 (Polish).

---

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/engine/types.ts`, `src/store/billStore.ts`, `src/engine/engine.ts` -- verified store API, types, and existing patterns
- [Tailwind CSS v4 Dark Mode Docs](https://tailwindcss.com/docs/dark-mode) -- `@custom-variant` syntax, class-based dark mode
- [Zustand useShallow Docs](https://zustand.docs.pmnd.rs/hooks/use-shallow) -- selector optimization API
- [Zustand Prevent Rerenders Guide](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow) -- re-render prevention patterns
- [Vitest Test Environment Docs](https://vitest.dev/guide/environment) -- per-file `@vitest-environment` directive
- [Testing Library Setup Docs](https://testing-library.com/docs/react-testing-library/setup/) -- React Testing Library configuration

### Secondary (MEDIUM confidence)
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) -- 44x44px minimum touch target
- [CSS-Tricks inputmode Guide](https://css-tricks.com/everything-you-ever-wanted-to-know-about-inputmode/) -- mobile keyboard behavior
- [MDN ARIA checkbox role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/checkbox_role) -- accessible checkbox patterns
- [Tabs UX Best Practices](https://www.eleken.co/blog-posts/tabs-ux) -- tab design patterns

### Tertiary (LOW confidence)
- WebSearch results on bottom tab mobile ergonomics -- consistent across multiple sources but no single authoritative study cited
- WebSearch results on `inputmode="decimal"` Android quirks -- behavior may vary by Android version/manufacturer

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed except test utils; versions confirmed from package.json
- Architecture (component structure, patterns): HIGH -- follows established Phase 1 patterns and standard React conventions
- Dark mode approach: HIGH -- verified against Tailwind v4 official docs; simplified by always-dark decision
- Dollar-to-cents conversion: HIGH -- `cents()` constructor already handles `Math.round()`; pattern is well-established
- Mobile input behavior: MEDIUM -- `inputmode="decimal"` is well-supported but Android behavior varies by manufacturer
- Component testing: HIGH -- @testing-library/react is the industry standard; Vitest per-file environment is documented
- Pitfalls: HIGH -- most verified against Phase 1 experience and official docs
- Discretion recommendations: MEDIUM -- based on research synthesis, not user testing

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stack is stable; 30-day horizon is safe)
