# Purchase Module — Full Re-Audit (backend + frontend + TEJ/RS compliance)

Scope: `Backend/Modules/Purchases`, `Backend/Modules/RetenueSource`, related `Contacts`, and `src/modules/purchases`.
Method: line-by-line read of live code paths. Every item is classified **LIVE** (really executes), **FAKE** (UI/flag only) or **DEAD** (never written/unreachable).

## 1. Verdict summary

| Area | State |
|---|---|
| PO → Goods Receipt → Supplier Invoice chain | **LIVE**, server-enforced state machine |
| Stock movement on receipts | **LIVE** (`IStockTransactionService`, inside the receipt transaction) |
| Suppliers = `Contact` with `Type == "supplier"` | **LIVE** |
| TEJ / RiTEJ XML generation | **LIVE** writer, real compliance defects (section 4) |
| Facture en Ligne (FEL) | **FAKE** — flips a status flag, transmits nothing |
| GoodsReceipt `rejected` status | **DEAD** — UI vocabulary only |
| `ApprovedBy` / `ApprovalDate` / `SentToSupplierAt` | **DEAD** columns |
| Offline support in purchases UI | **ABSENT** (not implemented) |

## 2. Business process — how it actually works

1. **Purchase Order** — `PurchaseOrderService.CreateOrderAsync` (PurchaseOrderService.cs:82-187): idempotency-key short-circuit, supplier resolved with `!IsDeleted`, number from `INumberingService`, totals via `RecalculateTotals` (:597-631, tax on post-discount pro-rated base, `GrandTotal` floored at 0). Execution strategy + explicit transaction.
2. **Status machine** — `AllowedStatusTransitions` (:218-227): `draft → validated|ordered|cancelled`, `validated → ordered|draft|cancelled`, `ordered → partially_received|received|cancelled`, `partially_received → received|cancelled`, `received → closed`; `cancelled`/`closed` terminal. Manual `received` requires every line `ReceivedQty >= Quantity` (:258-264).
3. **Goods Receipt** — `CreateReceiptAsync` (GoodsReceiptService.cs:107-231): only `ordered`/`partially_received` POs accept goods; over-receipt blocked per line; `AddStockAsync` runs inside the same transaction so a stock failure rolls the receipt back. Update (:253-468) is delta-based and re-derives PO + sibling receipt statuses. Delete (:470-595) reverses `ReceivedQty` and stock, blocked when an invoice links to it.
4. **Supplier Invoice** — `CreateInvoiceAsync` (SupplierInvoiceService.cs:85-278): idempotency key plus natural key `(SupplierId, SupplierInvoiceRef)`; PO/GR must belong to the same supplier (GR to the same PO). Update (:279-435) takes a real `SELECT … FOR UPDATE` row lock and recalculates totals before validating `AmountPaid <= GrandTotal`. Delete blocked once any payment exists — cancellation forced instead.
5. **PO payment status** — `SyncPurchaseOrderPaymentStatusAsync` (:510-540) aggregates all live non-cancelled invoices into `pending/partial/paid`.
6. **RS / TEJ** — invoice totals produce `RsAmount`/`RsTvaAmount` (:715-767) → `RSService.BuildRsRecordFromInvoice` (:490-564) snapshots an `RSRecord` → `EnsureRsRecordPersistedAsync` (:573-607) persists once → `GenerateTEJXml`/`WriteCertificat` (:820-948) or monthly `ExportTEJAsync` (:342-456).

## 3. Backend findings

