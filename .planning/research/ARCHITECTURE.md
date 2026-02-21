# Architecture Research

**Domain:** Client-side expense splitting web app — v1.1 persistence, history, and payment text integration
**Researched:** 2026-02-22
**Confidence:** HIGH (v1.0 codebase inspected directly; Zustand persist middleware patterns verified against official documentation)

---

## v1.1 Milestone Focus: Integration with Existing Architecture

This document extends the original v1.0 architecture research. The new milestone adds:
- localStorage persistence of saved splits (history)
- History list panel (browse, re-open, delete saved splits)
- Editable saved splits (load a saved split, modify, re-save)
- Payment text generation (payer-directed "Alice owes YOU $X" per person)

All additions integrate into the existing Zustand 5 + immer + React 19 codebase.

---

## Context: What Already Exists (from codebase inspection)

- `useBillStore` — Zustand 5 store with immer middleware. Holds `BillConfig` (people, items, assignments, tip, tax). All monetary values are `Cents` branded type (integer cents). `getResult()` calls `computeSplit()` on demand — no derived data stored.
- `computeSplit(BillConfig) → EngineResult` — pure function returning discriminated union (`ok: true | false`). Unchanged in v1.1.
- `Cents` / `PersonId` / `ItemId` — branded number/string types throughout.
- `AppShell.tsx` — mounts all panels via CSS `hidden` class (not unmount/remount). Tab state is local `useState<Tab>`.
- `useUndoDelete` hook — manages delete snapshots and 5-second timer in local component state. Reusable for history delete.
- `formatSummary.ts` — pure utility building clipboard text from `EngineSuccess + Person[]`. Unchanged.

---

## System Overview (v1.1)

```
┌────────────────────────────────────────────────────────────────────┐
│                          React UI Layer                            │
├───────────┬──────────────┬──────────────────┬─────────────────────┤
│  History  │   AppShell   │  SummaryPanel    │ PaymentTextSection  │
│  Panel    │  (modified)  │  (modified)      │ (new, in summary)   │
│  (new)    │              │                  │                     │
└─────┬─────┴──────┬───────┴────────┬─────────┴──────────┬──────────┘
      │            │                │                    │
      ↓            ↓                ↓                    ↓
┌────────────────────────────────────────────────────────────────────┐
│                         State Layer                                │
├───────────────────────────────┬────────────────────────────────────┤
│  useHistoryStore (NEW)        │  useBillStore (EXISTING, modified) │
│  - splits: SavedSplit[]       │  - config: BillConfig              │
│  - save / update / load /     │  - currentSplitId (NEW field)      │
│    remove actions             │  - loadConfig (NEW action)         │
│  wrapped with persist         │  - setCurrentSplitId (NEW action)  │
│  middleware                   │  - all existing actions unchanged  │
└───────────────┬───────────────┴────────────────────────────────────┘
                │
                ↓
┌────────────────────────────────────────────────────────────────────┐
│                      Persistence Layer                             │
│   localStorage key: "bs-history"                                   │
│   value: JSON array of SavedSplit[]                                │
│   Managed automatically by Zustand persist middleware              │
└────────────────────────────────────────────────────────────────────┘
                │
                ↓ (unchanged)
┌────────────────────────────────────────────────────────────────────┐
│                   Calculation Engine (UNCHANGED)                   │
│   computeSplit(BillConfig) → EngineResult                          │
└────────────────────────────────────────────────────────────────────┘
```

---

## Core Architectural Decision: Two Stores

**Use a separate `useHistoryStore` for the history list. Do NOT extend the existing `useBillStore`.**

### Rationale

The bill store holds the currently active bill being edited — ephemeral session state, frequently mutated on every keypress. The history store holds the collection of saved bills — durable records, mutated only on explicit save/delete. These are different concerns with different lifecycles and different persistence requirements.

Mixing them would require:
1. Nesting the active `BillConfig` inside a larger history structure
2. Rewriting every existing selector to navigate the new shape
3. Persisting the in-progress draft alongside saved history (wrong UX — auto-restoring a half-finished session)

The Zustand community guidance explicitly supports multiple stores when concerns are independent. The two stores communicate through a deliberate, explicit API (explicit `save()` / `load()` calls), not subscriptions.

---

## Data Model for Saved Splits

