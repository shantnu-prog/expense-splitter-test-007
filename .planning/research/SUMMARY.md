# Project Research Summary

**Project:** Expense Splitter — v1.1 Persistence + Sharing
**Domain:** Client-side restaurant bill-splitting web app (React SPA, no backend)
**Researched:** 2026-02-22
**Confidence:** HIGH

## Executive Summary

This is a v1.1 milestone adding persistence, history management, and payment text sharing to an already-shipped v1.0 bill-splitting SPA (React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Zustand 5.0.11 + immer 11, Vitest 4). The milestone is deliberately scoped to client-side localStorage — no backend, no accounts, no sync. All five new features (auto-save, history list, re-open/edit, delete with undo, and payment text) are achievable with zero new npm dependencies: Zustand's built-in `persist` middleware, `crypto.randomUUID()`, and `Intl.RelativeTimeFormat` cover everything.

The recommended approach is a two-store architecture: a new `useHistoryStore` (persist-wrapped, separate localStorage key `bs-history`) alongside the existing ephemeral `useBillStore`. The critical design decision is that saves are **explicit user actions** (a "Save Split" button), not auto-save-to-history on every keystroke. This preserves the distinction between a work-in-progress and a committed record, avoids overwriting saved splits on incidental edits, and keeps the history list semantically clean. The active bill store remains ephemeral — users open to a clean state or the history list, not a half-finished draft.

The key risks are: (1) TypeScript branded types (`Cents`, `PersonId`, `ItemId`) survive serialization by value but lose their brand on deserialization — a dedicated `deserializeBillConfig()` function must be the single parse boundary; (2) no schema version on day one makes future changes a breaking migration; (3) middleware ordering (`persist` must wrap `immer`, not the reverse) is a silent failure mode; and (4) the app's existing onboarding splash must be coordinated with history hydration to avoid race conditions on first render. All four are preventable in the persistence phase with the right setup decisions made upfront.

---

## Key Findings

### Recommended Stack

All v1.1 capabilities are built on existing dependencies — no new `npm install` entries are needed. Zustand 5.0.11 ships `persist` middleware built-in, and the project already uses `crypto.randomUUID()` for `PersonId` / `ItemId` generation. The two new files are `src/store/historyStore.ts` (persist-wrapped Zustand store) and `src/utils/formatPaymentText.ts` (pure function). One existing file is modified: `src/store/billStore.ts` gets `currentSplitId`, `setCurrentSplitId`, and `loadConfig` actions added, plus `reset()` is updated to clear `currentSplitId`.

**Core technologies (new usage of existing deps):**
- `zustand/middleware persist` (built-in, zustand 5.0.11): Auto-hydration of history on page load — synchronous with localStorage, so no loading-state guards needed in components. Middleware order is `persist(immer(stateCreator))` — reversing it causes persist to silently capture only initial state.
- `crypto.randomUUID()` (browser-native): Stable `SavedSplitId` for history entries — already used for `PersonId` / `ItemId`, maintaining codebase consistency.
- `Intl.RelativeTimeFormat` (browser-native): "Today / Yesterday / 3 days ago" display in history list — zero bundle cost, full browser support since 2020.
- Native `localStorage` via `createJSONStorage`: Storage backend; synchronous API pairs cleanly with Zustand's synchronous hydration path.

**localStorage schema:**
- `bs-history` key: owns `SavedSplit[]` array (all history entries); capped at 50 entries.
- No separate key for active bill — bill store stays ephemeral.
- `version: 1` set from day one with `migrate` stub in persist options.

**New files to create:**

| File | Purpose |
|------|---------|
| `src/store/historyStore.ts` | History Zustand store with persist middleware |
| `src/utils/formatPaymentText.ts` | Pure function for payer-directed payment text |
| `src/utils/formatPaymentText.test.ts` | Vitest tests for all edge cases |
| `src/components/history/HistoryPanel.tsx` | History list UI |
| `src/components/history/HistoryRow.tsx` | Single saved split row |
| `src/components/summary/PaymentTextSection.tsx` | Payer picker + formatted text + copy button |

**See:** `.planning/research/STACK.md` for full implementation details, code examples, and alternatives considered.

### Expected Features

All five v1.1 features are P1 — they are the milestone. The dependency order within the milestone matters: the persistence layer must come first because history list, re-open, and delete all depend on it. Every major competitor gates history behind user accounts; localStorage history is genuinely differentiated for the "at the table, no signup" use case.