### High
1. **No RBAC on any endpoint.** All three controllers use bare `[Authorize]`; no policy/permission attributes exist project-wide. Any authenticated user can create/delete POs, receipts, supplier invoices and generate tax XML.
2. **FEL is fabricated compliance.** `SupplierInvoicesController.SendFactureEnLigne` (:180-201) sets `FactureEnLigneStatus="sent"` + timestamp and transmits nothing.
3. **Partial-invoice line totals are wrong.** When a line has `PurchaseOrderItemId`, `LineTotal` is overwritten with the full PO line total, ignoring the invoice's own `Quantity` (SupplierInvoiceService.cs:241-244, :702-713). Invoicing 5 of 10 ordered units books the full 10-unit amount, propagating into `SubTotal`/`TaxAmount`/`GrandTotal`.
4. **State-changing GET.** TEJ XML download endpoints persist an `RSRecord` as a side effect (RSService.cs:694,766). Prefetch/double-click/retry registers spurious tax declarations that then count toward the monthly export.
5. **`RSRecord` is hard-deleted** (RSService.cs:269) while every other entity soft-deletes — tax data erasable without trace.

### Medium
6. `UpdateOrderAsync` (:229-321) uses a plain transaction while its own comment claims protection against concurrent item mutations; no Serializable, no row lock, no `RowVersion` — real lost-update window on totals.
7. Numbering fallback is silent: any `INumberingService` exception falls back to `PREFIX-yyyyMMdd-{hex}` with no log in all three create paths (PurchaseOrderService.cs:105, GoodsReceiptService.cs:128, SupplierInvoiceService.cs:150). Fiscal numbering gaps become invisible.
8. **Undocumented status `pending`** written to `SupplierInvoice.Status` when `AmountPaid` resets to 0 (:364-368); outside the documented enum and it permanently locks item editing, which requires `Status == "draft"` (:547,616,671).
9. RS rate table hardcoded in three places (SupplierInvoiceService.cs:748-753, RSService.cs:19-30, TejOperationCodes.cs) — already inconsistent (section 4).
10. TEJ declarant resolved heuristically as "first `company` contact with a Matricule Fiscale" (RSService.cs:665-668,730-733) — no self-company marker; a B2B customer row can be declared as the declarant.
11. Supplier lookup inside the TEJ builders is missing `!IsDeleted` (RSService.cs:660,754), unlike every other supplier lookup in the module.
12. **No item-level audit logging.** PO and invoice item add/update/delete never write `PurchaseActivity` — price/quantity edits that change `GrandTotal` leave no trail.
13. `GetStatsAsync` (:375-398) materialises the whole tenant PO table in memory for stat cards.
14. `SupplierInvoiceItem.PurchaseOrderItemId`/`ArticleId` stored as `string` with silent `int.TryParse` on read — malformed data degrades to `null` unnoticed.
15. Draft invoices already shift `PurchaseOrder.PaymentStatus` — likely unintended.
16. All 500s leak `ex.Message`, inner exception and exception type to the client, in every environment.
17. **Payments have no ledger.** `AmountPaid`/`PaymentDate`/`PaymentMethod` are overwritten scalars; individual partial payments cannot be reconstructed.

### Low
18. Idempotency/natural-key races surface as raw `DbUpdateException` (500) instead of the documented structured duplicate response.
19. `GoodsReceiptItem.LocationId` accepted with no existence validation.
20. `PurchaseOrder.CreatedByName` never assigned.
21. Receipt `Status="partial"` reflects PO completeness, not the receipt's own lines — a fully-filled receipt can display "partial".

### Dead columns / statuses
`ApprovedBy`, `ApprovalDate`, `SentToSupplierAt`, `CreatedByName`; `UpdatePurchaseOrderDto.PaymentStatus` (accepted then silently ignored, :293-295); PO `closed` (reachable only via generic PATCH, no business process drives it); invoice `pending` (written but undocumented).

## 4. TEJ / RiTEJ / Retenue à la Source compliance

XML produced: `DeclarationsRS[@VersionSchema=1.0]` → `Declarant` → `ReferenceDeclaration` → `AjouterCertificats|ModifierCertificats|AnnulerCertificats` → `Certificat` plus group totals. Amounts in millimes (x1000, integer), dates `dd/MM/yyyy`, no BOM.

