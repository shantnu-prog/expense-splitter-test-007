# Project Research Summary

**Project:** Expense Splitter — v1.3 UI Redesign
**Domain:** Dark-themed PWA visual redesign — glassmorphism, Inter font, gradients, micro-interactions, SVG icons
**Researched:** 2026-02-24
**Confidence:** HIGH

## Executive Summary

The v1.3 milestone is a pure visual redesign of an already-working React 19 + Tailwind CSS 4 PWA. The codebase has 144 passing ARIA-based tests, a clean Zustand state layer, and zero CSS-in-JS — all of which make the redesign safe to execute without touching application logic. Experts build this type of visual upgrade as a layered addition: design tokens first, reusable utility classes second, then component-by-component styling. The recommended approach is to self-host Inter via `@fontsource-variable/inter`, implement glassmorphism using native Tailwind CSS 4 utilities (no third-party packages), and add SVG icons using `lucide-react` named imports. The entire stack addition is two production npm packages and zero new dev dependencies.

The recommended approach positions this app in the consumer-grade fintech tier (Apple Wallet, Stripe) rather than the utility-grade tier occupied by Splitwise and Tricount — neither competitor uses glassmorphism or gradient CTAs. All visual effects are achievable within existing Tailwind CSS 4 capabilities: `backdrop-blur-*`, `bg-white/[opacity]`, `@theme` keyframe declarations, and the `@utility` directive. No Framer Motion, no GSAP, no CSS-in-JS, no Tailwind plugins are needed. The redesign touches 13 component files and adds 8 new icon components; it does not touch the store, engine, hooks, or any test file.

The primary risk is mobile GPU performance from `backdrop-filter: blur()`. Research confirms shadcn/ui opened a tracking issue for the exact same problem. The mitigation is a strict blur budget: maximum 4 simultaneous blurred elements per viewport, maximum 12px blur radius on scroll-adjacent elements (fixed-position TabBar and SubtotalBar may use up to 16px). The secondary risk is the offline font issue — Google Fonts CDN silently breaks when a user is offline, which is invisible in development. Self-hosting via `@fontsource-variable/inter` resolves this completely in two minutes and is the only acceptable approach for a PWA targeting Indian restaurant users who may have spotty connectivity.

---

## Key Findings

### Recommended Stack

The existing stack (React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4.2.0, Zustand 5, vite-plugin-pwa 1.2.0) requires only two new production dependencies for the redesign. `@fontsource-variable/inter` (v5.2.8) self-hosts the Inter variable font as a precached woff2 asset — this is mandatory for offline PWA support, because Google Fonts CDN is not intercepted by Workbox's default `globPatterns`. `lucide-react` (v0.575.0) provides tree-shakable SVG icon components; each named icon import adds ~1KB after tree-shaking. All glassmorphism effects, gradient utilities, and micro-animation keyframes are native Tailwind CSS 4 features requiring zero additional packages.

Tailwind CSS 4 introduces important breaking changes from v3 that must be observed throughout the redesign: `bg-opacity-*` utilities are removed (use `bg-white/5` opacity modifier syntax); the backdrop blur scale was renamed (`backdrop-blur-sm` in v3 is now `backdrop-blur-xs` in v4); custom utilities must use the `@utility` directive (not `@layer utilities`); and animation/keyframe configuration lives in `@theme { }` inside CSS (not in `tailwind.config.js`, which no longer exists in v4).

**Core technologies:**
- `@fontsource-variable/inter` v5.2.8: Self-hosted Inter variable font — mandatory for offline PWA, eliminates 2-4 DNS/SSL round-trips, automatically precached by existing Workbox `globPatterns`
- `lucide-react` v0.575.0: SVG tab bar icons — 1,500+ icons, fully tree-shakable named imports, TypeScript definitions included, 15x the weekly downloads of Heroicons
- Tailwind CSS 4 native utilities: Glassmorphism (`backdrop-blur-*`, `bg-white/[n]`, `border-white/[n]`), gradients (`bg-linear-to-*`, `bg-radial-*`, OKLCH interpolation), micro-animations (`@theme { --animate-* @keyframes }`), `@utility` for shared class definitions

