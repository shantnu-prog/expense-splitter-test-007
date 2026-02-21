// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useBillStore } from '../../store/billStore';
import { PeoplePanel } from './PeoplePanel';

beforeEach(() => {
  useBillStore.getState().reset();
});

describe('PeoplePanel', () => {
  it('adds a person when name is entered and Add is clicked', async () => {
    const user = userEvent.setup();
    render(<PeoplePanel />);

    await user.type(screen.getByPlaceholderText('Person name'), 'Alice');
    await user.click(screen.getByText('Add'));

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('does NOT add a person on Enter key (user must Tab to Add button)', async () => {
    const user = userEvent.setup();
    render(<PeoplePanel />);

    await user.type(screen.getByPlaceholderText('Person name'), 'Bob');
    await user.keyboard('{Enter}');

    // Per locked design decision: Enter in text inputs does NOT submit.
    // "Bob" should not have been added — only the empty-state prompt is visible.
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByText('No people added yet')).toBeInTheDocument();
  });

  it('shows error for empty name', async () => {
    const user = userEvent.setup();
    render(<PeoplePanel />);

    await user.click(screen.getByText('Add'));

    expect(screen.getByText('Name required')).toBeInTheDocument();
  });

  it('shows error for duplicate name (case-insensitive)', async () => {
    useBillStore.getState().addPerson('Alice');

    const user = userEvent.setup();
    render(<PeoplePanel />);

    await user.type(screen.getByPlaceholderText('Person name'), 'alice');
    await user.click(screen.getByText('Add'));

    expect(screen.getByText('Name already exists')).toBeInTheDocument();
  });

  it('clears error when user starts typing', async () => {
    const user = userEvent.setup();
    render(<PeoplePanel />);

    await user.click(screen.getByText('Add'));
    expect(screen.getByText('Name required')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Person name'), 'A');
    expect(screen.queryByText('Name required')).not.toBeInTheDocument();
  });

  it('removes a person when remove button is clicked', async () => {
    useBillStore.getState().addPerson('Alice');

    const user = userEvent.setup();
    render(<PeoplePanel />);

    expect(screen.getByText('Alice')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Alice' }));

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('clears input after successful add', async () => {
    const user = userEvent.setup();
    render(<PeoplePanel />);

    const input = screen.getByPlaceholderText('Person name');
    await user.type(input, 'Alice');
    await user.click(screen.getByText('Add'));

    expect(input).toHaveValue('');
  });
});
