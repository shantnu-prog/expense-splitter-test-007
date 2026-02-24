/**
 * src/components/summary/PaymentSection.tsx
 *
 * Payer selector and per-person UPI payment request buttons.
 * Shown in the Split tab after person cards when the bill is computed.
 */

import { useState } from 'react';
import { useBillStore } from '../../store/billStore';
import { buildUpiLink } from '../../utils/buildUpiLink';
import { centsToDollars } from '../../utils/currency';
import { cents } from '../../engine/types';
import type { Person, PersonId, PersonResult } from '../../engine/types';
import type { Tab } from '../layout/TabBar';

interface PaymentSectionProps {
  people: Person[];
  results: PersonResult[];
  onTabChange: (tab: Tab) => void;
}

export function PaymentSection({ people, results, onTabChange }: PaymentSectionProps) {
  const payerId = useBillStore((s) => s.payerId);
  const setPayerId = useBillStore((s) => s.setPayerId);
  const [desktopUpiMsg, setDesktopUpiMsg] = useState(false);

  // Find the payer's Person object (for VPA and name)
  const payer = people.find((p) => p.id === payerId) ?? null;

  // Non-payer people who owe money (amount > 0)
  const debtors = results
    .filter((r) => r.personId !== payerId && r.roundedTotalCents > 0)
    .map((r) => ({
      person: people.find((p) => p.id === r.personId)!,
      result: r,
    }))
    .filter((d) => d.person != null);

  function handleUpiClick(upiUrl: string) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) {
      setDesktopUpiMsg(true);
      setTimeout(() => setDesktopUpiMsg(false), 3000);
      return;
    }
    window.location.href = upiUrl;
  }

  return (
    <div className="px-4 pt-4">
      {/* Section header */}
      <h3 className="text-gray-400 text-sm font-medium mb-3">Request Payments</h3>

      {/* Payer selector */}
      <label className="block mb-4">
        <span className="text-gray-500 text-xs mb-1 block">Who paid the bill?</span>
        <select
          value={payerId ?? ''}
          onChange={(e) => setPayerId(e.target.value ? (e.target.value as PersonId) : null)}
          className="w-full min-h-12 px-4 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-base appearance-none"
        >
          <option value="">Select payer...</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>

      {/* Payment request list — only shown when a payer is selected */}
      {payer && (
        <div className="flex flex-col gap-2">
          {debtors.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No payments to request</p>
          )}

          {debtors.map(({ person, result }) => {
            const amount = centsToDollars(cents(result.roundedTotalCents));
            const hasPayerVpa = !!payer.upiVpa?.trim();
            const hasPersonVpa = !!person.upiVpa?.trim();
            const upiUrl = (hasPayerVpa && hasPersonVpa)
              ? buildUpiLink({
                  payeeVpa: payer.upiVpa!.trim(),
                  payeeName: payer.name,
                  amountCents: result.roundedTotalCents,
                  note: 'Bill split via SplitCheck',
                })
              : null;

            return (
              <div
                key={person.id}
                className="flex items-center justify-between glass-card rounded-xl px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-gray-100 text-sm font-medium">{person.name}</span>
                  <span className="text-gray-400 text-sm ml-2">${amount}</span>
                </div>

                {upiUrl ? (
                  <button
                    onClick={() => handleUpiClick(upiUrl)}
                    className="ml-3 px-4 min-h-10 bg-green-600 text-white text-sm font-medium rounded-lg active:bg-green-700 shrink-0"
                  >
                    Request via UPI
                  </button>
                ) : (
                  <button
                    onClick={() => onTabChange('people')}
                    className="ml-3 text-blue-400 text-xs shrink-0 underline"
                  >
                    Add UPI ID
                  </button>
                )}
              </div>
            );
          })}

          {/* Hint when payer has no VPA */}
          {!payer.upiVpa?.trim() && debtors.length > 0 && (
            <p className="text-amber-400/80 text-xs text-center mt-1">
              Add your UPI ID in the People tab to enable payment requests
            </p>
          )}

          {/* Desktop UPI message — shown for 3s when clicking UPI on non-mobile */}
          {desktopUpiMsg && (
            <p className="text-amber-400/80 text-xs text-center mt-2">
              Open on your mobile device to use UPI payments
            </p>
          )}
        </div>
      )}
    </div>
  );
}
