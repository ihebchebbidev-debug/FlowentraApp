## What I found

**Sales detail page (`SaleDetail.tsx`, 702 lines)**
- The Invoices tab already exists (`SaleInvoicesTab`) and correctly fetches invoices filtered by `saleId`.
- Leftover fake invoice logic in the header:
  - `handleSendInvoice()` → only fires `toast.success('invoiceSent')`. Does nothing. Wired to the "Send invoice" dropdown item.
  - The header Send icon tooltip says **"Send invoice"** but it opens `SendSaleModal` (sends the *sale*, not an invoice) — mislabeled.
  - `handleDeleteSale()` shows a success toast and navigates away without calling the API.
- Result: two different, misleading "invoice" entry points on a page that already has a proper Invoices tab.

**Invoices tab (`SaleInvoicesTab.tsx`)**
- Functionally right (summary + list + create-from-sale), but visually it does **not** match the Items tab:
  - Uses `Card className="shadow-card border-0"` + `CardContent pt-6` with no `CardHeader`/`CardTitle`; Items uses `Card` > `CardHeader` > `CardTitle` (icon + label + count, action button on the right).
  - Two stacked cards (summary card + list card) where Items uses one card with a totals footer under a top border.
  - Hand-rolled `md:hidden` mobile card list — Items has no such split, just `overflow-x-auto`.
  - Hardcoded color utilities (`bg-blue-100`, `text-green-700`, `dark:...`) in `STATUS_COLOR` instead of the project's status config (`getStatusColorClass('invoice', …)` from `src/config/entity-statuses`), which already defines invoice statuses.
- Coverage math treats `saleTotal` as the invoiceable base — fine, but `notInvoiced` should be hidden when the sale is fully invoiced rather than showing `0.00`.

## Plan

### 1. Rewrite `SaleInvoicesTab` to mirror the Items table
- Single `Card` + `CardHeader`/`CardTitle`: `Receipt` icon + "Invoices (n)" on the left, **Create invoice** button on the right — identical to Items' "Sale items (n)" + "Add items".
- Empty state matching Items: centered icon `h-12 w-12 opacity-50`, message, primary button below.
- Table: drop the mobile card branch, use plain `overflow-x-auto` + `Table` like Items.
  - Columns: icon (`w-12`) · Number · Status · Issue date · Total (right) · Paid (right) · Due (right) · Actions (center).
  - Rows: `hover:bg-muted/50 transition-colors`, click → `/dashboard/invoices/:id`; actions cell uses the same `h-8 w-8 p-0` ghost buttons (Eye → open detail, ExternalLink → open in new tab).
- Move the summary out of its own card into a **totals footer** (`mt-6 pt-4 border-t`) exactly like Items: left = "n invoices, n drafts", right = Sale total / Invoiced / Paid / Outstanding lines + coverage progress bar.

### 2. Use semantic status tokens
- Delete the local `STATUS_COLOR` map; render status via `getStatusColorClass('invoice', status)` from `src/config/entity-statuses` so invoice badges match the rest of the app and dark mode.

### 3. Clean the Sale detail header
- Remove `handleSendInvoice` and the "Send invoice" dropdown item (dead action; sending is an invoice-level concern handled on the invoice detail page).
- Relabel the header Send icon tooltip from `sendInvoice` to `sendSale` — it opens `SendSaleModal`.
- Leave the Invoices tab as the single invoice entry point on the sale.

### 4. Keep management inside Invoices
- No invoice editing/posting/voiding on the sale page — the tab stays read-only plus "Create invoice", and every row navigates into the Invoices module where post/void/mark-paid/reopen already live.

### 5. Translations
- Add/adjust keys in the invoices locale for the new header, count label and footer rows; add `sales:sendSale` if missing. No backend changes — the API already supports `?saleId=`.

## Technical notes
- Files touched: `src/modules/invoices/components/tabs/SaleInvoicesTab.tsx` (rewrite), `src/modules/sales/components/SaleDetail.tsx` (remove dead action + tooltip label), invoices/sales locale JSON.
- No schema, service, or API changes. `useCustomerInvoicesList({ saleId })` and `useInvoiceMutations().createFromSale` stay as-is.
