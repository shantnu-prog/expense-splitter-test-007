/**
 * src/engine/engine.test.ts
 *
 * Comprehensive Vitest test suite for the bill-splitting calculation engine.
 * Tests are written in RED (failing) first, then implementation makes them GREEN.
 *
 * Covers:
 *   - distributeIntegerCents helper (largest-remainder algorithm)
 *   - Shared item distribution (ASGN-02)
 *   - Tip split equal and proportional (TPTX-02)
 *   - Tax split equal and proportional (TPTX-04)
 *   - Rounding up to nearest cent (SUMM-02)
 *   - Unassigned items block calculation
 *   - Party size scaling 1-10
 *   - Edge cases
 */

import { describe, it, expect, test } from 'vitest';
import { computeSplit, distributeIntegerCents } from './engine';
import { cents, personId, itemId } from './types';
import type { BillConfig, Item, Person } from './types';

// ---------------------------------------------------------------------------
// Helpers for building test fixtures
// ---------------------------------------------------------------------------

function makePeople(names: string[]): Person[] {
  return names.map((name) => ({ id: personId(name.toLowerCase()), name }));
}

function makeItem(
  id: string,
  label: string,
  priceCents: number,
  quantity = 1
): Item {
  return { id: itemId(id), label, priceCents: cents(priceCents), quantity };
}

// ---------------------------------------------------------------------------
// 1. distributeIntegerCents — largest-remainder algorithm
// ---------------------------------------------------------------------------

