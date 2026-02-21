---
phase: 03-output
plan: "02"
subsystem: ui
tags: [react, zustand, tailwind, vitest, testing-library, clipboard]

# Dependency graph
requires:
  - phase: 03-output
    plan: "01"
    provides: TipTaxPanel wired to store, 4th "Split" tab in AppShell, setTip/setTax store actions
  - phase: 01-foundation
    provides: computeSplit engine, getResult() store method, Cents branded type, centsToDollars/cents() utilities
  - phase: 02-data-entry
    provides: AppShell layout pattern, useBillStore with people/items/assignments, CSS-hidden tab mounting
provides:
  - SummaryPanel: bill total header + per-person expandable cards + rounding footer + copy-all button
  - PersonCard: collapsible card with name/total header and food/tip/tax detail drawer with CSS grid-rows animation
  - RoundingFooter: surplus display hidden when $0.00
  - CopyButton: reusable copy icon button with stopPropagation
  - Toast: fixed-position toast notification with opacity transition
  - useCopyToClipboard: clipboard write + toast state hook (Safari-safe synchronous writeText)
  - formatSummary utility: builds labeled clipboard text from EngineSuccess + Person[]
  - formatPersonSummary utility: builds individual person clipboard line
affects: [04-polish (phase 4 will read these components for styling/refinement)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS grid-rows transition pattern for expand/collapse animation (gridTemplateRows 1fr/0fr with overflow-hidden inner div)
    - Synchronous navigator.clipboard.writeText call (no await before writeText - Safari user-gesture requirement)
    - getResult() called once at top of SummaryPanel component (not in children - avoids redundant computeSplit calls)
    - useShallow selector for selecting multiple store values in a single useBillStore call

key-files:
  created:
    - src/utils/formatSummary.ts
    - src/utils/formatSummary.test.ts
    - src/hooks/useCopyToClipboard.ts
    - src/components/summary/SummaryPanel.tsx
    - src/components/summary/SummaryPanel.test.tsx
    - src/components/summary/PersonCard.tsx
    - src/components/summary/RoundingFooter.tsx
    - src/components/summary/CopyButton.tsx
    - src/components/summary/Toast.tsx
  modified:
    - src/components/layout/AppShell.tsx

key-decisions:
  - "getResult() called once at SummaryPanel top, result passed to children — avoids N redundant computeSplit() calls (one per PersonCard)"
  - "Rounding surplus footer hidden entirely when surplusCents === 0 — no empty footer in the common case"
  - "clipboard.writeText called synchronously (no await before it) — required by Safari's user-gesture clipboard permission model"
  - "PersonCard uses CSS grid-rows transition (1fr/0fr) for expand/collapse — pure CSS animation, no height calculation needed"
  - "CopyButton calls e.stopPropagation() before onClick — prevents card expand/collapse from firing on copy icon tap"

patterns-established:
  - "Single getResult() call pattern: call expensive store selectors once at parent, pass result as prop to children"
  - "CSS grid-rows expand/collapse: gridTemplateRows 1fr->0fr with inner overflow-hidden div, no JS height measurement"
  - "Safari clipboard pattern: call writeText synchronously in click handler, use .then()/.catch() for side effects only"

requirements-completed: [SUMM-01, SUMM-03]

# Metrics
duration: 5min
completed: 2026-02-21
---

# Phase 3 Plan 02: Summary Panel Summary

**Per-person summary panel with expandable detail cards (food/tip/tax), rounding surplus footer, copy-to-clipboard with toast, and 12 tests — completing the full end-to-end bill-splitting flow**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-21T09:35:33Z
- **Completed:** 2026-02-21T09:37:40Z (code complete) + human verify approved
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 10

## Accomplishments
- Built SummaryPanel as the app's output layer: bill total header, per-person expandable cards, rounding footer (hidden when zero), copy-all button at bottom
- Built PersonCard with CSS grid-rows expand/collapse animation showing food/tip/tax breakdown; CopyButton with stopPropagation to prevent card toggle on copy tap
- Built useCopyToClipboard hook with Safari-safe synchronous writeText call; Toast component with fixed positioning above tab bar; formatSummary/formatPersonSummary utilities for clipboard text
- Wired SummaryPanel into AppShell's Split tab below TipTaxPanel; 12 new tests (4 utility + 8 component) added to the suite
- Human verification approved: full Split tab flow verified on mobile viewport including tip presets, tax input, expand/collapse cards, rounding footer, copy with toast, error state for unassigned items, tip recalculation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create summary components, formatSummary utility, and useCopyToClipboard hook** - `5806e42` (feat)
2. **Task 2: Wire SummaryPanel into AppShell and write tests** - `b9d34d0` (feat)
3. **Task 3: Verify complete Split tab flow on mobile viewport** - Human approved (no commit — verification only)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/utils/formatSummary.ts` - Pure utility building clipboard text: formatSummary() for full bill, formatPersonSummary() for individual person
- `src/utils/formatSummary.test.ts` - 4 unit tests: labeled format, single person, individual line, roundedTotalCents vs exactTotalCents
- `src/hooks/useCopyToClipboard.ts` - Clipboard + toast state hook; copy() calls writeText synchronously then uses .then() for toast side effects
- `src/components/summary/SummaryPanel.tsx` - Main panel: calls getResult() once, renders bill total, PersonCards, RoundingFooter (conditional), copy-all button, Toast
- `src/components/summary/SummaryPanel.test.tsx` - 8 component tests: bill total, person cards, rounded total, expand/collapse, rounding footer visibility, error state, copy button
- `src/components/summary/PersonCard.tsx` - Expandable card with name/total header; CSS grid-rows animation for food/tip/tax drawer; CopyButton with stopPropagation
- `src/components/summary/RoundingFooter.tsx` - Surplus display; only rendered by parent when surplusCents > 0
- `src/components/summary/CopyButton.tsx` - Reusable copy icon button; calls e.stopPropagation() before onClick
- `src/components/summary/Toast.tsx` - Fixed-position toast at bottom-20 (clears tab bar); role="status" aria-live="polite"; opacity transition
- `src/components/layout/AppShell.tsx` - Added SummaryPanel import and rendering below TipTaxPanel in the split tab panel

## Decisions Made
- `getResult()` called once at the top of SummaryPanel and result passed to children — avoids redundant computeSplit() execution (one call per PersonCard otherwise)
- Rounding surplus footer hidden entirely when `surplusCents === 0` — cleaner UI in the common zero-surplus case; footer only appears when there is actual surplus to explain
- `navigator.clipboard.writeText()` called synchronously (no await before it) — Safari requires clipboard write to happen within the user gesture handler synchronously; .then()/.catch() used for toast side effects only
- PersonCard uses CSS `grid-template-rows` transition (1fr → 0fr) — pure CSS animation requires no JS height measurement, works with dynamic content
- CopyButton calls `e.stopPropagation()` before invoking onClick — prevents the parent card's click handler from firing when user taps the copy icon

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 is now complete: full bill-splitting flow end-to-end functional (People → Items → Assign → Split tab with Tip/Tax + Summary)
- Phase 4 (Polish) can focus on visual refinement, edge cases, and UX improvements on top of the complete functional foundation
- All tests passing (111 prior + 12 new = ~123 total); clean production build verified

## Self-Check: PASSED

- src/utils/formatSummary.ts: FOUND
- src/utils/formatSummary.test.ts: FOUND
- src/hooks/useCopyToClipboard.ts: FOUND
- src/components/summary/SummaryPanel.tsx: FOUND
- src/components/summary/SummaryPanel.test.tsx: FOUND
- src/components/summary/PersonCard.tsx: FOUND
- src/components/summary/RoundingFooter.tsx: FOUND
- src/components/summary/CopyButton.tsx: FOUND
- src/components/summary/Toast.tsx: FOUND
- src/components/layout/AppShell.tsx: FOUND (modified)
- Commit 5806e42 (Task 1): FOUND
- Commit b9d34d0 (Task 2): FOUND

---
*Phase: 03-output*
*Completed: 2026-02-21*
