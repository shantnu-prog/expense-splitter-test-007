# Stack Research

**Domain:** PWA UI Redesign — glassmorphism, Inter font, gradients, micro-interactions, SVG tab icons
**Researched:** 2026-02-24
**Confidence:** HIGH

---

## Scope

This document covers **only new stack additions for the UI redesign milestone**.

Features being added:
- Glassmorphism (backdrop-blur, semi-transparent backgrounds, frosted borders)
- Inter variable font (replacing system-ui fallback)
- Gradient backgrounds (linear, radial via Tailwind v4 APIs)
- Micro-interactions (enter/exit animations, hover feedback, tab transitions)
- SVG tab bar icons replacing emoji/text placeholders

The existing stack (React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4.2.0, Zustand 5, Vitest 4, vite-plugin-pwa 1.2.0) is validated and not re-researched. All capabilities below integrate with this existing setup.

---

## Recommended Stack — New Additions

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@fontsource-variable/inter` | 5.2.8 | Self-hosted Inter variable font (weights 100–900 in one file) | Self-hosting is required for offline PWA functionality — Google Fonts CDN fails when the device is offline. Since Chrome 86 (Oct 2020), cross-site CDN caching is partitioned, so there is zero browser cache benefit from using the Google Fonts CDN. Self-hosting avoids 2–4 extra DNS/SSL round-trips and eliminates the render-blocking external request. The variable font package covers all weights in a single woff2 file, making it smaller than loading multiple static weight files. Fontsource handles `@font-face` declaration and unicode-range subsetting automatically. |
| `lucide-react` | 0.575.0 | SVG icon components for bottom tab bar | Fully tree-shakable — only imported icons enter the bundle (~1 KB per icon after tree-shaking). 1,500+ icons designed on a consistent 24×24 grid with configurable `size`, `strokeWidth`, and `color` props. 29.4M weekly npm downloads in 2026 vs Heroicons' 2M, indicating active maintenance and community trust. Ships TypeScript definitions. No additional runtime dependency. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required for glassmorphism | — | backdrop-blur, bg-white/5, border-white/10 are native Tailwind CSS 4 utilities | Glassmorphism is pure Tailwind + CSS. No plugin or library needed. |
| None required for animations | — | Micro-interactions via Tailwind `@theme` @keyframes + `animate-*` utilities and CSS transitions | Tailwind v4's `@theme` supports `--animate-*` custom properties with embedded `@keyframes`. For simple enter/exit and hover transitions, `transition-*` utilities are sufficient. No external animation library (Framer Motion, GSAP) is needed. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| None new required | — | Vite 7 + `@tailwindcss/vite` 4.2.0 + existing PWA plugin already handle woff2 asset bundling and Workbox precaching |

---

## Integration Guide

### 1. Inter Font — Installation and Configuration

**Install:**
```bash
npm install @fontsource-variable/inter
```

**Import in `src/main.tsx`** (load font before React renders):
```typescript
import '@fontsource-variable/inter';
import './index.css';
// ... rest of imports
```

**Configure in `src/index.css`:**
```css
@import "tailwindcss";

@theme {
  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
  --font-sans--font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
}

html, body, #root {
  @apply min-h-screen bg-gray-950 text-gray-100 overscroll-none font-sans;
}
```

The `--font-sans` token in `@theme` makes `font-sans` utility use Inter Variable project-wide. The `--font-sans--font-feature-settings` registers contextual alternates that improve Inter's lowercase `l`, `a`, `i`, `r`, `g` rendering.

**PWA offline support:** Workbox picks up the woff2 file automatically because it is bundled by Vite into the build output. The existing `vite.config.ts` already has `globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']` — this covers the font with no config change needed.

**Preload hint for performance** (add to `index.html`):
```html
<link rel="preload" href="/assets/inter-variable.woff2" as="font" type="font/woff2" crossorigin>
```
Note: The actual filename will be hashed by Vite (e.g., `inter-variable-abc123.woff2`). Either add the preload after build by reading the manifest, or accept the minor FCP cost from not preloading — for a PWA that is almost always served from cache, this is low priority.

---

### 2. Glassmorphism — Tailwind CSS 4 Utilities

All glassmorphism primitives are **built into Tailwind CSS 4**. No new package required.

**Backdrop blur scale (v4 values — note rename from v3):**

