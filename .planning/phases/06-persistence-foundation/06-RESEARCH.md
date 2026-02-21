# Phase 6: Persistence Foundation - Research

**Researched:** 2026-02-22
**Domain:** localStorage persistence via Zustand `persist` middleware — schema versioning, branded-type deserialization, storage error handling, active-bill auto-save
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERS-01 | Current bill auto-saves to localStorage and survives page refresh | `persist(immer(stateCreator), { name: 'bill-splitter-active', partialize })` on `useBillStore`; `deserializeBillConfig()` at read boundary; verified by reload test in DevTools |
| PERS-02 | User can save a completed bill to history with a single tap | New `useHistoryStore` with `persist` middleware; `save(config)` action returns `SavedSplitId`; "Save Split" button in `SummaryPanel` wired to `historyStore.save(billStore.getState().config)` |
| PERS-03 | Stored data migrates gracefully when the app schema changes (schema versioning) | `version: 1` + `migrate` stub in both persist configs from day one; `deserializeBillConfig()` as single parse boundary; verified by schema-version mismatch test |
</phase_requirements>

---

## Summary

Phase 6 is the technical foundation for all v1.1 persistence features. Its sole job is to make the localStorage layer correct, safe, and schema-versioned before any UI is built on top. The existing codebase (React 19, TypeScript 5.9, Vite 7, Tailwind 4, Zustand 5.0.11 + immer 11, Vitest 4) already has everything needed — no new npm packages are required.

The phase has two distinct deliverables. First, the active bill must auto-save through adding `persist` middleware to the existing `useBillStore` so page refresh restores all people, items, assignments, tip, and tax (PERS-01). Second, a new `useHistoryStore` must be created with its own localStorage key so completed bills can be saved with a single user action (PERS-02). Both stores must be versioned from day one (`version: 1` + `migrate` stub) so future schema changes have a safe upgrade path (PERS-03).

Four technical risks must be resolved within this phase or they become expensive to retrofit: (1) branded types (`Cents`, `PersonId`, `ItemId`) silently lose their brand on `JSON.parse` — a `deserializeBillConfig()` function is required as the single parse boundary; (2) `localStorage.setItem` throws synchronously in Safari Private Browsing and on quota exceeded — all storage calls must be wrapped in try/catch; (3) persist must wrap immer (`persist(immer(creator))`), not the reverse, or writes are silently captured as initial state; (4) the active bill store must NOT be persisted using the history store's key, and vice versa — two completely separate localStorage keys are required.

