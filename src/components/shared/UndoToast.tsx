/**
 * src/components/shared/UndoToast.tsx
 *
 * Accessible interactive toast with Undo and dismiss buttons.
 * Appears at the bottom of the screen after a person or item deletion.
 *
 * Accessibility:
 *   - aria-live="assertive" announces deletion immediately to screen readers
 *   - Undo is a real <button> — naturally in tab order when visible
 *   - tabIndex toggled to -1 when hidden (opacity-0) — not reachable by keyboard when invisible
 *   - pointer-events-auto when visible ensures buttons are clickable
 */

interface UndoToastProps {
  message: string;
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ message, visible, onUndo, onDismiss }: UndoToastProps) {
  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      role="status"
      className={`fixed bottom-20 inset-x-4 flex items-center justify-between
                  bg-gray-800 text-gray-100 text-sm font-medium px-4 py-3 rounded-xl
                  shadow-lg transition-opacity duration-200
                  ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <span className="flex-1 mr-3">{message}</span>
      <button
        onClick={onUndo}
        className="text-blue-400 font-semibold min-h-11 px-2 shrink-0"
        aria-label="Undo deletion"
        tabIndex={visible ? 0 : -1}
      >
        Undo
      </button>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-gray-400 min-h-11 min-w-11 flex items-center justify-center shrink-0"
        tabIndex={visible ? 0 : -1}
      >
        ×
      </button>
    </div>
  );
}
