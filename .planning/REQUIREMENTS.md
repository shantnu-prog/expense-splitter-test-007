# Requirements: Expense Splitter

**Defined:** 2026-02-19
**Core Value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### People Management

- [x] **PEOP-01**: User can add people to the bill by name
- [x] **PEOP-02**: User can remove a person from the bill

### Item Management

- [x] **ITEM-01**: User can add line items with a name and price
- [x] **ITEM-02**: User can edit an existing item's name or price
- [x] **ITEM-03**: User can remove an item from the bill
- [x] **ITEM-04**: User can set a quantity for each item
- [x] **ITEM-05**: Running subtotal updates as items are added/edited/removed

### Assignment

- [x] **ASGN-01**: User can assign each item to one or more people
- [x] **ASGN-02**: Shared items split equally among the people who shared them

### Tip & Tax

- [ ] **TPTX-01**: User can select tip percentage from presets (15%, 18%, 20%) or enter custom %
- [x] **TPTX-02**: User can choose tip split method: equal across everyone or proportional to order
- [ ] **TPTX-03**: User can enter tax as a dollar amount or percentage
- [x] **TPTX-04**: User can choose tax split method: equal across everyone or proportional to order

### Summary

- [ ] **SUMM-01**: Per-person summary shows each person's name and total owed
- [x] **SUMM-02**: Each person's total is rounded up to the nearest cent
- [ ] **SUMM-03**: Copy-friendly formatted output for sharing (e.g. "Alice owes $23.50")

### UX

- [x] **UX-01**: Mobile-responsive layout with large tap targets for phone use at the table

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Persistence

- **PERS-01**: User can save a split to localStorage for later reference
- **PERS-02**: User can view history of past splits

### Sharing

- **SHAR-01**: User can generate a shareable URL with encoded bill state
- **SHAR-02**: User can generate Venmo/payment app formatted text

### Input

- **INPT-01**: User can upload receipt photo for OCR auto-population of items

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Not needed for v1; adds backend complexity |
| Real-time sync across devices | Requires WebSocket server; breaks client-side constraint |
| Currency conversion | Dramatically increases scope; exchange rate APIs need backend |
| Payment API integration (Venmo/Zelle) | Requires business accounts, compliance, and maintenance |
| Receipt OCR | 60-80% accuracy on restaurant receipts; adds backend dependency |
| Export to CSV | Most splits are one-and-done; rare use case |
| Custom percentage splits (e.g. 30/70) | Different product category (expense tracking vs restaurant splitting) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PEOP-01 | Phase 2 | Complete |
| PEOP-02 | Phase 2 | Complete |
| ITEM-01 | Phase 2 | Complete |
| ITEM-02 | Phase 2 | Complete |
| ITEM-03 | Phase 2 | Complete |
| ITEM-04 | Phase 2 | Complete |
| ITEM-05 | Phase 2 | Complete |
| ASGN-01 | Phase 2 | Complete |
| ASGN-02 | Phase 1 | Complete |
| TPTX-01 | Phase 3 | Pending |
| TPTX-02 | Phase 1 | Complete |
| TPTX-03 | Phase 3 | Pending |
| TPTX-04 | Phase 1 | Complete |
| SUMM-01 | Phase 3 | Pending |
| SUMM-02 | Phase 1 | Complete |
| SUMM-03 | Phase 3 | Pending |
| UX-01 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after roadmap creation — traceability complete*