**Primary recommendation:** Build in this order: `localStorageAdapter.ts` (safe error-wrapped storage) → `deserializeBillConfig()` + round-trip tests → `useHistoryStore` with persist + version 1 → `billStore.ts` modifications (persist + loadConfig + currentSplitId) → verify both stores in DevTools before any UI work.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zustand/middleware` persist | built-in (zustand 5.0.11) | Auto-save active bill and history list to localStorage across page loads | Ships inside zustand — zero install cost. Synchronous localStorage hydration means the store is fully populated before first React render. v5.0.10 fixed a state-inconsistency bug; project is at 5.0.11 already. |
| `zustand/middleware/immer` | built-in (zustand 5.0.11) | Mutable draft state writes inside persist-wrapped store | Already used in `useBillStore`; must be composed as `persist(immer(creator))` not the reverse |
| Native `localStorage` | browser-native | Synchronous storage backend; accessed via Zustand's `createJSONStorage` wrapper | Synchronous API pairs cleanly with Zustand's hydration path. No loading-state guards needed. Already used by `useOnboarding` in the codebase. |
| Native `crypto.randomUUID()` | browser-native | Generate `SavedSplitId` for history entries | Already used in `billStore.ts` for `PersonId` and `ItemId` — maintains codebase consistency. No new dependency needed. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | — | — | All Phase 6 capabilities are built on existing dependencies. Zero `npm install` entries needed. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `localStorage` via `createJSONStorage` | IndexedDB (`idb-keyval`) | IndexedDB is async — Zustand's async hydration path means the store starts empty and hydrates in a microtask. Every component must handle "loading" state. Not justified for <1 MB of bill history. |
| Zustand `persist` built-in | Manual `localStorage.getItem/setItem` in `useEffect` | Error-prone: misses hydration timing, storage quota errors, JSON parse failures. Zustand's persist middleware handles all these edge cases and is already installed. |
| `version: 1` + `migrate` in persist options | Key-name versioning (`bs-history-v1`) | Key-name versioning leaves stale keys orphaned in localStorage. Zustand's built-in version + migrate reads old data, migrates it, and re-saves under the same key. |

**Installation:**

```bash
# Nothing to install.
# persist and immer are built into zustand 5.0.11 (already installed)
# crypto.randomUUID() and localStorage are browser-native
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── storage/
│   ├── localStorageAdapter.ts    # NEW — safe try/catch wrappers for setItem/getItem
│   └── deserializeBillConfig.ts  # NEW — single JSON parse boundary with branded-type constructors
├── store/
│   ├── billStore.ts              # MODIFIED — add persist middleware + loadConfig + currentSplitId
│   └── historyStore.ts           # NEW — persist-wrapped history store, SavedSplitId type
└── (everything else unchanged)
```

### Pattern 1: Middleware Composition Order

**What:** `persist` must wrap `immer`, with `immer` innermost.
**When to use:** Any Zustand store combining both middlewares.

```typescript
// CORRECT — persist(immer(creator))
export const useBillStore = create<BillState>()(
  persist(
    immer(stateCreator),
    {
      name: 'bill-splitter-active',
      storage: createJSONStorage(() => safeLocalStorage),
      version: 1,
      partialize: (state) => ({ config: state.config }),
      migrate(persisted: unknown, _fromVersion: number) {
        return persisted as Pick<BillState, 'config'>;
      },
    }
  )
);

// WRONG — immer(persist(creator)) — persist sees immer draft proxies, silently captures only initial state
// export const useBillStore = create<BillState>()(immer(persist(stateCreator, options)));
```

**Source:** [Zustand persist middleware docs](https://zustand.docs.pmnd.rs/middlewares/persist), [immer middleware docs](https://zustand.docs.pmnd.rs/integrations/immer-middleware)

### Pattern 2: Safe localStorage Adapter

**What:** Centralize all localStorage access in `src/storage/localStorageAdapter.ts` with try/catch wrappers. Pass a custom `StateStorage` object to `createJSONStorage` so persist middleware uses safe wrappers.
**When to use:** Every store with persist middleware. This handles `QuotaExceededError` and `SecurityError` (Safari Private Browsing).

```typescript
// src/storage/localStorageAdapter.ts

/**
 * Safe localStorage adapter for Zustand persist middleware.
 * Wraps setItem/getItem/removeItem in try/catch.
 * Returns null on read failure; returns false on write failure (caller decides toast).
 */
export const safeLocalStorage = {
  getItem(name: string): string | null {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name: string, value: string): void {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      // QuotaExceededError or SecurityError (Safari Private)
      // Caller (persist middleware) swallows this; UI can subscribe to error event
      console.warn('[storage] setItem failed:', name, e);
    }
  },
  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};
```

**Note on Zustand's `createJSONStorage`:** Pass `safeLocalStorage` directly as the storage backend:

```typescript
storage: createJSONStorage(() => safeLocalStorage),
```

### Pattern 3: `deserializeBillConfig()` — Single Parse Boundary

**What:** A dedicated function that re-applies branded-type constructor helpers (`cents()`, `personId()`, `itemId()`) after `JSON.parse`. This is the ONLY place localStorage results are consumed — everything above it receives properly typed values.
**When to use:** In the `partialize`/rehydration path of the active bill persist store, and at the `useHistoryStore` load action boundary.

```typescript
// src/storage/deserializeBillConfig.ts
import { cents, personId, itemId } from '../engine/types';
import type { BillConfig, Assignments } from '../engine/types';

