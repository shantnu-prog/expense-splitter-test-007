---
phase: 08-upi-payments
plan: 01
subsystem: ui
tags: [react, zustand, typescript, upi, contact-details, person-model]

# Dependency graph
requires:
  - phase: 06-persistence
    provides: billStore with persist middleware and deserializeBillConfig boundary
  - phase: 07-history
    provides: save/load split functionality that stores/restores BillConfig

provides:
  - Person interface extended with optional mobile and upiVpa string fields
  - deserializeBillConfig handles old data (missing contact fields) and new data transparently
  - addPerson accepts optional contact object with mobile and upiVpa
  - updatePerson supports mobile and upiVpa field updates
  - Persist schema version bumped to 2 with v1->v2 migration stub
  - PeoplePanel with collapsible contact input section (mobile + UPI VPA)
  - PersonRow displays contact details below name when present

affects: [08-02-upi-deep-links, 08-upi-payments]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Optional field extension via TypeScript optional properties with conditional spread in deserializer
    - Collapsible UI section with useState toggle for progressive disclosure
    - Persist version migration stub pattern for schema evolution

key-files:
  created: []
  modified:
    - src/engine/types.ts
    - src/storage/deserializeBillConfig.ts
    - src/store/billStore.ts
    - src/components/people/PeoplePanel.tsx
    - src/components/people/PersonRow.tsx

key-decisions:
  - "Conditional spread in deserializeBillConfig for optional fields: ...(p.mobile !== undefined && { mobile: p.mobile }) — avoids adding undefined keys to object"
  - "addPerson takes contact as optional second parameter rather than expanding the signature — keeps existing call sites unchanged"
  - "Persist version 2 migration is a no-op — optional fields default to undefined on old data, deserializeBillConfig handles absent fields gracefully"
  - "Contact fields toggle uses showContact state and resets to false on handleAdd — clean UX where form resets after submit"

patterns-established:
  - "Progressive disclosure: optional UX details behind a toggle to avoid form complexity for simple use cases"
  - "Schema migration stub: bump version + migration function even for no-op changes to maintain upgrade path tracking"

requirements-completed: [PAY-01, PAY-02]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 8 Plan 01: Contact Details + Schema Migration Summary

**Person model extended with optional mobile/upiVpa fields, UPI contact collection in PeoplePanel form, PersonRow contact display, and backwards-compatible schema migration from version 1 to 2**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-24T01:49:13Z
- **Completed:** 2026-02-24T01:51:31Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments
- Extended the `Person` interface with optional `mobile` and `upiVpa` string fields (no engine impact — metadata only)
- Updated `deserializeBillConfig` to pass through contact fields with conditional spread — old data without these fields loads without crashing
- Updated `billStore.addPerson` to accept optional contact parameter; `updatePerson` type extended to include `mobile` and `upiVpa`; persist version bumped to 2 with a no-op migration stub
- Added collapsible contact input section in PeoplePanel (toggle button + mobile + UPI VPA fields); all fields clear on submit
- Updated PersonRow to display mobile and UPI VPA below the person name when present; PeoplePanel passes contact props through

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Person type and update deserialization** - `55bd16a` (feat)
2. **Task 2: Update billStore addPerson action and schema migration** - `a7ec6fe` (feat)
3. **Task 3: Update PeoplePanel with contact input fields** - `c56191f` (feat)
4. **Task 4: Update PersonRow to display contact details** - `1106839` (feat)

**Plan metadata:** (docs commit — see final commit)

## Files Created/Modified
- `src/engine/types.ts` - Person interface extended with optional `mobile?: string` and `upiVpa?: string`
- `src/storage/deserializeBillConfig.ts` - Cast type updated; people mapping uses conditional spread for optional contact fields
- `src/store/billStore.ts` - `addPerson` accepts optional contact param; `updatePerson` type extended; persist version 1→2 with migration stub
- `src/components/people/PeoplePanel.tsx` - Added mobile/upiVpa/showContact state; collapsible contact inputs; handleAdd passes contact to addPerson
- `src/components/people/PersonRow.tsx` - Props extended with mobile/upiVpa; displays contact details section below name when present

## Decisions Made
- Conditional spread `...(p.mobile !== undefined && { mobile: p.mobile })` in deserializer instead of including undefined keys — cleaner objects, no undefined pollution
- `addPerson(name, contact?)` optional second parameter keeps all existing call sites unchanged without breaking changes
- Persist migration v1→v2 is intentionally a no-op since `mobile` and `upiVpa` are optional — old configs with missing fields are valid
- Contact form section resets (fields clear + toggle hides) on successful add — clean state for next person entry

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Person data model now has UPI contact fields ready for phase 08-02
- `upiVpa` on Person objects enables building UPI deep link URLs in the summary/results panel
- No blockers — all types, store, deserialization, and UI components are aligned

---
*Phase: 08-upi-payments*
*Completed: 2026-02-24*

## Self-Check: PASSED

All files verified present. All 4 task commits verified in git history.
- FOUND: src/engine/types.ts
- FOUND: src/storage/deserializeBillConfig.ts
- FOUND: src/store/billStore.ts
- FOUND: src/components/people/PeoplePanel.tsx
- FOUND: src/components/people/PersonRow.tsx
- FOUND: .planning/phases/08-upi-payments/08-01-SUMMARY.md
- FOUND: 55bd16a (Task 1)
- FOUND: a7ec6fe (Task 2)
- FOUND: c56191f (Task 3)
- FOUND: 1106839 (Task 4)