```typescript
// src/store/historyStore.ts

/** Stable identifier for a saved split session. */
export type SavedSplitId = string & { readonly __brand: 'SavedSplitId' };

export function savedSplitId(s: string): SavedSplitId {
  return s as SavedSplitId;
}

/**
 * A snapshot of a complete bill configuration, stored in history.
 * Stores BillConfig only — no derived data (consistent with "inputs only" philosophy).
 * Display metadata (people names, total) is derived at render time via computeSplit().
 */
export interface SavedSplit {
  id: SavedSplitId;
  savedAt: number;      // Unix timestamp ms (Date.now()) — sort key and display label
  config: BillConfig;   // Full BillConfig snapshot — JSON-serializable, no class instances
}

export interface HistoryState {
  splits: SavedSplit[];                            // Ordered newest-first (savedAt DESC)
  save: (config: BillConfig) => SavedSplitId;     // Returns new id
  update: (id: SavedSplitId, config: BillConfig) => void; // Re-save existing
  load: (id: SavedSplitId) => BillConfig | null;  // Returns config or null
  remove: (id: SavedSplitId) => void;
  restore: (split: SavedSplit) => void;            // Undo-delete: re-insert with original id
}
```

**Why store only `BillConfig`, not derived totals:**
- Consistent with the existing "inputs only" philosophy (store holds inputs; engine computes fresh)
- No synchronization problem between stored display data and stored input data if engine logic changes
- `BillConfig` is already JSON-serializable (no `Map`, `Set`, or class instances — all plain objects and arrays)
- Engine is fast enough to re-derive the total for each history row at render time

**localStorage key scheme:**

Single key for the entire collection:
```
"bs-history"  →  JSON.stringify(SavedSplit[])
```

With typical `BillConfig` being ~2–5 KB serialized (10 people, 20 items), the 5MB localStorage budget supports 500–1000+ saved splits. No separate index key needed — the full array is small enough to read and write atomically.

---

## Architectural Patterns

### Pattern 1: Zustand `persist` Middleware on the History Store

**What:** Wrap `useHistoryStore` with Zustand's built-in `persist` middleware. Handles serialization, deserialization, and rehydration automatically on app load.

**When to use:** Any Zustand store where the full state (or a partition) should survive page reload.

**Middleware composition (persist wraps immer):**

```typescript
// src/store/historyStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export const useHistoryStore = create<HistoryState>()(
  persist(
    immer((set, get) => ({
      splits: [],

      save(config: BillConfig): SavedSplitId {
        const id = savedSplitId(crypto.randomUUID());
        set((state) => {
          state.splits.unshift({ id, savedAt: Date.now(), config });
        });
        return id;
      },

      update(id: SavedSplitId, config: BillConfig) {
        set((state) => {
          const split = state.splits.find((s) => s.id === id);
          if (split) {
            split.config = config;
            split.savedAt = Date.now();
          }
        });
      },

      load(id: SavedSplitId): BillConfig | null {
        return get().splits.find((s) => s.id === id)?.config ?? null;
      },

      remove(id: SavedSplitId) {
        set((state) => {
          state.splits = state.splits.filter((s) => s.id !== id);
        });
      },

      restore(split: SavedSplit) {
        set((state) => {
          // Idempotent: skip if already present
          if (state.splits.some((s) => s.id === split.id)) return;
          state.splits.unshift(split);
          // Re-sort by savedAt DESC
          state.splits.sort((a, b) => b.savedAt - a.savedAt);
        });
      },
    })),
    {
      name: 'bs-history',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate(persisted: unknown, _fromVersion: number) {
        // Identity migration for v1; add cases here for future schema changes
        return persisted as HistoryState;
      },
    }
  )
);

// Vanilla factory for isolated test instances (mirrors createBillStore pattern)
export function createHistoryStore() {
  return createStore<HistoryState>()(
    persist(
      immer(/* same creator */),
      { name: `bs-history-test-${crypto.randomUUID()}`, storage: createJSONStorage(() => localStorage) }
    )
  );
}
```

**Do NOT use `persist` on the existing `useBillStore`.** Persisting the bill store auto-restores an unfinished session on reload — the user opens the app and sees a half-finished bill instead of the history list. The bill store remains ephemeral; history is the persistence layer.

### Pattern 2: Explicit Save — Manual User Action, Not Auto-Save

**What:** History saves are triggered by an explicit "Save Split" button tap, not by watching store changes and writing to history automatically.

**When to use:** When users need to distinguish "work in progress" from "I'm done and want to keep this."

