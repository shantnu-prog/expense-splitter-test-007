/**
 * src/storage/localStorageAdapter.ts
 *
 * Safe localStorage adapter for Zustand persist middleware.
 * This is the ONLY place in the app that touches localStorage directly
 * (other than the existing useOnboarding hook).
 *
 * Wraps getItem/setItem/removeItem in try/catch to handle:
 *   - QuotaExceededError (storage full)
 *   - SecurityError (Safari Private Browsing)
 *
 * Pass to createJSONStorage: storage: createJSONStorage(() => safeLocalStorage)
 */
export const safeLocalStorage = {
  getItem(name: string): string | null {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },

  setItem(name: string, value: string): void {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      // QuotaExceededError or SecurityError (Safari Private Browsing)
      // Caller (persist middleware) swallows this; UI can subscribe to error event
      console.warn('[storage] setItem failed:', name, e);
    }
  },

  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};
