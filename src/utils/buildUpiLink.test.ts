import { describe, it, expect } from 'vitest';
import { buildUpiLink } from './buildUpiLink';

describe('buildUpiLink', () => {
  it('builds a valid UPI link with all parameters', () => {
    const url = buildUpiLink({
      payeeVpa: 'alice@ybl',
      payeeName: 'Alice',
      amountCents: 2350,
      note: 'Bill split via SplitCheck',
    });

    expect(url).toBe(
      'upi://pay?pa=alice%40ybl&pn=Alice&am=23.50&cu=INR&tn=Bill+split+via+SplitCheck'
    );
  });

  it('builds a link without a note', () => {
    const url = buildUpiLink({
      payeeVpa: 'bob@paytm',
      payeeName: 'Bob',
      amountCents: 1000,
    });

    expect(url).toContain('pa=bob%40paytm');
    expect(url).toContain('am=10.00');
    expect(url).toContain('cu=INR');
    expect(url).not.toContain('tn=');
  });

  it('returns null for empty VPA', () => {
    expect(buildUpiLink({ payeeVpa: '', payeeName: 'X', amountCents: 100 })).toBeNull();
    expect(buildUpiLink({ payeeVpa: '  ', payeeName: 'X', amountCents: 100 })).toBeNull();
  });

  it('returns null for zero or negative amount', () => {
    expect(buildUpiLink({ payeeVpa: 'a@b', payeeName: 'A', amountCents: 0 })).toBeNull();
    expect(buildUpiLink({ payeeVpa: 'a@b', payeeName: 'A', amountCents: -100 })).toBeNull();
  });

  it('formats small amounts correctly', () => {
    const url = buildUpiLink({ payeeVpa: 'a@b', payeeName: 'A', amountCents: 5 });
    expect(url).toContain('am=0.05');
  });

  it('encodes special characters in name', () => {
    const url = buildUpiLink({ payeeVpa: 'a@b', payeeName: 'José & María', amountCents: 100 });
    expect(url).toContain('pn=Jos');
    expect(url).not.toBeNull();
  });
});
