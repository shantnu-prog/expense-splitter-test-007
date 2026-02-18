# Feature Research

**Domain:** Restaurant bill splitting / expense splitting web app
**Researched:** 2026-02-19
**Confidence:** MEDIUM — External search tools unavailable; findings based on domain knowledge of established products (Splitwise, Tab, Settle Up, Divvy, Dine & Split, Tab Splitter). Bill splitting is a mature product category with stable UX conventions; confidence is MEDIUM rather than HIGH because competitor docs could not be directly verified today.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Add people by name | Every splitter does this; without names the summary is meaningless | LOW | Names only — no accounts needed |
| Add line items with prices | Core function; users are working from a physical receipt | LOW | Item name + dollar amount |
| Assign items to one person | Minimum viable assignment model; everything else builds on this | LOW | Many-to-one item-to-person |
| Assign items as shared (split among subset) | Appetizers, bottles of wine, shared desserts are common; equal-split-only tools feel broken | MEDIUM | Many-to-many item-to-people; this is the differentiating table stake vs naive splitters |
| Tip calculation with presets | 15/18/20% are the US standard presets; users expect to tap a button not do math | LOW | Preset buttons + custom input |
| Tax calculation | Tax is mandatory in every US restaurant bill; handling it is expected | LOW | Enter amount or percentage |
| Per-person total summary | The whole point of the app; without this nothing else matters | LOW | Must be readable at a glance on a phone |
| Mobile-friendly layout | Primary use case is sitting at the restaurant table; desktop-only feels broken | MEDIUM | Responsive layout; large tap targets; no hover-required interactions |
| Rounding to cents | Floating-point arithmetic on prices produces ugly results; users notice "$12.3334" | LOW | Always round to 2 decimal places |
| Running subtotal visible | Users want to see the bill total updating as they add items to confirm accuracy | LOW | Sum of all items displayed |
| Edit / delete items and people | Users make typos; receipts get re-read; correction is expected | LOW | In-place editing or remove button |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Tip split method: equal vs proportional | Equal tip is simpler but penalizes light eaters; proportional feels fairer to many groups — offering both is uncommon in simple splitters | LOW | Toggle between two formulas; no UI complexity |
| Tax split method: equal vs proportional | Same argument as tip; inconsistency (equal tax, proportional tip) is a real user complaint in competitors | LOW | Mirrors tip split selector |
| Shared item split: equal among sharers only (not everyone) | Most naive apps split shared items across all people; limiting to actual sharers is significantly more fair and reduces "I didn't have the appetizer" complaints | MEDIUM | Requires per-item people selector |
| Zero-tip / no-tax scenario handled gracefully | Some groups tip in cash separately; app should not break or show $0.00 tip line awkwardly | LOW | Conditional display logic |
| Custom tip amount (dollar, not just %) | Useful when tip is already included or when someone wants to set a fixed tip total | LOW | Dollar amount input field, not percent |
| Per-item quantity | One person orders two drinks; quantity field eliminates duplicate rows | LOW | Quantity multiplier on item |
| Rounding up per person (not total) | Prevents under-collection; "pays the extra penny" problem solved without awkward fractional cents in summary | LOW | Already in scope; just needs correct implementation |
| Clear "who owes what" CTA output | Presenting totals with "Venmo @alice $23.50" copy-friendly format or a share button bridges the gap from calculation to payment | MEDIUM | Even without Venmo deep-links, formatted text output is valuable |
| Keyboard-friendly data entry | Power users enter items fast; good tab-order and enter-to-confirm feels professional | LOW | Proper form semantics; no extra library needed |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Receipt photo / OCR | "Just scan the receipt" sounds like magic; users ask for it constantly | OCR accuracy is 60-80% on crumpled restaurant receipts; errors require manual correction anyway; adds backend dependency, camera permissions, and significant scope | Manual entry is fast (2-3 minutes) and always accurate; add OCR in v2 if validated |
| User accounts / login | "Save my splits" / "see history" | Adds auth complexity, backend, database, privacy concerns, email verification flows — all before the core calculator even works | Ship core value first; localStorage history in v2 is much simpler than full auth |
| Payment integration (Venmo/Zelle deep links) | "Send money directly from the app" | Payment APIs require business accounts, compliance, and maintenance; Venmo's API is restricted; adds liability | Generate copy-friendly text output with amounts; users can open their payment app manually |
| Real-time sync across devices | "Everyone at the table can see updates" | Requires WebSocket server or Firebase, breaks client-side-only constraint, multiplies complexity | One person enters the bill; everyone sees the final summary — this is the natural UX |
| Currency conversion | International groups | Dramatically increases scope; exchange rate APIs need backend; most restaurant bills are single-currency | Out of scope; note as v3 consideration |
| Itemized receipt history / export to CSV | Power users want records | Most restaurant split use cases are one-and-done; export adds UI complexity for rare use | localStorage save in v2 covers 90% of the need without CSV complexity |
| Dutch auction / unequal custom splits by percentage | "I want Alice to pay 30%, Bob 70%" | Fundamentally different product (expense tracking, not restaurant splitting); confuses the simple UX | Stick to item-based splitting; percentage splits belong in a different product category |

