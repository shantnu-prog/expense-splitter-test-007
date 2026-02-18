/**
 * src/components/assignments/AssignmentPanel.tsx
 *
 * Assignment panel: item-centric assignment list with expandable checklists.
 * Shows each item with a checklist of people, Everyone button, and
 * amber warning for unassigned items.
 *
 * Connects to the Zustand store via useShallow for items, people,
 * assignments, and assignItem action.
 */

import { useShallow } from 'zustand/react/shallow';
import { useBillStore } from '../../store/billStore';
import { AssignmentRow } from './AssignmentRow';

export function AssignmentPanel() {
  const { items, people, assignments, assignItem } = useBillStore(
    useShallow((s) => ({
      items: s.config.items,
      people: s.config.people,
      assignments: s.config.assignments,
      assignItem: s.assignItem,
    }))
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <p className="text-gray-400 text-center py-8">Add items first</p>
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <p className="text-gray-400 text-center py-8">Add people first</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {items.map((item) => (
          <AssignmentRow
            key={item.id}
            item={item}
            people={people}
            assignedIds={assignments[item.id] || []}
            onAssign={assignItem}
          />
        ))}
      </div>
    </div>
  );
}
