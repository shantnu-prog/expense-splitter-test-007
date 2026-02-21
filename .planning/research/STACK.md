# Stack Research

**Domain:** Client-side bill-splitting web app — v1.1 Persistence + Sharing additions
**Researched:** 2026-02-22
**Confidence:** HIGH

---

## Scope

This document covers **only new stack additions for v1.1** features:
- localStorage persistence with auto-save
- History list (date + people + total)
- Editable saved splits (re-open, modify, re-save)
- Delete saved splits with undo toast
- Payment text: payer-directed "Alice owes YOU $23.50" generation

The existing stack (React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Zustand 5.0.11 + immer 11, Vitest 4) is validated and not re-researched. All new capabilities are built on top of existing dependencies.

---

## Recommended Stack — New Additions

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `zustand/middleware` persist | built-in (zustand 5.0.11) | Auto-save active bill to localStorage; persist history list across page loads | Zero new install — persist ships inside the zustand package. Synchronous localStorage hydration means the store is fully populated before the first React render, so no loading-state guards needed in components. v5.0.10 fixed a state-inconsistency bug with persist; the project already runs 5.0.11. |
| Native `localStorage` API | browser-native | Storage backend for persist middleware | No library needed. localStorage is limited to 5 MB per origin, which is far more than required: a bill with 20 people and 30 items serializes to under 10 KB; 200 saved history entries = ~2 MB. The synchronous API pairs cleanly with Zustand's synchronous hydration path. |
| Native `crypto.randomUUID()` | browser-native | Generate stable IDs for history entries (`HistoryId`) | Already used in `billStore.ts` (lines 92, 142) for PersonId and ItemId. Extend the same pattern for history entries. Supported in Chrome 92+, Safari 15.4+, Firefox 95+ — all current mobile browsers. Zero new dependency. |
| Native `Intl.RelativeTimeFormat` | browser-native | Format history timestamps as "today", "yesterday", "3 days ago" | Zero bundle cost. Full support across all target browsers since 2020. Sufficient for history list display. No date library is warranted for this use case. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | — | — | All v1.1 capabilities are covered by Zustand's built-in persist middleware and native browser APIs. Zero new `npm install` entries needed. |

---

## Integration: Adding persist to the Existing immer Store

The existing store (line 221 of `billStore.ts`) is:

```typescript
export const useBillStore = create<BillState>()(immer(stateCreator));
```

Adding persist requires wrapping immer from the outside. The correct middleware order is:

```
devtools( persist( immer( stateCreator ) ) )
```

Rationale for this order:
- `immer` must be **innermost** — it transforms `set` to accept draft-mutating functions; if placed outside persist, persist would serialize immer draft proxies rather than plain objects
- `persist` sits **around immer** — it receives plain state values after immer has resolved drafts, and serializes them correctly
- `devtools` goes **outermost** — it must see all `setState` calls from all inner middleware without having its `type` parameter stripped

For this milestone (no devtools middleware in production):

```typescript
// src/store/billStore.ts — modified export
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export const useBillStore = create<BillState>()(
  persist(
    immer(stateCreator),
    {
      name: 'bill-splitter-active',           // localStorage key
      storage: createJSONStorage(() => localStorage),
      version: 1,                             // enables future migration
      partialize: (state) => ({ config: state.config }),  // exclude action functions
    }
  )
);
```

Key implementation notes:
- `partialize` is required — without it, Zustand would try to serialize action functions, which are not JSON-serializable
- `createJSONStorage` is the official helper; do not pass `localStorage` directly — it wraps `getItem`/`setItem`/`removeItem` into Zustand's `StateStorage` interface and handles `null` returns and quota errors
- `version: 1` enables future schema migrations via the optional `migrate` option without clearing stored data
- With localStorage (synchronous), hydration completes during store creation — the store is fully populated before any React component renders, so no `hasHydrated` guard is needed

### Separate History Store (New File)

The history list should live in a **separate Zustand store** with its own localStorage key, not merged into `useBillStore`.

Why separate:
- History is a list of immutable snapshots. The active bill is a live-editing workspace. They have different lifecycle and reset semantics.
- The "New Split" button resets the active bill — this must not clear history.
- Loading a saved entry is an explicit "copy this snapshot into active store" action, not a store merge.
- Each store has its own `version` counter and migration path independently.
- Two separate localStorage keys (under 5 MB each) avoids the need for a single-key size budget calculation.

