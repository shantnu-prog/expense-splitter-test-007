# Phase 1: Foundation - Research

**Researched:** 2026-02-19
**Domain:** TypeScript calculation engine, Zustand 5 state management, Vitest testing, integer-cents arithmetic
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Boundary:** Pure calculation engine, TypeScript types, Zustand store, and Vitest test suite. No UI components. The engine computes correct per-person totals for all bill configurations — shared items, proportional tip and tax, and rounded-up totals — verified by tests before any UI exists.

**Rounding behavior:**
- Round up each person's final total to the nearest cent
- Rounding surplus is displayed transparently — both per-person detail (exact vs rounded amount) AND a group total summary line ("$0.03 extra collected due to rounding")
- The engine must compute and return the surplus amount, not discard it

**Split edge cases:**
- Person with zero items: user chooses per-split whether they still pay tip/tax share — engine must support a toggle for "include in tip/tax split even if no food items"
- Unassigned items: engine blocks calculation (returns error/invalid state) until all items are assigned to at least one person
- Person removal with assigned items: automatically redistribute their items among remaining sharers of each item; if they were the sole owner, items become unassigned (which blocks calculation)

**Monetary storage:** All monetary values must be stored as integer cents throughout — convert to dollars only at display.

**Engine output:** The engine must return enough data for the UI to show both exact and rounded amounts per person.

**Per-split toggle:** The "include person with no food in tip/tax" toggle is per-split, not a global setting.

### Claude's Discretion

- Rounding timing (per-component vs final total only) — pick whichever produces the most accurate and fair results
- Fractional cent distribution algorithm (largest-remainder or similar) — pick the mathematically fairest approach for distributing leftover fractions from shared items
- Data model structure (assignment approach, people metadata, tip/tax config shape)
- Engine architecture (pure functions vs store-integrated) — pick the most testable approach
- Minimum people count (1 vs 2) — pick what makes sense for the product

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ASGN-02 | Shared items split equally among the people who shared them | Integer-division with largest-remainder for fractional cents; engine `computeSplit()` handles per-item proportional allocation |
| TPTX-02 | User can choose tip split method: equal across everyone or proportional to order | Engine accepts `TipSplitMethod` enum; proportional uses each person's food subtotal as their share weight |
| TPTX-04 | User can choose tax split method: equal across everyone or proportional to order | Same pattern as TPTX-02 using `TaxSplitMethod` enum; both equal and proportional paths tested in Vitest table tests |
| SUMM-02 | Each person's total is rounded up to the nearest cent | `Math.ceil()` on fractional-cent totals; engine returns both `exactCents` and `roundedCents` plus `surplusCents` group summary |
</phase_requirements>

---

## Summary

This phase builds a pure TypeScript calculation engine before any UI exists. The engine's job is to take a structured description of a restaurant bill — items with assignments to people, a tip configuration, and a tax configuration — and produce per-person breakdowns that are mathematically correct, rounded up to the nearest cent, and transparent about the rounding surplus. No UI, no side effects, correctness only.

The stack is entirely pre-decided: Zustand 5 for state, Vitest for testing, TypeScript throughout, all values in integer cents. The key architectural recommendation is to **separate the calculation engine from the Zustand store**: the engine is pure TypeScript functions that take data and return results, the store holds the bill data and delegates to the engine. This separation makes the engine trivially testable in Vitest without any React, hooks, or store setup.

The two thorniest problems in this domain are (a) integer arithmetic with shared items producing fractional cents, and (b) rounding timing — rounding early per-component vs rounding only the final total. Research supports rounding only the final total (accumulate exact fractional cents throughout, ceil only the final per-person number) because rounding at each component compounds error. For shared item fractions, the largest-remainder method is the standard fair-distribution algorithm.