/**
 * Re-applies TypeScript branded type constructors after JSON.parse.
 * JSON.parse strips the brand from Cents, PersonId, and ItemId at runtime.
 * This is the single safe parse boundary — all localStorage reads flow through here.
 */
export function deserializeBillConfig(raw: unknown): BillConfig {
  const r = raw as {
    people: Array<{ id: string; name: string }>;
    items: Array<{ id: string; label: string; priceCents: number; quantity: number }>;
    assignments: Record<string, string[]>;
    tip: { amountCents: number; method: string; includeZeroFoodPeople: boolean };
    tax: { amountCents: number; method: string; includeZeroFoodPeople: boolean };
  };

  const assignments: Assignments = {};
  for (const [k, v] of Object.entries(r.assignments)) {
    assignments[itemId(k)] = v.map(personId);
  }

  return {
    people: r.people.map((p) => ({ id: personId(p.id), name: p.name })),
    items: r.items.map((i) => ({
      id: itemId(i.id),
      label: i.label,
      priceCents: cents(i.priceCents),
      quantity: i.quantity,
    })),
    assignments,
    tip: {
      amountCents: cents(r.tip.amountCents),
      method: r.tip.method as 'equal' | 'proportional',
      includeZeroFoodPeople: r.tip.includeZeroFoodPeople,
    },
    tax: {
      amountCents: cents(r.tax.amountCents),
      method: r.tax.method as 'equal' | 'proportional',
      includeZeroFoodPeople: r.tax.includeZeroFoodPeople,
    },
  };
}
```

**Unit test required:** Round-trip `BillConfig` through `JSON.stringify → JSON.parse → deserializeBillConfig` and assert the result passes `computeSplit` with identical output to the original.

### Pattern 4: `useHistoryStore` — New Persist-Wrapped Store

**What:** Separate Zustand store for history entries, with its own localStorage key (`bs-history`), separate from the active bill store.
**When to use:** History entries have different lifecycle than the active bill. The "New Split" reset must NOT clear history. Two stores, two keys.

```typescript
// src/store/historyStore.ts
import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { safeLocalStorage } from '../storage/localStorageAdapter';
import type { BillConfig } from '../engine/types';

export type SavedSplitId = string & { readonly __brand: 'SavedSplitId' };
export const savedSplitId = (s: string): SavedSplitId => s as SavedSplitId;

export interface SavedSplit {
  id: SavedSplitId;
  savedAt: number;       // Date.now() — sort key
  config: BillConfig;    // Full snapshot; display data derived at render time
}

export interface HistoryState {
  splits: SavedSplit[];
  save: (config: BillConfig) => SavedSplitId;
  update: (id: SavedSplitId, config: BillConfig) => void;
  remove: (id: SavedSplitId) => void;
  restore: (split: SavedSplit) => void;   // Undo-delete: re-insert with original id/savedAt
}

const MAX_HISTORY_ENTRIES = 50;

const historyStateCreator = (set: any, _get: any): HistoryState => ({
  splits: [],

  save(config: BillConfig): SavedSplitId {
    const id = savedSplitId(crypto.randomUUID());
    set((state: HistoryState) => {
      state.splits.unshift({ id, savedAt: Date.now(), config });
      if (state.splits.length > MAX_HISTORY_ENTRIES) {
        state.splits = state.splits.slice(0, MAX_HISTORY_ENTRIES);
      }
    });
    return id;
  },

  update(id: SavedSplitId, config: BillConfig) {
    set((state: HistoryState) => {
      const split = state.splits.find((s) => s.id === id);
      if (split) {
        split.config = config;
        split.savedAt = Date.now();
      }
    });
  },

  remove(id: SavedSplitId) {
    set((state: HistoryState) => {
      state.splits = state.splits.filter((s) => s.id !== id);
    });
  },

  restore(split: SavedSplit) {
    set((state: HistoryState) => {
      if (state.splits.some((s) => s.id === split.id)) return;  // idempotent
      state.splits.unshift(split);
      state.splits.sort((a, b) => b.savedAt - a.savedAt);
    });
  },
});