## Feature Dependencies

```
[Add People]
    └──required by──> [Assign Items to People]
                          └──required by──> [Per-Person Summary]
                                                └──required by──> [Share/Copy Output]

[Add Items with Prices]
    └──required by──> [Running Subtotal]
    └──required by──> [Assign Items to People]
    └──required by──> [Tip Calculation]
    └──required by──> [Tax Calculation]

[Tip Calculation]
    └──required by──> [Tip Split Method (equal vs proportional)]

[Tax Calculation]
    └──required by──> [Tax Split Method (equal vs proportional)]

[Assign Items to People (shared)]
    └──enhances──> [Per-Person Summary] (accuracy improves with shared-item support)

[Edit/Delete Items] ──enhances──> [Add Items with Prices]
[Edit/Delete People] ──enhances──> [Add People]
```

### Dependency Notes

- **Add People required before Assign Items:** You cannot assign an item to a person who doesn't exist; people must be created first or the assignment UI has no targets.
- **Add Items required before Tip/Tax Calculation:** Percentage-based tip and tax both need a subtotal to operate on; items must exist.
- **Assign Items required before Per-Person Summary:** The summary is the output of the assignment step; this is the most critical dependency chain in the entire app.
- **Shared item splitting is an enhancement to item assignment:** It extends the assignment model rather than replacing it; they can be built together in one phase.
- **Tip Split Method requires Tip Calculation:** The split method choice (equal vs proportional) is meaningless without a tip amount; these belong in the same feature group.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Add/remove people by name — without this, summary is unnamed
- [ ] Add/edit/remove line items with name and price — without this, there's nothing to split
- [ ] Assign each item to one or more people (including shared subsets) — without shared item support, the app is less accurate than mental math for typical restaurant bills
- [ ] Running subtotal visible as items are added — users need to verify against the physical receipt
- [ ] Tip calculation: 15/18/20% presets + custom percent input — three presets cover 90% of use cases
- [ ] Tax calculation: enter amount or percentage — tax is on every US receipt
- [ ] Tip split method: equal or proportional to order size — low complexity, high fairness value
- [ ] Tax split method: equal or proportional to order size — mirrors tip method
- [ ] Per-person summary: name + itemized breakdown + total — must be legible on a phone screen
- [ ] Round up each person's total to nearest cent — prevents under-collection and ugly fractions
- [ ] Mobile-responsive layout with large tap targets — primary use case is at the table on a phone

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Custom tip dollar amount — add when users report needing it; minor addition
- [ ] Per-item quantity field — add when users report duplicate item rows as a pain point
- [ ] Copy-friendly formatted output ("Alice owes $23.50") — add when users ask "how do I tell people what they owe"
- [ ] Keyboard navigation / tab order optimization — add after testing with power users who enter long bills

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Save split to localStorage for later reference — low complexity but not needed at table
- [ ] Share link (URL-encoded state) — useful but requires URL state encoding work
- [ ] Venmo/payment app formatted text with deep-link intent — requires research into current API restrictions
- [ ] Receipt OCR — high complexity; validate that users actually want it before building
- [ ] Multiple currencies — niche use case; wait for actual user demand

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Add people by name | HIGH | LOW | P1 |
| Add line items with prices | HIGH | LOW | P1 |
| Assign items to person(s) including shared | HIGH | MEDIUM | P1 |
| Running subtotal | HIGH | LOW | P1 |
| Tip presets (15/18/20%) + custom % | HIGH | LOW | P1 |
| Tax calculation (amount or %) | HIGH | LOW | P1 |
| Tip split method (equal vs proportional) | HIGH | LOW | P1 |
| Tax split method (equal vs proportional) | HIGH | LOW | P1 |
| Per-person summary with rounding up | HIGH | LOW | P1 |
| Mobile-responsive layout | HIGH | MEDIUM | P1 |
| Edit/delete items and people | HIGH | LOW | P1 |
| Custom tip dollar amount | MEDIUM | LOW | P2 |
| Per-item quantity | MEDIUM | LOW | P2 |
| Copy-friendly output text | MEDIUM | LOW | P2 |
| Keyboard navigation | MEDIUM | LOW | P2 |
| Save to localStorage | LOW | LOW | P3 |
| URL-encoded shareable link | LOW | MEDIUM | P3 |
| Receipt OCR | HIGH | HIGH | P3 |
| Payment app integration | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Splitwise | Tab (app) | Dine & Split | Our Approach |
|---------|--------------|--------------|--------------|--------------|
| Item-level assignment | Yes (full-featured) | Yes | Yes | Yes — core feature |
| Shared items (subset of people) | Yes | Yes | Varies | Yes — must-have, not optional |
| Tip presets | Yes | Yes | Yes | Yes — 15/18/20% + custom |
| Tax handling | Yes | Yes | Limited | Yes — amount or % |
| Tip split method | Proportional by default | Proportional | Equal only | Both — user selects |
| Tax split method | Proportional by default | Proportional | Equal only | Both — user selects |
| Mobile UX | App (native) | App (native) | App | Web, mobile-first design |
| No account needed | No (requires account) | No (requires account) | Varies | Yes — zero friction |
| Offline / client-side | No (requires network) | No | Partial | Yes — fully client-side |
| Receipt OCR | Yes (Splitwise Pro) | No | Some | v2 — not in scope for v1 |
| History / past splits | Yes | Yes | Yes | v2 — not in scope |
| Payment integration | Yes (Venmo, PayPal) | Yes | Varies | v2 — copy-friendly text for now |

**Key competitive insight:** Major competitors (Splitwise, Tab) require user accounts and network access, making them slow to use at the restaurant table. A zero-friction, client-side-only web app that works without signup is a genuine differentiator for the specific "at the table right now" use case.

## Sources

- Competitor knowledge: Splitwise (splitwise.com), Tab app, Settle Up, Dine & Split, Divvy — analyzed from training knowledge (MEDIUM confidence; not live-verified today due to tool access restrictions)
- Domain conventions: US restaurant tipping norms (15/18/20% presets), standard bill components (subtotal, tax, tip) — HIGH confidence, stable facts
- PROJECT.md for out-of-scope decisions: /Users/shantnupatil/Desktop/Personal/gsd-module-test/.planning/PROJECT.md — HIGH confidence, authoritative for this project

**Confidence note:** External search tools (WebSearch, WebFetch, Brave API) were unavailable during this research session. All competitor feature claims are based on training-time knowledge (knowledge cutoff August 2025). Bill splitting is a mature, stable product category; core UX conventions are unlikely to have changed materially. Verify competitor feature sets directly before using them in marketing copy.

---
*Feature research for: Restaurant bill splitting / expense splitting web app*
*Researched: 2026-02-19*
