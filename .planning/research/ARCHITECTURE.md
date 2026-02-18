# Architecture Research

**Domain:** Client-side expense splitting web app
**Researched:** 2026-02-19
**Confidence:** MEDIUM (established patterns from domain knowledge; external sources unavailable during research session)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          UI Layer                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  People  │  │  Items   │  │Assignment│  │  Summary     │    │
│  │  Panel   │  │  Panel   │  │  Panel   │  │  Panel       │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
│       │             │             │               │             │
├───────┴─────────────┴─────────────┴───────────────┴─────────────┤
│                       State Layer                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              App State (single source of truth)            │  │
│  │  people[] | items[] | assignments{} | tipConfig | taxConfig│  │
│  └─────────────────────────────┬──────────────────────────────┘  │
│                                │                                 │
├────────────────────────────────┴─────────────────────────────────┤
│                     Calculation Engine                           │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │  Item      │  │  Tip / Tax   │  │  Per-Person Total      │   │
│  │  Allocator │  │  Calculator  │  │  + Rounding Engine     │   │
│  └────────────┘  └──────────────┘  └────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

There is no backend, no network layer, and no persistent storage beyond the browser session. All state lives in memory during the session. The calculation engine is a set of pure functions that derive totals from state — no side effects.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| People Panel | Add/remove/rename participants | List + name input; no sorting needed |
| Items Panel | Add/edit/remove line items with prices | Name + price fields; supports decimals |
| Assignment Panel | Map each item to one or more people | Checkbox grid or tag-based picker per item |
| Tip/Tax Config | Capture tip percentage + split method; tax amount/% + split method | Toggle buttons for presets, text input for custom |
| Calculation Engine | Pure functions: derive per-person subtotals, apply tip/tax, round up | Stateless; called on every state change |
| Summary Panel | Display per-person totals; read-only | Derived from engine output; no editable state |
| App State | Single mutable object holding all inputs | Managed by chosen state mechanism (useState / Zustand / vanilla store) |

## Recommended Project Structure

```
src/
├── components/          # UI components (purely presentational where possible)
│   ├── PeoplePanel/
│   │   ├── PeoplePanel.tsx
│   │   └── PersonRow.tsx
│   ├── ItemsPanel/
│   │   ├── ItemsPanel.tsx
│   │   └── ItemRow.tsx
│   ├── AssignmentPanel/
│   │   ├── AssignmentPanel.tsx
│   │   └── ItemAssignmentRow.tsx
│   ├── TipTaxPanel/
│   │   └── TipTaxPanel.tsx
│   └── SummaryPanel/
│       ├── SummaryPanel.tsx
│       └── PersonSummaryRow.tsx
├── engine/              # Pure calculation functions — no React, no side effects
│   ├── allocate.ts      # Distribute item cost among assignees (including shared)
│   ├── tipTax.ts        # Calculate tip and tax amounts per person
│   ├── round.ts         # Rounding logic (round up to nearest cent)
│   └── summarize.ts     # Compose per-person final totals
├── store/               # App state definition and mutations
│   ├── types.ts         # TypeScript interfaces: Person, Item, Assignment, Config
│   └── store.ts         # State store (Zustand or React context + useReducer)
├── hooks/               # Custom hooks that connect engine to components
│   └── useBillSummary.ts  # Reads state, calls engine, returns per-person totals
├── utils/               # General helpers (currency formatting, ID generation)
│   └── currency.ts
└── App.tsx              # Root layout; mounts panels; no business logic here
```

### Structure Rationale

- **engine/:** Calculation logic is isolated from UI. This makes it independently testable and replaceable without touching React. The engine is the most critical and bug-prone code — keep it clean.
- **store/:** Single source of truth. All panels read from here; all user actions write to here. No panel-to-panel prop drilling.
- **components/:** Each panel is a vertical slice of the UI. They read from the store and dispatch actions — they do not compute totals themselves.
- **hooks/:** `useBillSummary` is the one bridge: it reads raw state and runs the engine to produce display-ready data. Keeps computation out of render methods.

## Architectural Patterns

### Pattern 1: Unidirectional Data Flow

**What:** User actions mutate state in the store; the engine re-derives all totals from state; UI re-renders from derived output. No reverse flow.
**When to use:** Always — this is the foundation of the entire architecture.
**Trade-offs:** Slightly more boilerplate than direct local state, but eliminates desynchronization bugs entirely.

