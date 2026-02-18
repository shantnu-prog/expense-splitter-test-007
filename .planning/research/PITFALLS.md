# Pitfalls Research

**Domain:** Expense / Bill Splitting Web App (client-side, restaurant context)
**Researched:** 2026-02-19
**Confidence:** HIGH — floating-point and money-math pitfalls are well-documented computer science; UX pitfalls drawn from established patterns in this domain

---

## Critical Pitfalls

### Pitfall 1: Using Floating-Point Arithmetic for Money

**What goes wrong:**
JavaScript's IEEE 754 double-precision floats produce silent rounding errors in decimal arithmetic. `0.1 + 0.2 === 0.30000000000000004`, not `0.3`. When chaining tip, tax, and per-person split calculations through multiple float operations, errors compound. A bill that should yield $12.33 per person might display $12.329999999 or $12.330000001. Worse: `(total / n).toFixed(2)` rounds each person's share in isolation, so the sum of displayed amounts frequently does not equal the original total.

**Why it happens:**
Developers treat money as a natural floating-point domain. The numbers look small, the errors look invisible in most cases, and JavaScript has no built-in decimal type. It is the default path of least resistance.

**How to avoid:**
Work entirely in integer cents throughout all calculations. Convert input dollars to cents on entry (`Math.round(dollars * 100)`), do all arithmetic in integers, and convert back to dollars only at display time (`cents / 100`). Never store or pass intermediate values as floats. For division that produces remainders (the normal case for splitting), use the "largest-remainder method": compute each person's floor share in cents, calculate the leftover cents, then distribute them one cent at a time to the people with the largest fractional remainders. This guarantees the sum of all shares equals the total exactly — no penny gap, no penny surplus.

**Warning signs:**
- Any expression of the form `price * quantity` or `total / n` without explicit integer handling
- `toFixed(2)` appearing on intermediate values rather than only at display
- Test cases that sum per-person totals and compare to bill total using `===` — if this passes, the math is wrong; if it fails, the pitfall is confirmed
- Noticeably wrong totals when the party size is 3 or 7 (thirds and sevenths are the most pathological in decimal)

**Phase to address:**
Core math engine phase (Phase 1 / foundation). Get integer-cent arithmetic right before building any UI on top of it. Establish a test suite that verifies: sum of all shares === total, for party sizes 1–10, and for tip percentages 15/18/20/custom.

---

### Pitfall 2: Rounding Strategy Applied Inconsistently Across Tip, Tax, and Items

**What goes wrong:**
The app computes each item's share, then adds tip and tax on top. If rounding is applied at the item level, then again at the tip-per-person level, then again at the tax-per-person level, errors stack three times. The person-level totals no longer sum to the bill total. This is invisible during development (the discrepancy is usually 1–2 cents) but surfaces in user testing when people check the math.

**Why it happens:**
Developers calculate tip and tax as separate passes over per-person subtotals, rounding at each pass independently. It feels natural: each component is calculated, rounded, and added. But rounding is not associative — rounding then adding is not the same as adding then rounding.

**How to avoid:**
Maintain one canonical "person owes X cents" accumulator per person. Add their item shares (in cents), add their tip share (in cents), add their tax share (in cents), then display once. Never round sub-components before accumulating. The largest-remainder distribution applies to the total bill's tip and tax, not to each person's subtotal.

**Warning signs:**
- Functions like `calculateTip(personSubtotal)` that round internally and return a dollar value
- Tax and tip calculated as separate rounded dollar amounts per person rather than as a single rounded distribution
- Sum of per-person totals is off by 1–3 cents from bill total when tested

**Phase to address:**
Core math engine phase. Define the data model first: `person.owedCents` is a single integer that accumulates all components. Enforce no floating-point anywhere in the accumulation pipeline.

---

### Pitfall 3: "Round Up Each Person" Feature Misconstrued

**What goes wrong:**
The project spec includes "round up each person" as a rounding option. A naive implementation does `Math.ceil(personTotal * 100) / 100` on each person's total and calls it done. This creates two bugs: (a) the sum of rounded-up amounts will exceed the bill total, and (b) there's no clear rule for where the surplus goes — is it a tip surplus? Is it discarded? Users see "you owe $14.00" but the bill total shown is $13.67, and they are confused about the gap.

**Why it happens:**
"Round up each person" is an informal request, not a precise math spec. Developers implement the obvious interpretation without thinking through the invariant: what is the intended relationship between the per-person totals and the bill total when rounding up is applied?

