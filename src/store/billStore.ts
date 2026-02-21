/**
 * src/store/billStore.ts
 *
 * Zustand 5 store with immer middleware for bill-splitting state management.
 *
 * Design:
 *   - Holds only input data (people, items, assignments, tip/tax config)
 *   - No derived totals stored in state
 *   - getResult() computes fresh results via computeSplit() on each call
 *
 * Exports:
 *   - useBillStore — React hook (via zustand `create`)
 *   - createBillStore — vanilla factory for isolated test instances (zustand/vanilla `createStore`)
 */

import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { computeSplit } from '../engine/engine';
import type {
  BillConfig,
  EngineResult,
  Item,
  ItemId,
  Person,
  PersonId,
} from '../engine/types';
import { cents, itemId, personId } from '../engine/types';
import { safeLocalStorage } from '../storage/localStorageAdapter';
import { deserializeBillConfig } from '../storage/deserializeBillConfig';
import type { SavedSplitId } from './historyStore';

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

export interface BillState {
  config: BillConfig;

  /** null = new unsaved split, non-null = editing a saved split */
  currentSplitId: SavedSplitId | null;

  // --- Actions ---
  addPerson: (name: string) => void;
  removePerson: (id: PersonId) => void;
  updatePerson: (id: PersonId, updates: Partial<Pick<Person, 'name'>>) => void;
  restorePerson: (person: Person, assignments: Record<ItemId, PersonId[]>) => void;

  addItem: (label: string, priceCents: number, quantity?: number) => void;
  removeItem: (id: ItemId) => void;
  updateItem: (id: ItemId, updates: Partial<Pick<Item, 'label' | 'priceCents' | 'quantity'>>) => void;
  assignItem: (id: ItemId, personIds: PersonId[]) => void;
  restoreItem: (item: Item, assignedIds: PersonId[]) => void;

  setTip: (amountCents: number, method: 'equal' | 'proportional', includeZeroFoodPeople: boolean) => void;
  setTax: (amountCents: number, method: 'equal' | 'proportional', includeZeroFoodPeople: boolean) => void;

  reset: () => void;

  /** Replaces entire config from a saved split */
  loadConfig: (config: BillConfig) => void;
  /** Set or clear the current split id (null = new unsaved split) */
  setCurrentSplitId: (id: SavedSplitId | null) => void;

  // --- Derived (computed on read, never stored in state) ---
  getResult: () => EngineResult;
}

// ---------------------------------------------------------------------------
// Initial config
// ---------------------------------------------------------------------------

const initialConfig: BillConfig = {
  items: [],
  people: [],
  assignments: {},
  tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
  tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
};

// ---------------------------------------------------------------------------
// State creator (shared between React hook and vanilla factory)
// ---------------------------------------------------------------------------

type SetFn = (fn: (state: BillState) => void) => void;
type GetFn = () => BillState;