**Example:**
```typescript
// User adds an item → store updates → engine re-derives → summary re-renders
function ItemRow({ item }: { item: Item }) {
  const updateItem = useStore(s => s.updateItem);
  return (
    <input
      value={item.price}
      onChange={e => updateItem(item.id, { price: parseFloat(e.target.value) })}
    />
  );
}
```

### Pattern 2: Pure Calculation Engine

**What:** All split math lives in plain TypeScript functions that take state as input and return totals as output — no side effects, no React imports.
**When to use:** For every calculation: item allocation, tip/tax, rounding.
**Trade-offs:** Requires discipline to keep business logic out of components, but enables isolated unit testing of all financial math.

**Example:**
```typescript
// engine/allocate.ts
export function allocateItem(item: Item, assignees: string[]): Record<string, number> {
  if (assignees.length === 0) return {};
  const share = item.price / assignees.length;
  return Object.fromEntries(assignees.map(id => [id, share]));
}

// engine/tipTax.ts
export function applyProportional(
  personSubtotal: number,
  billSubtotal: number,
  addOnAmount: number
): number {
  if (billSubtotal === 0) return 0;
  return addOnAmount * (personSubtotal / billSubtotal);
}
```

### Pattern 3: Round-Up-Last (Cent Reconciliation)

**What:** Round each person's total up to the nearest cent using `Math.ceil(value * 100) / 100`. This satisfies the project requirement and avoids floating-point accumulation errors by computing everything in integer cents internally where feasible.
**When to use:** At the final output step only — never in intermediate calculations.
**Trade-offs:** May collect $0.01–$0.05 extra total across the group, which is the stated acceptable behavior for this project.

**Example:**
```typescript
// engine/round.ts
export function roundUpCents(value: number): number {
  return Math.ceil(value * 100) / 100;
}

// Apply rounding only in summarize.ts, not in allocate.ts or tipTax.ts
export function summarize(rawTotals: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(rawTotals).map(([id, total]) => [id, roundUpCents(total)])
  );
}
```

## Data Flow

### User Action Flow

```
User Input (add person / add item / toggle assignee / change tip %)
    ↓
Store Mutation (store.ts: addPerson / updateItem / setAssignment / setTip)
    ↓
State Update (new state object emitted)
    ↓
useBillSummary hook re-runs
    ↓
engine/allocate.ts → per-person item subtotals
    ↓
engine/tipTax.ts  → per-person tip and tax shares
    ↓
engine/round.ts   → ceil each person's total to nearest cent
    ↓
SummaryPanel re-renders with updated totals
```

### State Shape

```typescript
interface AppState {
  people: Person[];          // [{ id, name }]
  items: Item[];             // [{ id, name, price }]
  assignments: {             // itemId → personId[]
    [itemId: string]: string[];
  };
  tip: {
    amount: number;          // computed from % or direct input
    splitMethod: 'equal' | 'proportional';
  };
  tax: {
    amount: number;          // computed from % or direct input
    splitMethod: 'equal' | 'proportional';
  };
}
```

### Key Data Flows

1. **Item Assignment:** Item has a price. Assignment maps item ID to an array of person IDs. The allocator divides `item.price / assignees.length` and credits each assignee.
2. **Tip/Tax — Equal Split:** `addOnAmount / people.length` applied to each person regardless of what they ordered.
3. **Tip/Tax — Proportional Split:** Each person's share = `(personSubtotal / billSubtotal) * addOnAmount`. Requires a stable bill subtotal computed before tip/tax.
4. **Unassigned items:** Items with no assignees contribute to bill subtotal but are not allocated to any person — this is a source of confusion and must be surfaced clearly in UI (see anti-patterns).

## Scaling Considerations

This is a client-side-only, single-session app. Traditional scaling (users, servers) does not apply. The relevant scale dimension is session complexity.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Small bill (2–6 people, 5–15 items) | Plain React useState or minimal Zustand is sufficient |
| Large bill (10+ people, 30+ items) | Memoize engine output per item; avoid recalculating entire bill on every keystroke — debounce price inputs |
| Future: save/share | Add URL serialization layer (encode state as base64 in URL hash) without restructuring the engine or components |

### Scaling Priorities

1. **First bottleneck:** Re-computation on every render. Fix with `useMemo` wrapping the engine calls in `useBillSummary`. Price inputs that fire on every keystroke should debounce by 300ms before triggering recalculation.
2. **Second bottleneck:** Mobile keyboard / viewport behavior. Not a computation concern — handled at the CSS/viewport level with `meta viewport` and `input type="decimal"`.

## Anti-Patterns

### Anti-Pattern 1: Calculation Logic Inside Components

