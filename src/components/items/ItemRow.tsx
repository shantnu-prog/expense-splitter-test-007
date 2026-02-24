/**
 * src/components/items/ItemRow.tsx
 *
 * Single item row with inline name editing, dollar price input (converts to cents),
 * quantity stepper (+/-), and remove button.
 */

import { useEffect, useState } from 'react';
import type { Item, ItemId } from '../../engine/types';
import { centsToDollars, dollarsToCents, filterPriceInput } from '../../utils/currency';

interface ItemRowProps {
  item: Item;
  onUpdate: (id: ItemId, updates: Partial<Pick<Item, 'label' | 'priceCents' | 'quantity'>>) => void;
  onRemove: (id: ItemId) => void;
}

export function ItemRow({ item, onUpdate, onRemove }: ItemRowProps) {
  const [localLabel, setLocalLabel] = useState(item.label);
  const [localPrice, setLocalPrice] = useState(centsToDollars(item.priceCents));

  // Sync local state when item.id changes (new item mounted)
  useEffect(() => {
    setLocalLabel(item.label);
    setLocalPrice(centsToDollars(item.priceCents));
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLabelBlur() {
    const trimmed = localLabel.trim();
    if (trimmed === '') {
      // Revert to the store value if user clears the field
      setLocalLabel(item.label);
    } else {
      onUpdate(item.id, { label: trimmed });
    }
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalPrice(filterPriceInput(e.target.value));
  }

  function handlePriceBlur() {
    const parsed = dollarsToCents(localPrice);
    if (parsed !== null) {
      onUpdate(item.id, { priceCents: parsed });
      setLocalPrice(centsToDollars(parsed));
    } else {
      // Revert to store value on invalid input
      setLocalPrice(centsToDollars(item.priceCents));
    }
  }

  return (
    <div className="glass-card rounded-xl flex items-center gap-2 px-4 py-3">
      {/* Name input */}
      <input
        type="text"
        value={localLabel}
        onChange={(e) => setLocalLabel(e.target.value)}
        onBlur={handleLabelBlur}
        placeholder="Item name"
        className="flex-1 bg-white/5 text-gray-100 rounded-lg px-2 py-1 min-h-10 text-base border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />

      {/* Price input with $ prefix */}
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={localPrice}
          onChange={handlePriceChange}
          onBlur={handlePriceBlur}
          placeholder="0.00"
          className="w-24 min-h-10 bg-white/5 text-gray-100 rounded-lg border border-white/10 pl-7 pr-2 text-right text-base focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })}
          disabled={item.quantity <= 1}
          aria-label="Decrease quantity"
          className="min-w-11 min-h-11 rounded-lg bg-white/5 text-gray-100 disabled:opacity-30 press-scale"
        >
          −
        </button>
        <span className="min-w-8 text-center tabular-nums text-gray-100">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}
          aria-label="Increase quantity"
          className="min-w-11 min-h-11 rounded-lg bg-white/5 text-gray-100 press-scale"
        >
          +
        </button>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        aria-label="Remove item"
        className="min-h-11 min-w-11 flex items-center justify-center text-gray-400 active:text-red-400"
      >
        ×
      </button>
    </div>
  );
}
