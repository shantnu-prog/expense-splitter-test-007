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
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400" aria-hidden="true">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="16" y2="14" />
          </svg>
        </div>
        <p className="text-gray-400 text-base">No items to assign</p>
        <p className="text-gray-500 text-sm">Add items first to start assigning</p>
        <button
          onClick={() => onTabChange('items')}
          className="px-5 py-2 gradient-primary text-white rounded-lg min-h-11 text-sm font-medium press-scale shadow-lg"
        >
          Go to Items
        </button>
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" aria-hidden="true">
            <circle cx="9" cy="7" r="3" />
            <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
            <circle cx="17" cy="8" r="2.5" />
            <path d="M17.5 14.5c2.3.4 4.5 2.2 4.5 5" />
          </svg>
        </div>
        <p className="text-gray-400 text-base">No people added</p>
        <p className="text-gray-500 text-sm">Add people first to start assigning</p>
        <button
          onClick={() => onTabChange('people')}
          className="px-5 py-2 gradient-primary text-white rounded-lg min-h-11 text-sm font-medium press-scale shadow-lg"
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