**Why not auto-save:**
- Auto-save creates ambiguity: is the history entry the final split or an intermediate state?
- Debounced auto-save requires tracking "current split ID" to know which history entry to update — substantial added complexity
- History becomes noisy with intermediate states (e.g., saves during data entry)
- Explicit save is the established pattern for apps where users complete a discrete task (bill splitting is a task with a clear end state)

**Implementation:** A "Save Split" button in `SummaryPanel` calls `useHistoryStore.getState().save(billStore.getState().config)`. The label changes to "Update Split" when `currentSplitId !== null`.

### Pattern 3: Load = Replace Bill Store Config (One-Time Action, Not Subscription)

**What:** Loading a saved split replaces the current bill store config entirely via a new `loadConfig` action.

**Why not subscriptions to sync the two stores:**
- Subscriptions create implicit coupling
- Load is a deliberate one-time event, not continuous synchronization
- Explicit imperative call (`useBillStore.getState().loadConfig(config)`) is clear and independently testable

**New additions to `billStore.ts`:**

```typescript
// Add to BillState interface:
currentSplitId: SavedSplitId | null;     // null = new unsaved split
setCurrentSplitId: (id: SavedSplitId | null) => void;
loadConfig: (config: BillConfig) => void; // Replace entire config

// In stateCreator:
currentSplitId: null,

setCurrentSplitId(id) {
  set((state) => { state.currentSplitId = id; });
},

loadConfig(config: BillConfig) {
  set((state) => { state.config = config; });
},

// Update reset() to also clear currentSplitId:
reset() {
  set((state) => {
    state.config = { /* initialConfig */ };
    state.currentSplitId = null;
  });
},
```

`currentSplitId` does NOT go inside `config` — it is session metadata, not a bill input.

**Load flow:**
```
HistoryPanel: user taps a saved split row
  → historyStore.load(id) → BillConfig
  → billStore.getState().loadConfig(config)
  → billStore.getState().setCurrentSplitId(id)
  → AppShell navigates to 'split' tab (user sees the result immediately)
```

**Re-save flow (updating an existing split):**
```
SummaryPanel: user taps "Update Split"
  → currentSplitId !== null
  → historyStore.getState().update(currentSplitId, billStore.getState().config)
  → Toast: "Split updated"
```

### Pattern 4: Payment Text Generation — Pure Utility Function

**What:** Payment text is derived output, not stored state. A pure function `formatPaymentText()` takes `EngineSuccess`, `Person[]`, and a payer `PersonId`, returns formatted string. Copied to clipboard on demand.

**When to use:** Any output that is a pure transformation of existing state — no side effects, no storage.

**Payer selection state:** The selected payer lives in `useState<PersonId | null>` inside `PaymentTextSection`. It does NOT belong in the bill store (it is a display preference, not a bill input) and does NOT get saved to history (it has no meaning when the split is re-opened later).

```typescript
// src/utils/formatPaymentText.ts

/**
 * Generate payer-directed payment text.
 * Each non-payer person gets a line: "[Person] owes [Payer] $X.XX"
 *
 * Payer's own line is omitted (they paid — they owe nothing).
 * Returns empty string if payerPersonId not found in people.
 */
export function formatPaymentText(
  result: EngineSuccess,
  people: Person[],
  payerPersonId: PersonId
): string {
  const payer = people.find((p) => p.id === payerPersonId);
  if (!payer) return '';

  const lines: string[] = [];
  for (const personResult of result.results) {
    if (personResult.personId === payerPersonId) continue;
    const person = people.find((p) => p.id === personResult.personId);
    if (!person) continue;
    const amount = centsToDollars(personResult.roundedTotalCents);
    lines.push(`${person.name} owes ${payer.name} $${amount}`);
  }
  return lines.join('\n');
}
```

---

## Component Boundaries

### New Components

| Component | Location | Responsibility |
|-----------|----------|---------------|
| `HistoryPanel` | `src/components/history/HistoryPanel.tsx` | Displays saved splits list; triggers load and delete; reuses `useUndoDelete` |
| `HistoryRow` | `src/components/history/HistoryRow.tsx` | Single saved split row: date, people names (from config), total (derived via computeSplit) |
| `PaymentTextSection` | `src/components/summary/PaymentTextSection.tsx` | Payer picker + formatted text display + copy button; local payer state |

### Modified Components

| Component | Change Required |
|-----------|----------------|
| `AppShell.tsx` | Add `'history'` to `Tab` type; add `HistoryPanel` panel mount; initial tab logic (history if splits exist, else people) |
| `TabBar.tsx` | Add `'history'` tab button; no other changes |
| `SummaryPanel.tsx` | Add "Save Split" / "Update Split" button; add `<PaymentTextSection>` below person cards; read `currentSplitId` from bill store |

