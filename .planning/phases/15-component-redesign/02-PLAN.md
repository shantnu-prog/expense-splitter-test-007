# Plan 02: Inputs, Toggles + Buttons

**Phase:** 15 — Component Redesign
**Goal:** Restyle all text inputs with glass background and focus glow, convert toggle controls to glass containers with gradient active segments, and apply gradient-primary + press-scale to all buttons
**Requirements:** INPT-01, INPT-02, INPT-03, INPT-04, BTTN-01, BTTN-02, BTTN-03
**Depends on:** Plan 01 (row card changes must be in place first to avoid edit conflicts)

## Tasks

<task id="1">
<title>Restyle all text inputs with bg-white/5 and focus:ring glow</title>
<description>
Apply the INPT-01 pattern to all text inputs across the app: `bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30`

**Edit `src/components/people/PeoplePanel.tsx`:**

1. Name input (line ~110):
```tsx
// Before:
className="flex-1 min-h-12 px-4 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-base"

// After:
className="flex-1 min-h-12 px-4 bg-white/5 text-gray-100 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-base"
```

2. Mobile input (line ~137):
```tsx
// Before:
className="min-h-12 px-4 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-base"

// After:
className="min-h-12 px-4 bg-white/5 text-gray-100 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-base"
```

3. UPI VPA input (line ~145):
```tsx
// Before:
className="min-h-12 px-4 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-base"

// After:
className="min-h-12 px-4 bg-white/5 text-gray-100 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-base"
```

**Edit `src/components/items/ItemRow.tsx`:**

4. Name input:
```tsx
// Before:
className="flex-1 bg-transparent text-gray-100 focus:bg-gray-800 rounded px-2 py-1 min-h-10 text-base"

// After:
className="flex-1 bg-white/5 text-gray-100 rounded-lg px-2 py-1 min-h-10 text-base border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
```

5. Price input:
```tsx
// Before:
className="w-24 min-h-10 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 pl-7 pr-2 text-right text-base"

// After:
className="w-24 min-h-10 bg-white/5 text-gray-100 rounded-lg border border-white/10 pl-7 pr-2 text-right text-base focus:outline-none focus:ring-2 focus:ring-blue-500/30"
```

**Edit `src/components/tip-tax/TipSegmentedControl.tsx`:**

6. Custom tip input:
```tsx
// Before:
className="flex-1 min-h-12 px-3 py-2 text-base bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"

// After:
className="flex-1 min-h-12 px-3 py-2 text-base bg-white/5 border border-white/10 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
```

**Edit `src/components/tip-tax/TaxInput.tsx`:**

7. Value input:
```tsx
// Before:
className="flex-1 min-h-12 px-3 py-2 text-base bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"

// After:
className="flex-1 min-h-12 px-3 py-2 text-base bg-white/5 border border-white/10 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
```

**Edit `src/components/summary/PaymentSection.tsx`:**

8. Payer select:
```tsx
// Before:
className="w-full min-h-12 px-4 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-base appearance-none"

// After:
className="w-full min-h-12 px-4 bg-white/5 text-gray-100 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-base appearance-none"
```

**Verification:** All text inputs show bg-white/5 background and a visible blue glow ring when focused. The focused state is clearly distinct from unfocused.
</description>
<requirements>INPT-01</requirements>
</task>

<task id="2">
<title>Convert TipSegmentedControl to glass container with gradient active segment</title>
<description>
**Edit `src/components/tip-tax/TipSegmentedControl.tsx`:**

1. Change the segment group container:
```tsx
// Before:
className="flex bg-gray-800 rounded-lg p-1 gap-1"

// After:
className="flex glass-surface rounded-lg p-1 gap-1"
```

2. Change the active segment style in the label className:
```tsx
// Before:
isActive
  ? 'bg-blue-600 text-white'
  : 'text-gray-400 hover:text-gray-200',

// After:
isActive
  ? 'gradient-primary text-white'
  : 'text-gray-400 hover:text-gray-200',
```

**Verification:** The tip segment group has a frosted glass container. The active segment (15%, 18%, 20%, or Custom) shows a blue-to-violet gradient highlight.
</description>
<requirements>INPT-02</requirements>
</task>

<task id="3">
<title>Convert TaxInput toggle to glass container with gradient active button</title>
<description>
**Edit `src/components/tip-tax/TaxInput.tsx`:**

1. Change the mode toggle container:
```tsx
// Before:
className="flex bg-gray-800 rounded-lg overflow-hidden flex-shrink-0"

// After:
className="flex glass-surface rounded-lg overflow-hidden flex-shrink-0"
```

