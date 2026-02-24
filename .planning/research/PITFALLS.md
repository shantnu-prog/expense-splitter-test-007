# Pitfalls Research

**Domain:** Visual redesign (glassmorphism, animations, SVG icons, font changes) of existing React 19 + Tailwind CSS 4 PWA
**Researched:** 2026-02-24
**Confidence:** HIGH — claims verified against MDN, web.dev, official Tailwind docs, Workbox docs, and real-world issue trackers (shadcn/ui, workbox GitHub, CanIUse)

---

## Critical Pitfalls

### Pitfall 1: Google Fonts CDN Breaks Offline Mode

**What goes wrong:**
Adding `<link href="https://fonts.googleapis.com/css2?family=Inter...">` to `index.html` causes the font stack to silently fail when the user opens the app offline. The browser falls back to the system font — which can break layout if Inter's line-height and character metrics differ from the fallback — and the service worker does NOT automatically intercept cross-origin font requests without explicit `runtimeCaching` configuration.

`vite-plugin-pwa` / Workbox's `globPatterns` only precaches local build artifacts (`js`, `css`, `html`, `ico`, `png`, `svg`). External CDN domains (`fonts.googleapis.com`, `fonts.gstatic.com`) are out of scope by default. Developers assume "the service worker handles everything" but cross-origin requests require explicit opt-in.

**Why it happens:**
The redesign phase adds Inter via a CDN `<link>` tag (the quickest way to use a new font). Nobody audits whether the existing service worker covers external domains. The font works perfectly online — the regression is invisible until a user goes offline or tests with Lighthouse's PWA audit.

**How to avoid:**
Option A — Self-host Inter using `@fontsource-variable/inter` (recommended). Font files land in the build output and are precached automatically with no extra config:
```bash
npm install @fontsource-variable/inter
```
```ts
// main.tsx
import '@fontsource-variable/inter';
```
Option B — Keep CDN but add explicit Workbox `runtimeCaching` rules to `vite.config.ts`:
```ts
runtimeCaching: [
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-cache',
      expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      cacheableResponse: { statuses: [0, 200] }
    }
  },
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'gstatic-fonts-cache',
      expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      cacheableResponse: { statuses: [0, 200] }
    }
  }
]
```
Also add `crossorigin="anonymous"` to every `<link>` referencing `fonts.googleapis.com` — without it the service worker cannot intercept the request due to CORS opaque response handling.

**Warning signs:**
- Font renders correctly in dev but looks different on first offline load
- Chrome DevTools → Application → Cache Storage shows no `google-fonts-cache` entry after first page load
- Lighthouse PWA audit reports "Does not respond with a 200 when offline"
- Font changes to a system serif when network is disabled in DevTools

**Phase to address:** Typography and font integration phase — the very first phase before any component styling begins. This is a one-time configuration fix that takes 5 minutes but cannot be retroactively applied to users who are already offline with a broken cache.

---

### Pitfall 2: Tailwind CSS 4 Purges Dynamically-Constructed Class Names

**What goes wrong:**
In a bill-splitting app, category colors, status badges, and member avatars are derived from data — e.g., `` `bg-${category.color}-500` `` or `` `text-${member.theme}-600` ``. In production builds, Tailwind's static scanner never sees these complete class names, so they are silently removed from the CSS output. The component renders with no color styles applied — no error, no warning, just invisible styling.

**Why it happens:**
Tailwind 4 uses a Rust-based engine that scans source files as plain text, looking for complete class-name strings. Template literals produce the string `bg-${color}-500` — which does not match any Tailwind class pattern. The JIT engine only generates what it literally sees in source.

Critical change from v3: Tailwind 4 removed `tailwind.config.js` entirely. The v3 `safelist: [{ pattern: /.../ }]` approach no longer works. The new approach is `@source inline()` in your CSS file or static lookup maps in your components.