### Explicitly Unchanged Components

| Component | Why Unchanged |
|-----------|--------------|
| `engine/engine.ts` | Pure function — no persistence concerns |
| `engine/types.ts` | `BillConfig` shape unchanged; `SavedSplitId` type goes in `historyStore.ts` |
| `PeoplePanel`, `ItemsPanel`, `AssignmentPanel`, `TipTaxPanel` | No persistence logic needed in data-entry panels |
| `useUndoDelete.ts` | Reused as-is in `HistoryPanel` for delete undo |
| `formatSummary.ts` | Unchanged; `formatPaymentText.ts` is a sibling utility |
| `PersonCard`, `CopyButton`, `Toast`, `UndoToast` | All reused or unchanged |

---

## Data Flow

### Save New Split

```
User taps "Save Split" in SummaryPanel
  ↓
currentSplitId === null (new split)
  ↓
config = useBillStore.getState().config
  ↓
newId = useHistoryStore.getState().save(config)
  ↓
useBillStore.getState().setCurrentSplitId(newId)
  ↓
persist middleware writes to localStorage["bs-history"] (synchronous)
  ↓
Toast: "Split saved"
```

### Update Existing Split

```
User edits a loaded split, taps "Update Split"
  ↓
currentSplitId !== null
  ↓
config = useBillStore.getState().config
  ↓
useHistoryStore.getState().update(currentSplitId, config)
  ↓
persist middleware writes to localStorage["bs-history"]
  ↓
Toast: "Split updated"
```

### Load Saved Split

```
User taps a saved split row in HistoryPanel
  ↓
split = useHistoryStore.getState().splits.find(id)
  ↓
useBillStore.getState().loadConfig(split.config)
useBillStore.getState().setCurrentSplitId(split.id)
  ↓
All panels re-render from new config via Zustand subscriptions (automatic)
  ↓
AppShell switches to 'split' tab (user sees loaded result immediately)
```

### Delete Saved Split with Undo

```
User taps delete on a history row
  ↓
snapshot = splits.find(id)  // capture full SavedSplit before removal
useHistoryStore.getState().remove(id)
  ↓
useUndoDelete.scheduleDelete({ kind: 'savedSplit', split: snapshot })
  ↓
UndoToast shown for 5 seconds
  ↓
UNDO tapped:
  useHistoryStore.getState().restore(snapshot)  // re-inserts with original id/savedAt
TIMEOUT or DISMISS:
  delete committed; nothing to do
```

### Payment Text Generation

```
User opens SummaryPanel (result.ok === true)
  ↓
PaymentTextSection renders payer picker (all people from store)
  ↓
User selects payer → local useState<PersonId | null> updates
  ↓
formatPaymentText(result, people, payerId) → string (pure, synchronous)
  ↓
Text rendered in readonly textarea
  ↓
User taps copy → useCopyToClipboard → Toast: "Copied"
```

---

## Recommended Project Structure Changes

```
src/
├── components/
│   ├── history/               # NEW — history panel
│   │   ├── HistoryPanel.tsx
│   │   └── HistoryRow.tsx
│   ├── layout/
│   │   ├── AppShell.tsx       # MODIFIED — history tab + HistoryPanel mount
│   │   └── TabBar.tsx         # MODIFIED — history tab button
│   └── summary/
│       ├── SummaryPanel.tsx           # MODIFIED — save button + PaymentTextSection
│       └── PaymentTextSection.tsx     # NEW — payer picker + copy
├── store/
│   ├── billStore.ts           # MODIFIED — loadConfig + currentSplitId
│   └── historyStore.ts        # NEW — persist-wrapped history store
└── utils/
    ├── formatSummary.ts           # UNCHANGED
    └── formatPaymentText.ts       # NEW — pure payer-directed text
```

---

## Anti-Patterns

### Anti-Pattern 1: Persisting the Bill Store

**What people do:** Wrap the existing `useBillStore` with `persist` middleware to "not lose work on refresh."

**Why it's wrong:** On next app open, the user sees a half-finished bill instead of the history list. There is no clean starting state. The history list becomes redundant. Auto-restoring an in-progress session is usually unexpected behavior in a restaurant context (users typically start fresh each time).

**Do this instead:** Keep the bill store ephemeral. Use `useHistoryStore` only for intentional saves. On app open, bill store starts fresh; history list shows saved splits.

