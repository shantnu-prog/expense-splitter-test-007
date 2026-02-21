# Phase 3: Output - Research

**Researched:** 2026-02-21
**Domain:** React mobile UI — segmented controls, toggle inputs, card expand/collapse, clipboard API, toast notifications, Zustand-connected display components
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tip/tax controls:**
- Tip presets (15%, 18%, 20%) use an iOS-style segmented control — one option always selected
- Custom tip percentage input interaction is Claude's discretion (e.g., 4th "Custom" segment revealing an input, or another smooth approach)
- Tax input supports dollar amount OR percentage mode — Claude decides the toggle/switch UX for this
- Tip and tax each have **separate** equal/proportional split method toggles — independent control per type (matches existing TipTaxConfig structure)

**Summary display:**
- Per-person breakdown uses **card per person** layout — stacked vertically, scrollable
- Cards show **name + total by default**, with **expandable detail** on tap revealing food subtotal, tip share, tax share
- Bill total displayed at the top with receipt comparison — "Bill total: $XX.XX" so users can sanity-check against the actual receipt
- Person ordering is Claude's discretion

**Rounding transparency:**
- Rounding surplus shown in a **footer below all cards** — not inside individual cards
- Footer detail level is Claude's discretion (simple amount vs. with explanation)
- Footer is **hidden when rounding surplus is $0.00** — only appears when non-zero
- The bill total at the top shows the rounded total only (no inline rounding annotation) — the footer handles the explanation

**Copy-to-clipboard:**
- Copied text uses **labeled breakdown format**: "Bill Split:\n- Alice owes $23.50\n- Bob owes $18.00\nTotal: $41.50 (includes tip + tax)"
- Copy feedback uses a **toast notification** at the bottom of the screen
- **Both copy options**: a "Copy all" button for the full summary, plus a small copy icon on each person's card for individual amounts
- "Copy all" button placement is Claude's discretion

### Claude's Discretion
- Custom tip input UX (how it interacts with the segmented control)
- Tax dollar/percentage mode switch implementation
- Rounding footer detail level and wording
- Person ordering in summary (order added vs. highest-to-lowest vs. other)
- "Copy all" button placement (top vs. bottom of summary)
- Exact spacing, typography, and animation details within the dark theme

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TPTX-01 | User can select tip percentage from presets (15%, 18%, 20%) or enter custom % | Segmented control pattern (radio-button-backed) for presets; 4th "Custom" segment reveals a percentage input field; `setTip()` store action accepts amountCents derived from percentage of subtotal |
| TPTX-03 | User can enter tax as a dollar amount or percentage | Toggle switch between $ and % mode; dollar input uses existing `dollarsToCents()` helper; percentage input computes `tax = subtotal * pct / 100` before calling `setTax()`; both modes update the same `TipTaxConfig.amountCents` |
| SUMM-01 | Per-person summary shows each person's name and total owed | `getResult()` on store returns `EngineSuccess.results: PersonResult[]`; each card reads `personId → person.name` via people array lookup, displays `roundedTotalCents`; expandable detail shows `foodCents`, `tipCents`, `taxCents` |
| SUMM-03 | Copy-friendly formatted output for sharing (e.g. "Alice owes $23.50") | `navigator.clipboard.writeText()` API; must fire directly from click handler (user-gesture requirement, especially on Safari); labeled format: "Bill Split:\n- Alice owes $23.50\n..." built by mapping `results` through `people` name lookup |
</phase_requirements>

---

## Summary

Phase 3 builds two UI panels on top of the existing, fully tested engine and Zustand store. The store already exposes `setTip()`, `setTax()`, and `getResult()` — Phase 3 connects UI controls to those actions and renders the results. No new engine logic is needed; this is pure UI.

The Tip/Tax panel introduces two UI patterns new to this codebase: a segmented control (for tip presets) and a dollar/percentage mode toggle (for tax input). Both are achievable with native HTML elements and Tailwind CSS with no new runtime dependencies. The segmented control uses visually styled radio buttons. The tax mode toggle uses a two-segment variant of the same pattern or a simple paired button group.

The Summary panel renders `getResult()` output. The store's `computeSplit()` already handles all the math (food/tip/tax breakdown, rounding surplus, person totals). The component just reads `EngineSuccess.results` and maps each `PersonResult` to a card. Copy-to-clipboard uses `navigator.clipboard.writeText()` which is available in all modern browsers in secure contexts (HTTPS/localhost). It must be called directly from a click handler (not after an async delay) to satisfy Safari's user-gesture requirement. A self-contained toast notification (no library needed — just `useState` + `setTimeout` + Tailwind CSS transition) shows copy confirmation.

