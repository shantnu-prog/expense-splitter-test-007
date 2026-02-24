# Plan 01: Design Tokens & Utility Classes

**Phase:** 13 — Design System Foundation
**Goal:** Install Inter font, define all design token utilities in index.css, add reduced-motion reset
**Requirements:** DSYS-01, DSYS-02, DSYS-03, DSYS-04, DSYS-05, DSYS-06, DSYS-07, DSYS-08

## Tasks

<task id="1">
<title>Install @fontsource-variable/inter and add font import</title>
<description>
Install the Inter variable font package for offline PWA support, then add the import to main.tsx BEFORE the index.css import so @font-face declarations are available when CSS processes.

**Steps:**
1. Run: `npm install @fontsource-variable/inter`
2. Edit `src/main.tsx`: Add `import '@fontsource-variable/inter'` as the FIRST import after React imports, BEFORE `import './index.css'`

**Current main.tsx:**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
```

**Target main.tsx:**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'
```

**Verification:** `npm run build` succeeds and the output includes a .woff2 font file in the assets.
</description>
<requirements>DSYS-01</requirements>
</task>

<task id="2">
<title>Add @theme block with Inter font and fade-in animation</title>
<description>
Add the @theme block to index.css after `@import "tailwindcss"` and before the base styles. This configures Inter as the default sans font and defines the fade-in animation keyframes.

**Add to `src/index.css` after `@import "tailwindcss"`:**
```css
@theme {
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";

  --animate-fade-in: fade-in 200ms ease-out;

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

**Key details:**
- Font family name is exactly `"Inter Variable"` (with space, capitalized)
- `--font-sans` overrides Tailwind's default sans font stack globally
- `--animate-fade-in` generates the `animate-fade-in` utility class automatically
- Keyframes use only `opacity` and `transform` (compositor-only properties)

**Verification:** Text renders in Inter font in the browser. `animate-fade-in` class applies the animation when added to an element in DevTools.
</description>
<requirements>DSYS-01, DSYS-06</requirements>
</task>

<task id="3">
<title>Add glass-card, glass-surface, gradient-primary, and press-scale utilities</title>
<description>
Add custom utility definitions using the `@utility` directive in index.css. Place these after the `@theme` block and before the base styles.

**Add to `src/index.css`:**
```css
@utility glass-card {
  backdrop-filter: blur(12px);
  background-color: rgb(255 255 255 / 0.05);
  border: 1px solid rgb(255 255 255 / 0.1);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

@utility glass-surface {
  backdrop-filter: blur(8px);
  background-color: rgb(255 255 255 / 0.03);
  border: 1px solid rgb(255 255 255 / 0.06);
}

@utility gradient-primary {
  background-image: linear-gradient(to right, var(--color-blue-600), var(--color-violet-600));
}

@utility press-scale {
  transition: transform 100ms ease-out;
  &:active {
    transform: scale(0.97);
  }
}
```

**Important notes:**
- glass-card uses 12px blur (within blur budget), glass-surface uses 8px (lighter)
- gradient-primary uses Tailwind v4 CSS variables for colors
- press-scale uses CSS nesting for the :active pseudo-selector within @utility
- If `&:active` nesting doesn't work in @utility, fall back to a plain class in base styles:
  ```css
  .press-scale { transition: transform 100ms ease-out; }
  .press-scale:active { transform: scale(0.97); }
  ```
- If `var(--color-blue-600)` doesn't resolve, use raw oklch values from Tailwind defaults

**Verification:** Each utility class can be added to an element in DevTools and produces the expected visual effect. `press-scale` shows a shrink on tap/click.
</description>
<requirements>DSYS-02, DSYS-03, DSYS-04, DSYS-05</requirements>
</task>

<task id="4">
<title>Add prefers-reduced-motion global reset and verify DSYS-08</title>
<description>
Add the accessibility media query to disable all animations when the user has reduced motion enabled. Also verify DSYS-08 (App.css deletion).

**Add to `src/index.css` after all utility definitions and base styles:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Key details:**
- Uses 0.01ms (not 0s) to preserve JS animationend/transitionend event firing
- Placed outside any Tailwind directive so it applies globally
- Uses !important to override all animation/transition durations

**DSYS-08: Delete `src/App.css`** — This is a 606-byte Vite scaffold boilerplate file. It is NOT imported anywhere in the project (no `App.css` import exists in src/), so deletion is safe. Delete the file, then verify no imports reference it.

**Verification:**
1. In Chrome DevTools → Rendering → "Emulate CSS media: prefers-reduced-motion: reduce" — no animations or transitions occur
2. `grep -r "App.css" src/` returns no results
3. `npm run build` succeeds
4. All 144 tests pass: `npm run test`
</description>
<requirements>DSYS-07, DSYS-08</requirements>
</task>

## Completion Criteria

All of the following must be true:
1. Inter font renders in the browser (visible font change from system default)
2. `npm run build` succeeds and includes .woff2 font files in output
3. `glass-card`, `glass-surface`, `gradient-primary`, `press-scale`, and `animate-fade-in` utility classes exist and apply correct styles when added to any element
4. With "Reduce Motion" emulated in DevTools, no animations or transitions are visible
5. No `App.css` file or import exists in the project
6. All 144 existing tests pass
