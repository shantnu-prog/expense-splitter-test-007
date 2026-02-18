/**
 * src/utils/currency.test.ts
 *
 * Unit tests for currency conversion utilities.
 * Runs in node environment (no jsdom needed).
 */

import { describe, it, expect } from 'vitest';
import { dollarsToCents, centsToDollars, filterPriceInput } from './currency';
import { cents } from '../engine/types';

describe('dollarsToCents', () => {
  it('converts "12.50" to 1250 cents', () => {
    expect(dollarsToCents('12.50')).toBe(1250);
  });

  it('converts "0.01" to 1 cent', () => {
    expect(dollarsToCents('0.01')).toBe(1);
  });

  it('converts "12.10" to 1210 cents (IEEE 754 edge case)', () => {
    // 12.10 * 100 = 1210.0000000000002 in floating point — must round correctly
    expect(dollarsToCents('12.10')).toBe(1210);
  });

  it('returns null for empty string', () => {
    expect(dollarsToCents('')).toBeNull();
  });

  it('returns null for non-numeric string "abc"', () => {
    expect(dollarsToCents('abc')).toBeNull();
  });

  it('returns null for negative value "-5.00"', () => {
    expect(dollarsToCents('-5.00')).toBeNull();
  });
});

describe('centsToDollars', () => {
  it('converts cents(1250) to "12.50"', () => {
    expect(centsToDollars(cents(1250))).toBe('12.50');
  });

  it('converts cents(0) to "0.00"', () => {
    expect(centsToDollars(cents(0))).toBe('0.00');
  });

  it('converts cents(7) to "0.07"', () => {
    expect(centsToDollars(cents(7))).toBe('0.07');
  });
});

describe('filterPriceInput', () => {
  it('removes non-numeric/non-dot characters "12.50abc" → "12.50"', () => {
    expect(filterPriceInput('12.50abc')).toBe('12.50');
  });

  it('removes extra decimal point "12..50" → "12.50"', () => {
    expect(filterPriceInput('12..50')).toBe('12.50');
  });

  it('truncates to 2 decimal places "12.505" → "12.50"', () => {
    expect(filterPriceInput('12.505')).toBe('12.50');
  });
});