**How to avoid:**
Option A (safest, recommended) — Replace all dynamic class construction with lookup maps of complete static strings:
```tsx
// Tailwind sees "bg-orange-500", "bg-blue-500", "bg-purple-500" as literal strings
const colorMap: Record<string, string> = {
  food: 'bg-orange-500 text-orange-50',
  transport: 'bg-blue-500 text-blue-50',
  rent: 'bg-purple-500 text-purple-50',
};
<Badge className={colorMap[expense.category]} />
```
Option B — Use Tailwind 4's `@source inline()` in your main CSS file to force-generate specific utilities:
```css
/* app.css */
@import "tailwindcss";
@source inline("{bg,text}-{orange,blue,purple,green,red}-{400,500,600}");
```
Option C — Create a `tailwind-safelist.txt` file in the project root listing every dynamic class on separate lines; Tailwind 4 scans all text files it discovers.

**Warning signs:**
- Component renders correctly in `npm run dev` (Vite serves all classes) but loses color in `npm run build && npm run preview`
- Styles present in hot-reload dev server but missing in `dist/` output — this is the definitive signal
- `grep -r "bg-orange" dist/assets/*.css` returns no matches despite the class being in source

**Phase to address:** Design system tokens and component foundation phase — the first phase where data-driven colors are introduced. Extremely hard to retrofit across 6,120 LOC after the fact. Establish the "always use static class maps" convention on day one of the redesign.

---

### Pitfall 3: `backdrop-filter: blur()` Causes GPU Jank on Mid-Range Android Devices

**What goes wrong:**
`backdrop-filter: blur(12px)` or higher on scroll-following elements (sticky headers, bottom sheets, modal overlays) causes GPU compositing stalls on mid-range Android devices (Snapdragon 665 class, 3 GB RAM). This is documented in the real world: shadcn/ui opened a tracking issue specifically for `backdrop-blur-sm` causing "CSS rendering/painting problems" with "severe lag" — the root cause confirmed as a GPU dependency for 2D rendering in Chromium on non-discrete GPU hardware.

CSS support is not the issue — CanIUse shows >97% global support including Safari 17 (which dropped the `-webkit-` prefix). The problem is the per-frame GPU cost of sampling and blurring the entire pixel buffer behind every animated or scrolled element.

**Why it happens:**
Each element with `backdrop-filter` forces the browser to promote that element AND everything behind it to a GPU compositing layer. When the viewport scrolls, the blur must be resampled every frame at 60 fps. High blur radii (>20px) and stacked blur elements multiply this cost non-linearly. Developer MacBooks with discrete GPUs never reproduce the issue.

**How to avoid:**
1. Cap blur radius at `blur(8px)` to `blur(12px)` maximum. The GPU cost scales roughly with the square of the blur radius.
2. Apply `backdrop-filter` ONLY to fixed/static glass panels — not to elements that scroll with the viewport. Sticky headers with backdrop-blur require blur recalculation every scroll frame.
3. Use `will-change: transform` on the blurred element only if it animates, and remove `will-change` after animation ends. Permanent `will-change` wastes GPU memory layers without benefit.
4. Provide a `@media (prefers-reduced-transparency)` fallback replacing `backdrop-blur-*` with a solid opaque background for users who have enabled this accessibility setting.
5. Never stack multiple backdrop-blur layers (e.g., a blurred modal inside a blurred card inside a blurred background). Each layer compounds the GPU cost.

**Warning signs:**
- FPS drops below 50 in Chrome DevTools Performance panel when scrolling past a blurred card
- "Paint flashing" in DevTools Rendering tab shows large purple rectangles covering the viewport during scroll
- The Layers panel in DevTools shows dozens of GPU compositing layers on a screen with multiple glass cards
- Smooth on MacBook, janky on Android — this hardware disparity is the canonical symptom

**Phase to address:** Glassmorphism foundation phase — establish a blur budget (maximum blur radius, maximum simultaneous backdrop-filter elements) before applying the pattern to any component. Verify on real or throttled hardware before signing off on the design system.

---

### Pitfall 4: Glassmorphism Fails WCAG Contrast on Variable Backgrounds

**What goes wrong:**
White or light-grey text on a frosted-glass panel passes contrast checks in the designer's static mockup (fixed dark gradient behind it) but fails WCAG 2.2 Level AA (4.5:1 minimum for body text, 3:1 for UI components) when real content shifts behind the glass — e.g., a colorful expense category badge, a green "credit" transaction row, or a white empty-state illustration.

