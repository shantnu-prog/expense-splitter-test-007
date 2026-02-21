# Pitfalls Research

**Domain:** Expense / Bill Splitting Web App — v1.1 Persistence, History & Payment Text additions to existing React+Zustand+Immer architecture
**Researched:** 2026-02-22
**Confidence:** HIGH for localStorage/serialization pitfalls (well-documented); HIGH for branded-type serialization (directly derived from existing codebase); MEDIUM for payment text edge cases (reasoned from existing formatSummary.ts and domain knowledge)

---

## Critical Pitfalls

### Pitfall 1: Branded Types Silently Survive Serialization But Lose Their Type Brand on Deserialization

**What goes wrong:**
`Cents`, `PersonId`, and `ItemId` are TypeScript "branded" types: at runtime they are plain `number` and `string` respectively. `JSON.stringify` serializes them without issue — the underlying value is preserved. The failure happens on `JSON.parse`: the result is a plain `number` or `string`, not a branded type. TypeScript's type system does not enforce brands at runtime. So `parsedState.config.tip.amountCents` has the correct integer value but is typed as `number`, not `Cents`. The engine and store accept it without complaint at compile time because TypeScript cannot detect the missing brand at runtime. The app works — until branded-type-narrowing logic (e.g., `if (val as Cents)`) or a future strict type check catches that the deserialized value was never run through the `cents()`, `personId()`, or `itemId()` constructor.

**Why it happens:**
TypeScript branded types are a compile-time fiction. There is no runtime `instanceof` check or property that distinguishes `Cents` from `number`. Developers serialize and deserialize assuming the type is preserved because `JSON.parse(JSON.stringify(x))` produces the same *value*, not realizing the brand is gone.

**How to avoid:**
Write an explicit deserializer/revivor function that re-applies constructor helpers after `JSON.parse`. Pattern:

```typescript
function deserializeBillConfig(raw: unknown): BillConfig {
  const r = raw as Record<string, unknown>;
  return {
    people: (r.people as Array<{id: string; name: string}>).map(p => ({
      id: personId(p.id),
      name: p.name,
    })),
    items: (r.items as Array<{id: string; label: string; priceCents: number; quantity: number}>).map(i => ({
      id: itemId(i.id),
      label: i.label,
      priceCents: cents(i.priceCents),
      quantity: i.quantity,
    })),
    assignments: Object.fromEntries(
      Object.entries(r.assignments as Record<string, string[]>).map(
        ([k, v]) => [itemId(k), v.map(personId)]
      )
    ) as Assignments,
    tip: deserializeTipTax(r.tip),
    tax: deserializeTipTax(r.tax),
  };
}
```

This deserializer goes in a `src/storage/` module. It is the ONLY place `JSON.parse` results are consumed — everything above it receives properly branded types.

**Warning signs:**
- `JSON.parse(localStorage.getItem(...))` called directly and the result is spread into store state without wrapping in constructor helpers
- `computeSplit` accepting a config loaded from localStorage where `tip.amountCents` was never passed through `cents()`
- TypeScript errors appearing after adding `as Cents` type assertions in strict mode that catch raw `number` being passed where `Cents` is expected

**Phase to address:**
localStorage persistence phase (first). Define the serializer/deserializer before wiring auto-save. The deserializer must have unit tests that verify round-tripping a `BillConfig` through `JSON.stringify → JSON.parse → deserialize` produces a value equal to the original and passes TypeScript's branded type checks.

---

### Pitfall 2: No Schema Version on Stored Data Causes Silent Corruption When Fields Are Added or Renamed

**What goes wrong:**
A user saves a split in v1.1 (schema version 0). The app ships v1.2 which adds a field (e.g., `savedAt: number` on each history entry, or `currency` on `BillConfig`). The user opens the app. The old stored blob is deserialized. The new field is `undefined`. If any code path reads the new field without a null check, the engine throws or returns NaN. If the deserializer does not version-check first, it happily returns a partially-populated object that breaks the running engine. This is a production crash for returning users — new users are unaffected, so the bug is invisible in testing.

**Why it happens:**
Developers write the initial serializer against the current schema with no thought for future changes, because "we haven't changed anything yet." The version field is the easiest thing to forget because it has zero value on day one.

**How to avoid:**
Embed a `schemaVersion: number` field in every stored blob at write time, starting at `1`:

```typescript
interface PersistedHistory {
  schemaVersion: 1;
  entries: HistoryEntry[];
}
```

At read time, check `schemaVersion` before deserializing:

```typescript
function loadHistory(): HistoryEntry[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      // Unknown or older version — discard and start fresh
      localStorage.removeItem(HISTORY_KEY);
      return [];
    }
    return deserializeHistory(parsed);
  } catch {
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }
}
```

For v1.1 this means: start at `schemaVersion: 1`, define `CURRENT_SCHEMA_VERSION = 1`, and discard on mismatch rather than attempt migration. Migration logic can be added later if needed — discarding is always safe for a history list (data loss is recoverable by re-entering a split, which is the same cost as not having persistence at all).

**Warning signs:**
- Stored blobs with no `schemaVersion` field
- Deserializer that reads `parsed.entries` without first checking `parsed.schemaVersion`
- Any schema change shipped without a version bump

**Phase to address:**
localStorage persistence phase (first). The schema version is a design decision, not an afterthought. Include it in the initial storage spec before writing the first line of persistence code.

---

### Pitfall 3: `localStorage.setItem` Throws Synchronously Without Try-Catch, Crashing the App

**What goes wrong:**
`localStorage.setItem` throws `DOMException: QuotaExceededError` when the origin's 5 MiB storage budget is full. It also throws a `SecurityError` in Safari Private Browsing mode. Both are synchronous throws — not rejected Promises. A Zustand `persist` middleware call or a manual `localStorage.setItem` inside a store action that is not wrapped in `try/catch` causes an unhandled exception that propagates up the React call stack, resulting in a blank white screen if no error boundary is present.

**Why it happens:**
`localStorage` API looks synchronous and simple. Developers use it like a plain object without thinking about exception paths. Storage quota is never hit during development with 3 test entries. Safari Private Browsing is not tested locally.

**How to avoid:**
Wrap every `localStorage.setItem` and `localStorage.getItem` call in a try-catch. Centralize all storage access in a single `src/storage/localStorageAdapter.ts` module that handles errors:

```typescript
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    // QuotaExceededError or SecurityError — log and continue
    console.warn('[storage] setItem failed:', e);
    return false;
  }
}
```

If `safeSetItem` returns `false` on auto-save, surface a non-blocking toast: "Could not save — storage full." Do not crash the bill-in-progress. For the history list, implement a MAX_ENTRIES limit (e.g., 50) so quota is bounded. Each `BillConfig` blob is small (< 5 KB for a typical restaurant bill), so 50 entries fits easily within 5 MiB, but the cap prevents edge-case accumulation.

**Warning signs:**
- `localStorage.setItem(key, JSON.stringify(state))` appearing without a surrounding try-catch
- No test for Private Browsing behavior (open app in Safari Private Window and verify it works)
- No MAX_ENTRIES cap on the history list

**Phase to address:**
localStorage persistence phase. The storage adapter is the first thing to build — before the Zustand `persist` middleware integration or any manual setItem calls. If using `persist` middleware, pass a custom `storage` option that wraps the adapter.

---

### Pitfall 4: Middleware Ordering — `persist` Must Wrap `immer`, Not the Other Way Around

**What goes wrong:**
Zustand's `persist` and `immer` middleware must be composed in the correct order: `persist(immer(stateCreator))`. If the order is reversed to `immer(persist(stateCreator))`, the persist middleware's internal `setState` interception does not see immer's draft-mutation model, causing either: (a) the persisted state to always be the initial state (changes not captured), or (b) TypeScript type errors from incompatible generic constraints that are suppressed with `as any` and hide the real bug.

The existing codebase uses `create<BillState>()(immer(stateCreator))`. Adding `persist` means changing the wrapping to `create<BillState>()(persist(immer(stateCreator), options))`. The natural mistake is to do it the other way because immer "feels like" the innermost concern.

**Why it happens:**
Middleware composition order is not intuitive. Developers read "I want to add persist to my existing immer store" and wrap the outer layer without reading the Zustand docs' ordering guidance. The Zustand v5 TypeScript types partially catch this but the error messages are opaque.

**How to avoid:**
Follow Zustand's documented pattern: `create<T>()(devtools(persist(immer(creator), options)))`. Since this project does not use devtools in production, the pattern is: `create<BillState>()(persist(immer(stateCreator), persistOptions))`.

Use `partialize` to persist ONLY the `config` field (not actions):

