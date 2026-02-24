# Phase 15 Research: Component Redesign

**Phase:** 15 — Component Redesign
**Researched:** 2026-02-24
**Requirements:** CARD-01 through CARD-07, INPT-01 through INPT-04, BTTN-01 through BTTN-03

## Component Inventory

### Row Cards (CARD-01 through CARD-06)

| Component | File | Current Container | Target |
|-----------|------|-------------------|--------|
| PersonRow | src/components/people/PersonRow.tsx | `flex ... px-4 py-3 border-b border-gray-800` | `glass-card rounded-xl ... px-4 py-3` |
| ItemRow | src/components/items/ItemRow.tsx | `flex ... px-4 py-3 border-b border-gray-800` | `glass-card rounded-xl ... px-4 py-3` |
| HistoryRow | src/components/history/HistoryRow.tsx | `w-full flex ... px-4 py-3 min-h-16 border-b border-gray-800 bg-gray-900/50 hover:bg-gray-800` | `w-full glass-card rounded-xl flex ... px-4 py-3 min-h-16 hover:bg-white/5 press-scale` |
| AssignmentRow | src/components/assignments/AssignmentRow.tsx | `border-b border-gray-800` | `glass-card rounded-xl overflow-hidden` |
| PaymentSection rows | src/components/summary/PaymentSection.tsx | `flex ... bg-gray-900 border border-gray-800 rounded-xl px-4 py-3` | `flex ... glass-card rounded-xl px-4 py-3` |

### List Containers (CARD-07)

| Panel | File | Current List Wrapper | Target |
|-------|------|---------------------|--------|
| PeoplePanel | src/components/people/PeoplePanel.tsx | `flex-1 overflow-y-auto` | `flex-1 overflow-y-auto px-4 pt-3 space-y-2` |
| ItemsPanel | src/components/items/ItemsPanel.tsx | `flex-1 overflow-y-auto` | `flex-1 overflow-y-auto px-4 pt-3 space-y-2` |
| HistoryPanel | src/components/history/HistoryPanel.tsx | `flex-1` | `flex-1 px-4 pt-3 space-y-2` |
| AssignmentPanel | src/components/assignments/AssignmentPanel.tsx | `flex-1 overflow-y-auto` | `flex-1 overflow-y-auto px-4 pt-3 space-y-2` |

### Inputs (INPT-01 through INPT-04)

**INPT-01 pattern:** Replace `bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none` with `bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30`

Inputs to change:
- PeoplePanel: name input (line 110), mobile input (line 137), UPI input (line 145)
- ItemRow: name input (line 62), price input (line 77)
- TipSegmentedControl: custom tip input (line 101)
- TaxInput: value input (line 96)
- PaymentSection: payer select (line 60)

**INPT-02:** TipSegmentedControl container `bg-gray-800` → `glass-surface`, active segment `bg-blue-600` → `gradient-primary`
**INPT-03:** TaxInput toggle `bg-gray-800` → `glass-surface`, active button `bg-gray-700` → `gradient-primary`
**INPT-04:** SplitMethodToggle container `bg-gray-800` → `glass-surface`, active button `bg-gray-700` → `gradient-primary`

### Buttons (BTTN-01 through BTTN-03)

**BTTN-01 primary pattern:** Replace `bg-blue-600 ... active:bg-blue-700` with `gradient-primary press-scale shadow-lg`

Primary buttons:
- PeoplePanel: "Add" (line 113), "Add your first person" (line 171)
- HistoryPanel: "New Split" (line 57)
- AssignmentPanel: "Go to Items" (line 40), "Go to People" (line 55)
- SummaryPanel: "Copy summary" (line 163)
- PaymentSection: "Request via UPI" — special green gradient per CARD-06

**BTTN-02 secondary pattern:** Replace `bg-gray-800 ... border border-gray-700` with `bg-white/5 border border-white/10 press-scale`

Secondary buttons:
- SummaryPanel: "Save Split" / "Update Split" (line 173)
- ItemsPanel: "+" add item (line 59) — dashed border secondary

**BTTN-03:** CopyButton — add `press-scale` to button element

### UPI Button Decision

CARD-06 says "gradient green UPI button". BTTN-01 says "All primary buttons use gradient-primary". Resolution: UPI button gets a green gradient (`from-green-600 to-emerald-500`) since it represents a distinct payment action. All other primaries use `gradient-primary` (blue-to-violet).

## Plan Structure

- **Plan 01:** Row Cards + List Spacing (CARD-01 through CARD-07) — Wave 1
- **Plan 02:** Inputs, Toggles + Buttons (INPT-01 through INPT-04, BTTN-01 through BTTN-03) — Wave 2 (depends on Plan 01)
