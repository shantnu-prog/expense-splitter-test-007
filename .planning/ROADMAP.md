# Roadmap: Expense Splitter

## Milestones

- **v1.0 MVP** — Phases 1-5 (shipped 2026-02-22) — [archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Persistence + Sharing** — Phases 6-8 (shipped 2026-02-24) — [archive](milestones/v1.1-ROADMAP.md)
- **v1.2 Polish + PWA** — Phases 9-12 (shipped 2026-02-24) — [archive](milestones/v1.2-ROADMAP.md)
- **v1.3 UI Redesign** — Phases 13-16 (active)

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

<details>
<summary>v1.2 Polish + PWA (Phases 9-12) — SHIPPED 2026-02-24</summary>

- [x] Phase 9: PWA & Offline (2/2 plans) — completed 2026-02-24
- [x] Phase 10: Swipe Navigation & Tab UX (1/1 plan) — completed 2026-02-24
- [x] Phase 11: Summary & Payment UX (2/2 plans) — completed 2026-02-24
- [x] Phase 12: Visual Polish & Tech Debt (2/2 plans) — completed 2026-02-24

</details>

### v1.3 UI Redesign (Phases 13-16)

- [ ] **Phase 13: Design System Foundation** — Inter font, design tokens, utility classes, motion reset, AppShell tint (2 plans)
- [ ] **Phase 14: Layout + Glass System** — TabBar SVG icons, glass TabBar/SubtotalBar, PersonCard glass prototype
- [ ] **Phase 15: Component Redesign** — All row cards, all inputs, all buttons with glass/gradient/press-scale
- [ ] **Phase 16: Screens + Polish** — Onboarding, ErrorBoundary, empty states, toasts, animations, SummaryPanel

## Phase Details

### Phase 13: Design System Foundation
**Goal**: The design token system is in place — Inter font loads offline, all utility classes exist, and the AppShell background enables glassmorphism throughout the app
**Depends on**: Nothing (first phase of v1.3)
**Requirements**: DSYS-01, DSYS-02, DSYS-03, DSYS-04, DSYS-05, DSYS-06, DSYS-07, DSYS-08, LYOT-04, LYOT-05
**Success Criteria** (what must be TRUE):
  1. Inter font renders in production build with DevTools offline mode enabled — system font never flashes on repeat visits
  2. `glass-card`, `glass-surface`, `gradient-primary`, `press-scale`, and `animate-fade-in` utility classes apply correctly when added to any element in the app
  3. The app background shows a subtle gradient tint visible behind glass-blurred elements (glass blur is not invisible against a flat background)
  4. AppShell bottom padding is pb-20 and accommodates the taller tab bar without content cutoff
  5. With OS "Reduce Motion" enabled, all CSS animations and transitions are disabled — no visual motion occurs anywhere in the app
**Plans**:
  - Plan 01: Design Tokens & Utility Classes (4 tasks: font install, @theme block, utility classes, reduced-motion reset + App.css delete)
  - Plan 02: AppShell Layout Adjustments (2 tasks: background gradient tint, bottom padding pb-20)

### Phase 14: Layout + Glass System
**Goal**: Every screen in the app shows the new glass TabBar with SVG icons, and the glass pattern is proven correct on SubtotalBar and PersonCard before propagating to other components
**Depends on**: Phase 13
**Requirements**: LYOT-01, LYOT-02, LYOT-03, CARD-05
**Success Criteria** (what must be TRUE):
  1. TabBar shows a recognizable SVG icon above the text label for all 5 tabs — icon and label are both visible at all times
  2. TabBar and SubtotalBar have a frosted-glass appearance (visible blur and translucency) that persists while scrolling content behind them
  3. PersonCard (summary panel) renders as a glass card with rounded corners, no flat background — the blur effect is visible against content scrolling behind it
  4. On Chrome DevTools 4x CPU throttle, scrolling through a populated summary list maintains at least 50 FPS — no visible jank from the blur budget
**Plans**: TBD

### Phase 15: Component Redesign
**Goal**: Every interactive element in the app — row cards, inputs, and buttons — uses the new glass, gradient, and press-scale design language established in Phase 14
**Depends on**: Phase 14
**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04, CARD-06, CARD-07, INPT-01, INPT-02, INPT-03, INPT-04, BTTN-01, BTTN-02, BTTN-03
**Success Criteria** (what must be TRUE):
  1. PersonRow, ItemRow, HistoryRow, AssignmentRow, and PaymentSection rows all render as glass cards with rounded corners and no flat separator lines between them
  2. All text inputs show a subtle glow ring when focused — the focus state is visually distinct from the unfocused state
  3. Tip, tax, and split method toggle controls have a glass container with the active segment shown in a gradient highlight
  4. All primary action buttons (Add Person, Add Item, Save Split, UPI payment) display a blue-to-violet gradient; tapping any interactive element produces a visible press-scale shrink and spring-back
  5. All 144 existing tests pass without modification after all className changes
**Plans**: TBD

### Phase 16: Screens + Polish
**Goal**: The full app surface is redesigned — onboarding and error screens have gradient heroes, empty states guide users with icons, notifications use glass styling, and the summary panel leads with a prominent bill total
**Depends on**: Phase 15
**Requirements**: SCRN-01, SCRN-02, SCRN-03, PLSH-01, PLSH-02, PLSH-03, PLSH-04, PLSH-05
**Success Criteria** (what must be TRUE):
  1. The onboarding screen shows a gradient hero background with an app icon and feature highlights — it is visually distinct from the plain tab panels
  2. The ErrorBoundary fallback screen matches the redesign aesthetic (gradient hero, styled reload button) — a crash does not show a plain white or unstyled fallback
  3. Empty states in all panels (no people, no items, no history) show a decorative icon in a colored box with clear action guidance
  4. Toast notifications (undo, PWA update prompt) appear with a glass card style and slide-up entrance animation
  5. The SummaryPanel bill total is displayed at text-2xl font-bold — it reads as the most prominent number on the screen

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
| 9. PWA & Offline | v1.2 | 2/2 | Complete | 2026-02-24 |
| 10. Swipe Navigation & Tab UX | v1.2 | 1/1 | Complete | 2026-02-24 |
| 11. Summary & Payment UX | v1.2 | 2/2 | Complete | 2026-02-24 |
| 12. Visual Polish & Tech Debt | v1.2 | 2/2 | Complete | 2026-02-24 |
| 13. Design System Foundation | v1.3 | 0/2 | Planned | — |
| 14. Layout + Glass System | v1.3 | 0/? | Not started | — |
| 15. Component Redesign | v1.3 | 0/? | Not started | — |
| 16. Screens + Polish | v1.3 | 0/? | Not started | — |