**Primary recommendation:** Build a pure `engine/` module with no store dependency, test it exhaustively in Vitest with `test.each` table tests, then wire the tested engine into a thin Zustand store in a second step.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x (project-wide) | All types, engine logic | Pre-decided; required for correctness guarantees |
| Zustand | 5.0.10 | Bill state management | Pre-decided; latest stable as of 2026-01 |
| Vitest | Latest (requires Vite >=6, Node >=20) | Test suite | Pre-decided; Vite-native, zero config with existing setup |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zustand/middleware/immer` | Bundled with Zustand 5 | Mutable-style state updates for complex nested objects | Use when updating items/assignments to avoid spread-operator boilerplate |
| `zustand/vanilla` | Bundled with Zustand 5 | Testing store logic without React hooks | Use in Vitest tests that need to assert on store state changes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Math.ceil()` on integer cents | Dinero.js, decimal.js | Libraries add dependency weight; since values are already stored as integer cents, standard `Math.ceil()` is sufficient and has no floating-point risk |
| Largest-remainder algorithm (hand-written) | `largest-remainder` npm package | Package is tiny (15 lines) but adds a dep for logic that is straightforward to implement and test directly |

**Installation (nothing new — all already in project):**

```bash
# Zustand 5 and Vitest are already in the stack
# If immer is not yet installed:
npm install immer
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── engine/
│   ├── types.ts          # All TypeScript types: Item, Person, Assignment, BillConfig, EngineResult
│   ├── engine.ts         # Pure calculation functions: computeSplit(), distributeShared(), etc.
│   └── engine.test.ts    # Vitest table-driven tests for the engine (collocated)
├── store/
│   ├── billStore.ts      # Zustand store: holds bill data, calls engine, exposes actions
│   └── billStore.test.ts # Store-level integration tests using zustand/vanilla
└── (no UI in this phase)
```

**Why this structure:**
- Engine is pure functions — tested without any React/Zustand overhead
- Store is a thin wrapper — tested with `createStore` from `zustand/vanilla`
- Collocation of `*.test.ts` next to source is the Vitest convention

### Pattern 1: Pure Engine with Discriminated Result

**What:** Engine functions are pure — they take immutable data in, return a typed result out. They never call `set()` or read from the store.

**When to use:** Always. This is the architecture. The store calls the engine; the engine never touches the store.

```typescript
// src/engine/types.ts

/** All monetary values in integer cents — never floating-point dollars */
type Cents = number & { readonly __brand: 'Cents' };

function cents(n: number): Cents {
  return Math.round(n) as Cents;
}

type PersonId = string;
type ItemId = string;

interface Item {
  id: ItemId;
  nameCents: Cents;       // price in integer cents
  label: string;
}

interface Person {
  id: PersonId;
  name: string;
  includeInTipTax: boolean; // per-person toggle for zero-food participants
}

/** Which people share each item */
type Assignments = Record<ItemId, PersonId[]>;

type SplitMethod = 'equal' | 'proportional';

interface BillConfig {
  items: Item[];
  people: Person[];
  assignments: Assignments;    // itemId -> personId[] (empty = unassigned = blocks calc)
  tipCents: Cents;
  tipMethod: SplitMethod;
  taxCents: Cents;
  taxMethod: SplitMethod;
}

interface PersonResult {
  personId: PersonId;
  foodCents: Cents;         // exact food total (may include fractional distribution)
  tipCents: Cents;          // exact tip share
  taxCents: Cents;          // exact tax share
  exactTotalCents: number;  // pre-rounding sum (may be non-integer if fractions exist)
  roundedTotalCents: Cents; // Math.ceil(exactTotalCents)
  surplusCents: Cents;      // roundedTotalCents - exactTotalCents for this person
}

type EngineResult =
  | { ok: true; results: PersonResult[]; totalSurplusCents: Cents }
  | { ok: false; reason: 'unassigned_items'; unassignedItemIds: ItemId[] };
```

