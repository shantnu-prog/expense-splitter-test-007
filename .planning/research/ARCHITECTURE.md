# Architecture Research

**Domain:** UI Redesign Integration — Glassmorphism, Gradients, Micro-interactions, SVG Icons on existing React 19 + Tailwind CSS 4
**Researched:** 2026-02-24
**Confidence:** HIGH (existing codebase inspected directly; Tailwind 4 docs verified via official documentation)

---

## Milestone Focus: Integrating the Visual Redesign

This document extends the v1.1 architecture research. The new milestone applies a visual redesign to the existing working codebase:

- Glassmorphism card effects (backdrop-filter, translucent surfaces)
- Gradient backgrounds and accent colors
- Micro-interactions (entrance animations, press feedback, expand/collapse transitions)
- SVG icon components (replacing text glyphs in TabBar and action buttons)

The codebase is: React 19 + TypeScript, Vite 7, Tailwind CSS 4.2, Zustand 5, 144 passing tests using ARIA queries.

---

## Context: What Already Exists (Codebase Inspection)

### Styling Architecture

- **`src/index.css`** — 6 lines: `@import "tailwindcss"` + one `@apply` block setting `bg-gray-950 text-gray-100 overscroll-none` on `html, body, #root`. No other CSS.
- **Tailwind 4 (Vite plugin)** — configured via `@tailwindcss/vite` in `vite.config.ts`. No `tailwind.config.js` — all config lives in CSS.
- **Zero CSS modules, zero CSS-in-JS** — all styling is Tailwind utility classes directly in JSX `className` strings.
- **Animations already present** — `PersonCard` uses `transition-[grid-template-rows] duration-200` for expand/collapse; `Toast` uses `transition-opacity duration-300`; `HistoryRow` uses `transition` for hover states. These are CSS transitions, not `@keyframes`.

### Component Color Palette (Inspected)

| Element | Current Classes |
|---------|----------------|
| Page background | `bg-gray-950` |
| Card / panel backgrounds | `bg-gray-900`, `bg-gray-800`, `bg-gray-900/50` |
| Borders | `border-gray-800`, `border-gray-700` |
| Primary text | `text-gray-100`, `text-white` |
| Secondary text | `text-gray-400`, `text-gray-500` |
| Active/accent | `text-blue-400`, `bg-blue-600`, `border-blue-400` |
| Warning | `text-amber-400`, `bg-amber-500` |
| Error | `text-red-400` |

### Existing SVG Usage

`PersonCard.tsx` contains the only inline SVG in the codebase — a 16x16 chevron that rotates on expand. `TabBar.tsx` uses **text labels only** (no icons). Action buttons use `×` text glyphs.

### Test Suite Characteristics

- 144 tests across 8 test files
- All test queries: `getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`, `getAllByText`, `queryByText`, `queryByRole`
- **Zero className assertions** — no `toHaveClass`, no `toHaveStyle`
- Tests verify behavior (text presence, ARIA attributes, interaction outcomes), not visual state
- Tests are immune to CSS class changes as long as ARIA structure and text content are preserved

---

## System Overview (Redesign Layer)

The redesign adds a styling layer on top of the existing architecture. No store changes, no engine changes, no data flow changes.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Design Token Layer (NEW)                      │
│   src/index.css — @theme block                                   │
│   --color-surface-*, --color-accent-*, --animate-*, --radius-*   │
│   CSS custom properties + Tailwind utility generation            │
├─────────────────────────────────────────────────────────────────┤
│                 Utility Class Layer (NEW/MODIFIED)               │
│   src/index.css — @utility and @layer components blocks          │
│   .glass-card, .gradient-primary, .glass-tab-bar                 │
│   @keyframes inside @theme for micro-interaction animations       │
├─────────────────────────────────────────────────────────────────┤
│              Icon Component Layer (NEW)                          │
│   src/components/icons/ — typed SVG components                   │
│   HistoryIcon, PeopleIcon, ItemsIcon, AssignIcon, SplitIcon      │
│   CloseIcon, ChevronIcon (promote from inline in PersonCard)     │
├─────────────────────────────────────────────────────────────────┤
│              Existing React Component Layer (MODIFIED)           │
│   className strings updated; ARIA structure UNCHANGED            │
│   TabBar, SubtotalBar, PersonCard, PersonRow, ItemRow,           │
│   OnboardingScreen, Toast, UndoToast updated                     │
├─────────────────────────────────────────────────────────────────┤
│              Existing State + Engine Layer (UNCHANGED)           │
│   useBillStore, useHistoryStore, computeSplit, all hooks         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architectural Decisions

