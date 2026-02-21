/**
 * src/components/items/ItemsPanel.tsx
 *
 * Items panel: add empty item rows, edit inline, adjust quantity, remove items.
 * Displays a running subtotal via the SubtotalBar (already in AppShell header).
 * Connects to the Zustand store for items state and CRUD actions.
 */

import { useShallow } from 'zustand/react/shallow';
import { useBillStore } from '../../store/billStore';
import { ItemRow } from './ItemRow';

export function ItemsPanel() {
  const { items, addItem, removeItem, updateItem } = useBillStore(
    useShallow((s) => ({
      items: s.config.items,
      addItem: s.addItem,
      removeItem: s.removeItem,
      updateItem: s.updateItem,
    }))
  );

  return (
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
      <div className="flex-1 overflow-y-auto">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onUpdate={updateItem}
            onRemove={removeItem}
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
  );
}
