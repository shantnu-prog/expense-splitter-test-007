/**
 * src/components/layout/OnboardingScreen.tsx
 *
 * Minimal first-time onboarding splash screen.
 * Shown only on first visit (gated by useOnboarding hook).
 * Displays app name, tagline, and a Start button that dismisses the splash.
 */

interface OnboardingScreenProps {
  onDismiss: () => void;
}

export function OnboardingScreen({ onDismiss }: OnboardingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-950 to-blue-950/30 px-6 text-center">
      {/* App icon in gradient box */}
      <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="12" y2="14" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">SplitCheck</h1>
      <p className="text-gray-400 text-base mb-10">Split bills fairly among friends</p>

      {/* Feature highlights */}
      <div className="space-y-4 mb-10 text-left w-full max-w-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" aria-hidden="true">
              <circle cx="8" cy="7" r="2.5" />
              <path d="M3 16c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
              <circle cx="14" cy="7.5" r="2" />
              <path d="M14.5 11.5c1.8.3 3.5 1.8 3.5 4" />
            </svg>
          </div>
          <span className="text-gray-300 text-sm">Handle shared items and different portions</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400" aria-hidden="true">
              <circle cx="10" cy="10" r="7" />
              <path d="M10 3v14" />
              <path d="M3.5 7.5L10 10" />
              <path d="M16.5 7.5L10 10" />
            </svg>
          </div>
          <span className="text-gray-300 text-sm">Accurate tip, tax, and rounding</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400" aria-hidden="true">
              <rect x="2" y="5" width="16" height="10" rx="2" />
              <path d="M6 5V3a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <circle cx="10" cy="10" r="2" />
            </svg>
          </div>
          <span className="text-gray-300 text-sm">Request payments via UPI</span>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="w-full max-w-xs px-8 py-3 gradient-primary text-white font-semibold rounded-xl min-h-12 text-base press-scale shadow-lg"
      >
        Get Started
      </button>
    </div>
  );
}
