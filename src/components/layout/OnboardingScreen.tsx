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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-6 text-center">
      <h1 className="text-3xl font-bold text-white mb-2">SplitCheck</h1>
      <p className="text-gray-400 text-base mb-8">Split bills fairly</p>
      <button
        onClick={onDismiss}
        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl min-h-12 text-base active:bg-blue-700"
      >
        Start
      </button>
    </div>
  );
}
