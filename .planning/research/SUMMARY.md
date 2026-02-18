# Project Research Summary

**Project:** Restaurant Bill Splitter — expense splitting web app
**Domain:** Client-side, single-session, restaurant bill splitting
**Researched:** 2026-02-19
**Confidence:** MEDIUM (all four research agents were blocked from live external sources; findings are from training knowledge through August 2025, which is reliable for this stable domain)

## Executive Summary

A restaurant bill splitter is a mature, well-understood product category. The core challenge is not technical novelty — it is correctness. Every dollar of floating-point arithmetic error, every missed edge case in shared-item allocation, and every stale derived-state bug is immediately visible to users who are literally checking the math against a receipt in front of them. The recommended approach is to build a fully client-side React SPA with a strictly separated calculation engine: pure TypeScript functions that work in integer cents, testable in isolation before any UI exists. This architecture is stable, proven in competitors like Splitwise, and well-documented in community resources.

The key competitive opportunity is zero friction. Every major competitor (Splitwise, Tab) requires an account and network access. A no-login, offline-capable web app that loads instantly on a phone browser and lets a group split a bill in under two minutes is a genuine differentiator — not a missing feature, but a deliberate positioning choice. This means v1 must aggressively avoid backend complexity, auth, OCR, and payment integrations. The full v1 feature set is achievable in a focused build because all the hard work is arithmetic correctness, not system integration.

The primary risk is math correctness: floating-point arithmetic without integer-cent handling, rounding applied at the wrong stage, and proportional distribution without the largest-remainder reconciliation algorithm will produce penny-level errors that destroy user trust. These pitfalls must be addressed in the foundation phase before any UI is built. The secondary risk is scope creep — receipt OCR, user accounts, and real-time sync all sound compelling but each would add backend complexity that breaks the client-side constraint and delays the core value.

---

## Key Findings

### Recommended Stack

The stack is a standard modern React SPA: React 19 + TypeScript 5.7 + Vite 6 + Tailwind CSS 4 + Zustand 5. This combination represents the current industry consensus for mobile-first client-side SPAs. No framework beyond React is needed — Next.js, Remix, and SvelteKit all add server-side complexity with no benefit for a no-backend app. Tailwind v4 requires a new Vite plugin install flow (not PostCSS as in v3). Zustand is preferred over React Context because the bill state graph (items with multiple people, tip, tax, and computed totals) has too many cross-component reads to avoid re-render problems with plain context.

One pattern is non-negotiable across the entire stack: store all monetary values as integer cents, not floats. Every npm package choice is reversible; the decision to work in cents must be made before the first line of calculation code is written.

**Core technologies:**
- React 19: UI framework — dominant SPA ecosystem, native Suspense improvements, no server needed
- TypeScript 5.7: type safety — catches money-math shape errors and off-by-one bugs at compile time
- Vite 6: build tool — instant HMR, static output for CDN/GitHub Pages, CRA is deprecated and must not be used
- Tailwind CSS 4: styling — mobile-first, utility classes, no runtime overhead, v4 Vite plugin (not PostCSS)
- Zustand 5: state management — single-store model fits tightly coupled bill state; avoids context re-render problems
- Vitest 3: testing — Vite-native, no transpilation config; unit testing the math engine is mandatory

**See:** `.planning/research/STACK.md` for full alternatives considered and version compatibility table.

### Expected Features

The feature set is narrow and precise. The MVP is table stakes for the category — anything missing makes the product feel broken. The differentiators are specific choices that competitors handle poorly: offering both equal and proportional tip/tax split, supporting shared-item assignment to subsets (not just all-or-one), and being zero-friction (no login). Anti-features to resist: OCR, accounts, real-time sync, currency conversion, and payment APIs are all scope traps that break the client-side constraint.

**Must have (table stakes) — v1:**
- Add/remove people by name — summary is meaningless without names
- Add/edit/remove line items with name and price — core data entry
- Assign items to one or more people, including shared subsets — equal-split-only tools feel broken for real restaurant bills
- Running subtotal visible as items are added — user needs to verify against the physical receipt
- Tip calculation: 15/18/20% presets + custom percent input — presets cover 90% of use cases
- Tax calculation: enter amount or percentage — on every US restaurant receipt
- Tip split method: equal or proportional — low complexity, high fairness value
- Tax split method: equal or proportional — mirrors tip method; inconsistency here is a competitor weakness
- Per-person summary with itemized breakdown and rounded-up total — the product's entire purpose
- Mobile-responsive layout with large tap targets — primary use context is a phone at the table
- Edit/delete items and people — typos and re-reads are constant