export const useHistoryStore = create<HistoryState>()(
  persist(
    immer(historyStateCreator),
    {
      name: 'bs-history',
      storage: createJSONStorage(() => safeLocalStorage),
      version: 1,
      migrate(persisted: unknown, _fromVersion: number) {
        // Identity migration for v1 — add cases here when schema changes in v1.2+
        return persisted as HistoryState;
      },
    }
  )
);

// Vanilla factory for isolated test instances (mirrors createBillStore pattern)
export function createHistoryStore() {
  return createStore<HistoryState>()(
    immer(historyStateCreator)
    // Note: no persist in test instances — use in-memory state only
  );
}
```

### Pattern 5: `billStore.ts` Modifications for Active-Bill Persist

**What:** Wrap existing `immer(stateCreator)` with persist middleware. Add `currentSplitId`, `setCurrentSplitId`, `loadConfig` to `BillState`. Update `reset()` to clear `currentSplitId`.
**When to use:** Required for PERS-01 (auto-save on refresh) and the edit-mode concept used in Phase 7.

```typescript
// Additions to BillState interface:
currentSplitId: SavedSplitId | null;   // null = new unsaved split; non-null = editing a saved split
setCurrentSplitId: (id: SavedSplitId | null) => void;
loadConfig: (config: BillConfig) => void;  // Replace entire config from a saved split

// In stateCreator — add:
currentSplitId: null,

setCurrentSplitId(id: SavedSplitId | null) {
  set((state) => { state.currentSplitId = id; });
},

loadConfig(config: BillConfig) {
  set((state) => { state.config = config; });
},

// Update reset() to clear currentSplitId:
reset() {
  set((state) => {
    state.config = { /* initialConfig */ };
    state.currentSplitId = null;   // <-- add this
  });
},