**Must have (table stakes) — v1.1:**
- Auto-save active bill session — users expect zero data loss without pressing Save; Zustand `persist` handles this natively on the active bill config.
- Human-readable history entry labels — auto-derived from date + people names + total; no user input required.
- Tap to re-open any saved split — full input state (people, items, assignments, tip, tax) restored into the editor; read-only restores are not acceptable.
- Delete with undo toast — 5-second undo toast already exists in v1.0 for item deletion; history delete reuses the same `useUndoDelete` hook with no new component work.
- Payer selection + payment text — payer-directed "Alice owes YOU $23.50" per non-payer person; copy to clipboard (already wired in v1.0).

**Differentiators (vs Splitwise, Tab, Tricount):**
- Zero-friction, no-account history — every major competitor requires accounts; localStorage is the only approach that works offline and instantly.
- Full input restoration for editing — competitors store outputs; this app stores the full `BillConfig`, enabling complete re-editing after save.
- Ready-to-send payment text — plain copy-paste text immediately usable in any payment app without requiring Venmo/Zelle API integration.

**Defer to v2+:**
- Named saves / custom titles — auto-labels are sufficient; add only if user feedback demands.
- Payment deep links (Venmo/Zelle) — Venmo API is restricted to approved partners; Zelle has no public deep-link spec.
- Cloud sync / cross-device history — requires backend; explicitly out of scope per PROJECT.md.
- Export to CSV / PDF — rare use case; per-person clipboard already covers 95% of needs.

**See:** `.planning/research/FEATURES.md` for full prioritization matrix, feature dependency graph, and competitor comparison table.

### Architecture Approach

The v1.1 architecture adds a second Zustand store (`useHistoryStore`) alongside the existing `useBillStore`, connected by explicit imperative calls rather than subscriptions. History entries store only the full `BillConfig` input (no derived totals); display metadata (people names, total) is derived fresh at render time via `computeSplit()`. The calculation engine and all existing data-entry panels are untouched. The persistence layer is a single localStorage key (`bs-history`) holding the entire `SavedSplit[]` array, managed atomically by Zustand's persist middleware.

**Major components:**
1. `useHistoryStore` (new) — persist-wrapped store holding `SavedSplit[]`; actions: `save`, `update`, `load`, `remove`, `restore`; enforces 50-entry cap in `save()`.
2. `useBillStore` (modified) — adds `currentSplitId: SavedSplitId | null`, `setCurrentSplitId`, `loadConfig`; updates `reset()` to clear `currentSplitId`.
3. `HistoryPanel` + `HistoryRow` (new) — history list UI; reuses `useUndoDelete` for delete/undo; `HistoryRow` derives total via `computeSplit(split.config)`.
4. `PaymentTextSection` (new) — local `useState<PersonId | null>` for payer; calls `formatPaymentText(result, people, payerId)`; reuses existing `useCopyToClipboard`. Payer state stays local — it must NOT enter the bill store or history.
5. `SummaryPanel` (modified) — adds "Save Split" / "Update Split" button based on `currentSplitId`; renders `<PaymentTextSection>` below person cards.
6. `formatPaymentText.ts` (new) — pure utility; sibling to existing `formatSummary.ts`; handles payer exclusion, zero-amount guard, and single-person edge case.
7. `AppShell.tsx` + `TabBar.tsx` (modified) — add `'history'` tab; initial-tab logic: show history if splits exist, else people.

**Key patterns to follow:**
- Unidirectional data flow — user actions trigger explicit store calls; no subscriptions between stores.
- Inputs-only storage — `BillConfig` (engine inputs) stored, never derived outputs; engine re-computes on demand.
- Integer cents throughout — `centsToDollars()` used in `formatPaymentText` and `HistoryRow`; no floating-point display arithmetic.
- Explicit edit mode — `currentSplitId` in `useBillStore` is the single source of truth for "are we editing a saved split"; shown as "Editing saved split" indicator in UI.

**Build order (dependency-ordered):**
`historyStore` → `billStore` changes → `formatPaymentText` utility → History UI → Tab changes → AppShell → `PaymentTextSection` → `SummaryPanel` modifications.