**What NOT to use:**
- Google Fonts CDN `<link>` — fails offline in installed PWA; no cross-site cache benefit since Chrome 86
- Framer Motion — ~50KB gzip for hover/fade/slide achievable with Tailwind transitions; add only if layout animations are needed
- `bg-opacity-*` utilities — removed in Tailwind v4; use `/[n]` opacity modifier syntax
- `tailwind.config.js` for animation config — deprecated in v4; use `@theme { @keyframes }` in CSS

**See:** `.planning/research/STACK.md` for full implementation code, version compatibility tables, and integration guides.

### Expected Features

The feature research confirms all redesign elements are P1 (must-have for v1.3 launch) with a small set of P2 items. Every P1 feature has LOW-to-MEDIUM implementation cost relative to its HIGH user value, making the scope tight and realistic. The key dependency is that glassmorphism is invisible against a flat `bg-gray-950` background — the AppShell root must have a subtle gradient tint (`from-gray-950 via-indigo-950/30 to-gray-950`) for the blur effect to show.

**Must have (table stakes for a premium UI upgrade):**
- Inter font via `@fontsource-variable/inter` — typographic foundation; without it, `tabular-nums` has no effect on numeric alignment
- Design system utilities (`@utility glass-card`, `@utility gradient-primary`, `@utility press-scale`, `@utility animate-fade-in`) — token system for consistency
- Glass card treatment on all row components (PersonCard, PersonRow, ItemRow, HistoryRow, AssignmentRow)
- Gradient primary buttons (`from-blue-600 to-violet-600`) on all primary CTAs
- Press-scale micro-interactions (`active:scale-[0.97] transition-transform duration-150 ease-out`) on all interactive elements
- SVG icons above labels in TabBar (icon + label, not icon-only — Apple HIG requires labels for non-universal icons)
- Glass TabBar and SubtotalBar — always-visible signature of the redesign
- Redesigned OnboardingScreen — gradient hero, entrance animation, gradient CTA
- Redesigned ErrorBoundary — consistent with redesign; crashes should not show a plain fallback
- Input focus glow (`focus:ring-2 focus:ring-blue-500/40`)
- Larger bill total typography in SummaryPanel (`text-3xl font-bold tracking-tight`)

**Should have (complete within v1.3 if time allows):**
- Enhanced empty states with decorative SVG icon and ghost-style CTA
- Glass UndoToast
- Gradient tip/tax segmented control active state

**Defer (v2+):**
- Light mode / system color scheme — requires a completely separate design system; Out of Scope per PROJECT.md
- Animated gradient backgrounds — battery drain and GPU cost outweigh benefit for a utility app
- Lottie animations for empty states — adds ~40KB Lottie runtime; SVG illustrations suffice

**Anti-features to actively avoid:**
- Full-bleed glassmorphism on the scroll container — GPU layer promotion for entire scroll area causes dropped frames
- Dark text on glass cards — fails WCAG AA contrast against variable dark backgrounds
- Per-card custom gradients — creates visual noise, defeats hierarchy purpose
- Parallax scroll effects — causes jank on mobile during quick data-entry use case

**See:** `.planning/research/FEATURES.md` for full prioritization matrix, feature dependency graph, and competitor comparison table.

### Architecture Approach

The redesign adds a styling layer on top of the existing architecture with zero changes to the store, engine, hooks, or test files. The strategy is token-first: define all new colors, radii, and animations in a `@theme` block in `src/index.css` before touching any component, so component code references stable token names rather than raw CSS values. Reusable effects are defined with `@utility` (not `@layer components`) so they are overridable by Tailwind utility classes and participate in `hover:` and `active:` variants. The 144 existing tests use exclusively ARIA and text queries — zero `className` assertions — making every CSS change transparent to the test suite as long as ARIA structure and text content are preserved.

