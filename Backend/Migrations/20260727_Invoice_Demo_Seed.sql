-- ============================================================================
-- Invoice demo seed — creates random invoices from existing sales.
--
-- What it does per tenant that has un-invoiced, non-cancelled sales with items:
--   * Picks up to 25 random eligible sales
--   * For each, creates one Invoice header + InvoiceLines cloned from SaleItems
--     (SourceType='sale_item', SourceId=SaleItem.Id)
--   * Assigns a random status distribution:
--       ~20% draft   (no number, no IssueDate, no PostedAt)
--       ~35% posted  (numbered, IssueDate + DueDate set; ~40% overdue)
--       ~35% paid    (numbered + matching 'completed' row in payments)
--       ~10% void    (numbered, VoidReason set)
--   * Writes an InvoiceActivity row for each lifecycle step
--   * Idempotent: skips a sale that already has an invoice created by this
--     seed (CreatedBy='seed').
--
-- To wipe seed data:
--   DELETE FROM payments           WHERE created_by = 'seed' AND entity_type='invoice';
--   DELETE FROM "InvoiceActivities" WHERE "CreatedBy" = 'seed';
--   DELETE FROM "InvoiceLines"      WHERE "InvoiceId" IN
--       (SELECT "Id" FROM "Invoices" WHERE "CreatedBy" = 'seed');
--   DELETE FROM "Invoices"          WHERE "CreatedBy" = 'seed';
-- ============================================================================

DO $$
DECLARE
    v_tenant       INTEGER;
    v_sale         RECORD;
    v_item         RECORD;
    v_invoice_id   INTEGER;
    v_subtotal     NUMERIC(18,2);
    v_tax_total    NUMERIC(18,2);
    v_grand        NUMERIC(18,2);
    v_status       VARCHAR(20);
    v_number       VARCHAR(50);
    v_issue_date   TIMESTAMPTZ;
    v_due_date     TIMESTAMPTZ;
    v_posted_at    TIMESTAMPTZ;
    v_void_at      TIMESTAMPTZ;
    v_void_reason  VARCHAR(500);
    v_idx          INTEGER;
    v_line_total   NUMERIC(18,2);
    v_tax_amount   NUMERIC(18,2);
    v_tax_rate     NUMERIC(5,2);
    v_has_payments BOOLEAN;
    v_seq          INTEGER := 0;