```typescript
const persistOptions: PersistOptions<BillState, Pick<BillState, 'config'>> = {
  name: 'bill-splitter-active',
  version: 1,
  partialize: (state) => ({ config: state.config }),
};
```

This prevents function serialization issues entirely and keeps the stored blob minimal.

**Warning signs:**
- Zustand TypeScript errors about incompatible `StateCreator` generics when combining persist and immer
- Auto-save never writes to localStorage (check DevTools > Application > Local Storage after any store mutation)
- Auto-save always writes the initial state rather than current state

**Phase to address:**
localStorage persistence phase. Verify with a DevTools inspection immediately after wiring up: mutate store state, check localStorage in Application tab, confirm the blob reflects the mutation.

---

### Pitfall 5: Onboarding Screen and History List Create a Conflicting First-Visit Experience

**What goes wrong:**
The existing `useOnboarding` hook shows the splash screen when `bill-splitter-onboarding-complete` is absent from localStorage. The new history list shows a "No saved splits" empty state when the history array is empty. For a new user, the expected flow is: see splash → dismiss → see empty history → start a new split. If the history list is shown as the default landing screen for returning users but the onboarding key check is evaluated before history is hydrated, a returning user who cleared their onboarding key (or a new device) sees the splash AND then lands on a history list screen with their saved splits suddenly appearing — because history is loaded in a `useEffect` that fires after the splash dismissal.

A subtler failure: if the history list becomes the new "home" screen for returning users (those with saved splits), but the active bill state is also persisted and auto-loaded, the user sees their last bill's data pre-populated in the new-split view and gets confused about whether they are editing an old split or starting fresh.

**Why it happens:**
Each feature (onboarding, history, active bill persistence) uses localStorage independently with no coordination. The onboarding hook reads localStorage synchronously at mount. History loads asynchronously in `useEffect`. The active bill state rehydrates via `persist` middleware before first render. These three timing differences produce subtle ordering bugs that only appear on actual user flows, not in unit tests.

**How to avoid:**
Define the explicit state machine for app entry:

```
New user (no onboarding key, empty history):
  → Show splash → Dismiss → Empty history list → "New Split" button

Returning user with history (onboarding complete, history entries exist):
  → Skip splash → Show history list → User taps entry or "New Split"

Returning user, no history (onboarding complete, history cleared):
  → Skip splash → Show empty history list with "New Split" CTA
```

The onboarding key check and history load must complete before any rendering decision. Implement a single `useAppEntry` hook that reads both localStorage values synchronously at initialization and returns `{ isNewUser, hasSavedSplits }`. Do not rely on `useEffect` timing for either check.

The active bill persist store must use `skipHydration: false` with a partialize that only saves `config`. On history list load, if the user taps "New Split", call `reset()` explicitly — do not assume the persisted active bill is empty.

**Warning signs:**
- Separate `useEffect` calls loading onboarding state and history state (race condition)
- History list visible for a flash before being replaced by the splash screen (or vice versa)
- Returning users see a pre-populated new-split form with data from their last session without being told they're editing a saved split

**Phase to address:**
History list phase (Phase 2 or whichever phase introduces the history screen). The history list fundamentally changes the app's entry point. This phase must explicitly define the entry-state machine and coordinate the three localStorage reads before any screen renders.

---

### Pitfall 6: Editing a Saved Split Does Not Clearly Delineate "Are You Editing The Original?" — Silent Overwrite Risk

**What goes wrong:**
When a user opens a saved split from history, edits a price, and navigates away, the app must decide: auto-save overwrites the original, creates a copy, or asks. If the answer is "auto-save overwrites the original," the user has no way to get back to the original split data if they made a mistake. If the answer is "create a copy on any mutation," the history list accumulates duplicates silently. If the answer is "ask with a modal," the user is interrupted every time they accidentally tap an item.

The undo toast pattern exists for item/person deletion within a session but cannot undo an auto-save overwrite of a history entry.

**Why it happens:**
Auto-save is designed for the active bill. Applying auto-save semantics to a "loaded from history" bill means the history entry is the save target, not a separate copy. Developers implement auto-save first for the active bill, then wire up history load by populating the store from the history entry — and the existing auto-save subscription immediately starts overwriting that entry on the next mutation.