describe('distributeIntegerCents', () => {
  it('10 cents / 3 people => [4, 3, 3], sum = 10', () => {
    const result = distributeIntegerCents(10, 3);
    expect(result).toHaveLength(3);
    expect(result.reduce((s, v) => s + v, 0)).toBe(10);
    expect(result).toEqual([4, 3, 3]);
  });

  it('100 cents / 3 people => [34, 33, 33], sum = 100', () => {
    const result = distributeIntegerCents(100, 3);
    expect(result.reduce((s, v) => s + v, 0)).toBe(100);
    expect(result).toEqual([34, 33, 33]);
  });

  it('7 cents / 2 people => [4, 3], sum = 7', () => {
    const result = distributeIntegerCents(7, 2);
    expect(result.reduce((s, v) => s + v, 0)).toBe(7);
    expect(result).toEqual([4, 3]);
  });

  it('0 cents / 3 people => [0, 0, 0]', () => {
    const result = distributeIntegerCents(0, 3);
    expect(result).toEqual([0, 0, 0]);
  });

  it('1 cent / 5 people => [1, 0, 0, 0, 0], sum = 1', () => {
    const result = distributeIntegerCents(1, 5);
    expect(result.reduce((s, v) => s + v, 0)).toBe(1);
    expect(result[0]).toBe(1);
    expect(result.slice(1).every((v) => v === 0)).toBe(true);
  });

  it('100 cents / 1 person => [100]', () => {
    const result = distributeIntegerCents(100, 1);
    expect(result).toEqual([100]);
  });

  it('count = 0 returns empty array', () => {
    const result = distributeIntegerCents(50, 0);
    expect(result).toEqual([]);
  });

  it('invariant: sum always equals input total (various cases)', () => {
    const cases: [number, number][] = [
      [999, 7],
      [1, 1],
      [0, 5],
      [1000, 3],
      [17, 4],
      [100, 10],
    ];
    for (const [total, count] of cases) {
      const result = distributeIntegerCents(total, count);
      const sum = result.reduce((s, v) => s + v, 0);
      expect(sum, `sum of distributeIntegerCents(${total}, ${count}) should be ${total}`).toBe(total);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Shared item distribution (ASGN-02)
// ---------------------------------------------------------------------------

describe('computeSplit — shared item distribution (ASGN-02)', () => {
  it('$10.00 item shared by A, B, C: A=334, B=333, C=333', () => {
    const people = makePeople(['A', 'B', 'C']);
    const item = makeItem('i1', 'Shared dish', 1000);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id, people[1].id, people[2].id] },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const aResult = result.results.find((r) => r.personId === people[0].id);
    const bResult = result.results.find((r) => r.personId === people[1].id);
    const cResult = result.results.find((r) => r.personId === people[2].id);

    expect(aResult?.foodCents).toBe(334);
    expect(bResult?.foodCents).toBe(333);
    expect(cResult?.foodCents).toBe(333);
  });

  it('$5.00 item assigned only to A: A gets 500', () => {
    const people = makePeople(['A', 'B']);
    const item = makeItem('i1', 'Solo dish', 500);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id] },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const aResult = result.results.find((r) => r.personId === people[0].id);
    const bResult = result.results.find((r) => r.personId === people[1].id);
    expect(aResult?.foodCents).toBe(500);
    expect(bResult?.foodCents).toBe(0);
  });

  it('Two items: $10 shared A+B, $7 individual to C: A=500, B=500, C=700', () => {
    const people = makePeople(['A', 'B', 'C']);
    const item1 = makeItem('i1', 'Shared', 1000);
    const item2 = makeItem('i2', 'C solo', 700);
    const config: BillConfig = {
      items: [item1, item2],
      people,
      assignments: {
        [item1.id]: [people[0].id, people[1].id],
        [item2.id]: [people[2].id],
      },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.results.map((r) => [r.personId, r]));
    expect(byId[people[0].id].foodCents).toBe(500);
    expect(byId[people[1].id].foodCents).toBe(500);
    expect(byId[people[2].id].foodCents).toBe(700);
  });

  it('Item with quantity 2, price $5.00 (=1000 cents) distributed among sharers', () => {
    const people = makePeople(['A', 'B']);
    const item = makeItem('i1', 'Qty item', 500, 2); // priceCents=500, qty=2, total=1000
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id, people[1].id] },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.results.map((r) => [r.personId, r]));
    expect(byId[people[0].id].foodCents).toBe(500);
    expect(byId[people[1].id].foodCents).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// 3. Tip split — equal (TPTX-02)
// ---------------------------------------------------------------------------

describe('computeSplit — tip equal split (TPTX-02)', () => {
  it('3 people, tip 300 cents equal: each gets 100', () => {
    const people = makePeople(['A', 'B', 'C']);
    const item = makeItem('i1', 'Food', 300);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id, people[1].id, people[2].id] },
      tip: { amountCents: cents(300), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    result.results.forEach((r) => expect(r.tipCents).toBe(100));
  });

  it('3 people, tip 100 cents equal: [34, 33, 33] via largest-remainder', () => {
    const people = makePeople(['A', 'B', 'C']);
    const item = makeItem('i1', 'Food', 300);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id, people[1].id, people[2].id] },
      tip: { amountCents: cents(100), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tips = result.results.map((r) => r.tipCents).sort((a, b) => b - a);
    expect(tips).toEqual([34, 33, 33]);
    expect(tips.reduce((s, v) => s + v, 0)).toBe(100);
  });

  it('Person with no food, includeZeroFoodPeople=true: included in equal tip split', () => {
    const people = makePeople(['A', 'B']);
    const item = makeItem('i1', 'Food', 200);
    // Only A has food; B has no food items assigned
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id] },
      tip: { amountCents: cents(200), method: 'equal', includeZeroFoodPeople: true },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.results.map((r) => [r.personId, r]));
    // Both included in equal split: 200 / 2 = 100 each
    expect(byId[people[0].id].tipCents).toBe(100);
    expect(byId[people[1].id].tipCents).toBe(100);
  });

  it('Person with no food, includeZeroFoodPeople=false: excluded from equal tip, gets 0', () => {
    const people = makePeople(['A', 'B']);
    const item = makeItem('i1', 'Food', 200);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id] },
      tip: { amountCents: cents(200), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.results.map((r) => [r.personId, r]));
    // Only A is eligible; B gets 0 tip
    expect(byId[people[0].id].tipCents).toBe(200);
    expect(byId[people[1].id].tipCents).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Tip split — proportional (TPTX-02)
// ---------------------------------------------------------------------------

