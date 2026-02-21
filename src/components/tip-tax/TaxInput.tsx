/**
 * src/components/tip-tax/TaxInput.tsx
 *
 * Tax input with dollar/percentage mode toggle.
 * Shows a paired "$" / "%" button group to the left of the text input.
 * Switching modes clears the input value to avoid dollar/percent confusion.
 */

import { filterPriceInput } from '../../utils/currency';

type TaxMode = 'dollar' | 'percent';

interface TaxInputProps {
  amountDisplay: string;
  mode: TaxMode;
  onModeChange: (mode: TaxMode) => void;
  onValueChange: (value: string) => void;
  onBlur: () => void;
}

export function TaxInput({
  amountDisplay,
  mode,
  onModeChange,
  onValueChange,
  onBlur,
}: TaxInputProps) {
  function handleModeChange(newMode: TaxMode) {
    if (newMode === mode) return;
    onModeChange(newMode);
    // Clear input on mode switch to avoid confusion between dollar and percentage values
    onValueChange('');
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (mode === 'dollar') {
      onValueChange(filterPriceInput(e.target.value));
    } else {
      // Percent mode: digits and single decimal only, values 0-100
      let val = e.target.value.replace(/[^0-9.]/g, '');
      // Keep only first decimal point
      const firstDot = val.indexOf('.');
      if (firstDot !== -1) {
        const beforeDot = val.slice(0, firstDot + 1);
        const afterDot = val.slice(firstDot + 1).replace(/\./g, '');
        val = beforeDot + afterDot;
      }
      // Enforce 0-100 range
      const num = parseFloat(val);
      if (!isNaN(num) && num > 100) {
        val = '100';
      }
      onValueChange(val);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Mode toggle: $ | % */}
      <div className="flex bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
        <button
          type="button"
          onClick={() => handleModeChange('dollar')}
          className={[
            'px-3 py-2 text-sm font-medium transition-colors',
            mode === 'dollar'
              ? 'bg-gray-700 text-gray-100'
              : 'text-gray-500 hover:text-gray-300',
          ].join(' ')}
        >
          $
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('percent')}
          className={[
            'px-3 py-2 text-sm font-medium transition-colors',
            mode === 'percent'
              ? 'bg-gray-700 text-gray-100'
              : 'text-gray-500 hover:text-gray-300',
          ].join(' ')}
        >
          %
        </button>
      </div>

      {/* Value input */}
      <input
        type="text"
        inputMode="decimal"
        value={amountDisplay}
        onChange={handleInputChange}
        onBlur={onBlur}
        placeholder={mode === 'dollar' ? '0.00' : '0'}
        aria-label={mode === 'dollar' ? 'Tax amount in dollars' : 'Tax percentage'}
        className="flex-1 min-h-12 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}
