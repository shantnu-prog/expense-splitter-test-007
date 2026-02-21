# Phase 2: Data Entry - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

People, items, and assignment panels — fully working bill input on a phone browser. Users can add/remove people, add/edit/remove items with prices and quantities, and assign each item to one or more people. Running subtotal visible at all times. No tip/tax configuration or summary output — those are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Panel layout & flow
- Tabbed panels — three tabs: People, Items, Assignments
- All tabs freely accessible at all times (no guided unlock or sequential flow)
- Running subtotal always visible across all tabs (sticky header or footer)
- Tab position: Claude's discretion (pick best for mobile thumb reach)

### Item entry interaction
- Add item via "+" button that creates a new empty row in the list — user types name and price inline
- Price input in dollar format ($12.50) — app converts to integer cents internally
- Quantity adjustment via plus/minus stepper buttons on each item row
- Editing existing items: Claude's discretion (pick fastest mobile-friendly approach)

### Assignment interaction
- Checkbox list — each item expands to show a checklist of all people, user checks who's sharing
- Prominent "Everyone" button at the top of the checklist — one tap to select/deselect all people
- Unassigned items show a subtle warning badge/icon (not alarming red highlight)
- Assignment tab layout: Claude's discretion (item-centric vs person-centric — pick clearest approach)

### Mobile input & validation
- Empty person name: show inline error message ("Name required") when user taps Add
- Duplicate person names: blocked — prevent adding a person with a name that already exists
- Invalid price input handling: Claude's discretion (pick approach that prevents most frustration)
- Dark mode color scheme — dark background with light text for dim restaurant use

### Claude's Discretion
- Tab position (top vs bottom)
- Item editing interaction (tap inline vs edit button)
- Price input validation approach (real-time filtering vs validate on submit)
- Assignment tab layout (item-centric vs person-centric)

</decisions>

<specifics>
## Specific Ideas

- Primary use case is at a restaurant table on a phone — every interaction should be one-thumb friendly
- Price input should trigger numeric decimal keyboard on iOS and Android (inputmode="decimal")
- The "Everyone" button on assignments is important — most restaurant items (like shared appetizers) go to everyone

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-data-entry*
*Context gathered: 2026-02-19*
