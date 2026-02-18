# Stack Research

**Domain:** Client-side bill splitting / expense splitting web app
**Researched:** 2026-02-19
**Confidence:** MEDIUM — Context7, WebSearch, and WebFetch were unavailable in this environment. All findings sourced from training knowledge (cutoff August 2025). Versions marked LOW where they may have advanced since then.

---

## Research Constraints

External tools (Context7, WebSearch, WebFetch) were denied in this session. All stack recommendations derive from training data through August 2025. Where version numbers may have incremented since then, this is flagged explicitly. The core technology choices are stable and high-confidence; specific patch versions are LOW confidence and should be verified against npm before first install.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.x | UI component framework | Dominant ecosystem for client-side SPAs. React 19 adds native `use()` hook, improved Suspense, and better ref handling. No framework overhead needed for a static client-side app. Massive ecosystem means any UI pattern has a solved library. |
| TypeScript | 5.7+ | Type safety across all logic | Expense splitting involves floating-point arithmetic, rounding edge cases, and complex data relationships (items → people → shares). TypeScript catches off-by-one errors and incorrect data shapes at compile time — critical for money math. |
| Vite | 6.x | Build tool and dev server | Fastest dev experience available. Near-instant HMR. For a client-side SPA, Vite produces optimized static files deployable to any CDN or static host with zero config. No Next.js needed — this is not an SSR app. |
| Tailwind CSS | 4.x | Utility-first CSS | Mobile-first responsive design with minimal CSS payload. v4 uses CSS-native variables and no config file by default. Ideal for building dense, touch-friendly UIs quickly. Eliminates CSS naming decisions. |
| Zustand | 5.x | Client state management | The bill state (people, items, tip config, tax config) is a single shared data model accessed by many components. Zustand provides that without Redux boilerplate. Minimal API surface, TypeScript-friendly, no context hell. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Immer | 10.x | Immutable state updates | Use inside Zustand store when updating nested state (e.g., toggling a person on/off an item). Makes mutations safe and readable without manual spread chains. |
| clsx | 2.x | Conditional className merging | Eliminates string template noise when combining Tailwind classes conditionally (active states, disabled states). Trivial library, high utility. |
| tailwind-merge (twMerge) | 3.x | Merge conflicting Tailwind classes | When building reusable components with override props, prevents conflicting Tailwind utilities. Pair with clsx via a `cn()` helper. |
| Vitest | 3.x | Unit testing | Test the arithmetic core (split calculations, rounding, proportional tip logic) in isolation. Vite-native, so zero additional configuration. Critical: money math must be tested. |
| @testing-library/react | 16.x | Component testing | Verify UI behavior (adding a person, assigning items) without coupling tests to implementation details. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite (built-in) | Dev server, HMR, production build | Run `npm run dev` for local, `npm run build` for static output |
| ESLint 9.x | Lint enforcement | Use flat config format (eslint.config.js). Include `eslint-plugin-react-hooks` for hooks rules. |
| Prettier 3.x | Code formatting | Set `singleQuote: true`, `semi: false` or per team preference. Integrate with ESLint via `eslint-config-prettier`. |
| TypeScript compiler (tsc) | Type checking | Run `tsc --noEmit` as a pre-build check. Vite transpiles TS but does not type-check — tsc is still needed for CI. |

---

## Installation

```bash
# Scaffold the project
npm create vite@latest expense-splitter -- --template react-ts
cd expense-splitter

# Core runtime dependencies
npm install zustand immer clsx tailwind-merge

# Tailwind CSS v4 (new install flow — no config file required)
npm install tailwindcss @tailwindcss/vite

# Testing
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom

# Linting and formatting
npm install -D eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier
```

**Tailwind v4 Vite integration** (add to `vite.config.ts`):
```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**Tailwind v4 CSS import** (add to `src/index.css`):
```css
@import "tailwindcss";
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| React 19 | Svelte 5 / SvelteKit | If team strongly prefers Svelte's compiled approach and smaller bundle. Svelte has less ecosystem depth for component libraries. Fine choice but requires re-evaluating supporting libs. |
| React 19 | Vue 3 | If team already has Vue expertise. Vue 3 + Vite is an excellent combo. For a greenfield app with no team preference, React's ecosystem edge wins. |
| Vite | Create React App (CRA) | **Never.** CRA is officially deprecated. Webpack-based, slow, unmaintained. |
| Vite | Next.js | Only if SSR, RSC, or file-based routing are needed. For a pure client-side SPA this adds meaningless complexity and a Node.js server requirement. |
| Tailwind CSS | CSS Modules | If team dislikes utility classes. CSS Modules work well with Vite. Tailwind is faster for building novel UIs without a design system. |
| Tailwind CSS | styled-components / emotion | CSS-in-JS adds runtime overhead with no benefit for a static client-side app. Tailwind v4 has better mobile ergonomics. |
| Zustand | React Context + useReducer | Viable for this app size. Zustand is recommended because the bill state graph (items with multiple people, tip, tax, computed totals) gets messy in plain context with many cross-component reads. Zustand selectors avoid unnecessary re-renders. |
| Zustand | Jotai | Jotai is atom-based and better for orthogonal pieces of state. Bill splitting data is tightly coupled (changing who's on an item recalculates everyone's total) — Zustand's single-store model fits better. |
| Zustand | Redux Toolkit | RTK is designed for large apps with complex async logic and developer tooling needs. Overkill for a client-side calculator app with no API calls. |
| Vitest | Jest | Vitest is Vite-native and requires no transpilation config. Jest with Vite requires additional bridging. Use Vitest. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App (CRA) | Officially deprecated by React team, Webpack-based, extremely slow dev experience, unmaintained since 2023 | Vite |
| Next.js | Server rendering, file-based routing, Node.js server — all unnecessary for a client-side-only calculator | Vite + React |
| Remix | Full-stack framework with loader/action model, requires a server. Wrong tool for no-backend constraint | Vite + React |
| styled-components / emotion | Runtime CSS-in-JS adds unnecessary overhead; no SSR to benefit from static extraction | Tailwind CSS |
| Redux Toolkit | Massive boilerplate overhead for a single-page calculator with no async server state | Zustand |
| MobX | Mutable observable model is harder to serialize to localStorage later (v2 feature); TypeScript integration less predictable than Zustand | Zustand |
| Floating-point arithmetic for money | `0.1 + 0.2 !== 0.3` in JavaScript. Using raw floats for bill math causes wrong totals | Integer arithmetic (store cents as integers) or multiply/divide carefully — see Stack Patterns below |
| Lodash | Adds 70KB+ for utilities not needed in a focused app. Use native Array/Object methods or targeted micro-libs | Native JS or individual lodash-es functions if truly needed |