### Critical
- **`ActeDepot` hardcoded to `0`** (RSService.cs:859) even when the file contains `ModifierCertificats`/`AnnulerCertificats` blocks — a rectifying deposit is declared as an initial one.
- **No deposit sequence.** Filename is always `{taxId}-{year}-{month}-0.xml` (:374); re-exporting a month yields a duplicate deposit reference.
- **Post-sync invoice edits silently desynchronise the declaration.** `UpdateInvoiceAsync` has no `TejSynced`/`RsRecordId` guard (contrast `UpdateRSRecordAsync`, which does block on `TEJExported`, :224-225), and `EnsureRsRecordPersistedAsync` returns the existing record without re-syncing (:573-580). RS rate/amount can change after export while declared figures stay stale, with no audit trail.
- **`TejActe` freely settable by PATCH** (SupplierInvoiceService.cs:390) with no state machine — an invoice can be flipped to Annuler after the fact while the linked `RSRecord` never changes.

### High
- **Rate divergence:** `RS_RATES["05"] = 0.5%` (RSService.cs:19-30) while `TejOperationCodes.LegacyToOperationCode` maps `05` to `RS3_000003` whose `DefaultRate = 5%`. `IdTypeOperation` and `MontantRS` contradict each other.
- **`TauxRS` encoding unverified** — `(int)Math.Round(rate * 100)` (:938) yields `50` for 0.5% and `150` for 1.5%; never validated against the RiTEJ XSD numeric format.
- **`GetRSRate` keys off `RSTypeCode` while `IdTypeOperation` writes `OperationCode`** — the two can be unrelated; no cross-validation in `CollectRecordFieldErrors` (:613-640).
- **`MontantTVA` is populated with `RsTvaAmount`** (withheld VAT), not the invoice's real VAT (:937), while `MontantRSTVA` uses the same figure.
- **`MontantHT` is populated from `AmountPaid`/`GrandTotal`** (:936,504-505), which are TTC and already net of RS — not an HT base.

### Medium / Low
- Matricule Fiscale validated as `^\d{10,15}$` (:102) — rejects valid alphanumeric MFs, accepts invalid ones; and this check never runs on the invoice-driven path (non-empty only).
- `ToUtcKind`/`AsUtc` relabel Unspecified dates as UTC without converting — month-boundary invoices can land in the wrong reporting period.
- Penalty hardcoded to `0` for invoice-driven records (:545) even when `IsOverdue` is true; the 5%/month logic only runs on the manual path.
- Export-time duplicate detection is in-batch only (:323-331).
- `RefCertifChezDeclarant` falls back to the DB auto-increment id (:550,908) — not portable across restores.
- `Trunc()` silently cuts names/addresses at 200/50 chars with no warning.
- `BeneficiaireCategorie` defaults to `PM`, mis-declaring sole proprietors.
- No XSD validation anywhere before the XML is returned.

## 5. Frontend findings (`src/modules/purchases`)

**What is real:** routes and `PermissionRoute` gating (PurchasesModule.tsx:53-102); `purchaseService.ts` REST layer with envelope unwrapping, structured `ApiError`, idempotency keys on all creates; TEJ XML download to blob with a real `missing[]` → `TejMissingInfoDialog` flow; optimistic single/bulk delete with index-accurate rollback (bulkDelete.ts:30-96); `PurchaseOrderStatusFlow` wired to real PATCHes; `apiErrorToast` code→i18n mapping.

### High
1. **Action-level permission gating is missing inside pages.** Row Edit/Delete (PurchaseOrderListPage.tsx:685-701,771-785), `BulkActionBar` approve/send/close/delete, and detail-page status/TEJ/FEL buttons render on `purchases:read` alone. Combined with backend finding 3.1 this is a genuine security gap, not just UX.

