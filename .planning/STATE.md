# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.
**Current focus:** v1.2 Polish + PWA — Phase 11 in progress

## Current Position

Phase: 11 of 12 (Summary & Payment UX) — in progress
Plan: 11-02 complete (2 of 2 plans in phase)
Status: Phase 11 plan 02 complete — custom tip live dollar preview
Last activity: 2026-02-24 — Completed 11-02 (custom tip live dollar preview, 97s)

Progress: [#######░░░] 71% (v1.2) — 5 of 7 plans complete

## Performance Metrics

**v1.0 (shipped 2026-02-22):**
- 5 phases, 11 plans
- 4,734 LOC, 125 tests across 9 files
- Timeline: 4 days (2026-02-19 to 2026-02-22)

**v1.1 (shipped 2026-02-24):**
- 3 phases, 6 plans, 15 tasks
- 3,413 lines added, 144 tests across 12 files
- Build: 244 KB (76 KB gzip)
- Timeline: 3 days (2026-02-22 to 2026-02-24)

## Accumulated Context

### Decisions

Full decision logs archived in:
- milestones/v1.0-ROADMAP.md
- milestones/v1.1-ROADMAP.md
- PROJECT.md Key Decisions table

**v1.2 decisions (from research):**
- vite-plugin-pwa v1.2.0 for PWA setup (generateSW strategy, registerType: 'prompt')
- react-swipeable v7.0.2 for swipe gestures (~3KB, React 19 compatible)
- touch-action: pan-y on main element to prevent scroll/swipe conflicts
- 50px delta threshold for swipe detection (conservative, avoids accidental triggers)
- Payer state to move from component useState to billStore for persistence across tab switches

**v1.2 decisions (from execution):**
- registerType: 'prompt' to prevent unexpected SW reloads mid-bill-split
- Programmatic PNG icon generation (raw zlib+CRC32) to avoid canvas/sharp dependency
- includeAssets: ['**/*'] for complete offline precaching
- Named export ReloadPrompt with bottom-20 positioning above TabBar
- gray-800 toast on gray-950 background for dark theme visual contrast
- touch-action: pan-y via style prop for compositor-level scroll/swipe conflict handling
- preventScrollOnSwipe: false — CSS handles scroll conflicts more reliably than JS
- 50px delta, 500ms swipeDuration for conservative swipe thresholds
- Inline IIFE for conditional preview rendering in TipSegmentedControl
- pl-1 left padding on tip preview for visual alignment with input

### Pending Todos

None.

### Blockers/Concerns

None.

### Tech Debt (to be fixed in Phase 12)

- `as any` casts at undo restore boundary (PeoplePanel:81, ItemsPanel:49) — DEBT-01
- `useEffect` on subtotal fires on mount in TipTaxPanel — DEBT-02
- No error boundary — DEBT-03
- UPI window.location.href is a no-op on desktop — DEBT-04

## Performance Metrics (v1.2 plans)

| Plan | Duration | Tasks | Key Files |
|------|----------|-------|-----------|
| 11-02 | 97s | 2/2 | TipSegmentedControl.tsx, TipTaxPanel.tsx |

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 11-02-PLAN.md (custom tip live dollar preview)
Resume file: None
