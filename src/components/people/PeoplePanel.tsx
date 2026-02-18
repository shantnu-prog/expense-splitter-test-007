/**
 * src/components/people/PeoplePanel.tsx
 *
 * People panel: add people by name (with validation) and remove them.
 * Connects to the Zustand store for people state and actions.
 */

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBillStore } from '../../store/billStore';
import { PersonRow } from './PersonRow';

export function PeoplePanel() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const { people, addPerson, removePerson } = useBillStore(
    useShallow((s) => ({
      people: s.config.people,
      addPerson: s.addPerson,
      removePerson: s.removePerson,
    }))
  );

  function handleAdd() {
    const trimmed = name.trim();

    if (trimmed === '') {
      setError('Name required');
      return;
    }

    if (people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Name already exists');
      return;
    }

    addPerson(trimmed);
    setName('');
    setError('');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Add form */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Person name"
            className="flex-1 min-h-12 px-4 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            className="min-h-12 px-6 bg-blue-600 text-white font-medium rounded-lg active:bg-blue-700"
          >
            Add
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>

      {/* People list */}
      <div className="flex-1 overflow-y-auto">
        {people.map((person) => (
          <PersonRow
            key={person.id}
            name={person.name}
            onRemove={() => removePerson(person.id)}
          />
        ))}
      </div>
    </div>
  );
}
