# Feature Research

**Domain:** Restaurant bill splitting / expense splitting web app — v1.1 Persistence + Sharing milestone
**Researched:** 2026-02-22
**Confidence:** MEDIUM-HIGH — WebSearch tools active this session; core findings verified against Zustand docs, MDN, and competitor behavior patterns. Payment text format conventions are MEDIUM confidence (based on community examples and competitor patterns, not official API specs).

---

## Milestone Scope

This research covers **only the new features** in v1.1. The existing v1.0 feature set (people, items, tip/tax, per-person summary, copy-to-clipboard, dark theme, mobile layout) is already shipped and is not re-evaluated here.

**New features under research:**
1. Auto-save to localStorage (persist current session)
2. History list (view past splits)
3. Re-open and edit saved splits
4. Delete saved splits with undo toast
5. Payment text (payer-directed "Alice owes YOU $23.50" per person)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist once you add "save" to a local-storage app. Missing these = the feature feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Auto-save on change | If the user has to manually press "Save," they will forget and lose data — especially at a busy restaurant table. Every modern draft-aware app auto-saves. | LOW | Debounced write on any state change; Zustand's `persist` middleware handles this natively with a custom storage adapter. |
| Human-readable history entry labels | Users cannot interpret a list of timestamps. They need "Saturday dinner · Alice, Bob, Maria · $87.40" — enough to identify the occasion without opening it. | LOW | Derive from stored state: date + people names + total. No extra user input needed. |
| Tap to reopen any saved split | If history exists but you cannot act on it, it is decoration. One-tap restore into the full editor is the expected behavior. | LOW | Load stored JSON into Zustand store; navigate to bill view. |
| Delete a saved split | Without delete, the history list fills with noise. Users expect management, even for simple lists. | LOW | `localStorage.removeItem()` or array splice + re-serialize. |
| Undo delete | Deleting a split by accident is a realistic error (fat-finger on mobile). An undo toast — exactly what v1.0 already uses for item deletion — is the expected recovery path. This is already a v1.0 pattern; users now expect consistency. | LOW | Same toast pattern already in codebase for item deletion. Hold deleted object in memory for 5 seconds before discarding. |
| Payment text copies to clipboard | If the user generates payment text but cannot copy it, it is useless. The clipboard copy affordance is expected because the whole purpose is sending amounts to friends. | LOW | `navigator.clipboard.writeText()`. Already done for per-person summary in v1.0; this is the same mechanic. |
| Payer selection (who paid the bill) | "Alice owes YOU $23.50" — the "YOU" must be the person who actually paid. Apps that always default to one person force users to re-read and mentally re-orient the output. | LOW | Dropdown or radio of existing people list from the current bill. No new data model needed. |

### Differentiators (Competitive Advantage)