**How to avoid:**
Introduce a concept of `editingHistoryEntryId: string | null` in the store or a separate context. When `null`, auto-save writes to the "active unsaved split" slot. When set to an ID, auto-save updates that specific history entry.

On load from history: set `editingHistoryEntryId` to the entry's ID. Show a visible affordance ("Editing: Jul 4, 2025 dinner") so the user knows they are modifying an existing record. Provide an explicit "Save changes" and a "Duplicate as new" action — do not silently overwrite.

**Warning signs:**
- History entry data mutates immediately after being loaded into the active store (check in DevTools before any user action)
- No distinction in the UI between "new split" and "editing saved split" session modes
- Loading from history populates the store with auto-save already subscribed but no `editingHistoryEntryId` concept

**Phase to address:**
History list phase, specifically the "re-open and edit saved splits" sub-feature. Define the editing mode explicitly before wiring auto-save to a history entry.

---

### Pitfall 7: Payment Text "Payer" Feature Fails for Zero-Amount and Self-Reference Edge Cases

**What goes wrong:**
The payment text feature picks a payer and generates "Alice owes YOU $23.50" per person. Edge cases that produce wrong or embarrassing output:

1. **Payer is included in results with $0.00:** The payer paid the bill but may also owe themselves. The text "YOU owe YOU $0.00" or "Alice owes Alice $8.50" must never appear. The payer's own line must be omitted from the generated text.

2. **A non-payer person owes $0.00:** Possible when a person has no items assigned (no food, no tip share if proportional, no tax share if proportional). The text "Bob owes YOU $0.00" is confusing — it implies Bob owes nothing, not that he's excluded. Either omit zero-amount entries or replace with "Bob is settled up."

3. **Negative amount (structural impossibility but defensive):** The engine always produces non-negative `roundedTotalCents` because all inputs are non-negative. However, if a history entry from a future schema version had a different engine, a negative value would produce "Bob owes YOU -$5.00." The payment text formatter must guard `amount > 0` before generating a payment line.

4. **Person name contains characters that break the text format:** Names like "Alice & Bob (couple)", "O'Malley", or emoji names ("🍕 Person") are valid in the `name` field. In the simple text format "Name owes YOU $X.XX", these render correctly because they are just strings. The risk is if the text is later parsed (e.g., by a Venmo link) — but since the requirement is plain text only, this is not a crash risk. Still, document that names are passed through as-is without escaping.

5. **Single-person bill with payer selected:** If only Alice is in the bill and she's the payer, the output list is empty (she's excluded as payer, no one else exists). The UI must handle "no other people" gracefully: show a message like "Everyone is settled — Alice paid the whole bill."

**Why it happens:**
Payment text is implemented by looping over `result.results`, filtering out the payer's `PersonId`, and formatting each remaining entry. The zero-amount case is not a compile-time error, the self-reference case is a simple filter omission, and the empty-result case is never tested because tests always use 2+ people.

**How to avoid:**
Write a pure `formatPaymentText(result, people, payerPersonId)` function in `src/utils/` with explicit handling:

```typescript
export function formatPaymentText(
  result: EngineSuccess,
  people: Person[],
  payerPersonId: PersonId,
): string {
  const lines: string[] = [];
  for (const r of result.results) {
    if (r.personId === payerPersonId) continue; // skip payer
    if (r.roundedTotalCents <= 0) continue;     // skip $0 and negative
    const person = people.find(p => p.id === r.personId);
    const name = person?.name ?? 'Unknown';
    const amount = centsToDollars(r.roundedTotalCents);
    lines.push(`${name} owes YOU $${amount}`);
  }
  if (lines.length === 0) {
    return 'Everyone is settled up.';
  }
  return lines.join('\n');
}
```

Unit test all five edge cases: payer excluded, zero-amount excluded, single-person bill, name with special characters, name with emoji.

**Warning signs:**
- Payment text output contains the payer's own name
- "owes YOU $0.00" appears in output
- Calling `formatPaymentText` with a single-person result crashes or returns empty string without a fallback message

**Phase to address:**
Payment text phase (final feature). The pure function approach means it is independently testable before any UI is wired. Write the function and tests before building the payer-selection UI.

---

### Pitfall 8: Auto-Save Subscription Fires on Every Keystroke, Writing Full State to localStorage on Each Character