### Decision 1: Tailwind 4 Design Tokens in `@theme`, Not `:root`

**Ruling: Use `@theme` for all new design tokens.**

Tailwind 4 has an explicit distinction:
- `@theme` — generates both a CSS custom property AND a utility class. Use for anything you want to reference in JSX as `bg-surface-glass` or `text-accent-violet`.
- `:root` — generates a CSS custom property only, no utility class. Use for values consumed only in custom CSS (e.g., an intermediate calculation variable).

For a redesign that adds glassmorphism and gradient tokens, `@theme` is correct: tokens defined there are accessible both as `var(--color-surface-glass)` in CSS and as `bg-surface-glass` in JSX.

**Pattern:**

```css
/* src/index.css — add after @import "tailwindcss" */

@theme {
  /* Surface colors — used in glass effects */
  --color-surface-glass: color-mix(in oklch, var(--color-gray-900) 60%, transparent);
  --color-surface-card: oklch(0.18 0.005 264);
  --color-surface-overlay: oklch(0.13 0.005 264 / 0.85);

  /* Accent gradient stops — used in gradient-primary utility */
  --color-accent-from: oklch(0.65 0.22 264);   /* violet */
  --color-accent-to: oklch(0.60 0.22 300);     /* purple */

  /* Radii */
  --radius-card: 1rem;
  --radius-pill: 9999px;

  /* Animation declarations — generate animate-* utility classes */
  --animate-fade-up: fade-up 0.3s ease-out both;
  --animate-press: press 0.12s ease-out both;
  --animate-shimmer: shimmer 1.5s ease-in-out infinite;

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes press {
    0%   { transform: scale(1); }
    50%  { transform: scale(0.96); }
    100% { transform: scale(1); }
  }

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
}
```

**Why keyframes inside `@theme`:** Tailwind 4 only emits `@keyframes` in the built CSS when they are referenced by a used `--animate-*` variable. Placing them inside `@theme` makes them tree-shakable. If no component uses `animate-fade-up`, the `fade-up` keyframes do not appear in the production bundle. [Source: Tailwind CSS 4 animation docs — HIGH confidence]

### Decision 2: Reusable Classes via `@utility` (Not `@layer components`)

**Ruling: Use `@utility` for `.glass-card`, `.gradient-primary`, and `.glass-tab-bar`.**

Tailwind 4 introduces `@utility` as the replacement for the old `@layer utilities` + `@apply` pattern. The key difference vs `@layer components`:

| Feature | `@utility` | `@layer components` |
|---------|-----------|---------------------|
| Overridable by utility classes in HTML | Yes | Needs `!important` modifier |
| Works with Tailwind variants (`hover:glass-card`) | Yes | No |
| Works with `@apply` | Yes | Yes |
| Specificity | Same as utilities | Higher than utilities |

For a design system where you want `glass-card` to be overridable per-instance (e.g., `glass-card rounded-none` for a specific component), `@utility` is correct.

**Pattern:**

```css
/* src/index.css */

@utility glass-card {
  background: color-mix(in oklch, var(--color-gray-900) 60%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid oklch(1 0 0 / 0.08);
  border-radius: var(--radius-card);
}

@utility gradient-primary {
  background: linear-gradient(
    135deg,
    var(--color-accent-from),
    var(--color-accent-to)
  );
}

@utility glass-tab-bar {
  background: color-mix(in oklch, var(--color-gray-950) 75%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid oklch(1 0 0 / 0.06);
}
```

**Usage in JSX:**

```tsx
// PersonCard — glass effect replacing bg-gray-900
<div className="glass-card mb-3">

// TabBar — replacing bg-gray-900 border-t border-gray-700
<nav className="glass-tab-bar fixed bottom-0 inset-x-0">

// CTA button — replacing bg-blue-600
<button className="gradient-primary text-white font-medium rounded-xl min-h-12">
```

### Decision 3: SVG Icons as Separate Icon Components (Not Inline in Components)