**Should have (competitive) — v1.x after validation:**
- Custom tip dollar amount — add when users report needing it
- Per-item quantity field — eliminates duplicate rows for multiple drinks
- Copy-friendly formatted output ("Alice owes $23.50") — bridges gap from calculation to payment
- Keyboard-friendly tab order — power-user data entry

**Defer (v2+):**
- Save to localStorage — useful but not needed at the table
- URL-encoded shareable link — valuable but requires URL state encoding work
- Receipt OCR — high complexity, validate demand before building
- Payment app integration (Venmo/Zelle) — restricted APIs, compliance overhead

**See:** `.planning/research/FEATURES.md` for full prioritization matrix and competitor comparison.

### Architecture Approach

The architecture is three strict layers: (1) a pure TypeScript calculation engine with no React imports, (2) a Zustand state store holding only inputs (never derived totals), and (3) React UI panels that read from the store and render engine output via a single `useBillSummary` hook. The engine is the highest-risk piece and must be built and tested first. Components are purely presentational — they dispatch actions to the store and render what the hook returns. No math lives in JSX.

**Major components:**
1. Calculation Engine (`src/engine/`) — pure functions: allocate item costs, compute tip/tax shares, reconcile rounding; no React, fully unit-tested
2. App State Store (`src/store/`) — Zustand store holding only input data: `people[]`, `items[]`, `assignments{}`, `tip`, `tax`; no stored totals
3. UI Panels (`src/components/`) — People, Items, Assignment, Tip/Tax, Summary panels; read from store, render engine output; no math
4. `useBillSummary` hook (`src/hooks/`) — single bridge: reads store state, calls engine, returns display-ready per-person totals with memoization

**Build order forced by dependencies:** Types → Engine → Store → Hook → Panels (People → Items → Assignment → Tip/Tax → Summary).

**See:** `.planning/research/ARCHITECTURE.md` for full data flow, state shape, anti-patterns, and code examples.

### Critical Pitfalls

Six critical pitfalls were identified, all concentrated in the math engine and state architecture. Four of the six must be addressed in Phase 1 before any UI is built. The other two are Phase 2 UI concerns.

1. **Floating-point arithmetic for money** — Use integer cents throughout all calculations; convert to dollars only at display. `0.1 + 0.2 !== 0.3`. With party sizes of 3 or 7, float errors are nearly guaranteed to produce off-by-a-penny totals that users notice immediately.

2. **Rounding applied at multiple stages** — Maintain one `owedCents` accumulator per person; add item shares, tip share, and tax share in cents before any rounding. Rounding is not associative — round-then-add differs from add-then-round.

3. **Proportional distribution without largest-remainder reconciliation** — When tip or tax is distributed proportionally, naive float multiplication causes the sum of individual shares to diverge from the tip total by 1-2 cents. Apply the largest-remainder method: take floor of each person's share in cents, distribute remaining cents to those with the largest fractional parts. This is an algorithm, not a formula — implement and test it explicitly.

4. **Items with zero sharers** — Division by zero produces NaN that propagates silently through all derived totals. Validate that every item has at least one sharer before running any calculation. Enforce this in the UI: block calculation and show an error when any item has no one assigned.

5. **Derived totals stored in state** — Storing `person.total` or `bill.totalWithTip` in state creates stale values when any input changes. Treat all totals as pure derived values computed fresh on every render via `useMemo`. Never store computed values — only store inputs.

6. **"Round up each person" semantics undefined** — `Math.ceil` per person produces a surplus over the actual bill. Define explicitly: the surplus is displayed as "extra tip" and shown inline next to each person's total. This is a display post-processing step, not a change to the math engine.

**See:** `.planning/research/PITFALLS.md` for full pitfall list, warning signs, recovery strategies, and "looks done but isn't" checklist.

---

## Implications for Roadmap

Based on combined research, the dependencies and risks strongly suggest a four-phase structure: foundation first (math engine and state architecture), then data entry UI, then the core output (summary and assignment), then polish.

### Phase 1: Foundation — Types, Engine, and State Architecture