**What goes wrong:**
The Zustand `persist` middleware auto-saves on every store state change. The current store is mutated on every keystroke in item price, tip, and tax inputs (through `updateItem`, `setTip`, `setTax`). For a bill with 10 items and 5 people, the full `config` blob is approximately 2–4 KB. Serializing and writing 4 KB to localStorage on every keystroke is synchronous work on the main thread. On low-end Android devices, this can cause perceptible input lag (> 16 ms per frame), degrading the "at the table" use case.

**Why it happens:**
`persist` middleware subscribes to every state change and serializes synchronously. This is fine for infrequent state changes (adding/removing people/items) but is excessive for continuous input events.

**How to avoid:**
Two strategies, in order of preference:

1. **Control inputs locally (recommended):** Keep price/tip/tax inputs as local component state (`useState`). Commit to the store only on `onBlur` (when user leaves the field). This is already the intended pattern for React forms. The `persist` middleware then fires only on blur, not on every keypress. This matches the existing UX pattern used in v1.0.

2. **Debounce the storage write (fallback):** If the store must update on every keypress (e.g., for live subtotal calculation), configure `persist` with a custom `storage` that debounces writes:

```typescript
const debouncedSetItem = debounce((key: string, value: string) => {
  localStorage.setItem(key, value);
}, 500);
```

Option 1 is preferred because it also reduces unnecessary `computeSplit` calls during typing.

**Warning signs:**
- DevTools > Application > Local Storage updates on every keypress in an item price field
- Input lag noticeable when typing on a mid-range Android device with a large bill (10+ items)
- `persist` middleware configured with no `partialize`, serializing action functions along with state (adds ~10x to serialized size)