```typescript
// src/store/historyStore.ts  (new file)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { BillConfig } from '../engine/types';

export interface HistoryEntry {
  id: string;           // crypto.randomUUID() — stable identity
  savedAt: number;      // Date.now() — epoch ms; cheap to sort and format
  label: string;        // auto-generated: "Alice, Bob, Carol — $94.20"
  totalCents: number;   // pre-computed for display; avoids re-running engine on load
  config: BillConfig;   // full snapshot — enables re-open and edit
}

export interface HistoryState {
  entries: HistoryEntry[];
  saveEntry: (entry: HistoryEntry) => void;
  deleteEntry: (id: string) => void;
  restoreEntry: (entry: HistoryEntry) => void;  // for undo toast
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    immer((set) => ({
      entries: [],
      saveEntry: (entry) => set((s) => {
        s.entries.unshift(entry);
        if (s.entries.length > 50) s.entries = s.entries.slice(0, 50); // cap at 50
      }),
      deleteEntry: (id) => set((s) => {
        s.entries = s.entries.filter(e => e.id !== id);
      }),
      restoreEntry: (entry) => set((s) => {
        if (!s.entries.find(e => e.id === entry.id)) s.entries.unshift(entry);
      }),
    })),
    {
      name: 'bill-splitter-history',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
```

### Payment Text Generation (No Library)

Payment text ("Alice owes YOU $23.50") is pure string computation. The pattern already established in `src/utils/formatSummary.ts` is the right model: a pure function, no side effects, colocated Vitest test file.

```typescript
// src/utils/formatPaymentText.ts  (new file)
import type { EngineResult } from '../engine/types';
import type { PersonId } from '../engine/types';
import { formatCents } from './currency';

export function formatPaymentText(result: EngineResult, payerId: PersonId): string[] {
  return result.perPerson
    .filter(p => p.personId !== payerId)
    .map(p => `${p.name} owes YOU ${formatCents(p.totalCents)}`);
}
```

The function receives `EngineResult` (already produced by `computeSplit()`, which is already called by `getResult()`). No new computation needed — reuse what exists.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `zustand/middleware` persist (built-in) | `idb-keyval` + IndexedDB | IndexedDB is asynchronous — Zustand's async hydration path means the store starts with default (empty) state and hydrates in a microtask. Every component that reads history must handle a "loading" state and cannot render on the first pass. For <1 MB of bill history, the synchronous localStorage path is far simpler and equally capable. |
| `zustand/middleware` persist (built-in) | `persist-and-sync` npm package | Adds a dependency for cross-tab sync, which is explicitly out of scope ("No real-time sync across devices" in PROJECT.md). |
| `zustand/middleware` persist (built-in) | Manual `localStorage.getItem/setItem` in `useEffect` | Error-prone: misses hydration timing, storage quota errors, JSON parse failures, and SSR guards. Zustand's persist middleware handles all these edge cases, is well-tested, and is zero-cost since zustand is already installed. |
| `crypto.randomUUID()` (native) | `nanoid` npm package | nanoid (130 bytes) is negligible in size, but `crypto.randomUUID()` is already used in `billStore.ts` for PersonId and ItemId. Adding nanoid for history entry IDs would introduce an inconsistency in the same codebase. Native wins on consistency. |
| `Intl.RelativeTimeFormat` (native) | `date-fns` npm package | date-fns v4 costs ~13 KB min+gzip for the subset of functions needed here ("X days ago"). The native Intl API covers "today / yesterday / N days ago" with zero bundle cost and full support across all target browsers. Bring in date-fns if i18n or complex formatting requirements emerge later. |
| Separate `historyStore` with its own persist | Merged into `billStore` with `partialize` to select history array | Merging works technically but creates coupling. The "reset" action in billStore (New Split button) must not clear history. Managing this distinction within a single store requires explicit guards in the reset action. Two stores with separate localStorage keys is architecturally cleaner and easier to reason about. |
| `version: 1` + `migrate` option (built-in) | Key-name versioning (`'bill-splitter-active-v1'`) | Key-name versioning leaves stale keys orphaned in localStorage (old key never gets cleaned up). Zustand's built-in `version` + `migrate` option handles schema changes cleanly: old data is read, migrated to the new shape, and re-saved under the same key. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `redux-persist` | Requires Redux ecosystem (redux, react-redux). The project uses Zustand. | `zustand/middleware` persist |
| `localforage` | Wraps IndexedDB/WebSQL/localStorage with async API. The async hydration creates "empty on first render" states that need loading guards throughout the component tree. Not justified by the storage volume (<1 MB). | Native `localStorage` via `createJSONStorage` |
| IndexedDB directly | Verbose transactional API; async hydration. Not justified for a few hundred KB of bill history. | `localStorage` via persist middleware |
| `sessionStorage` | Data is lost on tab close — defeats the purpose of persisting history. | `localStorage` |
| `zustand/middleware` `skipHydration` | Only needed for SSR (Next.js, Remix) where the server does not have access to localStorage. This is a Vite SPA — synchronous hydration during store creation is correct and simpler. | Default hydration (synchronous for localStorage) |
| Third-party payment text libraries | "Alice owes YOU $23.50" is a single-function string format; no library is warranted. | Pure function in `src/utils/formatPaymentText.ts` |
| Backend / server sync | Explicitly out of scope in PROJECT.md for v1. | `localStorage` |

---

## localStorage Schema Design

Two keys, each owned by its own Zustand store:

