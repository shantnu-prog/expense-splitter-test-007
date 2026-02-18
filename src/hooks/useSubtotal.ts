/**
 * src/hooks/useSubtotal.ts
 *
 * Hook computing the running subtotal from store items.
 * Returns the sum of (priceCents * quantity) for all items.
 */

import { useBillStore } from '../store/billStore';
import { cents, type Cents } from '../engine/types';

/**
 * Returns the running subtotal in integer cents.
 * Sums priceCents * quantity for each item in the store.
 * Returns Cents(0) when no items exist.
 */
export function useSubtotal(): Cents {
  const items = useBillStore((s) => s.config.items);
  const total = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  return cents(total);
}
