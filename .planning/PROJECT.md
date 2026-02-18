# Expense Splitter

## What This Is

A web app that splits a restaurant bill fairly among friends, handling the messy reality of shared appetizers, different tip preferences, and tax calculations. Users add people, add items with prices, assign who had what (including shared items), configure tip and tax, and get a clear per-person breakdown.

## Core Value

Users can split a restaurant bill accurately and fairly — handling shared items, tip, and tax — in under a minute.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Add people to the bill by name
- [ ] Add items with prices from the receipt
- [ ] Assign items to specific people, including marking items as "shared" among selected people
- [ ] Shared items split equally among the people who shared them
- [ ] Tip calculation with preset percentages (15%, 18%, 20%) and custom input
- [ ] Tip split method: equal across everyone OR proportional to what each person ordered
- [ ] Tax calculation by entering amount or percentage
- [ ] Tax split method: equal across everyone OR proportional to what each person ordered
- [ ] Final per-person summary showing what each person owes
- [ ] Rounding: round up each person's total to the nearest cent

### Out of Scope

- Receipt photo upload / OCR — complexity too high for v1
- Venmo/payment deep links — v2 feature
- Save and share splits — v2 feature
- History of past splits — v2 feature
- User accounts / authentication — not needed for v1
- Mobile native app — web app works on mobile browsers

## Context

- This is a greenfield project — no existing application code
- The app is client-side only for v1 (no backend needed)
- Primary use case: sitting at a restaurant with friends, pulling up the app on a phone browser
- Edge cases to handle: rounding pennies (round up), items shared by subset of people, zero-tip scenarios
- Tech stack to be determined by research (no strong preference expressed)

## Constraints

- **Platform**: Web app, must work well on mobile browsers (primary use case is at the table)
- **Architecture**: Client-side only for v1, no backend or database
- **Rounding**: Always round up each person's total to the nearest cent

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app (not native) | Easiest to share and use at a restaurant — just open a URL | — Pending |
| Client-side only | No user accounts needed, simpler architecture for v1 | — Pending |
| Round up per person | Avoids under-collecting; simpler than tracking who absorbs the penny | — Pending |
| Shared items split among sharers only | More fair than splitting across everyone | — Pending |

---
*Last updated: 2026-02-19 after initialization*