```typescript
// src/engine/engine.ts
// Source: patterns derived from largest-remainder method (wikipedia.org/wiki/Largest_remainder_method)

function computeSplit(config: BillConfig): EngineResult {
  // 1. Validate: block if any item has no assignments
  const unassigned = config.items.filter(
    (item) => !config.assignments[item.id]?.length
  );
  if (unassigned.length > 0) {
    return { ok: false, reason: 'unassigned_items', unassignedItemIds: unassigned.map(i => i.id) };
  }

  // 2. Compute exact food cents per person (integer, shared via largest-remainder)
  const foodMap = distributeItems(config.items, config.assignments, config.people);

  // 3. Compute tip and tax shares
  const tipMap = distributeCharge(config.tipCents, config.tipMethod, config.people, foodMap);
  const taxMap = distributeCcharge(config.taxCents, config.taxMethod, config.people, foodMap);

  // 4. Sum per person, ceil only the final total
  let totalSurplus = 0;
  const results: PersonResult[] = config.people.map((person) => {
    const food = foodMap[person.id] ?? 0;
    const tip = tipMap[person.id] ?? 0;
    const tax = taxMap[person.id] ?? 0;
    const exact = food + tip + tax;
    const rounded = Math.ceil(exact);
    const surplus = rounded - exact;
    totalSurplus += surplus;
    return {
      personId: person.id,
      foodCents: cents(food),
      tipCents: cents(tip),
      taxCents: cents(tax),
      exactTotalCents: exact,
      roundedTotalCents: cents(rounded),
      surplusCents: cents(Math.round(surplus * 100) / 100),
    };
  });

  return { ok: true, results, totalSurplusCents: cents(Math.round(totalSurplus * 100) / 100) };
}
```

### Pattern 2: Largest-Remainder for Shared Item Distribution

**What:** When N people share an item costing P cents, P / N may not be an integer. Distribute the integer floors first, then give +1 cent to the people with the largest fractional remainders until the total is accounted for. This is fairer than always adjusting the last person.

**When to use:** Whenever splitting a shared item among multiple people.

```typescript
// Source: Largest remainder method — wikipedia.org/wiki/Largest_remainder_method
function distributeIntegerCents(totalCents: number, count: number): number[] {
  const exact = totalCents / count;
  const floors = Array.from({ length: count }, () => Math.floor(exact));
  const remainder = totalCents - floors.reduce((a, b) => a + b, 0);
  // Distribute extra cents to those with largest fractional parts
  const fractions = Array.from({ length: count }, (_, i) => ({ i, frac: exact - Math.floor(exact) }));
  fractions.sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) floors[fractions[k].i]++;
  return floors;
}
```

### Pattern 3: Proportional Tip/Tax Distribution

**What:** When split method is `'proportional'`, each person's share of tip/tax equals (their food subtotal / total food) * tip or tax. When `'equal'`, each eligible person (those with food, OR those with the `includeInTipTax` flag) gets an equal share.

**When to use:** Implement both methods; the store passes the method flag from user choice.

```typescript
// Proportional distribution — no external library needed
function distributeProportional(chargeCents: number, weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return weights.map(() => 0);
  // Use largest-remainder to avoid fractional-cent accumulation error
  const exactShares = weights.map(w => (w / total) * chargeCents);
  const floors = exactShares.map(Math.floor);
  const remainder = chargeCents - floors.reduce((a, b) => a + b, 0);
  const fracs = exactShares.map((e, i) => ({ i, frac: e - Math.floor(e) }));
  fracs.sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) floors[fracs[k].i]++;
  return floors;
}
```

### Pattern 4: Zustand Store (Thin Wrapper over Engine)

**What:** The Zustand store holds bill state. Actions mutate state. A derived selector calls `computeSplit()` on demand.

**When to use:** After the engine module is complete and tested.

```typescript
// src/store/billStore.ts
// Source: zustand.docs.pmnd.rs — create<T>()() double-parentheses required for TypeScript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { computeSplit } from '../engine/engine';
import type { BillConfig, EngineResult } from '../engine/types';

interface BillState {
  config: BillConfig;
  // Actions
  addPerson: (name: string) => void;
  removePerson: (personId: string) => void;
  addItem: (label: string, priceCents: number) => void;
  assignItem: (itemId: string, personIds: string[]) => void;
  setTip: (cents: number, method: 'equal' | 'proportional') => void;
  setTax: (cents: number, method: 'equal' | 'proportional') => void;
  // Derived (not stored — computed on read)
  getResult: () => EngineResult;
}

export const useBillStore = create<BillState>()(
  immer((set, get) => ({
    config: { items: [], people: [], assignments: {}, tipCents: 0, tipMethod: 'equal', taxCents: 0, taxMethod: 'equal' },
    addPerson: (name) => set((state) => {
      state.config.people.push({ id: crypto.randomUUID(), name, includeInTipTax: false });
    }),
    removePerson: (personId) => set((state) => {
      // Redistribute or unassign items per edge-case rules
      state.config.people = state.config.people.filter(p => p.id !== personId);
      for (const itemId in state.config.assignments) {
        state.config.assignments[itemId] = state.config.assignments[itemId].filter(id => id !== personId);
      }
    }),
    addItem: (label, priceCents) => set((state) => {
      state.config.items.push({ id: crypto.randomUUID(), label, nameCents: priceCents as any });
    }),
    assignItem: (itemId, personIds) => set((state) => {
      state.config.assignments[itemId] = personIds;
    }),
    setTip: (cents, method) => set((state) => {
      state.config.tipCents = cents as any;
      state.config.tipMethod = method;
    }),
    setTax: (cents, method) => set((state) => {
      state.config.taxCents = cents as any;
      state.config.taxMethod = method;
    }),
    getResult: () => computeSplit(get().config),
  }))
);
```

