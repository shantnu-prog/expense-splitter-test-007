# Phase 1: Foundation - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure calculation engine, TypeScript types, Zustand store, and Vitest test suite. No UI components. The engine computes correct per-person totals for all bill configurations — shared items, proportional tip and tax, and rounded-up totals — verified by tests before any UI exists.

</domain>

<decisions>
## Implementation Decisions

### Rounding behavior
- Round up each person's final total to the nearest cent
- Rounding surplus is displayed transparently — both per-person detail (exact vs rounded amount) AND a group total summary line ("$0.03 extra collected due to rounding")
- The engine must compute and return the surplus amount, not discard it

### Rounding timing
- Claude's discretion on whether to round at each component (food, tip, tax) or only the final total — pick whichever produces the most accurate and fair results

### Fractional cent distribution
- Claude's discretion on algorithm (largest-remainder or similar) — pick the mathematically fairest approach for distributing leftover fractions from shared items

### Split edge cases
- Person with zero items: user chooses per-split whether they still pay tip/tax share — engine must support a toggle for "include in tip/tax split even if no food items"
- Unassigned items: engine blocks calculation (returns error/invalid state) until all items are assigned to at least one person
- Person removal with assigned items: automatically redistribute their items among remaining sharers of each item; if they were the sole owner, items become unassigned (which blocks calculation)

### Data model
- Claude's discretion on assignment structure (per-item people list vs separate assignment matrix) — pick what's cleanest for the engine
- Claude's discretion on people metadata (name only vs name + auto-color) — anticipate what UI phases will need
- Claude's discretion on tip/tax configuration (single vs multiple tax lines) — pick based on real-world restaurant bill patterns
- Claude's discretion on engine architecture (pure module vs store-integrated) — pick the most testable approach
- Claude's discretion on minimum people count (1 vs 2) — pick what makes sense for the product

### Claude's Discretion
- Rounding timing (per-component vs final total only)
- Fractional cent distribution algorithm
- Data model structure (assignment approach, people metadata, tip/tax config shape)
- Engine architecture (pure functions vs store-integrated)
- Minimum people count

</decisions>

<specifics>
## Specific Ideas

- All monetary values must be stored as integer cents throughout — convert to dollars only at display (from project decisions)
- The engine must return enough data for the UI to show both exact and rounded amounts per person
- The "include person with no food in tip/tax" toggle is per-split, not a global setting

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-19*
