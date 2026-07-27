import type { ModuleGuideMap } from "../types";

export const SALES_CYCLE_GUIDES: ModuleGuideMap = {
  contacts: {
    key: "contacts",
    purpose:
      "The Contacts module is the shared directory of people and companies used across the CRM — customers, leads, and suppliers all live here as the same underlying record. It stores notes, tags, activity history, user-group assignments, and a kanban of related tasks for each contact. It also powers bulk import from CSV/XLSX with AI-assisted column mapping, and the separate 'Suppliers' view is just a filtered version of the same Contact entity.",
    workflows: [
      {
        name: "Add a contact manually",
        steps: [
          "Open Contacts and click Add.",
          "Enter name, email, phone and other details.",
          "Save — the system checks that the email isn't already used by another contact.",
          "Optionally assign tags and a user group from the contact detail page.",
        ],
      },
      {
        name: "Bulk import contacts from a spreadsheet",
        steps: [
          "Upload a CSV or XLSX file in the import flow.",
          "The AI column mapper suggests which spreadsheet columns map to which contact fields.",
          "Choose whether to skip duplicate emails or let the import fail on them.",
          "Large files are chunked automatically so the browser doesn't freeze.",
          "Review the import result: skipped duplicates are reported as errors per-row rather than failing the whole batch.",
        ],
      },
      {
        name: "Use a contact as a supplier",
        steps: [
          "Open the Suppliers view, which lists the same Contact records filtered by type.",
          "Create or edit a supplier the same way as a regular contact.",
          "The supplier can then be linked to Purchase Orders in the Purchases module.",
        ],
      },
    ],
    rules: [
      {
        title: "Duplicate email is blocked",
        detail: "Creating, updating, or importing a contact with an email that already exists throws \"A contact with this email already exists\" (ContactService.cs).",
      },
      {
        title: "Import can skip duplicates instead of failing",
        detail: "When the SkipDuplicates option is set, an import records \"Duplicate email: ...\" as a per-row error instead of aborting the whole batch.",
      },
      {
        title: "Email format and length",
        detail: "Frontend validation requires a basic email pattern and caps length at 255 characters.",
      },
      {
        title: "Name cannot contain digits",
        detail: "The name field is validated against a regex that rejects any numeric characters.",
      },
      {
        title: "Amount bounds",
        detail: "Any amount field on a contact must be greater than 0 and no more than 999,999,999.",
      },
      {
        title: "Tags and user groups are separate operations",
        detail: "Tag and user-group assignment go through their own join endpoints, not through the main contact update (PATCH) call.",
      },
      {
        title: "De-duplication is email-only",
        detail: "Import de-duplication only checks email — duplicate phone numbers or names are not detected.",
      },
      {
        title: "Soft delete, not hard delete",
        detail: "Contacts use an IsDeleted flag referenced by every other module's queries; hard-deleting a contact can leave dangling references since there's no guaranteed FK cascade.",
      },
    ],
    integrations: [
      "Deals, Offers, Sales, Invoices and Payments all reference a Contact by ID as the customer/supplier.",
      "Suppliers view reuses the Contact entity, and suppliers are linked to Purchase Orders in Purchases.",
      "Contact activity timeline aggregates events logged from other modules (sales, projects, tasks).",
    ],
    gotchas: [
      "Hard-deleting a contact is risky: other modules join to it by ID with no cascade guarantee, so orphaned references can appear.",
      "Duplicate detection only looks at email — two contacts with the same phone or name are allowed.",
      "Suppliers and Contacts are the same table under the hood, so changes in one place affect the other view too.",
    ],
    sources: [
      "src/modules/contacts",
      "Backend/Modules/Contacts/ContactService.cs",
      "src/modules/contacts/hooks/useContactValidation.ts",
    ],
  },

  deals: {
    key: "deals",
    purpose:
      "Deals is the top of the sales funnel — a CRM pipeline for tracking opportunities before they become real, priced transactions. Deals move through fixed pipeline stages on a kanban board, and a deal can be converted into a Project, Offer, or Sale once it's ready to move forward. Deals are kept separate from Offers and Sales so pre-sale opportunity tracking doesn't get mixed with actual quoting and invoicing.",
    workflows: [
      {
        name: "Create and progress a deal",
        steps: [
          "Add a new deal with an estimated value and a contact.",
          "Add deal line items if the estimated value should be built from itemized amounts.",
          "Drag the deal across kanban stages: lead → qualified → proposal → negotiation.",
          "Mark the deal won or lost once the outcome is known.",
        ],
      },
      {
        name: "Convert a won deal downstream",
        steps: [
          "Open a deal and choose Convert.",
          "Select whether to convert it into a Sale, an Offer, or a Project.",
          "The system creates the target record and links its ID back to the deal.",
          "The original deal is kept (not deleted) so history is preserved.",
        ],
      },
    ],
    rules: [
      {
        title: "Fixed pipeline stages",
        detail: "Stages are fixed to lead, qualified, proposal, negotiation, won, lost, defined both in the frontend (lib/dealStages.ts) and mirrored server-side in DealService.cs.",
      },
      {
        title: "Open vs closed stages",
        detail: "OPEN_STAGES excludes won and lost; this drives 'open pipeline value' analytics.",
      },
      {
        title: "Pagination is clamped",
        detail: "Page numbers below 1 are reset to 1, limit below 1 defaults to 20, and limit above 200 is capped at 200 to avoid divide-by-zero on total pages.",
      },
      {
        title: "Conversion is additive, not destructive",
        detail: "Converting a deal to a Sale/Offer/Project doesn't delete the deal — it links the downstream record's ID instead.",
      },
      {
        title: "Stage values are free strings server-side",
        detail: "There's no enum or DB constraint on stage, so an unrecognized stage value sent by a client silently bypasses OPEN_STAGES classification.",
      },
      {
        title: "Activity logging",
        detail: "Deal activity is logged through a shared activity logger tagged with ParentEntityType 'Deal'.",
      },
    ],
    integrations: [
      "Converts into a Sale via ISaleService, into an Offer via IOfferService, or into a Project via IProjectService.",
      "Can create linked Tasks through ITaskService during conversion.",
      "Deal items feed the deal's EstimatedValue, similar to line items in Offers/Sales.",
    ],
    gotchas: [
      "Because stage is an untyped string server-side, a bad or unexpected stage value won't error — it just won't be counted as open or closed correctly.",
      "Converting doesn't close/remove the deal automatically; you may end up with a 'won' deal that still shows as active in some views.",
    ],
    sources: [
      "src/modules/deals",
      "src/lib/dealStages.ts",
      "Backend/Modules/Deals/DealService.cs",
    ],
  },

  offers: {
    key: "offers",
    purpose:
      "Offers is the quoting module: build a proposal with line items, send it to a contact, track it through a status funnel, and convert an accepted offer into a real Sale (and optionally a Service Order). It also generates PDF quotes and supports renewing an expired offer instead of starting over.",
    workflows: [
      {
        name: "Create and send an offer",
        steps: [
          "Create an offer with line items for a contact (starts as draft).",
          "Review the computed totals (discount, tax, stamp).",
          "Send the offer — this only works from draft status and moves it to sent.",
          "The system logs a 'sent' activity and increments the offer's SentCount.",
        ],
      },
      {
        name: "Convert an accepted offer to a Sale",
        steps: [
          "Move the offer through the funnel (sent → pending/negotiation → accepted).",
          "Trigger Convert on the offer.",
          "If project settings require a linked project before conversion, attach one first.",
          "The system creates a Sale with its own number and stamps ConvertedToSaleId/ConvertedAt on the offer.",
          "The offer is tagged 'Converted'; optionally a Service Order is created at the same time.",
          "Re-converting the same offer is blocked once ConvertedToSaleId is set.",
        ],
      },
      {
        name: "Renew an expired offer",
        steps: [
          "Open an offer with status expired.",
          "Use the Renew action to duplicate/extend it as a fresh offer.",
        ],
      },
    ],
    rules: [
      {
        title: "Validated status whitelist",
        detail: "Allowed statuses are draft, sent, pending, negotiation, accepted, won, declined, lost, expired, cancelled; any other value defaults to draft.",
      },
      {
        title: "Finalized statuses lock the offer",
        detail: "accepted, won, and cancelled are finalized statuses that prevent further edits/transitions.",
      },
      {
        title: "Send requires draft status",
        detail: "The send action only works from draft — sending strictly requires draft → sent.",
      },
      {
        title: "Conversion cannot happen twice",
        detail: "If ConvertedToSaleId is already set, converting again throws an 'already converted' error.",
      },
      {
        title: "Optional project gating on conversion",
        detail: "If project settings require a project before converting an offer, conversion is blocked until the offer has a ProjectId.",
      },
      {
        title: "Accepted-without-conversion is tracked separately",
        detail: "An offer can be accepted but not yet converted; this edge state is recorded via AcceptedWithoutConversionAt.",
      },
      {
        title: "Numbering on creation and conversion",
        detail: "Offers get a number from the numbering service ('Offer'); a Sale created via conversion gets its own number ('Sale').",
      },
      {
        title: "Totals follow the same math as Sales",
        detail: "Offer line items are computed with the same discount → tax → stamp calculation pattern as Sales.",
      },
    ],
    statuses: [
      { name: "draft", meaning: "Initial editable state; not yet sent to the contact." },
      { name: "sent", meaning: "Offer has been sent to the contact." },
      { name: "pending", meaning: "Awaiting a decision from the contact." },
      { name: "negotiation", meaning: "Terms are being discussed/adjusted." },
      { name: "accepted", meaning: "Contact has accepted; finalized status, ready to convert." },
      { name: "won", meaning: "Finalized positive outcome." },
      { name: "declined", meaning: "Contact rejected the offer." },
      { name: "lost", meaning: "Offer did not result in a sale." },
      { name: "expired", meaning: "Offer validity period passed; can be renewed." },
      { name: "cancelled", meaning: "Finalized status; offer withdrawn." },
    ],
    integrations: [
      "Converts into a Sale (and optionally a Service Order) on acceptance.",
      "Can originate from a converted Deal.",
      "Payments can be recorded against an offer even before it has a nonzero total, unlike other entity types.",
      "Uses the shared numbering service for both Offer and resulting Sale numbers.",
    ],
    gotchas: [
      "Payments treats offers specially: a zero-or-negative total is allowed only for offers, not for sales/invoices.",
      "Conversion re-fetches the offer inside the transaction to avoid a race with concurrent status changes, but this means very fast repeated conversion attempts can still surface timing-sensitive errors.",
      "Finalized statuses (accepted/won/cancelled) block edits, so mistakes must be corrected via renew or a new offer, not by editing in place.",
    ],
    sources: [
      "src/modules/offers",
      "Backend/Modules/Offers/OfferService.cs",
      "src/lib/calculateTotal.ts",
    ],
  },

  sales: {
    key: "sales",
    purpose:
      "Sales holds confirmed sales orders — the authoritative money record created either directly ('fast add'), or from an accepted offer. It's the canonical source for order totals, drives stock deduction on fulfillment, and is the only entity Invoices can be generated from. It also supports generating PDF sale documents and converting a sale into a Service Order.",
    workflows: [
      {
        name: "Create a sale directly",
        steps: [
          "Use Fast Add Sale (or the full Add Sale form) to enter a contact and line items.",
          "The system computes subtotal, discount, tax and fiscal stamp automatically.",
          "Save the sale — it receives a sequential number.",
          "Optionally convert the sale to a Service Order.",
        ],
      },
      {
        name: "Create a sale from an offer",
        steps: [
          "Open an accepted offer and choose to convert it, or call the sale's dedicated from-offer route.",
          "The sale inherits line items and totals from the offer.",
          "The sale gets its own number via the numbering service.",
        ],
      },
      {
        name: "Close out a sale and invoice it",
        steps: [
          "Update the sale status to closed/won/completed once fulfilled.",
          "This closure transition fires workflow triggers and stock transactions.",
          "Generate an Invoice from the sale (the sale must not be cancelled).",
        ],
      },
    ],
    rules: [
      {
        title: "Line total formula",
        detail: "Each line total is qty * unitPrice minus discount (percentage or fixed), floored at 0 and rounded to 2 decimal places.",
      },
      {
        title: "Strict totals pipeline",
        detail: "Header totals are computed in a fixed order: Subtotal → Discount → Tax (applied on the after-discount amount) → Fiscal stamp → GrandTotal.",
      },
      {
        title: "Discount capped at subtotal",
        detail: "The discount amount can never exceed the subtotal (Math.Min(discountAmount, subtotal)).",
      },
      {
        title: "Effective tax rate is back-computed",
        detail: "EffectiveTaxRate = taxAmount / afterDiscount * 100, so invoices generated from the sale can redistribute tax proportionally across invoice lines.",
      },
      {
        title: "Empty sales keep their manual total",
        detail: "A sale with no line items keeps its manually entered TotalAmount instead of being recomputed to zero, preventing a fixed stamp/tax from fabricating a nonzero total.",
      },
      {
        title: "Discount type is implicit",
        detail: "Sale has no explicit DiscountType column — presence of DiscountPercent implies 'percentage', otherwise it's treated as a fixed discount.",
      },
      {
        title: "Closing status triggers downstream effects",
        detail: "Setting status to closed, won, or completed marks the previously-open sale as closed, which fires workflow triggers and stock transactions.",
      },
      {
        title: "Numbering on create and conversion",
        detail: "A new sale number is issued both on direct creation and when converting from an offer.",
      },
      {
        title: "Unknown sort field falls back silently",
        detail: "An unrecognized sortBy value silently falls back to updated_at rather than erroring.",
      },
    ],
    integrations: [
      "Can be created from a converted Offer via a dedicated from-offer/{offerId} route.",
      "Is the only source Invoices can be generated from.",
      "Drives stock deduction via IStockTransactionService and can fire workflow triggers via IWorkflowTriggerService.",
      "Payments can be recorded directly against a sale.",
      "Can be converted into a Service Order.",
    ],
    gotchas: [
      "There's a dependency cycle with Invoices/ServiceOrders, resolved lazily via the service provider rather than direct injection — a sign the module boundary is tightly coupled.",
      "Because DiscountType is implicit from whether DiscountPercent is set, editing a sale to clear that field can silently change how the discount is interpreted.",
    ],
    sources: [
      "src/modules/sales",
      "Backend/Modules/Sales/SaleService.cs",
      "Backend/Modules/Sales/SaleTotalsCalculator.cs",
      "src/lib/calculateTotal.ts",
    ],
  },

  invoices: {
    key: "invoices",
    purpose:
      "Invoices is the formal customer invoice ledger, always generated from a posted Sale — you cannot create a standalone invoice. It handles the draft-to-posted lifecycle, deferred numbering, payment status aggregation, and PDF/report generation. Permissions for invoices piggyback on the Sales module's permission scope rather than having their own.",
    workflows: [
      {
        name: "Generate and post an invoice from a sale",
        steps: [
          "Open a sale that isn't cancelled and create an invoice from it.",
          "The invoice is created as a draft with no invoice number yet.",
          "Edit the draft as needed (drafts can be freely edited/deleted).",
          "Post the invoice — this assigns the invoice number and locks the sequence.",
        ],
      },
      {
        name: "Handle payment and overdue status",
        steps: [
          "Record payments against the posted invoice (via Payments).",
          "The system tracks AmountPaid against GrandTotal.",
          "If DueDate has passed and (GrandTotal - AmountPaid) > 0, the invoice shows as overdue — computed on the fly, not stored.",
          "Mark the invoice paid once fully settled, or void/reopen it if needed.",
        ],
      },
    ],
    rules: [
      {
        title: "Must originate from a sale",
        detail: "CreateDraftAsync throws if SaleId is missing — every invoice must trace back to a sale.",
      },
      {
        title: "Cannot invoice a cancelled sale",
        detail: "If the sale's status is cancelled, invoice creation throws an error.",
      },
      {
        title: "Contact must match the sale",
        detail: "The invoice's contact must be the same as the originating sale's contact.",
      },
      {
        title: "Numbering deferred until posting",
        detail: "Drafts have no invoice number; the number is only assigned in PostAsync, so deleting/editing drafts never leaves gaps in the number sequence.",
      },
      {
        title: "Over-invoicing guard",
        detail: "Creating an invoice against a sale checks and enforces the sale total inside a transaction to prevent concurrent double-invoicing beyond the sale total.",
      },
      {
        title: "Overdue is computed, not stored",
        detail: "overdue = Status == 'posted' && DueDate < now && (GrandTotal - AmountPaid) > 0, evaluated dynamically rather than as a persisted status.",
      },
      {
        title: "Date fallback for drafts",
        detail: "Date-range filters use DueDate but fall back to CreatedAt for drafts that don't have an IssueDate.",
      },
      {
        title: "Search escapes wildcards",
        detail: "Search uses Postgres ILike with manual escaping of %, _ and \\ to avoid unintended wildcard matches and to use trigram indexes efficiently.",
      },
    ],
    statuses: [
      { name: "draft", meaning: "Editable, numberless, not yet finalized." },
      { name: "posted", meaning: "Finalized with an assigned invoice number." },
      { name: "void", meaning: "Cancelled after posting." },
      { name: "paid", meaning: "Fully settled (set via MarkPaidAsync)." },
    ],
    integrations: [
      "Always created from a Sale via from-sale/{saleId}.",
      "Payments are recorded against invoices and roll up into AmountPaid.",
      "Permission checks use the Sales module scope, not a separate invoices permission.",
    ],
    gotchas: [
      "Because drafts are numberless, searching/listing by invoice number naturally excludes unposted drafts.",
      "Invoice permissions are governed entirely by the Sales module's permission scope — there's no independent 'invoices' permission to grant or restrict.",
    ],
    sources: [
      "src/modules/invoices",
      "Backend/Modules/Invoices/InvoiceService.cs",
    ],
  },

  payments: {
    key: "payments",
    purpose:
      "Payments records money received against sales, offers, or invoices, tracks payment plans/installments, and generates receipts and reminder/confirmation emails. It has no standalone pages of its own — it's embedded as a tab inside the detail views of Sales, Offers, and Invoices.",
    workflows: [
      {
        name: "Record a payment against an invoice",
        steps: [
          "Open the invoice detail page and go to the Payments tab.",
          "Enter a payment amount (must be greater than 0).",
          "The system checks the invoice isn't void or still a draft (drafts must be posted first).",
          "It verifies the amount doesn't exceed the remaining balance beyond a small rounding tolerance.",
          "The payment is recorded, and a receipt with a unique reference number is generated.",
        ],
      },
      {
        name: "Set up and pay off an installment plan",
        steps: [
          "Create a payment plan against a sale/offer/invoice with installments.",
          "Record a payment against a specific installment.",
          "The system blocks overpaying an installment beyond its amount (plus rounding tolerance).",
          "When an installment is fully covered, it automatically flips to 'paid'.",
        ],
      },
      {
        name: "Send a payment reminder",
        steps: [
          "From the entity's Payments tab, trigger a reminder email.",
          "The system calls the generic reminder endpoint for that entity type.",
        ],
      },
    ],
    rules: [
      {
        title: "Amount must be positive",
        detail: "CreatePaymentAsync requires amount > 0.",
      },
      {
        title: "Entity type validation",
        detail: "entityType must be at least 3 characters long.",
      },
      {
        title: "Concurrency-safe overpay guard",
        detail: "The check-then-insert for remaining balance is wrapped in a Serializable transaction so two concurrent payments can't both pass the check and overpay.",
      },
      {
        title: "Cannot pay void or draft invoices",
        detail: "Paying a void invoice is blocked outright; paying a draft invoice is blocked until it's posted.",
      },
      {
        title: "Overpay tolerance",
        detail: "A payment exceeding the remaining amount by more than 0.009 throws, suggesting the user enter the remaining amount or issue a credit/refund instead.",
      },
      {
        title: "Offers are exempt from the nonzero-total rule",
        detail: "Normally a zero-or-negative entity total throws not-found, but offers (entityType == 'offer') are exempt since an offer's total can legitimately be zero pre-acceptance.",
      },
      {
        title: "Receipt numbers use a GUID suffix",
        detail: "Receipt numbers follow REC-{prefix3}-{entityId}-{8-char GUID}, chosen to avoid collisions without needing a DB unique constraint.",
      },
      {
        title: "Installment overpay guard mirrors the parent check",
        detail: "installment.PaidAmount + amount cannot exceed installment.Amount + 0.009; when fully paid, the installment auto-flips to 'paid'.",
      },
    ],
    integrations: [
      "Attaches to Sales, Offers and Invoices detail pages as an embedded tab — no page of its own.",
      "Uses EntityType/EntityId (a polymorphic string reference) to link to the parent record, with no DB foreign key.",
      "Sends reminder and confirmation emails via PaymentEmailService/PaymentReminderService.",
    ],
    gotchas: [
      "There is no database foreign key from Payments to Sales/Offers/Invoices — integrity is enforced only in application code, so a hard-deleted parent record can leave orphaned payments.",
      "Receipt numbers are not sequential (they include a GUID fragment), so they shouldn't be relied on for ordering.",
      "Payments has no plugin routes of its own (routes: []); it only appears inside other modules, which can make it easy to overlook when auditing permissions.",
    ],
    sources: [
      "src/modules/payments",
      "Backend/Modules/Payments/PaymentService.cs",
      "Backend/Modules/Payments/PaymentsController.cs",
    ],
  },

  purchases: {
    key: "purchases",
    purpose:
      "Purchases is the supplier-side procurement suite: Purchase Orders flow into Goods Receipts and then Supplier Invoices, backed by an article-supplier pricing catalog, a compliance dashboard for Tunisian TEJ e-invoicing, an audit log, and analytics reports. It's the largest and most structurally mature module, with flat bookmarkable routes rather than tabs.",
    workflows: [
      {
        name: "Create a purchase order and receive goods",
        steps: [
          "Create a Purchase Order with line items for a supplier; it starts as draft, then ordered once confirmed.",
          "Record a Goods Receipt against the order — only orders in 'ordered' or 'partially_received' status can receive goods.",
          "For each line, the system checks quantity received doesn't exceed the remaining (Quantity - ReceivedQty).",
          "Stock is incremented in the same transaction as the receipt, so a stock-write failure rolls back the whole receipt.",
          "The PO status updates to partially_received or received depending on how much has been received.",
        ],
      },
      {
        name: "Convert a receipt into a supplier invoice",
        steps: [
          "From a completed Goods Receipt, create a Supplier Invoice.",
          "The invoice gets its own number from the numbering service.",
          "Fill in TEJ compliance fields if required for Tunisian e-invoicing.",
          "Sync the invoice with TEJ or generate its TEJ XML.",
        ],
      },
      {
        name: "Retry a receipt submission safely",
        steps: [
          "Submit a Goods Receipt with an IdempotencyKey.",
          "If the same request is retried (e.g. due to a network error), the system returns the existing receipt instead of creating a duplicate or over-receiving.",
        ],
      },
    ],
    rules: [
      {
        title: "Over-receipt guard",
        detail: "For each PO line, remaining = poItem.Quantity - poItem.ReceivedQty; a receipt rejects negative or over-limit QuantityReceived, run under Serializable isolation to stop two concurrent receipts from over-receiving off stale data.",
      },
      {
        title: "Only certain PO statuses can receive goods",
        detail: "Goods receipts are only accepted against POs in 'ordered' or 'partially_received' status.",
      },
      {
        title: "Idempotent receipt submission",
        detail: "An IdempotencyKey on the request short-circuits retries, returning the existing receipt instead of creating a duplicate.",
      },
      {
        title: "Stock updates are transactional",
        detail: "Stock increments happen in the same DB transaction as the receipt and PO update, so failures roll back together; net per-article stock deltas are computed so edits/deletes reverse prior movements instead of double-applying.",
      },
      {
        title: "PO status buckets for stats",
        detail: "Purchase order stats bucket by draft, ordered, received, cancelled, with PendingReceipts = ordered + partially_received.",
      },
      {
        title: "Numbering with GUID fallback",
        detail: "PurchaseOrder, GoodsReceipt and SupplierInvoice each get numbers from the numbering service, falling back to a GUID-based format (PO-/GR-/SI- + date + 5-char suffix) if that service is unavailable.",
      },
      {
        title: "TEJ e-invoicing fields",
        detail: "SupplierInvoice carries TejActe, TejSynced, TejSyncDate, TejSyncStatus, TejErrorMessage for Tunisian compliance, with dedicated tej-xml and facture-en-ligne endpoints.",
      },
      {
        title: "Unknown sub-routes redirect to module root",
        detail: "Any unrecognized sub-path under Purchases redirects back to the module root rather than 404ing.",
      },
    ],
    statuses: [
      { name: "draft", meaning: "Purchase order not yet confirmed to the supplier." },
      { name: "ordered", meaning: "Confirmed order, eligible to receive goods." },
      { name: "partially_received", meaning: "Some but not all quantity has been received; still eligible for more receipts." },
      { name: "received", meaning: "Fully received." },
      { name: "cancelled", meaning: "Order cancelled." },
    ],
    integrations: [
      "Suppliers are Contact records shared with the Contacts module.",
      "Goods Receipts increase stock levels used elsewhere in the system.",
      "Supplier Invoices integrate with TEJ for Tunisian e-invoicing compliance.",
      "Uses the same centralized numbering service pattern as Sales/Offers.",
    ],
    gotchas: [
      "Purchase Orders, Goods Receipts and Supplier Invoices each have their own independently evolving status machine with no single shared enum — they can drift out of sync if one service is updated without the others.",
      "The goods-receipt edit path recomputes net stock deltas, which was previously buggy around double-applying stock changes on edits/deletes — worth double-checking after any changes to that path.",
    ],
    sources: [
      "src/modules/purchases",
      "Backend/Modules/Purchases/GoodsReceiptService.cs",
      "Backend/Modules/Purchases/PurchaseOrderService.cs",
      "Backend/Modules/Purchases/SupplierInvoiceService.cs",
    ],
  },
};
