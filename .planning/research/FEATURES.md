# Feature Research

**Domain:** Dark-themed PWA visual redesign — v1.3 UI Redesign milestone
**Researched:** 2026-02-24
**Confidence:** MEDIUM-HIGH — visual design patterns verified against NNGroup, Apple HIG, Material Design 3, Tailwind CSS docs, and multiple practitioner sources. CSS specific values are HIGH confidence. Subjectivity in aesthetic judgments means some recommendations are MEDIUM confidence.

---

## Milestone Scope

This research covers **only the visual redesign features** in v1.3. The full functional feature set (v1.0–v1.2) is already shipped and not re-evaluated here. The codebase uses React 19, Tailwind CSS 4, and already has a dark theme with `bg-gray-950` root, `bg-gray-900` cards, and `border-gray-800` borders.

**Design questions under research:**
1. Glassmorphism — what makes it effective vs gimmicky, common pitfalls
2. Gradient buttons — color combinations that work for dark themes
3. Micro-interactions — press/tap animations that feel native on mobile
4. Card depth hierarchy — creating visual layers in dark themes
5. Font choices for financial/money apps
6. Tab bar design patterns — icon+label vs icon-only, active state treatment

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features expected when upgrading from "plain" to "premium" UI. Missing these leaves the redesign feeling incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Custom font (not system default) | System fonts (San Francisco, Roboto) signal "unfinished product." A named font signals intentional design. | LOW | Inter from Google Fonts CDN. Single `<link>` in `index.html` + one CSS variable. Already in PROJECT.md requirements. |
| Consistent visual depth — elevated cards vs flat background | Without visual layers, all content feels equally important. Users expect cards to "float" above backgrounds, modals to sit above cards. | LOW | In dark themes, elevation is shown via lightness — not shadows. Lighter surface = closer to user. Three levels needed: background (gray-950), card (glass surface), active elements. See Architecture section below. |
| Active/pressed state on all interactive elements | Every button, card tap, and tab tap must visually respond to touch. Missing this = app feels broken on mobile. | LOW | `active:scale-[0.97]` + CSS `transition` (150ms, ease-out). Transform-based — GPU-composited, never causes layout reflow. |
| Identifiable active tab | Users must always know where they are. Plain text color change alone is too weak a signal. | LOW | Active tab: filled icon variant + brand color text + border indicator. Inactive: outlined icon + gray-400. See Tab Bar section below. |
| Gradient primary action button | Gradient CTAs are now the industry standard for "premium" dark UIs (Apple, Stripe, Linear, Vercel all use them). Flat gray buttons feel developer-default. | LOW | `from-blue-600 to-violet-600` linear gradient. Hover: `from-blue-500 to-violet-500`. Active: scale-[0.97]. |
| Focus glow on inputs | Keyboard and accessibility users expect a visible focus ring. A glowing focus ring (rather than a browser default outline) signals visual polish. | LOW | `focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-0 focus:outline-none` — a soft teal/blue glow that matches the gradient palette. |

### Differentiators (Competitive Advantage)

