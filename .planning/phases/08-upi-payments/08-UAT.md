---
status: complete
phase: 08-upi-payments
source: [08-01-SUMMARY.md, 08-02-SUMMARY.md]
started: 2026-02-24
updated: 2026-02-24
---

## Current Test

[testing complete]

## Tests

### 1. Add person with contact details
expected: On the People tab, type a name, then tap "+ Add contact details" below the name input. Two new fields appear: "Mobile number" and "UPI ID (e.g., name@ybl)". Enter a mobile and UPI VPA, then tap "Add". The fields collapse and clear after adding.
result: pass

### 2. Contact details visible on person row
expected: After adding a person with mobile and UPI VPA, their row in the People list shows the mobile number and UPI VPA in small gray text below their name.
result: pass

### 3. Add person without contact details
expected: Type a name and tap "Add" without expanding the contact section. The person is added with just their name, no contact info shown below the name.
result: pass

### 4. Contact details persist after page refresh
expected: Add a person with mobile + UPI VPA. Refresh the page (Cmd+R). The person still appears with their contact details visible below their name.
result: pass

### 5. Payer selector on Split tab
expected: On the Split tab (with at least 2 people and all items assigned), scroll down past the person cards. You see a "Request Payments" section with a "Who paid the bill?" dropdown listing all people.
result: issue
reported: "Not able to scroll down with mouse scroll. Else all details working properly."
severity: major

### 6. UPI request buttons after selecting payer
expected: Select a payer who has a UPI VPA. Each other person who owes money shows a row with their name, amount, and a green "Request via UPI" button. The payer themselves do NOT appear in the request list.
result: pass

### 7. No UPI ID fallback
expected: Select a payer who does NOT have a UPI VPA. Each debtor row shows their name and amount, but instead of a green UPI button, they show "No UPI ID" in gray text. An amber hint says "Add your UPI ID in the People tab to enable payment requests".
result: issue
reported: "For the person without UPI VPA, it is not showing as no UPI ID"
severity: major

### 8. Old saved splits load without crashing
expected: If you have any saved splits from before this update, tap one in the History tab. It loads without crashing, and people in that split simply don't show contact details (since they weren't captured before).
result: skipped
reason: No old splits available to test with

## Summary

total: 8
passed: 5
issues: 2
pending: 0
skipped: 1

## Gaps

- truth: "Split tab content is scrollable with mouse wheel to reveal Payment section below person cards"
  status: resolved
  reason: "User reported: Not able to scroll down with mouse scroll. Else all details working properly."
  severity: major
  test: 5
  root_cause: "AppShell root div used min-h-screen which allows flex container to grow beyond viewport — main's overflow-y-auto never triggers"
  fix: "Changed min-h-screen to h-screen on AppShell root div (commit 3b28c08)"
- truth: "Payer without UPI VPA shows 'No UPI ID' fallback text for each debtor row and amber hint to add VPA"
  status: resolved
  reason: "User reported: For the person without UPI VPA, it is not showing as no UPI ID"
  severity: major
  test: 7
  root_cause: "payer.upiVpa check did not trim whitespace; edge case with empty/whitespace strings"
  fix: "Added trim() to payer.upiVpa checks in PaymentSection (commit 3b28c08)"