2. Change the active button style for the dollar mode button:
```tsx
// Before:
mode === 'dollar'
  ? 'bg-gray-700 text-gray-100'
  : 'text-gray-500 hover:text-gray-300',

// After:
mode === 'dollar'
  ? 'gradient-primary text-white'
  : 'text-gray-500 hover:text-gray-300',
```

3. Change the active button style for the percent mode button:
```tsx
// Before:
mode === 'percent'
  ? 'bg-gray-700 text-gray-100'
  : 'text-gray-500 hover:text-gray-300',

// After:
mode === 'percent'
  ? 'gradient-primary text-white'
  : 'text-gray-500 hover:text-gray-300',
```

**Verification:** The tax mode toggle ($/%​) has a frosted glass container with gradient-primary on the active mode button.
</description>
<requirements>INPT-03</requirements>
</task>

<task id="4">
<title>Convert SplitMethodToggle to glass container with gradient active button</title>
<description>
**Edit `src/components/tip-tax/SplitMethodToggle.tsx`:**

1. Change the toggle container:
```tsx
// Before:
className="flex bg-gray-800 rounded-lg overflow-hidden"

// After:
className="flex glass-surface rounded-lg overflow-hidden"
```

2. Change the active button style for "Equal":
```tsx
// Before:
value === 'equal'
  ? 'bg-gray-700 text-gray-100'
  : 'text-gray-500 hover:text-gray-300',

// After:
value === 'equal'
  ? 'gradient-primary text-white'
  : 'text-gray-500 hover:text-gray-300',
```

3. Change the active button style for "Proportional":
```tsx
// Before:
value === 'proportional'
  ? 'bg-gray-700 text-gray-100'
  : 'text-gray-500 hover:text-gray-300',

// After:
value === 'proportional'
  ? 'gradient-primary text-white'
  : 'text-gray-500 hover:text-gray-300',
```

**Verification:** The split method toggle (Equal/Proportional) has a glass container with gradient-primary on the active option.
</description>
<requirements>INPT-04</requirements>
</task>

<task id="5">
<title>Apply gradient-primary + press-scale to all primary buttons</title>
<description>
Apply the BTTN-01 pattern: replace `bg-blue-600 ... active:bg-blue-700` with `gradient-primary press-scale shadow-lg`

**Edit `src/components/people/PeoplePanel.tsx`:**

1. "Add" button:
```tsx
// Before:
className="min-h-12 px-6 bg-blue-600 text-white font-medium rounded-lg active:bg-blue-700"

// After:
className="min-h-12 px-6 gradient-primary text-white font-medium rounded-lg press-scale shadow-lg"
```

2. "Add your first person" empty state button:
```tsx
// Before:
className="px-5 py-2 bg-blue-600 text-white rounded-lg min-h-11 text-sm font-medium active:bg-blue-700"

// After:
className="px-5 py-2 gradient-primary text-white rounded-lg min-h-11 text-sm font-medium press-scale shadow-lg"
```

**Edit `src/components/history/HistoryPanel.tsx`:**

3. "New Split" empty state button:
```tsx
// Before:
className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl min-h-12 active:bg-blue-700"

// After:
className="px-6 py-3 gradient-primary text-white font-medium rounded-xl min-h-12 press-scale shadow-lg"
```

**Edit `src/components/assignments/AssignmentPanel.tsx`:**

4. "Go to Items" empty state button:
```tsx
// Before:
className="px-5 py-2 bg-blue-600 text-white rounded-lg min-h-11 text-sm font-medium active:bg-blue-700"

// After:
className="px-5 py-2 gradient-primary text-white rounded-lg min-h-11 text-sm font-medium press-scale shadow-lg"
```

5. "Go to People" empty state button (same pattern — this class string appears twice in AssignmentPanel):
```tsx
// Before:
className="px-5 py-2 bg-blue-600 text-white rounded-lg min-h-11 text-sm font-medium active:bg-blue-700"

// After:
className="px-5 py-2 gradient-primary text-white rounded-lg min-h-11 text-sm font-medium press-scale shadow-lg"
```

**Edit `src/components/summary/SummaryPanel.tsx`:**

6. "Copy summary" button:
```tsx
// Before:
className="w-full bg-blue-600 text-white font-medium rounded-xl min-h-12 active:bg-blue-700"

// After:
className="w-full gradient-primary text-white font-medium rounded-xl min-h-12 press-scale shadow-lg"
```

**Edit `src/components/summary/PaymentSection.tsx`:**