**Ruling: Create `src/components/icons/` with typed SVG components.**

The existing TabBar uses text labels only. Adding icons while keeping labels (icon above label) requires SVG. The options:

| Approach | Bundle | DX | Accessibility | Verdict |
|----------|--------|-----|--------------|---------|
| Inline SVG in each component | Duplicated markup | Hard to maintain | Manual `aria-hidden` everywhere | Reject |
| SVG icon components in `src/components/icons/` | Tree-shaken | Type-safe, composable | Centralized aria control | **Use** |
| External library (lucide-react, heroicons) | +40KB (tree-shaken to ~1KB/icon) | Excellent | Good | Valid alternative |
| SVGR file import | Requires Vite plugin setup | Medium | Medium | Adds build complexity |

**Recommended approach:** Typed SVG components in `src/components/icons/`. Each icon is a 10-15 line component accepting standard SVG props plus `size` and `className`. No library dependency. Fully tree-shakable.

**Pattern:**

```tsx
// src/components/icons/ChevronIcon.tsx
interface IconProps {
  size?: number;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

export function ChevronIcon({ size = 16, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="4 6 8 10 12 6" />
    </svg>
  );
}
```

```tsx
// src/components/icons/HistoryIcon.tsx — tab bar icon
export function HistoryIcon({ size = 22, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"
         className={className} {...props}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}
```

**TabBar integration** — icons sit above labels, with `aria-hidden="true"` on the SVG (the button label provides the accessible name):

```tsx
// TabBar.tsx — icon + label layout per tab button
<button role="tab" aria-selected={isActive} ...>
  <span className="flex flex-col items-center gap-0.5 py-2">
    <TabIcon aria-hidden="true" size={22}
             className={isActive ? 'text-blue-400' : 'text-gray-500'} />
    <span className="text-[10px] font-medium">{tab.label}</span>
  </span>
</button>
```

**`ChevronIcon` promotion:** The chevron currently inlined in `PersonCard` should be promoted to `src/components/icons/ChevronIcon.tsx`. The existing `PersonCard` code already has all the correct props — it's a 1:1 extraction.

### Decision 4: Animation Approach — `@theme` for Named Animations, CSS Transitions for State Changes

**Ruling: Split animation approach by type.**

| Animation type | Approach | Examples |
|---------------|----------|---------|
| State transitions (expand/collapse, fade in/out) | Tailwind `transition-*` utility classes (already in use) | `PersonCard` grid-rows expand, `Toast` opacity |
| Named entrance animations for new elements | `--animate-*` in `@theme` + `animate-*` class on component | PersonCard entrance, panel fade-up |
| Press/tap micro-feedback | `--animate-press` + `animate-press` or `active:scale-95` | CTA buttons, tab bar taps |
| Continuous (shimmer, loading) | `--animate-shimmer` in `@theme` | Skeleton states if added |

**Do NOT use arbitrary `animate-[...]` for shared animations** — those bypass tree-shaking and cannot be reused. Define any animation used in more than one place in `@theme`.

**`active:scale-95` shortcut for press feedback:**
Tailwind 4 supports `active:` variant natively. For simple press effects, `active:scale-95 transition-transform duration-100` is zero-config and avoids a keyframe entirely. Use the `press` keyframe only when you need a bounce-back effect (scale down then back up).

### Decision 5: Build Order — Tokens First, Atoms Second, Molecules Third

**Ruling: This specific sequence minimizes rework.**

Detailed in the Build Order section below.

---

## Recommended Project Structure (Redesign Additions)

