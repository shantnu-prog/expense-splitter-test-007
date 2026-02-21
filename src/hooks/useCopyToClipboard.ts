/**
 * src/hooks/useCopyToClipboard.ts
 *
 * Hook providing clipboard write functionality with toast state.
 *
 * Design:
 *   - copy() calls navigator.clipboard.writeText() synchronously from the
 *     call site (no awaits before writeText) — required for Safari's
 *     user-gesture policy, which only allows clipboard access in direct
 *     response to a user interaction event.
 *   - Toast state auto-clears after 2 seconds.
 */

import { useState, useCallback } from 'react';

export interface UseCopyToClipboardResult {
  copy: (text: string, message?: string) => void;
  showToast: boolean;
  toastMessage: string;
}

export function useCopyToClipboard(): UseCopyToClipboardResult {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const copy = useCallback((text: string, message = 'Copied!') => {
    // Synchronous call — no awaits before writeText (Safari user-gesture requirement)
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage(message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }).catch(() => {
      // Silently fail for v1 — app is served over HTTPS/localhost
    });
  }, []);

  return { copy, showToast, toastMessage };
}