Features that elevate the app from "good Tailwind defaults" to "consumer-grade design."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Glassmorphism cards with selective application | Glass cards on a dark gradient background create the premium "Apple Weather / Control Center" depth feeling. Applied selectively (cards, tab bar, toasts) — not everything. | MEDIUM | `bg-white/[0.05]` + `backdrop-blur-xl` + `border border-white/10`. The blur must be applied to fewer than 4 concurrent elements to avoid GPU jank on mid-range phones. Do NOT glass the scroll container — only leaf components. |
| Gradient hero on onboarding and error screens | The first screen a user sees is the lasting brand impression. A gradient background (blue-950 → violet-950) with large typography signals consumer app vs utility tool. | LOW | CSS `background: linear-gradient(135deg, #1e1b4b, #0c0a1a)` — indigo/violet dark gradient. Apply to OnboardingScreen and ErrorBoundary only. |
| SVG tab icons above labels | Icons above labels is the iOS standard and reduces the cognitive load of decoding icon meaning alone. The existing tab bar is text-only — adding icons brings it in line with native app conventions. | LOW-MEDIUM | Need 5 icons: History (clock), People (users), Items (receipt), Assign (link/grid), Split (split/fork). Use outline SVG (inactive) and filled SVG (active). Size: 20×20px. |
| Micro-animation on card expand/collapse | The existing PersonCard uses CSS grid-rows transition for expand/collapse — this is already correct. Enhancing it with an eased opacity fade on the content makes it feel more like native iOS. | LOW | Already implemented in `PersonCard.tsx` with `duration-200 ease-out`. Add `opacity-0` to `0fr` state and `opacity-100` to `1fr` state. |
| Slide-up entrance animation for panels | Panels that slide up from below on mount feel native (iOS sheet presentation). Applied only once on first mount, not on every tab switch (which would be jarring). | LOW-MEDIUM | `@keyframes slideUp { from: translateY(16px) + opacity 0; to: translateY(0) + opacity 1 }` — 250ms ease-out. Apply via `animate-slide-up` Tailwind utility. Use `@utility` in Tailwind 4 CSS. |
| Glass toast notifications | The existing `UndoToast` uses a solid background. A glass toast floats more elegantly above content — matches the glassmorphism card treatment. | LOW | Same glass recipe as cards. Fixed position, centered, `z-50`. |
| Larger bill total typography in Summary | The total amount is the most important number in a bill-splitting app. Making it visually dominant (3xl+ with tracking-tight) focuses user attention on the most critical output. | LOW | `text-3xl font-bold tracking-tight tabular-nums text-white` for the total. Gradient text optional: `bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent`. |
| Gradient tip/tax segmented controls (active segment) | The existing `TipSegmentedControl` uses a plain blue button for the active segment. A gradient active state matches the primary button treatment and reinforces a consistent design language. | LOW | Active segment: `from-blue-600 to-violet-600` (same gradient as primary button). Inactive: `bg-white/5`. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full-bleed glassmorphism on the scroll container (AppShell background) | "Make everything glass" — maximum premium feel | Applying `backdrop-filter: blur()` to a scrolling container triggers GPU layer promotion for the entire scroll area. On mid-range Android phones this causes dropped frames during scroll. The NNGroup also flags "overuse" as the primary way glassmorphism becomes gimmicky. | Apply glass only to fixed-position elements (TabBar, SubtotalBar, toast) and individual cards. Never glass the scroll container. |
| Animated gradient backgrounds (moving gradients behind glass cards) | Creates depth and dynamism | Animating gradients via CSS (`@keyframes` on `background-position`) is GPU-intensive and drains battery. It competes visually with the glass effect, making text harder to read. | Use a static gradient background. The motion budget should go to micro-interactions (button press scale, card expand) — not the background. |
| Dark text on glass cards | Looks subtle and readable in design tool previews | Glass cards on a dark background have low contrast (often under 3:1). Dark text on glass fails WCAG AA contrast requirements and becomes unreadable in bright sunlight (real-world restaurant table scenario). | Always use `text-gray-100` or `text-white` on glass surfaces. Use `text-gray-400` for secondary labels only. |
| Neumorphism (extruded raised card effect) | Trendy alternative to glassmorphism | Neumorphism requires very low contrast by design, which fails WCAG AA accessibility. On dark backgrounds it's nearly invisible. The style is also already past its peak (2020 trend). | Glassmorphism with a proper white/black border at low opacity creates depth without accessibility failure. |
| Per-card custom gradients (each card a different color) | Visual variety | Creates visual noise. Users can't use color to scan for meaning — the colors are decorative. Every card having a different color defeats the purpose of visual hierarchy. | One consistent glass card style. Reserve gradient treatment for primary actions and hero screens only. |
| Parallax scroll effects | "Depth" feel | Causes scroll jank on mobile (`position: sticky` + transform on scroll events). The restaurant-table use case involves quick data entry, not leisurely scrolling. | Entrance animations (single play on mount) instead of continuous scroll-tied effects. |
| Light mode toggle | Some users "need it" | The entire visual system (glassmorphism, gradient buttons) is designed for dark backgrounds. A light mode would require a completely different design system and is explicitly Out of Scope in PROJECT.md. | Respect system preference only via `prefers-color-scheme` if added in a future milestone. |

