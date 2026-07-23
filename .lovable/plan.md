
## Goal

Today `POST /dashboard/sales/add` exists, but it's a stripped-down form vs. `Add Offer`. The user wants a **direct-sale** entry point that mirrors the offer form 1:1, then flows through the full sale lifecycle (status transitions, close, or convert-to-service-order) without ever needing a parent offer.

Backend already supports it:
- `Sales` table has `TaxType`, `FiscalStamp`, `discount`, offer_id is nullable.
- `ServiceOrders.Origin` supports `'from_sale' | 'direct'`; direct sales convert to service orders via existing convert flow.
- `sales.service.ts` already reads/writes `fiscalStamp` and `discountType`.

So the work is almost entirely **frontend parity + translations** plus small backend-payload/type additions.

## Frontend changes

### 1. `src/modules/sales/types.ts` — extend `CreateSaleData`
Add missing fields that Add Offer has:
- `category: string`
- `source: string`
- `fiscalStamp: number`
- `discountType: 'percentage' | 'fixed'`
- `linkedInstallations?: { id: string; name: string; ... }[]` (mirrors offer)

### 2. `src/modules/sales/pages/AddSale.tsx` — rebuild to match `AddOffer.tsx`
Bring in every section AddOffer has:
- Header identical style (ShoppingCart icon kept).
- Card 1 — Sale Information: `title`, `category` + `source` (lookup-driven with Manage link, defaults auto-select), `description`. Keep `status` and `priority` as sales-specific extras.
- Card 2 — Contact selector (already present, keep `ContactSelectorWithType`-equivalent behavior; reset installations on contact change).
- Card 3 — Installation selection (`InstallationSelector` + `CreateInstallationModal`, list of chips, remove behavior identical to offer).
- Card 4 — Items (`SaleItemsSelectorAdvanced`) — gate on `customerId` selected, pass `installations` prop.
- Sidebar Settings: currency + valid-until + delivery date + optional recurring block.
- Sidebar Financial Summary: discount (+ type selector), TVA (+ type selector), fiscal stamp, breakdown lines mirroring offer (subtotal, discount, TVA, stamp, total).
- Sidebar Notes card.
- Actions: Cancel, Save as Draft (status `created`), Create (status `in_progress`) — both go through validation.

Wiring:
- Use `useLookups()` for `offerCategories`, `offerSources`, `priorities` with defaults auto-selection.
- Use `useFormPersistence('add-sale', …)` with the extended defaults (`taxType`, `discountType`, `fiscalStamp: 1`).
- Reuse `calculateDocumentTotal` for all math.

### 3. `src/modules/sales/services/sales.service.ts`
Ensure `createSale` payload forwards `category`, `source`, `fiscalStamp`, `discountType`, `taxType`, `linkedInstallations` (already forwards fiscalStamp / discountType — extend for the new fields).

### 4. Translations — `src/modules/sales/locale/en.json` + `fr.json`
Add missing keys under `addSale.*`:
- `categoryLabel`, `categoryPlaceholder`, `sourceLabel`, `sourcePlaceholder`
- `fiscalStampLabel`, `fiscalStampHint`
- `installationSelectionTitle`, `addInstallation`
- `itemsSubtotal`, `taxAfterDiscount`
- `discountTypePercent`, `discountTypeFixed`
- `createSale` (primary submit label), `pageSubtitle`

All existing strings switched to `useTranslation('sales')` namespace consistently.

### 5. Entry points
`SalesList` header already routes to `/dashboard/sales/add` — no change. The "Add Sale" button is already the direct-sale entry; after this refactor it behaves exactly like the offer-add flow but writes a Sale directly.

## Backend changes

None to schema. Confirm `SalesController.CreateSale` accepts `Category`, `Source`, `FiscalStamp`, `DiscountType`, `TaxType`. If any field is missing on the DTO, extend the DTO + entity mapping (`Sales` table already has the columns needed via `08_fiscal_stamp.sql` + `16_add_tax_type_to_sales.sql`; add `Category`/`Source` columns only if not present — will confirm during implementation and add a small idempotent migration if needed).

## Flow parity after change

```
Direct Sale
   │ create (status = created / in_progress)
   ▼
Sale Detail  ──► status transitions (created → in_progress → invoiced/partial → closed)
   │
   ├─► Convert to Service Order (existing ConvertToServiceOrderDialog)
   └─► Close (terminal)
```

No offer needed at any step. Existing SaleDetail, status flow, convert dialog, and PDF already support sales that have no `offerId`.

## Out of scope
- Redesigning SaleDetail or the convert-to-service-order dialog.
- Changing backend service-order origin logic (already supports direct sales).
- Kanban/list layout changes.
