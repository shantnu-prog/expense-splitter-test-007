# Expense Splitter

## What This Is

A web app that splits a restaurant bill fairly among friends, handling shared appetizers, different tip preferences, and tax calculations. Users add people, enter line items with prices, assign who had what (including shared items), configure tip and tax with split method, and get a clear per-person breakdown they can copy and share.

## Core Value

Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.

## Requirements

### Validated

- Add people to the bill by name — v1.0
- Remove a person from the bill — v1.0
- Add items with prices from the receipt — v1.0
- Edit an existing item's name or price — v1.0
- Remove an item from the bill — v1.0
- Set quantity for each item — v1.0
- Running subtotal updates as items change — v1.0
- Assign items to specific people, including shared items — v1.0
- Shared items split equally among sharers — v1.0
- Tip presets (15/18/20%) + custom input — v1.0
- Tip split method: equal or proportional — v1.0
- Tax as dollar amount or percentage — v1.0
- Tax split method: equal or proportional — v1.0
- Per-person summary with name and total — v1.0
- Round up each person's total to nearest cent — v1.0
- Copy-friendly formatted output — v1.0
- Mobile-responsive with large tap targets — v1.0

### Active

(None — next milestone requirements TBD via `/gsd:new-milestone`)

### Out of Scope

- Receipt photo upload / OCR — complexity too high, 60-80% accuracy on restaurant receipts
- Venmo/payment deep links — v2 feature
- Save and share splits — v2 feature
- History of past splits — v2 feature
- User accounts / authentication — not needed; client-side only
- Mobile native app — web app works on mobile browsers
- Currency conversion — requires backend for exchange rate APIs
- Real-time sync across devices — requires WebSocket server

## Context

Shipped v1.0 with 4,734 LOC (TypeScript/TSX/CSS).
Tech stack: React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Zustand 5 (with immer), Vitest 4.
125 tests passing across 9 test files. Production build succeeds (`npm run build`).
Dark theme, mobile-first design with bottom tab navigation.
Integer-cent arithmetic throughout (Cents branded type) with largest-remainder distribution for penny-exact splits.

## Constraints

- **Platform**: Web app, must work well on mobile browsers (primary use case is at the table)
- **Architecture**: Client-side only for v1, no backend or database
- **Rounding**: Always round up each person's total to the nearest cent

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app (not native) | Easiest to share and use at a restaurant — just open a URL | Good |
| Client-side only | No user accounts needed, simpler architecture for v1 | Good |
| Round up per person | Avoids under-collecting; simpler than tracking who absorbs the penny | Good |
| Shared items split among sharers only | More fair than splitting across everyone | Good |
| Integer cents (branded type) | Eliminates floating-point rounding errors at compile time | Good |
| Largest-remainder distribution | Guarantees sum invariant for proportional splits — no penny gaps | Good |
| CSS-hidden panels (not unmount/remount) | Preserves scroll position and input state on tab switch | Good |
| Zustand + immer for state | Immutable updates with mutable syntax; store holds input only, engine computes fresh | Good |
| Bottom tab bar | Better one-thumb reach on mobile at restaurant table | Good |
| Item-centric assignment | Matches "who ate this item?" mental model at restaurant | Good |
| Optimistic delete + undo toast | Gmail-style deletion — immediate feedback, recoverable within 5 seconds | Good |
| No Enter-to-submit on People input | Forces explicit Add button click — prevents accidental submissions | Good |

---
*Last updated: 2026-02-22 after v1.0 milestone*
