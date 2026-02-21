/**
 * src/components/summary/SummaryPanel.tsx
 *
 * Main summary panel showing the bill total, per-person cards with
 * expand/collapse detail, rounding surplus footer, and copy functionality.
 *
 * Design:
 *   - Calls getResult() ONCE at the top of the component (not in children)
 *   - Error state renders friendly message when items are unassigned
 *   - Rounding footer only shown when totalSurplusCents > 0
 */

import { useShallow } from 'zustand/react/shallow';
import { useBillStore } from '../../store/billStore';
import { centsToDollars } from '../../utils/currency';
import { cents } from '../../engine/types';
import type { PersonId } from '../../engine/types';
import { formatSummary, formatPersonSummary } from '../../utils/formatSummary';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { PersonCard } from './PersonCard';
import { RoundingFooter } from './RoundingFooter';
import { Toast } from './Toast';

export function SummaryPanel() {
  const { getResult, people } = useBillStore(
    useShallow((s) => ({
      getResult: s.getResult,
      people: s.config.people,
    }))
  );

  // Call getResult() ONCE per render (not in children — avoids multiple computeSplit() calls)
  const result = getResult();

  const { copy, showToast, toastMessage } = useCopyToClipboard();

  // Error state: unassigned items block calculation
  if (!result.ok) {
    const count = result.unassignedItemIds.length;
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-amber-400 text-base font-medium">
          {count} item{count !== 1 ? 's' : ''} need assignment before splitting
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Go to the Assign tab to assign all items to people.
        </p>
      </div>
    );
  }

  // Compute bill total from rounded totals
  const billTotalCents = result.results.reduce(
    (sum, r) => sum + r.roundedTotalCents,
    0
  );

  function handleCopyAll() {
    const text = formatSummary(result, people);
    copy(text, 'Summary copied!');
  }

  function handlePersonCopy(personId: PersonId) {
    const personResult = result.results.find((r) => r.personId === personId);
    const person = people.find((p) => p.id === personId);
    if (!personResult || !person) return;

    const text = formatPersonSummary(personResult, person.name);
    copy(text, 'Copied!');
  }

  return (
    <>
      <div className="flex flex-col">
        {/* Bill total header */}
        <div className="px-4 py-4 border-b border-gray-800 flex items-center justify-between">
          <span className="text-gray-400 text-sm font-medium">Bill total</span>
          <span className="text-white font-semibold tabular-nums text-xl">
            ${centsToDollars(cents(billTotalCents))}
          </span>
        </div>

        {/* Scrollable person cards area */}
        <div className="flex-1 px-4 pt-4">
          {result.results.map((personResult) => {
            const person = people.find((p) => p.id === personResult.personId);
            if (!person) return null;

            return (
              <PersonCard
                key={personResult.personId}
                person={person}
                result={personResult}
                onCopy={handlePersonCopy}
              />
            );
          })}

          {/* Rounding surplus footer — only shown when surplus > $0.00 */}
          {result.totalSurplusCents > 0 && (
            <RoundingFooter surplusCents={result.totalSurplusCents} />
          )}
        </div>

        {/* Copy all button — bottom of panel */}
        <div className="px-4 pt-4 pb-4 border-t border-gray-800 mt-4">
          <button
            onClick={handleCopyAll}
            className="w-full bg-blue-600 text-white font-medium rounded-xl min-h-12 active:bg-blue-700"
          >
            Copy summary
          </button>
        </div>
      </div>

      {/* Toast floats outside the scrollable area */}
      <Toast message={toastMessage} visible={showToast} />
    </>
  );
}