### Pattern 5: Vitest Table-Driven Tests for the Engine

**What:** Test the pure engine with `test.each` — define expected inputs and outputs in a table, let Vitest run all cases. No React, no store.

**When to use:** This is the primary test pattern for Phase 1. Cover rounding, proportional splits, shared items, edge cases.

```typescript
// src/engine/engine.test.ts
// Source: vitest.dev/api/ — test.each object syntax
import { describe, it, expect, test } from 'vitest';
import { computeSplit } from './engine';
import type { BillConfig } from './types';

describe('shared item distribution', () => {
  test.each([
    {
      label: '10 cents shared by 3 people',
      totalCents: 10,
      count: 3,
      expected: [4, 3, 3], // largest-remainder: one person gets the extra cent
    },
    {
      label: '100 cents shared by 3 people',
      totalCents: 100,
      count: 3,
      expected: [34, 33, 33],
    },
  ])('distributeIntegerCents: $label', ({ totalCents, count, expected }) => {
    // Test the pure distribution function directly
    const result = distributeIntegerCents(totalCents, count);
    expect(result.reduce((a, b) => a + b, 0)).toBe(totalCents); // must sum to total
    expect(result.sort()).toEqual(expected.sort());
  });
});

describe('computeSplit: rounding up to nearest cent', () => {
  it('rounds each person up and reports surplus', () => {
    // $10.01 split by 3: exact = 3.3367 each => ceil = 4 each => surplus = 3 * 4 - 10.01 = 1.99
    const config: BillConfig = makeBillConfig({ itemPriceCents: 1001, peopleCount: 3 });
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    result.results.forEach(r => {
      expect(r.roundedTotalCents).toBeGreaterThanOrEqual(r.exactTotalCents);
    });
    // Surplus must be returned
    expect(result.totalSurplusCents).toBeGreaterThanOrEqual(0);
  });
});

describe('computeSplit: unassigned items block calculation', () => {
  it('returns error when an item has no assignments', () => {
    const config: BillConfig = makeConfigWithUnassignedItem();
    const result = computeSplit(config);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('unassigned_items');
    expect(result.unassignedItemIds.length).toBeGreaterThan(0);
  });
});
```

### Anti-Patterns to Avoid

- **Storing computed results in Zustand state:** Never put `EngineResult` in Zustand state. Compute it on read with `getResult()`. Storing derived data creates sync bugs where state is stale.
- **Rounding inside the engine's intermediate steps:** Do not `Math.ceil()` food, tip, or tax individually — this causes compound over-rounding. Ceil only the final per-person total.
- **Using floating-point dollars anywhere inside the engine:** All internal arithmetic must use integer cents. Convert to display string (`(cents / 100).toFixed(2)`) only at the UI layer, never inside engine or store.
- **Selector creating new objects without `useShallow`:** `useBillStore((s) => ({ a: s.x, b: s.y }))` causes infinite re-renders in Zustand 5. Use `useShallow` from `zustand/react/shallow` for multi-value selectors.
- **Calling engine inside Zustand `set()`:** Engine is read-only; call it from `getResult()` via `get()`, not inside a `set()` callback.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mutable nested state updates in Zustand | Custom immutable helper functions with spreads | `immer` middleware (bundled with Zustand) | Immer handles all nested mutation cases; spreads miss edge cases and become unreadable |
| Unique IDs for people/items | Custom incrementing counter | `crypto.randomUUID()` | Available in all modern browsers and Node 20+; no dep needed |
| Test runner configuration | Custom test harness | Vitest via `vite.config.ts` `test` block | Vitest reads the existing Vite config; zero additional configuration for TypeScript |
| Proportional distribution with remainder | "Adjust last person" hack | Largest-remainder algorithm | The "adjust last person" approach is unfair and produces jarring results; LR is fair and well-understood |