---

## Feature Dependencies

```
[Inter font via Google Fonts CDN]
    └──required by──> [Tabular numeral display for amounts]
    └──required by──> [Consistent brand typography across all screens]

[Static gradient background (indigo-950 → violet-950 on key screens)]
    └──required by──> [Glassmorphism cards]
                          (glass effect is invisible without a colorful background to blur through)

[Glassmorphism card utility (.glass-card)]
    └──required by──> [Glass tab bar treatment]
    └──required by──> [Glass toast notifications]
    └──required by──> [Glass person cards (PersonCard)]
    └──required by──> [Glass history rows (HistoryRow)]

[SVG icon set (5 icons for TabBar)]
    └──required by──> [TabBar icon+label redesign]

[Press-scale micro-interaction (@utility .press-scale)]
    └──applied to──> [All buttons (primary, secondary, remove)]
    └──applied to──> [Tab bar buttons]
    └──applied to──> [Card headers (PersonCard, HistoryRow)]

[Gradient primary button utility (.gradient-primary)]
    └──required by──> [Consistent CTA treatment: Save Split, Add Person, Start New Split, Onboarding CTA]

[Gradient segmented control active segment]
    └──depends on──> [Gradient primary button] (same color token: blue-600 → violet-600)

[Slide-up animation (@utility .animate-fade-in or .animate-slide-up)]
    └──applied to──> [Panel content on mount]
    └──applied to──> [Onboarding screen hero]
```

### Dependency Notes

- **Glass requires a gradient background:** Glassmorphism is invisible against `bg-gray-950` (pure dark, no hue). The background behind glass elements must have color for the blur to look like frosted glass rather than a smudged gray. Apply `bg-gradient-to-br from-gray-950 via-indigo-950/30 to-gray-950` to the AppShell root — subtle enough not to distract, enough to make glass visible.
- **Inter font must load before tabular-nums is meaningful:** Without Inter, the browser falls back to a system font that may not have proper tabular figure support. Declare Inter first in the CSS cascade (`font-family: 'Inter', system-ui, sans-serif`).
- **Press-scale conflicts with animated transforms:** Do not apply `press-scale` to elements that are also receiving slide-up or fade-in animations. The transforms stack multiplicatively and create visual glitches. Apply entrance animations to wrapper elements, press-scale to inner interactive elements.
- **Backdrop-filter on TabBar is independent of card blur:** The TabBar uses `position: fixed` which creates its own GPU stacking context. Glass on TabBar does not compound with glass on cards during scroll. This is safe.

---

## MVP Definition for v1.3

### Launch With (v1.3 — all are this milestone)