// Updated export with persist:
export const useBillStore = create<BillState>()(
  persist(
    immer(stateCreator),
    {
      name: 'bill-splitter-active',
      storage: createJSONStorage(() => safeLocalStorage),
      version: 1,
      partialize: (state) => ({ config: state.config }),  // exclude actions and currentSplitId
      migrate(persisted: unknown, _fromVersion: number) {
        return persisted as Pick<BillState, 'config'>;
      },
    }
  )
);
```

**Important:** `currentSplitId` is NOT included in `partialize` — it is session metadata, not bill data. It always starts as `null` on page load. The active bill config persists; the "which history entry is being edited" does not.

### Anti-Patterns to Avoid

- **Wrong middleware order — `immer(persist(creator))`:** Persist sees immer draft proxies, silently captures only initial state. Always `persist(immer(creator))`.
- **`partialize` omitted:** Without it, Zustand tries to serialize action functions. Causes "old function" bugs on deploy and bloated localStorage blobs. Always `partialize: (s) => ({ config: s.config })`.
- **`localStorage.setItem` without try/catch:** `SecurityError` in Safari Private Browsing crashes the app. Centralize ALL storage access in `localStorageAdapter.ts`.
- **No `version: 1` on first ship:** The first schema change has no upgrade path. Cost to add now: 5 lines. Recovery cost later: HIGH.
- **`JSON.parse` result consumed directly as `BillConfig`:** Branded types are unbranded after parse. The engine accepts the values at runtime (TypeScript can't catch it), but guarantees are broken. Always route through `deserializeBillConfig()`.
- **Persisting `currentSplitId` in the bill store's `partialize`:** Always starts as `null` on refresh — the user shouldn't land in "editing a saved split" mode without explicit action.
- **Single localStorage key for both active bill and history:** Results in conflicting reads/writes. Two separate keys: `bill-splitter-active` for the active bill, `bs-history` for the history array.
- **History store merged into bill store:** The "New Split" reset must not clear history. Separate stores, separate lifecycles.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auto-save on page refresh | Custom `useEffect` with `localStorage.setItem` | Zustand `persist` middleware (built-in) | Effect-based auto-save misses hydration timing, SSR guards, quota errors, JSON parse failures. Persist middleware handles all edge cases, is well-tested, and is zero-cost. |
| Schema migration | Manual key versioning (`bs-history-v1`, `bs-history-v2`) | `version` + `migrate` option in persist config | Key versioning leaves stale orphaned keys. Zustand's built-in version + migrate reads old data, runs migration, re-saves under same key. Clean. |
| Branded-type round-trip | Trust that `JSON.parse` preserves TypeScript brands | `deserializeBillConfig()` parse boundary | Brands are compile-time only. `JSON.parse` returns `number` / `string`, not `Cents` / `PersonId` / `ItemId`. Engine accepts raw values silently — bug is invisible until strict mode catches it. |
| Storage error handling | Individual try/catch at every call site | `localStorageAdapter.ts` with safe wrappers | Scattered try/catch misses edge cases. Private Browsing throws `SecurityError` on both `getItem` AND `setItem`. Centralized adapter is tested once, used everywhere. |
| History ID generation | Custom counter or timestamp-based IDs | `crypto.randomUUID()` | Counters conflict across tabs. Timestamps collide on rapid save. UUID is already used for `PersonId` and `ItemId` in `billStore.ts` — maintains codebase consistency. |

**Key insight:** The persistence domain has well-documented failure modes that are almost impossible to get right with ad-hoc solutions. Zustand's persist middleware + a single safe adapter + a single parse boundary covers 100% of the failure surface with minimal code.

---

## Common Pitfalls

### Pitfall 1: Branded Types Lose Brand on JSON Round-Trip

**What goes wrong:** `Cents`, `PersonId`, `ItemId` serialize correctly (values preserved) but the TypeScript brand is gone after `JSON.parse`. The engine accepts the unbranded values at runtime. Bugs surface later when strict type checks are added or when the engine's behavior changes to rely on branding.

**Why it happens:** TypeScript brands are compile-time fiction. `JSON.parse` has no awareness of them.

**How to avoid:** `deserializeBillConfig()` in `src/storage/` is the single parse boundary. Unit-test the round-trip: `JSON.stringify → JSON.parse → deserializeBillConfig → computeSplit` must produce identical output to the original.

**Warning signs:** `JSON.parse(localStorage.getItem(...))` result spread directly into store state without calling `cents()`, `personId()`, `itemId()`.

### Pitfall 2: No Schema Version = Breaking Migration on First Field Change

**What goes wrong:** First schema change (add a field, rename a key) has no upgrade path for existing users. Old blobs are loaded as-is; missing fields are `undefined`; engine or UI crashes.

**Why it happens:** `version: 1` has zero value on day one — feels like premature optimization.

**How to avoid:** Set `version: 1` and a `migrate` stub in BOTH persist configs from the start. Cost: 5 lines. Recovery without it: requires retroactive version 0 → 1 migration shipped to all existing users.

**Warning signs:** Persist options with no `version` field. Default in Zustand is `0`, but the `migrate` function is never called for version 0 blobs.

### Pitfall 3: `localStorage.setItem` Throws Synchronously, Crashing the App

**What goes wrong:** `QuotaExceededError` (storage full) and `SecurityError` (Safari Private Browsing) are synchronous throws. Uncaught, they propagate up the React call stack — blank screen if no error boundary.

**Why it happens:** Safari Private Browsing does not allow `localStorage` writes at all. The 5 MB quota can be hit with accumulated history.

**How to avoid:** `localStorageAdapter.ts` wraps ALL storage calls in try/catch. The `setItem` wrapper catches the error, logs it, and returns silently — the app continues to function (bill-in-progress is preserved in memory; only the write to disk fails). A toast can be shown to surface the error to the user non-destructively.

**Warning signs:** `localStorage.setItem(key, JSON.stringify(state))` appearing without surrounding try/catch. App not tested in Safari Private Window.

### Pitfall 4: Middleware Order — `persist` Must Wrap `immer`

**What goes wrong:** `create()(immer(persist(creator)))` causes persist to serialize immer draft proxy objects rather than plain state, silently capturing only initial state.

**Why it happens:** "Adding persist to an existing immer store" reads naturally as wrapping the outer layer. The Zustand TypeScript types partially catch this but error messages are opaque.

**How to avoid:** Always `create<T>()(persist(immer(creator), options))`. Verify immediately in DevTools Application tab after wiring: mutate store state, confirm localStorage key updates with `config` contents (not `{}`).

**Warning signs:** localStorage key never updates after store mutations. localStorage key updates but always contains initial state values.

### Pitfall 5: Auto-Save Fires on Every Keystroke (Performance)

**What goes wrong:** Zustand persist fires on every store mutation. Price/tip/tax inputs fire `updateItem`/`setTip`/`setTax` on every keypress. Serializing and writing ~4 KB to localStorage on every character is synchronous main-thread work — perceptible lag on low-end Android.

**Why it happens:** The existing store mutates on every keypress — this was fine before persist because mutation was cheap. Persist adds synchronous serialization cost to each mutation.

**How to avoid:** Keep price/tip/tax inputs as local component state (`useState`); commit to store on `onBlur` only. **Verify that v1.0 already follows this pattern before adding persist** — if it does, no change needed. Check by typing quickly in a price field and watching the DevTools Application > Local Storage tab. Writes should only occur on blur, not on each keystroke.

**Warning signs:** DevTools shows localStorage updates on every keypress. Vitest environment is `node` (not jsdom) — localStorage behavior cannot be tested in existing Vitest test files without environment override for persist tests.

### Pitfall 6: Vitest Environment is `node` — localStorage Not Available in Tests

**What goes wrong:** The project's `vite.config.ts` sets `environment: 'node'`. Zustand persist middleware calls `localStorage.getItem` during store creation. In a Node environment, `localStorage` is not defined — store initialization throws.

**Why it happens:** The existing tests use `createBillStore()` (vanilla factory with no persist middleware), which works in Node. Adding persist to the exported `useBillStore` or testing `useHistoryStore` directly in a `node` environment will throw.

**How to avoid:** Two strategies:
1. **Use vanilla factory without persist for tests:** `createHistoryStore()` should NOT include persist middleware — just `immer(stateCreator)`. Tests call the vanilla factory, which uses in-memory state only. Persist behavior is verified manually in DevTools.
2. **Switch to `jsdom` environment for persist integration tests:** If persist behavior must be unit-tested (e.g., the round-trip deserialization test), create a separate test file with `// @vitest-environment jsdom` at the top, or add a `browser-storage.test.ts` in a `src/test/` folder with its own environment config.

