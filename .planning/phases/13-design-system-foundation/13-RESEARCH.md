# Phase 13: Design System Foundation - Research

**Researched:** 2026-02-24
**Domain:** Tailwind CSS 4 custom utilities, typography self-hosting, CSS animations, glassmorphism
**Confidence:** HIGH

## Summary

This phase establishes the visual design system for the Expense Splitter PWA. The core work involves: (1) self-hosting Inter variable font via `@fontsource-variable/inter` for offline PWA reliability, (2) defining glass-card, glass-surface, gradient-primary, press-scale, and animate-fade-in as Tailwind CSS 4 custom utilities using the `@utility` directive, (3) defining animation keyframes inside the `@theme {}` block, (4) adding a global `prefers-reduced-motion` reset, (5) cleaning up the unused Vite scaffold `App.css`, and (6) applying AppShell layout adjustments for glass blur visibility and taller tab bar.

Tailwind CSS 4 uses a CSS-first configuration model. Custom utilities MUST use the `@utility` directive (not `@layer utilities` which does not support variants in v4). Animation keyframes and `--animate-*` theme variables go inside `@theme {}`. The project already uses `@tailwindcss/vite` plugin (v4.2+) and has `@import "tailwindcss"` in `index.css`, so the foundation is in place.

**Primary recommendation:** All design tokens, utilities, and keyframes go in `src/index.css` after `@import "tailwindcss"`. Inter font import goes in `src/main.tsx`. No new files needed beyond CSS modifications and the font package install.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DSYS-01 | Self-host Inter variable font via @fontsource-variable/inter | Font import pattern verified; `"Inter Variable"` is the CSS font-family name; import in main.tsx, configure in @theme |
| DSYS-02 | glass-card utility (backdrop-blur, bg-white/5, border-white/10, shadow) | @utility directive syntax verified for multi-property utilities |
| DSYS-03 | glass-surface utility (backdrop-blur, bg-white/[0.03], border-white/[0.06]) | Same @utility pattern as glass-card with lighter opacity values |
| DSYS-04 | gradient-primary utility (blue-600 to violet-600 gradient) | @utility with background-image linear-gradient using Tailwind CSS variables |
| DSYS-05 | press-scale utility (active:scale-[0.97] with 100ms transition) | @utility with transform and transition properties; compositor-only |
| DSYS-06 | animate-fade-in (translateY(4px)->0 over 200ms) | @theme block with --animate-fade-in and @keyframes fade-in |
| DSYS-07 | Global prefers-reduced-motion reset | @media query after @import targeting *, *::before, *::after |
| DSYS-08 | Delete unused App.css | Confirmed App.css is Vite scaffold boilerplate; not imported by App.tsx |
| LYOT-04 | AppShell background gradient tint | Subtle radial/linear gradient on AppShell root div for glass blur visibility |
| LYOT-05 | AppShell bottom padding pb-20 for taller tab bar | Change pb-16 to pb-20 on main element in AppShell.tsx |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | ^4.2.0 | Utility-first CSS framework | Already installed; CSS-first config via @tailwindcss/vite plugin |
| @fontsource-variable/inter | 5.2.8 | Self-hosted Inter variable font | Offline-safe for PWA; bundles woff2 files into Vite output |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/vite | ^4.2.0 | Vite plugin for Tailwind v4 | Already installed; handles CSS processing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @fontsource-variable/inter | Google Fonts CDN | CDN breaks offline in installed PWA -- REJECTED per user decision |
| @utility directive | @layer utilities | @layer utilities does NOT support variants (hover:, focus:, etc.) in Tailwind v4 -- REJECTED |
| @theme keyframes | tailwind.config.js | tailwind.config.js is deprecated in Tailwind v4 -- REJECTED |

**Installation:**
```bash
npm install @fontsource-variable/inter
```

## Architecture Patterns

### File Structure (no new files needed)
```
src/
├── main.tsx           # Add: import '@fontsource-variable/inter'
├── index.css          # Add: @theme, @utility blocks, reduced-motion reset
├── App.css            # DELETE (Vite scaffold boilerplate)
├── App.tsx            # No changes needed (doesn't import App.css)
└── components/
    └── layout/
        └── AppShell.tsx  # Modify: gradient bg, pb-20
```

### Pattern 1: Font Self-Hosting with @fontsource-variable
**What:** Import the font package in the JS entry point, configure via @theme in CSS
**When to use:** Always for PWAs that need offline font access

**Step 1 -- main.tsx:**
```typescript
// Source: https://fontsource.org/fonts/inter/install
import '@fontsource-variable/inter';
import './index.css';
```

**Step 2 -- index.css:**
```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}
```

