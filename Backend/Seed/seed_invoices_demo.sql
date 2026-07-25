-- =====================================================================
-- Seed: 20 diverse customer Invoices linked to RANDOM existing Sales
-- =====================================================================
-- Idempotent: safe to run multiple times. Cleans up its own rows first
-- (identified by "CreatedBy" = 'seed-invoices-demo').
--
-- Diversity axes:
--   • Status: draft / posted / paid / void (mix)
--   • Amounts: small (< 500), mid (500-5000), large (> 5000)
--   • Dates:   fresh (this week), current-month, past-due (overdue),
--              far-past (paid), recently voided
--   • Payment: unpaid, partially paid, fully paid, overpaid-safe (=paid)
--   • Lines:   1 line, 3 lines, 6 lines (varied VAT rates 0 / 7 / 13 / 19)
--   • Sale link: every invoice references a REAL existing Sale
--                (picked at random from public."Sales")
--   • Currency & Notes vary
--   • InvoiceActivities audit trail is created for each non-draft invoice
-- =====================================================================

DO $$
DECLARE
    v_tenant        int := 1;                         -- adjust if multi-tenant
    v_user          varchar := 'seed-invoices-demo';
    v_sale_ids      int[];
    v_sale_map      jsonb := '{}'::jsonb;
    v_sale          record;
    v_pick          int;
    v_inv_id        int;
    v_now           timestamptz := now();
    v_issue         timestamptz;
    v_due           timestamptz;
    v_status        text;
    v_subtotal      numeric(18,2);
    v_tax           numeric(18,2);
    v_grand         numeric(18,2);
    v_paid          numeric(18,2);
    v_currency      varchar(10);
    v_note          text;
    v_title         text;
    v_void_reason   text;
    v_posted_at     timestamptz;
    v_voided_at     timestamptz;
    v_number        varchar(50);
    v_year          text := to_char(v_now, 'YYYY');
    v_seq           int;

    -- 20 invoice "recipes" — status / age-days / paid-pct / line-count / vat / currency / note
    v_recipes CONSTANT jsonb := '[
      {"status":"draft",  "age":  1, "paid":0.00, "lines":1, "vat":19, "cur":"TND", "note":"Draft — awaiting review before posting"},
      {"status":"draft",  "age":  3, "paid":0.00, "lines":3, "vat":19, "cur":"TND", "note":"Draft prepared by sales — needs manager approval"},
      {"status":"draft",  "age":  0, "paid":0.00, "lines":6, "vat":13, "cur":"TND", "note":"Draft with mixed VAT lines (13% services + 19% goods)"},
      {"status":"posted", "age":  5, "paid":0.00, "lines":2, "vat":19, "cur":"TND", "note":"Posted — 30 days net, awaiting first payment"},
      {"status":"posted", "age": 12, "paid":0.40, "lines":3, "vat":19, "cur":"TND", "note":"Partial payment received (40%) via bank transfer"},
      {"status":"posted", "age": 18, "paid":0.75, "lines":4, "vat":19, "cur":"TND", "note":"Partially paid — 25% remaining balance"},
      {"status":"posted", "age": 25, "paid":0.00, "lines":1, "vat":7,  "cur":"TND", "note":"Reduced VAT 7% — pharma product"},
      {"status":"posted", "age": 32, "paid":0.10, "lines":2, "vat":19, "cur":"TND", "note":"OVERDUE — customer contacted, promised payment next week"},
      {"status":"posted", "age": 45, "paid":0.00, "lines":3, "vat":19, "cur":"EUR", "note":"OVERDUE — export invoice EUR, second reminder sent"},
      {"status":"posted", "age": 60, "paid":0.50, "lines":5, "vat":19, "cur":"TND", "note":"OVERDUE — 50% paid, dispute on remaining line item"},
      {"status":"paid",   "age":  8, "paid":1.00, "lines":1, "vat":19, "cur":"TND", "note":"Paid in full — cash on delivery"},
      {"status":"paid",   "age": 15, "paid":1.00, "lines":3, "vat":19, "cur":"TND", "note":"Paid in full — bank transfer, ref TRX-8842"},
      {"status":"paid",   "age": 22, "paid":1.00, "lines":2, "vat":13, "cur":"TND", "note":"Paid — services invoice, cheque #4471"},
      {"status":"paid",   "age": 40, "paid":1.00, "lines":6, "vat":19, "cur":"TND", "note":"Paid — large project milestone completed"},
      {"status":"paid",   "age": 55, "paid":1.00, "lines":4, "vat":19, "cur":"EUR", "note":"Paid — international wire, EUR"},
      {"status":"paid",   "age": 90, "paid":1.00, "lines":2, "vat":0,  "cur":"TND", "note":"Paid — VAT-exempt export"},
      {"status":"void",   "age":  7, "paid":0.00, "lines":2, "vat":19, "cur":"TND", "note":"Voided — duplicate of another invoice"},
      {"status":"void",   "age": 20, "paid":0.00, "lines":3, "vat":19, "cur":"TND", "note":"Voided — customer cancelled order after posting"},
      {"status":"void",   "age": 35, "paid":0.00, "lines":1, "vat":19, "cur":"TND", "note":"Voided — pricing error, replacement invoice issued"},
      {"status":"void",   "age": 50, "paid":0.30, "lines":4, "vat":19, "cur":"TND", "note":"Voided after partial payment — refund processed separately"}
    ]'::jsonb;

    v_rec           jsonb;
    i               int;
    v_lines_count   int;
    v_vat_rate      numeric(5,2);
    v_qty           numeric(18,3);
    v_unit_price    numeric(18,2);
    v_line_total    numeric(18,2);
    v_line_tax      numeric(18,2);
    v_running_sub   numeric(18,2);
    v_running_tax   numeric(18,2);
    v_item_names    text[] := ARRAY[
        'Site survey & measurement',
        'Solar panel 450W monocrystalline',
        'Inverter 5kW hybrid',
        'Installation labor',
        'Cabling & protections kit',
        'Battery LiFePO4 5.1 kWh',
        'Mounting structure (roof)',
        'Commissioning & handover',
        'Extended warranty 5 years',
        'Consulting hours',
        'Transport & logistics',
        'Emergency intervention'
    ];
    v_units         text[] := ARRAY['pcs','hr','kit','m','set','day'];