---

## Stack Patterns by Variant

**For money arithmetic (critical):**
- Store all monetary values as integers in cents (e.g., $12.50 → `1250`)
- All calculations operate on integer cents
- Convert to display format only at render time: `(cents / 100).toFixed(2)`
- For rounding up to nearest cent: `Math.ceil(cents)` on integer cents is safe
- Because: floating-point addition accumulates errors that cause per-person totals to be off by a penny

**For proportional tip/tax splitting:**
- Calculate each person's subtotal as integer cents
- Compute their proportion: `personSubtotal / billSubtotal`
- Apply proportion to tip/tax: `Math.round(proportion * tipCents)`
- Reconcile rounding remainder: assign leftover cents to the last person rather than losing them
- Because: proportional splits never divide evenly; reconciliation prevents total drift

**For shared items:**
- Model a shared item as: `{ price: number, sharedBy: PersonId[] }`
- Each person's share: `Math.floor(itemPrice / sharedBy.length)` with remainder cents distributed to the first N people
- Because: equal division may not divide evenly; remainder must go somewhere deterministic

**For mobile UX:**
- Use Tailwind's `touch-action-manipulation` and `min-h-12` for touch targets
- Use `inputmode="decimal"` on number inputs for mobile numeric keyboard
- Use `type="text"` not `type="number"` for price inputs (avoids browser formatting conflicts)
- Because: primary use case is phone browser at a restaurant table

**If deploying to GitHub Pages / Netlify / Vercel:**
- Use `vite build` output (`dist/`) directly — zero server required
- Set `base` in `vite.config.ts` if deploying to a subdirectory path
- No special configuration needed; the build output is pure static HTML/JS/CSS

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| React 19 | react-dom@19 | Must match exactly. `react` and `react-dom` versions must be identical. |
| Tailwind CSS 4.x | `@tailwindcss/vite` | v4 uses the Vite plugin (not PostCSS) for installation. The PostCSS approach from v3 still works but is non-default. |
| Zustand 5.x | React 18+ | Zustand 5 dropped the deprecated `immer` middleware path; use `immer` directly from the `produce` import for mutative updates. |
| Vitest 3.x | Vite 6.x | Vitest is Vite-adjacent; major versions track Vite major versions. Use matching majors. |
| ESLint 9.x | Flat config format | ESLint 9 uses `eslint.config.js` (flat config), not `.eslintrc.*`. Templates from `npm create vite` may still generate v8-style configs — upgrade manually if needed. |

---

## Confidence Assessment

| Decision | Confidence | Basis |
|----------|------------|-------|
| React as framework | HIGH | Dominant ecosystem choice; stable for years |
| TypeScript | HIGH | Industry standard; no serious alternative for type safety |
| Vite as build tool | HIGH | Official React recommendation; CRA deprecated |
| Tailwind CSS | HIGH | Standard for rapid mobile UI development |
| Zustand for state | MEDIUM | Strong community adoption; verified in training data through Aug 2025 |
| React version 19.x | MEDIUM | React 19 released Dec 2024; may have 19.x patch increments by Feb 2026 |
| Vite version 6.x | MEDIUM | Vite 6 released Nov 2024; may have incremented since |
| Tailwind version 4.x | MEDIUM | Tailwind v4 released Jan 2025; install flow verified from training |
| Zustand version 5.x | MEDIUM | Zustand 5 released Oct 2024; may have patch increments |
| Specific patch versions | LOW | Training cutoff Aug 2025; run `npm info <package> version` to confirm latest |
| Integer-cents money pattern | HIGH | Well-established JavaScript money math pattern; not version-dependent |

---

## Sources

- Training data (React, TypeScript, Vite, Tailwind, Zustand documentation knowledge) — through August 2025
- React 19 release blog (training knowledge) — Dec 2024
- Vite 6 release notes (training knowledge) — Nov 2024
- Tailwind CSS v4 release (training knowledge) — Jan 2025
- Zustand v5 release (training knowledge) — Oct 2024
- NOTE: Context7, WebSearch, and WebFetch were unavailable in this session. Versions flagged MEDIUM/LOW should be verified with `npm info <package> version` before project initialization.

---

*Stack research for: client-side expense splitting web app*
*Researched: 2026-02-19*
