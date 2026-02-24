---
phase: 07-history-edit-mode
status: complete
researched: 2026-02-24
confidence: HIGH
---

# Phase 7 Research: History List + Edit Mode

**Scope:** Build the history list UI, coordinate app entry between onboarding and history, implement load/edit flow for saved splits, and add save/update button.

## What Already Exists (Phase 6 Complete)

All persistence infrastructure is in place:

| Artifact | Location | Ready |
|----------|----------|-------|
| `useHistoryStore` | `src/store/historyStore.ts` | save/update/remove/restore actions, persist middleware, 50-entry cap |
| `useBillStore.loadConfig()` | `src/store/billStore.ts:227` | Replaces entire config from a saved split |
| `useBillStore.setCurrentSplitId()` | `src/store/billStore.ts:233` | Tracks editing state (null = new, non-null = editing saved) |
| `useBillStore.reset()` | `src/store/billStore.ts:212` | Clears config + currentSplitId |
| `deserializeBillConfig` | `src/storage/deserializeBillConfig.ts` | Branded type rehydration at parse boundary |
| `safeLocalStorage` | `src/storage/localStorageAdapter.ts` | try/catch wrapped localStorage access |

## Key Design Decisions

### 1. History as default landing for returning users

**Decision:** When `useHistoryStore.getState().splits.length > 0`, initial tab is `'history'`. Otherwise `'people'`.

**Rationale:** Returning users with saved splits expect to see them on open. New users with no history skip directly to the editor.

**Coordination with onboarding:** The onboarding screen gates rendering before any tab logic runs. Order is: onboarding check (synchronous) → render AppShell → initial tab (synchronous read of history store). No race condition because both reads happen before first paint.

### 2. HistoryRow derives display data from config (no stored totals)

**Decision:** HistoryRow calls `computeSplit(split.config)` to get the total for display. People names come directly from `split.config.people`.

**Rationale:** Matches the "inputs only" philosophy — no stale derived data. With 50 entries max and computeSplit being fast, performance is not a concern.

**Display format:** "Jan 27 · Alice, Bob + 1 · $87.50"
- Date: `Intl.DateTimeFormat` short format from `savedAt`
- People: first 2 names + overflow count
- Total: sum of `roundedTotalCents` from engine result

### 3. Extend useUndoDelete with DeletedSplit kind

**Decision:** Add `DeletedSplit` to the existing `DeletedSnapshot` union. Reuse the exact same hook, timer, and UndoToast component.

**Why not a separate hook:** The undo pattern is identical — capture snapshot, delete optimistically, show toast, restore on undo. Different `kind` is the only variation.

### 4. Load flow: replace config + switch to 'people' tab

**Decision:** On tap of a history row:
1. `useBillStore.getState().loadConfig(split.config)`
2. `useBillStore.getState().setCurrentSplitId(split.id)`
3. `setActiveTab('people')` — user starts at people tab to review/edit

**Why 'people' tab:** Matches the natural left-to-right flow. User can review who's in the bill, then proceed through items → assign → split.

### 5. Save vs Update button in SummaryPanel

**Decision:** Show "Save Split" when `currentSplitId === null` (new split). Show "Update Split" when `currentSplitId !== null` (editing saved split).

**Save flow:** `historyStore.save(config)` → `billStore.setCurrentSplitId(newId)` → button label switches to "Update Split"
**Update flow:** `historyStore.update(currentSplitId, config)` → toast "Split updated"

### 6. Editing indicator

**Decision:** Show a subtle banner at top of the editor panels when `currentSplitId !== null`. Text: "Editing saved split" with date. Visible but non-intrusive.

**Location:** Inside AppShell, above the panel area (below SubtotalBar), only visible when editing a saved split. Uses the `savedAt` date from the history entry.

## Pitfalls Addressed

| Pitfall | From Research | Mitigation |
|---------|---------------|------------|
| Onboarding + history coordination (#5) | Synchronous reads; onboarding gates before tab logic | No race condition by design |
| Silent overwrite risk (#6) | currentSplitId distinguishes new vs editing; explicit Save/Update | Never auto-overwrites history |
| computeSplit per history row (perf) | 50-entry cap; computeSplit is fast | No windowing needed |

## Sources

- `.planning/research/ARCHITECTURE.md` — two-store architecture, component boundaries, data flows
- `.planning/research/PITFALLS.md` — pitfalls #5, #6 directly inform app entry and edit mode
- `.planning/phases/06-persistence-foundation/06-VERIFICATION.md` — confirms all store APIs ready
- Existing codebase: AppShell.tsx, TabBar.tsx, useUndoDelete.ts, SummaryPanel.tsx (direct inspection)
