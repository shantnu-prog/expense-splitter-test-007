---
phase: 08-upi-payments
verified: 2026-02-24T07:31:00Z
status: passed
score: 12/12 must-haves verified
gaps: []
human_verification:
  - test: "UPI deep link opens UPI app on mobile"
    expected: "Tapping 'Request via UPI' opens PhonePe/GPay/Paytm with pre-filled payee VPA, amount in INR, and transaction note"
    why_human: "window.location.href UPI deep link behavior requires a real mobile device with a UPI app installed; cannot be verified programmatically in a jsdom test environment"
  - test: "Contact details persist across page refresh"
    expected: "After entering mobile and UPI VPA for a person and refreshing the page, the contact details reappear correctly"
    why_human: "Requires a real browser with localStorage; jsdom test environment mocks storage"
  - test: "Old saved splits load without crash"
    expected: "A bill saved before Phase 8 (schema v1, no mobile/upiVpa fields) opens correctly and shows no contact details"
    why_human: "Requires injecting a v1 localStorage payload and refreshing — needs real browser"
---

# Phase 8: UPI Payments Verification Report

**Phase Goal:** Users can store contact details (mobile + UPI VPA) per person, select who paid the bill, and request payment from each person via UPI deep links that open PhonePe/GPay/Paytm with pre-filled amount
**Verified:** 2026-02-24T07:31:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Person interface has optional mobile and upiVpa string fields | VERIFIED | `src/engine/types.ts` lines 66-68: `mobile?: string; upiVpa?: string` present on `Person` interface |
| 2  | User can enter mobile number and UPI VPA when adding a person | VERIFIED | `src/components/people/PeoplePanel.tsx` lines 20-22, 131-151: state vars `mobile`, `upiVpa`, `showContact`; collapsible input section renders both fields |
| 3  | Contact details persist across page refresh via billStore persist middleware | VERIFIED | `src/store/billStore.ts` lines 259, 276-284: persist `version: 2` with migration; `addPerson` at lines 104-111 stores contact on Person object; contact fields part of `config` which is persisted |
| 4  | Old saved splits without contact fields load without crashing — fields default to undefined | VERIFIED | `src/storage/deserializeBillConfig.ts` lines 26-31: cast type includes `mobile?: string; upiVpa?: string`; lines 42-43 use conditional spread — absent fields produce no key (not undefined pollution) |
| 5  | Contact details are visible on each person row in the People panel | VERIFIED | `src/components/people/PersonRow.tsx` lines 15, 21-29: `hasContact` guard; conditional render of mobile and upiVpa below name; `PeoplePanel.tsx` lines 157-163 passes `mobile={person.mobile}` and `upiVpa={person.upiVpa}` |
| 6  | buildUpiLink produces a correctly encoded upi://pay URL with pa, pn, am, cu=INR, and tn parameters | VERIFIED | `src/utils/buildUpiLink.ts` lines 33-44: `URLSearchParams` with pa, pn, am, cu=INR; optional tn; returns `upi://pay?${searchParams.toString()}`; all 6 unit tests pass |
| 7  | User can select who paid the bill from a dropdown of current people | VERIFIED | `src/components/summary/PaymentSection.tsx` lines 20, 47-57: `useState<PersonId | ''>('')` for payer; `<select>` populated with `people.map(p => <option>)` |
| 8  | Each non-payer person with a UPI VPA shows a "Request via UPI" button | VERIFIED | `PaymentSection.tsx` lines 26-32: `debtors` filters out payer and zero-amount persons; lines 68-75: `upiUrl = payer.upiVpa ? buildUpiLink(...) : null`; lines 87-93: green `<button>` rendered when `upiUrl` is truthy |
| 9  | Tapping "Request via UPI" opens the upi:// deep link | VERIFIED (code path) | `PaymentSection.tsx` lines 34-37: `handleUpiClick` sets `window.location.href = upiUrl`; actual mobile UPI app launch requires human verification |
| 10 | Persons without a UPI VPA show fallback — amount text only, no broken link | VERIFIED | `PaymentSection.tsx` lines 94-96: `<span className="... text-gray-500 text-xs shrink-0">No UPI ID</span>` rendered when `upiUrl` is null |
| 11 | Payer is excluded from the payment request list | VERIFIED | `PaymentSection.tsx` line 27: `filter((r) => r.personId !== payerId && r.roundedTotalCents > 0)` — payer explicitly filtered out |
| 12 | PaymentSection is mounted in SummaryPanel and receives people and results | VERIFIED | `src/components/summary/SummaryPanel.tsx` lines 25, 147: `import { PaymentSection }` and `<PaymentSection people={people} results={successResult.results} />` between person cards and action buttons |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/types.ts` | Person interface with optional mobile and upiVpa fields | VERIFIED | Lines 62-69: interface has `mobile?: string` and `upiVpa?: string`; exported as `Person` |
| `src/storage/deserializeBillConfig.ts` | Backwards-compatible deserialization with optional contact fields | VERIFIED | Lines 26-44: cast type + conditional spread handles both old and new data |
| `src/store/billStore.ts` | addPerson accepts optional contact; persist version 2 with migration | VERIFIED | Lines 46, 104-111: `addPerson(name, contact?)` with contact fields; line 259: `version: 2`; lines 276-284: migration stub |
| `src/components/people/PeoplePanel.tsx` | Mobile and UPI VPA input fields in add-person form | VERIFIED | Lines 20-22: state; lines 50-58: passes contact to addPerson; lines 121-151: collapsible contact inputs rendered |
| `src/components/people/PersonRow.tsx` | Displays contact details below person name | VERIFIED | Lines 7-12: props with `mobile?` and `upiVpa?`; lines 14-41: full implementation with conditional contact display |
| `src/utils/buildUpiLink.ts` | Pure function building upi://pay URLs | VERIFIED | Lines 26-45: full implementation; returns null for invalid inputs; exports `buildUpiLink` |
| `src/utils/buildUpiLink.test.ts` | Unit tests for URL encoding, amount formatting, edge cases | VERIFIED | 6 tests: valid link, no-note, empty VPA null, zero/negative amount null, small amount, special characters; all 6 pass |
| `src/components/summary/PaymentSection.tsx` | Payer selector + UPI request buttons + VPA fallback | VERIFIED | 111 lines: full implementation with payer `<select>`, debtor filter, UPI button, "No UPI ID" fallback, hint text |
| `src/components/summary/SummaryPanel.tsx` | Mounts PaymentSection below person cards | VERIFIED | Line 25: import; line 147: `<PaymentSection people={people} results={successResult.results} />` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `deserializeBillConfig.ts` | `types.ts` | import Person type with optional mobile/upiVpa fields | WIRED | Line 26-31: cast type explicitly includes `mobile?: string; upiVpa?: string`; lines 42-43 use conditional spread |
| `billStore.ts` | `types.ts` | addPerson uses Person type with contact fields | WIRED | Line 107-110: creates `Person` object and conditionally sets `person.mobile` and `person.upiVpa` |
| `PeoplePanel.tsx` | `billStore.ts` | calls addPerson with contact details | WIRED | Lines 50-54: builds `contact` object from `mobile.trim()` / `upiVpa.trim()`; calls `addPerson(trimmed, contact)` |
| `PaymentSection.tsx` | `buildUpiLink.ts` | import buildUpiLink to generate UPI deep link URLs | WIRED | Line 9: `import { buildUpiLink } from '../../utils/buildUpiLink'`; line 69: `buildUpiLink({ payeeVpa: payer.upiVpa, ... })` |
| `PaymentSection.tsx` | `types.ts` | import Person, PersonId, PersonResult types | WIRED | Lines 11-12: `import type { Person, PersonId, PersonResult } from '../../engine/types'` |
| `SummaryPanel.tsx` | `PaymentSection.tsx` | render PaymentSection with people and results | WIRED | Line 25: `import { PaymentSection } from './PaymentSection'`; line 147: mounted with `people` and `successResult.results` |
| `PeoplePanel.tsx` | `PersonRow.tsx` | passes mobile and upiVpa props to PersonRow | WIRED | Lines 157-163: `<PersonRow name={person.name} mobile={person.mobile} upiVpa={person.upiVpa} onRemove={...} />` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PAY-01 | 08-01-PLAN.md | User can enter mobile number and UPI VPA when adding a person | SATISFIED | PeoplePanel has collapsible contact inputs (tel + text); handleAdd passes them to addPerson |
| PAY-02 | 08-01-PLAN.md | Contact details (mobile, UPI VPA) are saved with the person and persist across sessions | SATISFIED | addPerson stores contact on Person; billStore persist v2 serializes config (including people array) to localStorage; deserializeBillConfig restores fields |
| PAY-03 | 08-02-PLAN.md | User can select who paid the bill from the people list | SATISFIED | PaymentSection renders `<select>` dropdown populated with all people; `payerId` state drives payer identification |
| PAY-04 | 08-02-PLAN.md | Each non-payer person has a "Request via UPI" button that opens a upi:// deep link with pre-filled amount | SATISFIED | PaymentSection filters debtors (non-payer, amount > 0); renders "Request via UPI" green button when payer has VPA; `window.location.href = upiUrl` triggers deep link |
| PAY-05 | 08-02-PLAN.md | UPI deep link opens PhonePe/GPay/Paytm with correct payee VPA, amount in INR, and transaction note | SATISFIED (code) | buildUpiLink produces `upi://pay?pa=<VPA>&pn=<NAME>&am=<AMOUNT>&cu=INR&tn=Bill+split+via+SplitCheck`; actual app launch needs human verification on mobile device |

