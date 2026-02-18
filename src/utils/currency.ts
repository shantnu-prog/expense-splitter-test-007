/**
 * src/utils/currency.ts
 *
 * Currency conversion utilities for the bill-splitting app.
 * Handles dollar-to-cents conversions with IEEE 754 safety and input filtering.
 */

import { cents, type Cents } from '../engine/types';

/**
 * Convert a dollar string to integer cents.
 *
 * Strips non-numeric characters except `.`, parses as float, multiplies by 100,
 * and rounds via the `cents()` constructor to handle IEEE 754 edge cases
 * (e.g., "12.10" → 12.10 * 100 = 1210.0000000000002 → rounds to 1210).
 *
 * Returns `null` for empty, non-finite, or negative input.
 */
export function dollarsToCents(input: string): Cents | null {
  // Check for negative sign before stripping characters
  const trimmed = input.trim();
  if (trimmed.startsWith('-')) return null;

  const cleaned = trimmed.replace(/[^0-9.]/g, '');
  if (cleaned === '') return null;

  const value = parseFloat(cleaned);
  if (!isFinite(value) || value < 0) return null;

  return cents(value * 100);
}

/**
 * Convert integer cents to a dollar string with 2 decimal places.
 *
 * Example: cents(1250) → "12.50"
 */
export function centsToDollars(value: Cents): string {
  return (value / 100).toFixed(2);
}

/**
 * Filter a string to be a valid price input.
 *
 * - Removes non-digit and non-dot characters
 * - Allows only one decimal point
 * - Limits to 2 decimal places
 *
 * Example: "12.505" → "12.50", "12..50" → "12.50", "12.50abc" → "12.50"
 */
export function filterPriceInput(value: string): string {
  // Remove all chars except digits and dots
  let filtered = value.replace(/[^0-9.]/g, '');

  // Allow only one decimal point — keep first, remove subsequent ones
  const firstDot = filtered.indexOf('.');
  if (firstDot !== -1) {
    const beforeDot = filtered.slice(0, firstDot + 1);
    const afterDot = filtered.slice(firstDot + 1).replace(/\./g, '');
    filtered = beforeDot + afterDot;
  }

  // Limit to 2 decimal places
  const dotIndex = filtered.indexOf('.');
  if (dotIndex !== -1 && filtered.length - dotIndex - 1 > 2) {
    filtered = filtered.slice(0, dotIndex + 3);
  }

  return filtered;
}