**See:** `.planning/research/ARCHITECTURE.md` for full data flow diagrams, anti-patterns, code examples, and scaling considerations.

### Critical Pitfalls

Eight pitfalls were identified; the top five are critical and must be addressed before any UI is built on top of the persistence layer.

1. **Branded types lose brand on JSON round-trip** — `Cents`, `PersonId`, `ItemId` are plain `number`/`string` at runtime; `JSON.parse` strips the TypeScript brand silently. Fix: write a `deserializeBillConfig()` function that re-applies `cents()`, `personId()`, `itemId()` constructors at the single localStorage parse boundary. Unit-test the round-trip.

2. **No schema version = breaking migration on first field change** — omitting `version: 1` means the first schema change has no upgrade path for existing users. Fix: set `version: 1` and include a `migrate` stub in persist options from day one. Cost: five lines of code. Recovery cost without this: HIGH.

3. **`localStorage.setItem` throws synchronously in Private Browsing and on quota** — `QuotaExceededError` and `SecurityError` (Safari Private mode) are synchronous throws. An uncaught throw crashes the entire app. Fix: centralize all localStorage access in `src/storage/localStorageAdapter.ts` with `safeSetItem`/`safeGetItem` wrappers; surface a non-blocking toast on failure.

4. **Middleware ordering: `persist` must wrap `immer`** — `immer(persist(...))` causes persist to silently capture only initial state. Fix: always `create<T>()(persist(immer(stateCreator), options))`. Verify immediately in DevTools Application tab after wiring.

5. **Onboarding + history timing race on first render** — the existing `useOnboarding` hook reads localStorage synchronously; history may hydrate asynchronously via `useEffect`. Fix: implement a single `useAppEntry` hook that reads both localStorage values synchronously before any rendering decision. Define the explicit entry state machine: new user → splash → empty history; returning user with history → history list directly.

6. **Editing a loaded split silently overwrites the saved original** — if auto-save were wired to a history-loaded bill without explicit edit mode, any mutation would overwrite the saved entry irreversibly. Fix: use `currentSplitId !== null` in `useBillStore` as the edit-mode signal; show "Editing saved split" indicator; provide explicit "Save changes" action.

7. **Payment text edge cases produce confusing output** — payer shown in their own output, zero-amount persons shown as owing $0.00, single-person bill producing empty string. Fix: `formatPaymentText` must filter `personId === payerPersonId`, filter `roundedTotalCents <= 0`, and return `"Everyone is settled up."` when no lines remain.

8. **Auto-save writes on every keystroke (performance trap)** — Zustand persist fires on every store mutation; price inputs mutate on every keypress. Fix: keep price/tip/tax inputs as local component state; commit to store on `onBlur` only. This is already the v1.0 pattern — verify it is maintained.

**See:** `.planning/research/PITFALLS.md` for full pitfall details, warning signs, recovery strategies, and the "looks done but isn't" checklist.

---

## Implications for Roadmap

Based on the feature dependency graph and pitfall-to-phase mapping, this milestone has three natural phases within v1.1:

### Phase 1: Persistence Foundation

**Rationale:** All other v1.1 features depend on a working, correct localStorage layer. The pitfalls that cause the most severe and hardest-to-recover failures (branded type deserialization, schema versioning, storage error handling, middleware ordering) all belong here. This is the riskiest phase technically and must be locked down before any UI is built on top of it. The 50-entry history cap also belongs here — it is a single-line guard in the `save()` action that prevents quota errors from the start.

**Delivers:** `useHistoryStore` with persist middleware (version: 1, migrate stub, 50-entry cap); `deserializeBillConfig()` with unit tests verifying round-trip; `localStorageAdapter.ts` with `safeSetItem`/`safeGetItem` error handling; `useBillStore` updated with `currentSplitId`, `loadConfig`, `setCurrentSplitId`, updated `reset()`.

**Addresses:** Auto-save current bill session (table stakes); schema versioning for returning users; storage quota safety.

**Avoids:** Branded type deserialization bug (Pitfall 1), no schema version (Pitfall 2), unhandled localStorage throws (Pitfall 3), middleware ordering error (Pitfall 4).

**Must verify:** DevTools Application tab shows `bs-history` key updating on save/delete; `BillConfig` round-trip unit test passes; app works (no crash) in Safari Private Window.

### Phase 2: History List + Edit Mode

