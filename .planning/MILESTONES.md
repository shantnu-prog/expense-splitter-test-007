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


## v1.2 Polish + PWA (Shipped: 2026-02-24)

**Phases completed:** 4 phases (9-12), 7 plans, 17 tasks
**Production build:** 254 KB (79 KB gzip)
**Source changes:** 16 files, 300 insertions, 87 deletions
**Tests:** 144 passing across 12 test files

**Key accomplishments:**
1. PWA with full offline support — vite-plugin-pwa, service worker precaching, installable to home screen, user-controlled update prompt
2. Swipe navigation between tabs using react-swipeable with input exclusion and touch-action: pan-y for scroll conflict prevention
3. Summary UX: settlement direction labels ("owes [name]"), actionable "Add UPI ID" navigation, live custom tip dollar preview, persistent payer selection
4. Visual consistency: 48px primary and 40px secondary button tap targets, green checkmark copy feedback, consistent px-4 py-3 spacing
5. Tech debt cleanup: branded types replacing `as any` casts, useEffect mount-fire fix via prevSubtotalRef, ErrorBoundary with crash recovery, desktop UPI guard message

---