const stateCreator = (set: SetFn, get: GetFn): BillState => ({
  config: {
    ...initialConfig,
    assignments: {},
    tip: { ...initialConfig.tip },
    tax: { ...initialConfig.tax },
    items: [],
    people: [],
  },

  currentSplitId: null,

  // --- People actions ---

  addPerson(name: string) {
    set((state) => {
      const id = personId(crypto.randomUUID());
      state.config.people.push({ id, name });
    });
  },

  removePerson(id: PersonId) {
    set((state) => {
      // Remove person from people list
      state.config.people = state.config.people.filter((p) => p.id !== id);

      // Remove person from all item assignments
      for (const itemKey of Object.keys(state.config.assignments) as ItemId[]) {
        state.config.assignments[itemKey] = state.config.assignments[itemKey].filter(
          (pid) => pid !== id
        );
        // If assignment is now empty, item becomes unassigned (blocks calc) — do NOT delete item
      }
    });
  },

  updatePerson(id: PersonId, updates: Partial<Pick<Person, 'name'>>) {
    set((state) => {
      const person = state.config.people.find((p) => p.id === id);
      if (person) {
        Object.assign(person, updates);
      }
    });
  },

  restorePerson(person: Person, assignments: Record<ItemId, PersonId[]>) {
    set((state) => {
      // Guard: idempotent — only restore if person is NOT already present
      if (state.config.people.some((p) => p.id === person.id)) return;
      // Preserve original ID — critical for assignment matching (research pitfall #1)
      state.config.people.push(person);
      // Re-apply assignments for items that still exist
      for (const [itemId] of Object.entries(assignments) as [ItemId, PersonId[]][]) {
        if (state.config.assignments[itemId] !== undefined) {
          if (!state.config.assignments[itemId].includes(person.id)) {
            state.config.assignments[itemId] = [...state.config.assignments[itemId], person.id];
          }
        }
      }
    });
  },

  // --- Item actions ---

  addItem(label: string, priceCents: number, quantity = 1) {
    set((state) => {
      const id = itemId(crypto.randomUUID());
      state.config.items.push({ id, label, priceCents: cents(priceCents), quantity });
      state.config.assignments[id] = [];
    });
  },

  removeItem(id: ItemId) {
    set((state) => {
      state.config.items = state.config.items.filter((item) => item.id !== id);
      delete state.config.assignments[id];
    });
  },

  updateItem(id: ItemId, updates: Partial<Pick<Item, 'label' | 'priceCents' | 'quantity'>>) {
    set((state) => {
      const item = state.config.items.find((i) => i.id === id);
      if (item) {
        Object.assign(item, updates);
      }
    });
  },

  assignItem(id: ItemId, personIds: PersonId[]) {
    set((state) => {
      state.config.assignments[id] = personIds;
    });
  },

  restoreItem(item: Item, assignedIds: PersonId[]) {
    set((state) => {
      // Guard: idempotent — only restore if item is NOT already present
      if (state.config.items.some((i) => i.id === item.id)) return;
      // Preserve original item (including original ID)
      state.config.items.push(item);
      // Restore assignments, filtered to only include people still present
      const existingPersonIds = new Set(state.config.people.map((p) => p.id));
      state.config.assignments[item.id] = assignedIds.filter((pid) => existingPersonIds.has(pid));
    });
  },

  // --- Tip / Tax actions ---

  setTip(amountCents: number, method: 'equal' | 'proportional', includeZeroFoodPeople: boolean) {
    set((state) => {
      state.config.tip = { amountCents: cents(amountCents), method, includeZeroFoodPeople };
    });
  },

  setTax(amountCents: number, method: 'equal' | 'proportional', includeZeroFoodPeople: boolean) {
    set((state) => {
      state.config.tax = { amountCents: cents(amountCents), method, includeZeroFoodPeople };
    });
  },

  // --- Reset ---

  reset() {
    set((state) => {
      state.config = {
        items: [],
        people: [],
        assignments: {},
        tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
        tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      };
      state.currentSplitId = null;
    });
  },

  // --- Load / ID actions ---

  loadConfig(config: BillConfig) {
    set((state) => {
      state.config = config;
    });
  },

  setCurrentSplitId(id: SavedSplitId | null) {
    set((state) => {
      state.currentSplitId = id;
    });
  },

  // --- Derived computation ---

  getResult(): EngineResult {
    return computeSplit(get().config);
  },
});

// ---------------------------------------------------------------------------
// React hook export (useBillStore) — with persist middleware
// ---------------------------------------------------------------------------

export const useBillStore = create<BillState>()(
  persist(
    immer(stateCreator),
    {
      name: 'bill-splitter-active',
      storage: createJSONStorage(() => safeLocalStorage),
      version: 1,
      // Only persist the active config — currentSplitId resets to null on refresh,
      // and action functions are not serializable.
      partialize: (state) => ({ config: state.config }),
      merge: (persisted, currentState) => {
        // persisted is the raw JSON.parse output from localStorage.
        // Branded types (Cents, PersonId, ItemId) have lost their brands.
        // Re-apply them through deserializeBillConfig before merging into store.
        const p = persisted as { config?: unknown } | undefined;
        if (p?.config) {
          return {
            ...currentState,
            config: deserializeBillConfig(p.config),
          };
        }
        return { ...currentState };
      },
      migrate(persisted: unknown, _fromVersion: number) {
        return persisted as Pick<BillState, 'config'>;
      },
    }
  )
);

// ---------------------------------------------------------------------------
// Vanilla factory export (createBillStore) — for isolated test instances
// ---------------------------------------------------------------------------

export function createBillStore() {
  return createStore<BillState>()(immer(stateCreator));
}
