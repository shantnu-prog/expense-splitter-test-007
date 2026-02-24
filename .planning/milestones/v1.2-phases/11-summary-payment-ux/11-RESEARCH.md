No external research needed — all changes are internal to existing components.

Key analysis from source code review:
- Payer state is LOCAL to PaymentSection (useState) — must move to billStore for SUM-04
- billStore already has persist middleware (version 2) — adding payerId is straightforward
- PersonCard has no concept of payer — needs payerId + payerName props for SUM-01
- "No UPI ID" is a plain span (PaymentSection:97) — needs onTabChange callback for SUM-02
- TipSegmentedControl has no subtotal context — needs prop for SUM-03 dollar preview
- All panels stay mounted (CSS hidden) so payer persistence works even without store, but store adds refresh persistence
