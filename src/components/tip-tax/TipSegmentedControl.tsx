/**
 * src/components/tip-tax/TipSegmentedControl.tsx
 *
 * iOS-style segmented control for tip presets: 15%, 18%, 20%, Custom.
 * Uses hidden radio inputs with styled labels (sr-only pattern) for accessibility.
 * When "Custom" is selected, reveals a percentage text input below the segments.
 */

import { filterPriceInput, centsToDollars } from '../../utils/currency';
import { cents } from '../../engine/types';

type TipPreset = '15' | '18' | '20' | 'custom';

interface TipSegmentedControlProps {
  selected: TipPreset;
  customValue: string;
  onPresetChange: (preset: TipPreset) => void;
  onCustomChange: (value: string) => void;
  onCustomBlur?: () => void;
  subtotalCents?: number;
}

const PRESETS: { id: TipPreset; label: string }[] = [
  { id: '15', label: '15%' },
  { id: '18', label: '18%' },
  { id: '20', label: '20%' },
  { id: 'custom', label: 'Custom' },
];

export function TipSegmentedControl({
  selected,
  customValue,
  onPresetChange,
  onCustomChange,
  onCustomBlur,
  subtotalCents,
}: TipSegmentedControlProps) {
  function handleCustomInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Allow digits and single decimal point only (no dollar sign)
    let val = e.target.value.replace(/[^0-9.]/g, '');
    // Keep only first decimal point
    const firstDot = val.indexOf('.');
    if (firstDot !== -1) {
      const beforeDot = val.slice(0, firstDot + 1);
      const afterDot = val.slice(firstDot + 1).replace(/\./g, '');
      val = beforeDot + afterDot;
    }
    onCustomChange(val);
  }

  function handleCustomBlur(e: React.FocusEvent<HTMLInputElement>) {
    const sanitized = filterPriceInput(e.target.value);
    onCustomChange(sanitized);
    onCustomBlur?.();
  }

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Tip percentage"
        className="flex glass-surface rounded-lg p-1 gap-1"
      >
        {PRESETS.map((preset) => {
          const isActive = selected === preset.id;
          return (
            <label
              key={preset.id}
              className={[
                'flex-1 text-center py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors select-none',
                isActive
                  ? 'gradient-primary text-white'
                  : 'text-gray-400 hover:text-gray-200',
              ].join(' ')}
            >
              <input
                type="radio"
                name="tip-preset"
                value={preset.id}
                checked={isActive}
                onChange={() => onPresetChange(preset.id)}
                className="sr-only"
              />
              {preset.label}
            </label>
          );
        })}
      </div>

      {selected === 'custom' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={customValue}
              onChange={handleCustomInputChange}
              onBlur={handleCustomBlur}
              placeholder="0"
              aria-label="Custom tip percentage"
              className="flex-1 min-h-12 px-3 py-2 text-base bg-white/5 border border-white/10 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
          {(() => {
            const pct = parseFloat(customValue);
            if (!isNaN(pct) && pct > 0 && subtotalCents && subtotalCents > 0) {
              const tipCentsVal = Math.round((pct / 100) * subtotalCents);
              return (
                <p className="text-xs text-gray-500 pl-1">
                  {customValue}% = ${centsToDollars(cents(tipCentsVal))}
                </p>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
}
