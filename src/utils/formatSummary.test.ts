/**
 * src/utils/formatSummary.test.ts
 *
 * Unit tests for formatSummary and formatPersonSummary.
 * Pure function tests — no jsdom needed.
 */

import { describe, it, expect } from 'vitest';
import { formatSummary, formatPersonSummary } from './formatSummary';
import { cents, personId } from '../engine/types';
import type { EngineSuccess, PersonResult } from '../engine/types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makePerson(id: string, name: string) {
  return { id: personId(id), name };
}

function makePersonResult(id: string, overrides: Partial<PersonResult> = {}): PersonResult {
  return {
    personId: personId(id),
    foodCents: 1500,
    tipCents: 270,
    taxCents: 180,
    exactTotalCents: 1950,
    roundedTotalCents: cents(1950),
    surplusCents: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// formatSummary tests
// ---------------------------------------------------------------------------

describe('formatSummary', () => {
  it('produces labeled breakdown format with two people', () => {
    const alice = makePerson('alice-id', 'Alice');
    const bob = makePerson('bob-id', 'Bob');

    const aliceResult = makePersonResult('alice-id', {
      roundedTotalCents: cents(2350),
    });
    const bobResult = makePersonResult('bob-id', {
      roundedTotalCents: cents(1800),
    });

    const result: EngineSuccess = {
      ok: true,
      results: [aliceResult, bobResult],
      totalSurplusCents: 0,
    };

    const output = formatSummary(result, [alice, bob]);

    expect(output).toBe(
      'Bill Split:\n- Alice owes $23.50\n- Bob owes $18.00\nTotal: $41.50 (includes tip + tax)'
    );
  });

  it('handles a single person', () => {
    const alice = makePerson('alice-id', 'Alice');
    const aliceResult = makePersonResult('alice-id', {
      roundedTotalCents: cents(3000),
    });

    const result: EngineSuccess = {
      ok: true,
      results: [aliceResult],
      totalSurplusCents: 0,
    };

    const output = formatSummary(result, [alice]);

    expect(output).toBe(
      'Bill Split:\n- Alice owes $30.00\nTotal: $30.00 (includes tip + tax)'
    );
  });

  it('uses roundedTotalCents (not exactTotalCents) for amounts', () => {
    const alice = makePerson('alice-id', 'Alice');

    // exactTotalCents differs from roundedTotalCents by 1 cent
    const aliceResult = makePersonResult('alice-id', {
      exactTotalCents: 1999,
      roundedTotalCents: cents(2000),
      surplusCents: 1,
    });

    const result: EngineSuccess = {
      ok: true,
      results: [aliceResult],
      totalSurplusCents: 1,
    };

    const output = formatSummary(result, [alice]);

    // Should show rounded value ($20.00), not exact ($19.99)
    expect(output).toContain('$20.00');
    expect(output).not.toContain('$19.99');
  });

  it('falls back to "Unknown" when person id is not found', () => {
    const result: EngineSuccess = {
      ok: true,
      results: [makePersonResult('unknown-id', { roundedTotalCents: cents(1000) })],
      totalSurplusCents: 0,
    };

    const output = formatSummary(result, []); // empty people array

    expect(output).toContain('- Unknown owes $10.00');
  });
});

// ---------------------------------------------------------------------------
// formatPersonSummary tests
// ---------------------------------------------------------------------------

describe('formatPersonSummary', () => {
  it('produces individual owes line', () => {
    const aliceResult = makePersonResult('alice-id', {
      roundedTotalCents: cents(2350),
    });

    const output = formatPersonSummary(aliceResult, 'Alice');

    expect(output).toBe('Alice owes $23.50');
  });

  it('formats cents correctly with two decimal places', () => {
    const result = makePersonResult('id', { roundedTotalCents: cents(500) });
    expect(formatPersonSummary(result, 'Bob')).toBe('Bob owes $5.00');
  });
});