Semi-transparent panels have a variable effective background. A `bg-white/10` glass panel over a bright yellow expense category row produces near-white-on-white contrast. Automated tools (Lighthouse, axe-core) check foreground vs. the nearest opaque ancestor in the DOM — they do NOT simulate the composited visual result of `backdrop-filter`. Failures only surface during manual testing against real content.

**Why it happens:**
Glassmorphism is evaluated in isolation during design reviews. The static mockup always shows the "best case" dark gradient. No automated tool currently simulates backdrop-filter compositing to compute the actual visual contrast.

**How to avoid:**
1. Never rely solely on the glass blur layer for text legibility. Add an explicit semi-opaque solid inner backing behind all text inside glass cards: `bg-black/40` for dark mode or `bg-white/60` for light mode, as a separate layer from the blur.
2. Measure contrast against the WORST-CASE background content that can appear behind the glass (bright category colors, white transaction amounts, photos if applicable). Target 7:1 or above to provide headroom for variable backgrounds.
3. Implement `@media (prefers-reduced-transparency)` to fall back to fully opaque panels for users with visual impairments who have enabled this OS-level setting.
4. Run axe-core audits on every screen state (empty list, list with colorful expense categories, balance summary with green/red amounts).

**Warning signs:**
- Lighthouse accessibility score passes on the empty-state screen but drops when a full expense list is present
- QA reports "the total text is hard to read on the green settlement card" — a subjective complaint that signals a real contrast failure
- Text contrast ratio below 7:1 against the glass layer alone (leaves zero headroom for bright backgrounds)

**Phase to address:** Glassmorphism foundation phase — define the text contrast floor (minimum backing opacity) before applying the glass pattern to any component. Changing this after 20 components are built requires touching all of them.

---

### Pitfall 5: Touch Target Regression from Glass Card Padding Changes

**What goes wrong:**
Glassmorphism redesigns frequently change card padding (increased for visual breathing room) and replace text-based action rows with icon-only glass buttons. The padding change can SHRINK the effective clickable area if icon-only buttons have their padding reduced to fit inside tight glass cards. WCAG 2.5.8 (Level AA, mandatory under the EU Accessibility Act effective June 28, 2025) requires targets to be at least 24x24 CSS pixels with 24px spacing around them. Google Material and Apple HIG both recommend 48x48 physical pixels.

The existing 144 tests in this app almost certainly do not assert rendered pixel dimensions of interactive elements — so touch target regressions pass CI completely silently.

**Why it happens:**
Designers specify glass cards with minimal inner padding to make content feel "airy." A delete icon button inside a card gets `p-2` (8px padding each side), giving a total tap area of 24px icon + 16px padding = 40px — technically below the recommended 48px. The regression is invisible in browser dev tools on a MacBook (mouse precision compensates) and only manifests as real-world miss-taps on a 5-inch Android phone.

**How to avoid:**
1. Never set icon button padding below `p-3` (12px padding each side: 24px icon + 24px = 48px total). Add `min-h-12 min-w-12` as a hard constraint on all interactive elements regardless of visual padding.
2. For icon-only buttons inside space-constrained glass cards, use negative margins to expand the tap area beyond the visual bounds: apply `p-1 -m-1` on the outer wrapper.
3. Add a Playwright accessibility check to the PR process that reports elements with bounding rects smaller than 44x44px.
4. Use Chrome DevTools → Accessibility → inspect element to verify the touch target size on redesigned interactive elements before merging.

**Warning signs:**
- User testing reports "it's hard to tap the X button on the expense card"
- Chrome DevTools accessibility tree shows elements with computed size below 44px
- Lighthouse accessibility score drops after the redesign PR merges (though Lighthouse does not currently check target size by default)

**Phase to address:** Component redesign phase — add touch target validation to the PR review checklist for every component that contains icon-only interactive elements.

---

### Pitfall 6: Animating Layout-Triggering CSS Properties Causes Jank

**What goes wrong:**
Animating `width`, `height`, `padding`, `margin`, `top`, `left`, `box-shadow`, or `border-width` forces the browser to run layout recalculation and paint on every animation frame. At 60fps this means 16ms per frame for layout + paint + composite — on a mid-range Android phone, these operations alone can exceed the frame budget, causing dropped frames and jank.

