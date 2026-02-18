/**
 * src/components/people/PersonRow.tsx
 *
 * Single person row with name display and a remove button.
 */

interface PersonRowProps {
  name: string;
  onRemove: () => void;
}

export function PersonRow({ name, onRemove }: PersonRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
      <span className="text-gray-100">{name}</span>
      <button
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="min-h-10 min-w-10 flex items-center justify-center text-gray-400 active:text-red-400"
      >
        ×
      </button>
    </div>
  );
}
