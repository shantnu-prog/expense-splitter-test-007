/**
 * src/store/billStore.test.ts
 *
 * Unit and integration tests for the Zustand bill store.
 *
 * Testing approach:
 *   - Each test creates a fresh isolated store via createBillStore() in beforeEach
 *   - zustand/vanilla pattern: store.getState() to read, store.getState().action() to call
 *   - No state leaks between tests (each test gets its own store instance)
 *
 * Coverage:
 *   - 14 unit tests for all store actions
 *   - 7 integration tests verifying store actions -> engine result pipeline
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createBillStore } from './billStore';
import type { BillState } from './billStore';
import type { StoreApi } from 'zustand/vanilla';
import { cents } from '../engine/types';
import { savedSplitId } from './historyStore';
import type { BillConfig } from '../engine/types';
import { personId, itemId } from '../engine/types';

// Helper types
type Store = StoreApi<BillState>;

// ---------------------------------------------------------------------------
// Unit Tests: Store Actions
// ---------------------------------------------------------------------------

describe('Store Actions', () => {
  let store: Store;

  beforeEach(() => {
    store = createBillStore();
  });

  // --- addPerson ---

  it('1. addPerson — adds a person with name and generated id', () => {
    store.getState().addPerson('Alice');
    const { people } = store.getState().config;
    expect(people).toHaveLength(1);
    expect(people[0].name).toBe('Alice');
    expect(typeof people[0].id).toBe('string');
    expect(people[0].id.length).toBeGreaterThan(0);
  });

  it('2. addPerson twice — two people in the list', () => {
    store.getState().addPerson('Alice');
    store.getState().addPerson('Bob');
    const { people } = store.getState().config;
    expect(people).toHaveLength(2);
    expect(people[0].name).toBe('Alice');
    expect(people[1].name).toBe('Bob');
    // IDs are unique
    expect(people[0].id).not.toBe(people[1].id);
  });

  // --- removePerson ---

  it('3. removePerson — person removed from people list', () => {
    store.getState().addPerson('Alice');
    store.getState().addPerson('Bob');
    const { people } = store.getState().config;
    const aliceId = people[0].id;

    store.getState().removePerson(aliceId);
    const updatedPeople = store.getState().config.people;
    expect(updatedPeople).toHaveLength(1);
    expect(updatedPeople[0].name).toBe('Bob');
  });

  it('4. removePerson — person removed from all item assignments', () => {
    store.getState().addPerson('Alice');
    store.getState().addPerson('Bob');
    const { people } = store.getState().config;
    const aliceId = people[0].id;
    const bobId = people[1].id;

    store.getState().addItem('Pizza', 1000);
    store.getState().addItem('Salad', 500);
    const { items } = store.getState().config;
    const pizzaId = items[0].id;
    const saladId = items[1].id;

    // Assign both items to both people
    store.getState().assignItem(pizzaId, [aliceId, bobId]);
    store.getState().assignItem(saladId, [aliceId, bobId]);

    // Remove Alice
    store.getState().removePerson(aliceId);

    const { assignments } = store.getState().config;
    expect(assignments[pizzaId]).not.toContain(aliceId);
    expect(assignments[saladId]).not.toContain(aliceId);
    expect(assignments[pizzaId]).toContain(bobId);
    expect(assignments[saladId]).toContain(bobId);
  });

  it('5. removePerson sole owner — item assignment becomes empty array (unassigned)', () => {
    store.getState().addPerson('Alice');
    const { people } = store.getState().config;
    const aliceId = people[0].id;

    store.getState().addItem('Solo Dish', 800);
    const { items } = store.getState().config;
    const dishId = items[0].id;

    store.getState().assignItem(dishId, [aliceId]);

    // Remove Alice — sole owner, item becomes unassigned
    store.getState().removePerson(aliceId);

    const { assignments } = store.getState().config;
    expect(assignments[dishId]).toEqual([]);
    // Item itself is NOT deleted
    expect(store.getState().config.items).toHaveLength(1);
  });

  it('6. removePerson shared owner — other sharers remain', () => {
    store.getState().addPerson('Alice');
    store.getState().addPerson('Bob');
    store.getState().addPerson('Carol');
    const { people } = store.getState().config;
    const aliceId = people[0].id;
    const bobId = people[1].id;
    const carolId = people[2].id;

    store.getState().addItem('Group Dish', 3000);
    const { items } = store.getState().config;
    const dishId = items[0].id;

    store.getState().assignItem(dishId, [aliceId, bobId, carolId]);

    // Remove Bob
    store.getState().removePerson(bobId);

    const { assignments } = store.getState().config;
    expect(assignments[dishId]).toContain(aliceId);
    expect(assignments[dishId]).toContain(carolId);
    expect(assignments[dishId]).not.toContain(bobId);
    expect(assignments[dishId]).toHaveLength(2);
  });

  // --- updatePerson ---

  it('7. updatePerson — name updated', () => {
    store.getState().addPerson('Alice');
    const { people } = store.getState().config;
    const aliceId = people[0].id;

    store.getState().updatePerson(aliceId, { name: 'Alicia' });

    const updated = store.getState().config.people.find((p) => p.id === aliceId);
    expect(updated?.name).toBe('Alicia');
  });

  // --- addItem ---

  it('8. addItem — item added with correct fields, assignment initialized to []', () => {
    store.getState().addItem('Burger', 1200, 2);
    const { items, assignments } = store.getState().config;

    expect(items).toHaveLength(1);
    expect(items[0].label).toBe('Burger');
    expect(items[0].priceCents).toBe(1200);
    expect(items[0].quantity).toBe(2);
    expect(assignments[items[0].id]).toEqual([]);
  });

  // --- removeItem ---

  it('9. removeItem — item removed from items list and assignments', () => {
    store.getState().addItem('Pasta', 900);
    const { items } = store.getState().config;
    const pastaId = items[0].id;

    store.getState().removeItem(pastaId);

    expect(store.getState().config.items).toHaveLength(0);
    expect(store.getState().config.assignments[pastaId]).toBeUndefined();
  });

  // --- updateItem ---

  it('10. updateItem — label and price updated', () => {
    store.getState().addItem('Old Label', 500);
    const { items } = store.getState().config;
    const itemId = items[0].id;

    store.getState().updateItem(itemId, { label: 'New Label', priceCents: cents(750) });

    const updated = store.getState().config.items.find((i) => i.id === itemId);
    expect(updated?.label).toBe('New Label');
    expect(updated?.priceCents).toBe(750);
  });

  // --- assignItem ---

  it('11. assignItem — sets assignment for item', () => {
    store.getState().addPerson('Alice');
    store.getState().addPerson('Bob');
    const { people } = store.getState().config;
    const aliceId = people[0].id;
    const bobId = people[1].id;

    store.getState().addItem('Shared Dish', 2000);
    const { items } = store.getState().config;
    const itemId = items[0].id;

    store.getState().assignItem(itemId, [aliceId, bobId]);

    expect(store.getState().config.assignments[itemId]).toEqual([aliceId, bobId]);
  });

  // --- setTip ---

  it('12. setTip — updates tip config (amount, method, includeZeroFoodPeople)', () => {
    store.getState().setTip(300, 'proportional', true);
    const { tip } = store.getState().config;

    expect(tip.amountCents).toBe(300);
    expect(tip.method).toBe('proportional');
    expect(tip.includeZeroFoodPeople).toBe(true);
  });

  // --- setTax ---

  it('13. setTax — updates tax config', () => {
    store.getState().setTax(150, 'equal', false);
    const { tax } = store.getState().config;

    expect(tax.amountCents).toBe(150);
    expect(tax.method).toBe('equal');
    expect(tax.includeZeroFoodPeople).toBe(false);
  });

  // --- reset ---

  it('14. reset — returns to initial empty state', () => {
    // Add some data
    store.getState().addPerson('Alice');
    store.getState().addItem('Pizza', 1000);
    store.getState().setTip(200, 'proportional', true);
    store.getState().setTax(100, 'proportional', false);

    // Reset
    store.getState().reset();

    const { config } = store.getState();
    expect(config.people).toHaveLength(0);
    expect(config.items).toHaveLength(0);
    expect(Object.keys(config.assignments)).toHaveLength(0);
    expect(config.tip.amountCents).toBe(0);
    expect(config.tip.method).toBe('equal');
    expect(config.tip.includeZeroFoodPeople).toBe(false);
    expect(config.tax.amountCents).toBe(0);
    expect(config.tax.method).toBe('equal');
    expect(config.tax.includeZeroFoodPeople).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Integration Tests: Store Actions -> Engine Result
// ---------------------------------------------------------------------------

describe('Store + Engine Integration', () => {
  let store: Store;

  beforeEach(() => {
    store = createBillStore();
  });

  it('15. Two people share item equally, tip and tax split equally', () => {
    // Setup: 2 people, 1 item $10, tip $3, tax $2 — all equal
    store.getState().addPerson('Alice');
    store.getState().addPerson('Bob');
    const { people } = store.getState().config;
    const aliceId = people[0].id;
    const bobId = people[1].id;

    store.getState().addItem('Pizza', 1000); // $10.00
    const { items } = store.getState().config;
    const itemId = items[0].id;

    store.getState().assignItem(itemId, [aliceId, bobId]);
    store.getState().setTip(300, 'equal', false); // $3.00
    store.getState().setTax(200, 'equal', false); // $2.00

    const result = store.getState().getResult();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const aliceResult = result.results.find((r) => r.personId === aliceId)!;
    const bobResult = result.results.find((r) => r.personId === bobId)!;

    // Food: $10 / 2 = $5 each
    expect(aliceResult.foodCents).toBe(500);
    expect(bobResult.foodCents).toBe(500);

    // Tip: $3 / 2 = $1.50 each -> largest-remainder: [150, 150]
    expect(aliceResult.tipCents).toBe(150);
    expect(bobResult.tipCents).toBe(150);

    // Tax: $2 / 2 = $1.00 each
    expect(aliceResult.taxCents).toBe(100);
    expect(bobResult.taxCents).toBe(100);
  });

  it('16. Three people, shared item + individual item, proportional tip', () => {
    // A + B share $10 item, C has $7 item, proportional tip $3
    store.getState().addPerson('Alice');
    store.getState().addPerson('Bob');
    store.getState().addPerson('Carol');
    const { people } = store.getState().config;
    const aliceId = people[0].id;
    const bobId = people[1].id;
    const carolId = people[2].id;

    store.getState().addItem('Shared Dish', 1000); // $10
    store.getState().addItem('Carol Solo', 700);   // $7
    const { items } = store.getState().config;
    const sharedId = items[0].id;
    const soloId = items[1].id;

    store.getState().assignItem(sharedId, [aliceId, bobId]);
    store.getState().assignItem(soloId, [carolId]);
    store.getState().setTip(300, 'proportional', false); // $3.00

    const result = store.getState().getResult();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const aliceResult = result.results.find((r) => r.personId === aliceId)!;
    const bobResult = result.results.find((r) => r.personId === bobId)!;
    const carolResult = result.results.find((r) => r.personId === carolId)!;

    // Food: Alice=500, Bob=500, Carol=700
    expect(aliceResult.foodCents).toBe(500);
    expect(bobResult.foodCents).toBe(500);
    expect(carolResult.foodCents).toBe(700);

    // Proportional tip $3 (300 cents) with weights [500, 500, 700], total=1700
    // Alice: 300 * 500/1700 ≈ 88.23..., Bob: same, Carol: 300 * 700/1700 ≈ 123.52...
    // Largest remainder: floors=[88, 88, 123]=299, need 1 more cent → Carol gets it (fraction 0.529 > 0.235)
    // Result: Alice=88, Bob=88, Carol=124 (sum=300)
    expect(aliceResult.tipCents + bobResult.tipCents + carolResult.tipCents).toBe(300);
    expect(aliceResult.tipCents).toBe(bobResult.tipCents); // symmetric A=B
    expect(carolResult.tipCents).toBeGreaterThan(aliceResult.tipCents); // C > A (more food)
  });

  it('17. Unassigned item blocks calculation', () => {
    store.getState().addPerson('Alice');
    store.getState().addItem('Unassigned Pizza', 1000); // never assigned

    const result = store.getState().getResult();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('unassigned_items');
    expect(result.unassignedItemIds).toHaveLength(1);
  });

  it('18. Person with no food, includeZeroFoodPeople=false: zero tip', () => {
    store.getState().addPerson('Alice');
    store.getState().addPerson('Bob');
    const { people } = store.getState().config;
    const aliceId = people[0].id;
    const bobId = people[1].id;

    store.getState().addItem('Only Alice', 1000); // $10
    const { items } = store.getState().config;
    const itemId = items[0].id;

    store.getState().assignItem(itemId, [aliceId]); // Bob gets no food
    store.getState().setTip(200, 'equal', false); // includeZeroFoodPeople = false

    const result = store.getState().getResult();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const bobResult = result.results.find((r) => r.personId === bobId)!;
    expect(bobResult.foodCents).toBe(0);
    expect(bobResult.tipCents).toBe(0); // excluded because no food
  });

  it('19. Person with no food, includeZeroFoodPeople=true: gets tip share', () => {
    store.getState().addPerson('Alice');
    store.getState().addPerson('Bob');
    const { people } = store.getState().config;
    const aliceId = people[0].id;
    const bobId = people[1].id;

    store.getState().addItem('Only Alice', 1000); // $10
    const { items } = store.getState().config;
    const itemId = items[0].id;

    store.getState().assignItem(itemId, [aliceId]); // Bob gets no food
    store.getState().setTip(200, 'equal', true); // includeZeroFoodPeople = true

    const result = store.getState().getResult();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const aliceResult = result.results.find((r) => r.personId === aliceId)!;
    const bobResult = result.results.find((r) => r.personId === bobId)!;

    expect(bobResult.foodCents).toBe(0);
    expect(bobResult.tipCents).toBeGreaterThan(0); // included despite no food
    // $2 tip split equally: [100, 100]
    expect(aliceResult.tipCents).toBe(100);
    expect(bobResult.tipCents).toBe(100);
  });

  it('20. Remove person then getResult — redistribution works', () => {
    store.getState().addPerson('Alice');
    store.getState().addPerson('Bob');
    store.getState().addPerson('Carol');
    const { people } = store.getState().config;
    const aliceId = people[0].id;
    const bobId = people[1].id;

    store.getState().addItem('Group Dish', 1000); // $10
    const { items } = store.getState().config;
    const dishId = items[0].id;

    // Assign to Alice + Bob
    store.getState().assignItem(dishId, [aliceId, bobId]);

    // Remove Bob — Alice becomes sole owner
    store.getState().removePerson(bobId);

    // Verify assignment now has only Alice
    const { assignments } = store.getState().config;
    expect(assignments[dishId]).toEqual([aliceId]);

    // getResult should work (item is still assigned to Alice)
    const result = store.getState().getResult();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const aliceResult = result.results.find((r) => r.personId === aliceId)!;
    expect(aliceResult.foodCents).toBe(1000); // Alice pays full $10
  });

  it('21. No derived data stored — only config field exists in state', () => {
    // Setup a full bill and call getResult
    store.getState().addPerson('Alice');
    store.getState().addPerson('Bob');
    const { people } = store.getState().config;
    const aliceId = people[0].id;
    const bobId = people[1].id;

    store.getState().addItem('Pizza', 1000);
    const { items } = store.getState().config;
    store.getState().assignItem(items[0].id, [aliceId, bobId]);

    // Call getResult — result should NOT be stored in state
    const result = store.getState().getResult();
    expect(result.ok).toBe(true);

    // Inspect state — must have only config + action functions, no `result` or `personResults`
    const state = store.getState();
    expect('result' in state).toBe(false);
    expect('personResults' in state).toBe(false);
    // config is the only data field
    expect('config' in state).toBe(true);
    expect(state.config).toBeDefined();
    expect(state.config).toHaveProperty('people');
    expect(state.config).toHaveProperty('items');
    expect(state.config).toHaveProperty('assignments');
    expect(state.config).toHaveProperty('tip');
    expect(state.config).toHaveProperty('tax');
  });
});

// ---------------------------------------------------------------------------
// New Actions Tests: loadConfig, setCurrentSplitId, reset with currentSplitId
// ---------------------------------------------------------------------------

describe('New Store Actions (06-02)', () => {
  let store: Store;

  beforeEach(() => {
    store = createBillStore();
  });

  it('22. loadConfig replaces entire config', () => {
    // Start with some data in the store
    store.getState().addPerson('Alice');
    store.getState().addItem('Pizza', 1000);
    const { people: originalPeople } = store.getState().config;
    const aliceId = originalPeople[0].id;
    const { items } = store.getState().config;
    store.getState().assignItem(items[0].id, [aliceId]);

    expect(store.getState().config.people).toHaveLength(1);

    // Create a completely different config to load
    const pid = personId('loaded-person-id');
    const iid = itemId('loaded-item-id');
    const loadedConfig: BillConfig = {
      people: [{ id: pid, name: 'Loaded Person' }],
      items: [{ id: iid, label: 'Loaded Item', priceCents: cents(2000), quantity: 2 }],
      assignments: { [iid]: [pid] },
      tip: { amountCents: cents(100), method: 'proportional', includeZeroFoodPeople: true },
      tax: { amountCents: cents(50), method: 'equal', includeZeroFoodPeople: false },
    };

    store.getState().loadConfig(loadedConfig);

    const { config } = store.getState();
    expect(config.people).toHaveLength(1);
    expect(config.people[0].name).toBe('Loaded Person');
    expect(config.items).toHaveLength(1);
    expect(config.items[0].label).toBe('Loaded Item');
    expect(config.items[0].priceCents).toBe(2000);
    expect(config.items[0].quantity).toBe(2);
    expect(config.tip.amountCents).toBe(100);
    expect(config.tip.method).toBe('proportional');
    expect(config.tip.includeZeroFoodPeople).toBe(true);
    expect(config.tax.amountCents).toBe(50);
  });

  it('23. setCurrentSplitId sets and clears id', () => {
    // Initially null
    expect(store.getState().currentSplitId).toBeNull();

    // Set to a mock SavedSplitId
    const mockId = savedSplitId('mock-split-id-123');
    store.getState().setCurrentSplitId(mockId);

    expect(store.getState().currentSplitId).toBe('mock-split-id-123');

    // Clear it back to null
    store.getState().setCurrentSplitId(null);

    expect(store.getState().currentSplitId).toBeNull();
  });

  it('24. reset() clears currentSplitId and config', () => {
    // Set up some state
    store.getState().addPerson('Alice');
    store.getState().addItem('Pizza', 1000);
    const mockId = savedSplitId('split-to-clear');
    store.getState().setCurrentSplitId(mockId);

    expect(store.getState().currentSplitId).toBe('split-to-clear');
    expect(store.getState().config.people).toHaveLength(1);

    // Reset
    store.getState().reset();

    expect(store.getState().currentSplitId).toBeNull();
    expect(store.getState().config.people).toHaveLength(0);
    expect(store.getState().config.items).toHaveLength(0);
    expect(Object.keys(store.getState().config.assignments)).toHaveLength(0);
    expect(store.getState().config.tip.amountCents).toBe(0);
    expect(store.getState().config.tax.amountCents).toBe(0);
  });
});
