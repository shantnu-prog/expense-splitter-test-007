# Roadmap: Expense Splitter

## Milestones

- **v1.0 MVP** — Phases 1-5 (shipped 2026-02-22) — [archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Persistence + Sharing** — Phases 6-8 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-5) — SHIPPED 2026-02-22</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-02-19
- [x] Phase 2: Data Entry (3/3 plans) — completed 2026-02-18
- [x] Phase 3: Output (2/2 plans) — completed 2026-02-21
- [x] Phase 4: Polish (2/2 plans) — completed 2026-02-21
- [x] Phase 5: Build Fix (1/1 plan) — completed 2026-02-22

</details>

### v1.1 Persistence + Sharing (In Progress)

**Milestone Goal:** Save splits to localStorage with history, and generate payer-directed payment text for Venmo/Zelle

- [x] **Phase 6: Persistence Foundation** - Build the localStorage layer that all v1.1 features depend on (completed 2026-02-21)
- [x] **Phase 7: History List + Edit Mode** - History UI, re-open/edit flow, and coordinated app entry (completed 2026-02-24)
- [x] **Phase 8: UPI Payments** - Contact details on people, payer selector, UPI deep links for payment requests (completed 2026-02-24)

## Phase Details

### Phase 6: Persistence Foundation
**Goal**: The app reliably stores and restores bill data through localStorage — current sessions survive page refresh, completed bills can be saved to history, and stored data survives schema changes without data loss
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: PERS-01, PERS-02, PERS-03
**Success Criteria** (what must be TRUE):
  1. User refreshes the page mid-entry and all people, items, assignments, tip, and tax are exactly as left
  2. User taps "Save Split" and the completed bill is added to persistent history that survives closing and reopening the browser
  3. App continues to load and display existing saved splits after a schema migration — no data is silently lost or corrupted
  4. App opens without crashing in Safari Private Browsing mode (localStorage quota errors are caught and surfaced as non-blocking toasts, not unhandled exceptions)
**Plans:** 2/2 plans complete
Plans:
- [ ] 06-01-PLAN.md — Safe localStorage adapter and branded-type deserialization layer
- [ ] 06-02-PLAN.md — History store and bill store persist middleware

### Phase 7: History List + Edit Mode
**Goal**: Users can see their saved splits on app open, tap any entry to re-open and edit it, start a fresh split from the history screen, and delete entries with a 5-second undo window
**Depends on**: Phase 6
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04
**Success Criteria** (what must be TRUE):
  1. User with saved splits opens the app and sees a history list showing date, people names, and total for each entry — without having to navigate anywhere
  2. User taps a history entry and the full bill (people, items, assignments, tip, tax) is restored into the editor with an "Editing saved split" indicator visible
  3. User on the history screen taps "New Split" and gets a clean, empty bill editor
  4. User deletes a saved split and sees an undo toast; tapping undo within 5 seconds restores the entry exactly as it was
  5. User with no saved history sees an appropriate empty state rather than a blank screen
**Plans**: 2 plans
Plans:
- [ ] 07-01-PLAN.md — History panel, tab integration, delete with undo (Wave 1)
- [ ] 07-02-PLAN.md — App entry coordination, load/edit flow, save/update button (Wave 2)

### Phase 8: UPI Payments
**Goal**: Users can store contact details (mobile + UPI VPA) per person, select who paid the bill, and request payment from each person via UPI deep links that open PhonePe/GPay/Paytm with pre-filled amount
**Depends on**: Phase 7
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05
**Success Criteria** (what must be TRUE):
  1. User can enter mobile number and UPI VPA when adding a person; these fields persist across page refresh and in saved history
  2. User selects who paid the bill; the payer is excluded from payment requests
  3. Each non-payer person with a UPI VPA has a "Request via UPI" button that opens a upi:// deep link with correct payee VPA, amount in INR, and transaction note
  4. Persons without a UPI VPA show a fallback (amount text only, no broken link)
  5. Contact details survive schema migration — old saved splits without contact fields load without crashing
**Plans**: 2 plans
Plans:
- [x] 08-01-PLAN.md — Person contact details (mobile + UPI VPA), schema migration v1→v2 (Wave 1) — completed 2026-02-24
- [x] 08-02-PLAN.md — Payer selector, UPI deep link utility, PaymentSection component (Wave 2) — completed 2026-02-24

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-02-19 |
| 2. Data Entry | v1.0 | 3/3 | Complete | 2026-02-18 |
| 3. Output | v1.0 | 2/2 | Complete | 2026-02-21 |
| 4. Polish | v1.0 | 2/2 | Complete | 2026-02-21 |
| 5. Build Fix | v1.0 | 1/1 | Complete | 2026-02-22 |
| 6. Persistence Foundation | 2/2 | Complete   | 2026-02-21 | - |
| 7. History List + Edit Mode | v1.1 | 2/2 | Complete | 2026-02-24 |
| 8. UPI Payments | v1.1 | 2/2 | Complete | 2026-02-24 |