**Primary recommendation:** Build the Tip/Tax panel and Summary panel as two new component directories (`tip-tax/` and `summary/`), connect them to the existing store, add a 4th tab ("Split") for the output screen or integrate controls into the existing tab structure — see Open Questions. Use radio-button-backed segmented control, `navigator.clipboard.writeText()` from click handlers, and a lightweight custom toast.

---

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | UI components | Already installed; all Phase 2 components use it |
| TypeScript | 5.9.3 | Type safety | Already installed |
| Zustand + Immer | 5.0.11 + 11.1.4 | State management | Store already has `setTip()`, `setTax()`, `getResult()` actions |
| Tailwind CSS | 4.2.0 | Utility-first styling | Already installed; dark palette established in Phase 2 |
| Vite | 7.3.1 | Dev server | Already installed |
| Vitest + @testing-library/* | 4.0.18 | Tests | Already installed and configured with jsdom |

### New Dependencies Required

None. All functionality is achievable with the existing stack:
- Segmented control → styled native radio buttons (no library)
- Expand/collapse animation → CSS `grid-rows` transition or `max-height` transition (Tailwind)
- Toast notification → `useState` + `setTimeout` + Tailwind CSS transition classes (no library)
- Clipboard → `navigator.clipboard.writeText()` (Web API, no library)

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom segmented control | headlessui RadioGroup or konsta-ui | External deps not justified for 3 preset buttons; headlessui is React-focused but adds 20KB+ |
| Custom toast | react-hot-toast or react-toastify | Sub-5KB toast libraries work well, but a custom `useState`+`setTimeout`+CSS solution is ~15 lines and perfectly sufficient for a single-message use case |
| `navigator.clipboard` | `document.execCommand('copy')` (deprecated) | `execCommand` is deprecated and not in WHATWG spec; `navigator.clipboard` is the standard and widely available since 2020 |

**Installation:**
```bash
# No new packages required for Phase 3
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── engine/              # (unchanged from Phase 1)
├── store/               # (unchanged from Phase 1)
├── components/
│   ├── layout/          # (unchanged from Phase 2)
│   │   ├── AppShell.tsx         # UPDATED: add 'split' tab + TipTaxPanel + SummaryPanel
│   │   ├── SubtotalBar.tsx      # (unchanged)
│   │   └── TabBar.tsx           # UPDATED: add 4th "Split" tab (or keep 3 tabs — see Open Questions)
│   ├── people/          # (unchanged)
│   ├── items/           # (unchanged)
│   ├── assignments/     # (unchanged)
│   ├── tip-tax/         # NEW
│   │   ├── TipTaxPanel.tsx      # Tip + Tax controls combined
│   │   ├── TipSegmentedControl.tsx  # Preset buttons + custom input
│   │   ├── TaxInput.tsx         # Dollar/% toggle + amount input
│   │   ├── SplitMethodToggle.tsx    # Equal/proportional radio pair (reused for tip and tax)
│   │   └── TipTaxPanel.test.tsx
│   └── summary/         # NEW
│       ├── SummaryPanel.tsx     # Bill total + person cards + rounding footer + copy-all
│       ├── PersonCard.tsx       # Collapsible card: name/total + detail drawer
│       ├── RoundingFooter.tsx   # Surplus display (hidden when $0.00)
│       ├── CopyButton.tsx       # Reusable copy icon button with toast trigger
│       ├── Toast.tsx            # Self-contained toast notification
│       └── SummaryPanel.test.tsx
├── hooks/
│   ├── useSubtotal.ts           # (unchanged)
│   └── useCopyToClipboard.ts    # NEW: clipboard write + toast state hook
└── utils/
    ├── currency.ts              # (unchanged)
    └── formatSummary.ts         # NEW: build the copy text string from results + people
```

### Pattern 1: Segmented Control (Radio-Button-Backed)

**What:** A row of equally-sized buttons where exactly one is always selected. Visually looks like an iOS segmented control with a sliding highlight or a flat "active" state.

**When to use:** Tip preset selection (15% / 18% / 20% / Custom). Also reusable for Split Method (Equal / Proportional).

**Implementation:** Native radio inputs hidden with `sr-only` or opacity-0, labels styled as buttons. Active segment gets a distinct background. No JS animation required for a simple version — CSS `:checked` state drives the visual.

**Simpler approach (no CSS variable sliding):** Each segment is a `<label>` with a hidden `<input type="radio">`. The active segment label gets a different background class. React state tracks the selected value.

```tsx
// src/components/tip-tax/TipSegmentedControl.tsx
// Confidence: HIGH — standard radio-button pattern, verified pattern from letsbuildui.dev

type TipPreset = '15' | '18' | '20' | 'custom';

interface Props {
  selected: TipPreset;
  onChange: (preset: TipPreset) => void;
}

const PRESETS: { value: TipPreset; label: string }[] = [
  { value: '15', label: '15%' },
  { value: '18', label: '18%' },
  { value: '20', label: '20%' },
  { value: 'custom', label: 'Custom' },
];

export function TipSegmentedControl({ selected, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Tip percentage"
      className="flex rounded-lg bg-gray-800 p-1 gap-1"
    >
      {PRESETS.map(({ value, label }) => (
        <label
          key={value}
          className={[
            'flex-1 flex items-center justify-center min-h-10 rounded-md text-sm font-medium cursor-pointer transition-colors',
            selected === value
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200',
          ].join(' ')}
        >
          <input
            type="radio"
            name="tip-preset"
            value={value}
            checked={selected === value}
            onChange={() => onChange(value)}
            className="sr-only"
          />
          {label}
        </label>
      ))}
    </div>
  );
}
```

**Custom tip reveal:** When `selected === 'custom'`, render a percentage input below the segmented control. On input change, compute `amountCents = Math.round(subtotal * pct / 100)` and call `setTip()`.

### Pattern 2: Expand/Collapse Card (CSS max-height transition)

**What:** A person card that shows name + total by default. Tapping it reveals a detail drawer (food subtotal, tip share, tax share) with a smooth open/close animation.

**When to use:** Each `PersonResult` card in the Summary panel.

**Implementation:** Two approaches work:
1. **`max-height` transition** (simpler, works in Tailwind today): `max-h-0 overflow-hidden` → `max-h-[200px] overflow-hidden` driven by a CSS transition. Simple but requires guessing a safe max height.
2. **`grid-rows` transition** (cleaner): `grid-rows-[0fr]` → `grid-rows-[1fr]` with `overflow-hidden` on the inner div. This is a CSS-native height-to-auto animation. Tailwind v4 supports arbitrary values.

**Recommendation:** Use `grid-rows` transition — it animates to the natural height without guessing a max. Tailwind v4's arbitrary value syntax (`grid-rows-[0fr]`, `grid-rows-[1fr]`) makes this clean.

```tsx
// src/components/summary/PersonCard.tsx
// Pattern: grid-rows expand/collapse animation

interface Props {
  person: Person;
  result: PersonResult;
  onCopy: (personId: PersonId) => void;
}

export function PersonCard({ person, result, onCopy }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl mb-3">
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-4 min-h-14"
      >
        <span className="text-gray-100 font-medium">{person.name}</span>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold tabular-nums text-lg">
            ${centsToDollars(result.roundedTotalCents)}
          </span>
          {/* Individual copy button */}
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(result.personId); }}
            aria-label={`Copy ${person.name}'s amount`}
            className="text-gray-500 hover:text-gray-300 min-w-8 min-h-8 flex items-center justify-center"
          >
            📋
          </button>
          <span className={`text-gray-500 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Expandable detail drawer */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Food</span>
              <span className="text-gray-200 tabular-nums">${centsToDollars(cents(result.foodCents))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tip</span>
              <span className="text-gray-200 tabular-nums">${centsToDollars(cents(result.tipCents))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tax</span>
              <span className="text-gray-200 tabular-nums">${centsToDollars(cents(result.taxCents))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Note on `gridTemplateRows` inline style:** Tailwind v4 arbitrary value `grid-rows-[0fr]` works for static classes but dynamic toggling between two arbitrary classes in Tailwind can cause purging issues. Using an inline `style` for the dynamic value + a Tailwind class for the transition is the safest pattern. The `transition-[grid-template-rows]` class requires Tailwind v3.2+ / v4 (arbitrary transition properties).

### Pattern 3: Clipboard Copy + Toast

**What:** `navigator.clipboard.writeText()` called directly from a click handler, followed by displaying a temporary toast notification.

**When to use:** "Copy all" button and individual person copy buttons.

**Critical constraint:** The `writeText()` call MUST happen synchronously within the click handler. Safari rejects clipboard writes that occur after any awaited operation. Do not `await` anything before calling `navigator.clipboard.writeText()`.

```tsx
// src/hooks/useCopyToClipboard.ts
// Confidence: HIGH — MDN spec, verified from multiple sources

import { useState, useCallback } from 'react';

export function useCopyToClipboard() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const copy = useCallback((text: string, message = 'Copied!') => {
    // Must be synchronous — no await before writeText (Safari requirement)
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage(message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }).catch(() => {
      // Fallback: execCommand (deprecated but works in rare cases)
      // For v1, safe to silently fail — user is on HTTPS/localhost
    });
  }, []);

  return { copy, showToast, toastMessage };
}
```

```tsx
// src/components/summary/Toast.tsx
// Simple, no-library toast — Tailwind CSS opacity transition

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed bottom-20 left-1/2 -translate-x-1/2',
        'bg-gray-800 text-gray-100 text-sm font-medium',
        'px-4 py-2 rounded-full shadow-lg',
        'transition-opacity duration-300 pointer-events-none',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      {message}
    </div>
  );
}
```

**Bottom positioning:** `bottom-20` (80px) clears the fixed tab bar at `bottom-0` (64px height). Adjust if tab bar height differs.

### Pattern 4: Tip Calculation from Percentage

**What:** Convert a tip percentage (15, 18, 20, or custom) to `amountCents` to pass to `setTip()`.

**When to use:** Any time a tip preset is selected or custom percentage is entered.

```tsx
// Tip %  to cents — requires reading subtotal from store
import { useSubtotal } from '../../hooks/useSubtotal';

