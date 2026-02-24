# Roadmap: Expense Splitter

## Milestones

- **v1.0 MVP** — Phases 1-5 (shipped 2026-02-22) — [archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Persistence + Sharing** — Phases 6-8 (shipped 2026-02-24) — [archive](milestones/v1.1-ROADMAP.md)
- **v1.2 Polish + PWA** — Phases 9-12 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-5) — SHIPPED 2026-02-22</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-02-19
- [x] Phase 2: Data Entry (3/3 plans) — completed 2026-02-18
- [x] Phase 3: Output (2/2 plans) — completed 2026-02-21
- [x] Phase 4: Polish (2/2 plans) — completed 2026-02-21
- [x] Phase 5: Build Fix (1/1 plan) — completed 2026-02-22

</details>

<details>
<summary>v1.1 Persistence + Sharing (Phases 6-8) — SHIPPED 2026-02-24</summary>

- [x] Phase 6: Persistence Foundation (2/2 plans) — completed 2026-02-21
- [x] Phase 7: History List + Edit Mode (2/2 plans) — completed 2026-02-24
- [x] Phase 8: UPI Payments (2/2 plans) — completed 2026-02-24

</details>

### v1.2 Polish + PWA (In Progress)

**Milestone Goal:** Make the app feel like a native mobile app — installable, offline-capable, with swipe gestures, polished summary UX, and visual consistency

- [ ] **Phase 9: PWA & Offline** — Service worker, manifest, icons, install prompt, update prompt (2 plans)
- [ ] **Phase 10: Swipe Navigation & Tab UX** — Horizontal swipe gestures between tabs, unassigned items badge
- [ ] **Phase 11: Summary & Payment UX** — Settlement direction, actionable UPI links, tip preview, payer persistence
- [ ] **Phase 12: Visual Polish & Tech Debt** — Button/spacing consistency, copy feedback, error boundary, tech debt fixes

## Phase Details

### Phase 9: PWA & Offline
**Goal**: The app is installable to mobile home screens, works fully offline after first visit, and prompts users (not auto-reloads) when updates are available
**Depends on**: Phase 8 (v1.1 complete)
**Requirements**: PWA-01, PWA-02, PWA-03, PWA-04
**Success Criteria** (what must be TRUE):
  1. User visits the app in Chrome mobile, sees "Add to Home Screen" install prompt, and can install the app
  2. After first visit, user enables airplane mode and the app loads fully from cache — all tabs, all functionality work
  3. Developer deploys a new version; returning user sees "New version available — Update" prompt; tapping Update refreshes the app
  4. Installed app shows proper icon and "Expense Splitter" name on home screen and splash screen
  5. Service worker does NOT activate during `vite dev` — only in production builds
**Plans**: 2 plans
Plans:
- [ ] 09-01-PLAN.md — PWA plugin setup, manifest, and icons (Wave 1)
- [ ] 09-02-PLAN.md — ReloadPrompt component and App integration (Wave 2)

### Phase 10: Swipe Navigation & Tab UX
**Goal**: Users can swipe left/right to navigate between tabs on mobile, and see an unassigned items count badge on the Assign tab
**Depends on**: Phase 9 (PWA installed means mobile-primary usage)
**Requirements**: UX-01, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. User swipes left on the People tab and lands on the Items tab; swipes right and goes back to People
  2. User swiping on a text input, number input, or dropdown does NOT trigger a tab change
  3. User scrolling vertically inside a long items list does NOT accidentally change tabs
  4. Swiping left on the last tab (Split) or right on the first tab (History) does nothing — no wrapping
  5. When items exist but some are unassigned, the Assign tab shows a red/amber count badge (e.g., "3") in the tab bar

### Phase 11: Summary & Payment UX
**Goal**: The Split tab clearly shows who owes whom, makes UPI links more discoverable, gives live feedback on custom tip, and preserves payer selection across tab switches
**Depends on**: Phase 10
**Requirements**: SUM-01, SUM-02, SUM-03, SUM-04
**Success Criteria** (what must be TRUE):
  1. When a payer is selected, each person card shows "owes [payer name]" below their total (payer's own card shows "Paid")
  2. "No UPI ID" text is tappable and navigates the user to the People tab (where they can add a VPA)
  3. When user types a custom tip percentage, a live preview shows the dollar amount (e.g., "5% = $3.25") updating as they type
  4. User selects a payer, switches to Items tab, switches back to Split tab — payer selection is still there

### Phase 12: Visual Polish & Tech Debt
**Goal**: Consistent button sizes, spacing, and interactive feedback across the app; all known tech debt resolved; error boundary prevents white-screen crashes
**Depends on**: Phase 11
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04, DEBT-01, DEBT-02, DEBT-03, DEBT-04
**Success Criteria** (what must be TRUE):
  1. All primary action buttons (Add, Save Split, Copy summary) have 48px minimum height
  2. All secondary/icon buttons (delete, expand, +/-) have 40px minimum height
  3. Copy button briefly shows a checkmark icon (not just a toast) on successful copy
  4. Panel sections use consistent px-4 py-3 spacing — no jarring layout differences between tabs
  5. Undo restore in PeoplePanel and ItemsPanel uses proper branded-type narrowing — no `as any`
  6. TipTaxPanel's subtotal useEffect only fires on actual value change, not on mount
  7. A top-level error boundary catches React rendering errors and shows a recovery UI
  8. Tapping "Request via UPI" on desktop shows a message like "Open on mobile to use UPI" instead of silently failing

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-02-19 |
| 2. Data Entry | v1.0 | 3/3 | Complete | 2026-02-18 |
| 3. Output | v1.0 | 2/2 | Complete | 2026-02-21 |
| 4. Polish | v1.0 | 2/2 | Complete | 2026-02-21 |
| 5. Build Fix | v1.0 | 1/1 | Complete | 2026-02-22 |
| 6. Persistence Foundation | v1.1 | 2/2 | Complete | 2026-02-21 |
| 7. History List + Edit Mode | v1.1 | 2/2 | Complete | 2026-02-24 |
| 8. UPI Payments | v1.1 | 2/2 | Complete | 2026-02-24 |
| 9. PWA & Offline | v1.2 | 0/2 | Planned | - |
| 10. Swipe Navigation & Tab UX | v1.2 | - | Pending | - |
| 11. Summary & Payment UX | v1.2 | - | Pending | - |
| 12. Visual Polish & Tech Debt | v1.2 | - | Pending | - |
