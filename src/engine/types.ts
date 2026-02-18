/**
 * src/engine/types.ts
 *
 * Complete TypeScript type definitions for the bill-splitting engine.
 * All monetary values are integer cents (Cents branded type).
 * This file is the data contract for the entire application.
 */

// ---------------------------------------------------------------------------
// Branded primitive types — prevent accidental mixing of raw numbers/strings
// ---------------------------------------------------------------------------

/** All monetary values in integer cents — never floating-point dollars. */
export type Cents = number & { readonly __brand: 'Cents' };

/** Unique identifier for a person. */
export type PersonId = string & { readonly __brand: 'PersonId' };

/** Unique identifier for an item. */
export type ItemId = string & { readonly __brand: 'ItemId' };

// ---------------------------------------------------------------------------
// Constructor helpers
// ---------------------------------------------------------------------------

/**
 * Construct a Cents value. Rounds to the nearest integer cent.
 * Use this at data-entry boundaries; internal engine math uses plain numbers.
 */
export function cents(n: number): Cents {
  return Math.round(n) as Cents;
}

/** Construct a PersonId from a string (e.g. crypto.randomUUID()). */
export function personId(s: string): PersonId {
  return s as PersonId;
}

/** Construct an ItemId from a string (e.g. crypto.randomUUID()). */
export function itemId(s: string): ItemId {
  return s as ItemId;
}

// ---------------------------------------------------------------------------
// Core data types
// ---------------------------------------------------------------------------

/**
 * A single line item on the bill.
 * Total cost = priceCents * quantity.
 */
export interface Item {
  id: ItemId;
  label: string;
  /** Unit price in integer cents. */
  priceCents: Cents;
  /** Number of this item ordered. Defaults to 1. */
  quantity: number;
}

/** A person participating in the bill split. */
export interface Person {
  id: PersonId;
  name: string;
}

/**
 * Which people share each item.
 * Key: ItemId → Value: array of PersonId who share that item.
 * Empty array or missing key means the item is unassigned (blocks calculation).
 */
export type Assignments = Record<ItemId, PersonId[]>;

/** Method used to split tip or tax across participants. */
export type SplitMethod = 'equal' | 'proportional';

/**
 * Configuration for a tip or tax charge.
 *
 * - amountCents: total tip/tax in integer cents
 * - method: how to divide among eligible people
 * - includeZeroFoodPeople: if true, people with zero food items still pay
 *   an equal share of this charge (per-split toggle, not global)
 */
export interface TipTaxConfig {
  amountCents: Cents;
  method: SplitMethod;
  /**
   * Per-split toggle: whether people who ordered nothing are still included
   * in this tip/tax split. Locked decision: this is per-split, not global.
   */
  includeZeroFoodPeople: boolean;
}

/**
 * The complete description of a bill to be split.
 */
export interface BillConfig {
  items: Item[];
  people: Person[];
  assignments: Assignments;
  tip: TipTaxConfig;
  tax: TipTaxConfig;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/**
 * Per-person calculation result.
 *
 * All component values (foodCents, tipCents, taxCents) are integer cents
 * produced by the largest-remainder distribution algorithm.
 *
 * exactTotalCents is their sum — always integer since all components are
 * integer after distribution.
 *
 * roundedTotalCents = Math.ceil(exactTotalCents). Since exactTotalCents is
 * already an integer, this equals exactTotalCents in the standard case.
 * It remains Cents-typed for forward-compatibility if the engine accumulates
 * fractional values before the final rounding step.
 *
 * surplusCents = roundedTotalCents - exactTotalCents (>= 0 always).
 */
export interface PersonResult {
  personId: PersonId;
  /** Food subtotal for this person in integer cents (post-distribution). */
  foodCents: number;
  /** Tip share for this person in integer cents. */
  tipCents: number;
  /** Tax share for this person in integer cents. */
  taxCents: number;
  /**
   * Pre-rounding sum: food + tip + tax.
   * May contain fractional cents if intermediate values include fractions.
   */
  exactTotalCents: number;
  /**
   * Math.ceil(exactTotalCents) — the amount this person actually pays.
   * Always >= exactTotalCents.
   */
  roundedTotalCents: Cents;
  /**
   * roundedTotalCents - exactTotalCents for this person.
   * Represents how much extra this person pays due to rounding.
   */
  surplusCents: number;
}

/**
 * Successful engine result.
 */
export interface EngineSuccess {
  ok: true;
  results: PersonResult[];
  /**
   * Sum of all per-person surplusCents.
   * Displayed as "extra collected due to rounding."
   */
  totalSurplusCents: number;
}

/**
 * Engine error: one or more items have no assigned people.
 * Calculation is blocked until all items are assigned.
 */
export interface EngineError {
  ok: false;
  reason: 'unassigned_items';
  unassignedItemIds: ItemId[];
}

/**
 * Discriminated union result from the calculation engine.
 *
 * Check `result.ok` to narrow:
 * - true  → EngineSuccess (results array + surplus)
 * - false → EngineError (reason + unassigned item IDs)
 */
export type EngineResult = EngineSuccess | EngineError;