**How to avoid:**
Define the semantic explicitly before implementing. The most sensible interpretation for a restaurant context: round each person's share up to the nearest dollar (or nearest 50 cents), display the surplus as "extra tip," and show the user that the rounded amounts plus the extra tip equals the full bill. The UI must show both the "what you owe" (rounded) and "what goes to tip/house" (surplus) so users understand the math. Treat this as a display feature on top of correct base math, not a change to the math engine.

**Warning signs:**
- No test asserting what happens to the rounding surplus
- No UI element showing the gap between rounded-up amounts and actual bill
- Implementation that modifies per-person share calculation rather than post-processing display values

**Phase to address:**
Rounding UI phase (after core math is correct). Must define the "surplus goes where" rule in the spec before writing code.

---

### Pitfall 4: Shared Item Split Logic Edge Cases

**What goes wrong:**
When a shared item (e.g., a bottle of wine split among 3 of 5 people) is divided, the implementation must handle: (a) items shared by exactly 1 person (effectively a solo item), (b) items shared by all people, (c) items shared by a subset, and (d) items with quantities > 1 where only some sharers want multiple units. Naive implementations fail on case (a) when the "split" divides by 1 (usually fine, but often a code path never tested), and fail catastrophically on items shared by no one — a zero-division that crashes or shows NaN.

**Why it happens:**
Developers test the happy path (2–3 sharers on a shared item) and never test the degenerate cases. The "add item" flow rarely enforces that at least one person is selected as a sharer.

**How to avoid:**
Validate that every item has at least one sharer before the calculation runs. In the data model, an item with no sharers is invalid — surface this as a UI error ("Who is sharing this item? Select at least one person"). Write explicit unit tests for: 1 sharer, all sharers, and every possible subset size. Handle the quantity > 1 with subset-sharer case by deciding upfront whether the quantity multiplier applies to the item total (split evenly) or per-sharer (each gets N units at full price).

**Warning signs:**
- No validation that `item.sharers.length >= 1` before division
- `NaN` or `Infinity` appearing in the UI during development
- No test for a single-sharer item or a 0-sharer item

**Phase to address:**
Core data model and math engine phase. The item data model must encode sharer selection as a required non-empty list before the calculation module is built.

---

### Pitfall 5: Proportional Tip/Tax Distribution Without Integer-Cent Allocation

**What goes wrong:**
When tip or tax is distributed proportionally (each person pays tip proportional to their food subtotal), the natural implementation is: `personTip = (personSubtotal / totalSubtotal) * tipAmount`. This produces a float for each person. Rounding each person's proportion independently causes the sum to diverge from `tipAmount` by 1–2 cents. At a table of 7, this is nearly guaranteed.

**Why it happens:**
Proportional distribution feels mathematically clean — just multiply by the fraction. The per-person float looks precise. The rounding error only appears when you sum all proportional amounts and compare to the original tip.

**How to avoid:**
Apply the largest-remainder method to proportional distribution too. Compute each person's exact proportional share as a rational number (numerator = personSubtotal * tipCents, denominator = totalSubtotalCents). Take the floor. Sum the floors. The remainder cents are distributed one-at-a-time to the people with the largest fractional parts. The result always sums exactly to `tipCents`. This is a well-known algorithm used in proportional election systems and currency distribution.

**Warning signs:**
- Proportional tip calculation using float multiplication without a subsequent reconciliation step
- `(totalTip / n)` used for equal split but `personSubtotal / total * tipAmount` used for proportional without largest-remainder
- No test asserting `sum(personTipShares) === tipCents`

**Phase to address:**
Core math engine phase. The proportional distribution function should be a pure utility with dedicated tests before it is wired to any UI state.

---

### Pitfall 6: State Shape Makes "Who Owes What" Recomputation Expensive or Inconsistent

**What goes wrong:**
As the user adds items, changes sharers, edits tip percentage, and switches between equal/proportional tax, the app must recalculate totals reactively. Developers often store partial computed results in state (e.g., `person.subtotal` updated when items change, but tip not recomputed until a separate action). This creates stale derived state: the displayed person total reflects the old tip while the total bill amount is recalculated. The UI shows inconsistent numbers.

**Why it happens:**
Each input control updates one piece of state and triggers a targeted recalculation. It feels efficient. But money calculations have many interdependencies — changing the tip percentage invalidates every person's total — and targeted updates miss cascading invalidations.

**How to avoid:**
Treat all per-person totals as pure derived values, never stored in state. The state holds only inputs: items (with prices and sharers), tip setting (percentage + mode), tax setting (amount/% + mode), party list. Every render computes all totals fresh from inputs. For a client-side app with < 20 line items and < 20 people, this is instant and eliminates stale state entirely. React's `useMemo` or a selector pattern (Zustand/Jotai computed values) enforces this cleanly.