| Class | CSS Output | v3 Equivalent |
|-------|-----------|---------------|
| `backdrop-blur-xs` | `blur(4px)` | `backdrop-blur-sm` |
| `backdrop-blur-sm` | `blur(8px)` | `backdrop-blur` (bare) |
| `backdrop-blur-md` | `blur(12px)` | `backdrop-blur-md` |
| `backdrop-blur-lg` | `blur(16px)` | `backdrop-blur-lg` |
| `backdrop-blur-xl` | `blur(24px)` | `backdrop-blur-xl` |
| `backdrop-blur-2xl` | `blur(40px)` | `backdrop-blur-2xl` |
| `backdrop-blur-3xl` | `blur(64px)` | `backdrop-blur-3xl` |

**The blur scale was renamed in v4.** `backdrop-blur-sm` in v3 is now `backdrop-blur-xs` in v4. If design specs reference v3 names, adjust accordingly. Since this project started fresh on Tailwind v4, use v4 names throughout.

**Opacity modifier syntax (v4 is the modern standard):**
```html
<!-- Correct in v4 (also worked in v3) -->
<div class="bg-white/5 border border-white/10 backdrop-blur-xl">

<!-- DO NOT use v3-only syntax (removed in v4) -->
<div class="bg-white bg-opacity-5">  <!-- bg-opacity-* removed in v4 -->
```

**Glassmorphism card pattern:**
```html
<div class="
  bg-white/5
  border border-white/10
  backdrop-blur-xl
  rounded-2xl
  shadow-lg
">
```

**v4 uses `color-mix()` under the hood for opacity modifiers** — `bg-white/5` computes `color-mix(in srgb, white 5%, transparent)`. This is more accurate than the v3 rgba hack and works with CSS variables and `currentColor`.

**Custom glassmorphism token (optional, for consistency):**
```css
@theme {
  --color-glass-surface: color-mix(in srgb, white 5%, transparent);
  --color-glass-border: color-mix(in srgb, white 10%, transparent);
}
```
This is optional — using `/5` and `/10` modifiers inline is equally idiomatic.

---

### 3. Animations — Tailwind v4 @theme Approach

**Built-in animate utilities (no config needed):**
- `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none`

**Custom micro-interaction animations — define in `src/index.css`:**
```css
@import "tailwindcss";

@theme {
  /* Tab switch fade */
  --animate-fade-in: fade-in 0.2s ease-out;

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Card enter */
  --animate-slide-up: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slide-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Button press */
  --animate-pop: pop 0.15s ease-out;

  @keyframes pop {
    0%   { transform: scale(1); }
    50%  { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
}
```

Usage in JSX:
```html
<div class="animate-fade-in">...</div>
<button class="animate-pop active:animate-pop">...</button>
```

**Reduced motion support — always pair with `motion-reduce:`:**
```html
<div class="animate-fade-in motion-reduce:animate-none">...</div>
```

**For transitions (hover, focus, active states) — use `transition-*` utilities, not `animate-*`:**
```html
<button class="
  transition-all duration-150 ease-out
  hover:scale-105 active:scale-95
">
```
`transition-*` is simpler for state-driven changes; `animate-*` is for mount/enter effects.

**v4 @starting-style (new feature — for pure CSS enter animations):**
```css
/* No JavaScript needed for enter animations in v4 */
@layer utilities {
  .enter-fade {
    @starting-style {
      opacity: 0;
      transform: translateY(8px);
    }
    transition: opacity 0.2s, transform 0.2s;
  }
}
```
Use `@starting-style` when you want CSS-only element entry without React state toggling. Browser support: Chrome 117+, Safari 17.5+, Firefox 129+. All covered by the PWA's existing target baseline.

---

### 4. SVG Icons — lucide-react

**Install:**
```bash
npm install lucide-react
```

**Usage:**
```tsx
import { Home, Users, Receipt, Settings } from 'lucide-react';

// In tab bar JSX:
<Home size={24} strokeWidth={1.5} className="text-current" />
<Users size={24} strokeWidth={1.5} className="text-current" />
<Receipt size={24} strokeWidth={1.5} className="text-current" />
```

**Active state pattern:**
```tsx
<Home
  size={24}
  strokeWidth={isActive ? 2 : 1.5}
  className={isActive ? 'text-white' : 'text-gray-400'}
/>
```

**Do not** import from `lucide-react/dist/esm/icons` or use the `LucideIcon` dynamically — import named icons only. This ensures tree-shaking.

**Icon sizing for bottom tab bar:** `size={22}` or `size={24}` with `strokeWidth={1.5}` matches standard iOS/Android tab bar icon conventions and renders crisply at standard pixel densities.

---

### 5. Gradient APIs — Tailwind v4 Native

Tailwind v4 ships new gradient utilities. No library or plugin needed.

