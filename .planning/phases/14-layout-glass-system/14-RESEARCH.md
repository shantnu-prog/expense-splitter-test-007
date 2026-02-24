# Phase 14 Research: Layout + Glass System

**Phase:** 14 — Layout + Glass System
**Researched:** 2026-02-24
**Requirements:** LYOT-01, LYOT-02, LYOT-03, CARD-05

## Decision: Inline SVGs (not lucide-react)

**Context:** Deferred from Phase 13 — `lucide-react` named imports vs inline SVG for ~7 icons.

**Decision:** Inline SVGs.

**Rationale:**
- Entire codebase already uses inline SVGs (CopyButton clipboard/checkmark, PersonCard chevron)
- Only 5 tab icons needed (History, People, Items, Assign, Split)
- Zero new dependencies, zero bundle size increase
- Full control over stroke-width, viewBox, and sizing
- Consistent with existing code patterns

## Components to Modify

### 1. TabBar.tsx (LYOT-01, LYOT-02)

**Current state:**
- Text-only labels, no icons
- `bg-gray-900 border-t border-gray-700` (flat, opaque)
- `min-h-12` (48px)
- Active: `text-blue-400 border-t-2 border-blue-400`
- Fixed bottom via `fixed bottom-0 inset-x-0`

**Target state:**
- SVG icon above text label for each tab
- `glass-surface` styling (frosted blur through fixed position)
- `min-h-14` (56px) to accommodate icon + label
- Active: keep `text-blue-400`, remove `border-t-2` (glass doesn't use top borders)

**Tab icons (20x20 viewBox, stroke-based):**
- History: clock icon (circle + hands)
- People: two-person silhouette
- Items: receipt/list icon
- Assign: link/chain icon
- Split: pie-chart or scissors

**Risk:** glass-surface on a fixed-position element — `backdrop-filter` works on fixed elements but requires the element NOT to have `will-change: transform` on any ancestor. AppShell root is a simple flex container, no transforms — safe.

### 2. SubtotalBar.tsx (LYOT-03)

**Current state:**
- `sticky top-0 z-10 bg-gray-900 border-b border-gray-700`
- Label: `text-gray-400 text-sm`
- Amount: `text-white font-semibold text-lg tabular-nums`

**Target state:**
- Replace `bg-gray-900 border-b border-gray-700` with `glass-surface`
- Add `tracking-tight` to the amount for tighter number spacing
- Keep `sticky top-0 z-10` — backdrop-filter works on sticky elements

### 3. PersonCard.tsx (CARD-05)

**Current state:**
- `bg-gray-900 border border-gray-800 rounded-xl mb-3`
- Detail drawer: plain overflow-hidden

**Target state:**
- Replace outer div with `glass-card rounded-xl mb-3`
- Detail drawer separator: `border-t border-white/5` (subtle glass-consistent divider)
- Keep all internal structure, animations, and accessibility

## Performance Budget

From research (PITFALLS.md + STATE.md decisions):
- Max 4 simultaneous blurred elements per viewport
- Max 12-16px blur radius (glass-card: 12px, glass-surface: 8px)

**Phase 14 blur count per viewport:**
- TabBar (fixed, always visible): glass-surface (8px) — 1
- SubtotalBar (sticky, visible on non-history tabs): glass-surface (8px) — 1
- PersonCards (scrollable, ~2-3 visible): glass-card (12px) — 2-3

**Worst case:** 4-5 blurred elements. Within budget but must verify at 4x CPU throttle.

**Exit gate:** Chrome DevTools 4x CPU throttle, scroll through populated summary → 50 FPS minimum.

## Plan Structure

- **Plan 01:** TabBar SVG Icons + Glass Styling (LYOT-01, LYOT-02)
- **Plan 02:** SubtotalBar Glass + PersonCard Glass (LYOT-03, CARD-05)