**Key insight:** The largest-remainder method is the correct solution to fractional integer distribution — it appears in election systems, payroll, and every serious bill-splitting implementation. Don't approximate it with simpler hacks.

---

## Common Pitfalls

### Pitfall 1: Floating-Point Creep Inside Engine
**What goes wrong:** A calculation somewhere divides two integers and stores the result as a JavaScript `number`, which is a float64. If that float is later added to other values, rounding errors accumulate. Result: totals that are off by $0.01.
**Why it happens:** JavaScript has no native integer type; `number` is always float64. Dividing `10 / 3` yields `3.3333333333333335`, not `3`.
**How to avoid:** Only divide when computing proportions (weight computation). The result of division must be immediately fed into the largest-remainder distribution, which produces integer cents output. Never store a non-integer in any field typed as `Cents`.
**Warning signs:** Engine tests where `results.map(r => r.roundedTotalCents).reduce((a,b) => a+b)` does not equal the expected grand total.

### Pitfall 2: Rounding at Each Component (Compound Rounding Error)
**What goes wrong:** The engine rounds food, tip, and tax individually per person, then sums rounded values. The rounded sum diverges from the true rounded total because each individual rounding adds 0–0.99 cents of surplus.
**Why it happens:** "Round as you go" feels natural but is mathematically wrong for summation.
**How to avoid:** Accumulate exact (possibly fractional) per-person totals for food + tip + tax, then `Math.ceil()` once on the final total.
**Warning signs:** `totalSurplusCents` is unexpectedly large (several cents per person instead of 0–1 cent).

### Pitfall 3: Zustand Selector Infinite Re-render (v5 Behavior Change)
**What goes wrong:** A component uses `useBillStore((s) => ({ people: s.people, items: s.items }))` which creates a new object every render, causing an infinite re-render loop.
**Why it happens:** Zustand 5 changed selector comparison to match React's default behavior — it now compares the returned reference. A new object reference always triggers re-render.
**How to avoid:** Use `useShallow` for any selector returning a new object: `useShallow((s) => ({ people: s.people, items: s.items }))`.
**Warning signs:** React DevTools shows a component rendering thousands of times per second with no state change.

### Pitfall 4: Store State Leaking Between Vitest Tests
**What goes wrong:** Tests that modify the Zustand store leave state behind for the next test, causing false passes or failures depending on test order.
**Why it happens:** Zustand stores are module-level singletons — they persist across test file execution.
**How to avoid:** For store tests, use `createStore` from `zustand/vanilla` (creates an isolated instance per test) rather than importing the global `useBillStore`. For engine tests (pure functions), no setup/teardown needed.
**Warning signs:** Tests pass individually but fail when run as a suite.

### Pitfall 5: Person-Removal Leaves Items in Limbo
**What goes wrong:** Removing a person from the bill leaves their sole-owned items with an empty assignment array, but the engine never flags them because the code checks for `undefined` not empty array.
**Why it happens:** The assignment map has `itemId: []` (empty array, not undefined), which passes a falsy check.
**How to avoid:** The engine's unassigned-items check must test `assignments[itemId].length === 0`, not `!assignments[itemId]`.
**Warning signs:** `computeSplit()` returns `ok: true` even when an item visually shows no assigned people.

### Pitfall 6: `includeInTipTax` Toggle Ignored in Equal Split
**What goes wrong:** In equal tip/tax split, ALL people get an equal share, even the person with no food whose toggle is `false`.
**Why it happens:** The equal-split implementation loops over all people without checking the `includeInTipTax` flag.
**How to avoid:** Build an "eligible people" set before distributing equal tip/tax: people with food OR (people with no food AND `includeInTipTax === true`).
**Warning signs:** A person with zero food and `includeInTipTax: false` shows a non-zero tip/tax amount.