**Rationale:** With the persistence layer working, the history UI can be built. This phase introduces the app's new entry point (history list vs. new split), which requires coordinating with the existing onboarding flow. The edit-mode concept (`currentSplitId`) must be explicit from the start of this phase — retrofitting it after save/load is wired is the primary source of the silent-overwrite pitfall. History delete reuses the existing `useUndoDelete` hook with no new component.

**Delivers:** `HistoryPanel` + `HistoryRow`, history tab in `TabBar` + `AppShell`, re-open/edit flow with explicit "Editing saved split" indicator, "Save Split" / "Update Split" button in `SummaryPanel`, delete with undo toast, `useAppEntry` hook coordinating onboarding + history state, empty state with "New Split" CTA, initial-tab logic (history if splits exist, else people).

**Addresses:** History list (P1), re-open and edit saved splits (P1), delete with undo (P1), Save Split button (P1).

**Avoids:** Onboarding/history timing race (Pitfall 5), silent overwrite of saved splits on edit (Pitfall 6).

**Must verify:** Entry state machine tested manually — new user flow and returning user flow both correct; loading a history entry and mutating shows "Update Split" button, not silent overwrite; undo toast restores entry with all data intact; all localStorage keys (`bill-splitter-active`, `bs-history`, onboarding key) are distinct and do not collide.

### Phase 3: Payment Text + Polish

**Rationale:** Payment text has no dependencies on the history layer — it reads from the existing `EngineResult` and `people` already computed in `SummaryPanel`. It is isolated enough to be built last and independently verified. Start with the pure `formatPaymentText` function and its tests before building any UI. This phase also applies storage quota warning toast and any UX polish items.

**Delivers:** `formatPaymentText.ts` pure utility with full edge-case handling (payer exclusion, zero-amount guard, single-person fallback) and unit tests; `PaymentTextSection` component with payer dropdown + readonly textarea + copy button; integration into `SummaryPanel`; storage quota error toast (P2).

**Addresses:** Payer selection (P1), payment text generation per person (P1), copy individual payment text (P1), copy all payment text (P2), storage quota error handling (P2).

**Avoids:** Payment text edge cases — payer self-exclusion, zero-amount persons, single-person bill (Pitfall 7); payer selection reset when new split is loaded.

**Must verify:** All five `formatPaymentText` unit tests pass; payer selection resets when a different split is loaded or `reset()` is called; "Everyone is settled up." shown for single-person bill; auto-save write frequency — DevTools shows writes only on blur, not on every keypress.

### Phase Ordering Rationale

- Phase 1 must come first because history list, re-open, delete, and save are all built on top of it. Building UI before the persistence layer is correct is the single most common cause of hard-to-debug data integrity issues in localStorage-backed apps.
- Phase 2 groups history UI and edit mode together because the edit-mode concept (`currentSplitId`) must be designed before any history row interaction is wired — you cannot add it cleanly afterward without auditing every save/load call site.
- Phase 3 is last because payment text is independent and additive — it does not change any existing component's contract, it only extends `SummaryPanel` with a new section. Phases 1 and 2 can be validated in isolation without payment text complexity.
- The 50-entry cap belongs in Phase 1 to prevent quota errors from the very first save.
- The `useAppEntry` hook belongs in Phase 2 because it is meaningless until the history tab exists as an entry point.

### Research Flags

Phases with well-documented patterns (skip research-phase — implementation path is clear):
- **Phase 1:** Zustand `persist` + `immer` integration is fully documented in official Zustand docs with exact middleware ordering and all options. The `deserializeBillConfig` pattern follows directly from the existing `BillConfig` type definition. No additional research needed.
- **Phase 3:** `formatPaymentText` is a pure function with a known interface. `PaymentTextSection` reuses existing `useCopyToClipboard`. No additional research needed.

