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

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

export interface BillState {
  config: BillConfig;

  // --- Actions ---
  addPerson: (name: string) => void;
  removePerson: (id: PersonId) => void;
  updatePerson: (id: PersonId, updates: Partial<Pick<Person, 'name'>>) => void;

  addItem: (label: string, priceCents: number, quantity?: number) => void;
  removeItem: (id: ItemId) => void;
  updateItem: (id: ItemId, updates: Partial<Pick<Item, 'label' | 'priceCents' | 'quantity'>>) => void;
  assignItem: (id: ItemId, personIds: PersonId[]) => void;

  setTip: (amountCents: number, method: 'equal' | 'proportional', includeZeroFoodPeople: boolean) => void;
  setTax: (amountCents: number, method: 'equal' | 'proportional', includeZeroFoodPeople: boolean) => void;

  reset: () => void;

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
    });
  },

  // --- Derived computation ---

  getResult(): EngineResult {
    return computeSplit(get().config);
  },
});

// ---------------------------------------------------------------------------
// React hook export (useBillStore)
// ---------------------------------------------------------------------------

export const useBillStore = create<BillState>()(immer(stateCreator));

// ---------------------------------------------------------------------------
// Vanilla factory export (createBillStore) — for isolated test instances
// ---------------------------------------------------------------------------

export function createBillStore() {
  return createStore<BillState>()(immer(stateCreator));
}