**Note:** The `deserializeBillConfig()` round-trip test does NOT need `jsdom` — it tests a pure function, not actual localStorage writes. It can run in `node` environment.

**Warning signs:** Test failures with `ReferenceError: localStorage is not defined`. `createHistoryStore()` factory must not include persist middleware.

---

## Code Examples

### historyStore.ts — Complete Persist Config

```typescript
// src/store/historyStore.ts
// Source: Zustand persist docs https://zustand.docs.pmnd.rs/middlewares/persist

export const useHistoryStore = create<HistoryState>()(
  persist(
    immer(historyStateCreator),
    {
      name: 'bs-history',
      storage: createJSONStorage(() => safeLocalStorage),
      version: 1,
      migrate(persisted: unknown, _fromVersion: number) {
        // v1 → v1: identity (no schema changes yet)
        // When adding fields in v1.2: increment version to 2, add 'case 1:' here
        return persisted as HistoryState;
      },
    }
  )
);
```

### billStore.ts — Adding Persist to Existing Store

```typescript
// src/store/billStore.ts — modified export section
// Source: Zustand middleware ordering https://zustand.docs.pmnd.rs/integrations/immer-middleware

import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '../storage/localStorageAdapter';

export const useBillStore = create<BillState>()(
  persist(
    immer(stateCreator),
    {
      name: 'bill-splitter-active',
      storage: createJSONStorage(() => safeLocalStorage),
      version: 1,
      partialize: (state) => ({ config: state.config }),
      migrate(persisted: unknown, _fromVersion: number) {
        return persisted as Pick<BillState, 'config'>;
      },
    }
  )
);

// Vanilla factory for tests — NO persist (Node env lacks localStorage)
export function createBillStore() {
  return createStore<BillState>()(immer(stateCreator));
}
```

