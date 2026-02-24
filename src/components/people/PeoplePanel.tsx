/**
 * src/components/people/PeoplePanel.tsx
 *
 * People panel: add people by name (with validation) and remove them.
 * Connects to the Zustand store for people state and actions.
 * Includes undo toast for accidental deletion recovery.
 */

import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBillStore } from '../../store/billStore';
import { PersonRow } from './PersonRow';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import { UndoToast } from '../shared/UndoToast';
import type { PersonId } from '../../engine/types';

export function PeoplePanel() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [mobile, setMobile] = useState('');
  const [upiVpa, setUpiVpa] = useState('');
  const [showContact, setShowContact] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  const { people, assignments, addPerson, removePerson, restorePerson } = useBillStore(
    useShallow((s) => ({
      people: s.config.people,
      assignments: s.config.assignments,
      addPerson: s.addPerson,
      removePerson: s.removePerson,
      restorePerson: s.restorePerson,
    }))
  );

  const undo = useUndoDelete();

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

    const contact: { mobile?: string; upiVpa?: string } = {};
    if (mobile.trim()) contact.mobile = mobile.trim();
    if (upiVpa.trim()) contact.upiVpa = upiVpa.trim();

    addPerson(trimmed, Object.keys(contact).length > 0 ? contact : undefined);
    setName('');
    setMobile('');
    setUpiVpa('');
    setError('');
    setShowContact(false);
  }

  function handleRemove(personId: PersonId) {
    const person = people.find((p) => p.id === personId);
    if (!person) return;
    // Count items this person is assigned to (for toast message)
    const assignedItemCount = Object.values(assignments).filter(
      (ids) => ids.includes(personId)
    ).length;
    // Snapshot the assignments map entries where this person appears
    const assignmentSnapshot: Record<string, string[]> = {};
    for (const [itemId, personIds] of Object.entries(assignments)) {
      if (personIds.includes(personId)) {
        assignmentSnapshot[itemId] = [...personIds];
      }
    }
    // Execute the delete immediately (optimistic)
    removePerson(personId);
    // Schedule undo toast
    undo.scheduleDelete({
      kind: 'person',
      person,
      assignments: assignmentSnapshot,
      assignedItemCount,
    });
  }

  function handleUndo() {
    const snap = undo.handleUndo(undo.snapshot);
    if (snap && snap.kind === 'person') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      restorePerson(snap.person, snap.assignments as any);
    }
  }

  return (
    <>
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

          {/* Contact details toggle */}
          <button
            type="button"
            onClick={() => setShowContact(!showContact)}
            className="text-blue-400 text-sm font-medium mt-2 min-h-8"
          >
            {showContact ? '− Hide contact details' : '+ Add contact details'}
          </button>

          {/* Contact fields (collapsible) */}
          {showContact && (
            <div className="flex flex-col gap-2 mt-2">
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile number"
                className="min-h-12 px-4 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-base"
                inputMode="tel"
              />
              <input
                type="text"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                placeholder="UPI ID (e.g., name@ybl)"
                className="min-h-12 px-4 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-base"
                inputMode="text"
                autoCapitalize="none"
              />
            </div>
          )}
        </div>

        {/* People list */}
        <div className="flex-1 overflow-y-auto">
          {people.map((person) => (
            <PersonRow
              key={person.id}
              name={person.name}
              mobile={person.mobile}
              upiVpa={person.upiVpa}
              onRemove={() => handleRemove(person.id)}
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

      <UndoToast
        message={undo.message}
        visible={undo.visible}
        onUndo={handleUndo}
        onDismiss={undo.dismiss}
      />
    </>
  );
}