### Anti-Pattern 2: Storing Derived Totals in SavedSplit

**What people do:** At save time, call `computeSplit(config)` and store per-person results alongside `BillConfig` for fast history list display.

**Why it's wrong:** Two copies of truth. If rounding rules or engine logic changes in a future version, stored display totals become stale and incorrect. The engine is fast enough to re-derive history row totals at render time.

**Do this instead:** Store only `BillConfig`. Derive display totals (total, people names) fresh from `config` at render time in `HistoryRow`.

### Anti-Pattern 3: Payer Selection in the Zustand Store

**What people do:** Add `selectedPayerId: PersonId | null` to `BillState` because it is "global UI state."

**Why it's wrong:** Pollutes the bill config with a display preference. Gets serialized into history. Creates a stale-payer bug when a different split is loaded (the previously selected payer ID may not exist in the new split's people list).

**Do this instead:** Keep payer selection in `useState` inside `PaymentTextSection`. It resets naturally when the component re-renders after a new split loads.

### Anti-Pattern 4: Subscriptions to Sync History and Bill Store

**What people do:** Subscribe to `useBillStore` changes and auto-update the matching history entry whenever the bill changes.

**Why it's wrong:** Auto-update makes it impossible for users to make temporary edits without committing them to history. It also writes to localStorage on every keystroke. The boundary between "draft" and "saved" disappears.

**Do this instead:** Explicit save/update actions only. Show an "unsaved changes" indicator in `SummaryPanel` when `currentSplitId !== null` but the current config differs from the saved version (optional for v1.1).

### Anti-Pattern 5: Multiple localStorage Keys (One Per Split)

**What people do:** Store each saved split as its own localStorage key (`bs-split-{uuid}`) with a separate index key listing all IDs.

**Why it's wrong:** Adds key management complexity with no benefit at this scale. Requires two reads (index + individual) on load. Requires cleanup on delete. Zustand's persist middleware is designed for a single JSON blob per store.

**Do this instead:** Store all splits as an array in a single `bs-history` key. Atomic read/write; persist middleware handles it automatically.

### Anti-Pattern 6: `useEffect` for Auto-Save Debouncing

**What people do:** `useEffect(() => { debouncedSave(config) }, [config])` in `AppShell` to auto-save the current bill.

**Why it's wrong:** Debounce inside `useEffect` is notoriously tricky to get right — the debounced function reference changes on every render, defeating the debounce. Stale closure bugs are common. More importantly, auto-saving to history on every change removes the concept of a "draft" session.

**Do this instead:** Explicit save button. Simple, predictable, no closure bugs.

---

## Integration Points

### New ↔ Existing Cross-Store API

| Trigger | From | To | Call |
|---------|------|----|------|
| "Save Split" tap | `SummaryPanel` | `useHistoryStore` | `save(useBillStore.getState().config)` |
| "Update Split" tap | `SummaryPanel` | `useHistoryStore` | `update(currentSplitId, config)` |
| Tap history row | `HistoryPanel` | `useBillStore` | `loadConfig(split.config)` |
| Tap history row | `HistoryPanel` | `useBillStore` | `setCurrentSplitId(split.id)` |
| New bill button | `HistoryPanel` | `useBillStore` | `reset()` (clears currentSplitId) |

### Internal Module Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `HistoryPanel` ↔ `useHistoryStore` | Direct hook reads + action calls | Standard Zustand pattern |
| `HistoryPanel` ↔ `useBillStore` | Imperative via `getState()` | One-time action, not subscribe |
| `SummaryPanel` ↔ `useHistoryStore` | Imperative via `getState()` on button tap | Avoids unnecessary re-renders from history subscription |
| `PaymentTextSection` ↔ engine | Props only — receives `result` and `people` from `SummaryPanel` | No store access needed; keeps component pure |
| `formatPaymentText` ↔ `formatSummary` | No shared state — sibling pure utilities | Both import `centsToDollars` from `currency.ts` |

---

## Build Order (Dependency-Ordered)

Dependencies are strict: history store depends on `BillConfig` type; UI components depend on both stores; `SummaryPanel` modifications depend on both the history store (save) and the payment text utility.

1. **`src/store/historyStore.ts`** — New file. Add `SavedSplitId` branded type here. Implement `HistoryState` with `persist` + `immer`. Add `createHistoryStore` vanilla factory for tests. Write unit tests verifying save/load/remove/restore.