The most important architectural constraint: `animate-fade-up` must be applied to individual cards and list items, NOT to panel containers. The AppShell keeps all panels mounted via CSS `hidden` from first render, so animations on panel containers fire invisibly on app load rather than on tab navigation.

**Major components and their change types:**
1. `src/index.css` (EXTENDED) — `@theme` token block with surface colors, accent gradient stops, radius tokens, animation declarations; `@utility glass-card`, `@utility gradient-primary`, `@utility glass-tab-bar`, `@utility press-scale` definitions
2. `src/components/icons/` (8 NEW files) — Typed SVG components: ChevronIcon, CloseIcon, HistoryIcon, PeopleIcon, ItemsIcon, AssignIcon, SplitIcon + barrel `index.ts`; `aria-hidden="true"` on all decorative uses
3. `TabBar.tsx` (VISUAL RESTRUCTURE) — Icon + label layout, `glass-tab-bar`, press feedback; `role="tab"` and `aria-selected` are prop-driven, safe to restructure
4. `PersonCard.tsx` (VISUAL + REFACTOR) — Glass card prototype: `glass-card`, ChevronIcon extraction, `animate-fade-up`; validates pattern before batch-applying to row components
5. All row components, fixed bars, screens (13 MODIFIED files) — Visual-only className updates following PersonCard pattern; ARIA structure unchanged throughout

**Build order (minimizes rework):**
Design tokens → Icon components → TabBar → PersonCard prototype → All row components → SubtotalBar/Toast → OnboardingScreen/SummaryPanel CTAs → Cross-cutting review + test run.

**See:** `.planning/research/ARCHITECTURE.md` for full system diagram, component-by-component integration map, anti-patterns, and test safety analysis.

### Critical Pitfalls

Seven critical pitfalls were identified. All are preventable with upfront decisions; most are invisible in development and only surface in production or on real mobile hardware.

1. **Google Fonts CDN breaks offline mode** — Use `@fontsource-variable/inter` (self-hosted). Workbox's default `globPatterns` only precaches local build artifacts. CDN font requests require explicit `runtimeCaching` config or they silently fail offline. Self-hosting resolves this completely with no extra config.

2. **Backdrop-filter GPU jank on mid-range Android** — Cap blur radius at 8-12px for scroll-adjacent elements. Maximum 4 concurrent blurred elements per viewport. Never animate `backdrop-filter` — fade in via `opacity` only. Verified against shadcn/ui GitHub issue #327 and Chrome GPU compositing documentation.

3. **Glassmorphism fails WCAG contrast on variable backgrounds** — Add `bg-black/40` text-backing layer behind all text in glass cards. Automated tools (Lighthouse, axe-core) do not simulate `backdrop-filter` compositing; contrast must be manually verified against bright content backgrounds (category badges, green/red settlement rows).