Features that set the product apart for this specific use case.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Zero-friction auto-save (no Save button) | Splitwise has no draft saving — switching away mid-expense loses data. Auto-save on every change eliminates the "I lost my work" failure mode entirely. This is the key differentiator vs the competitors' broken draft experience. | LOW | Zustand `persist` middleware with `localStorage` as storage + debounce 300ms. No user action required. |
| History entries auto-generated from bill data | No competitor forces you to name your split. Generating the label from data (people + date + total) removes friction entirely — users at a restaurant do not want to type "Saturday dinner at Nobu" before viewing results. | LOW | Format: `{day of week}, {month} {day} · {person1}, {person2}... · ${total}`. Truncate people list at 3 names with "+N more." |
| Per-person payment text with payer direction | Splitwise generates settlement summaries inside its own ecosystem (debt tracking). Our app generates ready-to-send Venmo/Zelle message text that is immediately usable outside the app. This bridges the gap from "calculated" to "sent." | LOW-MEDIUM | Text format: "Hey [name], your share of dinner is $[amount]. Send to [payer]!" — copy one or copy all. |
| Editable saved splits | Splitwise allows editing expenses after save, but it is account-gated. Our app allows full re-edit of any saved split without any account — including adding/removing people and items — because the full Zustand state is stored, not just totals. | MEDIUM | Must restore full input state (people, items, assignments, tip, tax) not just computed outputs. This is the complexity: ensure the stored schema covers all inputs, not just display values. |
| Storage limit awareness | localStorage has a 5MB cap (~5,242,880 bytes). A typical bill split JSON (10 people, 20 items) is approximately 3-8 KB. At 8 KB per record, 5MB holds ~625 records — effectively unlimited for this use case. However, a graceful error if `setItem` throws `QuotaExceededError` is professional. | LOW | Wrap `setItem` in try/catch; show a non-blocking notice prompting deletion of old records. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Manual "Save" button as the primary save mechanism | Feels explicit and confirmatory | Users at a restaurant are distracted; they will forget to tap it and lose work. Splitwise users explicitly complain about this gap in reviews. | Auto-save on every change with a subtle "saved" indicator. |
| Venmo/Zelle deep links (open app directly) | "Click to pay" is magic | Venmo's API is restricted to approved business partners; Zelle has no public deep link spec for requesting payment. Deep links would also require knowing the recipient's @venmo handle, which the app has no way to know. | Generate clean, copy-friendly text. Users open their payment app and paste. One extra step, zero integration complexity. |
| Named saves (user types a title for each bill) | Power users want organization | At a restaurant, no one wants to type "Saturday dinner at Nobu" before seeing totals. Adds friction at the worst moment (when the check arrives). | Auto-derive labels from data: date + people + total. |
| Cloud sync / multi-device history | "I want to see my history on my laptop" | Requires backend, auth, database — the exact complexity excluded from v1 scope. localStorage is per-device by design. | Clear user expectation: history is local to this device/browser. Add a UX note in the empty history state: "Splits are saved on this device." |
| Export to CSV / PDF | Power users want records | Rare use case for restaurant splits. Adds file system / download complexity for negligible gain. | Per-person copy-to-clipboard already covers the "I need a record" case for 95% of users. |
| iCloud / Google Drive backup | "Don't lose my data" | Requires OAuth flows and cloud storage APIs — full backend feature. | localStorage is persistent across sessions; clearing browser data is rare. Note this limitation in the empty history state. |
| Confirmation modal before delete | "Make sure I mean it" | Adds an extra tap to every delete. The undo toast is the industry standard (Gmail, iOS, Android) precisely because it removes the confirmation step while still allowing recovery. | Optimistic delete + 5-second undo toast. Consistent with v1.0 item deletion pattern. |
| Rich payment text templates (multiple formats) | Customization | Template pickers add UI complexity. The "owes YOU" format is universally understood. Offering options paralysis for a secondary feature is not worth it. | One opinionated format. Copy all or copy individual. |

---

## Feature Dependencies

```
[localStorage persistence layer]
    └──required by──> [Auto-save current bill]
    └──required by──> [History list]
                          └──required by──> [Re-open saved split]
                          └──required by──> [Delete saved split]
                                                └──requires──> [Undo toast]
                                                               (already exists in v1.0)

[People list (v1.0)]
    └──required by──> [Payer selector]
                          └──required by──> [Payment text generation]
                                                └──required by──> [Copy payment text]
                                                                   (clipboard API already used in v1.0)

[Per-person totals computation (v1.0)]
    └──required by──> [Payment text generation]

[History entry label]
    └──depends on──> [People names from stored state]
    └──depends on──> [Bill total from stored state]
    └──depends on──> [Save timestamp]
```

### Dependency Notes

