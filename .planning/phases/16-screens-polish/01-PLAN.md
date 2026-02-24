# Plan 01: Screens Redesign

**Phase:** 16 — Screens + Polish
**Goal:** Redesign OnboardingScreen and ErrorBoundary with gradient heroes and icons, and enhance all empty states with decorative icons
**Requirements:** SCRN-01, SCRN-02, SCRN-03

## Tasks

<task id="1">
<title>Redesign OnboardingScreen with gradient hero, app icon, and feature highlights</title>
<description>
**Rewrite `src/components/layout/OnboardingScreen.tsx`:**

Replace the entire component body with a gradient hero layout featuring an app icon, tagline, feature highlights, and gradient start button.

```tsx
export function OnboardingScreen({ onDismiss }: OnboardingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-950 to-blue-950/30 px-6 text-center">
      {/* App icon in gradient box */}
      <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="12" y2="14" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">SplitCheck</h1>
      <p className="text-gray-400 text-base mb-10">Split bills fairly among friends</p>

      {/* Feature highlights */}
      <div className="space-y-4 mb-10 text-left w-full max-w-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" aria-hidden="true">
              <circle cx="8" cy="7" r="2.5" />
              <path d="M3 16c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
              <circle cx="14" cy="7.5" r="2" />
              <path d="M14.5 11.5c1.8.3 3.5 1.8 3.5 4" />
            </svg>
          </div>
          <span className="text-gray-300 text-sm">Handle shared items and different portions</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400" aria-hidden="true">
              <circle cx="10" cy="10" r="7" />
              <path d="M10 3v14" />
              <path d="M3.5 7.5L10 10" />
              <path d="M16.5 7.5L10 10" />
            </svg>
          </div>
          <span className="text-gray-300 text-sm">Accurate tip, tax, and rounding</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400" aria-hidden="true">
              <rect x="2" y="5" width="16" height="10" rx="2" />
              <path d="M6 5V3a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <circle cx="10" cy="10" r="2" />
            </svg>
          </div>
          <span className="text-gray-300 text-sm">Request payments via UPI</span>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="w-full max-w-xs px-8 py-3 gradient-primary text-white font-semibold rounded-xl min-h-12 text-base press-scale shadow-lg"
      >
        Get Started
      </button>
    </div>
  );
}
```

**Key changes from current:**
- Background: `bg-gray-950` → `bg-gradient-to-br from-gray-950 via-gray-950 to-blue-950/30`
- New: 32x32 receipt icon in a `gradient-primary` rounded box
- New: 3 feature highlights with colored icon boxes (blue, violet, green)
- Button: plain blue → `gradient-primary press-scale shadow-lg`, text "Start" → "Get Started"
- Width constrained with `max-w-xs` for mobile readability

**Verification:** OnboardingScreen shows gradient background, app icon in gradient box, 3 feature highlights with colored icons, and a gradient Start button. Visually distinct from tab panels.
</description>
<requirements>SCRN-01</requirements>
</task>

<task id="2">
<title>Redesign ErrorBoundary with gradient hero and red error icon</title>
<description>
**Edit `src/components/ErrorBoundary.tsx`:**

Replace the fallback render block (the `if (this.state.hasError)` return) with a gradient hero design:

```tsx
// Replace the entire return block inside if (this.state.hasError):
return (
  <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-950 via-gray-950 to-red-950/20 text-center px-6">
    {/* Error icon in red box */}
    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
    <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
    <p className="text-gray-400 mb-8">The app encountered an unexpected error.</p>
    <button
      onClick={() => window.location.reload()}
      className="px-8 py-3 gradient-primary text-white rounded-xl font-medium min-h-12 press-scale shadow-lg"
    >
      Reload App
    </button>
  </div>
);
```

**Key changes:**
- Background: `bg-gray-950` → `bg-gradient-to-br from-gray-950 via-gray-950 to-red-950/20` (subtle red tint)
- New: 32x32 alert-triangle SVG in a `bg-red-500/10` rounded box
- Button: `bg-blue-600 active:bg-blue-700` → `gradient-primary press-scale shadow-lg`
- Spacing: `mb-6` → `mb-8` for more breathing room before button