Common in glassmorphism redesigns: animating `box-shadow` for hover states on glass cards (produces repaints), or animating `height` for accordion-style glass panels (triggers full layout reflow).

**Why it happens:**
`box-shadow` changes look harmless — they are just visual styling. But `box-shadow` is a paint operation that cannot be promoted to the GPU compositor layer. It forces the browser to re-rasterize the entire element on every frame. Developers test hover states on a MacBook where the CPU/GPU handles it effortlessly, then ship to mobile devices where it degrades.

**How to avoid:**
Only animate these two properties for performance-critical animations: `transform` and `opacity`. Both run on the GPU compositor thread, bypassing layout and paint entirely.

```css
/* BAD: triggers layout + paint every frame */
.glass-card:hover {
  box-shadow: 0 20px 60px rgba(0,0,0,0.4); /* animating this = repaint */
  padding: 20px; /* layout thrash */
}

/* GOOD: compositor-only, zero layout/paint cost */
.glass-card {
  /* pre-render both shadow states as opacity layers */
}
.glass-card::after {
  content: '';
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  opacity: 0;
  transition: opacity 200ms ease;
}
.glass-card:hover::after {
  opacity: 1; /* only opacity changes = compositor thread */
}
```

For entry animations on glass cards, use `transform: translateY()` + `opacity`, never `height` or `margin` animations.

**Warning signs:**
- Chrome DevTools Performance panel shows "Recalculate Style" and "Layout" tasks longer than 8ms during hover animations
- "Paint flashing" (green overlays) in the Rendering tab appears on glass card hover
- Framer Motion or CSS `@keyframes` use `height: auto` or `margin-top` as animated values

**Phase to address:** Animation system phase — establish the "compositor-only animation" rule as a hard constraint before implementing any transitions. Review all glassmorphism hover states for `box-shadow` animation and replace with the `::after` opacity-layer pattern.

---

### Pitfall 7: `prefers-reduced-motion` Not Respected — WCAG 2.3.3 Violation

**What goes wrong:**
Adding entry animations (fade-in, slide-up), hover animations, and transition effects to a redesigned PWA without honoring `prefers-reduced-motion` is a WCAG 2.3.3 violation. This affects 70+ million people with vestibular disorders, migraines, and motion sensitivities. On iOS, the "Reduce Motion" setting is widely used — it is not a niche edge case.

The existing `App.css` already shows the correct pattern (`@media (prefers-reduced-motion: no-preference)`) for the Vite default logo animation. The risk is that new animation code in the redesign does NOT follow this pattern, adding animations that run unconditionally.

**Why it happens:**
Developers add animations ad-hoc in component files without a centralized animation system. Each developer checks their own component but forgets the reduced-motion check. No automated test catches missing media query guards. The setting is rarely enabled on development machines.

