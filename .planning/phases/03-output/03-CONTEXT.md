# Phase 3: Output - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Tip/tax configuration UI and per-person summary display. Users configure how to split tip and tax, then see the final breakdown of what each person owes. This is the visible product — the app's entire purpose. Copy-to-clipboard enables sharing the result.

</domain>

<decisions>
## Implementation Decisions

### Tip/tax controls
- Tip presets (15%, 18%, 20%) use an iOS-style segmented control — one option always selected
- Custom tip percentage input interaction is Claude's discretion (e.g., 4th "Custom" segment revealing an input, or another smooth approach)
- Tax input supports dollar amount OR percentage mode — Claude decides the toggle/switch UX for this
- Tip and tax each have **separate** equal/proportional split method toggles — independent control per type (matches existing TipTaxConfig structure)

### Summary display
- Per-person breakdown uses **card per person** layout — stacked vertically, scrollable
- Cards show **name + total by default**, with **expandable detail** on tap revealing food subtotal, tip share, tax share
- Bill total displayed at the top with receipt comparison — "Bill total: $XX.XX" so users can sanity-check against the actual receipt
- Person ordering is Claude's discretion

### Rounding transparency
- Rounding surplus shown in a **footer below all cards** — not inside individual cards
- Footer detail level is Claude's discretion (simple amount vs. with explanation)
- Footer is **hidden when rounding surplus is $0.00** — only appears when non-zero
- The bill total at the top shows the rounded total only (no inline rounding annotation) — the footer handles the explanation

### Copy-to-clipboard
- Copied text uses **labeled breakdown format**: "Bill Split:\n- Alice owes $23.50\n- Bob owes $18.00\nTotal: $41.50 (includes tip + tax)"
- Copy feedback uses a **toast notification** at the bottom of the screen
- **Both copy options**: a "Copy all" button for the full summary, plus a small copy icon on each person's card for individual amounts
- "Copy all" button placement is Claude's discretion

### Claude's Discretion
- Custom tip input UX (how it interacts with the segmented control)
- Tax dollar/percentage mode switch implementation
- Rounding footer detail level and wording
- Person ordering in summary (order added vs. highest-to-lowest vs. other)
- "Copy all" button placement (top vs. bottom of summary)
- Exact spacing, typography, and animation details within the dark theme

</decisions>

<specifics>
## Specific Ideas

- Segmented control for tip presets should feel native/iOS-like on mobile
- Cards should support expand/collapse animation for the detail breakdown
- Toast notification should be brief and non-obstructive (standard mobile pattern)
- Individual copy per person enables texting one friend their specific amount

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-output*
*Context gathered: 2026-02-21*