**Available gradient classes:**
```html
<!-- Linear gradient with angle -->
<div class="bg-linear-to-br from-violet-950 via-gray-950 to-gray-950">

<!-- Gradient with OKLCH interpolation (v4 exclusive) -->
<div class="bg-linear-to-r/oklch from-violet-600 to-indigo-600">

<!-- Radial gradient (new in v4) -->
<div class="bg-radial-[at_top_left] from-violet-900/30 to-transparent">
```

**App background pattern (dark glassmorphism base):**
```html
<div class="min-h-screen bg-gray-950 bg-radial-[at_top] from-violet-950/40 to-gray-950">
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `@fontsource-variable/inter` (self-hosted) | Google Fonts CDN `<link>` | CDN font fails offline — PWA must work offline. Google Fonts CDN provides zero cross-site cache benefit since Chrome 86. Self-hosting eliminates 2–4 DNS/SSL round-trips on cold load. |
| `@fontsource-variable/inter` (variable font) | `@fontsource/inter` (static weights) | Static version requires separate CSS imports per weight (e.g., `400.css`, `600.css`, `700.css`). Variable font is one file covering weights 100–900. Simpler import, typically smaller combined file size for 3+ weights used. |
| `lucide-react` | `@heroicons/react` | Heroicons only has 316 icons. Lucide has 1,500+. Both are tree-shakable. Lucide has 15x the weekly downloads, indicating broader community adoption and more active maintenance. Lucide's icon set is more complete for app UI patterns (e.g., Receipt, Split, UPI-style icons). |
| `lucide-react` | Inline SVG strings in JSX | Manageable for <5 icons, but 4 tab icons + likely action icons = 10+ icons. Inline SVG strings in JSX have no type safety, no consistent sizing API, and require manual optimization. lucide-react's component API is cleaner and equally bundle-efficient. |
| `lucide-react` | `react-icons` | react-icons bundles entire icon families — tree-shaking is less reliable, and the package has historically included non-tree-shakable re-exports. lucide-react is purpose-built for tree-shaking with each icon as a discrete named export. |
| Tailwind v4 `@theme` @keyframes | Framer Motion | Framer Motion adds ~50 KB gzipped. For tab transitions and micro-interactions (scale, fade, slide), Tailwind transitions + @keyframes are sufficient. Framer Motion is warranted if gesture-based drag animations or layout animations (animating position changes across re-renders) are needed, which they are not in this redesign. |
| Tailwind v4 `@theme` @keyframes | GSAP | GSAP is a commercial-license concern for PWA products and weighs ~35 KB. Not needed for CSS-level micro-interactions. |
| Tailwind v4 native glassmorphism | `tailwind-glassmorphism` npm package | No such first-class package is needed — backdrop-blur and opacity modifiers are first-class Tailwind v4 utilities. Third-party packages for this are redundant. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Google Fonts CDN `<link rel="stylesheet">` | Fails offline in installed PWA; no cross-site cache benefit since Chrome 86; adds 100–300ms DNS+SSL on cold load | `@fontsource-variable/inter` self-hosted |
| `bg-opacity-*` classes (e.g., `bg-opacity-5`) | Removed in Tailwind v4; these utilities no longer exist | `bg-white/5` opacity modifier syntax |
| `backdrop-blur-sm` expecting 4px blur | In v4, `backdrop-blur-sm` = 8px (was `backdrop-blur` bare in v3). `backdrop-blur-xs` = 4px. Using v3 blur names gives wrong blur values. | `backdrop-blur-xs` for 4px, `backdrop-blur-sm` for 8px |
| `@layer utilities { .custom { ... } }` for custom utilities | In v4, `@layer utilities` is no longer used for custom utility definitions — it silently won't generate variants/responsive support | `@utility custom-name { ... }` directive |
| `tailwind.config.js` for animation/keyframe config | v4 no longer auto-detects `tailwind.config.js`; the JavaScript config approach is deprecated for CSS-first projects | `@theme { --animate-*: ... @keyframes ... }` in CSS |
| Framer Motion for basic transitions | ~50 KB gzip overhead not justified for hover, fade, and slide animations achievable with Tailwind transition utilities | `transition-*` + `@theme` keyframes |
| `react-icons` | Tree-shaking unreliable; whole icon family enters bundle | `lucide-react` named imports |

---

## Stack Patterns by Variant

**If animations need to be synchronised with React state (e.g., conditional list reordering):**
- Add Framer Motion `^12.x` at that point — its `layout` prop and `AnimatePresence` solve DOM-position animations that CSS cannot.
- Keep `@theme` keyframes for static enter/exit effects; use Framer Motion only where layout animation is needed.

**If additional font weights beyond 100–900 variable are needed:**
- Nothing changes — `@fontsource-variable/inter` already covers all weights via the variable axis.
- Control weight in CSS with `font-weight: 350` or Tailwind's `font-[350]` arbitrary value.

**If custom brand icons are needed (not in Lucide's library):**
- Create `src/assets/icons/CustomIcon.tsx` as a React component wrapping an inline SVG string.
- Follow Lucide's prop API pattern (`size`, `strokeWidth`, `className`) for consistency.
- Optimize SVGs with SVGO before embedding.

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `@fontsource-variable/inter` | 5.2.8 | Vite 7, `@tailwindcss/vite` 4.2.0 | woff2 bundled by Vite as a static asset; precached by Workbox via existing `globPatterns` |
| `lucide-react` | 0.575.0 | React 19, TypeScript 5.9 | Ships its own `.d.ts`; no `@types/lucide-react` package needed |
| Tailwind `backdrop-blur-xl` | Tailwind CSS 4.2.0 | All modern browsers (Chrome 76+, Safari 15.4+, Firefox 103+) | `backdrop-filter` has no IE11 support; irrelevant for this PWA's targets |
| Tailwind `@theme { @keyframes }` | Tailwind CSS 4.2.0 | `@tailwindcss/vite` 4.2.0 | v4-specific syntax; not compatible with Tailwind v3 |
| `@starting-style` (CSS) | Browser-native | Chrome 117+, Safari 17.5+, Firefox 129+ | Available in all browsers from 2023–2024; safe to use |

---

## Installation

```bash
# New production dependencies
npm install @fontsource-variable/inter lucide-react

