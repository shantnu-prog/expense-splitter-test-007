# Plan 01: TabBar SVG Icons + Glass Styling

**Phase:** 14 — Layout + Glass System
**Goal:** Add recognizable SVG icons above tab labels and apply glass-surface styling to TabBar
**Requirements:** LYOT-01, LYOT-02

## Tasks

<task id="1">
<title>Add inline SVG icons to all 5 TabBar tabs</title>
<description>
Add a 20x20 stroke-based SVG icon above each tab label in TabBar.tsx. Icons use `currentColor` so they inherit the active/inactive text color.

**Edit `src/components/layout/TabBar.tsx`:**

1. Create a `TAB_ICONS` record mapping tab IDs to JSX SVG elements. Place it after the `TABS` array:

```tsx
const TAB_ICONS: Record<Tab, React.ReactNode> = {
  history: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <polyline points="10 6 10 10 13 12" />
    </svg>
  ),
  people: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="7" r="2.5" />
      <path d="M3 16c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
      <circle cx="14" cy="7.5" r="2" />
      <path d="M14.5 11.5c1.8.3 3.5 1.8 3.5 4" />
    </svg>
  ),
  items: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="2" width="12" height="16" rx="2" />
      <line x1="7" y1="6" x2="13" y2="6" />
      <line x1="7" y1="9" x2="13" y2="9" />
      <line x1="7" y1="12" x2="10" y2="12" />
    </svg>
  ),
  assignments: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="14" cy="14" r="2.5" />
      <path d="M8.5 6h4.5a2 2 0 0 1 2 2v1.5" />
      <path d="M11.5 14H7a2 2 0 0 1-2-2v-1.5" />
    </svg>
  ),
  split: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 3v14" />
      <path d="M3.5 7.5L10 10" />
      <path d="M16.5 7.5L10 10" />
    </svg>
  ),
};
```

2. Update the button content inside the `.map()` to show icon above label. Replace the button's children:

```tsx
// Before (inside the <button>):
{tab.label}
{showBadge && (...)}

// After:
<span className="flex flex-col items-center gap-0.5">
  {TAB_ICONS[tab.id]}
  <span className="text-[10px] leading-tight">{tab.label}</span>
</span>
{showBadge && (...)}
```

**Key details:**
- Icons are 20x20 with strokeWidth="1.5" — consistent with existing inline SVGs in CopyButton
- `aria-hidden="true"` on all icons — the button label provides the accessible name
- `text-[10px] leading-tight` for compact label below icon
- `gap-0.5` (2px) between icon and label
- Icons inherit color from the parent button's text color classes

**Icon descriptions:**
- History: clock (circle + clock hands)
- People: two overlapping person silhouettes
- Items: receipt/document with lines
- Assign: two nodes with connecting paths (represents linking items to people)
- Split: pie chart with divider lines

**Verification:** All 5 tabs show an icon above the label. Active tab icon is blue-400, inactive tabs are gray-400. Badge on Assign tab is still visible.
</description>
<requirements>LYOT-01</requirements>
</task>

<task id="2">
<title>Apply glass-surface styling to TabBar and increase height</title>
<description>
Replace the opaque TabBar background with glass-surface and increase minimum height to accommodate icons.

**Edit `src/components/layout/TabBar.tsx`:**

1. Change the nav element classes:

```tsx
// Before:
className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-700"

// After:
className="fixed bottom-0 inset-x-0 glass-surface"
```

2. Change the button classes to use min-h-14 and remove conflicting styles:

```tsx
// Before:
className={[
  'relative flex-1 min-h-12 py-3 text-sm font-medium',
  isActive
    ? 'text-blue-400 border-t-2 border-blue-400'
    : 'text-gray-400',
].join(' ')}

// After:
className={[
  'relative flex-1 min-h-14 py-2 text-sm font-medium',
  isActive
    ? 'text-blue-400'
    : 'text-gray-400',
].join(' ')}
```

**Key changes:**
- `bg-gray-900 border-t border-gray-700` → `glass-surface` — glass-surface includes its own border (border-white/[0.06])
- `min-h-12` → `min-h-14` (48px → 56px) to accommodate icon + label
- `py-3` → `py-2` — less vertical padding since icon + label fill the space
- Remove `border-t-2 border-blue-400` from active state — the blue text color on icon+label is sufficient indicator; top border conflicts with glass-surface border
- `text-sm` stays on button but the label text uses `text-[10px]` from Task 1 — `text-sm` now only affects fallback sizing

**Verification:**
1. TabBar has a frosted glass appearance — content scrolling behind it shows through with blur
2. Tab buttons are 56px tall with icon above label
3. Active tab has blue icon + label, inactive tabs are gray
4. `npm run build` succeeds
</description>
<requirements>LYOT-02</requirements>
</task>

## Completion Criteria

All of the following must be true:
1. All 5 tabs show a recognizable SVG icon above the text label
2. TabBar has glass-surface frosted appearance — scrolling content is visible through the blur
3. Tab height is min-h-14 (56px)
4. Active/inactive tab colors work correctly (blue-400 active, gray-400 inactive)
5. Badge on Assign tab is still visible when items are unassigned
6. Keyboard navigation (ArrowLeft/Right, Home/End) still works
7. All 144 existing tests pass
8. `npm run build` succeeds