BEGIN
    -- 1) Wipe previous seed rows (cascades to InvoiceLines; also clear activities)
    DELETE FROM "InvoiceActivities"
      WHERE "InvoiceId" IN (SELECT "Id" FROM "Invoices" WHERE "CreatedBy" = v_user);
    DELETE FROM "Invoices" WHERE "CreatedBy" = v_user;

    -- 2) Load candidate Sales (non-deleted, tenant-scoped if applicable)
    SELECT array_agg("Id" ORDER BY random())
      INTO v_sale_ids
      FROM "Sales"
     WHERE COALESCE("Status",'') <> 'deleted';

    IF v_sale_ids IS NULL OR array_length(v_sale_ids, 1) < 1 THEN
        RAISE EXCEPTION 'No sales found in "Sales" table — create sales first, then re-run this seed.';
    END IF;

    -- Next invoice number sequence start
    SELECT COALESCE(MAX(NULLIF(regexp_replace("InvoiceNumber", '\D', '', 'g'),'')::int), 0) + 1
      INTO v_seq
      FROM "Invoices"
     WHERE "InvoiceNumber" LIKE 'INV-' || v_year || '-%';

    -- 3) Iterate recipes and insert
    FOR i IN 0..(jsonb_array_length(v_recipes) - 1) LOOP
        v_rec := v_recipes -> i;

        v_status      := v_rec ->> 'status';
        v_lines_count := (v_rec ->> 'lines')::int;
        v_vat_rate    := (v_rec ->> 'vat')::numeric;
        v_currency    := v_rec ->> 'cur';
        v_note        := v_rec ->> 'note';
        v_issue       := v_now - ((v_rec ->> 'age')::int || ' days')::interval;
        v_due         := v_issue + interval '30 days';

        -- Pick a random sale (round-robin across the shuffled list, wrap around)
        v_pick := v_sale_ids[ ((i) % array_length(v_sale_ids,1)) + 1 ];
        SELECT * INTO v_sale FROM "Sales" WHERE "Id" = v_pick;

        v_title := COALESCE(v_sale."Title", v_sale."SaleNumber", 'Sale #' || v_pick);

        -- Build totals from generated lines (varied qty & price for diversity)
        v_running_sub := 0;
        v_running_tax := 0;

        -- Insert header first with 0 totals; update after lines
        v_number := CASE
            WHEN v_status = 'draft' THEN NULL           -- drafts have no number yet
            ELSE 'INV-' || v_year || '-' || lpad((v_seq + i)::text, 5, '0')
        END;

        v_posted_at := CASE WHEN v_status IN ('posted','paid','void') THEN v_issue + interval '2 hours' END;
        v_voided_at := CASE WHEN v_status = 'void' THEN v_issue + interval '1 day' END;
        v_void_reason := CASE WHEN v_status = 'void' THEN split_part(v_note, '—', 2) END;

        INSERT INTO "Invoices"(
            "TenantId","IsDeleted","InvoiceNumber","Status","ContactId","SaleId","ServiceOrderId",
            "Title","Notes","Currency",
            "Subtotal","TaxAmount","GrandTotal","AmountPaid",
            "IssueDate","DueDate","PostedAt","VoidedAt","VoidReason",
            "CreatedBy","CreatedAt","UpdatedAt"
        ) VALUES (
            v_tenant, false, v_number, v_status, v_sale."ContactId", v_pick, NULL,
            v_title, v_note, v_currency,
            0, 0, 0, 0,
            v_issue, v_due, v_posted_at, v_voided_at, trim(v_void_reason),
            v_user, v_issue, v_now
        )
        RETURNING "Id" INTO v_inv_id;

        -- Insert lines
        FOR j IN 1..v_lines_count LOOP
            v_qty        := (1 + floor(random() * 5))::numeric;
            v_unit_price := round( (50 + random() * 1950)::numeric, 2 );
            v_line_total := round(v_qty * v_unit_price, 2);
            v_line_tax   := round(v_line_total * v_vat_rate / 100.0, 2);
            v_running_sub := v_running_sub + v_line_total;
            v_running_tax := v_running_tax + v_line_tax;

            INSERT INTO "InvoiceLines"(
                "TenantId","InvoiceId","SourceType","SourceId",
                "ItemName","Description","Quantity","Unit","UnitPrice",
                "TaxRate","LineTotal","TaxAmount","DisplayOrder"
            ) VALUES (
                v_tenant, v_inv_id, 'sale', v_pick::text,
                v_item_names[ 1 + ((i * 3 + j) % array_length(v_item_names,1)) ],
                'From sale ' || COALESCE(v_sale."SaleNumber",''),
                v_qty,
                v_units[ 1 + ((i + j) % array_length(v_units,1)) ],
                v_unit_price,
                v_vat_rate,
                v_line_total,
                v_line_tax,
                j
            );
        END LOOP;

        v_subtotal := v_running_sub;
        v_tax      := v_running_tax;
        v_grand    := v_subtotal + v_tax;
        v_paid     := round(v_grand * (v_rec ->> 'paid')::numeric, 2);
        -- Paid status must always equal full grand total
        IF v_status = 'paid' THEN v_paid := v_grand; END IF;

        UPDATE "Invoices"
           SET "Subtotal"   = v_subtotal,
               "TaxAmount"  = v_tax,
               "GrandTotal" = v_grand,
               "AmountPaid" = v_paid
         WHERE "Id" = v_inv_id;

        -- Audit trail
        INSERT INTO "InvoiceActivities"("TenantId","InvoiceId","ActivityType","Description","CreatedAt","CreatedBy")
        VALUES (v_tenant, v_inv_id, 'created_from_sale',
                'Invoice created from sale ' || COALESCE(v_sale."SaleNumber", v_pick::text),
                v_issue, v_user);

        IF v_status IN ('posted','paid','void') THEN
            INSERT INTO "InvoiceActivities"("TenantId","InvoiceId","ActivityType","Description","CreatedAt","CreatedBy")
            VALUES (v_tenant, v_inv_id, 'posted',
                    'Invoice posted and numbered ' || v_number, v_posted_at, v_user);
        END IF;

        IF v_status = 'paid' THEN
            INSERT INTO "InvoiceActivities"("TenantId","InvoiceId","ActivityType","Description","CreatedAt","CreatedBy")
            VALUES (v_tenant, v_inv_id, 'manual_marked_paid',
                    'Marked as paid — ' || v_note, v_posted_at + interval '3 days', v_user);
        END IF;

        IF v_status = 'void' THEN
            INSERT INTO "InvoiceActivities"("TenantId","InvoiceId","ActivityType","Description","CreatedAt","CreatedBy")
            VALUES (v_tenant, v_inv_id, 'voided',
                    'Voided — ' || COALESCE(trim(v_void_reason),'no reason'), v_voided_at, v_user);
        END IF;
    END LOOP;

    RAISE NOTICE 'Seeded 20 invoices linked to random sales (tenant=%). Breakdown: 3 draft, 7 posted, 6 paid, 4 void.', v_tenant;
END $$;