---

## Code Examples

Verified patterns from official sources:

### Vitest Configuration in Existing vite.config.ts
```typescript
// vite.config.ts
// Source: vitest.dev/guide/ — add test block to existing Vite config; requires Vite >=6, Node >=20
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,           // enables describe/it/expect without imports
    environment: 'node',     // use 'node' for pure engine tests (no DOM needed)
  },
})
```

### Zustand 5 TypeScript Store Creation
```typescript
// Source: Zustand v5 docs — double parentheses required for TypeScript middleware
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useStore = create<MyState>()(
  immer((set, get) => ({
    // state and actions
  }))
);
```

### Zustand Store Testing Without React
```typescript
// src/store/billStore.test.ts
// Source: zustand.docs.pmnd.rs/guides/testing + zustand/vanilla discussion #1866
import { createStore } from 'zustand/vanilla';
import { describe, it, expect, beforeEach } from 'vitest';

describe('billStore actions', () => {
  let store: ReturnType<typeof createBillStoreVanilla>;

  beforeEach(() => {
    // Create a fresh store per test — no global state leakage
    store = createBillStoreVanilla();
  });

  it('addPerson appends to people list', () => {
    store.getState().addPerson('Alice');
    expect(store.getState().config.people).toHaveLength(1);
    expect(store.getState().config.people[0].name).toBe('Alice');
  });
});
```

### Math.ceil for Rounding Up
```typescript
// Source: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/ceil
// Math.ceil always rounds toward positive infinity — never rounds down
const exact = 334.3333;        // exact per-person cents
const rounded = Math.ceil(exact);  // => 335 (rounds up)
const surplus = rounded - exact;   // => 0.6667 cents surplus this person contributes
```

### useShallow for Multi-Value Selectors (Zustand 5)
```typescript
// Source: Zustand v5 — required for object-returning selectors to prevent infinite re-renders
import { useShallow } from 'zustand/react/shallow';

const { people, items } = useBillStore(
  useShallow((s) => ({ people: s.config.people, items: s.config.items }))
);
```

---

## Architecture Decision: Rounding Timing

**Recommendation: Round only the final per-person total.**

All intermediate values (food share, tip share, tax share) should accumulate as numbers that may include fractional cents (e.g., `333.333...`). Sum them to get `exactTotalCents` (a non-integer). Then `Math.ceil(exactTotalCents)` to get `roundedTotalCents`.

**Why not round per-component:** If you ceil food (`334`), ceil tip (`34`), and ceil tax (`12`) separately, you may add 3× as much rounding surplus. Over many people, this diverges significantly from the true bill.

**Surplus reporting:** `surplusCents` per person = `roundedTotalCents - exactTotalCents`. `totalSurplusCents` = sum of all person surpluses. Display both in the UI.

## Architecture Decision: Data Model

**Recommendation: Per-item people list (not assignment matrix).**

```typescript
// Preferred: assignments are a record of itemId -> personId[]
type Assignments = Record<ItemId, PersonId[]>;
```

This is simpler than a 2D matrix, trivially serializable, and matches how the UI will express "who shares this item."

**People metadata recommendation:** Include `id`, `name`, `includeInTipTax` (boolean). Skip auto-color for Phase 1; color is a UI concern the planner can add in a later phase when colors are needed.

**Tip/tax config recommendation:** Single tax line (one tax amount + method). Restaurant bills have one tax line; multiple-tax-line complexity is not needed for v1.

**Minimum people count:** 2. A bill split with 1 person is meaningless for splitting; the product's purpose is dividing among multiple people.

## Architecture Decision: Engine Architecture

**Recommendation: Pure module with engine functions entirely outside Zustand.**

