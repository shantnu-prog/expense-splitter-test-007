/**
 * src/components/summary/PaymentSection.tsx
 *
 * Payer selector and per-person UPI payment request buttons.
 * Shown in the Split tab after person cards when the bill is computed.
 */

import { useState } from 'react';
import { buildUpiLink } from '../../utils/buildUpiLink';
import { centsToDollars } from '../../utils/currency';
import { cents } from '../../engine/types';
import type { Person, PersonId, PersonResult } from '../../engine/types';

interface PaymentSectionProps {
  people: Person[];
  results: PersonResult[];
}

export function PaymentSection({ people, results }: PaymentSectionProps) {
  const [payerId, setPayerId] = useState<PersonId | ''>('');

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
    // Try to open the UPI link directly (works on mobile)
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
          value={payerId}
          onChange={(e) => setPayerId(e.target.value as PersonId)}
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
                className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3"
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
                  <span className="ml-3 text-gray-500 text-xs shrink-0">No UPI ID</span>
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
        </div>
      )}
    </div>
  );
}