describe('computeSplit — tip proportional split (TPTX-02)', () => {
  it('A has $20 food, B has $10 food, tip $9: A gets $6, B gets $3', () => {
    const people = makePeople(['A', 'B']);
    const itemA = makeItem('i1', 'A food', 2000);
    const itemB = makeItem('i2', 'B food', 1000);
    const config: BillConfig = {
      items: [itemA, itemB],
      people,
      assignments: {
        [itemA.id]: [people[0].id],
        [itemB.id]: [people[1].id],
      },
      tip: { amountCents: cents(900), method: 'proportional', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.results.map((r) => [r.personId, r]));
    expect(byId[people[0].id].tipCents).toBe(600); // 2/3 of 900
    expect(byId[people[1].id].tipCents).toBe(300); // 1/3 of 900
  });

  it('A has $10 food, B has $0 food (includeZeroFood=true): B gets 0 proportional tip', () => {
    const people = makePeople(['A', 'B']);
    const item = makeItem('i1', 'A food', 1000);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id] },
      // includeZeroFoodPeople=true but proportional — B's weight is 0, so 0 tip
      tip: { amountCents: cents(500), method: 'proportional', includeZeroFoodPeople: true },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.results.map((r) => [r.personId, r]));
    expect(byId[people[0].id].tipCents).toBe(500); // A gets all tip
    expect(byId[people[1].id].tipCents).toBe(0);   // B gets 0 (proportional weight = 0)
  });

  it('Proportional tip with 3 people uses largest-remainder for fair distribution', () => {
    const people = makePeople(['A', 'B', 'C']);
    // A: 100, B: 100, C: 100 — equal food, so proportional = equal split
    const items = people.map((p, i) =>
      makeItem(`i${i}`, `${p.name} food`, 1000)
    );
    const assignments = Object.fromEntries(
      items.map((item, i) => [item.id, [people[i].id]])
    );
    const config: BillConfig = {
      items,
      people,
      assignments,
      tip: { amountCents: cents(100), method: 'proportional', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tips = result.results.map((r) => r.tipCents);
    const total = tips.reduce((s, v) => s + v, 0);
    expect(total).toBe(100); // sum invariant
    // Each person should get close to 33.33...
    tips.forEach((t) => expect(t).toBeGreaterThanOrEqual(33));
    tips.forEach((t) => expect(t).toBeLessThanOrEqual(34));
  });
});

// ---------------------------------------------------------------------------
// 5. Tax split — equal and proportional (TPTX-04)
// ---------------------------------------------------------------------------

describe('computeSplit — tax split (TPTX-04)', () => {
  it('Tax equal split: 3 people, 300 cents each gets 100', () => {
    const people = makePeople(['A', 'B', 'C']);
    const item = makeItem('i1', 'Food', 300);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id, people[1].id, people[2].id] },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(300), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    result.results.forEach((r) => expect(r.taxCents).toBe(100));
  });

  it('Tax proportional: A has $20 food, B has $10 food, tax $900: A=600, B=300', () => {
    const people = makePeople(['A', 'B']);
    const itemA = makeItem('i1', 'A food', 2000);
    const itemB = makeItem('i2', 'B food', 1000);
    const config: BillConfig = {
      items: [itemA, itemB],
      people,
      assignments: {
        [itemA.id]: [people[0].id],
        [itemB.id]: [people[1].id],
      },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(900), method: 'proportional', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.results.map((r) => [r.personId, r]));
    expect(byId[people[0].id].taxCents).toBe(600);
    expect(byId[people[1].id].taxCents).toBe(300);
  });

  it('Mixed methods: tax equal, tip proportional in same config', () => {
    const people = makePeople(['A', 'B']);
    const itemA = makeItem('i1', 'A food', 2000);
    const itemB = makeItem('i2', 'B food', 1000);
    const config: BillConfig = {
      items: [itemA, itemB],
      people,
      assignments: {
        [itemA.id]: [people[0].id],
        [itemB.id]: [people[1].id],
      },
      tip: { amountCents: cents(900), method: 'proportional', includeZeroFoodPeople: false },
      tax: { amountCents: cents(600), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.results.map((r) => [r.personId, r]));
    // Tip proportional: A=600, B=300
    expect(byId[people[0].id].tipCents).toBe(600);
    expect(byId[people[1].id].tipCents).toBe(300);
    // Tax equal: A=300, B=300
    expect(byId[people[0].id].taxCents).toBe(300);
    expect(byId[people[1].id].taxCents).toBe(300);
  });

  it('Tax equal with includeZeroFoodPeople=false: zero-food person excluded from tax', () => {
    const people = makePeople(['A', 'B']);
    const item = makeItem('i1', 'Food', 500);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id] },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(200), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.results.map((r) => [r.personId, r]));
    expect(byId[people[0].id].taxCents).toBe(200);
    expect(byId[people[1].id].taxCents).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Rounding up to nearest cent (SUMM-02)