**What people do:** Put split math directly in the render function or JSX of `SummaryPanel`.
**Why it's wrong:** Cannot be unit tested. Duplicates logic if the summary appears in multiple places. Impossible to verify correctness in isolation.
**Do this instead:** Keep all math in `engine/`. Components call `useBillSummary()` and render what they receive — no math in render.

### Anti-Pattern 2: Floating-Point Arithmetic Without Care

**What people do:** Add floating-point prices directly and display the result. `0.1 + 0.2 = 0.30000000000000004`.
**Why it's wrong:** Pennies go missing or appear from nowhere. Users notice immediately when the total is wrong by $0.01.
**Do this instead:** Work in integer cents for intermediate calculations. Store prices as floats (user input), convert to cents (`Math.round(price * 100)`) before summing, convert back to dollars for display. Apply `roundUpCents` only in the final summarize step.

### Anti-Pattern 3: Letting Unassigned Items Silently Drop

**What people do:** An item with no assignees is simply excluded from totals with no indication.
**Why it's wrong:** Users add items before assigning them. If the bill total doesn't add up, they assume a bug. Silent omission is invisible.
**Do this instead:** Track unassigned item total separately. Display it prominently in the UI ("$12.00 in unassigned items"). This is a UI concern — the engine should still compute it and return it, just separately.

### Anti-Pattern 4: One Giant Component

**What people do:** Build the entire app as one React component with all state, all UI, and all math in one file.
**Why it's wrong:** Untenable to maintain or test past ~100 lines. Adding shared-item logic or a new tip mode requires touching everything.
**Do this instead:** Enforce the panel boundary from day one. Even in early phases, create `PeoplePanel`, `ItemsPanel`, etc. as separate files. The discipline pays off immediately when the calculation engine needs to change.

### Anti-Pattern 5: Splitting Tip/Tax Before Item Allocation

**What people do:** Compute a "per-item tip multiplier" and add tip to each item's price before allocating.
**Why it's wrong:** Shared items produce fractional tip amounts that compound floating-point errors. Equal-split tip/tax becomes impossible to separate from proportional.
**Do this instead:** Always run allocation first (item costs → person subtotals), then apply tip/tax on top of subtotals. Keep the two stages strictly sequential.

## Integration Points

### External Services

None. This is a fully client-side app with no network calls in v1.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Components ↔ Store | Store reads/writes via hook (Zustand `useStore` or Context `useContext`) | No prop drilling past 1 level |
| Store ↔ Engine | Engine receives a snapshot of state as plain arguments; never imports from store | Keeps engine pure and independently testable |
| Engine ↔ UI | Via `useBillSummary` hook only — single bridge point | Hook can memoize; components stay dumb |
| Future: State ↔ URL | Serialize state to JSON → base64 → URL hash for share links | No architecture change needed; add a `serialize/deserialize` util |

## Build Order Implications

The component and data dependencies imply this build sequence:

1. **Types first** (`store/types.ts`) — define `Person`, `Item`, `Assignment`, `TipConfig`, `TaxConfig`. Every other module depends on these.
2. **Engine second** (`engine/allocate.ts`, `engine/tipTax.ts`, `engine/round.ts`, `engine/summarize.ts`) — pure functions with no dependencies on UI. Write and test these before any React.
3. **Store third** (`store/store.ts`) — builds on types. No UI dependency.
4. **Hook fourth** (`hooks/useBillSummary.ts`) — bridges store and engine. Depends on both.
5. **Panels in dependency order:**
   - People Panel (no dependencies on items or assignments)
   - Items Panel (depends on people list for assignment, but can start without it)
   - Assignment Panel (depends on both people and items being present)
   - Tip/Tax Panel (depends on items existing; uses bill subtotal)
   - Summary Panel (depends on everything — build last)

This order means the engine can be fully verified correct before any UI exists, which is the highest-risk piece.

## Sources

- Domain knowledge: client-side expense splitting is a well-understood problem space (Splitwise, Tricount, Tab) — architecture patterns derived from established practice.
- Floating-point rounding: standard JavaScript numeric behavior, well-documented in ECMAScript specification.
- React unidirectional data flow: React documentation and Zustand documentation (patterns stable since 2020).
- Note: External web sources were unavailable during this research session. Confidence is MEDIUM. The patterns described are stable, well-established, and low-risk, but a phase-specific research pass is recommended before building the calculation engine to validate the rounding approach against any edge cases in the specific framework chosen.

---
*Architecture research for: client-side expense splitting web app*
*Researched: 2026-02-19*