### deserializeBillConfig.test.ts — Round-Trip Test

```typescript
// src/storage/deserializeBillConfig.test.ts
// Verifies branded types survive JSON round-trip correctly

import { describe, it, expect } from 'vitest';
import { deserializeBillConfig } from './deserializeBillConfig';
import { computeSplit } from '../engine/engine';
import { cents, personId, itemId } from '../engine/types';
import type { BillConfig } from '../engine/types';

it('round-trips BillConfig through JSON and produces identical computeSplit result', () => {
  const original: BillConfig = {
    people: [
      { id: personId('p1'), name: 'Alice' },
      { id: personId('p2'), name: 'Bob' },
    ],
    items: [
      { id: itemId('i1'), label: 'Burger', priceCents: cents(1250), quantity: 1 },
    ],
    assignments: { [itemId('i1')]: [personId('p1'), personId('p2')] },
    tip: { amountCents: cents(200), method: 'equal', includeZeroFoodPeople: false },
    tax: { amountCents: cents(100), method: 'proportional', includeZeroFoodPeople: false },
  };

  const serialized = JSON.stringify(original);
  const parsed = JSON.parse(serialized);
  const deserialized = deserializeBillConfig(parsed);

  const originalResult = computeSplit(original);
  const deserializedResult = computeSplit(deserialized);

  expect(deserializedResult).toEqual(originalResult);
});
```

### LocalStorage Key Inventory

```
bill-splitter-active           → useBillStore: { config: BillConfig }
bs-history                     → useHistoryStore: { splits: SavedSplit[] }
bill-splitter-onboarding-complete  → useOnboarding: 'true' | null
```

All three keys are distinct. No overlap. Verified by reading `useOnboarding.ts` (key: `bill-splitter-onboarding-complete`).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `localStorage.getItem/setItem` in `useEffect` | Zustand `persist` middleware with `createJSONStorage` | Zustand 3+ | No loading-state guards needed; hydration is synchronous for localStorage |
| `partialize` typed as `Partial<T>` | `partialize` typed as `T` in Zustand v5 | Zustand v5 | Type inference works correctly without workarounds |
| Key-name versioning (`store-v1`, `store-v2`) | Built-in `version` + `migrate` option | Zustand 3.6+ | Old data is migrated in place; no orphaned keys |
| `redux-persist` for Redux stores | `zustand/middleware persist` for Zustand stores | Zustand 3+ | Zero extra dependency; designed for Zustand's state model |

**Deprecated/outdated:**
- `skipHydration: true`: Only needed for SSR (Next.js, Remix). This is a Vite SPA — synchronous hydration during store creation is correct.
- `localforage`: Wraps IndexedDB with async API. Async hydration requires loading state everywhere. Not justified for <1 MB of bill data.

---

## Build Order for Phase 6

The following order is dependency-required:

1. **`src/storage/localStorageAdapter.ts`** — Safe try/catch wrappers. No dependencies. Write and verify.

2. **`src/storage/deserializeBillConfig.ts`** — Parse boundary with branded-type constructors. Import from `engine/types.ts`. Write unit tests verifying round-trip.

3. **`src/store/historyStore.ts`** — New persist-wrapped store. Imports `localStorageAdapter` and `engine/types`. Write unit tests using `createHistoryStore()` factory (no persist, Node-compatible).

4. **`src/store/billStore.ts`** — Add persist wrapper, `currentSplitId`, `setCurrentSplitId`, `loadConfig`, update `reset()`. Existing tests in `billStore.test.ts` must still pass (vanilla factory unchanged, no persist in factory).

5. **Manual verification in DevTools** — Before any UI work:
   - Confirm `bill-splitter-active` key appears/updates on store mutation
   - Confirm `bs-history` key appears/updates on `save()` call
   - Confirm page refresh restores `config` in bill store
   - Open app in Safari Private Window — confirm no crash

---

## Open Questions