// ---------------------------------------------------------------------------

describe('computeSplit — rounding (SUMM-02)', () => {
  it('roundedTotalCents >= exactTotalCents for each person', () => {
    const people = makePeople(['A', 'B', 'C']);
    const item = makeItem('i1', 'Food', 1000);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id, people[1].id, people[2].id] },
      tip: { amountCents: cents(100), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(50), method: 'proportional', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    result.results.forEach((r) => {
      expect(r.roundedTotalCents).toBeGreaterThanOrEqual(r.exactTotalCents);
    });
  });

  it('surplusCents = roundedTotalCents - exactTotalCents per person', () => {
    const people = makePeople(['A', 'B']);
    const item = makeItem('i1', 'Food', 1000);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id, people[1].id] },
      tip: { amountCents: cents(300), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    result.results.forEach((r) => {
      expect(r.surplusCents).toBe(r.roundedTotalCents - r.exactTotalCents);
      expect(r.surplusCents).toBeGreaterThanOrEqual(0);
    });
  });

  it('totalSurplusCents = sum of all per-person surplusCents', () => {
    const people = makePeople(['A', 'B', 'C']);
    const item = makeItem('i1', 'Food', 1000);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id, people[1].id, people[2].id] },
      tip: { amountCents: cents(100), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sum = result.results.reduce((s, r) => s + r.surplusCents, 0);
    expect(result.totalSurplusCents).toBe(sum);
  });

  it('When all distributions use largest-remainder, exactTotalCents is integer, surplus is 0', () => {
    const people = makePeople(['A', 'B']);
    const item = makeItem('i1', 'Food', 1000);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id, people[1].id] },
      tip: { amountCents: cents(200), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    result.results.forEach((r) => {
      // All values are integers from largest-remainder, so no surplus
      expect(r.surplusCents).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 7. Unassigned items block calculation
// ---------------------------------------------------------------------------

describe('computeSplit — unassigned items error', () => {
  it('Item with no assignment returns error with ok=false', () => {
    const people = makePeople(['A', 'B']);
    const item = makeItem('i1', 'Unassigned', 500);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: {}, // no assignment for item
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('unassigned_items');
    expect(result.unassignedItemIds).toContain(item.id);
  });

  it('Item assigned to empty array returns error', () => {
    const people = makePeople(['A']);
    const item = makeItem('i1', 'Empty assign', 500);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [] }, // empty array = unassigned
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('unassigned_items');
    expect(result.unassignedItemIds).toContain(item.id);
  });

  it('Multiple items: only unassigned ones appear in error list', () => {
    const people = makePeople(['A', 'B']);
    const item1 = makeItem('i1', 'Assigned', 500);
    const item2 = makeItem('i2', 'Unassigned', 300);
    const config: BillConfig = {
      items: [item1, item2],
      people,
      assignments: {
        [item1.id]: [people[0].id], // assigned
        // item2 missing
      },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.unassignedItemIds).toHaveLength(1);
    expect(result.unassignedItemIds).toContain(item2.id);
    expect(result.unassignedItemIds).not.toContain(item1.id);
  });
});

// ---------------------------------------------------------------------------
// 8. Party size scaling 1-10 (ASGN-02)
// ---------------------------------------------------------------------------

describe('computeSplit — party size scaling 1-10', () => {
  test.each(
    Array.from({ length: 10 }, (_, i) => [i + 1])
  )('party size %i: food/tip/tax sums equal inputs', (partySize: number) => {
    const names = Array.from({ length: partySize }, (_, i) => `Person${i + 1}`);
    const people = makePeople(names);

    const itemCost = 1000;
    const item = makeItem('i1', 'Shared food', itemCost);
    const tipTotal = 300;
    const taxTotal = 150;

    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: people.map((p) => p.id) },
      tip: { amountCents: cents(tipTotal), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(taxTotal), method: 'equal', includeZeroFoodPeople: false },
    };

    const result = computeSplit(config);
    expect(result.ok, `party size ${partySize} should succeed`).toBe(true);
    if (!result.ok) return;

    const totalFood = result.results.reduce((s, r) => s + r.foodCents, 0);
    const totalTip = result.results.reduce((s, r) => s + r.tipCents, 0);
    const totalTax = result.results.reduce((s, r) => s + r.taxCents, 0);

    expect(totalFood, `food sum for ${partySize} people`).toBe(itemCost);
    expect(totalTip, `tip sum for ${partySize} people`).toBe(tipTotal);
    expect(totalTax, `tax sum for ${partySize} people`).toBe(taxTotal);
  });
});