```
src/
├── index.css                          # MODIFIED — @theme tokens + @utility classes
├── components/
│   ├── icons/                         # NEW — typed SVG icon components
│   │   ├── index.ts                   # Re-export barrel
│   │   ├── ChevronIcon.tsx
│   │   ├── CloseIcon.tsx              # Replace × glyphs
│   │   ├── HistoryIcon.tsx
│   │   ├── PeopleIcon.tsx
│   │   ├── ItemsIcon.tsx
│   │   ├── AssignIcon.tsx
│   │   └── SplitIcon.tsx
│   ├── layout/
│   │   ├── AppShell.tsx               # MINOR — possibly gradient bg
│   │   ├── TabBar.tsx                 # MODIFIED — icon + label layout, glass-tab-bar
│   │   ├── SubtotalBar.tsx            # MODIFIED — glass effect, gradient accent
│   │   └── OnboardingScreen.tsx       # MODIFIED — gradient bg, larger CTA
│   ├── people/
│   │   ├── PersonRow.tsx              # MODIFIED — glass-card, CloseIcon
│   │   └── PeoplePanel.tsx            # MODIFIED — input focus ring style
│   ├── items/
│   │   ├── ItemRow.tsx                # MODIFIED — glass-card, CloseIcon
│   │   └── ItemsPanel.tsx             # MINOR — add button styling
│   ├── assignments/
│   │   └── AssignmentRow.tsx          # MODIFIED — glass-card expand, ChevronIcon
│   ├── history/
│   │   └── HistoryRow.tsx             # MODIFIED — glass-card hover state
│   ├── summary/
│   │   ├── PersonCard.tsx             # MODIFIED — glass-card, ChevronIcon component
│   │   ├── SummaryPanel.tsx           # MODIFIED — gradient CTA button
│   │   ├── Toast.tsx                  # MODIFIED — glass effect
│   │   └── PaymentSection.tsx         # MINOR — gradient button
│   └── shared/
│       └── UndoToast.tsx              # MODIFIED — glass effect
```

---

## Component-by-Component Integration Map

### Components: Purely Visual Changes (Safe to Restyle)

All listed className changes preserve the existing ARIA structure. Tests will remain green.

#### `TabBar.tsx` — Highest Impact

**Current:** Text-only tabs, `bg-gray-900 border-t border-gray-700`, `text-blue-400 border-t-2 border-blue-400` active state.

**Redesigned:**
- Container: replace `bg-gray-900 border-t border-gray-700` with `glass-tab-bar`
- Each tab button: add icon above label using `flex flex-col items-center gap-0.5`
- Active state: replace `border-t-2` indicator with `text-blue-400` + icon fill/color change
- Add `animate-press` or `active:scale-95` on tab press

**ARIA impact:** None. `role="tab"`, `aria-selected`, `tabIndex` are prop-driven, not CSS-driven. Tests use `getByRole('tab')` — unchanged.

#### `SubtotalBar.tsx` — Medium Impact

**Current:** `bg-gray-900 border-b border-gray-700 px-4 py-2`.

**Redesigned:**
- Apply `glass-card` or a custom `glass-header` utility
- Subtotal value: `gradient-primary bg-clip-text text-transparent` for a gradient text accent

**ARIA impact:** None. Tests use `getByText('Subtotal')` — text content unchanged.

#### `PersonCard.tsx` — Medium Impact

**Current:** `bg-gray-900 border border-gray-800 rounded-xl mb-3`.

**Redesigned:**
- Replace with `glass-card mb-3`
- Add `animate-fade-up` on mount for entrance animation
- Promote inline chevron SVG to `<ChevronIcon>` component
- The CSS grid-rows transition pattern (already present) is preserved — it still works with `glass-card`

**ARIA impact:** None. `role="button"`, `aria-expanded`, `aria-label` are unchanged.

#### `Toast.tsx` and `UndoToast.tsx` — Low Impact

**Current:** `bg-gray-800 text-gray-100`.

**Redesigned:**
- Apply `glass-card` (or a `glass-toast` variant with less border-radius)
- The `opacity-100 / opacity-0` transition pattern is preserved

**ARIA impact:** None. `role="status"`, `aria-live` are unchanged.

#### `OnboardingScreen.tsx` — Medium Impact

**Current:** `bg-gray-950` full-screen, simple layout.

**Redesigned:**
- Gradient background behind glass card center block
- CTA button: `gradient-primary` replacing `bg-blue-600`
- Add `animate-fade-up` on the card entrance

**ARIA impact:** None.

#### `PersonRow.tsx`, `ItemRow.tsx`, `HistoryRow.tsx` — Low-Medium Impact

**Current:** `border-b border-gray-800` separator rows.

**Redesigned:**
- Replace text `×` with `<CloseIcon>` (same `aria-label` on the button — unchanged)
- Add subtle hover background or glass card separation
- `ItemRow` price input: refine border and focus ring styles

**ARIA impact:** None. `aria-label="Remove ${name}"` and `aria-label="Remove item"` stay on the button, not the icon. Tests use `getByRole('button', { name: 'Remove Alice' })` — unchanged.

