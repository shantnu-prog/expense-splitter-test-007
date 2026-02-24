/**
 * src/components/people/PersonRow.tsx
 *
 * Single person row with name display, optional contact details, and a remove button.
 */

interface PersonRowProps {
  name: string;
  mobile?: string;
  upiVpa?: string;
  onRemove: () => void;
}

export function PersonRow({ name, mobile, upiVpa, onRemove }: PersonRowProps) {
  const hasContact = mobile || upiVpa;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
      <div className="flex-1 min-w-0">
        <span className="text-gray-100">{name}</span>
        {hasContact && (
          <div className="flex flex-wrap gap-x-3 mt-0.5">
            {mobile && (
              <span className="text-gray-500 text-xs">{mobile}</span>
            )}
            {upiVpa && (
              <span className="text-gray-500 text-xs">{upiVpa}</span>
            )}
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="min-h-11 min-w-11 flex items-center justify-center text-gray-400 active:text-red-400 shrink-0"
      >
        ×
      </button>
    </div>
  );
}
