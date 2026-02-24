/**
 * src/storage/deserializeBillConfig.ts
 *
 * Single JSON parse boundary for BillConfig deserialization.
 *
 * TypeScript branded types (Cents, PersonId, ItemId) are compile-time fiction —
 * JSON.parse strips the brand at runtime. This function re-applies the branded
 * type constructor helpers after JSON.parse so all code above this boundary
 * receives properly typed values.
 *
 * This is the ONLY place localStorage results are consumed for BillConfig.
 * Do NOT add validation here — the engine's computeSplit handles invalid data.
 */
import { cents, personId, itemId } from '../engine/types';
import type { BillConfig, Assignments } from '../engine/types';

/**
 * Re-applies TypeScript branded type constructors after JSON.parse.
 *
 * Usage:
 *   const raw = JSON.parse(localStorage.getItem('...') ?? '{}');
 *   const config = deserializeBillConfig(raw);
 */
export function deserializeBillConfig(raw: unknown): BillConfig {
  const r = raw as {
    people: Array<{ id: string; name: string; mobile?: string; upiVpa?: string }>;
    items: Array<{ id: string; label: string; priceCents: number; quantity: number }>;
    assignments: Record<string, string[]>;
    tip: { amountCents: number; method: string; includeZeroFoodPeople: boolean };
    tax: { amountCents: number; method: string; includeZeroFoodPeople: boolean };
  };

  const assignments: Assignments = {};
  for (const [k, v] of Object.entries(r.assignments)) {
    assignments[itemId(k)] = v.map(personId);
  }

  return {
    people: r.people.map((p) => ({
      id: personId(p.id),
      name: p.name,
      ...(p.mobile !== undefined && { mobile: p.mobile }),
      ...(p.upiVpa !== undefined && { upiVpa: p.upiVpa }),
    })),
    items: r.items.map((i) => ({
      id: itemId(i.id),
      label: i.label,
      priceCents: cents(i.priceCents),
      quantity: i.quantity,
    })),
    assignments,
    tip: {
      amountCents: cents(r.tip.amountCents),
      method: r.tip.method as 'equal' | 'proportional',
      includeZeroFoodPeople: r.tip.includeZeroFoodPeople,
    },
    tax: {
      amountCents: cents(r.tax.amountCents),
      method: r.tax.method as 'equal' | 'proportional',
      includeZeroFoodPeople: r.tax.includeZeroFoodPeople,
    },
  };
}