#### `AssignmentRow.tsx` — Low Impact

**Current:** Text glyphs `▲` / `▼` for expand indicator.

**Redesigned:**
- Replace with `<ChevronIcon>` with `rotate-180` on expanded
- Checkbox styling remains — tests use `type="checkbox"` queries

**ARIA impact:** None.

---

## Test Safety: Why 144 Tests Stay Green

The tests use exclusively semantic queries:

| Query | What it finds | What must NOT change |
|-------|--------------|---------------------|
| `getByRole('button', { name: ... })` | Buttons by accessible name | `aria-label`, button text content |
| `getByRole('tab')` | Tab elements | `role="tab"` attribute |
| `getByLabelText(...)` | Inputs by label | `aria-label`, `placeholder`, `<label>` for |
| `getByPlaceholderText(...)` | Inputs by placeholder | `placeholder` attribute |
| `getByText(...)` | Elements by text content | Visible text strings |
| `getAllByText(...)` | Multiple text matches | Visible text strings |

**What is safe to change:** Any `className` string, any visual-only element added (SVG icons with `aria-hidden="true"`), background colors, borders, shadows, animations.

**What must NOT change during redesign:**
- `aria-label` attribute values (e.g., `Remove ${name}`, `Remove item`, `Decrease quantity`, `${unassignedCount} unassigned`)
- `role` attributes (`tab`, `tablist`, `button`, `status`)
- `aria-selected`, `aria-expanded` attribute behavior
- `placeholder` text on inputs
- Visible text content of buttons and labels
- `aria-live` and `aria-atomic` on toasts

**The `×` → `<CloseIcon>` replacement:** The `×` character currently inside action buttons is not the accessible name — the `aria-label` on the button is. Replacing `×` with `<CloseIcon aria-hidden="true" />` is safe; the button's accessible name does not change.

**The `▲/▼` → `<ChevronIcon>` replacement in `AssignmentRow`:** Same logic — the arrow characters are decorative; the `aria-expanded` attribute on the parent button carries the semantic meaning. Tests use `getByRole('button', { name: /Item name/i })` not the arrows.

---

## Glassmorphism Performance Constraints

Research confirms performance guidelines for mobile PWA (MEDIUM confidence — WebSearch verified across multiple sources):

| Constraint | Rule |
|-----------|------|
| Number of glass elements per viewport | Maximum 3-4 simultaneous elements with `backdrop-filter` |
| Blur radius on mobile | 8-12px sweet spot; 16px+ is expensive on low-end Android |
| Never animate `backdrop-filter` | GPU layer creation/destruction on every frame causes jank |
| Always provide `-webkit-backdrop-filter` | Required for Safari/iOS (still needs vendor prefix as of 2026) |
| Fallback background | Higher-opacity solid color for `@supports not (backdrop-filter: blur())` |

**In this app's layout:** The glass elements per viewport are: TabBar (1) + SubtotalBar (1) + up to 3 PersonCards in summary view = 5 maximum. This is on the edge. Recommendation: Make PersonCards use a lighter effect (lower blur, 8px) while TabBar and SubtotalBar use the full 12-16px blur.

**The existing panel `hidden` pattern (all panels kept mounted):** CSS `hidden` removes from visibility but the elements remain in the DOM. Glass elements in hidden panels still exist in the DOM but do not trigger `backdrop-filter` rendering since they are not painted. This is safe.

**Do NOT animate the `backdrop-filter` property** — this means the glass effect should appear/disappear via opacity transitions only, not by transitioning blur radius.

---

## Architectural Patterns

### Pattern 1: Design Token First, Component Second

**What:** Define all new colors, radii, and animations in `@theme` before touching any component. This ensures components can reference token names (`bg-surface-glass`) rather than raw values (`oklch(0.18 0.005 264 / 0.6)`), making future token changes single-point updates.

**When to use:** Always. On a redesign milestone, the token layer is the foundational step.

**Trade-offs:** Slightly more upfront planning. Prevents the anti-pattern of hardcoding values in multiple places.

### Pattern 2: Utility Composition Over Inline Styles

**What:** Build glass effects through `@utility` classes composed from token values, not through `style={{ backdropFilter: 'blur(12px)' }}` inline styles.