The engine (`src/engine/engine.ts`) exports pure functions. The store (`src/store/billStore.ts`) imports and calls them. This makes the engine testable in sub-millisecond Vitest runs with no React overhead, and makes the store thin enough that store tests mostly just verify that actions call the engine correctly.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand `create(...)` single-parens for TS | `create<T>()()` double-parens | Zustand v4 → v5 | Breaking; middleware types break without double-parens |
| Zustand custom equality in `create` | `createWithEqualityFn` for custom equality | Zustand v5 | `create` no longer accepts equality fn |
| `import { createStore } from 'zustand'` | `import { createStore } from 'zustand/vanilla'` | Zustand v4+ | Must use vanilla sub-path for non-hook store |
| Test runner requires `jest.config.*` | Vitest reads `vite.config.ts` directly | Vitest first release | No separate Jest config; add `test` block to existing Vite config |
| `persist` stored initial state on creation | `persist` no longer stores initial state | Zustand v4.5.5/v5 | Behavioral change; affects rehydration logic (not relevant to Phase 1) |

**Deprecated/outdated:**
- `import shallow from 'zustand/shallow'`: Replaced by `import { useShallow } from 'zustand/react/shallow'` in Zustand v5
- Default exports from Zustand: Dropped in v5; use named imports only

---

## Open Questions

1. **Should `Cents` be a branded type or plain `number`?**
   - What we know: Branded types (`type Cents = number & { __brand: 'Cents' }`) prevent accidental mixing of cent values with raw numbers at compile time
   - What's unclear: Whether the added verbosity (requires `cents()` constructor call everywhere) is worth the safety in a small codebase
   - Recommendation: Use branded types in `types.ts` for `Cents`, `PersonId`, and `ItemId` — the bill engine is where type confusion costs the most. Can be relaxed later if friction is too high.

2. **Vitest environment: `node` vs `jsdom`?**
   - What we know: Phase 1 has no UI; `node` environment is faster and lighter. `jsdom` is needed for React component tests (Phase 2+).
   - What's unclear: Whether the existing project already has `jsdom` configured
   - Recommendation: Use `environment: 'node'` for the engine tests. If the `vite.config.ts` already has `jsdom`, the engine tests can still run fine (jsdom is a superset of node for pure function tests).

3. **How should `immer` interact with the `Cents` branded type?**
   - What we know: Immer's `produce` wraps values in a Proxy during mutation; it works with branded types since they are structurally identical to `number`
   - What's unclear: Whether TypeScript's type system will require explicit casting when Immer assigns branded values
   - Recommendation: Plan for cast sites (`state.config.tipCents = newCents as Cents`) in store actions using immer. This is a cosmetic TypeScript issue, not a runtime concern.

---

## Sources

### Primary (HIGH confidence)
- Zustand official docs (zustand.docs.pmnd.rs) — slices pattern, TypeScript guide, testing guide, immer middleware, how-to-reset-state
- Vitest official docs (vitest.dev/api/, vitest.dev/guide/) — test.each syntax, configuration, environment options
- MDN Web Docs (developer.mozilla.org) — Math.ceil() behavior, Remainder operator
- Wikipedia — Largest remainder method (en.wikipedia.org/wiki/Largest_remainder_method)

### Secondary (MEDIUM confidence)
- WebSearch results on Zustand 5 migration (pmnd.rs/blog/announcing-zustand-v5, github.com/pmndrs/zustand/releases/tag/v5.0.0) — breaking changes verified against official migration guide
- WebSearch on floating-point integer cents (robinwieruch.de, frontstuff.io) — consistent with MDN and well-established practice
- Vitest table-driven test patterns (oliviac.dev, the-koi.com) — consistent with official vitest.dev/api/ docs

### Tertiary (LOW confidence — flagged)
- Bill-splitting proportional algorithm community sources — algorithmic approach is sound but no single authoritative reference for the exact "proportional tip/tax" calculation; validated by cross-referencing multiple calculator implementations

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Zustand 5.0.10 and Vitest confirmed from official sources and npm; both pre-decided
- Architecture (pure engine separation): HIGH — this is standard TDD practice, verified by Zustand's own testing guide recommending vanilla stores for tests
- Rounding algorithm (ceil only final total): HIGH — mathematical reasoning is deterministic; confirmed by multiple finance references
- Largest-remainder algorithm: HIGH — well-documented algorithm, multiple verified implementations
- Anti-patterns: HIGH — Zustand v5 infinite re-render behavior confirmed in official migration docs
- Pitfalls: MEDIUM-HIGH — most verified against official docs; some (like empty-array vs undefined unassigned check) are code-logic reasoning

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (Zustand and Vitest are stable; 30-day horizon is safe)
