/**
 * src/utils/formatSummary.ts
 *
 * Pure utility functions to build clipboard text from engine results.
 * Used by SummaryPanel's "Copy summary" button and individual person copy icons.
 */

import { centsToDollars } from './currency';
import { cents } from '../engine/types';
import type { EngineSuccess, Person, PersonResult } from '../engine/types';

/**
 * Build the full labeled breakdown format for "Copy summary":
 *   "Bill Split:\n- Alice owes $23.50\n- Bob owes $18.00\nTotal: $41.50 (includes tip + tax)"
 *
 * Maps each PersonResult to a person name via people.find().
 * Uses roundedTotalCents (not exactTotalCents) for displayed amounts.
 * Falls back to "Unknown" if person is not found.
 */
export function formatSummary(result: EngineSuccess, people: Person[]): string {
  const lines: string[] = ['Bill Split:'];

  for (const personResult of result.results) {
    const person = people.find((p) => p.id === personResult.personId);
    const name = person?.name ?? 'Unknown';
    const amount = centsToDollars(personResult.roundedTotalCents);
    lines.push(`- ${name} owes $${amount}`);
  }

  const totalCents = result.results.reduce(
    (sum, r) => sum + r.roundedTotalCents,
    0
  );
  const totalAmount = centsToDollars(cents(totalCents));
  lines.push(`Total: $${totalAmount} (includes tip + tax)`);

  return lines.join('\n');
}

/**
 * Build a single-person summary line for individual copy:
 *   "Alice owes $23.50"
 *
 * Uses roundedTotalCents for the displayed amount.
 */
export function formatPersonSummary(result: PersonResult, name: string): string {
  const amount = centsToDollars(result.roundedTotalCents);
  return `${name} owes $${amount}`;
}