2. **`src/store/billStore.ts`** — Additive changes only: `currentSplitId` state field, `setCurrentSplitId` action, `loadConfig` action. Update `reset()` to clear `currentSplitId`. Update existing tests; no existing tests should break.

3. **`src/utils/formatPaymentText.ts`** — New pure utility. Zero dependencies beyond existing engine types and `currency.ts`. Write unit tests: payer not found (empty string), single-person bill (empty string), standard case (correct lines), payer omitted from own output.

4. **`src/components/history/HistoryPanel.tsx` + `HistoryRow.tsx`** — History list UI. Reuse `useUndoDelete` for delete undo. `HistoryRow` calls `computeSplit(split.config)` to derive total for display.

5. **`src/components/layout/TabBar.tsx`** — Add `'history'` to `Tab` type and render a new tab button. Minimal change.

6. **`src/components/layout/AppShell.tsx`** — Add `HistoryPanel` panel mount. Add initial-tab logic: `splits.length > 0 ? 'history' : 'people'`. Add `'history'` case to CSS-hidden panel block.

7. **`src/components/summary/PaymentTextSection.tsx`** — New component. Local `useState<PersonId | null>` for payer. Receives `result` and `people` as props. Calls `formatPaymentText`. Uses existing `useCopyToClipboard`.

8. **`src/components/summary/SummaryPanel.tsx`** — Add "Save Split" / "Update Split" button reading `currentSplitId` from bill store. Render `<PaymentTextSection>` below person cards when `result.ok`.

**Why this order:**
- History store (1) and bill store changes (2) must exist before any UI that uses them
- Payment text utility (3) has zero dependencies — can be done in parallel with (1) and (2)
- History UI (4) depends on history store
- Tab changes (5) are a prerequisite for AppShell changes (6)
- `PaymentTextSection` (7) depends on the utility from step (3)
- `SummaryPanel` modifications (8) come last — they depend on both history store and `PaymentTextSection`

---

## Scaling Considerations

This is client-side only. The relevant scale dimension is the number of saved splits and bill complexity.

| Concern | Current scale (1–50 saves) | At 200+ saves |
|---------|---------------------------|---------------|
| localStorage size | Negligible (~2–5 KB/split) | Approach limits; add save count cap (50 most recent) in `save()` action |
| History list render | Instant | Add windowing (react-virtual) only if visible lag observed |
| persist write latency | Synchronous, negligible | No change needed; writes only on save/delete events |
| Schema migration | `version: 1` with identity `migrate` | Increment version + write migration for each schema change |
| `computeSplit` per row | Fast for typical bills | Cache result in `useMemo` inside `HistoryRow` keyed on `split.id` |

**First bottleneck:** localStorage size at 200+ saves with large bills. Mitigation: cap `splits` array at 50 entries in `save()` (drop the oldest). This is a one-line addition to the `save` action and does not affect the rest of the architecture.

---

## Original v1.0 Architecture Patterns (Reference)

The patterns below from the original research remain valid and unchanged in v1.1.

### Pattern: Unidirectional Data Flow

User actions → store mutations → engine re-derives totals → UI re-renders. No reverse flow. No derived totals stored in state.

### Pattern: Pure Calculation Engine

All split math in `computeSplit(BillConfig) → EngineResult`. No React imports, no side effects, independently unit-testable. Called on demand from `getResult()` — not on every state change.

### Pattern: Integer Cents Throughout

All monetary values are `Cents` (branded integer). `formatPaymentText` and `HistoryRow` both use `centsToDollars()` for display. No floating-point arithmetic in payment text generation.

---

## Sources

- [Zustand persist middleware — official docs](https://zustand.docs.pmnd.rs/middlewares/persist) — HIGH confidence
- [Zustand persisting store data — official docs](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) — HIGH confidence
- [Zustand multiple stores discussion](https://github.com/pmndrs/zustand/discussions/2486) — MEDIUM confidence
- [Zustand slices pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern) — HIGH confidence
- [subscribeWithSelector middleware — official docs](https://zustand.docs.pmnd.rs/middlewares/subscribe-with-selector) — HIGH confidence (consulted, not used — explicit actions preferred over subscriptions)
- Existing v1.0 codebase (`billStore.ts`, `engine/types.ts`, `AppShell.tsx`, `SummaryPanel.tsx`, `TabBar.tsx`, `useUndoDelete.ts`, `formatSummary.ts`) — HIGH confidence (direct file inspection)

---

*Architecture research for: localStorage persistence, history management, and payment text integration in existing Zustand 5 bill-splitter*
*Researched: 2026-02-22*
