---
phase: 08-upi-payments
status: complete
researched: 2026-02-24
confidence: HIGH
---

# Phase 8 Research: UPI Payments

**Scope:** Add contact details (mobile + UPI VPA) to Person, payer selector, and UPI deep links for payment requests.

## UPI Deep Link Specification

Standard format per NPCI UPI Linking Specifications:

```
upi://pay?pa=<PAYEE_VPA>&pn=<PAYEE_NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>
```

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `pa` | Payee VPA (the person receiving money) | Yes | `alice@ybl` |
| `pn` | Payee name (display only) | Yes | `Alice` |
| `am` | Amount in decimal (rupees.paise) | Yes | `23.50` |
| `cu` | Currency code | Yes | `INR` |
| `tn` | Transaction note | No | `Bill split via SplitCheck` |

**How it works on mobile:**
- Tapping a `upi://pay?...` link on Android/iOS opens the default UPI app (PhonePe, GPay, Paytm)
- The UPI app pre-fills the payee VPA, amount, and note
- The user confirms and completes the payment

**Key insight:** The `upi://pay` intent is from the TAPPING person's perspective — they pay the `pa` (payee). So the flow is:
1. Alice paid the restaurant bill
2. Alice selects herself as payer in the app
3. For Bob who owes ₹23.50, Alice shares a UPI link: `upi://pay?pa=alice@ybl&pn=Alice&am=23.50&cu=INR`
4. Bob taps the link → his PhonePe opens → he pays Alice ₹23.50

## Design Decisions

### 1. Person type extension

**Decision:** Add optional `mobile` and `upiVpa` fields to the `Person` interface.

```typescript
export interface Person {
  id: PersonId;
  name: string;
  mobile?: string;    // e.g., "9876543210"
  upiVpa?: string;    // e.g., "alice@ybl", "9876543210@paytm"
}
```

**Why optional:** Backwards compatibility — old saved splits don't have these fields. The engine doesn't use them (pure calculation). They're display/payment metadata only.

### 2. Schema migration (version 1 → 2)

**Decision:** Bump billStore persist version to 2. Migration adds `mobile: undefined` and `upiVpa: undefined` to each person in persisted config.

The `deserializeBillConfig` function handles missing fields by defaulting to `undefined` (not empty string) — matches the `?:` optional type.

### 3. addPerson action signature change

**Decision:** Extend `addPerson` to accept optional contact details:

```typescript
addPerson(name: string, contact?: { mobile?: string; upiVpa?: string }): void;
```

The `contact` parameter is optional to avoid breaking existing callers (HistoryPanel's handleNewSplit doesn't pass contact).

### 4. PeoplePanel input flow

**Decision:** After name input, show expandable "Contact details" fields (mobile + UPI VPA). These are optional — user can add a person with just a name. Contact fields appear below the name input with collapsible toggle.

### 5. UPI link generation — share vs direct open

**Decision:** For each person who owes money, show a "Pay via UPI" button that:
- On mobile: opens `upi://pay?...` directly (opens UPI app picker)
- Fallback: copies the UPI link to clipboard for sharing via WhatsApp/SMS

The `pa` (payee) in the link is the SELECTED PAYER's VPA (the person who paid the bill). Each non-payer person gets a link where the payer is the payee.

### 6. Payer state — local component state

**Decision:** Selected payer lives in `useState<PersonId | null>` inside the PaymentSection component. Does NOT belong in bill store or history (it's a display preference).

### 7. Currency display

**Decision:** Keep existing `$` display throughout the app (generic). The UPI link uses `cu=INR`. This avoids a large refactor and the `$` symbol works as a generic currency indicator. Users understand the amounts are in their local currency.

## Sources

- [NPCI UPI Linking Specifications](https://www.labnol.org/files/linking.pdf)
- [UPI Deeplinks quickstart — Setu](https://docs.setu.co/payments/upi-deeplinks/quickstart)
- [UPI Pay Me Link Generator](https://srikanthlogic.github.io/CashlessConsumer/linkgen.html)
- Existing codebase: types.ts, billStore.ts, PeoplePanel.tsx, deserializeBillConfig.ts