- [ ] **Inter font** — Google Fonts CDN, `font-family: 'Inter', system-ui, sans-serif` in CSS, `font-feature-settings: 'tnum'` for amount displays. Essential: without this, the redesign lacks its typographic foundation.
- [ ] **Design system utilities in CSS** — `@utility glass-card`, `@utility gradient-primary`, `@utility press-scale`, `@utility animate-fade-in` defined once in `index.css` and applied across the app. Essential: establishes the token system that makes the rest of the redesign consistent.
- [ ] **Glass card treatment on all row components** — PersonRow, ItemRow, HistoryRow, AssignmentRow, PersonCard. Each gets `bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl`. Essential: this is the most visible change in the redesign.
- [ ] **Gradient primary buttons** — All primary CTAs (Add Person, Add Item, Save Split, Start New Split, Onboarding CTA) use `from-blue-600 to-violet-600`. Essential: the most immediately visible upgrade.
- [ ] **Press-scale on all interactive elements** — `active:scale-[0.97] transition-transform duration-150 ease-out` on all buttons, tab bar items, and card headers. Essential: makes the app feel tactile and native.
- [ ] **SVG icons in TabBar above labels** — Filled vs outline icon variants for active vs inactive state. Essential: upgrades from text-only tab bar to native iOS convention.
- [ ] **Glass TabBar and SubtotalBar** — Fixed bars get the glass treatment. Essential: these are always visible, so they're the persistent visual signature of the redesign.
- [ ] **Redesigned OnboardingScreen** — Gradient hero background, large headline, gradient CTA button, entrance animation. Essential: first impression.
- [ ] **Redesigned ErrorBoundary** — Same gradient hero, error icon, "Reload App" gradient button. Essential: consistency, and crashes shouldn't show an ugly fallback in a polished app.
- [ ] **Enhanced empty states** — Decorative SVG icon, warmer secondary text, ghost-style CTA. Essential: visible on fresh install and between splits.
- [ ] **Glass toast (UndoToast)** — Glass treatment matching card style. Launch with: consistent with the rest of the redesign.
- [ ] **Input focus glow** — `focus:ring-2 focus:ring-blue-500/40` on all text inputs. Launch with: without this, inputs look out of place among the glassy cards.
- [ ] **Larger bill total in SummaryPanel** — `text-3xl font-bold tracking-tight`. Launch with: the total is the most important output.

### Add After Validation (v1.x)

- [ ] **Gradient text on bill total** — `bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent`. Optional enhancement after validating the base total size upgrade works across screen sizes.
- [ ] **Haptic feedback via Vibration API** — `navigator.vibrate(10)` on primary button press for physical tactility on Android. Add only after basic press-scale is shipped and validated. iOS Safari does not support Vibration API.

### Future Consideration (v2+)

- [ ] **Light mode / system color scheme** — Requires a fully separate design system. Out of Scope per PROJECT.md.
- [ ] **Animated gradient backgrounds** — Battery drain and GPU cost outweigh benefit for a utility app.
- [ ] **Lottie animations for empty states** — Adds ~40KB Lottie runtime dependency. SVG illustrations suffice for this use case.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Inter font | HIGH | LOW | P1 |
| Design system utilities (CSS) | HIGH | LOW | P1 |
| Gradient primary buttons | HIGH | LOW | P1 |
| Press-scale micro-interactions | HIGH | LOW | P1 |
| Glass cards (all row components) | HIGH | MEDIUM | P1 |
| SVG tab icons + icon/label tab bar | HIGH | MEDIUM | P1 |
| Glass TabBar + SubtotalBar | HIGH | LOW | P1 |
| Redesigned OnboardingScreen | HIGH | LOW | P1 |
| Input focus glow | MEDIUM | LOW | P1 |
| Larger bill total typography | MEDIUM | LOW | P1 |
| Redesigned ErrorBoundary | MEDIUM | LOW | P1 |
| Enhanced empty states | MEDIUM | LOW | P2 |
| Glass toast notifications | MEDIUM | LOW | P2 |
| Gradient tip/tax segmented controls | LOW | LOW | P2 |
| Gradient text on bill total | LOW | LOW | P3 |
| Haptic feedback (Vibration API) | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for v1.3 launch
- P2: Should have; add in same milestone if time allows
- P3: Nice to have, future consideration

---

## Research: The Six Design Questions

### 1. Glassmorphism — Effective vs Gimmicky

**What makes it effective (MEDIUM-HIGH confidence):**

Glassmorphism works when it communicates a genuine spatial relationship — the frosted glass card floats above a richer background. The NNGroup's canonical guidance: "thoughtful use of glassmorphism can help designers effectively establish visual hierarchy and depth." The Apple use cases that made it famous (Control Center, Notification Center, Lock Screen widgets) all apply it to elements that literally float over a photo or gradient — the blur shows the background is real.

