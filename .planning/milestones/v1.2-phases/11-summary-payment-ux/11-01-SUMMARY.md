---
phase: "11"
plan: "01"
subsystem: summary-payment-ux
tags: [store, persistence, upi, settlement-direction, navigation]
dependency-graph:
  requires: [billStore, PaymentSection, PersonCard, SummaryPanel, AppShell]
  provides: [persisted-payer-selection, settlement-direction-labels, upi-navigation]
  affects: [SummaryPanel.test.tsx]
tech-stack:
  added: []
  patterns: [store-backed-selection, prop-threading-for-tab-navigation]
key-files:
  created: []
  modified:
    - src/store/billStore.ts
    - src/components/summary/PaymentSection.tsx
    - src/components/summary/PersonCard.tsx
    - src/components/summary/SummaryPanel.tsx
    - src/components/summary/SummaryPanel.test.tsx
    - src/components/layout/AppShell.tsx
decisions:
  - "payerId type is PersonId | null (not PersonId | '') for clean store semantics"
  - "payerId persisted via partialize alongside config for cross-tab/refresh persistence"
  - "Tab type import from TabBar for strict TypeScript — no string fallback"
metrics:
  duration: "2m 47s"
  completed: "2026-02-24"
  tasks: 3
  files-modified: 6
  tests-after: 144
requirements: [SUM-01, SUM-02, SUM-04]
---

# Phase 11 Plan 01: Payer Store, Settlement Direction, and UPI Navigation Summary

Persisted payer selection in billStore with settlement direction labels on PersonCard and "Add UPI ID" navigation button replacing static text.

## Tasks Completed

| Task | Name | Commit | Key Changes |
| ---- | ---- | ------ | ----------- |
| 1 | Add payerId to billStore | fab04de | Added payerId field, setPayerId action, persistence via partialize/merge, reset cleanup |
| 2 | Update PaymentSection and add UPI navigation | fab04de | Replaced useState with store-backed payerId, added onTabChange prop threading, replaced "No UPI ID" span with navigable button |
| 3 | Add settlement direction to PersonCard | fab04de | Added payerName/isPayer props, "owes [payer]" / "Paid" subtitle text, wired through SummaryPanel |

## Changes Made

### billStore.ts
- Added `payerId: PersonId | null` to BillState interface and initial state
- Added `setPayerId` action with immer setter
- Updated `partialize` to persist payerId alongside config
- Updated `merge` to restore payerId from localStorage with branded type cast
- Updated `reset()` to clear payerId back to null

### PaymentSection.tsx
- Removed `useState` import, added `useBillStore` import
- Replaced local `useState<PersonId | ''>('')` with store-backed `payerId` / `setPayerId`
- Added `onTabChange: (tab: Tab) => void` to props interface
- Replaced static "No UPI ID" `<span>` with `<button>` that calls `onTabChange('people')`

### PersonCard.tsx
- Added optional `payerName?: string` and `isPayer?: boolean` props
- Replaced single name `<span>` with `<div>` containing name + settlement direction subtitle
- Shows "Paid" for payer, "owes [payerName]" for non-payers (only when payer selected)

### SummaryPanel.tsx
- Added `SummaryPanelProps` interface with `onTabChange: (tab: Tab) => void`
- Added `payerId` to `useBillStore` selector
- Computed `payerName` from people array
- Passed `payerName` and `isPayer` to each PersonCard
- Passed `onTabChange` to PaymentSection

### AppShell.tsx
- Updated `<SummaryPanel />` to `<SummaryPanel onTabChange={setActiveTab} />`

### SummaryPanel.test.tsx
- Added `const mockOnTabChange = vi.fn()` mock
- Updated all 8 `render(<SummaryPanel />)` calls to include `onTabChange={mockOnTabChange}` prop

## Verification

- TypeScript: `npx tsc --noEmit` passes cleanly
- Tests: 144/144 passing across 12 test files
- Build: `npm run build` succeeds (252 KB JS, 24 KB CSS)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

All 6 modified files verified present. Commit fab04de verified in git log.
