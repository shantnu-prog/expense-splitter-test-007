/**
 * src/components/assignments/AssignmentRow.tsx
 *
 * Single item row that expands to show person checkboxes and Everyone button.
 * Shows assignment count and amber warning for unassigned items.
 */

import { useState } from 'react';
import type { Item, Person, PersonId, ItemId } from '../../engine/types';

interface AssignmentRowProps {
  item: Item;
  people: Person[];
  assignedIds: PersonId[];
  onAssign: (itemId: ItemId, personIds: PersonId[]) => void;
}

export function AssignmentRow({ item, people, assignedIds, onAssign }: AssignmentRowProps) {
  const [expanded, setExpanded] = useState(false);

  const allAssigned = assignedIds.length === people.length && people.length > 0;
  const noneAssigned = assignedIds.length === 0;

  function togglePerson(personId: PersonId) {
    if (assignedIds.includes(personId)) {
      onAssign(item.id, assignedIds.filter((id) => id !== personId));
    } else {
      onAssign(item.id, [...assignedIds, personId]);
    }
  }

  function handleEveryoneClick() {
    if (allAssigned) {
      onAssign(item.id, []);
    } else {
      onAssign(item.id, people.map((p) => p.id));
    }
  }

  return (
    <div className="border-b border-gray-800">
      {/* Item header row — tap to expand/collapse */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="min-h-12 w-full flex items-center justify-between py-3 px-4"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-gray-100">
          {item.label || <span className="text-gray-500 italic">Unnamed item</span>}
          {noneAssigned && (
            <span
              className="text-amber-400 text-xs font-bold"
              aria-label="Unassigned"
            >
              !
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">
            {assignedIds.length}/{people.length}
          </span>
          <span className="text-gray-500 text-sm">{expanded ? '▲' : '▼'}</span>
        </span>
      </button>

      {/* Expanded checklist */}
      {expanded && (
        <div className="px-4 pb-3">
          {/* Everyone button */}
          <button
            onClick={handleEveryoneClick}
            className="w-full min-h-10 rounded-lg text-sm font-medium bg-blue-600/20 text-blue-400 active:bg-blue-600/30 mb-2"
          >
            {allAssigned ? 'Deselect All' : 'Everyone'}
          </button>

          {/* Person checklist */}
          {people.map((person) => (
            <label
              key={person.id}
              className="flex items-center gap-3 min-h-10 px-2 rounded-lg active:bg-gray-800 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={assignedIds.includes(person.id)}
                onChange={() => togglePerson(person.id)}
                className="w-5 h-5 rounded accent-blue-500"
              />
              <span className="text-gray-100">{person.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