BEGIN
    -- Detect if the payments table exists so we can wire "paid" invoices to it.
    SELECT EXISTS (SELECT 1 FROM information_schema.tables
                    WHERE table_schema='public' AND table_name='payments')
      INTO v_has_payments;

    FOR v_tenant IN
        SELECT DISTINCT s."TenantId"
          FROM "Sales" s
          JOIN "SaleItems" si ON si."SaleId" = s."Id"
         WHERE s."IsDeleted" = FALSE
           AND lower(coalesce(s."Status",'')) <> 'cancelled'
    LOOP
        FOR v_sale IN
            SELECT s."Id"        AS sale_id,
                   s."TenantId"  AS tenant_id,
                   s."ContactId" AS contact_id,
                   s."SaleNumber",
                   s."Title",
                   coalesce(s."Currency",'TND') AS currency,
                   s."CreatedDate"
              FROM "Sales" s
             WHERE s."TenantId"  = v_tenant
               AND s."IsDeleted" = FALSE
               AND lower(coalesce(s."Status",'')) <> 'cancelled'
               AND EXISTS (SELECT 1 FROM "SaleItems" si WHERE si."SaleId" = s."Id")
               AND NOT EXISTS (
                     SELECT 1 FROM "Invoices" i
                      WHERE i."SaleId" = s."Id"
                        AND i."CreatedBy" = 'seed'
                        AND i."IsDeleted" = FALSE)
             ORDER BY random()
             LIMIT 25
        LOOP
            v_seq := v_seq + 1;

            -- Decide the lifecycle bucket up-front so we can populate the header once.
            v_status := (ARRAY['draft','draft','posted','posted','posted','paid','paid','paid','paid','void'])
                        [1 + floor(random()*10)::int];

            v_issue_date := NULL;
            v_due_date   := NULL;
            v_posted_at  := NULL;
            v_void_at    := NULL;
            v_void_reason:= NULL;
            v_number     := NULL;

            IF v_status <> 'draft' THEN
                -- Issue date within the last 120 days; ~40% chance of being past-due.
                v_issue_date := (now() - (floor(random()*120)::int || ' days')::interval);
                v_due_date   := v_issue_date + ((15 + floor(random()*30)::int) || ' days')::interval;

                -- Roughly 40% of posted invoices land in the "overdue" bucket
                -- (due date in the past, still unpaid).
                IF v_status = 'posted' AND random() < 0.4 THEN
                    v_issue_date := now() - '60 days'::interval;
                    v_due_date   := now() - '10 days'::interval;
                END IF;

                v_posted_at := v_issue_date + '5 minutes'::interval;
                -- Use the source sale id in the number: seeds create at most
                -- one invoice per sale (idempotency guard above), so this is
                -- stable and unique per tenant across re-runs on the same day.
                v_number    := 'INV-' || to_char(v_issue_date,'YYYYMMDD') || '-'
                            || lpad(v_sale.sale_id::text, 6, '0');
            END IF;

            IF v_status = 'void' THEN
                v_void_at     := v_posted_at + '2 days'::interval;
                v_void_reason := (ARRAY['Customer cancelled',
                                        'Duplicate invoice',
                                        'Wrong contact',
                                        'Re-issued with corrected lines'])
                                 [1 + floor(random()*4)::int];
            END IF;

            -- Header (subtotal/tax/grand filled after lines are inserted).
            INSERT INTO "Invoices" (
                "TenantId","IsDeleted","InvoiceNumber","Status","ContactId","SaleId",
                "Title","Notes","Currency","Subtotal","TaxAmount","GrandTotal","AmountPaid",
                "IssueDate","DueDate","PostedAt","VoidedAt","VoidReason","CreatedBy","CreatedAt"
            ) VALUES (
                v_sale.tenant_id, FALSE, v_number, v_status, v_sale.contact_id, v_sale.sale_id,
                coalesce(v_sale."Title", 'Invoice for ' || v_sale."SaleNumber"),
                'Demo invoice generated from sale ' || v_sale."SaleNumber",
                v_sale.currency, 0, 0, 0, 0,
                v_issue_date, v_due_date, v_posted_at, v_void_at, v_void_reason,
                'seed', coalesce(v_issue_date, now())
            )
            RETURNING "Id" INTO v_invoice_id;

            -- Clone SaleItems into InvoiceLines (SourceType='sale_item').
            v_idx      := 0;
            v_subtotal := 0;
            v_tax_total:= 0;
            FOR v_item IN
                SELECT si."Id",
                       coalesce(si."ItemName", si."Description", 'Item') AS name,
                       si."Description",
                       coalesce(si."Quantity",1)  AS qty,
                       coalesce(si."UnitPrice",0) AS price,
                       coalesce(si."TaxRate",0)   AS tax_rate
                  FROM "SaleItems" si
                 WHERE si."SaleId" = v_sale.sale_id
                 ORDER BY si."DisplayOrder", si."Id"
            LOOP
                v_tax_rate   := v_item.tax_rate;
                v_line_total := round((v_item.qty * v_item.price)::numeric, 2);
                v_tax_amount := round((v_line_total * v_tax_rate / 100.0)::numeric, 2);

                INSERT INTO "InvoiceLines" (
                    "TenantId","InvoiceId","SourceType","SourceId","ItemName","Description",
                    "Quantity","Unit","UnitPrice","TaxRate","LineTotal","TaxAmount",
                    "DisplayOrder","CreatedAt"
                ) VALUES (
                    v_sale.tenant_id, v_invoice_id, 'sale_item', v_item."Id"::text,
                    left(v_item.name, 255), v_item."Description",
                    v_item.qty, NULL, v_item.price, v_tax_rate,
                    v_line_total, v_tax_amount, v_idx, coalesce(v_issue_date, now())
                );

                v_subtotal := v_subtotal + v_line_total;
                v_tax_total := v_tax_total + v_tax_amount;
                v_idx := v_idx + 1;
            END LOOP;

            v_grand := v_subtotal + v_tax_total;

            UPDATE "Invoices"
               SET "Subtotal"   = v_subtotal,
                   "TaxAmount"  = v_tax_total,
                   "GrandTotal" = v_grand,
                   "AmountPaid" = CASE WHEN v_status = 'paid' THEN v_grand ELSE 0 END
             WHERE "Id" = v_invoice_id;

            -- Activity trail: one row per lifecycle step actually taken.
            INSERT INTO "InvoiceActivities"
                ("TenantId","InvoiceId","ActivityType","Description","OldValue","NewValue","CreatedAt","CreatedBy")
            VALUES
                (v_sale.tenant_id, v_invoice_id, 'created_from_sale',
                 'Draft invoice seeded from sale #' || v_sale.sale_id || ' (' || v_idx || ' line(s)).',
                 NULL, v_sale.sale_id::text,
                 coalesce(v_issue_date, now()) - '10 minutes'::interval, 'seed');

            IF v_status IN ('posted','paid','void') THEN
                INSERT INTO "InvoiceActivities"
                    ("TenantId","InvoiceId","ActivityType","Description","OldValue","NewValue","CreatedAt","CreatedBy")
                VALUES
                    (v_sale.tenant_id, v_invoice_id, 'posted',
                     'Invoice posted as ' || v_number || ' — total ' || v_grand || ' ' || v_sale.currency,
                     'draft', v_number, v_posted_at, 'seed');
            END IF;

            IF v_status = 'void' THEN
                INSERT INTO "InvoiceActivities"
                    ("TenantId","InvoiceId","ActivityType","Description","OldValue","NewValue","CreatedAt","CreatedBy")
                VALUES
                    (v_sale.tenant_id, v_invoice_id, 'voided',
                     'Invoice voided. Reason: ' || v_void_reason,
                     'posted', 'void', v_void_at, 'seed');
            END IF;

            -- Paid invoices need a matching payments row so
            -- RecalculatePaymentStateAsync agrees with the header.
            IF v_status = 'paid' AND v_has_payments THEN
                EXECUTE format($f$
                    INSERT INTO payments
                        (id, entity_type, entity_id, amount, currency,
                         payment_method, payment_date, status, notes,
                         created_by, created_at, updated_at)
                    VALUES
                        (%L, 'invoice', %L, %s, %L,
                         (ARRAY['cash','bank_transfer','card','cheque'])[1 + floor(random()*4)::int],
                         %L, 'completed', 'Seed payment for demo invoice',
                         'seed', %L, now())
                $f$,
                    gen_random_uuid()::text, v_invoice_id::text,
                    v_grand, v_sale.currency,
                    v_posted_at + '1 day'::interval, v_posted_at + '1 day'::interval);

                INSERT INTO "InvoiceActivities"
                    ("TenantId","InvoiceId","ActivityType","Description","OldValue","NewValue","CreatedAt","CreatedBy")
                VALUES
                    (v_sale.tenant_id, v_invoice_id, 'auto_marked_paid',
                     'Fully paid (' || v_grand || ' ' || v_sale.currency || ') — status advanced to paid.',
                     'posted', 'paid', v_posted_at + '1 day 5 minutes'::interval, 'seed');
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Invoice seed complete: % invoices created.', v_seq;
END $$;
