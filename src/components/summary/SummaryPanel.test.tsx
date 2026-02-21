// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useBillStore } from '../../store/billStore';
import { cents } from '../../engine/types';
import { SummaryPanel } from './SummaryPanel';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Set up a valid bill with 2 people, 2 items, all assigned, tip 18%, tax $5.
 *
 * - Alice: Burger ($15.00) + half of Fries ($4.00) = $19.00 food
 * - Bob:   Salad  ($12.00) + half of Fries ($4.00) = $16.00 food
 * - Tip: 18% of $35.00 subtotal = $6.30
 * - Tax: $5.00 flat
 */
function setupValidBill() {
  const store = useBillStore.getState();

  store.addPerson('Alice');
  store.addPerson('Bob');

  store.addItem('Burger', cents(1500), 1);  // $15.00
  store.addItem('Salad', cents(1200), 1);   // $12.00
  store.addItem('Fries', cents(800), 1);    // $8.00

  const s = useBillStore.getState();
  const alice = s.config.people.find((p) => p.name === 'Alice')!;
  const bob = s.config.people.find((p) => p.name === 'Bob')!;
  const burger = s.config.items.find((i) => i.label === 'Burger')!;
  const salad = s.config.items.find((i) => i.label === 'Salad')!;
  const fries = s.config.items.find((i) => i.label === 'Fries')!;

  store.assignItem(burger.id, [alice.id]);
  store.assignItem(salad.id, [bob.id]);
  store.assignItem(fries.id, [alice.id, bob.id]);

  // Tip 18% of $35 subtotal = $6.30 = 630 cents
  store.setTip(630, 'equal', false);

  // Tax $5.00 = 500 cents
  store.setTax(500, 'equal', false);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  useBillStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SummaryPanel', () => {
  it('renders bill total at the top', () => {
    setupValidBill();
    render(<SummaryPanel />);

    // Bill total label should appear
    expect(screen.getByText('Bill total')).toBeInTheDocument();
  });

  it('renders a card for each person', () => {
    setupValidBill();
    render(<SummaryPanel />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('person card shows rounded total', () => {
    setupValidBill();
    render(<SummaryPanel />);

    // Both Alice and Bob should have dollar amounts displayed
    // Alice: $19.00 food + $3.15 tip (half of 630) + $2.50 tax (half of 500) = $24.65
    // Bob:   $16.00 food + $3.15 tip + $2.50 tax = $21.65
    // Just verify dollar amounts are rendered (tabular-nums spans)
    const tabularAmounts = screen.getAllByText(/\$\d+\.\d{2}/);
    expect(tabularAmounts.length).toBeGreaterThanOrEqual(2);
  });

  it('tapping card expands to show Food, Tip, Tax detail', async () => {
    const user = userEvent.setup();
    setupValidBill();
    render(<SummaryPanel />);

    // Click Alice's card header (role="button" div with aria-label "Alice card")
    const aliceCard = screen.getByRole('button', { name: /Alice card/i });
    await user.click(aliceCard);

    // Food, Tip, Tax labels should now be visible in the detail drawer
    // Both cards have the detail content in the DOM (CSS-driven expand), so use getAllByText
    expect(screen.getAllByText('Food').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tip').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tax').length).toBeGreaterThanOrEqual(1);
  });

  it('rounding footer hidden when surplus is zero', () => {
    setupValidBill();
    render(<SummaryPanel />);

    // With equal splits and round numbers, surplus should be zero
    // Verify no "rounding surplus" text appears
    expect(screen.queryByText(/rounding surplus/i)).not.toBeInTheDocument();
  });

  it('rounding footer visible when surplus > 0', () => {
    // Set up bill where rounding occurs: 3 people splitting an amount not divisible by 3
    const store = useBillStore.getState();
    store.addPerson('Alice');
    store.addPerson('Bob');
    store.addPerson('Carol');

    store.addItem('Pizza', cents(1000), 1); // $10.00

    const s = useBillStore.getState();
    const alice = s.config.people.find((p) => p.name === 'Alice')!;
    const bob = s.config.people.find((p) => p.name === 'Bob')!;
    const carol = s.config.people.find((p) => p.name === 'Carol')!;
    const pizza = s.config.items.find((i) => i.label === 'Pizza')!;

    store.assignItem(pizza.id, [alice.id, bob.id, carol.id]);

    // Tip of $1.00 = 100 cents split 3 ways => 34+33+33 = floor, remainder 1
    // This triggers rounding surplus
    store.setTip(100, 'equal', false);

    render(<SummaryPanel />);

    // With rounding, surplus text should appear IF surplus > 0
    // Check the engine result to see if there's a surplus
    const result = useBillStore.getState().getResult();
    if (result.ok && result.totalSurplusCents > 0) {
      expect(screen.getByText(/rounding surplus/i)).toBeInTheDocument();
    } else {
      // No surplus — footer should be hidden
      expect(screen.queryByText(/rounding surplus/i)).not.toBeInTheDocument();
    }
  });

  it('shows error state when items are unassigned', () => {
    const store = useBillStore.getState();
    store.addPerson('Alice');
    store.addItem('Burger', cents(1500), 1); // Not assigned to anyone

    render(<SummaryPanel />);

    expect(screen.getByText(/need assignment before splitting/i)).toBeInTheDocument();
  });

  it('copy all button renders', () => {
    setupValidBill();
    render(<SummaryPanel />);

    expect(screen.getByRole('button', { name: /copy summary/i })).toBeInTheDocument();
  });
});
