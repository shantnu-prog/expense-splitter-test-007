/**
 * src/components/tip-tax/SplitMethodToggle.tsx
 *
 * Reusable two-option toggle for "Equal" vs "Proportional" split method.
 * Used twice in TipTaxPanel: once for tip split, once for tax split.
 */

interface SplitMethodToggleProps {
  value: 'equal' | 'proportional';
  onChange: (method: 'equal' | 'proportional') => void;
  label: string;
}

export function SplitMethodToggle({ value, onChange, label }: SplitMethodToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex glass-surface rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => onChange('equal')}
          className={[
            'px-3 py-1.5 text-sm font-medium transition-colors',
            value === 'equal'
              ? 'gradient-primary text-white'
              : 'text-gray-500 hover:text-gray-300',
          ].join(' ')}
        >
          Equal
        </button>
        <button
          type="button"
          onClick={() => onChange('proportional')}
          className={[
            'px-3 py-1.5 text-sm font-medium transition-colors',
            value === 'proportional'
              ? 'gradient-primary text-white'
              : 'text-gray-500 hover:text-gray-300',
          ].join(' ')}
        >
          Proportional
        </button>
      </div>
    </div>
  );
}