### Medium
2. **Arabic locale is missing 20 keys**, concentrated in the TEJ/FEL/RS dialogs (en/fr = 419 keys, ar = 392) — the most legally sensitive screens fall back to raw keys or English.
3. **Supplier picker hard-capped at 500** with client-side filtering only, via a raw `apiFetch` bypassing the service layer (CreatePurchaseOrderPage.tsx:65,341-347); suppliers beyond the cap are unselectable.
4. **Bulk lifecycle success path** patches only `status` locally and never refetches stat cards or reconciles the server object (PurchaseOrderListPage.tsx:348-364).
5. **FEL has no async status handling** — one POST, no polling, no pending/rejected state (SupplierInvoiceDetailPage.tsx:271-320).

### Low
6. Stat cards fire 8 parallel `getAll(limit:1)` requests per debounce tick instead of one aggregate endpoint (:210-245).
7. `plugin.ts:13` declares `routes: []` despite 20+ real routes.
8. Delete does not refresh stats.
9. Supplier-name dedup regex (:86) is a data-quality band-aid.
10. No react-query in the module — every page hand-rolls `useState`/`useEffect`; no cache, no invalidation.
11. Saved views are `localStorage`-only (intentional, but not synced).
12. Offline: no IndexedDB, no queue, no `navigator.onLine` checks.

## 6. Cross-checks worth noting

- FEL looks LIVE from the frontend (a real POST to a real endpoint) but is FAKE end-to-end — do not judge it from the network tab.
- Stock is only ever moved by receipts, never by POs or invoices — correct separation, but the UI has no visibility confirming a receipt actually moved stock.
- `IStockTransactionService` is called inside the receipt's ambient transaction; if it ever opens its own `BeginTransactionAsync`, every receipt would throw on Npgsql. Worth an explicit verification.

## 7. Recommended fix order

1. Remove or relabel FEL (3.2) — it currently fabricates compliance state.
2. Guard post-sync invoice edits and re-sync `RSRecord`; add a `TejActe` state machine (section 4, critical).
3. Fix `ActeDepot` and deposit sequence numbering (section 4, critical).
4. Fix partial-invoice `LineTotal` (3.3) — a live financial miscalculation.
5. Make TEJ XML generation a POST, or split pure preview from persisting declaration (3.4).
6. Add RBAC on controllers, then mirror it with action-level gating in the UI (3.1 and 5.1).
7. Single source of truth for RS rates; reconcile the `05` divergence.
8. Correct `MontantHT` / `MontantTVA` semantics.
9. Soft-delete `RSRecord`; add item-level audit logging (3.5, 3.12).
10. Serializable/row lock on `UpdateOrderAsync`; log numbering fallbacks; remove the `pending` status (3.6-3.8).
11. Fill the 20 missing Arabic keys; paginate the supplier picker (5.2-5.3).
---

## Resolution log (this pass)

| Issue | Status | Fix |
| --- | --- | --- |
| Partial invoice copied the full PO line total | FIXED | `ProRatePoLineTotal` scales by invoiced/ordered qty (create + add/update item paths) |
| RS rate table duplicated / drifted in `SupplierInvoiceService` | FIXED | Recalc now resolves through `RsRates.GetEffectiveRate(operationCode, typeCode)` |
| Edits after TEJ export silently invalidated the filed declaration | FIXED | Fiscally material edits flip the invoice to `requires_resync`, set `TejActe=1`, and reopen the RS record with `DepotSequence+1` |
| TEJ-declared invoices could be soft-deleted | FIXED | Delete blocked; annulment (Acte=2) required |
| Fake "Send F.E.L" toggle | FIXED | Endpoint now requires the TTN portal reference and records a manual submission; UI asks for it and no longer claims a transmission |
| No RBAC on purchase / RS endpoints | FIXED | `[RequirePermission("purchases", <action>)]` on every purchase, goods-receipt, article-supplier, supplier-invoice and RS endpoint (MainAdminUser bypass) |
| `tej-xml` GET was thought to be state-changing | NOT AN ISSUE | Verified: the build path does not persist |

Backend changes are unverified by a compiler — `dotnet` is not available in this environment.