- **Persistence layer must come first:** Auto-save, history, and re-open all depend on a working read/write layer. Zustand's `persist` middleware provides this without writing custom `setItem`/`getItem` calls.
- **Payer selector depends on existing people list:** The payer dropdown is populated from the same people array already in the Zustand store. No new data model needed — just a `payerId` field in state.
- **Payment text has zero new data dependencies:** It only needs `payerId` (new) + per-person totals + people names — all already computed by v1.0 engine.
- **Re-open saved split depends on full input state storage (not just computed outputs):** This is the key architectural constraint. The store must persist the full input model (items, assignments, tip settings, tax settings) so the v1.0 engine can recompute correctly after restore. Storing only the final dollar amounts would make splits read-only.
- **Undo toast already exists (v1.0):** The delete-with-undo pattern is already in the codebase for item deletion. History delete reuses this exact UI pattern — no new component needed, just a new action.

---

## MVP Definition for v1.1

### Ship with v1.1 (all five are the milestone)

- [ ] **Auto-save to localStorage** — Zustand `persist` middleware; debounced; no user action needed. Core of the milestone: enables everything else.
- [ ] **History list view** — Auto-generated label (date + people + total); chronological, most recent first; empty state with friendly copy. Gate behind: persistence layer working.
- [ ] **Re-open and edit saved splits** — Tap any history entry to restore full input state; all v1.0 editing works normally. Gate behind: full input state stored (not just outputs).
- [ ] **Delete saved split with undo toast** — Swipe or tap delete; 5-second undo toast; permanent on dismiss. Reuses v1.0 toast pattern.
- [ ] **Payment text with payer selection** — Payer dropdown from current people list; generates "Hey [name], your share is $[amount]. Send to [payer]!" for each person; copy individual or copy all.

### Explicitly Out of Scope for v1.1

- Named saves / custom titles — auto-labels are sufficient; add only if user feedback demands it
- Payment deep links — research confirms Venmo/Zelle APIs are restricted; plain text is correct call
- Cloud backup / cross-device sync — requires backend; out of scope per PROJECT.md
- Receipt OCR — out of scope per PROJECT.md

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auto-save to localStorage (Zustand persist) | HIGH | LOW | P1 |
| History list with auto-generated labels | HIGH | LOW | P1 |
| Re-open saved split (full edit) | HIGH | MEDIUM | P1 |
| Delete saved split + undo toast | HIGH | LOW | P1 |
| Payer selector (who paid) | HIGH | LOW | P1 |
| Payment text generation per person | HIGH | LOW | P1 |
| Copy individual payment text | HIGH | LOW | P1 |
| Copy all payment text at once | MEDIUM | LOW | P2 |
| Storage quota error handling | LOW | LOW | P2 |
| Bulk delete (select multiple history entries) | LOW | MEDIUM | P3 |
| Named saves / custom titles | LOW | LOW | P3 |
| Export history to CSV | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v1.1 launch
- P2: Should have; add in same milestone if time allows
- P3: Defer to v1.2 or later

---

## Competitor Feature Analysis

| Feature | Splitwise | Tab (app) | Tricount | Our v1.1 Approach |
|---------|-----------|-----------|----------|-------------------|
| Auto-save / draft saving | No — explicit save; switching away loses draft | No — same problem | No — requires sync | Yes — Zustand persist, zero user action |
| History / past splits | Yes (account-gated, cloud-stored) | Yes (account-gated) | Yes (account-gated) | Yes — localStorage, no account |
| Re-open and edit past splits | Yes | Partial | Yes | Yes — full input state restored |
| Delete past splits | Yes | Yes | Yes | Yes + undo toast |
| Payment text / summary sharing | Settlement reminders via email/in-app | Venmo integration (app-to-app) | Settle-up suggestions | Plain text, copy-to-clipboard; no account or API needed |
| Payer-directed text ("owes YOU") | Splitwise shows debt direction correctly | Venmo shows who requests | Yes | Yes — user picks payer, text reflects direction |
| Works without account | No | No | No | Yes — entire feature is localStorage-only |
| Works offline | No (needs network for sync) | No | Partial | Yes — localStorage is 100% offline |

