// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useBillStore } from '../../store/billStore';
import { cents } from '../../engine/types';
import { ItemsPanel } from './ItemsPanel';

beforeEach(() => {
  useBillStore.getState().reset();
});

describe('ItemsPanel', () => {
  it('adds an empty item row when + button is clicked', async () => {
    const user = userEvent.setup();
    render(<ItemsPanel />);

    await user.click(screen.getByText('+'));

    // A new row should appear with an empty name input and "0.00" price
    expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.00')).toBeInTheDocument();
  });

  it('updates item name on blur', async () => {
    useBillStore.getState().addItem('', cents(0), 1);

    const user = userEvent.setup();
    render(<ItemsPanel />);

    const nameInput = screen.getByPlaceholderText('Item name');
    await user.click(nameInput);
    await user.type(nameInput, 'Pizza');
    await user.tab(); // trigger blur

    const items = useBillStore.getState().config.items;
    expect(items[0].label).toBe('Pizza');
  });

  it('converts dollar price to cents on blur', async () => {
    useBillStore.getState().addItem('Pizza', cents(0), 1);

    const user = userEvent.setup();
    render(<ItemsPanel />);

    const priceInput = screen.getByDisplayValue('0.00');
    await user.clear(priceInput);
    await user.type(priceInput, '12.50');
    await user.tab(); // trigger blur

    const items = useBillStore.getState().config.items;
    expect(items[0].priceCents).toBe(1250);
  });

  it('reverts invalid price on blur', async () => {
    useBillStore.getState().addItem('Pizza', cents(500), 1);

    const user = userEvent.setup();
    render(<ItemsPanel />);

    const priceInput = screen.getByDisplayValue('5.00');
    await user.clear(priceInput);
    await user.type(priceInput, 'abc');
    await user.tab(); // trigger blur

    // Display reverts to "5.00" (original priceCents=500)
    expect(screen.getByDisplayValue('5.00')).toBeInTheDocument();
  });

  it('increases quantity when + stepper is clicked', async () => {
    useBillStore.getState().addItem('Pizza', cents(1000), 1);

    const user = userEvent.setup();
    render(<ItemsPanel />);

    await user.click(screen.getByRole('button', { name: 'Increase quantity' }));

    const items = useBillStore.getState().config.items;
    expect(items[0].quantity).toBe(2);
  });

  it('decreases quantity but not below 1', async () => {
    useBillStore.getState().addItem('Pizza', cents(1000), 1);

    const user = userEvent.setup();
    render(<ItemsPanel />);

    const decreaseBtn = screen.getByRole('button', { name: 'Decrease quantity' });
    expect(decreaseBtn).toBeDisabled();

    // Clicking a disabled button should not change quantity
    await user.click(decreaseBtn);
    const items = useBillStore.getState().config.items;
    expect(items[0].quantity).toBe(1);
  });

  it('removes item when remove button is clicked', async () => {
    useBillStore.getState().addItem('Salad', cents(800), 1);

    const user = userEvent.setup();
    render(<ItemsPanel />);

    expect(screen.getByDisplayValue('Salad')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove item' }));

    expect(screen.queryByDisplayValue('Salad')).not.toBeInTheDocument();
  });

  it('subtotal updates when item is added (store reflects correct sum)', () => {
    useBillStore.getState().addItem('Pizza', cents(1250), 1);

    const items = useBillStore.getState().config.items;
    const subtotal = items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0
    );

    expect(subtotal).toBe(1250);
  });
});
