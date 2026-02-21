// @vitest-environment jsdom

import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useBillStore } from '../../store/billStore';
import { cents } from '../../engine/types';
import { AssignmentPanel } from './AssignmentPanel';

beforeEach(() => {
  useBillStore.getState().reset();
  // Seed with 2 people and 2 items
  useBillStore.getState().addPerson('Alice');
  useBillStore.getState().addPerson('Bob');
  useBillStore.getState().addItem('Pizza', cents(1200), 1);
  useBillStore.getState().addItem('Salad', cents(800), 1);
});

const mockOnTabChange = vi.fn();

describe('AssignmentPanel', () => {
  it('shows items with assignment counts', () => {
    render(<AssignmentPanel onTabChange={mockOnTabChange} />);
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Salad')).toBeInTheDocument();
    // Each item should show 0/2 (no assignments seeded)
    const counts = screen.getAllByText('0/2');
    expect(counts).toHaveLength(2);
  });

  it('shows empty state with Go to Items button when no items', () => {
    useBillStore.getState().reset();
    useBillStore.getState().addPerson('Alice');
    useBillStore.getState().addPerson('Bob');
    render(<AssignmentPanel onTabChange={mockOnTabChange} />);
    expect(screen.getByText('No items to assign')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Items' })).toBeInTheDocument();
  });

  it('shows empty state with Go to People button when no people', () => {
    useBillStore.getState().reset();
    useBillStore.getState().addItem('Pizza', cents(1200), 1);
    useBillStore.getState().addItem('Salad', cents(800), 1);
    render(<AssignmentPanel onTabChange={mockOnTabChange} />);
    expect(screen.getByText('No people added')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to People' })).toBeInTheDocument();
  });

  it('expands item to show person checkboxes and Everyone button', async () => {
    const user = userEvent.setup();
    render(<AssignmentPanel onTabChange={mockOnTabChange} />);

    await user.click(screen.getByText('Pizza'));

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Everyone')).toBeInTheDocument();
  });

  it('assigns person when checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<AssignmentPanel onTabChange={mockOnTabChange} />);

    // Expand Pizza row
    await user.click(screen.getByText('Pizza'));

    // Click Alice checkbox
    const aliceCheckbox = screen.getByRole('checkbox', { name: 'Alice' });
    await user.click(aliceCheckbox);

    const state = useBillStore.getState();
    const pizzaItem = state.config.items.find((i) => i.label === 'Pizza')!;
    const alicePerson = state.config.people.find((p) => p.name === 'Alice')!;

    expect(state.config.assignments[pizzaItem.id]).toContain(alicePerson.id);
  });

  it('unassigns person when checkbox is unchecked', async () => {
    // Pre-assign Alice to Pizza
    const state = useBillStore.getState();
    const pizzaItem = state.config.items.find((i) => i.label === 'Pizza')!;
    const alicePerson = state.config.people.find((p) => p.name === 'Alice')!;
    state.assignItem(pizzaItem.id, [alicePerson.id]);

    const user = userEvent.setup();
    render(<AssignmentPanel onTabChange={mockOnTabChange} />);

    // Expand Pizza row
    await user.click(screen.getByText('Pizza'));

    // Uncheck Alice
    const aliceCheckbox = screen.getByRole('checkbox', { name: 'Alice' });
    await user.click(aliceCheckbox);

    const updatedState = useBillStore.getState();
    expect(updatedState.config.assignments[pizzaItem.id]).not.toContain(alicePerson.id);
  });

  it('Everyone button assigns all people', async () => {
    const user = userEvent.setup();
    render(<AssignmentPanel onTabChange={mockOnTabChange} />);

    // Expand Pizza row
    await user.click(screen.getByText('Pizza'));

    // Click Everyone
    await user.click(screen.getByText('Everyone'));

    const state = useBillStore.getState();
    const pizzaItem = state.config.items.find((i) => i.label === 'Pizza')!;
    const alicePerson = state.config.people.find((p) => p.name === 'Alice')!;
    const bobPerson = state.config.people.find((p) => p.name === 'Bob')!;

    expect(state.config.assignments[pizzaItem.id]).toContain(alicePerson.id);
    expect(state.config.assignments[pizzaItem.id]).toContain(bobPerson.id);
  });

  it('Everyone button deselects all when all assigned', async () => {
    // Pre-assign both people to Pizza
    const state = useBillStore.getState();
    const pizzaItem = state.config.items.find((i) => i.label === 'Pizza')!;
    const alicePerson = state.config.people.find((p) => p.name === 'Alice')!;
    const bobPerson = state.config.people.find((p) => p.name === 'Bob')!;
    state.assignItem(pizzaItem.id, [alicePerson.id, bobPerson.id]);

    const user = userEvent.setup();
    render(<AssignmentPanel onTabChange={mockOnTabChange} />);

    // Expand Pizza row
    await user.click(screen.getByText('Pizza'));

    // Button should say "Deselect All" when all assigned
    const deselectButton = screen.getByText('Deselect All');
    expect(deselectButton).toBeInTheDocument();

    await user.click(deselectButton);

    const updatedState = useBillStore.getState();
    expect(updatedState.config.assignments[pizzaItem.id]).toHaveLength(0);
  });

  it('shows amber warning for unassigned items', () => {
    render(<AssignmentPanel onTabChange={mockOnTabChange} />);
    // Both items should show the amber "!" unassigned indicator
    const warnings = screen.getAllByLabelText('Unassigned');
    expect(warnings).toHaveLength(2);
  });

  it('assignment count updates after assigning via Everyone', async () => {
    const user = userEvent.setup();
    render(<AssignmentPanel onTabChange={mockOnTabChange} />);

    // Expand Pizza row
    await user.click(screen.getByText('Pizza'));

    // Click Everyone to assign all
    await user.click(screen.getByText('Everyone'));

    // Count should show 2/2 for Pizza
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });
});