**Key insight:** Every major competitor gates persistence behind user accounts. Our localStorage approach is genuinely differentiated for the "at the table, no signup" use case. The UX cost is that history is per-device, not cross-device — this is an acceptable trade-off that should be communicated clearly in the empty history state.

---

## Payment Text Format Research

**What the text should look like** (MEDIUM confidence — derived from community patterns and Splitwise reminder conventions):

```
Individual copy (sent to one person):
"Hey Alice, your share of dinner is $23.50. Send to Bob on Venmo/Zelle!"

All-at-once copy (payer sends this as a group message):
Dinner split — Bob paid $87.40
• Alice: $23.50
• Carol: $31.20
• Dave: $32.70
(totals include tip and tax)
```

**Format conventions observed in the wild:**
- Splitwise reminder format: "You currently owe [name] $[amount]" — confirmed from community examples
- Siri/Venmo: "Pay [name] [amount] for [note]" — confirmed from Venmo help docs
- Plain text with dollar amounts and names is the standard; emojis are optional flavor (Venmo uses them but they are not expected in third-party text)
- No one expects precise itemization in the payment request text — just the total per person and who to pay
- "Send to [payer name]" is sufficient; @venmo handles are not needed (and would require extra input)

**What NOT to include in payment text:**
- Itemized breakdown (too long for a payment note; already available in the per-person summary)
- Venmo @handles (app has no way to know them; requiring this adds friction)
- Emojis by default (add only if user can toggle — not in v1.1 scope)

---

## Implementation Notes for Roadmap

**Zustand `persist` middleware is the right tool.** It ships with Zustand 5 (already in the stack), handles serialization/deserialization automatically, and supports `partialize` to exclude ephemeral UI state (like which panel is open) from the stored snapshot. The main design decision is whether to use a single persisted key (current session only) or a separate history array key. Both approaches are valid; a single `history[]` array with current session as the first entry is simpler.

**Schema versioning is required from day one.** The `persist` middleware supports a `version` field and a `migrate` function. Because the stored JSON will outlive future code changes (users may return weeks later), a schema version ensures future changes do not corrupt old saved data. Set `version: 1` on first ship.

**localStorage capacity is not a practical concern for this app.** A maximally complex bill (15 people, 30 items, all shared with assignments) produces a JSON payload of approximately 5-15 KB. The 5 MB localStorage budget holds 350–1000 such records. Storage quota handling (`QuotaExceededError`) is good practice but should not be designed as a critical-path feature.

**The undo-delete pattern is already validated.** v1.0 uses it for item deletion. The history-delete undo reuses the exact same component and timing (5 seconds). No new UI work beyond wiring to the delete action.

---

## Sources

- Zustand persist middleware docs: https://zustand.docs.pmnd.rs/middlewares/persist (HIGH confidence — official docs)
- MDN localStorage storage quotas: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria (HIGH confidence — official MDN)
- Splitwise history and draft UX findings: https://feedback.splitwise.com/ — community reports of no-draft-save behavior (MEDIUM confidence — user reports, not official docs)
- Venmo payment request format: https://help.venmo.com/cs/articles/payments-requests-faq-vhel149 (MEDIUM confidence — confirms note field and amount, not third-party text format)
- Splitwise settlement message format examples: https://feedback.splitwise.com/ community examples (MEDIUM confidence)
- Delete with undo toast UX pattern: https://www.designmonks.co/blog/delete-button-ui, https://medium.com/google-developers/snackbar-the-appropriate-interruption-ceb54d9be583 (HIGH confidence — established industry pattern documented across multiple sources)
- Tricount offline/history behavior: https://tricount.com/expense-tracker-features (MEDIUM confidence — marketing page, not implementation docs)
- PROJECT.md out-of-scope decisions: /Users/shantnupatil/Desktop/Personal/gsd-module-test/.planning/PROJECT.md (HIGH confidence — authoritative for this project)

---
*Feature research for: Restaurant bill splitting — v1.1 Persistence + Sharing milestone*
*Researched: 2026-02-22*
