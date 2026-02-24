# Requirements: Expense Splitter

**Defined:** 2026-02-24
**Core Value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.

## v1.3 Requirements

Requirements for v1.3 UI Redesign. Each maps to roadmap phases.

### Design System

- [ ] **DSYS-01**: App uses Inter variable font, self-hosted via @fontsource for offline PWA support
- [ ] **DSYS-02**: Glass-card utility class applies backdrop-blur, bg-white/5, border-white/10, shadow
- [ ] **DSYS-03**: Glass-surface utility class applies backdrop-blur, bg-white/[0.03], border-white/[0.06]
- [ ] **DSYS-04**: Gradient-primary utility applies blue-600 to violet-600 gradient
- [ ] **DSYS-05**: Press-scale utility applies active:scale-[0.97] with 100ms transition
- [ ] **DSYS-06**: Fade-in animation applies translateY(4px)->0 over 200ms
- [ ] **DSYS-07**: Global prefers-reduced-motion reset disables all animations when user prefers reduced motion
- [ ] **DSYS-08**: App.css (unused Vite scaffold file) is deleted

### Layout

- [x] **LYOT-01**: TabBar displays SVG icons above labels for all 5 tabs
- [x] **LYOT-02**: TabBar uses glass-surface styling with increased min-h-14
- [x] **LYOT-03**: SubtotalBar uses glass-surface styling with tracking-tight amount
- [ ] **LYOT-04**: AppShell has subtle background gradient tint for glass blur effect
- [ ] **LYOT-05**: AppShell bottom padding accommodates taller tab bar (pb-20)

### Cards

- [ ] **CARD-01**: PersonRow uses glass-card with rounded-xl, no border-b separator
- [ ] **CARD-02**: ItemRow uses glass-card with bg-white/5 inputs and focus:ring glow
- [ ] **CARD-03**: HistoryRow uses glass-card with hover highlight and press-scale
- [ ] **CARD-04**: AssignmentRow uses glass-card with overflow-hidden
- [x] **CARD-05**: PersonCard (summary) uses glass-card with border-white/5 detail drawer
- [ ] **CARD-06**: PaymentSection uses glass-card rows with gradient green UPI button
- [ ] **CARD-07**: List containers use px-4 pt-3 space-y-2 spacing pattern

### Inputs

- [ ] **INPT-01**: All text inputs use bg-white/5 border-white/10 with focus:ring-2 focus:ring-blue-500/30
- [ ] **INPT-02**: TipSegmentedControl uses glass container with gradient-primary active segment
- [ ] **INPT-03**: TaxInput uses glass toggle container
- [ ] **INPT-04**: SplitMethodToggle uses glass toggle container

### Buttons

- [ ] **BTTN-01**: All primary buttons use gradient-primary with press-scale and shadow
- [ ] **BTTN-02**: All secondary buttons use bg-white/5 border-white/10 with press-scale
- [ ] **BTTN-03**: CopyButton uses press-scale animation

### Screens

- [ ] **SCRN-01**: OnboardingScreen uses gradient-hero background with app icon and feature highlights
- [ ] **SCRN-02**: ErrorBoundary uses gradient-hero background with red error icon and gradient reload button
- [ ] **SCRN-03**: Empty states in all panels use decorative icon in colored box with better text hierarchy

### Polish

- [ ] **PLSH-01**: Toast uses glass-card with slide-up animation
- [ ] **PLSH-02**: UndoToast uses glass-card with slide-up animation and press-scale undo button
- [ ] **PLSH-03**: ReloadPrompt uses glass-card with gradient Update button
- [ ] **PLSH-04**: SummaryPanel shows larger bill total (text-2xl font-bold) with glass hint banner
- [ ] **PLSH-05**: RoundingFooter uses glass-card styling

## Future Requirements

None — visual redesign is self-contained.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Light mode / theme toggle | Sticking with dark theme per existing decision |
| Framer Motion animations | CSS animations sufficient; avoids 30KB+ bundle increase |
| Icon library (full) | Only ~7 icons needed; lucide-react tree-shakes to ~7KB |
| Gradient text effects | Accessibility concern with variable backgrounds |
| Parallax/scroll-linked animations | Performance risk on mobile, not aligned with app's utility purpose |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DSYS-01 | Phase 13 | Pending |
| DSYS-02 | Phase 13 | Pending |
| DSYS-03 | Phase 13 | Pending |
| DSYS-04 | Phase 13 | Pending |
| DSYS-05 | Phase 13 | Pending |
| DSYS-06 | Phase 13 | Pending |
| DSYS-07 | Phase 13 | Pending |
| DSYS-08 | Phase 13 | Pending |
| LYOT-01 | Phase 14 | Complete |
| LYOT-02 | Phase 14 | Complete |
| LYOT-03 | Phase 14 | Complete |
| LYOT-04 | Phase 13 | Pending |
| LYOT-05 | Phase 13 | Pending |
| CARD-01 | Phase 15 | Pending |
| CARD-02 | Phase 15 | Pending |
| CARD-03 | Phase 15 | Pending |
| CARD-04 | Phase 15 | Pending |
| CARD-05 | Phase 14 | Complete |
| CARD-06 | Phase 15 | Pending |
| CARD-07 | Phase 15 | Pending |
| INPT-01 | Phase 15 | Pending |
| INPT-02 | Phase 15 | Pending |
| INPT-03 | Phase 15 | Pending |
| INPT-04 | Phase 15 | Pending |
| BTTN-01 | Phase 15 | Pending |
| BTTN-02 | Phase 15 | Pending |
| BTTN-03 | Phase 15 | Pending |
| SCRN-01 | Phase 16 | Pending |
| SCRN-02 | Phase 16 | Pending |
| SCRN-03 | Phase 16 | Pending |
| PLSH-01 | Phase 16 | Pending |
| PLSH-02 | Phase 16 | Pending |
| PLSH-03 | Phase 16 | Pending |
| PLSH-04 | Phase 16 | Pending |
| PLSH-05 | Phase 16 | Pending |

**Coverage:**
- v1.3 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-02-24*
*Last updated: 2026-02-24 after roadmap creation (v1.3 Phases 13-16)*
