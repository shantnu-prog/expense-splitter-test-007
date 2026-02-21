/**
 * src/components/tip-tax/TipTaxPanel.tsx
 *
 * Combined tip and tax configuration panel.
 * - Tip: segmented control (15%/18%/20%/Custom) + split method toggle
 * - Tax: dollar/percent input + split method toggle
 * - Wires to Zustand store via setTip() and setTax()
 * - Auto-recalculates tip when subtotal changes (percentage recalculation)
 */

import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBillStore } from '../../store/billStore';
import { useSubtotal } from '../../hooks/useSubtotal';
import { dollarsToCents } from '../../utils/currency';
import { TipSegmentedControl } from './TipSegmentedControl';
import { TaxInput } from './TaxInput';
import { SplitMethodToggle } from './SplitMethodToggle';

type TipPreset = '15' | '18' | '20' | 'custom';
type TaxMode = 'dollar' | 'percent';

export function TipTaxPanel() {
  const subtotal = useSubtotal();

  const { setTip, setTax, tipConfig, taxConfig } = useBillStore(
    useShallow((s) => ({
      setTip: s.setTip,
      setTax: s.setTax,
      tipConfig: s.config.tip,
      taxConfig: s.config.tax,
    }))
  );

  // --- Tip local state ---
  const [tipPreset, setTipPreset] = useState<TipPreset>('15');
  const [customTipPct, setCustomTipPct] = useState<string>('');

  // --- Tax local state ---
  const [taxMode, setTaxMode] = useState<TaxMode>('dollar');
  const [taxInput, setTaxInput] = useState<string>('');

  // --- Helpers ---

  function computeTipCents(preset: TipPreset, customPct: string): number {
    if (preset === 'custom') {
      const pct = parseFloat(customPct);
      if (!isNaN(pct) && pct >= 0) {
        return Math.round((pct / 100) * subtotal);
      }
      return 0;
    }
    const pct = parseFloat(preset);
    return Math.round((pct / 100) * subtotal);
  }

  // --- Tip preset handler ---

  function handlePresetChange(preset: TipPreset) {
    setTipPreset(preset);
    if (preset !== 'custom') {
      const tipCents = computeTipCents(preset, customTipPct);
      setTip(tipCents, tipConfig.method, false);
    }
    // Custom: wait for blur event on custom input before calling setTip
  }

  function handleCustomTipChange(value: string) {
    setCustomTipPct(value);
  }

  function handleCustomTipBlur() {
    const tipCents = computeTipCents('custom', customTipPct);
    setTip(tipCents, tipConfig.method, false);
  }

  // --- Tip method handler ---

  function handleTipMethodChange(method: 'equal' | 'proportional') {
    setTip(tipConfig.amountCents, method, false);
  }

  // --- Tax handlers ---

  function handleTaxBlur() {
    if (taxMode === 'dollar') {
      const centsVal = dollarsToCents(taxInput);
      setTax(centsVal ?? 0, taxConfig.method, false);
    } else {
      const pct = parseFloat(taxInput);
      if (!isNaN(pct) && pct >= 0) {
        const taxCents = Math.round((pct / 100) * subtotal);
        setTax(taxCents, taxConfig.method, false);
      } else {
        setTax(0, taxConfig.method, false);
      }
    }
  }

  function handleTaxMethodChange(method: 'equal' | 'proportional') {
    setTax(taxConfig.amountCents, method, false);
  }

  // --- Tip recalculation when subtotal changes ---
  // When the user has selected a tip by percentage (any preset or custom),
  // recompute tip cents against the new subtotal so stale tips don't persist
  // after items are added/removed.

  useEffect(() => {
    if (tipPreset === 'custom') {
      const tipCents = computeTipCents('custom', customTipPct);
      setTip(tipCents, tipConfig.method, false);
    } else {
      const tipCents = computeTipCents(tipPreset, customTipPct);
      setTip(tipCents, tipConfig.method, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  return (
    <div className="p-4 space-y-6">
      {/* --- Tip section --- */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-100">Tip</h2>

        <TipSegmentedControl
          selected={tipPreset}
          customValue={customTipPct}
          onPresetChange={handlePresetChange}
          onCustomChange={handleCustomTipChange}
          onCustomBlur={handleCustomTipBlur}
        />

        <SplitMethodToggle
          value={tipConfig.method}
          onChange={handleTipMethodChange}
          label="Split"
        />
      </section>

      {/* --- Tax section --- */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-100">Tax</h2>

        <TaxInput
          amountDisplay={taxInput}
          mode={taxMode}
          onModeChange={setTaxMode}
          onValueChange={setTaxInput}
          onBlur={handleTaxBlur}
        />

        <SplitMethodToggle
          value={taxConfig.method}
          onChange={handleTaxMethodChange}
          label="Split"
        />
      </section>
    </div>
  );
}
