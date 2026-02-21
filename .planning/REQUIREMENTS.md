# Requirements: Expense Splitter

**Defined:** 2026-02-22
**Core Value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.

## v1.1 Requirements

Requirements for the Persistence + Sharing release. Each maps to roadmap phases.

### Persistence

- [ ] **PERS-01**: Current bill auto-saves to localStorage and survives page refresh
- [ ] **PERS-02**: User can save a completed bill to history with a single tap
- [x] **PERS-03**: Stored data migrates gracefully when the app schema changes (schema versioning)

### History

- [ ] **HIST-01**: App shows a history list when saved splits exist, with date, people names, and total per entry
- [ ] **HIST-02**: User can tap a saved split to re-open and edit it
- [ ] **HIST-03**: User can start a new split from the history screen
- [ ] **HIST-04**: User can delete a saved split with undo within 5 seconds

### Payment Text

- [ ] **PAY-01**: User can select who paid the bill from the people list
- [ ] **PAY-02**: Payment text shows "Alice owes YOU $X.XX" for each non-payer person
- [ ] **PAY-03**: User can copy payment text to clipboard with a single tap

## Future Requirements

Deferred to later release. Tracked but not in current roadmap.

### Sharing

- **SHAR-01**: User can generate a shareable URL with encoded bill state
- **SHAR-02**: User can export bill data as JSON file

### Persistence Enhancements

- **PERS-04**: User can name a saved split (e.g. "Dinner at Olive Garden")
- **PERS-05**: User can sort history by date or amount

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Receipt photo upload / OCR | Complexity too high, 60-80% accuracy on restaurant receipts |
| Venmo/Zelle deep links | Platform-specific integration; plain text sufficient |
| User accounts / authentication | Not needed; client-side only |
| Cloud sync across devices | Requires backend; breaks client-side constraint |
| IndexedDB storage | localStorage sufficient for bill data volume (~5-15 KB per split) |
| Auto-save to history | Explicit save avoids cluttering history with incomplete bills |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERS-01 | Phase 6 | Pending |
| PERS-02 | Phase 6 | Pending |
| PERS-03 | Phase 6 | Complete |
| HIST-01 | Phase 7 | Pending |
| HIST-02 | Phase 7 | Pending |
| HIST-03 | Phase 7 | Pending |
| HIST-04 | Phase 7 | Pending |
| PAY-01 | Phase 8 | Pending |
| PAY-02 | Phase 8 | Pending |
| PAY-03 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after roadmap creation (v1.1 phases 6-8)*
