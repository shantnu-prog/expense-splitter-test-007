/**
 * src/utils/buildUpiLink.ts
 *
 * Constructs a UPI deep link URL for payment requests.
 * Format: upi://pay?pa=<VPA>&pn=<NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>
 */

interface UpiLinkParams {
  /** Payee VPA (the person receiving money), e.g. "alice@ybl" */
  payeeVpa: string;
  /** Payee display name */
  payeeName: string;
  /** Amount in integer cents */
  amountCents: number;
  /** Transaction note (optional) */
  note?: string;
}

/**
 * Build a UPI deep link URL.
 *
 * - Amount is converted from cents to rupees (2 decimal places)
 * - All parameters are URI-encoded
 * - Returns null if payeeVpa is empty or amountCents <= 0
 */
export function buildUpiLink(params: UpiLinkParams): string | null {
  const { payeeVpa, payeeName, amountCents, note } = params;

  if (!payeeVpa.trim() || amountCents <= 0) return null;

  const amount = (amountCents / 100).toFixed(2);

  const searchParams = new URLSearchParams({
    pa: payeeVpa.trim(),
    pn: payeeName.trim(),
    am: amount,
    cu: 'INR',
  });

  if (note?.trim()) {
    searchParams.set('tn', note.trim());
  }

  return `upi://pay?${searchParams.toString()}`;
}
