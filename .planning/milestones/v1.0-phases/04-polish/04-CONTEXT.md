# Phase 4: Polish - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

UX refinements that make the app feel complete and professional — keyboard navigation, deletion safety with undo, empty state guidance, and mobile QA fixes. No new features; all v1 requirements are already covered in Phases 1-3. This phase is additive polish on existing functionality.

</domain>

<decisions>
## Implementation Decisions

### Keyboard navigation
- Enter in text inputs does NOT submit — user must Tab to the Add button and press Enter/Space
- Tab switching does NOT auto-focus the first element in the new panel — focus stays neutral, user tabs into content manually
- Tab bar uses ARIA tabs pattern with Left/Right arrow key navigation between tabs
- Focus management after adding a person/item is Claude's discretion (focus new input for rapid entry vs focus added entry)
- No focus traps — user can always tab out of any panel

### Deletion safety
- **Inline undo toast** (not confirmation dialog) — item/person disappears immediately, toast shows at bottom with Undo button
- Toast auto-dismisses after **5 seconds**
- Undo restores the person/item AND their assignments
- Toast shows a **warning about lost assignments**: "Deleted Alice (had 3 items assigned) — Undo"
- If a second delete happens while a toast is showing, the **first toast is replaced** (first undo opportunity is lost, new toast shows latest deletion)

### Empty state guidance
- **Text + action button** style (no illustrations) — centered text explaining what's needed + a button that focuses the existing add input
- Action button focuses the existing add input at the top of the panel (no new inline input UI)
- Assign tab with missing data: **directs to the missing tab** — e.g., "Add items first to start assigning" with a button that switches to the Items tab
- Assign tab empty state keeps it simple — says what's missing without referencing the Split tab
- Split tab: shows **"Configure tip and tax above to see the split"** prompt until at least tip or tax is configured (not $0 defaults)
- **Minimal splash onboarding** on fresh load: app name + one-liner ("Split bills fairly") + "Start" button → goes to People tab
- Onboarding frequency (every fresh load vs first time only via localStorage) is Claude's discretion

### Mobile QA refinements
- **iOS input zoom fix** — ensure all inputs use font-size >= 16px to prevent auto-zoom on focus
- **Full touch target audit** — all interactive elements meet 44x44px minimum
- **Scroll behavior fixes** — prevent overscroll bounce, lock body scroll when panels are scrollable, smooth scroll to newly added entries
- **Subtle transitions** — add transitions to tab switches, button presses, and state changes for perceived quality polish

### Claude's Discretion
- Focus destination after adding a person/item (new input vs added entry)
- Onboarding screen frequency (every empty load vs localStorage first-time-only)
- Specific transition timing and easing curves
- Exact empty state copy/wording
- Which elements need touch target enlargement (based on audit)

</decisions>

<specifics>
## Specific Ideas

- Undo toast should feel like Google's undo pattern (Gmail delete) — immediate action + brief undo window
- Onboarding should be minimal — app name, one-liner, single button. Not a tutorial or walkthrough.
- Arrow key tab navigation should follow the WAI-ARIA tabs pattern (roving tabindex)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-polish*
*Context gathered: 2026-02-21*
