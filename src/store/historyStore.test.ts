/**
 * src/store/historyStore.test.ts
 *
 * Unit tests for the Zustand history store.
 *
 * Testing approach:
 *   - Uses createHistoryStore() vanilla factory (NO persist middleware)
 *   - Node test environment — no jsdom, no localStorage needed
 *   - Each test creates a fresh isolated store instance
 *   - Verifies: save/update/remove/restore actions, 50-entry cap, idempotency
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHistoryStore, savedSplitId } from './historyStore';
import type { HistoryState, SavedSplit } from './historyStore';
import type { StoreApi } from 'zustand/vanilla';
import { cents, personId, itemId } from '../engine/types';
import type { BillConfig } from '../engine/types';

// Helper type
type HistoryStore = StoreApi<HistoryState>;

// ---------------------------------------------------------------------------
// Helper: minimal valid BillConfig for test data
// ---------------------------------------------------------------------------

let _configCounter = 0;

function makeTestConfig(label = 'Test Item'): BillConfig {
  _configCounter++;
  const pid = personId(`person-${_configCounter}`);
  const iid = itemId(`item-${_configCounter}`);
  return {
    people: [{ id: pid, name: `Person ${_configCounter}` }],
    items: [{ id: iid, label, priceCents: cents(1000), quantity: 1 }],
    assignments: { [iid]: [pid] },
    tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HistoryStore', () => {
  let store: HistoryStore;

  beforeEach(() => {
    _configCounter = 0;
    store = createHistoryStore();
  });

  it('1. save() adds entry and returns id', () => {
    const config = makeTestConfig('Pizza');
    const id = store.getState().save(config);

    const { splits } = store.getState();
    expect(splits).toHaveLength(1);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    expect(splits[0].config).toEqual(config);
    expect(splits[0].id).toBe(id);
  });

  it('2. save() caps at 50 entries — oldest entry is dropped', () => {
    // Save 51 entries — 51st is the "oldest" since each unshifts to front
    // After cap, the 51st entry (which would be at index 50) is dropped
    const configs: BillConfig[] = [];
    for (let i = 0; i < 51; i++) {
      configs.push(makeTestConfig(`Item ${i}`));
    }

    // Save all 51 in order — first saved ends up deepest (oldest) due to unshift
    const ids: string[] = [];
    for (const config of configs) {
      ids.push(store.getState().save(config));
    }

    const { splits } = store.getState();
    expect(splits).toHaveLength(50);

    // The first entry saved (id[0]) should have been dropped (it's the oldest)
    const presentIds = splits.map((s) => s.id);
    expect(presentIds).not.toContain(ids[0]);
    // The most recently saved (ids[50]) should be at index 0
    expect(splits[0].id).toBe(ids[50]);
  });

  it('3. update() modifies existing entry config and savedAt', async () => {
    const original = makeTestConfig('Original');
    const id = store.getState().save(original);

    // Small delay to ensure savedAt changes
    const savedAtBefore = store.getState().splits[0].savedAt;

    // Wait a tick to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 1));

    const updated = makeTestConfig('Updated');
    store.getState().update(id, updated);

    const { splits } = store.getState();
    expect(splits).toHaveLength(1);
    expect(splits[0].config).toEqual(updated);
    expect(splits[0].config.items[0].label).toBe('Updated');
    expect(splits[0].savedAt).toBeGreaterThanOrEqual(savedAtBefore);
  });

  it('4. remove() deletes by id — correct entry removed', () => {
    const config1 = makeTestConfig('First');
    const config2 = makeTestConfig('Second');

    const id1 = store.getState().save(config1);
    store.getState().save(config2);

    expect(store.getState().splits).toHaveLength(2);

    store.getState().remove(id1);

    const { splits } = store.getState();
    expect(splits).toHaveLength(1);
    // Remaining split should be config2 (second saved, unshifted to position 0 before removal)
    expect(splits[0].config.items[0].label).toBe('Second');
  });

  it('5. restore() re-inserts with original id after removal', () => {
    const config = makeTestConfig('Restore Test');
    const id = store.getState().save(config);

    // Capture the full split object
    const saved: SavedSplit = store.getState().splits[0];

    // Remove it
    store.getState().remove(id);
    expect(store.getState().splits).toHaveLength(0);

    // Restore it
    store.getState().restore(saved);

    const { splits } = store.getState();
    expect(splits).toHaveLength(1);
    expect(splits[0].id).toBe(id);
    expect(splits[0].config).toEqual(config);
  });

  it('6. restore() is idempotent — restoring same entry twice yields one entry', () => {
    const config = makeTestConfig('Idempotent');
    store.getState().save(config);

    const saved: SavedSplit = store.getState().splits[0];

    // Restore once — should be a no-op since it's still in the store
    store.getState().restore(saved);

    expect(store.getState().splits).toHaveLength(1);

    // Remove then restore twice
    store.getState().remove(saved.id);
    store.getState().restore(saved);
    store.getState().restore(saved); // second restore should not add duplicate

    expect(store.getState().splits).toHaveLength(1);
  });
});
