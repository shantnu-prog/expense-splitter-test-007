/**
 * src/components/summary/CopyButton.tsx
 *
 * Reusable copy icon button.
 * Calls e.stopPropagation() to prevent toggling parent card's expanded state.
 */

interface CopyButtonProps {
  onClick: () => void;
  ariaLabel: string;
}

export function CopyButton({ onClick, ariaLabel }: CopyButtonProps) {
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    onClick();
  }

  return (
    <button
      onClick={handleClick}
      aria-label={ariaLabel}
      className="text-gray-500 hover:text-gray-300 min-w-10 min-h-10 flex items-center justify-center"
    >
      {/* Clipboard SVG icon — 16x16 rectangle with folded corner */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Clipboard body */}
        <rect x="4" y="3" width="9" height="11" rx="1" />
        {/* Clipboard clip at top */}
        <path d="M6 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" />
        {/* Lines on clipboard */}
        <line x1="6.5" y1="7" x2="10.5" y2="7" />
        <line x1="6.5" y1="10" x2="10.5" y2="10" />
      </svg>
    </button>
  );
}
