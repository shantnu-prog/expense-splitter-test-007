# Expense Splitter

## What This Is

A web app that splits a restaurant bill fairly among friends, handling shared appetizers, different tip preferences, and tax calculations. Installable as a PWA with full offline support, swipe navigation, and UPI payment integration for the Indian market.

## Core Value

Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.

## Current State

**Shipped:** v1.2 (2026-02-24)
**Tech stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Zustand 5 (with immer + persist), Vitest 4, vite-plugin-pwa 1.2.0, react-swipeable 7.0.2
**Tests:** 144 passing across 12 test files
**Build:** 254 KB (79 KB gzip), PWA with 11 precache entries
**LOC:** 6,120 (TypeScript/TSX)
**Architecture:** Client-side only PWA, dark theme, mobile-first with bottom tab navigation + swipe gestures, integer-cent arithmetic (Cents branded type), largest-remainder distribution

### What's Shipped

**v1.0 MVP** (2026-02-22): 5 phases, 11 plans
- Integer-cent calculation engine with largest-remainder distribution
- Mobile-first data entry: people, items, item-centric assignments
- Tip/tax configuration (presets + custom, equal/proportional split)
- Per-person summary with copy-to-clipboard
- Keyboard navigation, undo toast, onboarding screen, empty states

**v1.1 Persistence + Sharing** (2026-02-24): 3 phases, 6 plans
- localStorage persistence with branded-type deserialization and schema versioning
- History list on app open, save/load/edit/delete with undo
- UPI payment: person contact fields, payer selector, upi:// deep link requests

**v1.2 Polish + PWA** (2026-02-24): 4 phases, 7 plans
- PWA: installable, offline-capable, user-controlled update prompt
- Swipe navigation between tabs with input exclusion
- Summary UX: settlement direction, actionable UPI links, tip preview, payer persistence
- Visual consistency: button tap targets, copy checkmark feedback, consistent spacing
- Tech debt: branded types, useEffect fix, ErrorBoundary, desktop UPI guard

## Requirements

### Validated

- Add/remove people by name — v1.0
- Add/edit/remove items with prices and quantity — v1.0
- Running subtotal updates as items change — v1.0
- Assign items to specific people, including shared items — v1.0
- Tip presets (15/18/20%) + custom, equal or proportional split — v1.0
- Tax as dollar amount or percentage, equal or proportional split — v1.0
- Per-person summary with name and total, rounded up to nearest cent — v1.0
- Copy-friendly formatted output — v1.0
- Mobile-responsive with large tap targets — v1.0
- Save splits to localStorage, survives page refresh — v1.1
- History list on app open with save/load/edit/delete flow — v1.1
- UPI payment requests via deep links — v1.1
- PWA: installable, offline-capable, update prompt — v1.2
- Swipe gestures for tab navigation — v1.2
- Summary UX: settlement direction, actionable UPI links, tip preview, payer persistence — v1.2
- Visual consistency: button sizes, spacing, copy feedback — v1.2
- Tech debt: branded types, useEffect fix, error boundary, desktop UPI message — v1.2

### Active

(None — planning next milestone)

### Out of Scope

- Receipt photo upload / OCR — complexity too high
- User accounts / authentication — not needed; client-side only
- Cloud sync across devices — requires backend
- Currency conversion — requires backend for exchange rate APIs
- Dark/light mode toggle — sticking with dark theme
- Animated tab transitions — instant switch preserves scroll position

## Constraints

- **Platform**: Web app, must work well on mobile browsers (primary use case is at the table)
- **Architecture**: Client-side only PWA, no backend or database
- **Rounding**: Always round up each person's total to the nearest cent

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app (not native) | Easiest to share and use at a restaurant — just open a URL | Good |
| Client-side only | No user accounts needed, simpler architecture | Good |
| Round up per person | Avoids under-collecting; simpler than tracking who absorbs the penny | Good |
| Shared items split among sharers only | More fair than splitting across everyone | Good |
| Integer cents (branded type) | Eliminates floating-point rounding errors at compile time | Good |
| Largest-remainder distribution | Guarantees sum invariant for proportional splits — no penny gaps | Good |
| CSS-hidden panels (not unmount/remount) | Preserves scroll position and input state on tab switch | Good |
| Zustand + immer for state | Immutable updates with mutable syntax; store holds input only, engine computes fresh | Good |
| Bottom tab bar | Better one-thumb reach on mobile at restaurant table | Good |
| Item-centric assignment | Matches "who ate this item?" mental model at restaurant | Good |
| Optimistic delete + undo toast | Gmail-style deletion — immediate feedback, recoverable within 5 seconds | Good |
| Explicit save (not auto-save-to-history) | Avoids cluttering history with incomplete bills | Good |
| persist(immer(creator)) middleware order | persist MUST wrap immer; wrong order causes silent state loss | Good |
| Single parse boundary (deserializeBillConfig) | All branded type rehydration in one place | Good |
| UPI deep links (not Venmo/Zelle) | Indian market focus; standard upi://pay protocol | Good |
| registerType: 'prompt' for PWA | Prevents unexpected SW reloads mid-bill-split | Good |
| react-swipeable with touch-action: pan-y | Compositor-level scroll/swipe conflict prevention, ~3KB | Good |
| payerId in billStore (not component state) | Persistence across tab switches and page refreshes | Good |
| ReloadPrompt outside ErrorBoundary | PWA updates still work even if main app crashes | Good |
| prevSubtotalRef pattern for useEffect | Skips mount fire without eslint-disable comments | Good |

---
*Last updated: 2026-02-24 after v1.2 milestone*