function computeTipCents(pct: number, subtotalCents: number): number {
  return Math.round((pct / 100) * subtotalCents);
}

// Usage in TipTaxPanel:
const subtotal = useSubtotal(); // returns Cents
const handleTipPreset = (pct: number) => {
  const tipCents = computeTipCents(pct, subtotal);
  setTip(tipCents, tipMethod, tipIncludeZero);
};
```

**Note:** Tip amount changes when subtotal changes (if items are edited after setting tip). The simplest correct behavior: recalculate tip on every render from the stored percentage. This requires storing the tip *percentage* as UI state (local `useState`) separate from the `TipTaxConfig.amountCents` in the store. On every store-state change that updates subtotal, recompute `amountCents` and call `setTip()`.

**Simpler alternative:** Store the tip *amount in cents* directly; when subtotal changes, the percentage relationship is lost but the amount is stable. The user decides which is better. Research recommendation: store the percentage as local state and recompute — this is the "what did the user intend" model.

### Pattern 5: Tax Dollar/Percentage Mode

**What:** A toggle that switches the tax input between dollar amount mode ("$12.50") and percentage mode ("8.5%"). Both ultimately compute a `taxCents` value and call `setTax()`.

**When to use:** Tax input field.

**Implementation:** Local `useState` for mode. Reuse `filterPriceInput` / `dollarsToCents` utilities for dollar mode. Add a similar `filterPercentInput` for percentage mode.

```tsx
// Local state (not in Zustand — ephemeral input mode)
const [taxMode, setTaxMode] = useState<'dollar' | 'percent'>('dollar');
const [taxInput, setTaxInput] = useState('');

