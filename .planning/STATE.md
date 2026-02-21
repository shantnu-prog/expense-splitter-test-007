# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.
**Current focus:** Phase 3 — Output

## Current Position

Phase: 3 of 4 (Output) — COMPLETE
Plan: 2 of 2 in current phase — All plans complete
Status: Phase 3 complete — Full bill-splitting flow end-to-end functional; per-person summary panel with copy-to-clipboard built and human-verified on mobile viewport
Last activity: 2026-02-21 — 03-02 complete: SummaryPanel with expandable PersonCards, rounding footer, copy-to-clipboard (Toast + useCopyToClipboard), 12 new tests — ~123 total

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 3 min
- Total execution time: 0.20 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 9 min | 3 min |
| 02-data-entry | 3 | 10 min | 3.3 min |

**Recent Trend:**
- Last 5 plans: 01-02 (3 min), 01-03 (2 min), 02-01 (3 min), 02-02 (2 min), 02-03 (5 min)
- Trend: consistent ~2-5 min per plan (human verify checkpoints add time)

*Updated after each plan completion*
| Phase 03-output P01 | 3 min | 2 tasks | 7 files |
| Phase 03-output P02 | 5 min | 3 tasks | 10 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Stack — React 19 + TypeScript + Vite + Tailwind CSS 4 + Zustand 5 + Vitest (research-recommended; verify versions with npm info before install)
- [Init]: All monetary values stored as integer cents throughout the engine; convert to dollars only at display
- [Init]: Client-side only for v1; no backend, no auth, no persistence
- [Phase 01-foundation]: Vitest passWithNoTests: true — Vitest 4.x exits code 1 when no test files; passWithNoTests required for zero-test phase
- [Phase 01-foundation]: Cents branded type: number & { __brand: 'Cents' } — encodes integer-cents-everywhere contract at compile time
- [Phase 01-foundation]: TipTaxConfig.includeZeroFoodPeople is per-split (on each TipTaxConfig) not global — encodes locked CONTEXT.md decision
- [Phase 01-foundation]: EngineResult discriminated union with unassigned_items error — blocks calculation when any item has no assigned people
- [Phase 01-foundation 01-02]: distributeIntegerCents uses floor-then-award-extras pattern (largest-remainder) producing deterministic output [4,3,3] for 10/3
- [Phase 01-foundation 01-02]: includeZeroFoodPeople only affects equal splits — proportional split weight=0 mathematically yields 0 share regardless
- [Phase 01-foundation 01-02]: Empty bill (no items) is valid — returns ok:true with all-zero results; validation only blocks items that exist with no assignees
- [Phase 01-foundation 01-03]: Dual export useBillStore (React hook via create) + createBillStore (vanilla factory via createStore) from shared stateCreator — avoids code duplication while enabling isolated test instances
- [Phase 01-foundation 01-03]: removePerson leaves unassigned items in-place with empty assignment array — engine returns unassigned_items error, blocking calc until user reassigns or deletes item
- [Phase 01-foundation 01-03]: getResult() is a store method calling computeSplit() fresh on each call — no derived data stored in Zustand state
- [Phase 02-data-entry 02-01]: Bottom tab bar (not top) — better one-thumb mobile reach at restaurant table
- [Phase 02-data-entry 02-01]: All panels mounted via CSS hidden class — preserves scroll position and input state on tab switch; unmount/remount would lose state
- [Phase 02-data-entry 02-01]: Active tab in local useState, not Zustand — ephemeral UI navigation state, not domain data
- [Phase 02-data-entry 02-01]: dollarsToCents checks for leading minus sign before stripping chars — "-5.00" must return null, not 500
- [Phase 02-data-entry 02-02]: ItemRow syncs local state on item.id change only (not priceCents) — prevents overwriting user's in-progress price entry when store updates
- [Phase 02-data-entry 02-02]: addItem('', 0, 1) for + button creates empty row for inline editing — no modal needed
- [Phase 02-data-entry 02-02]: Label revert on empty blur — empty name input reverts to store value, avoiding empty-string labels in store
- [Phase 02-data-entry 02-03]: Item-centric expand-to-assign layout — matches "who ate this item?" mental model at restaurant table
- [Phase 02-data-entry 02-03]: Everyone toggle shows "Deselect All" when all assigned — single button serves both mass-assign and mass-deselect
- [Phase 02-data-entry 02-03]: Amber "!" badge (not red) for unassigned items — visible but non-alarming in dim restaurant lighting
- [Phase 03-output]: TipSegmentedControl exposes onCustomBlur callback for deferred setTip on blur, not on every keystroke
- [Phase 03-output]: TipTaxPanel stores tip as percentage locally (preset + customPct string), not as dollar amount, enabling subtotal recalculation via useEffect
- [Phase 03-output]: TaxInput clears value on mode switch (dollar to percent) to prevent ambiguity between dollar amounts and percentage values
- [Phase 03-output 03-02]: getResult() called once at SummaryPanel top, result passed to children — avoids N redundant computeSplit() calls (one per PersonCard)
- [Phase 03-output 03-02]: Rounding surplus footer hidden entirely when surplusCents === 0 — no empty footer in the common case
- [Phase 03-output 03-02]: navigator.clipboard.writeText called synchronously (no await before it) — Safari user-gesture clipboard permission model requires synchronous call
- [Phase 03-output 03-02]: PersonCard uses CSS grid-rows transition (1fr/0fr) for expand/collapse — pure CSS, no JS height calculation needed

### Pending Todos

None yet.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-21
Stopped at: Completed 03-02-PLAN.md — SummaryPanel with expandable cards, copy-to-clipboard, human-verified; Phase 3 complete
Resume file: None