**When to use:** Any effect applied to more than one component.

**Why:** Inline styles break Tailwind's variant system (`hover:`, `dark:`, responsive prefixes). `@utility` classes participate in the cascade normally and are overridable by utility classes applied alongside them.

```tsx
// Bad — inline style
<div style={{ backdropFilter: 'blur(12px)', background: 'rgba(17,24,39,0.6)' }}>

// Good — utility class
<div className="glass-card">
```

### Pattern 3: Preserve Semantic ARIA Structure During Visual Lift

**What:** When adding icon components to interactive elements, always add `aria-hidden="true"` to the SVG and keep the accessible name on the parent element (button `aria-label` or visible text content).

**When to use:** Every icon added to a button or interactive element.

**Example:**

```tsx
// Correct — icon is decorative, button aria-label carries the name
<button aria-label={`Remove ${name}`}>
  <CloseIcon aria-hidden="true" size={18} />
</button>

// Wrong — removing aria-label would break getByRole('button', { name: 'Remove Alice' })
<button>
  <CloseIcon aria-label={`Remove ${name}`} />
</button>
```

### Pattern 4: Entrance Animations via CSS Class Addition, Not useState Timing

**What:** Use `animate-fade-up` applied directly in JSX rather than managing `mounted` state + `useEffect` + `opacity` transitions.

**When to use:** Simple entrance animations on newly rendered elements.

**How it works:** When a component first renders, the CSS animation runs once automatically. No JavaScript timing needed.

