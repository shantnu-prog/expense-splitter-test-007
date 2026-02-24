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
 *   - Save/Update Split button persists current bill to history
 */

import { useState, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBillStore } from '../../store/billStore';
import { useHistoryStore } from '../../store/historyStore';
import { centsToDollars } from '../../utils/currency';
import { cents } from '../../engine/types';
import type { PersonId, EngineSuccess } from '../../engine/types';
import { formatSummary, formatPersonSummary } from '../../utils/formatSummary';
import { PersonCard } from './PersonCard';
import { RoundingFooter } from './RoundingFooter';
import { Toast } from './Toast';

export function SummaryPanel() {
  const { getResult, people, tipCents, taxCents, config, currentSplitId, setCurrentSplitId } = useBillStore(
    useShallow((s) => ({
      getResult: s.getResult,
      people: s.config.people,
      tipCents: s.config.tip.amountCents,
      taxCents: s.config.tax.amountCents,
      config: s.config,
      currentSplitId: s.currentSplitId,
      setCurrentSplitId: s.setCurrentSplitId,
    }))
  );

  // Call getResult() ONCE per render (not in children — avoids multiple computeSplit() calls)
  const result = getResult();

  // Unified toast state — only one toast at a time (covers both copy and save)
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(message);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
  }

  function handleSave() {
    if (currentSplitId) {
      // Update existing split
      useHistoryStore.getState().update(currentSplitId, config);
      showToast('Split updated');
    } else {
      // Save new split
      const newId = useHistoryStore.getState().save(config);
      setCurrentSplitId(newId);
      showToast('Split saved');
    }
  }

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

  // Explicitly narrow to EngineSuccess for use inside closures
  const successResult = result as EngineSuccess;

  // Compute bill total from rounded totals
  const billTotalCents = successResult.results.reduce(
    (sum, r) => sum + r.roundedTotalCents,
    0
  );

  function handleCopyAll() {
    const text = formatSummary(successResult, people);
    navigator.clipboard.writeText(text).then(() => showToast('Summary copied!')).catch(() => {});
  }

  function handlePersonCopy(personId: PersonId) {
    const personResult = successResult.results.find((r) => r.personId === personId);
    const person = people.find((p) => p.id === personId);
    if (!personResult || !person) return;

    const text = formatPersonSummary(personResult, person.name);
    navigator.clipboard.writeText(text).then(() => showToast('Copied!')).catch(() => {});
  }

  return (
    <>
      <div className="flex flex-col">
        {/* Hint banner when tip and tax are both unconfigured */}
        {tipCents === 0 && taxCents === 0 && (
          <div className="mx-4 mt-4 px-4 py-3 bg-gray-800/50 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Configure tip and tax above to see the full split</p>
          </div>
        )}

        {/* Bill total header */}
        <div className="px-4 py-4 border-b border-gray-800 flex items-center justify-between">
          <span className="text-gray-400 text-sm font-medium">Bill total</span>
          <span className="text-white font-semibold tabular-nums text-xl">
            ${centsToDollars(cents(billTotalCents))}
          </span>
        </div>

        {/* Scrollable person cards area */}
        <div className="flex-1 px-4 pt-4">
          {successResult.results.map((personResult) => {
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
          {successResult.totalSurplusCents > 0 && (
            <RoundingFooter surplusCents={successResult.totalSurplusCents} />
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

        {/* Save / Update split button */}
        <div className="px-4 pb-4">
          <button
            onClick={handleSave}
            className="w-full bg-gray-800 text-gray-100 font-medium rounded-xl min-h-12 border border-gray-700 active:bg-gray-700"
          >
            {currentSplitId ? 'Update Split' : 'Save Split'}
          </button>
        </div>
      </div>

      {/* Toast floats outside the scrollable area */}
      <Toast message={toastMsg} visible={toastVisible} />
    </>
  );
}