**Verification:** ErrorBoundary fallback shows a gradient background with red tint, red warning icon in a box, and a gradient reload button. Not a plain white/unstyled fallback.
</description>
<requirements>SCRN-02</requirements>
</task>

<task id="3">
<title>Add decorative icons to all empty states</title>
<description>
Add a colored icon box above the text in every empty state across the app. The pattern is:
```tsx
<div className="w-12 h-12 rounded-xl bg-{color}-500/10 flex items-center justify-center mb-4">
  <svg ... className="text-{color}-400" aria-hidden="true">...</svg>
</div>
```

**Edit `src/components/people/PeoplePanel.tsx`:**

Add a people icon before the "No people added yet" text:
```tsx
// Before:
<div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
  <p className="text-gray-400 text-base">No people added yet</p>

// After:
<div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" aria-hidden="true">
      <circle cx="9" cy="7" r="3" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M17.5 14.5c2.3.4 4.5 2.2 4.5 5" />
    </svg>
  </div>
  <p className="text-gray-400 text-base">No people added yet</p>
```

**Edit `src/components/items/ItemsPanel.tsx`:**

Add a receipt icon before the "No items on the bill" text:
```tsx
// Before:
<div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
  <p className="text-gray-400 text-base">No items on the bill</p>

// After:
<div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="12" y2="14" />
    </svg>
  </div>
  <p className="text-gray-400 text-base">No items on the bill</p>
```

**Edit `src/components/history/HistoryPanel.tsx`:**

Add a clock icon before the "No saved splits yet" text:
```tsx
// Before:
<div className="flex flex-col items-center justify-center px-6 py-16 text-center">
  <p className="text-gray-400 text-base mb-2">No saved splits yet</p>

// After:
<div className="flex flex-col items-center justify-center px-6 py-16 text-center">
  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  </div>
  <p className="text-gray-400 text-base mb-2">No saved splits yet</p>
```

**Edit `src/components/assignments/AssignmentPanel.tsx`:**

Add icons to BOTH empty states:

1. "No items to assign" — amber list icon:
```tsx
// Before:
<div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
  <p className="text-gray-400 text-base">No items to assign</p>

// After:
<div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  </div>
  <p className="text-gray-400 text-base">No items to assign</p>
```

2. "No people added" — blue people icon:
```tsx
// Before:
<div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
  <p className="text-gray-400 text-base">No people added</p>

// After:
<div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" aria-hidden="true">
      <circle cx="9" cy="7" r="3" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M17.5 14.5c2.3.4 4.5 2.2 4.5 5" />
    </svg>
  </div>
  <p className="text-gray-400 text-base">No people added</p>
```

**Edit `src/components/summary/SummaryPanel.tsx`:**

Add an amber warning icon to the error state (items need assignment):
```tsx
// Before:
<div className="flex flex-col items-center justify-center px-4 py-12 text-center">
  <p className="text-amber-400 text-base font-medium">

// After:
<div className="flex flex-col items-center justify-center px-4 py-12 text-center">
  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  </div>
  <p className="text-amber-400 text-base font-medium">
```

**Verification:** All 6 empty states show a decorative icon in a colored box above the guidance text. Icons are visually distinct per context (people, items, history, assignments, warning).
</description>
<requirements>SCRN-03</requirements>
</task>

## Completion Criteria

All of the following must be true:
1. OnboardingScreen shows gradient hero, app icon in gradient box, 3 feature highlights, and gradient start button
2. ErrorBoundary shows gradient hero with red tint, red warning icon, and gradient reload button
3. All empty states (PeoplePanel, ItemsPanel, HistoryPanel, AssignmentPanel x2, SummaryPanel error) show a decorative icon in a colored box
4. All 144 existing tests pass
5. `npm run build` succeeds
