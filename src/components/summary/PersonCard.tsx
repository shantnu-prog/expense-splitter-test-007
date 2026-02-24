/**
 * src/components/summary/PersonCard.tsx
 *
 * Expandable person card showing name, rounded total, and food/tip/tax detail.
 *
 * Uses CSS grid-rows transition for smooth expand/collapse animation.
 * The card header is a div with role="button" so the CopyButton (a real <button>)
 * can sit inside it without invalid HTML nesting (button-in-button is invalid).
 */

import { useState } from 'react';
import { centsToDollars } from '../../utils/currency';
import { cents } from '../../engine/types';
import type { Person, PersonId, PersonResult } from '../../engine/types';
import { CopyButton } from './CopyButton';

interface PersonCardProps {
  person: Person;
  result: PersonResult;
  onCopy: (personId: PersonId) => void;
  payerName?: string;
  isPayer?: boolean;
}

export function PersonCard({ person, result, onCopy, payerName, isPayer }: PersonCardProps) {
  const [expanded, setExpanded] = useState(false);

  function handleHeaderClick() {
    setExpanded((prev) => !prev);
  }

  function handleHeaderKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpanded((prev) => !prev);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl mb-3">
      {/* Header row — tappable to expand/collapse.
          Using a div with role="button" so the nested CopyButton (real <button>)
          does not create an invalid button-in-button structure. */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${person.name} card`}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={handleHeaderClick}
        onKeyDown={handleHeaderKeyDown}
      >
        {/* Left: person name + settlement direction */}
        <div className="flex flex-col">
          <span className="text-gray-100 font-medium">{person.name}</span>
          {payerName && (
            <span className="text-xs text-gray-400">
              {isPayer ? 'Paid' : `owes ${payerName}`}
            </span>
          )}
        </div>

        {/* Right: amount + copy icon + chevron */}
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold tabular-nums text-lg">
            ${centsToDollars(result.roundedTotalCents)}
          </span>
          <CopyButton
            onClick={() => onCopy(person.id)}
            ariaLabel={`Copy ${person.name}'s amount`}
          />
          {/* Chevron rotates 180° when expanded */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <polyline points="4 6 8 10 12 6" />
          </svg>
        </div>
      </div>

      {/* Detail drawer — CSS grid-rows transition for smooth animation */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-3 pt-1 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Food</span>
              <span className="text-gray-200 tabular-nums">
                ${centsToDollars(cents(result.foodCents))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tip</span>
              <span className="text-gray-200 tabular-nums">
                ${centsToDollars(cents(result.tipCents))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tax</span>
              <span className="text-gray-200 tabular-nums">
                ${centsToDollars(cents(result.taxCents))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
