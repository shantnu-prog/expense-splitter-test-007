/**
 * src/components/layout/SubtotalBar.tsx
 *
 * Sticky subtotal display using the useSubtotal hook.
 * Shows the running total in dollar format at the top of the screen.
 */

import { useSubtotal } from '../../hooks/useSubtotal';
import { centsToDollars } from '../../utils/currency';

export function SubtotalBar() {
  const subtotal = useSubtotal();

  return (
    <div className="sticky top-0 z-10 glass-surface px-4 py-2 flex items-center justify-between">
      <span className="text-gray-400 text-sm">Subtotal</span>
      <span className="text-white font-semibold text-lg tabular-nums tracking-tight">
        ${centsToDollars(subtotal)}
      </span>
    </div>
  );
}
