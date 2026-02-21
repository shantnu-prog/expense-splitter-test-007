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

- [ ] **Phase 6: Persistence Foundation** - Build the localStorage layer that all v1.1 features depend on
- [ ] **Phase 7: History List + Edit Mode** - History UI, re-open/edit flow, and coordinated app entry
- [ ] **Phase 8: Payment Text** - Payer-directed payment text generation and copy to clipboard

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
**Plans**: TBD

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
**Plans**: TBD

### Phase 8: Payment Text
**Goal**: Users can select who paid the bill and instantly copy payer-directed payment text ("Alice owes YOU $23.50") ready to paste into any payment app
**Depends on**: Phase 7
**Requirements**: PAY-01, PAY-02, PAY-03
**Success Criteria** (what must be TRUE):
  1. User taps a person's name in the payer selector and the payment text updates immediately to show "X owes YOU $Y.YY" for every other person
  2. Payment text correctly excludes the selected payer — they do not appear in the output owing themselves money
  3. User taps "Copy" and the formatted payment text is on their clipboard, ready to paste into Venmo, Zelle, or any chat app
  4. Payment text handles edge cases cleanly: single-person bill shows "Everyone is settled up." rather than empty output; zero-amount persons are excluded from the text
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-02-19 |
| 2. Data Entry | v1.0 | 3/3 | Complete | 2026-02-18 |
| 3. Output | v1.0 | 2/2 | Complete | 2026-02-21 |
| 4. Polish | v1.0 | 2/2 | Complete | 2026-02-21 |
| 5. Build Fix | v1.0 | 1/1 | Complete | 2026-02-22 |
| 6. Persistence Foundation | v1.1 | 0/? | Not started | - |
| 7. History List + Edit Mode | v1.1 | 0/? | Not started | - |
| 8. Payment Text | v1.1 | 0/? | Not started | - |
