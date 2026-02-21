/**
 * src/components/people/PeoplePanel.tsx
 *
 * People panel: add people by name (with validation) and remove them.
 * Connects to the Zustand store for people state and actions.
 */

import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBillStore } from '../../store/billStore';
import { PersonRow } from './PersonRow';

export function PeoplePanel() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

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
            ref={addInputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Person name"
            className="flex-1 min-h-12 px-4 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-base"
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

        {people.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
            <p className="text-gray-400 text-base">No people added yet</p>
            <p className="text-gray-500 text-sm">Add everyone splitting this bill</p>
            <button
              onClick={() => addInputRef.current?.focus()}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg min-h-11 text-sm font-medium active:bg-blue-700"
            >
              Add your first person
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
