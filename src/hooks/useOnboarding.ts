/**
 * src/hooks/useOnboarding.ts
 *
 * localStorage-backed onboarding state hook.
 * Returns showOnboarding=true only on the first visit (when localStorage key is absent).
 * Subsequent visits skip the splash screen automatically.
 */

import { useState } from 'react';

const ONBOARDING_KEY = 'bill-splitter-onboarding-complete';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => localStorage.getItem(ONBOARDING_KEY) === null
  );

  function dismissOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }

  return { showOnboarding, dismissOnboarding };
}