Phase that may benefit from a brief planning review:
- **Phase 2:** The `useAppEntry` hook that coordinates onboarding + history is a custom pattern. The exact React hook implementation (synchronous localStorage reads vs. `useSyncExternalStore`) may warrant a quick review during Phase 2 planning, particularly given React 19's new primitives. This is LOW risk — the synchronous read approach is well-understood — but worth a one-time check before implementation.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zustand persist middleware docs are comprehensive and authoritative. All recommendations use zero new dependencies — the existing versions are confirmed correct (zustand 5.0.10 fixed a persist state-inconsistency bug; project is at 5.0.11). Middleware ordering verified against official docs and community discussion. |
| Features | MEDIUM-HIGH | Table stakes and differentiators are well-grounded in competitor analysis and user behavior patterns. Payment text format conventions are MEDIUM confidence — derived from community patterns and Splitwise/Venmo conventions, not an official specification. The recommended format is correct but exact wording is an opinionated choice. |
| Architecture | HIGH | v1.0 codebase was directly inspected; all existing patterns (stores, hooks, utils) are known quantities. The two-store split and explicit save approach are recommended by Zustand docs and community guidance. Data flow diagrams are based on real codebase file structure. |
| Pitfalls | HIGH | Branded type and localStorage pitfalls are directly derived from the existing codebase types (`src/engine/types.ts`) and MDN. Middleware ordering pitfall is confirmed by community discussion and official docs. Onboarding/history coordination pitfall is reasoned from the existing `useOnboarding` hook behavior. Payment text edge cases are derived from `computeSplit` engine output guarantees. |

**Overall confidence:** HIGH

### Gaps to Address

- **Payment text format is opinionated, not standardized:** The exact wording "Alice owes YOU $23.50" vs. "Hey Alice, your share is $23.50. Send to Bob!" is not defined by any spec. Research examined Splitwise and Venmo conventions and recommends a simple direct format. If user testing suggests different phrasing, the pure function is trivially modified with no architectural impact.

- **50-entry history cap is a conservative estimate:** The cap prevents localStorage quota errors on iOS Safari (known ~2.5 MB eviction threshold). If real user data shows bills are much larger than modeled (e.g., large group corporate meals with 30 items and 20 people), the cap may need to be lowered. It is a single integer constant in `save()` — adjusting it requires no architectural change.

- **`useAppEntry` hook design is not fully prescribed:** The research identifies the problem (onboarding + history timing race) and the solution shape (synchronous reads, explicit state machine) but leaves the exact React hook implementation to Phase 2 planning. This is a small design decision, not an architectural gap.

- **Performance at edge of scale:** `computeSplit` called per `HistoryRow` is flagged as a potential issue at 200+ entries. At the 50-entry cap this is not a practical concern, but `useMemo` keyed on `split.id` should be applied from the start to avoid a visible regression if the cap is raised later.

---

## Sources

### Primary (HIGH confidence)
- [Zustand persist middleware — official docs](https://zustand.docs.pmnd.rs/middlewares/persist) — persist options, partialize, version, migrate, createJSONStorage API
- [Zustand persisting store data — official docs](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) — hydration behavior, localStorage vs async storage tradeoffs
- [Zustand immer middleware — official docs](https://zustand.docs.pmnd.rs/integrations/immer-middleware) — middleware combination ordering
- [MDN: Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) — browser support baseline (Chrome 92+, Safari 15.4+, Firefox 95+)
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — localStorage 5 MB limit, quota error behavior, Safari eviction
- Existing v1.0 codebase inspection — `billStore.ts`, `engine/types.ts`, `AppShell.tsx`, `SummaryPanel.tsx`, `useUndoDelete.ts`, `formatSummary.ts` (direct file inspection of all integration points)

### Secondary (MEDIUM confidence)
- [Zustand middleware priority discussion, pmndrs/zustand Discussion #2389](https://github.com/pmndrs/zustand/discussions/2389) — devtools outermost, immer innermost, community-verified
- [Zustand immer + persist ordering, pmndrs/zustand Discussion #1143](https://github.com/pmndrs/zustand/discussions/1143) — middleware ordering failure mode documented
- [Zustand function serialization bug, pmndrs/zustand Discussion #2556](https://github.com/pmndrs/zustand/discussions/2556) — persist without partialize keeps stale function references
- [WebKit: Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/) — iOS Safari 7-day script-writable storage cap
- [Splitwise community feedback](https://feedback.splitwise.com/) — confirmed no draft-save behavior; settlement message format examples
- [Venmo payment request format](https://help.venmo.com/cs/articles/payments-requests-faq-vhel149) — confirms note field and amount format conventions

### Tertiary (LOW confidence)
- Tricount offline/history behavior — based on marketing page, not implementation docs; used only for competitor feature matrix

---
*Research completed: 2026-02-22*
*Ready for roadmap: yes*
