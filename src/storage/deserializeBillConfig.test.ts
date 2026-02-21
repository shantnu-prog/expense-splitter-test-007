/**
 * src/storage/deserializeBillConfig.test.ts
 *
 * Pure function round-trip tests for deserializeBillConfig.
 * Runs in the existing 'node' environment — no jsdom needed.
 *
 * These tests prove:
 * 1. Branded types survive JSON serialization/deserialization
 * 2. computeSplit produces identical results on deserialized config
 * 3. Edge cases (empty bill, quantity, multi-assignment) are handled correctly
 */
import { describe, it, expect } from 'vitest';
import { deserializeBillConfig } from './deserializeBillConfig';
import { computeSplit } from '../engine/engine';
import { cents, personId, itemId } from '../engine/types';
import type { BillConfig } from '../engine/types';

describe('deserializeBillConfig', () => {
  it('round-trip produces identical computeSplit result', () => {
    const original: BillConfig = {
      people: [
        { id: personId('p1'), name: 'Alice' },
        { id: personId('p2'), name: 'Bob' },
      ],
      items: [
        { id: itemId('i1'), label: 'Burger', priceCents: cents(1250), quantity: 1 },
        { id: itemId('i2'), label: 'Salad', priceCents: cents(900), quantity: 1 },
      ],
      assignments: {
        [itemId('i1')]: [personId('p1'), personId('p2')],
        [itemId('i2')]: [personId('p2')],
      },
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

  it('handles empty bill', () => {
    const original: BillConfig = {
      people: [],
      items: [],
      assignments: {},
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'proportional', includeZeroFoodPeople: false },
    };

    const serialized = JSON.stringify(original);
    const parsed = JSON.parse(serialized);
    const deserialized = deserializeBillConfig(parsed);

    const result = computeSplit(deserialized);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.results).toEqual([]);
    }
  });

  it('preserves quantity field', () => {
    const original: BillConfig = {
      people: [{ id: personId('p1'), name: 'Alice' }],
      items: [
        { id: itemId('i1'), label: 'Coffee', priceCents: cents(450), quantity: 3 },
      ],
      assignments: {
        [itemId('i1')]: [personId('p1')],
      },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };

    const serialized = JSON.stringify(original);
    const parsed = JSON.parse(serialized);
    const deserialized = deserializeBillConfig(parsed);

    expect(deserialized.items[0].quantity).toBe(3);
  });

  it('preserves assignment mapping with correct branded types', () => {
    const p1 = personId('p1');
    const p2 = personId('p2');
    const p3 = personId('p3');
    const i1 = itemId('i1');
    const i2 = itemId('i2');

    const original: BillConfig = {
      people: [
        { id: p1, name: 'Alice' },
        { id: p2, name: 'Bob' },
        { id: p3, name: 'Carol' },
      ],
      items: [
        { id: i1, label: 'Pizza', priceCents: cents(2000), quantity: 1 },
        { id: i2, label: 'Wine', priceCents: cents(1500), quantity: 1 },
      ],
      assignments: {
        [i1]: [p1, p2],
        [i2]: [p2, p3],
      },
      tip: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
      tax: { amountCents: cents(0), method: 'equal', includeZeroFoodPeople: false },
    };

    const serialized = JSON.stringify(original);
    const parsed = JSON.parse(serialized);
    const deserialized = deserializeBillConfig(parsed);

    // Keys should be ItemId-branded strings
    expect(Object.keys(deserialized.assignments)).toContain('i1');
    expect(Object.keys(deserialized.assignments)).toContain('i2');

    // Values should contain correct PersonId arrays
    expect(deserialized.assignments[i1]).toEqual([p1, p2]);
    expect(deserialized.assignments[i2]).toEqual([p2, p3]);
  });
});
