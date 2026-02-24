# Expense Splitter

## What This Is

A web app that splits a restaurant bill fairly among friends, handling shared appetizers, different tip preferences, and tax calculations. Users add people, enter line items with prices, assign who had what (including shared items), configure tip and tax with split method, and get a clear per-person breakdown they can copy and share.

## Core Value

Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.

## Current State

**Shipped:** v1.1 (2026-02-24)
**Tech stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Zustand 5 (with immer + persist), Vitest 4
**Tests:** 144 passing across 12 test files
**Build:** 244 KB (76 KB gzip)
**Architecture:** Client-side only, dark theme, mobile-first with bottom tab navigation, integer-cent arithmetic (Cents branded type), largest-remainder distribution

### What's Shipped

**v1.0 MVP** (2026-02-22): 5 phases, 11 plans, 17 requirements
- Integer-cent calculation engine with largest-remainder distribution
- Mobile-first data entry: people, items, item-centric assignments
- Tip/tax configuration (presets + custom, equal/proportional split)
- Per-person summary with copy-to-clipboard
- Keyboard navigation, undo toast, onboarding screen, empty states

**v1.1 Persistence + Sharing** (2026-02-24): 3 phases, 6 plans, 12 requirements
- localStorage persistence with branded-type deserialization and schema versioning
- History list on app open, save/load/edit/delete with undo
- UPI payment: person contact fields, payer selector, upi:// deep link requests

## Requirements

### Validated (v1.0 + v1.1)

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

### Out of Scope

- Receipt photo upload / OCR — complexity too high
- User accounts / authentication — not needed; client-side only
- Cloud sync across devices — requires backend
- Currency conversion — requires backend for exchange rate APIs

## Constraints

- **Platform**: Web app, must work well on mobile browsers (primary use case is at the table)
- **Architecture**: Client-side only, no backend or database
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
| Payer state stays local (component useState) | Display preference only; must not enter bill store or history | Good |

---
*Last updated: 2026-02-24 after v1.1 milestone completion*
