// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useBillStore } from '../../store/billStore';
import { cents } from '../../engine/types';
import { TipTaxPanel } from './TipTaxPanel';

beforeEach(() => {
  useBillStore.getState().reset();
  // Seed with 2 people and 1 assigned item for valid engine config
  useBillStore.getState().addPerson('Alice');
  useBillStore.getState().addPerson('Bob');
  useBillStore.getState().addItem('Pizza', cents(10000), 1); // $100.00 for easy math
  // Assign item to both people
  const state = useBillStore.getState();
  const pizzaItem = state.config.items.find((i) => i.label === 'Pizza')!;
  const alice = state.config.people.find((p) => p.name === 'Alice')!;
  const bob = state.config.people.find((p) => p.name === 'Bob')!;
  state.assignItem(pizzaItem.id, [alice.id, bob.id]);
});

describe('TipTaxPanel', () => {
  it('renders tip segmented control with 15%, 18%, 20%, Custom options', () => {
    render(<TipTaxPanel />);
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('18%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('selecting 18% preset calls setTip with correct cents', async () => {
    const user = userEvent.setup();
    render(<TipTaxPanel />);

    // Click the 18% label (which wraps the radio input)
    await user.click(screen.getByText('18%'));

    const state = useBillStore.getState();
    // $100 * 18% = $18 = 1800 cents
    expect(state.config.tip.amountCents).toBe(1800);
  });

  it('custom tip input computes correct cents on blur', async () => {
    const user = userEvent.setup();
    render(<TipTaxPanel />);

    // Click Custom preset
    await user.click(screen.getByText('Custom'));

    // Custom input should now be visible
    const customInput = screen.getByLabelText('Custom tip percentage');
    await user.clear(customInput);
    await user.type(customInput, '25');
    await user.tab(); // trigger blur

    const state = useBillStore.getState();
    // $100 subtotal * 25% = $25 = 2500 cents
    const expectedCents = Math.round(0.25 * 10000);
    expect(state.config.tip.amountCents).toBe(expectedCents);
  });

  it('tax dollar mode calls setTax with correct cents on blur', async () => {
    const user = userEvent.setup();
    render(<TipTaxPanel />);

    // Dollar mode is default — type in the tax input
    const taxInput = screen.getByLabelText('Tax amount in dollars');
    await user.clear(taxInput);
    await user.type(taxInput, '12.50');
    await user.tab(); // trigger blur

    const state = useBillStore.getState();
    // $12.50 = 1250 cents
    expect(state.config.tax.amountCents).toBe(1250);
  });

  it('switching tax to percent mode clears input', async () => {
    const user = userEvent.setup();
    render(<TipTaxPanel />);

    // Type a dollar value
    const taxInput = screen.getByLabelText('Tax amount in dollars');
    await user.type(taxInput, '12.50');

    // Switch to percent mode
    await user.click(screen.getByText('%'));

    // Input should be cleared
    const percentInput = screen.getByLabelText('Tax percentage');
    expect(percentInput).toHaveValue('');
  });

  it('tax percent mode computes correct cents on blur', async () => {
    const user = userEvent.setup();
    render(<TipTaxPanel />);

    // Switch to percent mode
    await user.click(screen.getByText('%'));

    // Type percentage
    const percentInput = screen.getByLabelText('Tax percentage');
    await user.clear(percentInput);
    await user.type(percentInput, '8.5');
    await user.tab(); // trigger blur

    const state = useBillStore.getState();
    // $100 subtotal * 8.5% = $8.50 = 850 cents
    const expectedCents = Math.round(0.085 * 10000);
    expect(state.config.tax.amountCents).toBe(expectedCents);
  });

  it('split method toggle changes tip method in store', async () => {
    const user = userEvent.setup();
    render(<TipTaxPanel />);

    // Get all "Proportional" buttons — first one should be for Tip
    const proportionalButtons = screen.getAllByText('Proportional');
    // Tip section comes before Tax section
    await user.click(proportionalButtons[0]);

    const state = useBillStore.getState();
    expect(state.config.tip.method).toBe('proportional');
  });

  it('split method toggle changes tax method independently', async () => {
    const user = userEvent.setup();
    render(<TipTaxPanel />);

    // Get all "Proportional" buttons — second one should be for Tax
    const proportionalButtons = screen.getAllByText('Proportional');
    await user.click(proportionalButtons[1]); // Tax proportional

    const state = useBillStore.getState();
    // Tip should still be equal (unchanged)
    expect(state.config.tip.method).toBe('equal');
    // Tax should be proportional
    expect(state.config.tax.method).toBe('proportional');
  });
});