4. **`prefers-reduced-motion` not respected (WCAG 2.3.3 violation)** — Add one global CSS reset in `index.css` before any animation: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`. One rule covers all future animations without touching individual components.

5. **Tailwind CSS 4 purges dynamically-constructed class names** — Never use template literals to build class names (`` `bg-${color}-500` ``). Use static lookup maps or `@source inline()`. Verify with `npm run build && npm run preview`, not just `npm run dev`.

6. **Animating layout-triggering CSS properties causes jank** — Only animate `transform` and `opacity` (compositor-only, zero layout/paint cost). Never animate `box-shadow`, `height`, `padding`, or `margin`. For hover shadow effects, use a `::after` pseudo-element with `opacity` transition.

7. **Touch target regression from icon-only buttons** — Never set icon button padding below `p-3` (48px total tap area). Add `min-h-12 min-w-12` as a hard constraint on all interactive elements. The 144 tests do not assert pixel dimensions, so regressions pass CI silently.

**See:** `.planning/research/PITFALLS.md` for full pitfall details, warning signs, recovery strategies, and the "looks done but isn't" checklist.

---

## Implications for Roadmap

The research points to a clear 4-phase sequence based on dependency chains and pitfall timing. Tokens and font must come first; glassmorphism depends on the token system being stable; component work can proceed in parallel once the patterns are proven on PersonCard; animation and screen-level work finalize polish.

### Phase 1: Foundation — Tokens, Font, Design System

**Rationale:** Every other phase depends on this. The `@theme` token block is referenced by all `@utility` definitions; `@utility` definitions are referenced by all components. The font must be self-hosted before any component work or the offline PWA regression is baked into all subsequent code. Establishing the "static class names only" convention here prevents the Tailwind purge pitfall from propagating through all 13 component files. The `prefers-reduced-motion` global reset must also be added here — one rule covers all future animations automatically.

**Delivers:** `@fontsource-variable/inter` imported and configured in `src/main.tsx` and `src/index.css`; `@theme` block with surface colors, accent gradient stops, radius tokens, animation declarations, embedded `@keyframes`; `@utility glass-card`, `@utility gradient-primary`, `@utility glass-tab-bar`, `@utility press-scale`, `@utility animate-fade-in`, `@utility animate-slide-up`; global `prefers-reduced-motion` reset; AppShell root with subtle gradient tint making glass visible.

**Addresses:** Inter font (table stakes), design system utilities (table stakes), gradient background foundation required by glassmorphism

**Avoids:** Pitfall 1 (offline font), Pitfall 2 (dynamic class purge), Pitfall 4 (reduced motion WCAG violation)

**Verify:** Font renders correctly in `npm run build && npm run preview` with DevTools offline mode; `@theme` tokens visible as CSS custom properties on `:root` in DevTools; `@utility` classes apply correctly in a test component.

### Phase 2: Glassmorphism — TabBar, SubtotalBar, PersonCard Prototype

**Rationale:** TabBar is the highest-visibility component and is present on every screen. Fixing token definitions here while scope is limited to one or two components prevents propagating mistakes to all 13 modified files. PersonCard is the most complex card (expandable, has existing CSS grid-rows transition that must coexist with `glass-card`) and should be the prototype before applying the glass pattern to simpler row components. The blur budget MUST be verified on real/throttled hardware before Phase 3 proceeds — if performance is unacceptable, the design must adjust here, not after 13 components are styled.

**Delivers:** `glass-tab-bar` applied to TabBar with icon + label layout using lucide-react components; `glass-card` on SubtotalBar and PersonCard; ChevronIcon extracted to `src/components/icons/`; all 7 icon components in `src/components/icons/` with barrel export; contrast verified against variable backgrounds with `bg-black/40` text-backing confirmed; blur budget verified (max 4 elements, max 12-16px radius).

**Uses:** `@fontsource-variable/inter` (Phase 1), `lucide-react` named imports, `glass-card` and `glass-tab-bar` utilities (Phase 1)

**Addresses:** Glass TabBar (P1 must-have), glass SubtotalBar (P1), glass PersonCard (P1 template), SVG tab icons (P1)

**Avoids:** Pitfall 2 (GPU jank — blur budget set and verified here), Pitfall 3 (contrast failures — tested before propagating to all components)

**Verify:** Chrome DevTools Performance recording with 4x CPU throttle; FPS stays above 50 during scroll; axe-core audit passes on populated screens with colorful content.

### Phase 3: Component Redesign — All Row Components and CTA Buttons

**Rationale:** With the glass pattern proven on PersonCard, applying it to PersonRow, ItemRow, HistoryRow, and AssignmentRow is low-complexity batch work. Touch target validation must happen here since CloseIcon and ChevronIcon replacements are the most common location for touch target regression. All changes are visual-only className updates — zero ARIA structure changes — so the 144-test suite provides a safety net throughout.

**Delivers:** `CloseIcon` replacing `×` glyphs in PersonRow, ItemRow, UndoToast (with `aria-label` kept on `<button>`, not moved to SVG); `ChevronIcon` replacing `▲/▼` glyphs in AssignmentRow; `glass-card` on all row components; `gradient-primary` on all primary CTA buttons (Add Person, Add Item, Save Split, Start New Split, Onboarding CTA, UPI payment buttons); input `focus:ring-2 focus:ring-blue-500/40` glow; press-scale micro-interactions on all interactive elements; `min-h-12 min-w-12` constraint validated on all icon-only buttons.

**Addresses:** Glass row components (P1), gradient buttons (P1), press-scale interactions (P1), input focus glow (P1), all icon component integrations

**Avoids:** Pitfall 5 (touch target regression — icon-only buttons validated here), Anti-Pattern 3 (aria-label kept on button, not moved to SVG icon)

**Verify:** `npm run test` — 144/144 passing; Chrome DevTools accessibility tree shows all icon-only buttons with accessible names; bounding rects >= 44px on all interactive elements.

### Phase 4: Screens, Animation Polish, and QA

**Rationale:** OnboardingScreen and ErrorBoundary are self-contained and can absorb the most dramatic visual treatment without risk to the main app flow. Entrance animations are added last because the "animate only individual cards, not panel containers" constraint requires understanding how all components are mounted (the `hidden` panel pattern). This phase also runs the full "looks done but isn't" verification checklist before the milestone is considered shipped.

**Delivers:** Redesigned OnboardingScreen (gradient hero, `animate-fade-up` entrance animation, `gradient-primary` CTA); redesigned ErrorBoundary (consistent gradient hero); enhanced empty states with decorative SVG and ghost-style CTA; glass UndoToast; larger bill total typography (`text-3xl font-bold tracking-tight tabular-nums`); gradient segmented control active state; `animate-fade-up` on individual cards and list items (NOT panel containers); full test suite green (144/144); Lighthouse PWA audit passed.

**Addresses:** Onboarding redesign (P1), ErrorBoundary (P1), empty states (P2), glass toast (P2), bill total typography (P1), segmented control gradient (P2)

**Avoids:** Pitfall 6 (layout-triggering animation jank — entrance animations use `transform`/`opacity` only), Anti-Pattern 4 (animate individual cards, not panel containers which mount invisibly on app load)

**Verify:** Full "looks done but isn't" checklist from PITFALLS.md — offline font, production build colors, contrast on all backgrounds, touch targets on physical device, blur FPS under throttle, reduced motion with OS setting enabled, service worker update after deploy, `will-change` cleanup after animations, SVG bundle size below Vite 500KB warning.

### Phase Ordering Rationale

- **Tokens before components:** The `@theme` and `@utility` definitions are the single source of truth. Components touching glass effects before these are stable will need rework when token names change.
- **TabBar before row components:** TabBar is visible on every screen; issues surface immediately, limiting blast radius during token iteration.
- **PersonCard as prototype before batch work:** PersonCard has an existing CSS grid-rows transition that must coexist with `glass-card`. Using it as the prototype surfaces compatibility issues before batch-applying to 12 simpler components.
- **Screens and animations last:** OnboardingScreen and animation polish are additive with no dependencies. Doing them last allows the full pattern library to be stable and verified before applying the most dramatic changes.
- **Font and reduced-motion in Phase 1:** Both are "configure once, cover everything" interventions. If delayed to Phase 2 or 3, every shipped component in Phase 2+ has the regression baked in with no easy retrofit.

### Research Flags

Phases with standard, well-documented patterns (skip additional research — implementation path is clear):
- **Phase 1 (Foundation):** Tailwind `@theme` and `@utility` patterns are official, fully documented with code examples. `@fontsource-variable/inter` integration is documented with step-by-step code in STACK.md. `prefers-reduced-motion` global reset is a single known CSS pattern.
- **Phase 3 (Row Components):** All changes are visual-only className updates following the PersonCard pattern established in Phase 2. Zero architectural decisions remain.
- **Phase 4 (Animation Polish):** Entrance animation patterns are defined with code examples in STACK.md and ARCHITECTURE.md. `@starting-style` CSS alternative is documented if JavaScript-free entry animation is preferred.

Phases requiring verification checkpoints before proceeding (not additional research, but hardware testing):
- **Phase 2 exit gate:** Blur budget verification on real/throttled hardware is mandatory before Phase 3 proceeds. If 4 simultaneous glass elements cause jank, PersonCards need lighter blur (8px vs 12px) and the design decision must be made before propagating to all row components.
- **Phase 2 exit gate:** axe-core contrast audit on all screens with populated data must pass before Phase 3. Adding `bg-black/40` text-backing to 13 components after the fact is significantly more painful than establishing it in the PersonCard prototype.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technology recommendations sourced from official Tailwind CSS 4 docs, npm registry, and official Fontsource/Lucide documentation. Versions confirmed current. No guesswork. |
| Features | MEDIUM-HIGH | Table stakes features are HIGH confidence (Apple HIG, NNGroup, Material Design 3 are authoritative). Aesthetic judgments (blue-to-violet gradient as "premium") are MEDIUM — design ecosystem analysis, not controlled user testing. |
| Architecture | HIGH | Based on direct inspection of the existing codebase: `src/index.css`, `TabBar.tsx`, `PersonCard.tsx`, all test files. The 144-test ARIA structure, the `hidden` panel pattern, and Tailwind CSS 4 `@utility` vs `@layer` distinctions are all verified against actual source and official docs. |
| Pitfalls | HIGH | All critical pitfalls verified against MDN, official Tailwind docs, Workbox docs, and real-world issue trackers (shadcn/ui GitHub #327 for backdrop-filter jank; Workbox GitHub #1563 for offline font failure; Tailwind Labs discussions for class purging). No speculation. |

**Overall confidence:** HIGH

### Gaps to Address

- **Blur budget on real Android hardware:** The "4 elements, 12px max" rule is derived from documented sources, but the exact threshold for this app's specific layout (TabBar + SubtotalBar fixed, plus 3-6 PersonCards in scroll area) needs verification on real mid-range hardware or Chrome DevTools 4x CPU throttle. If jank occurs, PersonCards drop to 8px blur while fixed bars retain 16px. This is a Phase 2 exit gate, not an unknown.

- **Inter font FOUT on cold first load:** `@fontsource-variable/inter` eliminates FOUT on repeat visits (precached by service worker). On the very first cold load before the service worker activates, there may be a brief system font flash. Fontsource's `font-display: swap` handles this, but severity should be confirmed post-build on a throttled connection. Low risk — acceptable in most cases.

- **Gradient text on bill total at small screen sizes:** `bg-clip-text text-transparent` with a gradient is deferred to v1.x (P3) because it needs validation that the gradient renders acceptably across all phone screen sizes. Flagged as a validation gap for Phase 4 QA or a v1.x follow-up.

- **`lucide-react` vs inline SVG for tab icons:** STACK.md recommends `lucide-react` named imports; FEATURES.md research recommends inline SVG to avoid adding a dependency for only 5 icons. The final call is FEATURES.md's inline SVG recommendation if icon count stays at 5; if more icons are needed elsewhere in the app, switching to `lucide-react` is correct. This decision should be made at the start of Phase 2 and applied consistently.

---

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS 4 official docs — backdrop-filter-blur, animation, theme, upgrade guide](https://tailwindcss.com/docs/) — blur scale rename, `@theme`/`@utility` patterns, opacity modifier changes, `@layer` removal, `@starting-style` support
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — gradient APIs, color-mix(), OKLCH interpolation
- [Fontsource Inter install guide](https://fontsource.org/fonts/inter/install) — variable font package, import pattern, font-feature-settings
- [@fontsource-variable/inter on npm](https://www.npmjs.com/package/@fontsource-variable/inter) — v5.2.8 confirmed current
- [lucide-react on npm](https://www.npmjs.com/package/lucide-react) — v0.575.0 confirmed current, 29.4M weekly downloads
- [Apple Human Interface Guidelines — Tab Bars](https://developer.apple.com/design/human-interface-guidelines/components/navigation-and-search/tab-bars) — icon+label pattern, filled/outline active state convention
- [Nielsen Norman Group — Glassmorphism](https://www.nngroup.com/articles/glassmorphism/) — effective vs gimmicky, overuse pitfalls, spatial hierarchy
- [Material Design 3 — Elevation in dark themes](https://m3.material.io/styles/elevation/applying-elevation) — lightness as elevation, three-layer hierarchy
- [MDN — backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) — GPU compositing, browser support, `-webkit-` prefix status
- [web.dev — High-performance CSS animations](https://web.dev/articles/animations-guide) — compositor-only animation rule (transform + opacity only)
- [Vite PWA — Workbox generateSW and runtimeCaching](https://vite-pwa-org.netlify.app/workbox/generate-sw) — CDN font caching configuration
- [WCAG 2.2 — SC 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — 4.5:1 body text, 3:1 UI components
- [WCAG 2.2 — SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — 24x24px minimum, 48x48px recommended
- [WCAG 2.3.3 — Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) — prefers-reduced-motion obligation
- [Inter typeface official site](https://rsms.me/inter/) — tabular figures (tnum), UI design rationale, variable font axis
- Existing codebase — `src/index.css`, `src/components/layout/TabBar.tsx`, `src/components/summary/PersonCard.tsx`, all 8 test files (direct inspection)

### Secondary (MEDIUM confidence)
- [shadcn/ui GitHub issue #327 — backdrop-filter causes severe lag](https://github.com/shadcn-ui/ui/issues/327) — real-world Android GPU jank confirmation on Snapdragon 665-class hardware
- [Workbox GitHub issue #1563 — Google fonts not rendering offline](https://github.com/GoogleChrome/workbox/issues/1563) — CDN font offline failure pattern documented
- [Should you self-host Google Fonts?](https://www.tunetheweb.com/blog/should-you-self-host-google-fonts/) — CDN cache partitioning since Chrome 86, zero cross-site caching benefit
- [Tailwind Labs GitHub discussion #16434 — @utility vs @layer components](https://github.com/tailwindlabs/tailwindcss/discussions/16434) — variant support, specificity differences
- [Tailwind Labs GitHub discussion #16592 — Safelist in v4](https://github.com/tailwindlabs/tailwindcss/discussions/16592) — `@source inline()` as safelist replacement
- [Glassmorphism performance — implementation guide](https://playground.halfaccessible.com/blog/glassmorphism-design-trend-implementation-guide) — GPU constraint details, blur radius cost scaling
- [Making PWAs feel native](https://www.gfor.rest/blog/making-pwas-feel-native) — press animation timing: scale 0.97, 150ms, ease-out
- [Axess Lab — Glassmorphism accessibility](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/) — contrast failure patterns with variable backgrounds
- [UX Planet — Bottom tab bar navigation best practices](https://uxplanet.org/bottom-tab-bar-navigation-design-best-practices-48d46a3b0c36) — icon+label vs icon-only, consistent with Apple HIG

### Tertiary (LOW confidence — design ecosystem analysis)
- [React Icon Libraries Bundle Size Benchmark 2026](https://medium.nkcroft.com/the-hidden-bundle-cost-of-react-icons-why-lucide-wins-in-2026-1ddb74c1a86c) — Lucide vs Heroicons tree-shaking benchmark; used for library selection rationale
- [Button press animation — scale values](https://animations.dev/learn/animation-theory/the-easing-blueprint) — 0.97 scale, ease-out practitioner consensus; corroborated by Josh Comeau and Emil Kowalski references
- Blue-to-violet as "premium dark UI" gradient — inferred from design ecosystem analysis (Linear, Vercel, Stripe, Apple Vision Pro); no controlled user study; MEDIUM confidence for the palette choice itself

---
*Research completed: 2026-02-24*
*Ready for roadmap: yes*
