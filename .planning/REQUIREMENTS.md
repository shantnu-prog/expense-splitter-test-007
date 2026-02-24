# Requirements: Expense Splitter

**Defined:** 2026-02-22
**Core Value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.

## v1.1 Requirements

Requirements for the Persistence + Sharing release. Each maps to roadmap phases.

### Persistence

- [x] **PERS-01**: Current bill auto-saves to localStorage and survives page refresh
- [x] **PERS-02**: User can save a completed bill to history with a single tap
- [x] **PERS-03**: Stored data migrates gracefully when the app schema changes (schema versioning)

### History

- [x] **HIST-01**: App shows a history list when saved splits exist, with date, people names, and total per entry
- [x] **HIST-02**: User can tap a saved split to re-open and edit it
- [x] **HIST-03**: User can start a new split from the history screen
- [x] **HIST-04**: User can delete a saved split with undo within 5 seconds

### Payment & UPI

- [x] **PAY-01**: User can enter mobile number and UPI VPA (e.g., alice@ybl) when adding a person
- [x] **PAY-02**: Contact details (mobile, UPI VPA) are saved with the person and persist across sessions
- [ ] **PAY-03**: User can select who paid the bill from the people list
- [ ] **PAY-04**: Each non-payer person has a "Request via UPI" button that opens a upi:// deep link with pre-filled amount
- [ ] **PAY-05**: UPI deep link opens PhonePe/GPay/Paytm with correct payee VPA, amount in INR, and transaction note

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
| Venmo/Zelle deep links | Replaced by UPI deep links for Indian market |
| User accounts / authentication | Not needed; client-side only |
| Cloud sync across devices | Requires backend; breaks client-side constraint |
| IndexedDB storage | localStorage sufficient for bill data volume (~5-15 KB per split) |
| Auto-save to history | Explicit save avoids cluttering history with incomplete bills |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERS-01 | Phase 6 | Complete |
| PERS-02 | Phase 6 | Complete |
| PERS-03 | Phase 6 | Complete |
| HIST-01 | Phase 7 | Complete |
| HIST-02 | Phase 7 | Complete |
| HIST-03 | Phase 7 | Complete |
| HIST-04 | Phase 7 | Complete |
| PAY-01 | Phase 8 | Complete |
| PAY-02 | Phase 8 | Complete |
| PAY-03 | Phase 8 | Pending |
| PAY-04 | Phase 8 | Pending |
| PAY-05 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-24 after 08-01 execution (PAY-01, PAY-02 complete)*
