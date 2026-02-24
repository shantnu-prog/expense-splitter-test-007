/**
 * src/components/assignments/AssignmentPanel.tsx
 *
 * Assignment panel: item-centric assignment list with expandable checklists.
 * Shows each item with a checklist of people, Everyone button, and
 * amber warning for unassigned items.
 *
 * Accepts onTabChange prop to navigate to other tabs from empty state guidance.
 *
 * Connects to the Zustand store via useShallow for items, people,
 * assignments, and assignItem action.
 */

import { useShallow } from 'zustand/react/shallow';
import { useBillStore } from '../../store/billStore';
import { AssignmentRow } from './AssignmentRow';
import type { Tab } from '../layout/TabBar';

interface AssignmentPanelProps {
  onTabChange: (tab: Tab) => void;
}

export function AssignmentPanel({ onTabChange }: AssignmentPanelProps) {
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
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <p className="text-gray-400 text-base">No items to assign</p>
        <p className="text-gray-500 text-sm">Add items first to start assigning</p>
        <button
          onClick={() => onTabChange('items')}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg min-h-11 text-sm font-medium active:bg-blue-700"
        >
          Go to Items
        </button>
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <p className="text-gray-400 text-base">No people added</p>
        <p className="text-gray-500 text-sm">Add people first to start assigning</p>
        <button
          onClick={() => onTabChange('people')}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg min-h-11 text-sm font-medium active:bg-blue-700"
        >
          Go to People
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-2">
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