**Orphaned requirements:** None. All 5 PAY requirements are claimed in plan frontmatter and have implementation evidence.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/utils/buildUpiLink.ts` | 29 | `return null` | Info | Intentional — documented guard for invalid inputs (empty VPA, zero/negative amount). Callers check for null before rendering UPI button. Not a stub. |

No blocker or warning anti-patterns found. No TODO/FIXME/placeholder comments in any phase-8 files.

---

### Test Results

- `npx tsc --noEmit`: PASSED — zero type errors
- `npx vitest run src/utils/buildUpiLink.test.ts`: PASSED — 6/6 tests
- `npx vitest run` (full suite): PASSED — 144/144 tests across 12 test files

---

### Human Verification Required

#### 1. UPI Deep Link Opens UPI App

**Test:** On an Android or iOS device with PhonePe, GPay, or Paytm installed, add a person with a UPI VPA (e.g., `test@ybl`), add items, assign them, go to the Split tab, select the payer, and tap "Request via UPI" on a non-payer row.
**Expected:** The device opens a UPI payment app with payee VPA pre-filled to the payer's VPA, amount in INR matching the split, and transaction note "Bill split via SplitCheck".
**Why human:** `window.location.href = upiUrl` UPI deep link behavior requires a real mobile device with a registered UPI app; jsdom cannot simulate app switching.

#### 2. Contact Details Persist Across Page Refresh

**Test:** In a real browser, add a person with name "Alice", mobile "9876543210", and UPI VPA "alice@ybl". Close and reopen the tab (or refresh).
**Expected:** Alice reappears in the people list with mobile "9876543210" and UPI VPA "alice@ybl" visible below her name.
**Why human:** Requires real browser localStorage; vitest uses a mocked localStorage environment.

#### 3. Schema Migration — Old Splits Load Without Crash

**Test:** Manually inject a v1 schema entry into localStorage (`bill-splitter-active`) with people that have no mobile/upiVpa fields. Refresh the page.
**Expected:** The old split loads correctly; no JavaScript error; contact fields are simply absent on person rows.
**Why human:** Requires real browser with direct localStorage manipulation.

#### 4. Payer with No UPI VPA — Hint Message Visible

**Test:** Add a person with name only (no UPI VPA). In the Split tab, select them as payer. Verify other persons show their amount with "No UPI ID" text, and the amber hint "Add your UPI ID in the People tab..." appears.
**Expected:** No broken UPI buttons; amber hint message visible at the bottom of the payment list.
**Why human:** Visual rendering and hint visibility requires a real browser.

---

### Gaps Summary

None. All 12 must-have truths are verified, all 9 artifacts are substantive and wired, all 7 key links are confirmed in the codebase, and all 5 PAY requirements have implementation evidence. The test suite passes in full (144/144 tests, 0 TypeScript errors).

Three items are flagged for human verification due to environment constraints (mobile UPI app launch, real browser localStorage, schema migration from v1). These are verification environment limitations, not implementation gaps — the code paths for all three scenarios are correctly implemented.

---

_Verified: 2026-02-24T07:31:00Z_
_Verifier: Claude (gsd-verifier)_