**Rationale:** The calculation engine is the highest-risk piece of the entire app. Four of the six critical pitfalls live here. Building any UI before the engine is verified correct means building on a broken foundation. Architecture research explicitly recommends engine-first with tests before any React. This phase produces no visible UI but eliminates the primary failure mode.

**Delivers:** Working, fully-tested calculation engine; Zustand store with correct state shape; TypeScript types for all data; Vitest test suite verifying per-person totals sum correctly for party sizes 1–10.

**Addresses (from FEATURES.md):** Arithmetic correctness underpinning all P1 features; tip split methods (equal and proportional); tax split methods; rounding.

**Avoids (from PITFALLS.md):** Float arithmetic errors (Pitfall 1), inconsistent rounding (Pitfall 2), proportional distribution cent gap (Pitfall 5), stale derived state (Pitfall 6), zero-sharer validation (Pitfall 4).

**Research flag:** Standard patterns. The math algorithms (integer cents, largest-remainder) are well-documented. No additional research needed — implement and test.

### Phase 2: Data Entry UI — People, Items, and Assignment

**Rationale:** Once the engine is correct, the next dependency chain is people → items → assignments. These three panels must exist before the summary can show anything meaningful. Assignment panel (shared items) is where FEATURES.md identified the key differentiator over naive splitters. The mobile UX constraint applies most acutely to data entry.

**Delivers:** Working data entry flow — add/edit/remove people and items, assign items to individuals or shared subsets, running subtotal visible. No summary panel yet, but the store state is fully populated.

**Addresses (from FEATURES.md):** Add people by name, add/edit/remove line items, assign items to person(s) including shared subsets, running subtotal, edit/delete, mobile-responsive layout (P1 table stakes).

**Avoids (from PITFALLS.md):** Zero-sharer validation surfaced in UI (Pitfall 4), React list keys using stable IDs not array indices (performance trap), mobile numeric keyboard (`inputmode="decimal"` on price inputs).

**Research flag:** Standard patterns. React form handling, Zustand mutations with Immer, Tailwind mobile layout are all well-documented. No additional research needed.

### Phase 3: Output — Tip/Tax Config and Per-Person Summary

**Rationale:** Tip/Tax configuration depends on items existing (needs a subtotal) — it can't be meaningfully tested until Phase 2 is complete. The Summary panel depends on everything: people, items, assignments, tip, and tax. This is the visible product — what users see when the bill is split.

**Delivers:** Tip presets (15/18/20%) + custom input; tax entry (amount or %); equal vs. proportional split method selectors; per-person summary panel with itemized breakdown and rounded-up total; rounding surplus displayed as extra tip (Pitfall 3 resolution).

**Addresses (from FEATURES.md):** Tip calculation with presets, tax calculation, tip split method, tax split method, per-person summary with rounding, all P1 table stakes complete.

**Avoids (from PITFALLS.md):** "Round up each person" surplus defined and displayed (Pitfall 3); tip/tax UI terminology made human-readable with examples ("everyone pays the same tip" vs. "tip matches your food share").

**Research flag:** Standard patterns for tip/tax UI. The rounding surplus display (Pitfall 3) should be defined in requirements before implementation — what exactly is shown, where, and in what format.

### Phase 4: Polish and v1.x Features

**Rationale:** After core functionality is verified correct, add the competitive differentiators that make the product feel professional: copy-friendly output, keyboard navigation, quantity fields, and any UX improvements surfaced by testing. These are additive, low-risk changes that do not touch the engine.

**Delivers:** Copy-friendly formatted summary text ("Venmo @alice $23.50"), per-item quantity field, keyboard tab-order optimization, undo on item deletion (or confirmation dialog), summary optimized for screenshotting, zero-error empty states.

**Addresses (from FEATURES.md):** P2 features — custom tip dollar amount, per-item quantity, copy-friendly output, keyboard navigation.

**Avoids (from PITFALLS.md):** No summary/receipt view UX pitfall, no undo on deletion UX pitfall, clipboard API using `navigator.clipboard.writeText()` (not deprecated `execCommand`).

**Research flag:** Standard patterns. No additional research needed.

### Phase Ordering Rationale

