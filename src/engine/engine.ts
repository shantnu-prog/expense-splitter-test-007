/**
 * src/engine/engine.ts
 *
 * Pure calculation engine for the bill-splitting application.
 * All arithmetic operates on integer cents — no floating-point dollar values.
 *
 * Exports:
 *   - distributeIntegerCents(totalCents, count): number[]
 *   - computeSplit(config: BillConfig): EngineResult
 *
 * Internal helpers:
 *   - distributeItems(items, assignments, people): Record<PersonId, number>
 *   - distributeCharge(chargeCents, method, includeZeroFood, people, foodMap): Record<PersonId, number>
 */

import type {
  BillConfig,
  Assignments,
  EngineResult,
  Item,
  Person,
  PersonId,
  PersonResult,
  SplitMethod,
} from './types';
import { cents } from './types';

// ---------------------------------------------------------------------------
// distributeIntegerCents
//
// Splits `totalCents` into `count` integer buckets using the largest-remainder
// (Hamilton) method — the fairest discrete distribution that guarantees the
// sum of buckets equals the input total exactly.
//
// Examples:
//   10 / 3 => [4, 3, 3]  (not [3, 3, 4] — highest-remainder bucket is first)
//   100 / 3 => [34, 33, 33]
//   0 / 3 => [0, 0, 0]
//   50 / 0 => []
// ---------------------------------------------------------------------------

export function distributeIntegerCents(totalCents: number, count: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [totalCents];

  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;

  // Build array of { index, fraction } for largest-remainder distribution
  // Each element starts at base. The `remainder` elements with the largest
  // fractional part get one extra cent.
  //
  // For uniform distribution (equal weights), each element has fractional
  // part = (totalCents % count) / count. We simply award the first `remainder`
  // indices one extra cent (they all have equal fractional part, so ordering
  // is stable by index).
  const result = new Array<number>(count).fill(base);
  for (let i = 0; i < remainder; i++) {
    result[i]++;
  }
  return result;
}

// ---------------------------------------------------------------------------
// distributeProportionalCents (internal)
//
// Splits `totalCents` proportionally according to `weights` (integer or
// non-integer). Uses the largest-remainder method on the fractional parts.
// Returns an array of the same length as `weights`.
//
// If totalWeight === 0, returns all zeros.
// ---------------------------------------------------------------------------

function distributeProportionalCents(totalCents: number, weights: number[]): number[] {
  const count = weights.length;
  if (count === 0) return [];

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight === 0) return new Array<number>(count).fill(0);

  // Compute exact (floating-point) shares, decompose into floor + fraction
  const exactShares = weights.map((w) => (w / totalWeight) * totalCents);
  const floors = exactShares.map((s) => Math.floor(s));
  const fractions = exactShares.map((s, i) => s - floors[i]);

  const floorSum = floors.reduce((s, v) => s + v, 0);
  const remaining = Math.round(totalCents - floorSum); // should be an integer

  // Sort indices by fractional part descending to award extra cents
  const sortedIndices = fractions
    .map((f, i) => ({ i, f }))
    .sort((a, b) => b.f - a.f || a.i - b.i) // stable: tie-break by original index
    .map(({ i }) => i);

  const result = [...floors];
  for (let k = 0; k < remaining; k++) {
    result[sortedIndices[k]]++;
  }
  return result;
}

// ---------------------------------------------------------------------------
// distributeItems (internal)
//
// Computes each person's food subtotal by distributing each item's total cost
// (priceCents * quantity) among the people assigned to that item using
// distributeIntegerCents.
// ---------------------------------------------------------------------------

function distributeItems(
  items: Item[],
  assignments: Assignments,
  people: Person[]
): Record<PersonId, number> {
  // Initialize every person to 0
  const foodMap: Record<PersonId, number> = {} as Record<PersonId, number>;
  for (const person of people) {
    foodMap[person.id] = 0;
  }

  for (const item of items) {
    const totalCost = item.priceCents * item.quantity;
    const assignedIds = assignments[item.id] ?? [];
    if (assignedIds.length === 0) continue; // unassigned — will be caught by validation

    const shares = distributeIntegerCents(totalCost, assignedIds.length);
    for (let i = 0; i < assignedIds.length; i++) {
      const pid = assignedIds[i];
      if (pid in foodMap) {
        foodMap[pid] += shares[i];
      }
    }
  }

  return foodMap;
}

