---
phase: 03-output
plan: "01"
subsystem: ui
tags: [react, zustand, tailwind, vitest, testing-library]

# Dependency graph
requires:
  - phase: 02-data-entry
    provides: TabBar/AppShell layout, CSS-hidden tab pattern, useBillStore with setTip/setTax actions
  - phase: 01-foundation
    provides: Zustand store with setTip/setTax, engine types, currency utils (dollarsToCents, filterPriceInput), useSubtotal hook
provides:
  - TipSegmentedControl: iOS-style segmented control for 15/18/20/Custom tip presets
  - TaxInput: dollar/percent mode toggle with input, clears on mode switch
  - SplitMethodToggle: reusable equal/proportional toggle for tip and tax
  - TipTaxPanel: combined panel wiring all controls to Zustand store via setTip/setTax
  - 4th "Split" tab in TabBar and AppShell
affects: [03-output (plan 02 - results panel reads tip/tax config set here)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - onCustomBlur callback pattern in TipSegmentedControl for deferred store updates
    - useEffect watching subtotal to auto-recalculate percentage-based tip on item change
    - CSS hidden mounting in AppShell (all 4 panels mounted, tab switch only toggles visibility)

key-files:
  created:
    - src/components/tip-tax/SplitMethodToggle.tsx
    - src/components/tip-tax/TipSegmentedControl.tsx
    - src/components/tip-tax/TaxInput.tsx
    - src/components/tip-tax/TipTaxPanel.tsx
    - src/components/tip-tax/TipTaxPanel.test.tsx
  modified:
    - src/components/layout/TabBar.tsx
    - src/components/layout/AppShell.tsx

key-decisions:
  - "TipSegmentedControl exposes onCustomBlur callback for deferred setTip on blur, not on every keystroke"
  - "TipTaxPanel stores tip as percentage (preset + customPct string), not as dollar amount, enabling subtotal recalculation via useEffect"
  - "TaxInput clears value on mode switch (dollar <-> percent) to avoid confusion between dollar amounts and percentages"
  - "Pass includeZeroFoodPeople: false to all setTip/setTax calls — no UI control for this in Phase 3 per research recommendation"

patterns-established:
  - "Percentage-state pattern: store tip as preset + custom string locally, compute cents only on blur/select"
  - "onBlur deferred store write: avoid re-rendering store on every keystroke, only write on commit"

requirements-completed: [TPTX-01, TPTX-03]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 3 Plan 01: Tip/Tax Input Panel Summary

**Segmented tip control (15/18/20/Custom), tax dollar/percent input, independent split method toggles, and a 4th "Split" tab wired to Zustand store via setTip()/setTax() with auto-recalculation on subtotal change**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-21T09:27:45Z
- **Completed:** 2026-02-21T09:30:48Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Built TipSegmentedControl with iOS-style hidden-radio segmented control and a custom percentage input that appears on "Custom" selection
- Built TaxInput with dollar/percent mode toggle that clears the input on mode switch to prevent dollar/percent confusion
- Built SplitMethodToggle as a reusable equal/proportional paired button group, used independently for tip and tax
- Built TipTaxPanel composing all controls, wired to store via setTip()/setTax(), with useEffect auto-recalculation when subtotal changes
- Added 4th "Split" tab to TabBar and mounted TipTaxPanel in AppShell using the established CSS-hidden pattern
- 8 new component tests (all passing), 111 total tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tip/tax components and wire to store** - `c581400` (feat)
2. **Task 2: Add 4th "Split" tab and mount TipTaxPanel with tests** - `af6eeb1` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/components/tip-tax/SplitMethodToggle.tsx` - Reusable equal/proportional toggle (paired button group, active/inactive styling)
- `src/components/tip-tax/TipSegmentedControl.tsx` - iOS-style segmented control for 15/18/20/Custom with hidden radio inputs and custom text input on select
- `src/components/tip-tax/TaxInput.tsx` - Tax input with dollar/percent mode toggle, clears value on mode switch
- `src/components/tip-tax/TipTaxPanel.tsx` - Combined panel composing all controls, wired to Zustand store, auto-recalculates tip % on subtotal change
- `src/components/tip-tax/TipTaxPanel.test.tsx` - 8 component tests: preset selection, custom tip blur, dollar/percent tax, mode switch clear, independent method toggles
- `src/components/layout/TabBar.tsx` - Extended Tab union to include 'split', added 4th TABS entry
- `src/components/layout/AppShell.tsx` - Imported TipTaxPanel, added 4th CSS-hidden panel for 'split' tab

## Decisions Made
- TipSegmentedControl exposes `onCustomBlur` callback for deferred setTip on blur, not on every keystroke — avoids unnecessary store writes mid-entry
- TipTaxPanel stores tip as percentage locally (preset + customPct string), not as dollar amount — enables subtotal recalculation via useEffect without losing the user's chosen percentage
- TaxInput clears value on mode switch — prevents ambiguity between dollar amounts and percentage values when switching modes
- `includeZeroFoodPeople: false` passed to all setTip/setTax calls — no UI control for this in Phase 3 per research recommendation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added onCustomBlur prop to TipSegmentedControl**
- **Found during:** Task 1 (creating TipTaxPanel)
- **Issue:** TipSegmentedControl only had `onCustomChange` (fires on keystroke) but TipTaxPanel needed to call setTip only on blur. Without `onCustomBlur`, setTip would fire on every keystroke during custom percentage entry.
- **Fix:** Added optional `onCustomBlur?: () => void` prop; called in the internal `handleCustomBlur` after sanitizing the value
- **Files modified:** src/components/tip-tax/TipSegmentedControl.tsx, src/components/tip-tax/TipTaxPanel.tsx
- **Verification:** Build passes, custom tip test verifies store value after blur
- **Committed in:** c581400 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Auto-fix necessary for correct UX — avoids noisy store writes on every keystroke. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Split tab UI complete; tip and tax are now configurable in the store
- Phase 3 Plan 02 (results/summary panel) can read `config.tip` and `config.tax` from store to compute per-person totals
- All 111 tests passing; clean production build

## Self-Check: PASSED

- src/components/tip-tax/SplitMethodToggle.tsx: FOUND
- src/components/tip-tax/TipSegmentedControl.tsx: FOUND
- src/components/tip-tax/TaxInput.tsx: FOUND
- src/components/tip-tax/TipTaxPanel.tsx: FOUND
- src/components/tip-tax/TipTaxPanel.test.tsx: FOUND
- .planning/phases/03-output/03-01-SUMMARY.md: FOUND
- Commit c581400 (Task 1): FOUND
- Commit af6eeb1 (Task 2): FOUND
- All 111 tests passing verified

---
*Phase: 03-output*
*Completed: 2026-02-21*