**How to avoid:**
Add a global reduced-motion reset at the top of the CSS file that covers all animations added during the redesign:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
```
For Framer Motion: check `useReducedMotion()` hook and provide static variants as the reduced-motion alternative.
For Tailwind: use the `motion-reduce:` variant prefix on all transition/animation classes: `motion-reduce:transition-none`.

**Warning signs:**
- Animation keyframes or `transition` classes not wrapped in `motion-reduce:` or `@media (prefers-reduced-motion: no-preference)`
- No `useReducedMotion` hook usage alongside Framer Motion animations
- Lighthouse accessibility audit flags WCAG 2.3.3 after the redesign

**Phase to address:** Animation system phase — first thing implemented before any transitions or entry animations are added to components. This is a one-line global CSS rule that prevents all future violations automatically.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Google Fonts CDN `<link>` without Workbox runtime caching rules | Zero npm install, font available instantly in dev | Font silently breaks offline; PWA audit fails; user sees system font on first offline launch | Never — self-host with `@fontsource-variable/inter` (2 minutes setup) or add Workbox rules |
| `will-change: transform` on all animated elements globally | Smoother animations in dev testing | GPU memory exhaustion on mobile; battery drain; each `will-change` element creates a permanent GPU layer | Only on elements actively mid-animation; remove via JS after animation completes |
| Template literal Tailwind classes (`` `bg-${color}-500` ``) | DRY, flexible component props | Silent purge in production builds; styles missing in `npm run build` output; no error or warning | Never — always use static lookup maps or `@source inline()` |
| Stacking multiple `backdrop-blur-*` layers (blurred modal inside blurred card) | Richer visual depth | Non-linear GPU cost; scroll jank on Android; drains battery | Never — use solid opacity overlay for depth rather than nested blur |
| Skipping `prefers-reduced-motion` on entry animations | Simpler component code | WCAG 2.3.3 violation; triggers vestibular disorders in real users | Never — one global CSS rule covers all components automatically |
| Inline every SVG as a React component | Tree-shaking friendly, no network request | DOM bloat at scale; duplicate SVG nodes per re-render of list items | Acceptable for ≤30 unique icons used sparingly; use sprite or icon library for icon-heavy lists |
| Animating `box-shadow` directly in CSS transition | Simple hover effect code | Paint operation every frame; GPU cannot promote to compositor layer; jank on mobile | Never — use `::after` pseudo-element with `opacity` transition instead |
| Loading full Inter variable font (all weights, all subsets) | Matches design spec exactly | ~95kb vs ~16kb for Latin-only subset; FOUT on first load; LCP regression | Never — specify only weights and subsets used; English-only app needs Latin subset only |

---

## Integration Gotchas

Common mistakes when connecting to external services and build tools.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Fonts CDN + vite-plugin-pwa | Adding `<link>` to `index.html` without Workbox runtime caching | Add `runtimeCaching` for both `fonts.googleapis.com` and `fonts.gstatic.com` using `CacheFirst` + 1-year expiration |
| Google Fonts CDN + service worker | Missing `crossorigin="anonymous"` on `<link rel="preconnect">` tags | Without this attribute, the service worker cannot intercept the request; CORS opaque responses won't cache |
| Tailwind CSS 4 + dynamic colors | Using v3-style `safelist` in `tailwind.config.js` (file no longer exists in v4) | Use `@source inline("{bg,text}-{colors}-{shades}")` in CSS or static string lookup maps in components |
| Tailwind CSS 4 + custom `@layer utilities` | Defining utilities in `@layer` but referencing them via template literals | Static class names only; Tailwind 4 scans plain text and must see the complete class name as a literal string |
| lucide-react / heroicons icon libraries | `import * as Icons from 'lucide-react'` imports the entire library | `import { Plus, Trash2, ChevronDown } from 'lucide-react'` — tree-shaking only works with named imports |
| Framer Motion + PWA | Installing full `framer-motion` when only basic animations are needed | Consider `motion/react` (the new package name) or CSS transitions for simple opacity/transform animations to avoid a ~50kb addition to the JS bundle |

---

## Performance Traps

Patterns that work in development but degrade on real mobile devices.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Multiple simultaneous `backdrop-filter` elements on one screen | Scroll jank, FPS < 40 on Android during list scrolling | Maximum 2 active `backdrop-filter` elements per screen; no `backdrop-filter` on scroll-following elements | 3+ stacked blur elements; any blur on a sticky element that scrolls |
| Loading SVG icon libraries as namespace imports | Large initial JS chunk; slow TTI | Named imports only from `lucide-react`; audit chunk size with `npm run build` Vite visualizer | Any namespace import regardless of icon count |
| Permanent `will-change: transform` on hover-animated glass cards | Excess GPU layers; memory pressure across all cards in a list | Apply `will-change` via JS only during active animation; remove on `animationend`/`transitionend` | Page with more than 10 elements with simultaneous `will-change` |
| Loading Inter variable font without subsetting | ~95kb font download; slower LCP; FOUT on first load | `@fontsource-variable/inter` with only weights `300-700`; Latin subset only | Any locale-specific subset included for a Latin-only app |
| Entry animations on every list item (expense list, person list) | Individual `translate` animations on 20+ items = 20x animation overhead | Animate the list container once, not each item; or stagger with reduced duration and `will-change` cleanup | Lists with > 10 animated items on a mid-range Android device |

---

## UX Pitfalls

Common user experience mistakes specific to this redesign domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Glass card contrast only verified against static dark background | Text unreadable when bright expense category badge appears behind glass | Add `bg-black/40` text-backing layer behind all text in glass cards; verify contrast against colorful list item backgrounds |
| Entry animations that replay on every back-navigation | Annoys frequent users navigating between screens rapidly | Wrap entry animations in a `useRef` + `useEffect` that animates only on first mount, not on re-mount from router cache |
| Icon-only glass buttons without accessible labels | Screen readers announce nothing; WCAG 4.1.2 failure | Every icon-only button needs `aria-label="Delete expense"` or visually-hidden `<span>` |
| Font fallback causes layout shift (CLS) during Inter load | Text reflowing shifts other elements; looks broken | Use `font-display: swap` with a system font stack that closely matches Inter metrics; self-hosting eliminates FOUT entirely |
| Glassmorphism effect removed by `prefers-reduced-transparency` with no graceful fallback | Glass cards look unstyled (no background, invisible against page) | `prefers-reduced-transparency` should fall back to `bg-surface/95 backdrop-blur-none border border-border`, not to no background at all |
| New font (Inter) loads after first paint, pushing content down | FOUT causes layout shift; Cumulative Layout Shift score degrades | Preload font: `<link rel="preload" href="..." as="font" crossorigin>` or use `@fontsource-variable/inter` (precached by service worker) |

---

## "Looks Done But Isn't" Checklist

Things that appear complete in development but have hidden production failures.

- [ ] **Offline font loading:** Font renders in browser — verify by going to DevTools → Network → Offline → hard reload. If font changes to a system font, caching is not configured.
- [ ] **Production class purge:** Design looks correct in `npm run dev` — verify with `npm run build && npm run preview`. Missing colors = dynamic class names need static maps or `@source inline()`.
- [ ] **Contrast on all backgrounds:** Glass card looks fine on dark background — test against a bright green "credit" transaction row, an orange food category badge, and a white empty-state illustration behind the card.
- [ ] **Touch targets on physical device:** Everything tappable on MacBook — test on a physical Android phone (or Chrome DevTools mobile emulation). Icon-only delete buttons inside list cards are the most common failure point.
- [ ] **Reduced motion respected:** Animations run in browser — test with macOS/iOS "Reduce Motion" enabled in System Settings → Accessibility. If animations still run, the global CSS rule or `motion-reduce:` variants are missing.
- [ ] **Blur performance under throttle:** Glass looks smooth on MacBook — test in Chrome DevTools with CPU 4x throttle + mobile emulation while scrolling an expense list with 10+ items. FPS should stay above 50.
- [ ] **Service worker updates on redesign deploy:** Users with old cached version — verify the PWA update prompt appears or the page auto-refreshes after deploying. CSS changes update the service worker only if the file content hash changes (Vite handles this; verify the SW filename changes in `dist/`).
- [ ] **`will-change` cleanup after animations:** Applied `will-change` for entry animations — verify via Chrome DevTools Layers panel that GPU layers are released after animations complete, not permanently allocated.
- [ ] **SVG icon bundle size:** Added icon imports — verify `npm run build` chunk size stays below Vite's 500kb warning. Named imports from `lucide-react` are tree-shaken; namespace imports are not.
- [ ] **Inter subsetting:** Loaded Inter variable font — verify in DevTools Network tab that only the necessary font weights are downloaded, not the full variable font file with all axes.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Google Fonts offline failure discovered post-launch | LOW | Add Workbox `runtimeCaching` rules to `vite.config.ts`, rebuild, deploy. Existing users get updated service worker within 24 hours via the service worker update cycle. |
| Dynamic Tailwind classes purged in production | MEDIUM | Run `grep -r 'bg-\${' src/ && grep -r 'text-\${' src/` to find all dynamic patterns. Convert each to a static lookup map or add to `@source inline()`. Rebuild and verify. |
| Contrast failures found in accessibility audit | MEDIUM | Add `bg-black/40` backing layer to all glass text containers. Requires touching every glass component but no architectural change — can be done in one PR. |
| Touch target regressions on icon buttons | LOW | Add `min-h-12 min-w-12` constraint to a shared `IconButton` component. Replace all icon-only `<button>` elements with this component. |
| Backdrop-blur jank reported by users on Android | MEDIUM | Remove `backdrop-filter` from all scroll-following elements. For fixed panels, reduce blur radius to `blur(8px)`. May require design review if the visual is considered core to brand identity. |
| SVG bundle bloat (Vite chunk size warning) | LOW | Audit imports with Vite bundle visualizer. Switch namespace imports to named imports. Verify chunk size drops below warning threshold. |
| `prefers-reduced-motion` violations found in audit | LOW | Add the global CSS reset rule once at the top of `app.css`. All existing and future animations are covered without touching individual components. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Google Fonts offline failure (Pitfall 1) | Phase 1: Typography and font setup | `npm run build && npm run preview` with DevTools offline mode; Lighthouse PWA offline audit |
| Tailwind dynamic class purge (Pitfall 2) | Phase 1: Design system tokens and color foundation | `npm run build` followed by visual regression check against dev server; `grep` check on `dist/` CSS |
| Backdrop-filter GPU jank (Pitfall 3) | Phase 2: Glassmorphism foundation | Chrome DevTools Performance recording with 4x CPU throttle; Rendering tab FPS meter during scroll |
| Glassmorphism contrast failures (Pitfall 4) | Phase 2: Glassmorphism foundation | axe-core audit on all expense list screens with bright category backgrounds populated |
| Touch target regression (Pitfall 5) | Phase 3: Component redesign | Playwright accessibility check asserting `getBoundingClientRect` >= 44px on all interactive elements |
| Layout-triggering animation jank (Pitfall 6) | Phase 4: Animation system | Chrome DevTools Performance panel; no "Layout" or "Recalculate Style" tasks > 8ms during hover animations |
| Missing `prefers-reduced-motion` (Pitfall 7) | Phase 4: Animation system — implement global CSS rule first | Test with OS Reduce Motion enabled across all animated screens |
| SVG icon bundle bloat | Phase 3 or wherever icons are introduced | `npm run build` chunk size; Vite bundle visualizer |

---

## Sources

- [MDN: backdrop-filter CSS property](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [web.dev: High-performance CSS animations guide](https://web.dev/articles/animations-guide)
- [shadcn/ui GitHub issue #327: backdrop-filter causes performance issues in Chrome](https://github.com/shadcn-ui/ui/issues/327)
- [CanIUse: CSS backdrop-filter browser support](https://caniuse.com/css-backdrop-filter)
- [Tailwind CSS v4 official docs: Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Tailwind Labs GitHub discussion #16592: Safelist support in V4](https://github.com/tailwindlabs/tailwindcss/discussions/16592)
- [Vite PWA: Workbox generateSW configuration and runtimeCaching](https://vite-pwa-org.netlify.app/workbox/generate-sw)
- [Axess Lab: Glassmorphism meets accessibility — can frosted glass be inclusive?](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/)
- [Nielsen Norman Group: Glassmorphism definition and best practices](https://www.nngroup.com/articles/glassmorphism/)
- [WCAG 2.2 Understanding SC 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG 2.2 Understanding SC 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WCAG 2.3.3: Animation from Interactions understanding document](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [web.dev: Accessible tap targets (48dp recommendation)](https://web.dev/articles/accessible-tap-targets)
- [web.dev: Font best practices and font-display](https://web.dev/articles/font-best-practices)
- [MDN: prefers-reduced-motion media query](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [Workbox GitHub issue #1563: Google fonts not rendering when fully offline](https://github.com/GoogleChrome/workbox/issues/1563)
- [Motion.dev: Web animation performance tier list](https://motion.dev/blog/web-animation-performance-tier-list)
- [Cloud Four: SVG icon technique stress test (inline vs sprite vs component)](https://cloudfour.com/thinks/svg-icon-stress-test/)
- [web.dev: Optimize web fonts (subsetting and font-display)](https://web.dev/learn/performance/optimize-web-fonts)

---
*Pitfalls research for: Visual redesign (glassmorphism, animations, SVG icons) of React 19 + Tailwind CSS 4 PWA with 144 tests and full offline support*
*Researched: 2026-02-24*