| Key | Store | Content | Estimated size |
|-----|-------|---------|----------------|
| `bill-splitter-active` | `useBillStore` | Single `BillConfig` (active editing session) | 2–10 KB |
| `bill-splitter-history` | `useHistoryStore` | `HistoryEntry[]`, each containing a full `BillConfig` snapshot + metadata | ~50 KB for 50 entries |

**Capping history at 50 entries** prevents localStorage quota errors on mobile Safari. iOS 16 has a known issue where localStorage is cleared after writing more than ~2.5 MB; capping entries keeps both keys well under 1 MB combined.

**Version migration pattern (future use):**

```typescript
// If BillConfig shape changes in v1.2, increment version to 2 and provide migrate:
{
  name: 'bill-splitter-history',
  storage: createJSONStorage(() => localStorage),
  version: 2,
  migrate: (persistedState: unknown, fromVersion: number) => {
    if (fromVersion === 1) {
      // e.g., add a new field with default value
      const state = persistedState as HistoryState;
      return {
        ...state,
        entries: state.entries.map(e => ({ ...e, newField: defaultValue })),
      };
    }
    return persistedState as HistoryState;
  },
}
```

---

## Stack Patterns by Variant

**If history grows beyond 2 MB (unlikely with 50-entry cap):**
- Lower the cap further in `saveEntry`
- No library change required; the cap is a single integer constant

**If "Today / Yesterday / 3 days ago" relative date format is insufficient:**
- Add `date-fns` at that point (`npm install date-fns`)
- The `savedAt: number` epoch timestamp stored in `HistoryEntry` is compatible with all date libraries; no schema migration needed

**If cross-tab sync is required in a future milestone:**
- Replace `createJSONStorage(() => localStorage)` with a `BroadcastChannel`-based custom storage adapter
- Or migrate history to `idb-keyval` (IndexedDB) and switch to Zustand's async storage path
- The `HistoryEntry` shape is compatible with either approach; no schema migration needed

**If a backend is added in a future milestone:**
- The `HistoryEntry` shape (id, savedAt, config) maps cleanly to a database record
- The separation of active bill vs history stores means only `historyStore` needs a sync adapter
- `useBillStore` persist can be disabled once the server becomes the source of truth

---

## Version Compatibility

| Package | Version in use | Notes |
|---------|----------------|-------|
| `zustand` | 5.0.11 | persist middleware is built-in; v5.0.10 fixed a state-inconsistency bug with persist — already resolved at 5.0.11 |
| `immer` | 11.1.4 | Compatible with `zustand/middleware/immer` at this version |
| `zustand/middleware/immer` | (part of zustand 5.0.11) | immer peer dependency satisfied by immer ^11 |
| `typescript` | 5.9.3 | In Zustand v5, `partialize` type changed from `Partial<T>` to `T` — no workarounds needed, inference works correctly |

---

## Installation

**No new packages.** All v1.1 capabilities are built into existing dependencies:

```bash
# Nothing to install.
# persist is part of zustand (already installed at 5.0.11)
# crypto.randomUUID() is browser-native (already used in billStore.ts)
# Intl.RelativeTimeFormat is browser-native
```

**New files to create:**

| File | Purpose |
|------|---------|
| `src/store/historyStore.ts` | History Zustand store with persist middleware |
| `src/utils/formatPaymentText.ts` | Pure function for payer-directed payment text |
| `src/utils/formatPaymentText.test.ts` | Vitest tests for payment text formatting |

**Existing files to modify:**

| File | Change |
|------|--------|
| `src/store/billStore.ts` | Wrap existing `immer(stateCreator)` with `persist(immer(stateCreator), { ... })` for active bill auto-save |

---

## Sources

- [Zustand persist middleware docs](https://zustand.docs.pmnd.rs/middlewares/persist) — partialize, version, migrate, createJSONStorage API (HIGH confidence)
- [Zustand persisting store data guide](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) — hydration behavior, localStorage vs async storage tradeoffs (HIGH confidence)
- [Zustand immer middleware docs](https://zustand.docs.pmnd.rs/integrations/immer-middleware) — middleware combination (HIGH confidence)
- [Zustand middleware priority discussion](https://github.com/pmndrs/zustand/discussions/2389) — devtools outermost, immer innermost confirmed (MEDIUM confidence, community-verified)
- [Zustand v5.0.10 persist bug fix](https://github.com/pmndrs/zustand) — state-inconsistency fix in persist middleware (HIGH confidence, WebSearch)
- [nanoid npm page](https://www.npmjs.com/package/nanoid) — v5.1.6, 130 bytes (HIGH confidence)
- [MDN: crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) — browser support baseline (HIGH confidence)
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — localStorage 5 MB limit, Safari eviction behavior (HIGH confidence)
- [WebKit: Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/) — iOS Safari 7-day script-writable storage cap (MEDIUM confidence)
- [zustand partialize TypeScript discussion](https://github.com/pmndrs/zustand/discussions/1317) — type changed from Partial<T> to T in v5 (MEDIUM confidence)

---

*Stack research for: Expense Splitter v1.1 — localStorage persistence, history management, payment text*
*Researched: 2026-02-22*
