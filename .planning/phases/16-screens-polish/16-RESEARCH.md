# Phase 16 Research: Screens + Polish

**Phase:** 16 — Screens + Polish
**Researched:** 2026-02-24
**Requirements:** SCRN-01, SCRN-02, SCRN-03, PLSH-01, PLSH-02, PLSH-03, PLSH-04, PLSH-05

## Components to Modify

### Screens (SCRN)

| Component | File | Current State | Target |
|-----------|------|---------------|--------|
| OnboardingScreen | src/components/layout/OnboardingScreen.tsx | Plain bg-gray-950, text + button | Gradient hero, app icon in gradient box, feature highlights, gradient button |
| ErrorBoundary | src/components/ErrorBoundary.tsx | Plain bg-gray-950, text + blue button | Gradient hero, red error icon, gradient reload button |
| Empty states | PeoplePanel, ItemsPanel, HistoryPanel, AssignmentPanel (x2), SummaryPanel error | Plain text + button | Decorative icon in colored box + better text hierarchy |

### Polish (PLSH)

| Component | File | Current State | Target |
|-----------|------|---------------|--------|
| Toast | src/components/summary/Toast.tsx | bg-gray-800, rounded-full, opacity transition | glass-card, rounded-xl, slide-up animation |
| UndoToast | src/components/shared/UndoToast.tsx | bg-gray-800, rounded-xl, opacity transition | glass-card, slide-up animation, press-scale undo button |
| ReloadPrompt | src/components/ReloadPrompt.tsx | bg-gray-800, rounded-lg, plain blue Update | glass-card, rounded-xl, gradient Update button |
| SummaryPanel bill total | src/components/summary/SummaryPanel.tsx | text-xl, plain hint banner bg-gray-800/50 | text-2xl font-bold, glass-card hint banner |
| RoundingFooter | src/components/summary/RoundingFooter.tsx | bg-gray-900/50 | glass-card |

## Decorative Icon Choices for Empty States

Pattern: 24x24 SVG in a `w-12 h-12 rounded-xl bg-{color}-500/10` box

| Empty State | Icon | Color |
|-------------|------|-------|
| PeoplePanel: "No people" | People/users | blue-400, bg-blue-500/10 |
| ItemsPanel: "No items" | Receipt/list | violet-400, bg-violet-500/10 |
| HistoryPanel: "No saved splits" | Clock | green-400, bg-green-500/10 |
| AssignmentPanel: "No items to assign" | List/checklist | amber-400, bg-amber-500/10 |
| AssignmentPanel: "No people added" | People/users | blue-400, bg-blue-500/10 |
| SummaryPanel error: "X items need assignment" | Alert triangle | amber-400, bg-amber-500/10 |

## Slide-Up Animation Pattern

Replace simple `opacity` transition with `translate-y` + `opacity`:
```tsx
// Visible:
'opacity-100 translate-y-0'
// Hidden:
'opacity-0 translate-y-4'
// Transition:
'transition-all duration-300'
```
Uses only `transform` and `opacity` — compositor-only, per project convention.

## Plan Structure

- **Plan 01:** Screens Redesign (SCRN-01, SCRN-02, SCRN-03) — Wave 1
- **Plan 02:** Polish — Toasts, ReloadPrompt, SummaryPanel (PLSH-01 through PLSH-05) — Wave 2 (depends on Plan 01 due to shared SummaryPanel edits)
