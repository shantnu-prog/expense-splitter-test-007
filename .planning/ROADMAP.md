# Roadmap: Expense Splitter

## Overview

Build a client-side restaurant bill splitter in four phases ordered by dependency and risk. Phase 1 establishes the math engine and TypeScript foundation before any UI exists — four of the six critical pitfalls (floating-point errors, rounding order, proportional distribution, stale derived state) live here, and building UI on unverified math means debugging math through the UI. Phase 2 builds the full data entry flow (people, items, assignments) so the store has real data to work with. Phase 3 delivers the visible product: tip/tax configuration and the per-person summary that is the app's entire purpose. All 17 v1 requirements are covered across these three phases, with Phase 4 reserved for v1.x polish that is additive and does not touch the engine.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Math engine, TypeScript types, Zustand store, and Vitest test suite — no UI, all correctness
- [x] **Phase 2: Data Entry** - People, items, and assignment panels — fully working bill input on mobile (completed 2026-02-18)
- [ ] **Phase 3: Output** - Tip/tax configuration and per-person summary — the visible product
- [ ] **Phase 4: Polish** - Copy-friendly output, quantity fields, keyboard navigation, UX refinements

## Phase Details

### Phase 1: Foundation
**Goal**: The calculation engine computes correct per-person totals for all bill configurations — shared items, proportional tip and tax, and rounded-up totals — verified by tests before any UI exists
**Depends on**: Nothing (first phase)
**Requirements**: ASGN-02, TPTX-02, TPTX-04, SUMM-02
**Success Criteria** (what must be TRUE):
  1. A Vitest test suite passes for party sizes 1–10 across all tip split methods (equal and proportional), all tax split methods (equal and proportional), and mixed shared/individual item assignments
  2. Proportional tip and tax distribution: the sum of all per-person shares equals the exact tip/tax total (no penny gaps), verified by the largest-remainder test cases
  3. Each person's total is rounded up to the nearest cent and the rounding surplus is computed and accessible for display (not silently discarded)
  4. Shared items split equally among only the people who shared them (not the whole table), verified by test cases with subset assignments
  5. The Zustand store holds only input data — people, items, assignments, tip config, tax config — and no stored derived totals; all totals are computed fresh from the engine
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Project scaffold (Vite + React + TypeScript + Tailwind + Zustand + Vitest) and TypeScript type definitions
- [ ] 01-02-PLAN.md — Calculation engine (TDD) — integer-cent arithmetic, shared item allocation, proportional distribution with largest-remainder reconciliation
- [ ] 01-03-PLAN.md — Zustand store — input-only state shape, actions, and Vitest integration tests

### Phase 2: Data Entry
**Goal**: Users can add everyone at the table, enter every line item from the receipt, and assign each item to the right people — with the running subtotal visible as they go — on a phone browser without mistyping
**Depends on**: Phase 1
**Requirements**: PEOP-01, PEOP-02, ITEM-01, ITEM-02, ITEM-03, ITEM-04, ITEM-05, ASGN-01, UX-01
**Success Criteria** (what must be TRUE):
  1. User can add people by name, see them listed, and remove any person from the bill
  2. User can add a line item with a name, price, and quantity; edit any of those fields; and remove the item — with the running subtotal updating immediately after each change
  3. User can assign each item to one specific person, to multiple specific people (shared subset), or to everyone at the table
  4. If an item has no one assigned, the app shows a visible error and blocks the summary calculation until the assignment is resolved
  5. The full data entry flow works on a phone screen with tap targets large enough to use without zooming, and price inputs trigger the numeric decimal keyboard on iOS and Android
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Test infrastructure, currency utilities, and app shell (dark theme, bottom tabs, sticky subtotal)
- [ ] 02-02-PLAN.md — People panel (add/remove/validate) and Items panel (inline edit, price input, quantity stepper)
- [ ] 02-03-PLAN.md — Assignment panel (item-centric checklists, Everyone button, unassigned warnings) and visual checkpoint

### Phase 3: Output
**Goal**: Users can configure tip and tax (with split method) and see the final per-person breakdown showing exactly what each person owes — the complete, correct bill split
**Depends on**: Phase 2
**Requirements**: TPTX-01, TPTX-03, SUMM-01, SUMM-03
**Success Criteria** (what must be TRUE):
  1. User can select tip as 15%, 18%, or 20% via preset buttons, or type a custom percentage, and the selected tip is reflected in every person's total
  2. User can enter tax as either a dollar amount or a percentage, and the entered tax is reflected in every person's total
  3. The per-person summary shows each person's name and the total they owe, rounded up to the nearest cent, with the rounding surplus displayed (so the math is transparent)
  4. User can copy a formatted text summary (e.g., "Alice owes $23.50 / Bob owes $18.00") to the clipboard with a single tap
**Plans**: TBD

Plans:
- [ ] 03-01: Tip/Tax panel — preset buttons, custom input, split method selectors (equal vs. proportional)
- [ ] 03-02: Summary panel — per-person totals, rounding surplus display, copy-to-clipboard output

### Phase 4: Polish
**Goal**: The app feels complete and professional — keyboard-friendly, forgiving of typos, and ready for users to share with friends
**Depends on**: Phase 3
**Requirements**: (none — all v1 requirements covered in Phases 1–3; Phase 4 addresses v1.x competitive features from research)
**Success Criteria** (what must be TRUE):
  1. User can navigate the entire bill entry flow using only a keyboard (tab order is logical, no focus traps)
  2. Deleting an item or person prompts a confirmation or offers an immediate undo, preventing accidental data loss
  3. Empty states (no people added, no items added, nothing assigned) show clear guidance rather than blank panels or broken layouts
**Plans**: TBD

Plans:
- [ ] 04-01: Keyboard navigation, empty states, and deletion safety (confirmation / undo)
- [ ] 04-02: Final mobile QA pass and UX refinements

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-02-19 |
| 2. Data Entry | 3/3 | Complete   | 2026-02-18 |
| 3. Output | 0/2 | Not started | - |
| 4. Polish | 0/2 | Not started | - |