**What makes it gimmicky:**
- Applying it to everything. If the entire page is glass, there's no "behind" to blur — the effect becomes decorative noise.
- Blurring over a flat dark background. `backdrop-filter: blur()` on a `bg-gray-950` surface produces a gray smear, not frosted glass. The background must have visible texture or color for the blur to look like anything.
- Poor text contrast. Glass surfaces inherently reduce contrast. White text at `text-white` (100% opacity) on `bg-white/[0.05]` clears WCAG AA. Gray text at `text-gray-400` on glass is marginal and must be tested.

**The correct approach for this app:**
Apply glass to **fixed-position elements** (TabBar, SubtotalBar) and **card components** (PersonCard, PersonRow, ItemRow, HistoryRow, AssignmentRow). Never apply to the scroll container. Never apply to the `AppShell` background. Add a subtle gradient tint to the `AppShell` background (`from-gray-950 via-indigo-950/20 to-gray-950`) — this is the background that gets blurred through.

**Performance constraint (HIGH confidence, documented from multiple sources):**
- Limit concurrent blur elements to 3–4 per viewport on mobile. In this app, the visible viewport at any time shows: TabBar (fixed), SubtotalBar (fixed), and 3–6 card rows in the scroll area. This is within the safe range.
- Reduce blur radius on mobile: `backdrop-blur-lg` (16px) rather than `backdrop-blur-2xl` (40px). Larger blur radii increase GPU cost nonlinearly.
- Never animate elements that have `backdrop-filter` — static glass only.
- The `-webkit-` prefix remains mandatory for Safari/iOS: Tailwind's `backdrop-blur-*` utilities already include it.

**Tailwind 4 implementation (HIGH confidence):**
```css
/* index.css — define once */
@utility glass-card {
  background-color: rgb(255 255 255 / 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 0.75rem; /* rounded-xl */
}
```

Usage in JSX: `className="glass-card"` — no long Tailwind class chains on every component.

---

### 2. Gradient Buttons — Color Combinations for Dark Themes

**The winning combination for this app (MEDIUM confidence — based on design ecosystem analysis):**

`from-blue-600 to-violet-600` (left to right, or top-left to bottom-right for a 135° angle).

Why this specific palette:
- Blue-to-violet is the dominant gradient in premium dark-theme apps in 2024–2025: Linear, Vercel, Stripe's dark marketing pages, and the Apple Vision Pro UI all use variations of this range.
- Blue communicates "primary action / trustworthy" — appropriate for a financial app.
- Violet communicates "premium / designed" without straying into aggressive red or attention-grabbing orange.
- On a `bg-gray-950` background, blue-600 (oklch ~50% lightness) is bright enough to read as a primary action without screaming.

**States:**
- Default: `bg-gradient-to-r from-blue-600 to-violet-600`
- Hover (desktop): `from-blue-500 to-violet-500` (one step lighter; communicates "you can click this")
- Active/pressed: `scale-[0.97]` (same gradient, just scaled down — no color change on press)
- Disabled: `from-gray-700 to-gray-700` (flat gray, no gradient — clearly non-actionable)

**Tailwind 4 implementation:**
```css
@utility gradient-primary {
  background-image: linear-gradient(to right, var(--color-blue-600), var(--color-violet-600));
  color: white;
  font-weight: 600;
}

@utility gradient-primary:hover {
  background-image: linear-gradient(to right, var(--color-blue-500), var(--color-violet-500));
}
```

**Text on gradient buttons:** Always white (`text-white`). Never dark text — the blue/violet gradient has insufficient contrast for dark text at WCAG AA.

**Secondary buttons:** Glass style: `bg-white/10 border border-white/15 text-gray-100 hover:bg-white/15`. This is the "ghost glass" button — it sits on the same visual plane as the cards.

---

### 3. Micro-Interactions — Press/Tap Animations for Native Mobile Feel

**The core pattern (HIGH confidence — verified against multiple authoritative sources including gfor.rest PWA guide and NNGroup research):**

Scale on press: `transform: scale(0.97)` on `:active` pseudo-class.