// ---------------------------------------------------------------------------
// distributeCharge (internal)
//
// Distributes a single charge (tip or tax) across people using the specified
// split method.
//
// For 'equal':
//   - Eligible = people with food > 0, OR ALL people if includeZeroFood = true
//   - Distribute equally via distributeIntegerCents among eligible people
//   - Non-eligible people get 0
//
// For 'proportional':
//   - Each person's weight = their food subtotal
//   - People with 0 food ALWAYS get 0 (proportional share of 0 weight is 0)
//   - includeZeroFood is ignored for proportional (no effect on weights)
//   - Distribute via distributeProportionalCents
// ---------------------------------------------------------------------------

function distributeCharge(
  chargeCents: number,
  method: SplitMethod,
  includeZeroFood: boolean,
  people: Person[],
  foodMap: Record<PersonId, number>
): Record<PersonId, number> {
  const chargeMap: Record<PersonId, number> = {} as Record<PersonId, number>;
  for (const person of people) {
    chargeMap[person.id] = 0;
  }

  if (chargeCents === 0) return chargeMap;

  if (method === 'equal') {
    // Determine eligible people
    const eligible = people.filter(
      (p) => includeZeroFood || (foodMap[p.id] ?? 0) > 0
    );
    if (eligible.length === 0) return chargeMap;

    const shares = distributeIntegerCents(chargeCents, eligible.length);
    for (let i = 0; i < eligible.length; i++) {
      chargeMap[eligible[i].id] = shares[i];
    }
  } else {
    // method === 'proportional'
    const weights = people.map((p) => foodMap[p.id] ?? 0);
    const shares = distributeProportionalCents(chargeCents, weights);
    for (let i = 0; i < people.length; i++) {
      chargeMap[people[i].id] = shares[i];
    }
  }

  return chargeMap;
}

// ---------------------------------------------------------------------------
// computeSplit
//
// Primary exported function. Takes a complete BillConfig and returns either:
//   - EngineSuccess: per-person breakdown with food/tip/tax/total/surplus
//   - EngineError: reason = 'unassigned_items' with list of unassigned item IDs
//
// Steps:
//   1. Validate: find any items with no or empty assignments
//   2. distributeItems => foodMap
//   3. distributeCharge(tip) => tipMap
//   4. distributeCharge(tax) => taxMap
//   5. Compute per-person totals: exactTotal, roundedTotal, surplus
//   6. Return success result
// ---------------------------------------------------------------------------

export function computeSplit(config: BillConfig): EngineResult {
  const { items, people, assignments, tip, tax } = config;

  // Step 1: Validate — find unassigned items
  const unassignedItemIds = items
    .filter((item) => {
      const assigned = assignments[item.id];
      return !assigned || assigned.length === 0;
    })
    .map((item) => item.id);

  if (unassignedItemIds.length > 0) {
    return {
      ok: false,
      reason: 'unassigned_items',
      unassignedItemIds,
    };
  }

  // Step 2: Distribute food items
  const foodMap = distributeItems(items, assignments, people);

  // Step 3: Distribute tip
  const tipMap = distributeCharge(
    tip.amountCents,
    tip.method,
    tip.includeZeroFoodPeople,
    people,
    foodMap
  );

  // Step 4: Distribute tax
  const taxMap = distributeCharge(
    tax.amountCents,
    tax.method,
    tax.includeZeroFoodPeople,
    people,
    foodMap
  );

  // Step 5: Compute per-person totals
  const results: PersonResult[] = people.map((person) => {
    const foodCents = foodMap[person.id] ?? 0;
    const tipCents = tipMap[person.id] ?? 0;
    const taxCents = taxMap[person.id] ?? 0;
    const exactTotalCents = foodCents + tipCents + taxCents;
    const roundedTotalCents = cents(Math.ceil(exactTotalCents));
    const surplusCents = roundedTotalCents - exactTotalCents;

    return {
      personId: person.id,
      foodCents,
      tipCents,
      taxCents,
      exactTotalCents,
      roundedTotalCents,
      surplusCents,
    };
  });

  const totalSurplusCents = results.reduce((s, r) => s + r.surplusCents, 0);

  return {
    ok: true,
    results,
    totalSurplusCents,
  };
}
