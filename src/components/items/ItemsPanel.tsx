/**
 * src/components/items/ItemsPanel.tsx
 *
 * Items panel: add empty item rows, edit inline, adjust quantity, remove items.
 * Displays a running subtotal via the SubtotalBar (already in AppShell header).
 * Connects to the Zustand store for items state and CRUD actions.
 * Includes undo toast for accidental deletion recovery.
 */

import { useShallow } from 'zustand/react/shallow';
import { useBillStore } from '../../store/billStore';
import { ItemRow } from './ItemRow';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import { UndoToast } from '../shared/UndoToast';
import type { ItemId } from '../../engine/types';

export function ItemsPanel() {
  const { items, assignments, addItem, removeItem, updateItem, restoreItem } = useBillStore(
    useShallow((s) => ({
      items: s.config.items,
      assignments: s.config.assignments,
      addItem: s.addItem,
      removeItem: s.removeItem,
      updateItem: s.updateItem,
      restoreItem: s.restoreItem,
    }))
  );

  const undo = useUndoDelete();

  function handleRemove(itemId: ItemId) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const assignedIds = [...(assignments[itemId] || [])];
    // Execute delete immediately (optimistic)
    removeItem(itemId);
    // Schedule undo toast
    undo.scheduleDelete({
      kind: 'item',
      item,
      assignedIds,
    });
  }

  function handleUndo() {
    const snap = undo.handleUndo(undo.snapshot);
    if (snap && snap.kind === 'item') {
      restoreItem(snap.item, snap.assignedIds);
    }
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Add button */}
        <div className="p-4">
          <button
            onClick={() => addItem('', 0, 1)}
            className="min-h-12 w-full bg-gray-800 text-blue-400 font-medium rounded-lg border border-dashed border-gray-600 active:bg-gray-700"
          >
            +
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-2">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onUpdate={updateItem}
              onRemove={handleRemove}
            />
          ))}

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
              <p className="text-gray-400 text-base">No items on the bill</p>
              <p className="text-gray-500 text-sm">Tap + above to add your first item</p>
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
