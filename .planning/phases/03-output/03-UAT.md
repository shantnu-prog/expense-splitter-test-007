---
status: complete
phase: 03-output
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-02-21T09:50:00Z
updated: 2026-02-21T10:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Tip Preset Selection
expected: On the Split tab, tap 15% — it highlights as selected. Tap 18% — it highlights, 15% deselects. Tap 20% — same behavior. One preset is always selected.
result: pass

### 2. Custom Tip Percentage
expected: Tap "Custom" segment — a text input appears. Type a percentage (e.g., "22"). Tab away or tap elsewhere — the tip updates to 22% of the subtotal. Tapping a preset (e.g., 15%) hides the custom input and switches back.
result: pass

### 3. Tax Dollar Amount Entry
expected: In the Tax section, with "$" mode active, type a dollar amount (e.g., "5.00"). The tax is set to $5.00. The value appears in the input.
result: pass

### 4. Tax Percentage Mode Switch
expected: Tap the "%" button next to the tax input. The mode switches to percentage. The input clears (previous dollar value is removed). Type "8.5" — tax is set to 8.5% of the subtotal.
result: pass

### 5. Independent Split Method Toggles
expected: Tip has its own Equal/Proportional toggle. Tax has a separate Equal/Proportional toggle. Setting tip to "Proportional" does not change the tax toggle — they are independent.
result: pass

### 6. Split Tab Appears in Navigation
expected: The bottom tab bar shows 4 tabs: People, Items, Assign, Split. Tapping Split shows the tip/tax controls at the top and the summary below.
result: pass

### 7. Bill Total for Receipt Comparison
expected: At the top of the summary section (below tip/tax controls), a bill total is displayed (e.g., "Bill total: $XX.XX") so you can compare against the actual receipt.
result: pass

### 8. Per-Person Summary Cards
expected: Below the bill total, each person has their own card showing their name and the total they owe (rounded up to the nearest cent). Cards are stacked vertically.
result: pass

### 9. Expandable Card Detail
expected: Tap a person's card — it smoothly expands to show a breakdown: food subtotal, tip share, and tax share. Tap again — it collapses back to just name + total.
result: pass

### 10. Rounding Surplus Footer
expected: If rounding up creates extra cents (surplus > $0.00), a footer appears below all cards showing the rounding surplus amount. If surplus is exactly $0.00, no footer appears.
result: pass

### 11. Copy Full Summary
expected: Tap the "Copy summary" button. A toast notification appears briefly saying "Summary copied!" (or similar). Paste in a text field — you see a labeled breakdown like "Bill Split:\n- Alice owes $XX.XX\n- Bob owes $XX.XX\nTotal: $XX.XX (includes tip + tax)".
result: pass

### 12. Copy Individual Person Amount
expected: Each person's card has a small copy icon. Tap it (without the card expanding/collapsing). A toast appears. Paste — you see just that person's amount (e.g., "Alice owes $23.50").
result: pass

### 13. Tip Auto-Recalculates on Item Change
expected: Set tip to 18%. Go to Items tab and add a new item. Return to Split tab — the tip amount has recalculated based on the new subtotal (18% of the updated total), without you re-selecting the percentage.
result: pass

### 14. Unassigned Item Error State
expected: Add an item but don't assign it to anyone. Go to Split tab — instead of the summary, you see a message indicating items need assignment before splitting (e.g., "N item(s) need assignment").
result: pass

## Summary

total: 14
passed: 14
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