const handleTaxBlur = () => {
  if (taxMode === 'dollar') {
    const taxCents = dollarsToCents(taxInput) ?? 0;
    setTax(taxCents, taxMethod, taxIncludeZero);
  } else {
    const pct = parseFloat(taxInput);
    if (isFinite(pct) && pct >= 0) {
      const taxCents = Math.round((pct / 100) * subtotal);
      setTax(taxCents, taxMethod, taxIncludeZero);
    }
  }
};
```

**Toggle UX recommendation:** A paired button group ("$" | "%") to the left or right of the input field — similar in style to the segmented control but just two options. Simple, clear, no confusion.

### Pattern 6: Split Method Toggle (Reusable)

**What:** A two-option toggle for "Equal" vs "Proportional" split method, used independently for both tip and tax.

**When to use:** Once for tip, once for tax. Both read from and write to their respective `TipTaxConfig`.

```tsx
// src/components/tip-tax/SplitMethodToggle.tsx
interface Props {
  value: 'equal' | 'proportional';
  onChange: (method: 'equal' | 'proportional') => void;
  label: string; // e.g. "Tip split" or "Tax split"
}

export function SplitMethodToggle({ value, onChange, label }: Props) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-sm">{label}</span>
      <div className="flex rounded-lg bg-gray-800 p-0.5">
        {(['equal', 'proportional'] as const).map((method) => (
          <button
            key={method}
            onClick={() => onChange(method)}
            className={[
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              value === method
                ? 'bg-gray-700 text-gray-100'
                : 'text-gray-500',
            ].join(' ')}
          >
            {method === 'equal' ? 'Equal' : 'Proportional'}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Pattern 7: Summary Panel — Reading getResult()

**What:** Reading the engine result and rendering the per-person breakdown.

**When to use:** Summary panel on every render.

**Critical consideration:** `getResult()` calls `computeSplit()` fresh on every invocation. Call it once per render cycle and memoize locally if needed.

```tsx
// src/components/summary/SummaryPanel.tsx

export function SummaryPanel() {
  const { config, getResult } = useBillStore(
    useShallow((s) => ({ config: s.config, getResult: s.getResult }))
  );

  const result = getResult(); // computeSplit runs here

  if (!result.ok) {
    // Unassigned items — show a nudge back to the Assign tab
    return (
      <div className="p-4">
        <p className="text-amber-400 text-center">
          {result.unassignedItemIds.length} item(s) need assignment before calculating.
        </p>
      </div>
    );
  }

  // Bill total = sum of all roundedTotalCents
  const billTotal = result.results.reduce((s, r) => s + r.roundedTotalCents, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Bill total header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Bill total</span>
          <span className="text-white font-semibold text-lg tabular-nums">
            ${centsToDollars(cents(billTotal))}
          </span>
        </div>
      </div>

      {/* Person cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {result.results.map((personResult) => {
          const person = config.people.find(p => p.id === personResult.personId)!;
          return (
            <PersonCard
              key={personResult.personId}
              person={person}
              result={personResult}
              onCopy={handlePersonCopy}
            />
          );
        })}

        {/* Rounding footer — only when surplus > 0 */}
        {result.totalSurplusCents > 0 && (
          <RoundingFooter surplusCents={result.totalSurplusCents} />
        )}
      </div>

      {/* Copy all button */}
      <div className="px-4 py-3 border-t border-gray-800">
        <button
          onClick={handleCopyAll}
          className="w-full min-h-12 bg-blue-600 text-white font-medium rounded-xl active:bg-blue-700"
        >
          Copy summary
        </button>
      </div>
    </div>
  );
}
```

### Pattern 8: formatSummary Utility

**What:** Build the clipboard text from `EngineSuccess` result + `Person[]`.

**When to use:** In the "Copy all" handler.

```tsx
// src/utils/formatSummary.ts

import type { EngineSuccess, Person, PersonResult } from '../engine/types';
import { centsToDollars } from './currency';
import { cents } from '../engine/types';

export function formatSummary(result: EngineSuccess, people: Person[]): string {
  const lines = result.results.map((r) => {
    const person = people.find((p) => p.id === r.personId);
    const name = person?.name ?? 'Unknown';
    return `- ${name} owes $${centsToDollars(r.roundedTotalCents)}`;
  });

  const total = result.results.reduce((s, r) => s + r.roundedTotalCents, 0);

  return [
    'Bill Split:',
    ...lines,
    `Total: $${centsToDollars(cents(total))} (includes tip + tax)`,
  ].join('\n');
}

export function formatPersonSummary(result: PersonResult, name: string): string {
  return `${name} owes $${centsToDollars(result.roundedTotalCents)}`;
}
```

### Anti-Patterns to Avoid

- **Awaiting before clipboard write:** `await someAsyncOp(); navigator.clipboard.writeText(...)` fails on Safari. Build the text string synchronously, then write.
- **Storing `getResult()` output in Zustand state:** `getResult()` is a pure compute from `config`; the result is always derived. Storing it would create stale-data risk. Call it fresh in the component.
- **Storing tip/tax `amountCents` as the source of truth for UI display:** The UI should store the *percentage* or *input string* as local state and derive `amountCents` for store calls. If you only store cents, you lose the percentage value when the user re-opens the panel.
- **Calling `setTip()`/`setTax()` on every keystroke:** Debounce or call on blur to avoid triggering `computeSplit()` on every character typed.
- **Forgetting `e.stopPropagation()` on the individual copy button inside the card header button:** Without it, clicking the copy icon will also toggle the card's expanded state.
- **Using `type="number"` for percentage inputs:** Same reasoning as Phase 2 price inputs — use `type="text" inputmode="decimal"` for full control.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard text formatting | Custom serializer | `formatSummary()` helper (~15 lines) | Simple enough; no library justified |
| Toast notification | Custom notification system with portals/context | `useState`+`setTimeout`+CSS transition in-component | This app has one toast use-case; a library adds 5-50KB for no benefit |
| Segmented control | Third-party `segmented-control` npm package | Styled radio buttons + Tailwind | The npm `segmented-control` package has ~2k weekly downloads, last updated 2018; too risky |
| Per-person math | Any custom calculation | `getResult()` from the store — calls the tested `computeSplit()` engine | The engine is already 100% tested; duplicating math in components is dangerous |
| Expand/collapse JS animation | `requestAnimationFrame` height calculations | CSS `grid-rows` transition or `max-height` transition | CSS handles this cleanly; JS height measurement adds complexity and jank |
| Percentage-to-cents calculation | Custom formula | `Math.round((pct / 100) * subtotalCents)` — one line | There is no library needed; this is arithmetic |

**Key insight:** Phase 3 has zero new algorithmic complexity. All business logic lives in the engine (already built and tested). Phase 3 is 100% UI wiring — connect inputs to `setTip()`/`setTax()`, read `getResult()`, format and display.

---

## Common Pitfalls

### Pitfall 1: Safari Clipboard User-Gesture Requirement
**What goes wrong:** `navigator.clipboard.writeText()` is called inside a `.then()` callback after an async operation, or after a `setState` that triggers a re-render first. Safari rejects with `NotAllowedError`.
**Why it happens:** Safari requires clipboard writes to occur within the synchronous execution of a user gesture handler. Any await or deferred execution breaks this.
**How to avoid:** Build the text string synchronously before any async call. Call `navigator.clipboard.writeText(text)` as the first thing after receiving the click event, before any state updates.
**Warning signs:** Copy works in Chrome dev mode but fails when tested on an iPhone.

### Pitfall 2: Tip Percentage Stale After Item Changes
**What goes wrong:** User selects 18% tip, then adds another item. The tip `amountCents` in the store is now wrong (was computed from the old subtotal). The summary shows an incorrect tip amount.
**Why it happens:** `TipTaxConfig.amountCents` stores the dollar amount, not the percentage. When items change, the amount doesn't auto-update.
**How to avoid:** Store the tip *percentage* in local `useState` in the TipTaxPanel. On every render where the subtotal may have changed (detected via `useEffect` or by recomputing on render), call `setTip()` with the fresh computed amount.
**Warning signs:** Summary total doesn't match "18% of $XX.XX" after editing items.

### Pitfall 3: getResult() Called on Every Sub-Component Render
**What goes wrong:** `computeSplit()` is called repeatedly — once for each PersonCard rendering — because multiple components each call `getResult()`.
**Why it happens:** `getResult()` is a store method that runs `computeSplit()` from scratch every time. If multiple components call it, work is repeated.
**How to avoid:** Call `getResult()` once in `SummaryPanel` (the parent), then pass the result as props to `PersonCard` children.
**Warning signs:** Performance profiler shows `computeSplit` running N times per render where N = number of people.

### Pitfall 4: Cents Branded Type for foodCents/tipCents/taxCents
**What goes wrong:** Passing `result.foodCents` (typed as `number`, not `Cents`) directly to `centsToDollars()` which expects `Cents`. TypeScript error.
**Why it happens:** `PersonResult` types `foodCents`, `tipCents`, `taxCents` as plain `number` (not `Cents`), while `roundedTotalCents` is `Cents`. The distinction is intentional (see types.ts comments).
**How to avoid:** Wrap with `cents()` constructor when passing to display functions: `centsToDollars(cents(result.foodCents))`.
**Warning signs:** TypeScript error: "Argument of type 'number' is not assignable to parameter of type 'Cents'".

### Pitfall 5: CSS `grid-rows` Transition Arbitrary Classes and Tailwind Purging
**What goes wrong:** Dynamic classes like `grid-rows-[0fr]` and `grid-rows-[1fr]` used in conditional expressions may not be detected by Tailwind's content scanner and get purged from production builds.
**Why it happens:** Tailwind CSS v4 scans source for class strings. Classes constructed dynamically (e.g., `expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'`) are detected if the full strings appear verbatim, but may not be if constructed differently.
**How to avoid:** Use inline `style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}` for the dynamic value and a Tailwind class for the transition: `className="grid transition-[grid-template-rows] duration-200"`. This avoids the purge issue entirely.
**Warning signs:** Expand/collapse works in dev but breaks in production build (production CSS is missing the grid-rows values).

### Pitfall 6: includeZeroFoodPeople Toggle Not Exposed
**What goes wrong:** The store's `TipTaxConfig` has an `includeZeroFoodPeople` field, but there's no UI control for it in Phase 3's scope. If the default is `false` and a person ordered nothing (zero food), they pay no tip or tax in equal splits — which may surprise users.
**Why it happens:** Phase 3 requirements don't explicitly include a UI control for `includeZeroFoodPeople`. The store default is `false`.
**How to avoid:** The initial store default is `includeZeroFoodPeople: false`. When calling `setTip()` and `setTax()`, always pass `false` as the `includeZeroFoodPeople` argument unless the UI exposes a toggle. This is a valid v1 behavior — the feature is in the engine, the toggle is a v2 UI enhancement.
**Warning signs:** User confused when a person who "came but didn't order" pays no tip share.

---

## Code Examples

Verified patterns from existing codebase and research:

### Reading getResult() with Error Handling
```tsx
// Source: src/store/billStore.ts — getResult() API
const result = useBillStore((s) => s.getResult)();
// Note: getResult is a function stored in state; call it after selecting

// OR (cleaner):
const getResult = useBillStore((s) => s.getResult);
const result = getResult();

if (!result.ok) {
  // result.reason === 'unassigned_items'
  // result.unassignedItemIds: ItemId[]
  return <UnassignedWarning count={result.unassignedItemIds.length} />;
}

// result.ok === true
// result.results: PersonResult[]
// result.totalSurplusCents: number
```

### Tip Preset → setTip()
```tsx
// Source: src/store/billStore.ts — setTip() signature
// setTip(amountCents: number, method: 'equal' | 'proportional', includeZeroFoodPeople: boolean)

const setTip = useBillStore((s) => s.setTip);
const subtotal = useSubtotal(); // Cents

const handleTipPreset = (pct: 15 | 18 | 20) => {
  const tipCents = Math.round((pct / 100) * subtotal);
  setTip(tipCents, tipMethod, false);
};
```

### Copy All with formatSummary
```tsx
// Source: MDN Clipboard API + existing codebase patterns
const { copy } = useCopyToClipboard();
const getResult = useBillStore((s) => s.getResult);
const people = useBillStore((s) => s.config.people);

const handleCopyAll = () => {
  const result = getResult();
  if (!result.ok) return;
  const text = formatSummary(result, people);
  copy(text, 'Summary copied!');
};
```

### Rounding Footer
```tsx
// Source: src/engine/types.ts — EngineSuccess.totalSurplusCents
// totalSurplusCents: number (sum of all per-person surplus, >= 0)

function RoundingFooter({ surplusCents }: { surplusCents: number }) {
  // Only rendered when surplusCents > 0 (parent hides when 0)
  return (
    <div className="mt-2 px-4 py-3 bg-gray-900 rounded-xl">
      <p className="text-gray-500 text-xs text-center">
        +${centsToDollars(cents(surplusCents))} rounding surplus collected
        (cents rounded up per person)
      </p>
    </div>
  );
}
```

### Tab Addition: Adding "Split" as 4th Tab
```tsx
// Source: src/components/layout/TabBar.tsx — existing Tab type
// Current: export type Tab = 'people' | 'items' | 'assignments';
// Updated:
export type Tab = 'people' | 'items' | 'assignments' | 'split';

const TABS: { id: Tab; label: string }[] = [
  { id: 'people', label: 'People' },
  { id: 'items', label: 'Items' },
  { id: 'assignments', label: 'Assign' },
  { id: 'split', label: 'Split' },  // 4th tab
];
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Clipboard API widely available since 2020 | `execCommand` is deprecated in WHATWG spec; `navigator.clipboard` is async, Promise-based |
| `type="number"` for percentage inputs | `type="text" inputmode="decimal"` | Widely adopted 2020+ | Full control over formatting, no browser spinner buttons |
| Hardcoded height for expand/collapse | CSS `grid-rows-[0fr]`/`[1fr]` transition or `max-h` | CSS Grid animation support 2023+ | Animates to natural content height without JS measurement |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated, removed from WHATWG spec; use `navigator.clipboard.writeText()`.
- Fixed-height expand/collapse (`max-height: 1000px` trick): Works but causes lag because the transition runs for the full 1000px duration even for small content. Use `grid-rows` or JavaScript-measured height instead.
- `segmented-control` npm package: Last updated 2018, incompatible with modern React; build with styled radio buttons.

---

## Discretion Recommendations

### Custom Tip Input UX

**Recommendation:** 4th "Custom" segment in the segmented control. When selected, a text input with "%" suffix slides in below the control. On blur, the percentage is computed against the current subtotal and `setTip()` is called.

Rationale: One consistent control row for all tip options. The reveal pattern (show input when "Custom" is active) is common on mobile (iOS Tip Calculator, Venmo, etc.). Avoids a separate input that confuses users about whether to type "18" or "0.18".

### Tax Dollar/Percentage Toggle

**Recommendation:** Paired button group ("$" | "%") to the left of the tax input field. Compact, clear. Switching mode clears the input to avoid confusion (a value entered as "$8.50" would need to be reinterpreted as percentage, which is meaningless).

### Person Ordering

**Recommendation:** Insertion order (order added). This is the simplest, most predictable ordering. Users add people in the order they're sitting around the table. Alphabetical would disrupt that mental model. Highest-to-lowest ordering would shift positions as values change, which is disorienting.

### "Copy All" Button Placement

**Recommendation:** Fixed at the bottom of the Summary panel, above the tab bar. This mirrors the common mobile pattern (primary action at bottom thumb reach, e.g., WhatsApp send button, iOS share sheet). A sticky bottom bar within the summary panel content area works well.

### Rounding Footer Wording

**Recommendation:** Simple, factual: "+$0.XX collected (cents rounded up per person)". No need to explain the math in detail — the expandable card detail already shows each person's breakdown. The footer is a transparency note, not a tutorial.

---

## Open Questions

1. **4th tab "Split" vs. integrating Tip/Tax + Summary into existing tabs**
   - What we know: The current AppShell has 3 tabs. Phase 3 adds Tip/Tax controls AND a Summary panel. These could go in a 4th tab, or be split across existing tabs.
   - Options: (a) 4th "Split" tab containing both TipTaxPanel + SummaryPanel vertically stacked, (b) separate "Tip/Tax" and "Summary" as two new tabs (total 5 tabs — too many), (c) keep 3 tabs but put tip/tax in "Items" tab and summary at the top.
   - Recommendation: **4th "Split" tab** containing both panels. Single destination for "get the answer." Tip/Tax is logically paired with the output. 4 tabs fit well on mobile without crowding.

2. **Should tip/tax controls re-compute when subtotal changes?**
   - What we know: If user sets 18% tip, adds an item, the stored `amountCents` is now wrong.
   - Options: (a) Store percentage as local state, recompute on subtotal change via `useEffect`; (b) store dollar amount in store only, accept that percentage relationship is "lost" after setting; (c) add `tipPercent` / `taxPercent` fields to the store.
   - Recommendation: **(a)** Store percentage as local `useState` in TipTaxPanel, recompute on subtotal change. This keeps the store simple (only `amountCents`) and keeps the UI feeling "live." This is Phase 3 discretion territory.

3. **What happens when `getResult()` returns `EngineError` on the Split tab?**
   - What we know: The engine returns `unassigned_items` error when any item has no assigned people.
   - Options: (a) Show an error message with a button to go back to Assign tab; (b) disable the Split tab entirely when there are unassigned items.
   - Recommendation: **(a)** Show a friendly error state inside the Split tab — don't disable the tab. "2 items need assignment before you can split." Disabling tabs is confusing on mobile.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/engine/types.ts`, `src/store/billStore.ts`, `src/engine/engine.ts` — verified `PersonResult`, `EngineSuccess`, `setTip()`, `setTax()`, `getResult()` APIs
- Existing codebase: `src/components/assignments/AssignmentPanel.tsx`, `AssignmentRow.tsx` — verified component patterns (expand/collapse, Zustand selectors, `useShallow`)
- Existing codebase: `src/utils/currency.ts` — verified `dollarsToCents()`, `centsToDollars()` helpers
- [MDN Clipboard API - writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) — clipboard API behavior, secure context requirement, Promise interface
- Phase 2 RESEARCH.md — established patterns: dark color palette, `useShallow`, `// @vitest-environment jsdom`, `type="text" inputmode="decimal"`, `useBillStore.getState().reset()` in tests

### Secondary (MEDIUM confidence)
- [letsbuildui.dev - Building a Segmented Control](https://www.letsbuildui.dev/articles/building-a-segmented-control-component/) — radio-button-backed segmented control pattern with CSS variables (Jan 2024)
- [LogRocket - Copy to Clipboard in React](https://blog.logrocket.com/implementing-copy-clipboard-react-clipboard-api/) — React + Clipboard API integration patterns
- [Apple Developer Forums - Safari Clipboard writeText](https://developer.apple.com/forums/thread/691873) — Safari user gesture requirement for clipboard
- [wolfgangrittner.dev - Clipboard API in Safari async](https://wolfgangrittner.dev/how-to-use-clipboard-api-in-safari/) — ClipboardItem pattern for async Safari workaround

### Tertiary (LOW confidence)
- WebSearch results on `grid-rows` CSS transition for expand/collapse — consistent across multiple sources but specific Tailwind v4 arbitrary value purge behavior needs validation in this project's build

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; no new deps; verified from package.json
- Segmented control pattern: HIGH — radio-button approach is well-established, verified from multiple sources
- Expand/collapse animation: MEDIUM — `grid-rows` CSS transition is the modern approach but the Tailwind v4 purge behavior of arbitrary classes needs validation; inline style fallback recommended
- Clipboard API: HIGH — MDN spec, widely available since 2020; Safari user-gesture requirement verified from Apple Developer Forums
- Custom toast (no library): HIGH — straightforward `useState`+`setTimeout`+CSS; well within project's existing patterns
- Tip percentage stale-on-item-change: HIGH — identified architectural issue with clear solution (local state for percentage)
- Architecture (component structure): HIGH — follows Phase 2 established patterns exactly

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable stack; 30-day horizon is safe)