**Warning signs:**
- State shape includes `person.total`, `person.subtotal`, or `bill.totalWithTip` as stored values rather than computed values
- Multiple `useEffect` calls updating derived totals in response to different input changes
- Bug reports where changing tip doesn't immediately update per-person totals

**Phase to address:**
State architecture phase (before any UI components). Define the canonical state shape and the derivation function before wiring up any inputs.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store totals in state rather than deriving them | Simpler initial component code | Stale state bugs when any input changes; hard to debug | Never — derive all totals |
| Use `Number.toFixed(2)` for money display on intermediate values | Easy formatting | Silently rounds mid-calculation, corrupts downstream math | Only acceptable at final display layer |
| Skip the largest-remainder method, just round each share | 30 lines less code | 1–2 cent discrepancies, especially for party sizes 3, 6, 7, 9 | Never — the algorithm is simple and must be correct |
| Allow items with 0 sharers | Simpler add-item flow | Division by zero crash or NaN in totals | Never — validate before calculation |
| `parseFloat` on user currency input without sanitization | Simple | Accepts "12.5.3" silently, produces NaN downstream | Never — parse and validate all money inputs |
| Equal-split only (no proportional) for MVP | Dramatically simpler math | Must retrofit proportional later; hard to add without rearchitecting split engine | Acceptable if explicitly deferred with a clear extension point |

---

## Integration Gotchas

This project is client-side only with no external integrations. This section is not applicable. However, the "integration" with the user's device (mobile browser) raises one concern:

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Mobile numeric keyboard | Using `type="text"` for price inputs | Use `type="number"` or `inputmode="decimal"` with `pattern="[0-9]*\.?[0-9]{0,2}"` — forces numeric keyboard on iOS/Android, prevents non-numeric input |
| Clipboard (share bill summary) | Using `document.execCommand('copy')` | Use the modern `navigator.clipboard.writeText()` API with a fallback for older browsers; the Clipboard API is async and needs a user gesture |
| URL state persistence | No URL state | Consider encoding bill state in a URL hash so users can share a session link; this is optional but high-value for a client-side-only app |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recalculating all totals on every keystroke without debounce | Perceptible lag when typing a price | Use `useMemo` with proper dependency arrays; React batches state updates so this is rarely a real problem with < 50 line items | Never an issue at restaurant scale (< 30 items, < 20 people) |
| Rendering a full item list with no keys (React) | Items reorder on edit, wrong item gets focus | Always key items by a stable ID (UUID at creation), never by array index | Breaks immediately with 2+ items when any item is deleted |
| Storing bill state in component local state (not lifted) | Cannot derive cross-component totals without prop drilling | Lift all bill state to a single top-level store or context at project start | Breaks when the second component needs access to totals |

---

## Security Mistakes

This is a client-side-only app with no server, no auth, no payment processing, and no persistent storage. Traditional web security concerns (SQL injection, XSS from server-rendered content, auth bypass) are largely irrelevant. The domain-specific concerns are:

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting `parseFloat` / `parseInt` on all user input without bounds checking | Negative prices, absurdly large numbers, or NaN propagate silently into all derived totals | Validate every monetary input: must be a finite positive number, max 2 decimal places, reasonable max value (e.g., $9,999.99 per item) |
| No input sanitization on person names | XSS if bill summary is rendered as `innerHTML` | Render all text as React text nodes (never `dangerouslySetInnerHTML`); person names are display-only strings |
| Sharing bill state via URL without encoding limits | A maliciously crafted URL could pass in a gigantic state payload that causes the browser to hang | If URL state is implemented, enforce a max item/person count before parsing state from URL |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing per-person totals before all items are entered | Users see incomplete totals and question accuracy | Show totals at all times but make it visually clear they update live; never hide totals |
| No visual indication of which items are shared | Users cannot verify their own total is correct | Show each item with sharer avatars/initials inline; clicking a person's total shows item-by-item breakdown |
| Tip and tax controls buried below item list | Users must scroll past all items to set tip — common on mobile with long bills | Pin tip/tax controls or put them at top with a collapsible item list |
| "Equal split" vs "proportional" terminology | Users do not know which to choose | Label them with examples: "Equal — everyone pays the same tip" vs "Proportional — tip matches your food share" |
| Custom tip % with no bounds | User types 200% accidentally | Cap custom tip at a sensible max (e.g., 100%) with a clear error; allow 0% |
| Rounding up: no explanation of surplus | Users see their total is higher than their food+tip+tax share and feel overcharged | Show "Rounded up — $0.67 extra goes to tip" inline next to their total |
| No "undo last item" | Accidentally deleted an item is gone; user must re-enter all data | Add undo for delete operations or at minimum a confirmation dialog before deletion |
| No summary/receipt view | Users must manually note down each person's amount | Provide a shareable summary: one screen with each person's name and total, optimized for screenshotting |