**Key detail:** The `@fontsource-variable/inter` import MUST come before `./index.css` in main.tsx so the `@font-face` declarations are available when Tailwind processes the CSS. The font-family name is exactly `"Inter Variable"` (with space, capitalized).

**Font features:** Inter supports OpenType features. Enable ligatures and contextual alternates:
```css
@theme {
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-sans--font-feature-settings: "liga" 1, "calt" 1;
}
```

### Pattern 2: Custom Utilities via @utility Directive
**What:** Define reusable utility classes that work with all Tailwind variants
**When to use:** For design tokens that need variant support (hover:, active:, motion-safe:, etc.)

**Syntax -- multi-property utility:**
```css
/* Source: https://tailwindcss.com/docs/adding-custom-styles */
@utility glass-card {
  backdrop-filter: blur(12px);
  background-color: rgb(255 255 255 / 0.05);
  border: 1px solid rgb(255 255 255 / 0.1);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
```

**Important:** The `@utility` directive automatically places the utility in the utilities layer and enables all variants. Do NOT wrap in `@layer utilities`.

### Pattern 3: Animation Keyframes in @theme
**What:** Define animation theme variables and keyframes together inside @theme
**When to use:** For animations that should be available as `animate-*` utility classes

```css
/* Source: https://tailwindcss.com/docs/theme */
@theme {
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

This generates the `animate-fade-in` utility class automatically. Usage: `<div class="animate-fade-in">`.

### Pattern 4: Global Reduced-Motion Reset
**What:** Disable all animations and transitions when user prefers reduced motion
**When to use:** Always -- accessibility requirement

```css
/* Source: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Why 0.01ms instead of 0s:** Setting to 0s can break JS that listens for `animationend` or `transitionend` events. Using 0.01ms ensures events still fire but the animation is imperceptible.

**Placement:** After `@import "tailwindcss"` and after the `@theme` / `@utility` blocks. This sits outside any Tailwind directive so it applies globally.

### Pattern 5: Background Gradient Tint for Glassmorphism
**What:** Subtle gradient on the AppShell root to provide contrast for glass blur effects
**When to use:** Dark themes where glass elements need visible frosted-glass effect

```tsx
// AppShell.tsx root div
<div className="flex flex-col h-screen bg-gradient-to-br from-gray-950 via-gray-950 to-blue-950/30">
```

**Why needed:** Pure `bg-gray-950` (#030712) is too dark and uniform for `backdrop-filter: blur()` to produce visible frosting. A subtle gradient tint (blue-950 at ~30% opacity toward one corner) gives the blur something to diffuse, making glass elements readable.

### Anti-Patterns to Avoid
- **@layer utilities for custom classes:** In Tailwind v4, `@layer utilities` does NOT support variants like `hover:glass-card`. Always use `@utility`.
- **tailwind.config.js for theme:** Tailwind v4 is CSS-first. Config files are deprecated. Use `@theme {}` in CSS.
- **Animating layout properties:** Never animate `width`, `height`, `top`, `left`, `margin`, `padding` in glass utilities. Only `transform` and `opacity` are compositor-only (GPU-accelerated, no layout recalc).
- **High blur radius:** Keep `backdrop-filter: blur()` radius at 12-16px max. Larger values (20px+) cause GPU performance issues on mobile.
- **Too many blurred elements:** Max 4 simultaneous blurred elements per viewport. Each `backdrop-filter` creates a new compositor layer.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Variable font loading | Custom @font-face with manual woff2 files | @fontsource-variable/inter | Handles subsetting, weight ranges, format negotiation, CSS generation |
| Font fallback stack | Just "Inter, sans-serif" | Full system font stack with emoji fonts | Cross-platform rendering, CJK fallback, emoji support |
| Utility class system | Manual CSS classes in stylesheets | Tailwind @utility directive | Variant support, tree-shaking, specificity ordering |
| Reduced motion handling | Per-component motion checks | Global @media reset | Single source of truth, no component-level overhead |

## Common Pitfalls

### Pitfall 1: Font Import Order in main.tsx
**What goes wrong:** Inter font not applied because CSS processes before @font-face is registered
**Why it happens:** If `import './index.css'` comes before `import '@fontsource-variable/inter'`, the CSS that references `"Inter Variable"` has no matching @font-face
**How to avoid:** In main.tsx, import the font package FIRST, then import index.css
**Warning signs:** Font falls back to system default despite @theme config being correct

### Pitfall 2: Using @layer utilities Instead of @utility
**What goes wrong:** Custom utility classes don't respond to Tailwind variants
**Why it happens:** Tailwind v4 changed the mechanism. `@layer utilities` is for Tailwind's internal use. Custom utilities must use `@utility`.
**How to avoid:** Always use `@utility utility-name { ... }` syntax
**Warning signs:** `hover:glass-card` or `motion-safe:animate-fade-in` have no effect

### Pitfall 3: backdrop-filter Without Background Color
**What goes wrong:** Blur has no visible effect
**Why it happens:** `backdrop-filter: blur()` blurs content behind the element, but without a semi-transparent background, you see blurred content at full brightness -- indistinguishable from clear
**How to avoid:** Always pair `backdrop-filter` with a semi-transparent `background-color`
**Warning signs:** Glass elements look identical with and without the blur

### Pitfall 4: Forgetting the Gradient Background for Glass Visibility
**What goes wrong:** Glass-card/glass-surface elements appear as solid dark rectangles with no visible frosting
**Why it happens:** The AppShell background is solid `bg-gray-950` -- a nearly-black uniform color. Blurring a uniform color produces the same uniform color.
**How to avoid:** Add a subtle gradient or color variation to the AppShell background (LYOT-04)
**Warning signs:** Glass utilities technically work but look like regular dark cards

### Pitfall 5: press-scale Without will-change Cleanup
**What goes wrong:** GPU memory bloat from permanent compositor layers
**Why it happens:** If `will-change: transform` is applied permanently, the browser keeps a GPU texture allocated
**How to avoid:** Apply `will-change: transform` only during the transition, or use the transition property itself which implicitly hints the browser. For simple `active:scale` transitions, just use `transition: transform 100ms` without explicit `will-change`.
**Warning signs:** Increased GPU memory on pages with many pressable elements

### Pitfall 6: App.css Still Referenced Somewhere
**What goes wrong:** Build fails or styles break after deleting App.css
**Why it happens:** An import of `'./App.css'` might exist somewhere
**How to avoid:** Before deleting, search the entire codebase for `App.css` imports. Currently, `App.tsx` does NOT import App.css (confirmed by codebase review), so deletion is safe.
**Warning signs:** TypeScript/Vite build error about missing module

## Code Examples

### Complete index.css After Phase 13
```css
/* src/index.css */
@import "tailwindcss";