Why 0.97 specifically:
- 0.95 is too dramatic — the button appears to "collapse," which reads as a bug on small elements
- 0.97 is subtle enough to not distract from content but clear enough that users perceive the response
- Tested as the industry consensus value (Josh Comeau, Emil Kowalski, and Material Design 3 all converge on 2–4% scale reduction)

**Timing:**
- Duration: 150ms for press-down (immediate response = native feel)
- Easing: `ease-out` (decelerates into pressed state, matching physical button physics)
- Release: the `transition` runs forward — the button snaps back at the same speed, which feels natural

**Implementation:**
```css
@utility press-scale {
  transition: transform 150ms ease-out;
}
@utility press-scale:active {
  transform: scale(0.97);
}
```

Or as Tailwind classes: `transition-transform duration-150 ease-out active:scale-[0.97]`

**Important note on `:hover` vs `:active` on mobile:**
`:hover` is a mouse concept. On mobile browsers, `:hover` fires on tap and stays "stuck" until the user taps elsewhere. Never use `:hover` for visual transformations that should only show during touch. Use `:active` exclusively for touch feedback.

**Where to apply:**
- All `<button>` elements (primary, secondary, remove, copy, payer selector)
- Tab bar buttons
- Card headers that are tappable (PersonCard, HistoryRow)
- Segmented control segments

**Where NOT to apply:**
- Non-interactive text labels
- Input fields (scale on a text input during typing would be extremely disorienting)
- Elements with `backdrop-filter` — animating transforms on glass elements can cause Safari rendering glitches

---

### 4. Card Depth Hierarchy — Visual Layers in Dark Themes

**The problem with dark themes:** Standard box-shadows are near-invisible against dark backgrounds. A 4px 8px 0px rgba(0,0,0,0.5) shadow on a `bg-gray-900` card against a `bg-gray-950` background is imperceptible — the black shadow disappears into the dark background.

**The solution (HIGH confidence — Material Design 3 documented pattern, confirmed by multiple design systems):**

Use **lightness as elevation**. In dark themes, closer surfaces are lighter. This inverts the light-theme model where shadows convey closeness.

**Three-layer hierarchy for this app:**

