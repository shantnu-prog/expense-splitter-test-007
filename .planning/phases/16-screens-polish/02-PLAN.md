# Plan 02: Polish — Toasts, ReloadPrompt, SummaryPanel

**Phase:** 16 — Screens + Polish
**Goal:** Apply glass-card styling and slide-up animations to toasts and prompts, enlarge the SummaryPanel bill total, and apply glass styling to hint banner and rounding footer
**Requirements:** PLSH-01, PLSH-02, PLSH-03, PLSH-04, PLSH-05
**Depends on:** Plan 01 (both plans touch SummaryPanel)

## Tasks

<task id="1">
<title>Apply glass-card and slide-up animation to Toast</title>
<description>
**Edit `src/components/summary/Toast.tsx`:**

Change the toast div classes:
```tsx
// Before:
className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-100 text-sm font-medium px-4 py-2 rounded-full shadow-lg transition-opacity duration-300 pointer-events-none ${
  visible ? 'opacity-100' : 'opacity-0'
}`}

// After:
className={`fixed bottom-20 left-1/2 -translate-x-1/2 glass-card text-gray-100 text-sm font-medium px-4 py-2 rounded-xl shadow-lg transition-all duration-300 pointer-events-none ${
  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
}`}
```

**Key changes:**
- `bg-gray-800` → `glass-card` (frosted glass with blur + translucent bg)
- `rounded-full` → `rounded-xl` (pill → rounded rect, consistent with other glass elements)
- `transition-opacity` → `transition-all` (enables both opacity and transform transitions)
- Added `translate-y-0` (visible) / `translate-y-4` (hidden) for slide-up entrance
- Uses only `transform` + `opacity` — compositor-only per project convention

**Verification:** Toast slides up from below when appearing and fades down when disappearing. Has a frosted glass appearance.
</description>
<requirements>PLSH-01</requirements>
</task>

<task id="2">
<title>Apply glass-card, slide-up animation, and press-scale to UndoToast</title>
<description>
**Edit `src/components/shared/UndoToast.tsx`:**

1. Change the outer div classes:
```tsx
// Before:
className={`fixed bottom-20 inset-x-4 flex items-center justify-between
                  bg-gray-800 text-gray-100 text-sm font-medium px-4 py-3 rounded-xl
                  shadow-lg transition-opacity duration-200
                  ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}

// After:
className={`fixed bottom-20 inset-x-4 flex items-center justify-between
                  glass-card text-gray-100 text-sm font-medium px-4 py-3 rounded-xl
                  shadow-lg transition-all duration-300
                  ${visible ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'}`}
```

2. Add press-scale to the Undo button:
```tsx
// Before:
className="text-blue-400 font-semibold min-h-11 px-2 shrink-0"

// After:
className="text-blue-400 font-semibold min-h-11 px-2 shrink-0 press-scale"
```

**Key changes:**
- `bg-gray-800` → `glass-card`
- `transition-opacity duration-200` → `transition-all duration-300`
- Added `translate-y-0` / `translate-y-4` for slide-up entrance
- Undo button gets `press-scale` for tactile feedback

**Verification:** UndoToast slides up when appearing, has frosted glass background, and the Undo button produces a press-scale shrink on tap.
</description>
<requirements>PLSH-02</requirements>
</task>

<task id="3">
<title>Apply glass-card and gradient Update button to ReloadPrompt</title>
<description>
**Edit `src/components/ReloadPrompt.tsx`:**

1. Change the outer div:
```tsx
// Before:
className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between rounded-lg bg-gray-800 px-4 py-3 shadow-lg"

// After:
className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between rounded-xl glass-card px-4 py-3 shadow-lg"
```

2. Change the Update button:
```tsx
// Before:
className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"

// After:
className="rounded-lg gradient-primary px-3 py-1.5 text-sm font-medium text-white press-scale"
```

3. Change the Close button:
```tsx
// Before:
className="rounded border border-gray-600 px-3 py-1.5 text-sm text-gray-300"

// After:
className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 press-scale"
```

**Key changes:**
- `bg-gray-800 rounded-lg` → `glass-card rounded-xl`
- Update button: `bg-blue-600` → `gradient-primary press-scale`, `rounded` → `rounded-lg`
- Close button: `border-gray-600` → `border-white/10`, add `press-scale`, `rounded` → `rounded-lg`

**Verification:** ReloadPrompt has frosted glass background, gradient Update button, and both buttons have press-scale feedback.
</description>
<requirements>PLSH-03</requirements>
</task>

<task id="4">
<title>Enlarge SummaryPanel bill total and apply glass to hint banner</title>
<description>
**Edit `src/components/summary/SummaryPanel.tsx`:**

1. Change the bill total amount size:
```tsx
// Before:
<span className="text-white font-semibold tabular-nums text-xl">

// After:
<span className="text-white font-bold tabular-nums text-2xl">
```

2. Change the hint banner (tip/tax unconfigured):
```tsx
// Before:
<div className="mx-4 mt-4 px-4 py-3 bg-gray-800/50 rounded-lg text-center">

// After:
<div className="mx-4 mt-4 px-4 py-3 glass-card rounded-xl text-center">
```

**Key changes:**
- Bill total: `text-xl font-semibold` → `text-2xl font-bold` — makes it the most prominent number on screen
- Hint banner: `bg-gray-800/50 rounded-lg` → `glass-card rounded-xl` — consistent with glass design

**Verification:** The bill total is visually prominent at text-2xl font-bold. The hint banner has frosted glass styling.
</description>
<requirements>PLSH-04</requirements>
</task>

<task id="5">
<title>Apply glass-card to RoundingFooter</title>
<description>
**Edit `src/components/summary/RoundingFooter.tsx`:**

Change the outer div:
```tsx
// Before:
className="mt-2 px-4 py-3 bg-gray-900/50 rounded-xl"

// After:
className="mt-2 px-4 py-3 glass-card rounded-xl"
```

**Verification:** RoundingFooter has frosted glass background consistent with other glass elements.
</description>
<requirements>PLSH-05</requirements>
</task>

<task id="6">
<title>Regression verification — tests and build</title>
<description>
1. Run `npx vitest run` — all 144 tests must pass
2. Run `npm run build` — must succeed

**Verification:** All tests pass, build succeeds.
</description>
<requirements>PLSH-01, PLSH-02, PLSH-03, PLSH-04, PLSH-05</requirements>
</task>

## Completion Criteria

All of the following must be true:
1. Toast and UndoToast have glass-card styling with slide-up entrance animation
2. UndoToast's Undo button has press-scale feedback
3. ReloadPrompt has glass-card styling with gradient Update button
4. SummaryPanel bill total is text-2xl font-bold — the most prominent number on screen
5. SummaryPanel hint banner and RoundingFooter both use glass-card styling
6. All 144 existing tests pass
7. `npm run build` succeeds