/* === Theme: design tokens and animation keyframes === */
@theme {
  /* Typography: Inter Variable as default sans font */
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-sans--font-feature-settings: "liga" 1, "calt" 1;

  /* Animation: fade-in */
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

/* === Custom utilities === */

/* DSYS-02: Glass card -- elevated glass surface for cards/modals */
@utility glass-card {
  backdrop-filter: blur(12px);
  background-color: rgb(255 255 255 / 0.05);
  border: 1px solid rgb(255 255 255 / 0.1);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

/* DSYS-03: Glass surface -- subtle glass for section backgrounds */
@utility glass-surface {
  backdrop-filter: blur(8px);
  background-color: rgb(255 255 255 / 0.03);
  border: 1px solid rgb(255 255 255 / 0.06);
}

/* DSYS-04: Gradient primary -- blue-to-violet branded gradient */
@utility gradient-primary {
  background-image: linear-gradient(to right, var(--color-blue-600), var(--color-violet-600));
}

/* DSYS-05: Press scale -- tactile feedback on tap/click */
@utility press-scale {
  transition: transform 100ms ease-out;
}
@utility press-scale {
  &:active {
    transform: scale(0.97);
  }
}

/* === Base styles === */
html, body, #root {
  @apply min-h-screen bg-gray-950 text-gray-100 overscroll-none;
}

/* === Accessibility: prefers-reduced-motion global reset === */
/* DSYS-07 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**IMPORTANT NOTE on press-scale:** The `@utility` directive may not support `&:active` nesting in all Tailwind v4 versions. If nesting is not supported within `@utility`, use this alternative pattern:

```css
/* Alternative: single @utility block with nesting */
@utility press-scale {
  transition: transform 100ms ease-out;
  &:active {
    transform: scale(0.97);
  }
}
```

If `@utility` does not support pseudo-selectors at all, fall back to a plain CSS class with `@layer components`:
```css
/* Fallback if @utility doesn't support :active pseudo */
@layer components {
  .press-scale {
    transition: transform 100ms ease-out;
  }
  .press-scale:active {
    transform: scale(0.97);
  }
}
```

The planner should verify the nesting support during implementation and choose the approach that works.

### main.tsx Font Import
```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'   // MUST be before index.css
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### AppShell Background Gradient (LYOT-04) and Bottom Padding (LYOT-05)
```tsx
// In AppShell.tsx, change the root div:
// Before:
<div className="flex flex-col h-screen">

// After (LYOT-04):
<div className="flex flex-col h-screen bg-gradient-to-br from-gray-950 via-gray-950 to-blue-950/30">

// And change main padding (LYOT-05):
// Before:
<main className="flex-1 overflow-y-auto pb-16 overscroll-contain">

// After:
<main className="flex-1 overflow-y-auto pb-20 overscroll-contain">
```

### PWA Workbox Verification
The existing `vite.config.ts` already includes `woff2` in the workbox glob patterns:
```javascript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
},
```
This means Inter's `.woff2` files will be precached by the service worker automatically. No configuration change needed.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js for theme | @theme {} in CSS | Tailwind v4 (Jan 2025) | All config is CSS-first |
| @layer utilities for custom utils | @utility directive | Tailwind v4 (Jan 2025) | Required for variant support |
| Google Fonts CDN | Self-hosted via @fontsource | Industry shift 2022-2024 | PWA offline support, GDPR compliance |
| Static font files (@fontsource/inter) | Variable font (@fontsource-variable/inter) | fontsource v5 | Single file covers all weights 100-900 |
| Per-component motion-safe checks | Global reduced-motion reset | Best practice since 2021 | Single CSS rule handles all animations |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts` -- replaced by CSS-first `@theme` in v4
- `@layer utilities { }` for custom classes -- does not support variants in v4; use `@utility`
- `--font-family-sans` theme variable name -- renamed to `--font-sans` in Tailwind v4

## Open Questions

1. **@utility nesting support for pseudo-selectors**
   - What we know: `@utility` supports CSS nesting syntax for things like `&::-webkit-scrollbar`. The `press-scale` utility needs `&:active` nesting.
   - What's unclear: Whether `&:active` pseudo-selector nesting works identically to `&::-webkit-scrollbar` within `@utility`. The official docs show `&::-webkit-scrollbar` but not `&:active` specifically.
   - Recommendation: Try the nested `@utility` approach first. If it fails, fall back to `@layer components` pattern. Verify during implementation.

2. **Inter Variable font-feature-settings via --font-sans--font-feature-settings**
   - What we know: Tailwind v4 docs show `--font-display--font-feature-settings` syntax for setting font features on custom font families.
   - What's unclear: Whether `--font-sans--font-feature-settings` works identically for the built-in `--font-sans` override.
   - Recommendation: Include it in @theme. If it does not take effect, add `font-feature-settings: "liga" 1, "calt" 1;` in the `html, body, #root` base styles instead.

3. **gradient-primary with Tailwind color variables**
   - What we know: Tailwind v4 exposes colors as CSS custom properties like `var(--color-blue-600)`.
   - What's unclear: The exact variable name format in Tailwind v4 for default palette colors.
   - Recommendation: Use `var(--color-blue-600)` and `var(--color-violet-600)`. If those don't resolve, fall back to the oklch values directly from the Tailwind v4 default palette.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 -- Adding Custom Styles](https://tailwindcss.com/docs/adding-custom-styles) -- @utility directive syntax
- [Tailwind CSS v4 -- Functions and Directives](https://tailwindcss.com/docs/functions-and-directives) -- @utility, @theme directives
- [Tailwind CSS v4 -- Theme Variables](https://tailwindcss.com/docs/theme) -- @theme block, --animate-*, @keyframes, --font-* syntax
- [Tailwind CSS v4 -- Animation](https://tailwindcss.com/docs/animation) -- animate-* utilities, motion-safe/motion-reduce variants
- [Tailwind CSS v4 -- Font Family](https://tailwindcss.com/docs/font-family) -- --font-sans override, font feature settings
- [Fontsource Inter Install Guide](https://fontsource.org/fonts/inter/install) -- package name, import syntax, font-family value
- [Fontsource Variable Fonts Guide](https://fontsource.org/docs/getting-started/variable) -- variable font import pattern

### Secondary (MEDIUM confidence)
- [Tailwind CSS v4 Discussion #13890](https://github.com/tailwindlabs/tailwindcss/discussions/13890) -- Custom font @theme syntax confirmed by maintainers
- [Tailwind CSS v4 Discussion #15415](https://github.com/tailwindlabs/tailwindcss/discussions/15415) -- Inter font with Tailwind v4 setup
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) -- reduced motion media query specification

### Tertiary (LOW confidence)
- [Dark Glassmorphism Medium article](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f) -- dark mode glassmorphism patterns (community source)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- verified via official Tailwind docs and fontsource docs
- Architecture (CSS patterns): HIGH -- verified via official Tailwind v4 docs for @utility and @theme
- Font setup: HIGH -- verified package name, font-family value, import order
- Glass utilities: HIGH -- standard CSS properties, well-documented backdrop-filter
- Animation keyframes: HIGH -- verified @theme @keyframes syntax from official docs
- press-scale nesting: MEDIUM -- @utility nesting shown for pseudo-elements but not pseudo-classes specifically
- gradient-primary color vars: MEDIUM -- color variable naming format needs implementation verification

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable -- Tailwind v4 is released, fontsource is mature)