7. "Request via UPI" button — green gradient variant per CARD-06:
```tsx
// Before:
className="ml-3 px-4 min-h-10 bg-green-600 text-white text-sm font-medium rounded-lg active:bg-green-700 shrink-0"

// After:
className="ml-3 px-4 min-h-10 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-medium rounded-lg press-scale shadow-lg shrink-0"
```

**Edit `src/components/assignments/AssignmentRow.tsx`:**

8. "Everyone" button — this is a tinted secondary action, apply press-scale only:
```tsx
// Before:
className="w-full min-h-10 rounded-lg text-sm font-medium bg-blue-600/20 text-blue-400 active:bg-blue-600/30 mb-2"

// After:
className="w-full min-h-10 rounded-lg text-sm font-medium bg-blue-600/20 text-blue-400 press-scale mb-2"
```

**Verification:** All primary buttons show blue-to-violet gradient. UPI button shows green gradient. All produce visible press-scale shrink on tap.
</description>
<requirements>BTTN-01, CARD-06</requirements>
</task>

<task id="6">
<title>Apply bg-white/5 + press-scale to secondary buttons and CopyButton</title>
<description>
**Edit `src/components/summary/SummaryPanel.tsx`:**

1. "Save Split" / "Update Split" button:
```tsx
// Before:
className="w-full bg-gray-800 text-gray-100 font-medium rounded-xl min-h-12 border border-gray-700 active:bg-gray-700"

// After:
className="w-full bg-white/5 text-gray-100 font-medium rounded-xl min-h-12 border border-white/10 press-scale"
```

**Edit `src/components/items/ItemsPanel.tsx`:**

2. "+" add item button (dashed border secondary):
```tsx
// Before:
className="min-h-12 w-full bg-gray-800 text-blue-400 font-medium rounded-lg border border-dashed border-gray-600 active:bg-gray-700"

// After:
className="min-h-12 w-full bg-white/5 text-blue-400 font-medium rounded-lg border border-dashed border-white/10 press-scale"
```

**Edit `src/components/items/ItemRow.tsx`:**

3. Quantity stepper buttons — apply press-scale and glass background:
```tsx
// Before (decrease button):
className="min-w-11 min-h-11 rounded-lg bg-gray-800 text-gray-100 disabled:opacity-30 active:bg-gray-700"

// After:
className="min-w-11 min-h-11 rounded-lg bg-white/5 text-gray-100 disabled:opacity-30 press-scale"
```

```tsx
// Before (increase button):
className="min-w-11 min-h-11 rounded-lg bg-gray-800 text-gray-100 active:bg-gray-700"

// After:
className="min-w-11 min-h-11 rounded-lg bg-white/5 text-gray-100 press-scale"
```

**Edit `src/components/summary/CopyButton.tsx`:**

4. Add press-scale to the button (BTTN-03):
```tsx
// Before:
className={`${copied ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'} min-w-10 min-h-10 flex items-center justify-center`}

// After:
className={`${copied ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'} min-w-10 min-h-10 flex items-center justify-center press-scale`}
```

**Verification:** Secondary buttons show bg-white/5 background with subtle border. All buttons and CopyButton produce visible press-scale shrink on tap. Quantity stepper disabled state still works.
</description>
<requirements>BTTN-02, BTTN-03</requirements>
</task>

<task id="7">
<title>Regression verification — tests and build</title>
<description>
Run the full test suite and build to verify no regressions from the className changes.

1. Run `npx vitest run` — all 144 tests must pass
2. Run `npm run build` — must succeed

**If tests fail:** The className changes are purely visual — they should not affect test behavior. If a test fails, it's likely checking for specific CSS classes. Check the test file, update the expected class string if needed.

**Verification:**
1. All 144 existing tests pass without modification
2. `npm run build` succeeds
</description>
<requirements>CARD-01, CARD-02, CARD-03, CARD-04, CARD-06, CARD-07, INPT-01, INPT-02, INPT-03, INPT-04, BTTN-01, BTTN-02, BTTN-03</requirements>
</task>

## Completion Criteria

All of the following must be true:
1. PersonRow, ItemRow, HistoryRow, AssignmentRow, and PaymentSection rows render as glass cards with rounded corners and no flat separator lines
2. All text inputs show a subtle blue glow ring when focused (focus:ring-2 focus:ring-blue-500/30)
3. Tip segment control, tax mode toggle, and split method toggle have glass containers with gradient-primary active segments
4. All primary action buttons display a blue-to-violet gradient; UPI button displays a green gradient
5. All interactive elements produce visible press-scale shrink on tap
6. All 144 existing tests pass without modification
7. `npm run build` succeeds