```tsx
// Good — class applied on first render, animation runs once
<div className="glass-card animate-fade-up mb-3">

// Unnecessary — useState + useEffect just to trigger an animation
const [visible, setVisible] = useState(false);
useEffect(() => setVisible(true), []);
<div className={`glass-card ${visible ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
```

**Caveat:** The `hidden` panel pattern in `AppShell` means panels are mounted immediately on first render but only displayed when their tab is active. If `animate-fade-up` is applied to panel root elements, the animation plays once when the component mounts (which may be before the user switches to that tab, making the animation invisible). Apply `animate-fade-up` to **individual cards and list items within panels**, not to panel containers.

---

## Data Flow (Redesign has no data flow changes)

The entire redesign is in the presentation layer. No store changes, no engine changes, no hook changes. The existing data flow from the v1.1 architecture document is unchanged.

---

## Build Order

This order minimizes rework. Each step builds on stable foundations from the previous step.

**Step 1: Design Tokens in `index.css`**
Add the `@theme` block with color tokens, radius tokens, and animation declarations. Add `@utility` classes (`glass-card`, `gradient-primary`, `glass-tab-bar`). **No component changes.** Verify tokens are visible in browser DevTools as CSS custom properties on `:root`.

*Why first:* All components reference token names. If tokens are defined last, component work must be redone when names change.

**Step 2: Icon Components in `src/components/icons/`**
Create all 7 icon components + the barrel `index.ts`. Write a simple visual smoke test (render `HistoryIcon`, verify it renders an SVG element). This is pure TypeScript — no CSS knowledge needed.

*Why second:* Icon components are pure TypeScript with zero CSS dependency. They can be created in parallel with Step 1. They are prerequisites for TabBar and row component changes.

**Step 3: `TabBar.tsx` — Icon + Glass Integration**
This is the highest-visibility change and the most common UI element. Integrate `glass-tab-bar`, add icon components above labels, apply press feedback. Verify visually across all tabs. This step reveals any issues with the `@utility` definitions from Step 1 while the scope is limited to one component.

*Why third:* TabBar is displayed on every screen. Issues are immediately visible. Fixing token definitions here avoids propagating mistakes to all other components.

**Step 4: `PersonCard.tsx` — Glass Card Prototype**
Apply `glass-card`, promote inline chevron to `<ChevronIcon>`, add `animate-fade-up`. This component is the template for all other card-style components. Get it right here before applying the pattern elsewhere.

*Why fourth:* `PersonCard` is the most complex card component (expandable, has animation, has interactive nested elements). Using it as the prototype surfaces edge cases (e.g., glass effect conflicts with grid-rows transition) before applying to simpler components.

**Step 5: All Row Components — `PersonRow`, `ItemRow`, `HistoryRow`, `AssignmentRow`**
Apply `CloseIcon`/`ChevronIcon` replacements and glass/border refinements across row components. These are simpler than `PersonCard` and follow the pattern established in Step 4.

*Why fifth:* Row components are high in number but low in complexity. Batch them after the card pattern is proven.

**Step 6: `SubtotalBar.tsx`, `Toast.tsx`, `UndoToast.tsx`**
Apply glass effects to the sticky header and floating toasts. These are structurally simple but visually prominent.

*Why sixth:* These components are structurally simple. Doing them after the more complex components means the `@utility` definitions are stable.

**Step 7: `OnboardingScreen.tsx` + `SummaryPanel.tsx` CTA Buttons**
Apply gradient backgrounds and `gradient-primary` to primary action buttons throughout. `OnboardingScreen` gets the most dramatic visual treatment.

*Why seventh:* CTA button styling is additive — no structural changes needed. Doing it last avoids cascading rework.

**Step 8: Cross-cutting Review**
Check viewport with all panels. Verify max 3-4 simultaneous glass elements. Add `-webkit-backdrop-filter` everywhere `backdrop-filter` is used (grep for `backdrop-filter` in CSS output). Run `npm run test` — all 144 should pass.

---

## Anti-Patterns

### Anti-Pattern 1: Inline Styles for Glass Effects

**What people do:** `style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(17,24,39,0.6)' }}` inline in JSX.

**Why it's wrong:** Inline styles cannot be overridden by Tailwind utilities. They do not participate in `hover:`, `active:`, or responsive variants. They are not globally updatable. They are invisible to CSS DevTools in a useful way.

**Do this instead:** Define a `@utility glass-card { ... }` in `index.css`. Apply as `className="glass-card"`. Override per-instance with additional utilities.

### Anti-Pattern 2: Animating `backdrop-filter`

**What people do:** `transition-[backdrop-filter] duration-300` or `from:backdrop-blur-none to:backdrop-blur-lg` to make the glass effect fade in.

**Why it's wrong:** Animating `backdrop-filter` forces the browser to create and destroy GPU compositor layers on every frame. This causes dropped frames on mobile, especially Android. The blur compositing is expensive even statically.

**Do this instead:** Fade in via opacity only. Apply the full `backdrop-filter` value immediately, fade in using `opacity-0` → `opacity-100` transition.

### Anti-Pattern 3: Removing `aria-label` from Buttons When Adding Icons

**What people do:** Replace `<button aria-label="Remove Alice">×</button>` with `<button><CloseIcon aria-label="Remove Alice" /></button>`.

**Why it's wrong:** Moving `aria-label` to the SVG makes the button's accessible name empty in some assistive technologies. More critically, `getByRole('button', { name: 'Remove Alice' })` in the test suite will fail to find the button if the `aria-label` is not on the button element.

**Do this instead:** Keep `aria-label` on the `<button>`. Add `aria-hidden="true"` on the icon SVG.

### Anti-Pattern 4: Applying `animate-fade-up` to Panel Containers

**What people do:** `<div className={activeTab === 'people' ? 'animate-fade-up' : 'hidden'}>` to animate the whole panel when its tab is activated.

**Why it's wrong:** The AppShell keeps all panels mounted via CSS `hidden` from first render. `animate-fade-up` on a panel container fires once when the component mounts (immediately on app load), which is before the user ever navigates to that tab. The animation is invisible and then never plays again.

**Do this instead:** Apply `animate-fade-up` to individual cards and list items that appear within panels, not to the panel containers themselves.

### Anti-Pattern 5: `@theme` for Non-Token Variables

**What people do:** Put intermediate calculation variables or one-off values in `@theme`.

**Why it's wrong:** Every `@theme` variable generates a CSS custom property on `:root` AND Tailwind tries to generate utility classes from it. Intermediate variables pollute the global token namespace and may generate unexpected utility class names.

**Do this instead:** For variables that should NOT have utility classes (e.g., a `--glass-blur-mobile: 8px` that you only use inside a `@utility` definition), define them in `:root { }` instead of `@theme { }`.

---

## Integration Points

### New Artifacts

| Artifact | Type | Purpose |
|----------|------|---------|
| `src/components/icons/ChevronIcon.tsx` | New component | Replace inline SVG in PersonCard, arrow in AssignmentRow |
| `src/components/icons/CloseIcon.tsx` | New component | Replace `×` glyph in PersonRow, ItemRow, UndoToast |
| `src/components/icons/HistoryIcon.tsx` | New component | TabBar history tab icon |
| `src/components/icons/PeopleIcon.tsx` | New component | TabBar people tab icon |
| `src/components/icons/ItemsIcon.tsx` | New component | TabBar items tab icon |
| `src/components/icons/AssignIcon.tsx` | New component | TabBar assign tab icon |
| `src/components/icons/SplitIcon.tsx` | New component | TabBar split tab icon |
| `src/components/icons/index.ts` | Barrel export | Single import point for all icons |

### Modified Files and Their Change Types

| File | Change Type | What Changes |
|------|------------|-------------|
| `src/index.css` | EXTENDED | `@theme` tokens block + `@utility` definitions |
| `src/components/layout/TabBar.tsx` | VISUAL RESTRUCTURE | Icon + label layout, `glass-tab-bar`, press feedback |
| `src/components/layout/SubtotalBar.tsx` | VISUAL | `glass-card`/`glass-header` utility, gradient text |
| `src/components/layout/OnboardingScreen.tsx` | VISUAL | Gradient bg, `gradient-primary` CTA |
| `src/components/summary/PersonCard.tsx` | VISUAL + REFACTOR | `glass-card`, ChevronIcon extraction, `animate-fade-up` |
| `src/components/summary/SummaryPanel.tsx` | VISUAL | `gradient-primary` on copy button |
| `src/components/summary/Toast.tsx` | VISUAL | Glass effect |
| `src/components/summary/PaymentSection.tsx` | VISUAL | `gradient-primary` on UPI buttons |
| `src/components/people/PersonRow.tsx` | VISUAL | CloseIcon, border refinement |
| `src/components/items/ItemRow.tsx` | VISUAL | CloseIcon, input style refinement |
| `src/components/assignments/AssignmentRow.tsx` | VISUAL | ChevronIcon, `glass-card` on expand |
| `src/components/history/HistoryRow.tsx` | VISUAL | Glass hover state |
| `src/components/shared/UndoToast.tsx` | VISUAL | Glass effect, CloseIcon |

### Explicitly Unchanged

| File | Why Unchanged |
|------|--------------|
| All `*.test.tsx` files | Tests are ARIA/text-based; redesign does not touch those surfaces |
| `src/engine/engine.ts` | Pure computation function |
| `src/store/billStore.ts` | State layer — no visual concerns |
| `src/store/historyStore.ts` | State layer — no visual concerns |
| `src/hooks/*.ts` | All hooks — no visual concerns |
| `src/utils/*.ts` | All utilities — no visual concerns |
| `src/components/summary/CopyButton.tsx` | Reviewed — uses `aria-label`; visual change only if needed |
| `src/components/summary/RoundingFooter.tsx` | Low priority; text only |

---

## Sources

- [Tailwind CSS 4.0 Announcement — Adding Custom Styles](https://tailwindcss.com/docs/adding-custom-styles) — HIGH confidence (official docs)
- [Tailwind CSS 4.0 — Theme Variables](https://tailwindcss.com/docs/theme) — HIGH confidence (official docs)
- [Tailwind CSS 4.0 — Animation](https://tailwindcss.com/docs/animation) — HIGH confidence (official docs)
- [Tailwind CSS v4 @utility vs @layer components discussion](https://github.com/tailwindlabs/tailwindcss/discussions/16434) — MEDIUM confidence (official repo discussion)
- [Tailwind CSS v4 Jest/RTL styling detection issue](https://github.com/tailwindlabs/tailwindcss/discussions/16456) — HIGH confidence (explains why ARIA-based tests are immune to CSS changes)
- [Glassmorphism performance on mobile — multiple sources](https://playground.halfaccessible.com/blog/glassmorphism-design-trend-implementation-guide) — MEDIUM confidence (WebSearch verified, consistent across sources)
- Existing codebase: `src/index.css`, `src/components/layout/TabBar.tsx`, `src/components/summary/PersonCard.tsx`, `src/components/shared/UndoToast.tsx`, all test files — HIGH confidence (direct inspection)

---

*Architecture research for: UI redesign integration on existing React 19 + Tailwind CSS 4 expense splitter*
*Researched: 2026-02-24*
