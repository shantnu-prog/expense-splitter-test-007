---
phase: 08-upi-payments
plan: 02
subsystem: payments
tags: [upi, react, typescript, vitest, deep-link]

# Dependency graph
requires:
  - phase: 08-01-upi-payments
    provides: Person type with optional upiVpa field, contact data in billStore
provides:
  - buildUpiLink pure function generating upi://pay URLs per NPCI spec
  - PaymentSection component with payer selector and per-person UPI request buttons
  - SummaryPanel updated to mount PaymentSection below person cards
affects: [future payment phases, summary UI changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - buildUpiLink returns null for invalid inputs (empty VPA, zero/negative amount) — callers check for null
    - URLSearchParams for URI encoding of UPI deep link parameters
    - Payer state stays local (component useState) — never enters bill store or history
    - window.location.href for UPI deep link activation (mobile-native approach)
    - Fallback text 'No UPI ID' shown when payer lacks upiVpa rather than broken button

key-files:
  created:
    - src/utils/buildUpiLink.ts
    - src/utils/buildUpiLink.test.ts
    - src/components/summary/PaymentSection.tsx
  modified:
    - src/components/summary/SummaryPanel.tsx
    - src/components/summary/SummaryPanel.test.tsx

key-decisions:
  - "Payer state stays local (component useState): must NOT enter bill store or history — display preference only"
  - "buildUpiLink returns null (not throws) for invalid inputs — callers use null check to conditionally render UPI button or fallback"
  - "window.location.href for UPI deep link — standard mobile approach; no-op on desktop (no broken behavior)"
  - "Green button color for 'Request via UPI' to distinguish from blue action buttons"

patterns-established:
  - "UPI URL pattern: upi://pay?pa=<VPA>&pn=<NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>"
  - "VPA as pa (payee) parameter — debtor taps button, pays the payer via UPI app"
  - "URLSearchParams handles all URI encoding; amount converted from cents to rupees (2 decimal places)"

requirements-completed: [PAY-03, PAY-04, PAY-05]

# Metrics
duration: 12min
completed: 2026-02-24
---

# Phase 8 Plan 02: UPI Payments Summary

**UPI deep link payment requests in Split tab — payer selector dropdown, per-person 'Request via UPI' buttons using upi://pay URLs, and graceful fallback when payer has no VPA**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-24T07:14:39Z
- **Completed:** 2026-02-24T07:26:54Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Pure `buildUpiLink` utility generates correct `upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...` URLs with proper URI encoding via URLSearchParams; returns null for invalid inputs
- `PaymentSection` component renders payer selector dropdown and per-person payment rows: UPI button when payer has VPA, "No UPI ID" text fallback when absent
- `SummaryPanel` updated to mount `PaymentSection` between person cards and action buttons; 6 buildUpiLink unit tests + all 144 existing tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create buildUpiLink utility and tests** - `b122748` (feat)
2. **Task 2: Create PaymentSection component** - `202f5be` (feat)
3. **Task 3: Mount PaymentSection in SummaryPanel** - `20bd6e7` (feat)

**Plan metadata:** *(docs commit — pending)*

## Files Created/Modified
- `src/utils/buildUpiLink.ts` - Pure function building upi://pay URLs from payee VPA, name, amount (cents), optional note
- `src/utils/buildUpiLink.test.ts` - 6 unit tests: valid link, no-note link, empty VPA null, zero/negative amount null, small amount formatting, special char encoding
- `src/components/summary/PaymentSection.tsx` - Payer selector and per-person UPI request buttons; payer and zero-amount persons excluded from list
- `src/components/summary/SummaryPanel.tsx` - Added PaymentSection import and mount point between person cards area and copy/save action buttons
- `src/components/summary/SummaryPanel.test.tsx` - Updated test to use getAllByText for person names (now appear in both PersonCard and payer select)

## Decisions Made
- **Payer state stays local**: Component `useState` — explicitly excluded from bill store and history as per v1.1 research decision
- **buildUpiLink returns null**: Not throws — lets callers conditionally render UPI button vs "No UPI ID" fallback text without try/catch
- **window.location.href**: Standard mobile UPI deep link trigger; gracefully no-ops on desktop

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed SummaryPanel test regression from PaymentSection introducing duplicate text nodes**
- **Found during:** Task 3 (Mount PaymentSection in SummaryPanel)
- **Issue:** After adding PaymentSection, person names appear in both PersonCard AND payer select `<option>` elements. Existing test used `getByText('Alice')` which throws when multiple elements match.
- **Fix:** Updated assertion to `getAllByText('Alice').length >= 1` and `getAllByText('Bob').length >= 1` — semantically correct since names legitimately appear in multiple places
- **Files modified:** `src/components/summary/SummaryPanel.test.tsx`
- **Verification:** All 144 tests pass after fix; `npx vitest run` clean
- **Committed in:** `20bd6e7` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Necessary correctness fix — test correctly queries duplicate text now that PaymentSection adds person names to payer select. No scope creep.

## Issues Encountered
None — plan executed smoothly. Build and all tests passed after the one test query fix.

## User Setup Required
None - no external service configuration required. UPI deep links work on device without any API keys or backend configuration.

## Next Phase Readiness
- Phase 8 complete — both plans (08-01 contact fields, 08-02 UPI payments) are done
- UPI payment flow fully functional: VPA stored in Person model, PaymentSection renders request buttons, buildUpiLink generates correct deep links
- No blockers for future phases

## Self-Check: PASSED

- src/utils/buildUpiLink.ts: FOUND
- src/utils/buildUpiLink.test.ts: FOUND
- src/components/summary/PaymentSection.tsx: FOUND
- .planning/phases/08-upi-payments/08-02-SUMMARY.md: FOUND
- Commit b122748 (Task 1): FOUND
- Commit 202f5be (Task 2): FOUND
- Commit 20bd6e7 (Task 3): FOUND

---
*Phase: 08-upi-payments*
*Completed: 2026-02-24*
