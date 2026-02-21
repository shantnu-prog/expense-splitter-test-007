/**
 * src/store/historyStore.ts
 *
 * Zustand 5 store with persist + immer middleware for saved bill history.
 *
 * Design:
 *   - Holds completed SavedSplit entries (BillConfig + metadata)
 *   - Capped at 50 entries to prevent localStorage quota errors
 *   - Uses safeLocalStorage to handle Safari Private Browsing and quota errors
 *   - Middleware order: persist(immer(creator)) — persist MUST wrap immer
 *
 * Exports:
 *   - useHistoryStore — React hook (via zustand `create` with persist)
 *   - createHistoryStore — vanilla factory for isolated test instances (no persist)
 *   - SavedSplitId — branded type
 *   - savedSplitId — constructor helper
 *   - SavedSplit — interface
 *   - HistoryState — interface
 */

import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { safeLocalStorage } from '../storage/localStorageAdapter';
import type { BillConfig } from '../engine/types';

// ---------------------------------------------------------------------------
// Branded type
// ---------------------------------------------------------------------------

export type SavedSplitId = string & { readonly __brand: 'SavedSplitId' };

export function savedSplitId(s: string): SavedSplitId {
  return s as SavedSplitId;
}

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export interface SavedSplit {
  id: SavedSplitId;
  savedAt: number;
  config: BillConfig;
}

export interface HistoryState {
  splits: SavedSplit[];
  save: (config: BillConfig) => SavedSplitId;
  update: (id: SavedSplitId, config: BillConfig) => void;
  remove: (id: SavedSplitId) => void;
  restore: (split: SavedSplit) => void;
}

// ---------------------------------------------------------------------------
// History cap constant
// ---------------------------------------------------------------------------

const HISTORY_CAP = 50;

// ---------------------------------------------------------------------------
// State creator (shared between React hook and vanilla factory)
// ---------------------------------------------------------------------------

type SetFn = (fn: (state: HistoryState) => void) => void;

const historyStateCreator = (set: SetFn): HistoryState => ({
  splits: [],

  save(config: BillConfig): SavedSplitId {
    const id = savedSplitId(crypto.randomUUID());
    const entry: SavedSplit = { id, savedAt: Date.now(), config };
    set((state) => {
      state.splits.unshift(entry);
      // Enforce 50-entry cap by slicing — drops oldest (tail) entries
      if (state.splits.length > HISTORY_CAP) {
        state.splits = state.splits.slice(0, HISTORY_CAP);
      }
    });
    return id;
  },

  update(id: SavedSplitId, config: BillConfig): void {
    set((state) => {
      const split = state.splits.find((s) => s.id === id);
      if (split) {
        split.config = config;
        split.savedAt = Date.now();
      }
    });
  },

  remove(id: SavedSplitId): void {
    set((state) => {
      state.splits = state.splits.filter((s) => s.id !== id);
    });
  },

  restore(split: SavedSplit): void {
    set((state) => {
      // Idempotent: skip if id already present
      if (state.splits.some((s) => s.id === split.id)) return;
      state.splits.unshift(split);
      // Re-sort by savedAt DESC (most recent first)
      state.splits.sort((a, b) => b.savedAt - a.savedAt);
    });
  },
});

// ---------------------------------------------------------------------------
// React hook export (useHistoryStore) — with persist middleware
// ---------------------------------------------------------------------------

export const useHistoryStore = create<HistoryState>()(
  persist(
    immer(historyStateCreator),
    {
      name: 'bs-history',
      storage: createJSONStorage(() => safeLocalStorage),
      version: 1,
      migrate(persisted: unknown, _fromVersion: number) {
        // Identity migration — returns persisted as-is for future schema changes
        return persisted as HistoryState;
      },
    }
  )
);

// ---------------------------------------------------------------------------
// Vanilla factory export (createHistoryStore) — for isolated test instances
// ---------------------------------------------------------------------------

export function createHistoryStore() {
  return createStore<HistoryState>()(immer(historyStateCreator));
}
