# Plan 01: Row Cards + List Spacing

**Phase:** 15 — Component Redesign
**Goal:** Convert all row components to glass cards with rounded corners, remove flat border-b separators, and apply consistent list container spacing
**Requirements:** CARD-01, CARD-02, CARD-03, CARD-04, CARD-06, CARD-07

## Tasks

<task id="1">
<title>Convert PersonRow to glass-card and update PeoplePanel list spacing</title>
<description>
**Edit `src/components/people/PersonRow.tsx`:**

Change the outer div:
```tsx
// Before:
className="flex items-center justify-between px-4 py-3 border-b border-gray-800"

// After:
className="glass-card rounded-xl flex items-center justify-between px-4 py-3"
```

**Edit `src/components/people/PeoplePanel.tsx`:**

Change the people list container (the div wrapping the `.map()`):
```tsx
// Before:
<div className="flex-1 overflow-y-auto">

// After:
<div className="flex-1 overflow-y-auto px-4 pt-3 space-y-2">
```

**Verification:** Person rows render as glass cards with rounded corners and spacing between them. No flat border-b separators.
</description>
<requirements>CARD-01, CARD-07</requirements>
</task>

<task id="2">
<title>Convert ItemRow to glass-card and update ItemsPanel list spacing</title>
<description>
**Edit `src/components/items/ItemRow.tsx`:**

Change the outer div:
```tsx
// Before:
className="flex items-center gap-2 px-4 py-3 border-b border-gray-800"

// After:
className="glass-card rounded-xl flex items-center gap-2 px-4 py-3"
```

**Edit `src/components/items/ItemsPanel.tsx`:**

Change the items list container:
```tsx
// Before:
<div className="flex-1 overflow-y-auto">

// After:
<div className="flex-1 overflow-y-auto px-4 pt-3 space-y-2">
```

**Verification:** Item rows render as glass cards. Inline name/price inputs and quantity stepper still function correctly within the card.
</description>
<requirements>CARD-02, CARD-07</requirements>
</task>

<task id="3">
<title>Convert HistoryRow to glass-card with press-scale and update HistoryPanel list spacing</title>
<description>
**Edit `src/components/history/HistoryRow.tsx`:**

Change the outer button:
```tsx
// Before:
className="w-full flex items-center justify-between px-4 py-3 min-h-16
                 border-b border-gray-800 bg-gray-900/50 hover:bg-gray-800
                 transition text-left"

// After:
className="w-full glass-card rounded-xl flex items-center justify-between px-4 py-3 min-h-16
                 hover:bg-white/5 press-scale
                 transition text-left"
```

**Edit `src/components/history/HistoryPanel.tsx`:**

Change the scrollable split list container:
```tsx
// Before:
<div className="flex-1">

// After:
<div className="flex-1 px-4 pt-3 space-y-2">
```

**Verification:** History rows render as glass cards with visible press-scale on tap and hover highlight. Delete button inside still works (stopPropagation).
</description>
<requirements>CARD-03, CARD-07</requirements>
</task>

<task id="4">
<title>Convert AssignmentRow to glass-card and update AssignmentPanel list spacing</title>
<description>
**Edit `src/components/assignments/AssignmentRow.tsx`:**

Change the outer div:
```tsx
// Before:
className="border-b border-gray-800"

// After:
className="glass-card rounded-xl overflow-hidden"
```

**Edit `src/components/assignments/AssignmentPanel.tsx`:**

Change the items list container:
```tsx
// Before:
<div className="flex-1 overflow-y-auto">

// After:
<div className="flex-1 overflow-y-auto px-4 pt-3 space-y-2">
```

**Key detail:** `overflow-hidden` on AssignmentRow is required per CARD-04 — it clips the expanded checklist content to the rounded corners. Without it, the expanded person checkboxes would poke outside the card's rounded-xl corners.

**Verification:** Assignment rows render as glass cards. Expanding a row shows the person checkboxes and "Everyone" button clipped within rounded corners.
</description>
<requirements>CARD-04, CARD-07</requirements>
</task>

<task id="5">
<title>Convert PaymentSection debtor rows to glass-card</title>
<description>
**Edit `src/components/summary/PaymentSection.tsx`:**

Change each debtor row div:
```tsx
// Before:
className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3"

// After:
className="flex items-center justify-between glass-card rounded-xl px-4 py-3"
```

The PaymentSection's parent already has `gap-2` on the list container, so no additional spacing changes needed.

**Verification:** Payment debtor rows render as glass cards. UPI button and "Add UPI ID" link still function.
</description>
<requirements>CARD-06</requirements>
</task>

## Completion Criteria

All of the following must be true:
1. PersonRow, ItemRow, HistoryRow, AssignmentRow, and PaymentSection debtor rows all render as glass cards with rounded corners
2. No flat `border-b border-gray-800` separator lines between rows — spacing is handled by `space-y-2` on the parent container
3. HistoryRow has visible press-scale on tap and hover:bg-white/5 highlight
4. AssignmentRow expanded content is clipped within rounded corners (overflow-hidden)
5. All inline inputs, buttons, and interactive elements within cards still function
6. All 144 existing tests pass
7. `npm run build` succeeds
