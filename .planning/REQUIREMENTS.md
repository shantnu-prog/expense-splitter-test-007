# Requirements: Expense Splitter v1.2

**Defined:** 2026-02-24
**Core Value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.

## v1.2 Requirements

Requirements for the Polish + PWA release. Each maps to roadmap phases.

### PWA & Offline

- [x] **PWA-01**: App can be installed to home screen on mobile (manifest + icons + install prompt)
- [x] **PWA-02**: App works fully offline after first visit (service worker precaches all assets)
- [x] **PWA-03**: When a new version is available, user sees an update prompt (not auto-reload) to avoid losing in-progress input
- [x] **PWA-04**: App has proper icons (192x192 and 512x512 PNG) and displays app name on splash screen

### Mobile UX

- [ ] **UX-01**: User can swipe left/right to navigate between tabs (instant switch, no animation)
- [ ] **UX-02**: Swiping on input fields, textareas, or selects does NOT trigger tab changes
- [ ] **UX-03**: Swiping does not interfere with vertical scrolling inside panels
- [ ] **UX-04**: Unassigned items count is visible as a badge on the Assign tab in the tab bar

### Summary & Payment UX

- [ ] **SUM-01**: Each person card in the summary shows settlement direction — "owes [payer name]" when a payer is selected
- [ ] **SUM-02**: "No UPI ID" text is an actionable link that navigates to the People tab to add a VPA
- [ ] **SUM-03**: Custom tip input shows a live dollar amount preview as user types the percentage
- [ ] **SUM-04**: Payer selection persists when navigating away from the Split tab and back

### Visual Consistency

- [ ] **VIS-01**: All primary action buttons use consistent min-h-12 (48px) tap targets
- [ ] **VIS-02**: All secondary/icon buttons use consistent min-h-10 (40px) tap targets
- [ ] **VIS-03**: Copy button shows brief visual feedback (checkmark icon) on successful copy, in addition to the toast
- [ ] **VIS-04**: Consistent spacing (px-4 py-3) across all panel sections

### Tech Debt

- [ ] **DEBT-01**: Remove `as any` casts at undo restore boundary in PeoplePanel and ItemsPanel — use proper branded-type narrowing
- [ ] **DEBT-02**: Fix `useEffect` on subtotal in TipTaxPanel that fires on mount — use a ref to track previous value
- [ ] **DEBT-03**: Add top-level React error boundary with "Something went wrong" fallback UI
- [ ] **DEBT-04**: UPI deep link on desktop shows a user-facing message ("Open on mobile to use UPI") instead of silently failing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dark/light mode toggle | Polish scope — stick with dark theme for now |
| Animated tab transitions | Adds complexity; instant switch is sufficient and preserves scroll position |
| Accessibility testing (axe-core) | Good idea but separate milestone; no existing a11y regressions |
| Named splits (PERS-04) | Deferred to v1.3 |
| Sort history (PERS-05) | Deferred to v1.3 |
| Shareable URLs (SHAR-01) | Deferred to v1.3; requires URL encoding design |
| Receipt OCR | Permanently out of scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PWA-01 | Phase 9 | Complete (09-01 + 09-02) |
| PWA-02 | Phase 9 | Complete (09-01 + 09-02) |
| PWA-03 | Phase 9 | Complete (09-02) |
| PWA-04 | Phase 9 | Complete (09-01) |
| UX-01 | Phase 10 | Pending |
| UX-02 | Phase 10 | Pending |
| UX-03 | Phase 10 | Pending |
| UX-04 | Phase 10 | Pending |
| SUM-01 | Phase 11 | Pending |
| SUM-02 | Phase 11 | Pending |
| SUM-03 | Phase 11 | Pending |
| SUM-04 | Phase 11 | Pending |
| VIS-01 | Phase 12 | Pending |
| VIS-02 | Phase 12 | Pending |
| VIS-03 | Phase 12 | Pending |
| VIS-04 | Phase 12 | Pending |
| DEBT-01 | Phase 12 | Pending |
| DEBT-02 | Phase 12 | Pending |
| DEBT-03 | Phase 12 | Pending |
| DEBT-04 | Phase 12 | Pending |

**Coverage:**
- v1.2 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-02-24*
