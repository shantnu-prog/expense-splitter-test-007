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
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-100 text-sm font-medium px-4 py-2 rounded-full shadow-lg transition-opacity duration-300 pointer-events-none ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {message}
    </div>
  );
}
