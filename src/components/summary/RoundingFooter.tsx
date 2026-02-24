/**
 * src/components/summary/RoundingFooter.tsx
 *
 * Displays the rounding surplus amount below person cards.
 * Only rendered by parent when surplusCents > 0 (hidden when zero per user decision).
 */

import { centsToDollars } from '../../utils/currency';
import { cents } from '../../engine/types';

interface RoundingFooterProps {
  surplusCents: number;
}

export function RoundingFooter({ surplusCents }: RoundingFooterProps) {
  const amount = centsToDollars(cents(surplusCents));

  return (
    <div className="mt-2 px-4 py-3 glass-card rounded-xl">
      <p className="text-gray-500 text-xs text-center">
        +${amount} rounding surplus (cents rounded up per person)
      </p>
    </div>
  );
}
