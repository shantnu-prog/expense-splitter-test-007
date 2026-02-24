No external research needed — all changes are internal fixes and consistency improvements.

Key findings from codebase exploration:
- DEBT-01: `as any` in PeoplePanel:91 and ItemsPanel:49 — caused by useUndoDelete using string instead of branded types
- DEBT-02: useEffect in TipTaxPanel:109 fires on mount — needs prevSubtotal ref guard
- DEBT-03: App.tsx has no error boundary — need class component (hooks can't catch render errors)
- DEBT-04: PaymentSection:39 uses window.location.href for UPI — no-op on desktop
- VIS-01/02: Three buttons below min-h-10 (PeoplePanel:125, AppShell:94, CopyButton:23) — all min-h-8
- VIS-03: CopyButton has no visual feedback on click — needs checkmark icon swap
- VIS-04: Spacing already consistent (px-4 py-3 standard across panels) — verification only