- **Engine before UI:** Four of six critical pitfalls are in the math engine. Building UI on unverified math means debugging math through the UI, which is slow and error-prone. The test suite verifying the engine is the risk mitigation for the entire project.
- **Data entry before output:** The summary panel has a hard dependency on people, items, and assignments being in the store. There is no shortcut around this ordering — it is a data dependency.
- **Tip/Tax with Summary, not with Items:** Tip and tax percentages are meaningless without a subtotal. Grouping Tip/Tax config with the Summary panel (both require items to exist) is more cohesive than splitting it across phases.
- **Polish last:** v1.x features (quantity, copy output, keyboard nav) are additive and do not affect correctness. Deferring them keeps each phase focused and allows early validation of the core value.

### Research Flags

Phases needing additional research during planning:
- **Phase 3 (Rounding surplus UI):** The exact UX for displaying the rounding surplus ("$0.67 extra goes to tip") is not specified. This should be defined in requirements before building — what does the surplus line look like, is it per-person or aggregate, does it appear only when round-up mode is active?

Phases with standard patterns (no additional research needed):
- **Phase 1:** Integer-cent arithmetic and largest-remainder method are well-documented algorithms. Implement and unit-test.
- **Phase 2:** React form handling, Zustand mutations, Tailwind mobile layout — all well-documented.
- **Phase 4:** Clipboard API, keyboard navigation — MDN documentation is authoritative.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core technology choices are HIGH confidence and stable. Specific major versions (React 19, Vite 6, Tailwind 4, Zustand 5) are MEDIUM — all released before August 2025 training cutoff but may have patch increments. Verify with `npm info <package> version` before first install. |
| Features | MEDIUM | Bill splitting is a mature category; UX conventions are stable. Competitor feature claims (Splitwise, Tab) are from training knowledge, not live verification. Core feature decisions (what to include/exclude) are HIGH confidence. |
| Architecture | MEDIUM | Patterns (unidirectional data flow, pure engine, no derived state in store) are well-established React community guidance from multiple sources, stable since 2020. MEDIUM rather than HIGH because external sources were unavailable during research. |
| Pitfalls | HIGH | Floating-point arithmetic pitfalls are computer science fundamentals (IEEE 754), not opinion. Largest-remainder method is a well-known algorithm. Stale derived state patterns are established React community guidance. UX pitfalls are MEDIUM (inferred from known competitors). |

**Overall confidence: MEDIUM**

The research is reliable for making build decisions. The primary uncertainty is version-specific npm details, not architectural or feature decisions. All architectural recommendations are based on stable, multi-year community consensus.

### Gaps to Address

- **Package version verification:** Run `npm info react version`, `npm info vite version`, `npm info tailwindcss version`, `npm info zustand version` before project initialization to confirm current latest versions.
- **Tailwind v4 install flow:** Tailwind v4 changed from PostCSS to a Vite plugin. Verify the exact install steps against the official Tailwind v4 migration guide before scaffolding.
- **Rounding surplus UX specification:** The PITFALLS research identifies that "round up each person" needs an explicit surplus-display rule. This must be resolved in requirements (Phase 3 planning) before implementation begins.
- **Mobile device testing:** The PITFALLS research flags that `inputmode="decimal"` behavior on iOS Safari vs. Android Chrome must be verified on real devices — desktop dev tools simulate but do not replicate all behaviors.

---

## Sources

### Primary (HIGH confidence)
- IEEE 754 double-precision specification — floating-point arithmetic pitfalls (Pitfall 1, 2, 5)
- Largest-remainder method — proportional cent distribution algorithm (Pitfall 5)
- React documentation, unidirectional data flow — architecture patterns
- Dan Abramov / React core team writing on derived state — stale state pitfalls (Pitfall 6)
- ECMAScript specification, `Math.round` / `Math.ceil` / integer arithmetic — rounding patterns

### Secondary (MEDIUM confidence)
- Training knowledge: React 19, Vite 6, Tailwind CSS 4, Zustand 5 release notes (training cutoff August 2025)
- Training knowledge: Splitwise, Tab, Settle Up, Dine & Split feature sets — competitor analysis
- MDN documentation: `inputmode="decimal"`, `navigator.clipboard.writeText()` — integration gotchas
- Zustand, Immer, Vitest documentation — stack pattern verification

### Tertiary (LOW confidence)
- Specific patch versions for all packages — verify with `npm info <package> version` before install; training cutoff means these may have incremented
- Competitor feature sets in live apps — not verified via live web access; use for directional decisions only, not marketing claims

---

*Research completed: 2026-02-19*
*Ready for roadmap: yes*