---

## "Looks Done But Isn't" Checklist

- [ ] **Math totals:** Sum of all per-person totals equals the grand total (bill + tip + tax) — verify for party sizes 2, 3, 5, 7, and 10 with real test data
- [ ] **Shared items:** Every item must have at least one sharer assigned — verify the UI blocks calculation or shows an error when any item has 0 sharers
- [ ] **Rounding mode:** "Round up each person" option shows where the rounding surplus goes — verify the surplus is displayed, not silently discarded
- [ ] **Proportional distribution:** Sum of proportionally distributed tip amounts equals the tip total exactly — verify with party size 3 (most likely to reveal off-by-one)
- [ ] **Mobile keyboard:** Price and percentage inputs show numeric keyboard on iOS Safari and Android Chrome — verify on real devices or BrowserStack, not just desktop dev tools
- [ ] **Custom tip %:** Entering 0% tip works and does not divide by zero or produce NaN — verify edge case
- [ ] **Tax as amount vs. %:** Switching between tax-as-dollar-amount and tax-as-percentage correctly recalculates — verify that switching modes does not carry over stale values
- [ ] **Single-person bill:** App works correctly when only 1 person is in the party — verify all totals equal the full bill
- [ ] **Empty state:** Freshly loaded app with no items shows no errors, no NaN, no $0.00 totals displayed prematurely
- [ ] **Person removal:** Removing a person who shares items reassigns or invalidates those item assignments — verify no orphaned sharer references cause crashes

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Float math embedded throughout — rewrite required | HIGH | Extract all calculation logic into a pure math module with no UI dependencies; rewrite the module to use integer cents; all other code calls the module, not raw arithmetic |
| Stale derived state stored in React state | MEDIUM | Identify all stored derived values; convert to `useMemo` or selector functions; remove the state fields and their update logic |
| Shared item sharer validation missing, causing NaN in production | LOW | Add a guard at the top of the calculation function: `if (item.sharers.length === 0) throw new Error(...)` and surface this as a UI validation error |
| Rounding mode semantics undefined — user confusion in production | LOW | Define the "surplus goes to extra tip" rule, add a one-sentence explanation next to the rounded total in the UI |
| Per-person breakdown missing — users cannot verify totals | MEDIUM | Add a collapsible per-item breakdown per person; requires the math engine to track item-level attribution per person, which is straightforward if derivation is centralized |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Float arithmetic for money | Phase 1: Math engine foundation | Test suite: `sum(allShares) === totalCents` for party sizes 1–10 |
| Inconsistent rounding across tip/tax/items | Phase 1: Math engine foundation | Test suite: round-trip totals with tip + tax at all three calculation modes |
| "Round up each person" surplus undefined | Phase 2: Rounding feature + UI | UI shows surplus amount; sum(rounded shares) - sum(base shares) = displayed surplus |
| Shared item 0-sharer edge case | Phase 1: Data model + validation | Unit test: item with 0 sharers triggers validation error before calculation |
| Proportional distribution cent gap | Phase 1: Math engine foundation | Test: `sum(personTipShares) === tipCents` for party sizes 3, 6, 7 |
| Stale derived state | Phase 1: State architecture | Code review: no `person.total` or `bill.total` fields in state store |
| Mobile numeric input UX | Phase 2: Input component build | Manual test on iOS Safari and Android Chrome |
| No per-person breakdown | Phase 3: Summary / receipt view | User can tap a person's name to see item-by-item breakdown |
| No undo on item deletion | Phase 2: Item management UI | Delete triggers confirmation or undo toast, not immediate permanent removal |
| Tax/tip mode switch stale values | Phase 1: Math engine + UI | Automated: switch modes in sequence, verify output is consistent with new mode |

---

## Sources

- Floating-point arithmetic and money: IEEE 754 double-precision specification; well-established computer science — HIGH confidence
- Largest-remainder method for cent distribution: used in proportional election systems and currency distribution algorithms; described in multiple academic and engineering sources — HIGH confidence
- UX pitfalls (no breakdown, rounding confusion, terminology): observed patterns in Splitwise, Tab (now defunct), Venmo bill-split feature, and community discussion on Hacker News and Reddit r/personalfinance — MEDIUM confidence (not freshly verified via live search due to tool unavailability)
- Input validation for mobile currency fields: MDN documentation on `inputmode` attribute and `type="number"` behavior — MEDIUM confidence
- React stale state / derived state patterns: well-established React community guidance (React docs, Dan Abramov's writing on derived state) — HIGH confidence

---
*Pitfalls research for: Expense Splitter — restaurant bill splitting web app*
*Researched: 2026-02-19*