**Phase to address:**
localStorage persistence phase. Verify the write frequency before shipping: type quickly in a price field and watch the Application > Local Storage tab in DevTools.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip `schemaVersion` on first ship | Save 5 minutes of code | First schema change is a breaking migration with no upgrade path for existing users | Never — add version: 1 from the start |
| Use `persist` middleware without `partialize` | No extra code | Functions serialized into localStorage, "old function" bugs on deploy (pmndrs/zustand discussion #2556), bloated storage blob | Never — always partialize to data-only fields |
| Deserialize without re-applying branded type constructors | No extra deserializer code | Branded type guarantees silently broken; future strict type checks fail; engine may receive unbranded values | Never — the deserializer is the type boundary |
| `localStorage.setItem` without try-catch | Simpler code | Crashes entire app in Private Browsing (Safari) and on full storage | Never — wrap every localStorage call |
| No MAX_ENTRIES limit on history | No pruning logic needed | History grows unbounded; serialization size grows; eventual QuotaExceededError | Never — set a cap (50 entries is generous) |
| Overwrite history entry on every active-bill state change | Simple auto-save | User's original saved data is irretrievably modified on first load | Never — distinguish active-bill slot from history entries |
| Omit payer-self-exclusion in payment text | Simpler loop | "Alice owes YOU $23.50" when Alice IS the payer; confusing output | Never — always filter payer's own PersonId |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Zustand `persist` + `immer` | Wrong middleware order: `immer(persist(...))` instead of `persist(immer(...))` | Always `create()(persist(immer(creator), options))` — persist wraps immer |
| Zustand `persist` + `partialize` | Not using `partialize`, serializing action functions | `partialize: (s) => ({ config: s.config })` — persist only the data slice |
| Zustand `persist` + version | Omitting `version` field — defaults to 0 but never migrates | Always set `version: 1` and a `migrate` function stub even if migration is a no-op for now |
| `JSON.parse` + branded types | Using result directly as `BillConfig` without deserializer | Pass through `deserializeBillConfig()` before any engine or store consumption |
| localStorage + Private Browsing | `SecurityError` on `getItem` / `setItem` in Safari | Wrap both in try-catch; fall back to in-memory-only mode silently |
| History list + active bill persist | Same `persist` key for active bill and history | Use separate localStorage keys: `bill-splitter-active` (active bill) and `bill-splitter-history` (history list) |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Serialize full state (including actions) on every store mutation | DevTools shows 50 KB+ blobs in localStorage; writes on every keypress | Always `partialize` to data-only; debounce or move to blur-only writes | Immediately with immer+persist without partialize |
| Load entire history list into memory at startup | Startup time increases with history size | Keep history list as IDs + metadata (date, people names, total); load full `BillConfig` blob only when user opens an entry | Perceptible at > 200 entries; unlikely in practice but design for lazy load |
| Deserialize full `BillConfig` on history list render | History list renders slowly because it deserializes every entry to compute display data | Store pre-computed display metadata (date, participant names, total) alongside the full blob — extract at save time | Perceptible at > 20 entries if full deserialization runs on render |
| `computeSplit` called on every history entry during list render | CPU spike on history screen load | History list shows pre-computed display metadata only — never call engine on render | Immediate if total is re-derived at render time |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing sensitive data in localStorage | localStorage is readable by any JS on the same origin | Bill data (names, amounts) is inherently not sensitive — no mitigation needed for v1.1 |
| Parsing history entry `BillConfig` blob without try-catch | Corrupted blob (user edited DevTools, storage limit partial write) crashes app | Always `try/catch` around `JSON.parse`; delete the key and return empty on any parse error |
| Rendering person names from stored history as `innerHTML` | XSS if name contains `<script>` — though attacker can only attack themselves in client-side-only app | Always render names as React text nodes, never `dangerouslySetInnerHTML`; this is already the v1.0 pattern |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| History list shows raw timestamp (epoch ms) | "1737984000000" is meaningless | Format as "Jan 27 · 4 people · $87.50" using `Intl.DateTimeFormat` with locale-aware short date |
| Deleting a history entry with no undo | Irrecoverable data loss | Apply the existing `useUndoDelete` pattern to history deletion — 5-second undo toast, same as item/person deletion |
| Auto-save overwrites history entry without warning | User's original split is gone after any edit | Show "Editing saved split" indicator; provide explicit "Save changes" action for history-loaded splits |
| Payer selection UI doesn't reset when opening new split | Previous payer selection persists into a different split | Reset payer selection to null whenever `reset()` is called or a new history entry is loaded |
| Payment text copies names as-is including emoji | "🍕Pizza Fan owes YOU $12.00" — works but looks odd in Venmo/Zelle | Document this is acceptable; do not add name sanitization (it would restrict valid names) |
| "Owes YOU" text when the person is NOT the copy recipient | User shares "Alice owes YOU $12" with Alice — Alice gets confused who "YOU" is | This is an inherent limitation of the payer-directed text model; document it as a known UX tradeoff, not a bug |
| Empty history list shows nothing (blank screen) | First-time returning user confused about what to do | Show explicit empty state: "No saved splits yet. Start a new one to see it here." with a CTA button |

---

## "Looks Done But Isn't" Checklist

- [ ] **Branded type round-trip:** Load a saved `BillConfig` from localStorage, pass to `computeSplit` — verify no TypeScript errors and result matches the original calculation. Run this as a unit test, not a manual check.
- [ ] **Schema version check:** Change `CURRENT_SCHEMA_VERSION` to `2` in the codebase and reload the app — verify it discards v1 data gracefully (empty history, no crash) rather than attempting to parse an incompatible blob.
- [ ] **Storage quota:** Fill localStorage to near capacity (add ~200 fake 5 KB entries) and verify the auto-save failure path shows a non-blocking toast, not a crash or blank screen.
- [ ] **Safari Private Browsing:** Open the app in Safari Private Window — verify the app loads and all features work except persistence (no crash, no blank screen).
- [ ] **Payer = only person:** Create a 1-person bill, select that person as payer — verify payment text shows "Everyone is settled up." not an empty string or crash.
- [ ] **Payer self-exclusion:** In a 3-person bill, select person B as payer — verify person B's name does NOT appear in the generated payment text.
- [ ] **Zero-amount person:** Create a bill where person C has $0 total (no items, proportional tip/tax) — verify "C owes YOU $0.00" does not appear in payment text.
- [ ] **History entry editing:** Load a history entry, change one item price — verify the change is attributed to the loaded entry, not silently creating a duplicate in history.
- [ ] **Onboarding + history coordination:** Clear ALL localStorage, reload — verify splash screen appears. Dismiss splash — verify empty history list appears (not the active bill screen). Add a split, save it, reload — verify history list appears (no splash screen).
- [ ] **Undo delete on history entry:** Delete a history entry — verify 5-second undo toast appears. Click Undo — verify entry is restored with all data intact.
- [ ] **Serialize/deserialize round-trip:** Run a test that creates a `BillConfig` with items, people, assignments, tip, and tax; serializes it; deserializes it; and passes both to `computeSplit` — verify results are identical.
- [ ] **LocalStorage keys don't collide:** Verify `bill-splitter-active`, `bill-splitter-history`, and `bill-splitter-onboarding-complete` are all distinct keys that do not overwrite each other.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Branded types not re-applied after deserialization | MEDIUM | Add `deserializeBillConfig()` at the localStorage read boundary; unit test round-trip; no data migration needed — values are identical, just re-wrapped |
| No schema version shipped, then schema changes | HIGH | Pick a version number retroactively; treat all stored blobs with no `schemaVersion` as version 0; write migration from 0 → 1; ship the migrate function |
| `localStorage.setItem` throws uncaught, app crashes | LOW | Add try-catch in the storage adapter; no data loss since the write failed anyway |
| History entries silently overwritten on edit | HIGH | Introduce `editingHistoryEntryId` state; replay auto-save with correct target; previously overwritten entries are lost — communicate to users that history for the affected session may be gone |
| Payment text shows wrong payer/zero-amount output | LOW | Fix `formatPaymentText` guard conditions; no data migration needed — format is computed on demand |
| Middleware ordering wrong (immer/persist swapped) | LOW | Fix the `create()` call order; verify with DevTools Application tab; no data loss |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Branded type serialization (Pitfall 1) | localStorage persistence phase | Unit test: `BillConfig` round-trips through JSON and deserializer, then passes `computeSplit` with identical result |
| Schema versioning (Pitfall 2) | localStorage persistence phase | Test: mismatched version discards blob gracefully; version match deserializes correctly |
| localStorage throws (Pitfall 3) | localStorage persistence phase | Manual test: Safari Private Window; DevTools storage fill simulation |
| Middleware ordering (Pitfall 4) | localStorage persistence phase | DevTools: mutate store, confirm localStorage updates with `config` key only |
| Onboarding/history coordination (Pitfall 5) | History list phase | Manual flow: clear storage → new user flow; return with history → returning user flow |
| History entry edit mode (Pitfall 6) | History list phase — "re-open and edit" sub-feature | DevTools: load entry, mutate, verify correct entry ID is target of auto-save |
| Payment text edge cases (Pitfall 7) | Payment text phase | Unit tests: payer excluded, zero-amount excluded, single-person, special char names |
| Auto-save write frequency (Pitfall 8) | localStorage persistence phase | DevTools: type in price field, watch Application > Local Storage; verify writes are blur-triggered or debounced |

---

## Sources

- Zustand `persist` middleware docs and middleware ordering: [persist - Zustand](https://zustand.docs.pmnd.rs/middlewares/persist) — HIGH confidence
- Zustand `persist` + `immer` ordering discussion: [Immer + Persist Middleware Problems, pmndrs/zustand Discussion #1143](https://github.com/pmndrs/zustand/discussions/1143) — MEDIUM confidence (discussed in community, consistent with docs)
- Zustand schema migration: [Persisting store data - Zustand](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) — HIGH confidence
- Zustand function serialization bug: [Persist middleware keeping old versions of functions around, pmndrs/zustand Discussion #2556](https://github.com/pmndrs/zustand/discussions/2556) — MEDIUM confidence
- localStorage `QuotaExceededError` and `SecurityError`: [Handling localStorage errors, Matteo Mazzarolo](https://mmazzarolo.com/blog/2022-06-25-local-storage-status/); [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — HIGH confidence
- `JSON.parse` on corrupted localStorage: [Stop Using JSON.parse(localStorage.getItem(...)) Without This Check, Medium/Devmap](https://medium.com/devmap/stop-using-json-parse-localstorage-getitem-without-this-check-94cd034e092e) — HIGH confidence
- TypeScript branded types serialization behavior: derived directly from inspection of `src/engine/types.ts` and `JSON.stringify` runtime behavior — HIGH confidence (first-party analysis)
- Payment text edge cases: derived from `src/utils/formatSummary.ts` analysis and `computeSplit` engine output guarantees — HIGH confidence (first-party analysis)
- Auto-save UX patterns: [To save or to autosave, Medium](https://medium.com/@brooklyndippo/to-save-or-to-autosave-autosaving-patterns-in-modern-web-applications-39c26061aa6b) — MEDIUM confidence

---

*Pitfalls research for: Expense Splitter v1.1 — adding localStorage persistence, history management, and payment text to existing React+Zustand+Immer app*
*Researched: 2026-02-22*