// ---------------------------------------------------------------------------
// 9. Edge cases
// ---------------------------------------------------------------------------

describe('computeSplit — edge cases', () => {
  it('Zero tip and zero tax: each person total = food only', () => {
    const people = makePeople(['A', 'B']);
    const itemA = makeItem('i1', 'A food', 1000);
    const itemB = makeItem('i2', 'B food', 750);
    const config: BillConfig = {
      items: [itemA, itemB],
      people,
      assignments: {
        [itemA.id]: [people[0].id],
        [itemB.id]: [people[1].id],
      },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.results.map((r) => [r.personId, r]));
    expect(byId[people[0].id].roundedTotalCents).toBe(1000);
    expect(byId[people[1].id].roundedTotalCents).toBe(750);
    expect(byId[people[0].id].tipCents).toBe(0);
    expect(byId[people[0].id].taxCents).toBe(0);
  });

  it('All items shared by everyone: equivalent to even split', () => {
    const people = makePeople(['A', 'B', 'C', 'D']);
    const item = makeItem('i1', 'Shared everything', 1200);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: people.map((p) => p.id) },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const foods = result.results.map((r) => r.foodCents);
    const total = foods.reduce((s, v) => s + v, 0);
    expect(total).toBe(1200);
    // Each person should get 300 (evenly divisible)
    foods.forEach((f) => expect(f).toBe(300));
  });

  it('One person, one item: that person gets everything', () => {
    const people = makePeople(['Solo']);
    const item = makeItem('i1', 'Everything', 4200);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id] },
      tip: { amountCents: cents(500), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(300), method: 'proportional', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.results).toHaveLength(1);
    const person = result.results[0];
    expect(person.foodCents).toBe(4200);
    expect(person.tipCents).toBe(500);
    expect(person.taxCents).toBe(300);
    expect(person.roundedTotalCents).toBe(5000);
  });

  it('No items (empty bill): all persons get zero', () => {
    const people = makePeople(['A', 'B']);
    const config: BillConfig = {
      items: [],
      people,
      assignments: {},
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    result.results.forEach((r) => {
      expect(r.foodCents).toBe(0);
      expect(r.tipCents).toBe(0);
      expect(r.taxCents).toBe(0);
      expect(r.roundedTotalCents).toBe(0);
    });
  });

  it('Person not in any assignment: still appears in results with 0 food', () => {
    const people = makePeople(['A', 'B', 'C']);
    const item = makeItem('i1', 'Food for A only', 500);
    const config: BillConfig = {
      items: [item],
      people,
      assignments: { [item.id]: [people[0].id] },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };
    const result = computeSplit(config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.results).toHaveLength(3);
    const byId = Object.fromEntries(result.results.map((r) => [r.personId, r]));
    expect(byId[people[1].id].foodCents).toBe(0);
    expect(byId[people[2].id].foodCents).toBe(0);
  });
});