# No new dev dependencies required
# No changes to vite.config.ts required
# No changes to tailwind configuration required (CSS-first @theme handles everything)
```

**Files to modify:**

| File | Change |
|------|--------|
| `src/main.tsx` | Add `import '@fontsource-variable/inter';` at top |
| `src/index.css` | Add `@theme { --font-sans: 'Inter Variable', ... }` + micro-interaction `@keyframes` |
| `index.html` | Optionally add `<link rel="preload">` for woff2 (post-build, hash-aware) |
| Tab bar component | Replace emoji/text icons with lucide-react components |

---

## Sources

- [Tailwind CSS docs: backdrop-filter-blur](https://tailwindcss.com/docs/backdrop-filter-blur) — v4 blur scale values and custom value syntax (HIGH confidence, official docs)
- [Tailwind CSS docs: animation](https://tailwindcss.com/docs/animation) — @theme `--animate-*` with embedded @keyframes pattern (HIGH confidence, official docs)
- [Tailwind CSS docs: theme](https://tailwindcss.com/docs/theme) — @theme directive, @layer usage, font-family and CSS variable namespaces (HIGH confidence, official docs)
- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) — opacity modifier removals (`bg-opacity-*`), blur scale rename, `@layer utilities` → `@utility` (HIGH confidence, official docs)
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — new gradient APIs, @starting-style, color-mix() (HIGH confidence, official blog)
- [Fontsource Inter install guide](https://fontsource.org/fonts/inter/install) — variable font package, import pattern (HIGH confidence, official docs)
- [@fontsource-variable/inter on npm](https://www.npmjs.com/package/@fontsource-variable/inter) — version 5.2.8 confirmed current (HIGH confidence, npm registry)
- [lucide-react on npm](https://www.npmjs.com/package/lucide-react) — version 0.575.0 confirmed current (HIGH confidence, npm registry)
- [React Icon Libraries Bundle Size Benchmark 2026](https://medium.nkcroft.com/the-hidden-bundle-cost-of-react-icons-why-lucide-wins-in-2026-1ddb74c1a86c) — Lucide vs Heroicons tree-shaking benchmark (MEDIUM confidence, community benchmark)
- [Should you self-host Google Fonts?](https://www.tunetheweb.com/blog/should-you-self-host-google-fonts/) — CDN cache partitioning since Chrome 86, performance tradeoffs (HIGH confidence, verified against official Chrome docs)
- [Vite PWA: Service Worker Precache](https://vite-pwa-org.netlify.app/guide/service-worker-precache) — woff2 precaching via globPatterns (HIGH confidence, official Vite PWA docs)

---

*Stack research for: Expense Splitter — UI Redesign (glassmorphism, Inter font, gradients, micro-interactions, SVG icons)*
*Researched: 2026-02-24*
