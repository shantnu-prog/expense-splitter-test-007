/**
 * src/hooks/useUndoDelete.ts
 *
 * Manages undo-delete state: snapshot, 5-second timer, auto-dismiss, and toast message.
 * Follows the Gmail-style optimistic delete + undo pattern.
 *
 * Usage:
 *   const undo = useUndoDelete();
 *   // On delete: call undo.scheduleDelete(snap)
 *   // On undo:   const snap = undo.handleUndo(); then restore snap
 *   // Render:    <UndoToast message={undo.message} visible={undo.visible} ... />
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Person, Item } from '../engine/types';
import type { SavedSplit } from '../store/historyStore';

export interface DeletedPerson {
  kind: 'person';
  person: Person;
  /** Snapshot of ALL assignments at delete time (Record<ItemId, PersonId[]>) */
  assignments: Record<string, string[]>;
  /** Count of items this person was assigned to (for toast message) */
  assignedItemCount: number;
}

export interface DeletedItem {
  kind: 'item';
  item: Item;
  /** PersonIds assigned to this item at delete time */
  assignedIds: string[];
}

export interface DeletedSplit {
  kind: 'savedSplit';
  split: SavedSplit;
}

export type DeletedSnapshot = DeletedPerson | DeletedItem | DeletedSplit;

const UNDO_TIMEOUT_MS = 5000;

export function useUndoDelete() {
  const [snapshot, setSnapshot] = useState<DeletedSnapshot | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount — prevents setState on unmounted component (research pitfall #2)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const scheduleDelete = useCallback((snap: DeletedSnapshot) => {
    // Replace any existing toast — first undo opportunity lost per CONTEXT.md
    if (timerRef.current) clearTimeout(timerRef.current);
    setSnapshot(snap);
    timerRef.current = setTimeout(() => {
      setSnapshot(null);
      timerRef.current = null;
    }, UNDO_TIMEOUT_MS);
  }, []);

  const handleUndo = useCallback((currentSnapshot: DeletedSnapshot | null) => {
    if (!currentSnapshot) return null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setSnapshot(null);
    return currentSnapshot; // Caller performs the restore
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setSnapshot(null);
  }, []);

  /** Build toast message per CONTEXT.md: "Deleted Alice (had 3 items assigned)" */
  function toastMessage(snap: DeletedSnapshot | null): string {
    if (!snap) return '';
    if (snap.kind === 'person') {
      const count = snap.assignedItemCount;
      const name = snap.person.name;
      if (count === 0) return `Deleted ${name}`;
      return `Deleted ${name} (had ${count} item${count !== 1 ? 's' : ''} assigned)`;
    } else if (snap.kind === 'item') {
      const label = snap.item.label || 'Unnamed item';
      const count = snap.assignedIds.length;
      if (count === 0) return `Deleted ${label}`;
      return `Deleted ${label} (was assigned to ${count} ${count !== 1 ? 'people' : 'person'})`;
    } else {
      // kind === 'savedSplit'
      const peopleCount = snap.split.config.people.length;
      const date = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(snap.split.savedAt));
      return `Deleted split from ${date} (${peopleCount} ${peopleCount !== 1 ? 'people' : 'person'})`;
    }
  }

  return {
    snapshot,
    visible: snapshot !== null,
    message: toastMessage(snapshot),
    scheduleDelete,
    handleUndo,
    dismiss,
  };
}
