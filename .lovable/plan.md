## Goal

When recording a payment (Payment Summary → Add Payment), let the user attach a proof file (PDF, image, Office doc). The proof is:
1. stored through the same document system already used by Sales/Offers (`/api/Documents/upload`),
2. shown in the Payment History row with view/download,
3. also visible in the related document's Documents tab, named `invoice_<InvoiceNumber>_payment_<Ref>_<originalname>`.

## How it fits what already exists

- Upload path already exists: `DocumentsService.uploadDocuments({ files, moduleType, moduleId, moduleName, category })` → `Document` rows with `ModuleType` / `ModuleId`, used by `UnifiedDocumentsSection` on sales/offers. Nothing new is invented; payments just call the same service.
- Preview/download already exists: `FilePreviewModal` + `DocumentsService.downloadDocument`.
- Payments already carry `EntityType` (`offer | sale | invoice`) and `EntityId`, so the "related document" is already known.

## Backend changes

1. **Payment entity + DTOs** (`Backend/Modules/Payments/Models/PaymentModels.cs`, `DTOs/PaymentDtos.cs`)
   - Add nullable `ProofDocumentId` (int?), `ProofDocumentName` (string?), `ProofDocumentUrl` (string?) to `Payment`, `PaymentDto`, `CreatePaymentDto`, and an update DTO.
   - All nullable → existing payments and any client that omits them keep working.
2. **Migration** — additive `ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_document_id ... proof_document_name ... proof_document_url`. No data backfill, no constraint, no FK cascade (a deleted document just leaves a dangling name, handled gracefully in UI).
3. **PaymentService** — map the three fields on create/get/update. On delete of a payment, do **not** delete the document (documents stay in the entity's document tab; deleting is done from there).
4. No change to totals, status sync, or receipt logic — proof is metadata only.

## Frontend changes

1. **`src/modules/payments/types.ts`** — add the three optional fields to `Payment` and `CreatePaymentData`.
2. **Add Payment dialog** (`PaymentsTab.tsx`, the dialog at line ~695)
   - New optional "Proof of Payment" field after Notes: drop-zone/file button accepting `application/pdf`, `image/*`, and common office types, single file, max size aligned with the existing document upload limit.
   - Show selected file chip with remove (x). Upload happens on **Save Payment**, before `paymentsApi.create`, so a cancelled dialog uploads nothing.
   - Upload call:
     ```
     DocumentsService.uploadDocuments({
       files: [file],
       moduleType: entityType === 'invoice' ? 'invoices' : entityType === 'sale' ? 'sales' : 'offers',
       moduleId: entityId,
       moduleName: `${entityNumber}_payment_${reference}_${file.name}`,
       category: 'crm',
     })
     ```
     The returned document id/name/url go into the create-payment payload.
   - If the upload fails: show the error and do **not** create the payment (avoids a payment claiming a proof that doesn't exist). If the payment create fails after upload, keep the document (it's already in the entity's document tab) and surface the error.
3. **Payment History rows** — add a small paperclip/file button when `proofDocumentId` exists: click opens the existing `FilePreviewModal` (images/PDF inline), with a download fallback for non-previewable types. Rows without a proof render exactly as today.
4. **Naming in the related document tab** — because the upload is posted with `moduleType`/`moduleId` of the invoice/sale/offer, the file automatically appears in that record's Documents tab; `moduleName` carries the `invoice_<number>_payment_<ref>_<filename>` label. For an invoice linked to a sale, the file is attached to the invoice; the sale's document view already aggregates related-entity documents through `UnifiedDocumentsSection`'s "From" grouping, so it surfaces there too without extra work.

## Safety / non-breaking notes

- Every new column and field is nullable/optional; old rows, old payloads and the receipt PDF are untouched.
- No changes to payment amount, allocation, installment, plan, or invoice/sale status logic.
- No new upload infrastructure, permissions, or storage buckets — reuses the audited `/api/Documents` path with existing tenant scoping.
- Deleting a proof document from the Documents tab only makes the history button fall back to a disabled/"file removed" state.

## Verification before finishing

- Add a payment with a PDF, with a PNG, and with no file at all.
- Confirm the history row's view button opens each file, and that the file shows in the invoice's Documents tab with the composed name.
- Confirm existing payments (no proof) render and export receipts unchanged.