| Layer | Purpose | CSS Value |
|-------|---------|-----------|
| Layer 0: Background | Root surface | `bg-gray-950` (#030712) |
| Layer 1: Cards / rows | Content surfaces | `bg-white/[0.05]` with glass (≈ equivalent to ~#0d1117) |
| Layer 2: Active elements, focused inputs | Elements above cards | `bg-white/[0.10]` — inputs on focus, selected segmented control segment |
| Layer 3: Overlays, modals, toasts | Above all content | `bg-gray-900/90 backdrop-blur-xl` — solid dark glass |

**Separating layers without visible shadows:**

Use `border border-white/[0.08]` (white at 8% opacity) on cards. This creates a subtle highlight edge that reads as the card edge catching ambient light — the same trick Apple uses in iOS glass elements. No `box-shadow` needed.

**Do not use:**
- `box-shadow` with black — disappears in dark themes
- `box-shadow` with white — looks like a glow artifact, not depth
- More than 3 visual layers per viewport — users can't perceive 5+ levels of depth in a dark UI

---

### 5. Font Choices for Financial/Money Apps

**Recommendation: Inter (HIGH confidence)**

Rationale:
- Inter was designed by Rasmus Andersson specifically for UI screens. Its design priorities are exactly what a financial app needs: large x-height for readability at small sizes, consistent stroke width across weights, and explicit OpenType feature support for tabular numerals.
- **Tabular numerals (`tnum`) are the critical feature.** In a bill-splitting app, amounts appear in lists: `$12.50`, `$8.00`, `$147.30`. Without tabular figures, these numbers have varying character widths, causing columns to shift and making amounts hard to scan. Inter's `tnum` feature makes all digit widths identical, so columns align perfectly.
- Inter ships with a variable font (single file for all weights and widths) — one CDN request, no FOUT flash from multiple font files.
- It is already the most-used UI font in 2024–2025 across Stripe, Linear, Vercel, Notion, Supabase. Users unconsciously associate it with "polished web app."

**How to load it:**
```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**How to apply tabular numerals for money:**
```css
/* index.css — global */
:root { font-family: 'Inter', system-ui, sans-serif; }

/* For any element displaying currency amounts */
.amount { font-variant-numeric: tabular-nums lining-nums; }
/* OR Tailwind class: tabular-nums (already used in PersonCard.tsx — correct) */
```

The existing codebase already uses `tabular-nums` Tailwind class on `PersonCard.tsx` amounts — this is correct. The upgrade is ensuring Inter loads so the `tnum` OpenType feature is actually available.

**Inter Display alternative for large headline amounts:** For the bill total at `text-3xl` and above, `Inter Display` (a wider-spacing variant designed for display sizes) is slightly more elegant. However, the standard Inter at `tracking-tight` is a correct and simpler substitute for this app's scale.

**Alternatives considered:**
- **Geist (Vercel):** Slightly softer, rounder apertures. Excellent font, but not available on Google Fonts CDN (requires npm install). Adds a build dependency for a stylistic preference. Not worth it when Inter achieves the same goals.
- **Manrope:** Better native tabular figure support for financial data per specialist research. However, it has a less established ecosystem and lacks the brand recognition of Inter. Use only if Inter's numeral rendering proves unsatisfactory in testing.
- **DM Sans:** Good for small labels, but its geometric construction makes larger amounts feel less "financial" and more "playful." Wrong tone for a bill-splitting app.

---

### 6. Tab Bar Design — Icon+Label vs Icon-Only, Active States

**Icon + Label: the correct choice for this app (HIGH confidence — Apple HIG, NNGroup, and multiple UX practitioner sources all agree)**

Rationale:
- The five tabs are: History, People, Items, Assign, Split. "History," "Assign," and "Split" are not universally recognizable icons without labels. A clock icon alone could mean "timer" or "schedule." A split/fork icon could mean "git fork" or "share." Labels remove ambiguity.
- Apple's HIG explicitly states: tab bars should "always include a label" and only allow label omission when icons are "universally recognizable." None of the five tabs in this app meet that bar.
- The existing TabBar uses text labels only. Adding SVG icons above the labels (not replacing them) improves the tab bar without regression.

**Active state treatment (MEDIUM-HIGH confidence — Apple HIG + practitioner consensus):**

The most effective convention (used by Apple native apps, Instagram, Twitter):
- **Active tab:** Filled/solid icon + brand color (`text-blue-400`) + top border indicator
- **Inactive tab:** Outline/stroke icon + muted color (`text-gray-500`)
- **Background:** Glass tab bar (`bg-gray-900/80 backdrop-blur-xl`) with top border (`border-t border-white/10`)

This is already partially implemented (the `text-blue-400` and `border-t-2 border-blue-400` active classes exist in the current `TabBar.tsx`). The upgrade is adding SVG icons above the labels and applying glass to the tab bar background.

**Sizing:**
- Icon size: 20×20px — the documented sweet spot (24px feels large for a 5-tab bar; 16px is too small to tap)
- Label size: `text-xs` (10–11px) — consistent with iOS tab bar label sizing
- Tab height: `min-h-14` (56px) — taller than the current `min-h-12` (48px) to accommodate icon+label stacked vertically
- Total tab bar height including safe area: adds `pb-safe` (env(safe-area-inset-bottom)) for iPhone notch/home-indicator

**Filled vs outline icon source:**
- Heroicons (MIT license) or Lucide React (ISC license) — both have filled and outline variants for all needed icons
- Lucide React is already a common choice with the existing stack (React 19, Vite) but is not currently installed
- Alternative: use inline SVG paths directly (no new dependency) — the existing codebase already inlines SVGs in PersonCard.tsx and CopyButton.tsx

**Recommendation:** Inline SVG (no new dependency) for the 5 tab icons. Embed two variants (outline, filled) per icon as constants in `TabBar.tsx`. This avoids adding `lucide-react` as a dependency for 5 icons.

**Badge treatment (already implemented):**
The existing amber badge on the Assign tab for unassigned count is correct UX. Preserve it. Position the badge relative to the icon, not the label.

---

## Competitor Feature Analysis

| Feature | Splitwise | Tricount | Apple Wallet | Our v1.3 Approach |
|---------|-----------|----------|--------------|-------------------|
| Dark theme | Yes (optional) | Yes | Yes (system) | Forced dark — by design |
| Glassmorphism | No — flat cards | No | Yes (blur overlays on transactions) | Yes — glass cards with selective application |
| Gradient buttons | No | No | Yes (gradient Pay button) | Yes — blue-to-violet gradient |
| Custom font | System default | System default | San Francisco (system) | Inter — first distinguishing mark |
| Icon+label tab bar | Yes | Yes | N/A | Yes — upgrading from text-only |
| Micro-interactions | No | No | Yes — every tap has scale feedback | Yes — press-scale on all interactive elements |
| Tabular numerals for amounts | No (proportional) | No | Yes | Yes — `tabular-nums` + Inter tnum |

**Key insight:** Splitwise and Tricount both have flat, utilitarian UIs. No competitor applies glassmorphism or gradient buttons. This redesign puts the app in the category of consumer-grade fintech (Apple Wallet, Stripe) rather than utility-grade expense trackers.

---

## Sources

- NNGroup on glassmorphism: https://www.nngroup.com/articles/glassmorphism/ (HIGH confidence — authoritative)
- Material Design 3 elevation in dark themes: https://m3.material.io/styles/elevation/applying-elevation (HIGH confidence — authoritative)
- Making PWAs feel native (press animations, transform timing): https://www.gfor.rest/blog/making-pwas-feel-native (MEDIUM confidence — practitioner source, verified against NNGroup)
- Glassmorphism performance — GPU jank on mobile: https://playground.halfaccessible.com/blog/glassmorphism-design-trend-implementation-guide (MEDIUM confidence — practitioner blog, consistent with MDN backdrop-filter performance docs)
- Tailwind CSS backdrop-blur utilities: https://tailwindcss.com/docs/backdrop-filter-blur (HIGH confidence — official Tailwind docs)
- Tailwind CSS @utility directive (v4): https://tailwindcss.com/docs/adding-custom-styles (HIGH confidence — official Tailwind v4 docs)
- Glassmorphism with Tailwind (Epic Web Dev): https://www.epicweb.dev/tips/creating-glassmorphism-effects-with-tailwind-css (MEDIUM confidence — practitioner tutorial)
- Apple HIG tab bars — filled/outline icon convention: https://developers.apple.com/design/human-interface-guidelines/components/navigation-and-search/tab-bars (HIGH confidence — official Apple HIG)
- UX research: icon+label vs icon-only navigation: https://uxplanet.org/bottom-tab-bar-navigation-design-best-practices-48d46a3b0c36 (MEDIUM confidence — practitioner article, consistent with Apple HIG)
- Inter typeface — tabular figures, UI design rationale: https://rsms.me/inter/ (HIGH confidence — official source)
- Inter tabular numerals in fintech: https://github.com/rsms/inter/issues/413 (MEDIUM confidence — primary source discussion)
- Button press animation — scale 0.97, 150ms, ease-out: https://animations.dev/learn/animation-theory/the-easing-blueprint (MEDIUM confidence — practitioner, consistent with NNGroup motion guidelines)
- Dark theme elevation via lightness (not shadows): https://designsystems.surf/articles/depth-with-purpose-how-elevation-adds-realism-and-hierarchy (MEDIUM confidence — practitioner, consistent with Material Design 3)
- Glassmorphism overuse pitfalls (NNGroup): https://www.nngroup.com/articles/glassmorphism/ (HIGH confidence)

---
*Feature research for: Expense Splitter — v1.3 UI Redesign milestone (dark-themed financial PWA visual patterns)*
*Researched: 2026-02-24*
