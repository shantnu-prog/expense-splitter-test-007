# Milestones

## v1.0 MVP (Shipped: 2026-02-21)

**Phases completed:** 5 phases, 11 plans
**Lines of code:** 4,734 (TypeScript/TSX/CSS)
**Timeline:** 4 days (2026-02-19 to 2026-02-22)
**Tests:** 125 passing across 9 test files

**Key accomplishments:**
1. Integer-cent calculation engine with largest-remainder distribution and 45-test TDD suite
2. Mobile-first data entry: people, items, and item-centric assignment panels with dark theme
3. Tip/tax configuration (presets + custom, equal/proportional split) and per-person summary with copy-to-clipboard
4. Keyboard navigation (roving tabindex), undo toast for safe deletion, onboarding screen, empty states
5. Production build fixed — all 125 tests pass, `npm run build` exits 0

---

## v1.1 Persistence + Sharing (Shipped: 2026-02-24)

**Phases completed:** 3 phases, 6 plans
**Production build:** 244 KB (76 KB gzip)
**Timeline:** 3 days (2026-02-21 to 2026-02-24)
**Tests:** 144 passing across 12 test files

**Key accomplishments:**
1. localStorage persistence layer with safe adapter, branded-type deserialization, and schema versioning (v1→v2 migration)
2. History list on app open with save/load/edit/delete flow, editing indicator, and undo toast
3. UPI payment integration: person contact fields (mobile + VPA), payer selector, upi:// deep link buttons for payment requests

---