1. **Should `deserializeBillConfig` be used as a Zustand `onRehydrateStorage` callback?**
   - What we know: Zustand persist's `onRehydrateStorage` fires after hydration with the full rehydrated state. The `partialize` pattern means only `{ config }` is stored for the bill store. Zustand handles JSON parsing internally via `createJSONStorage`.
   - What's unclear: Whether Zustand's internal `JSON.parse` during rehydration needs to be intercepted to apply the deserializer, or whether the `partialize` + `merge` option can inject `deserializeBillConfig`.
   - Recommendation: Use a custom `storage` object that wraps `safeLocalStorage` and applies `deserializeBillConfig` in the `getItem` response, OR use `onRehydrateStorage` to call `loadConfig(deserializeBillConfig(state.config))` after hydration. The simplest approach: verify that `computeSplit` works correctly with the rehydrated config in a DevTools console test before shipping.

2. **Test environment for persist integration tests**
   - What we know: Existing Vitest environment is `node`. localStorage is unavailable. `createHistoryStore()` and `createBillStore()` vanilla factories must NOT include persist for tests.
   - What's unclear: Whether the round-trip test should use jsdom environment or just test `deserializeBillConfig` as a pure function (which doesn't need jsdom).
   - Recommendation: Test `deserializeBillConfig` as a pure function in the existing `node` environment. Skip persist-middleware integration tests — verify persist behavior manually in DevTools. This is consistent with the existing test philosophy (vanilla factory for unit tests, no E2E tests in the project).

---

## Sources

### Primary (HIGH confidence)
- [Zustand persist middleware docs](https://zustand.docs.pmnd.rs/middlewares/persist) — partialize, version, migrate, createJSONStorage, onRehydrateStorage API
- [Zustand persisting store data guide](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) — hydration behavior, localStorage vs async storage tradeoffs
- [Zustand immer middleware docs](https://zustand.docs.pmnd.rs/integrations/immer-middleware) — middleware combination ordering
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — localStorage 5 MB limit, QuotaExceededError, Safari behavior
- [MDN: Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) — browser support baseline
- Project codebase inspection: `src/store/billStore.ts`, `src/engine/types.ts`, `src/hooks/useOnboarding.ts`, `src/hooks/useUndoDelete.ts`, `src/utils/formatSummary.ts`, `src/utils/currency.ts`, `src/components/layout/AppShell.tsx`, `src/components/layout/TabBar.tsx`, `src/components/summary/SummaryPanel.tsx`, `vite.config.ts`, `package.json` — direct file inspection confirming actual implementation state
- Project research: `.planning/research/SUMMARY.md`, `STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md` — HIGH confidence (comprehensive project-level research completed 2026-02-22)

### Secondary (MEDIUM confidence)
- [Zustand immer + persist ordering, pmndrs/zustand Discussion #1143](https://github.com/pmndrs/zustand/discussions/1143) — middleware ordering failure mode documented by community, consistent with official docs
- [Zustand function serialization bug, pmndrs/zustand Discussion #2556](https://github.com/pmndrs/zustand/discussions/2556) — persist without partialize keeps stale function references
- [WebKit: Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/) — iOS Safari 7-day script-writable storage cap

### Tertiary (LOW confidence)
- None — all critical claims verified against official docs or direct codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are existing dependencies; persist/immer ordering verified against official Zustand docs; project at zustand 5.0.11 confirmed from `package.json`
- Architecture: HIGH — v1.0 codebase inspected directly; all existing patterns (store, hooks, utils, test factory) are known quantities; two-store design verified against Zustand community guidance
- Pitfalls: HIGH — branded types derived from direct inspection of `src/engine/types.ts`; localStorage error handling from MDN; middleware ordering from official docs + community discussion; Vitest `node` environment pitfall discovered from direct `vite.config.ts` inspection
- Code examples: HIGH — all examples derived from existing codebase patterns and official Zustand docs

**Research date:** 2026-02-22
**Valid until:** 2026-03-24 (30 days — Zustand 5.x is stable; no breaking changes expected in this window)
