/**
 * src/components/summary/Toast.tsx
 *
 * Fixed-position toast notification with opacity transition.
 * Positioned above the tab bar (bottom-20) to avoid overlap.
 */

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 glass-card text-gray-100 text-sm font-medium px-4 py-2 rounded-xl shadow-lg transition-all duration-300 pointer-events-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {message}
    </div>
  );
}
