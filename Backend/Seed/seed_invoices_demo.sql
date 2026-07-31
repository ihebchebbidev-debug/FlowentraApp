-- =====================================================================
-- Flowentra invoice demo seed — visible default-company data
-- =====================================================================
-- Purpose
--   Creates complete demo data for the invoices module:
--     • Contacts
--     • Sales / Orders
--     • SaleItems
--     • Invoices
--     • InvoiceLines
--     • InvoiceActivities
--     • Payments for paid / partially-paid invoices
--
-- IMPORTANT
--   This script intentionally uses TenantId = 0 because the app's default
--   company/global EF filter reads that bucket. The previous TenantId = 1
--   demo rows can be valid in DB but invisible in the UI.
--
-- Safe to run multiple times:
--   It removes only rows created by this seed marker.
--
-- No DO $$ blocks:
--   Run this directly in your SQL editor.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0) Clean previous seed rows
-- ---------------------------------------------------------------------
DELETE FROM "payments"
 WHERE "created_by" = 'seed-invoices-visible-demo'
    OR "payment_reference" LIKE 'DEMO-INV-%';

DELETE FROM "InvoiceActivities"
 WHERE "CreatedBy" = 'seed-invoices-visible-demo'
    OR "InvoiceId" IN (
        SELECT "Id" FROM "Invoices"
         WHERE "CreatedBy" = 'seed-invoices-visible-demo'
            OR "InvoiceNumber" LIKE 'DEMO-INV-%'
    );

DELETE FROM "InvoiceLines"
 WHERE "InvoiceId" IN (
        SELECT "Id" FROM "Invoices"
         WHERE "CreatedBy" = 'seed-invoices-visible-demo'
            OR "InvoiceNumber" LIKE 'DEMO-INV-%'
    );

DELETE FROM "Invoices"
 WHERE "CreatedBy" = 'seed-invoices-visible-demo'
    OR "InvoiceNumber" LIKE 'DEMO-INV-%';

DELETE FROM "SaleItems"
 WHERE "TenantId" = 0
   AND "SaleId" IN (
        SELECT "Id" FROM "Sales"
         WHERE "CreatedBy" = 'seed-invoices-visible-demo'
            OR "SaleNumber" LIKE 'DEMO-ORD-%'
   );

DELETE FROM "Sales"
 WHERE "TenantId" = 0
   AND ("CreatedBy" = 'seed-invoices-visible-demo' OR "SaleNumber" LIKE 'DEMO-ORD-%');

DELETE FROM "Contacts"
 WHERE "TenantId" = 0
   AND "CreatedBy" = 'seed-invoices-visible-demo';

-- ---------------------------------------------------------------------
-- 1) Demo contacts
-- ---------------------------------------------------------------------
WITH demo_contacts(seq, first_name, last_name, email, phone, company, position, address, city, postal_code, mf, lat, lng) AS (
    VALUES
      (1,  'Amine',  'Mansour',  'amine.mansour@example.test',  '+216 20 111 201', 'Atlas Solar SARL',       'Operations Manager', '12 Rue de Carthage',        'Tunis',      '1001', 'MF-DEMO-0001', 36.8065000, 10.1815000),
      (2,  'Sarra',  'Ben Ali',  'sarra.benali@example.test',   '+216 22 111 202', 'MedTech Distribution',   'Procurement Lead',    '44 Avenue Habib Bourguiba', 'Sousse',     '4000', 'MF-DEMO-0002', 35.8245000, 10.6346000),
      (3,  'Youssef','Trabelsi', 'youssef.trabelsi@example.test','+216 23 111 203', 'GreenBuild Tunisia',     'General Manager',     '8 Zone Industrielle',       'Sfax',       '3000', 'MF-DEMO-0003', 34.7406000, 10.7603000),
      (4,  'Nour',   'Kefi',     'nour.kefi@example.test',      '+216 24 111 204', 'Clinique El Amen',       'Facility Manager',    '19 Rue Ibn Khaldoun',       'Nabeul',     '8000', 'MF-DEMO-0004', 36.4561000, 10.7376000),
      (5,  'Karim',  'Haddad',   'karim.haddad@example.test',   '+216 25 111 205', 'Hotel Marina Blue',      'Owner',               'Port El Kantaoui',          'Hammam Sousse','4089','MF-DEMO-0005', 35.8925000, 10.5943000),
      (6,  'Leila',  'Gharbi',   'leila.gharbi@example.test',   '+216 26 111 206', 'Pharma Nord Afrique',   'Finance Director',    '5 Rue de la Bourse',        'Tunis',      '1053', 'MF-DEMO-0006', 36.8380000, 10.1658000),
      (7,  'Mehdi',  'Jlassi',   'mehdi.jlassi@example.test',   '+216 27 111 207', 'AutoParts Express',     'Branch Manager',      'Route de Gabes km 4',       'Sfax',       '3062', 'MF-DEMO-0007', 34.7167000, 10.6900000),
      (8,  'Ines',   'Ayari',    'ines.ayari@example.test',     '+216 28 111 208', 'DataWave Services',     'IT Manager',          'Cyber Parc',                'Ariana',     '2080', 'MF-DEMO-0008', 36.8665000, 10.1647000),
      (9,  'Walid',  'Mabrouk',  'walid.mabrouk@example.test',  '+216 29 111 209', 'Nord Export',           'Export Manager',      'Rue de Bizerte',            'Bizerte',    '7000', 'MF-DEMO-0009', 37.2746000, 9.8739000),
      (10, 'Meriem', 'Saidi',    'meriem.saidi@example.test',   '+216 21 111 210', 'Retail Plus',           'Store Director',      'Avenue de la Republique',   'Monastir',   '5000', 'MF-DEMO-0010', 35.7643000, 10.8113000),
      (11, 'Omar',   'Bouzid',   'omar.bouzid@example.test',    '+216 21 111 211', 'Smart Office Pro',      'Managing Partner',    'Lac 2 Business Center',     'Tunis',      '1053', 'MF-DEMO-0011', 36.8498000, 10.2743000),
      (12, 'Rim',    'Chebbi',   'rim.chebbi@example.test',     '+216 21 111 212', 'Agritech Oasis',        'Project Director',    'Route de Tozeur',           'Tozeur',     '2200', 'MF-DEMO-0012', 33.9197000, 8.1335000)
)
INSERT INTO "Contacts" (
    "TenantId", "FirstName", "LastName", "Email", "Phone", "Company", "Position",
    "Address", "City", "Country", "PostalCode", "Notes", "IsActive", "CreatedDate", "CreatedBy",
    "Name", "Status", "Type", "Favorite", "LastContactDate", "IsDeleted",
    "MatriculeFiscale", "Latitude", "Longitude", "HasLocation",
    "CategorieContribuable", "IsResident", "IdTaxpayerType", "PaysCode"
)
SELECT
    0, first_name, last_name, email, phone, company, position,
    address, city, 'Tunisia', postal_code, 'Demo customer for invoice module', true, now() - (seq || ' days')::interval, 'seed-invoices-visible-demo',
    first_name || ' ' || last_name, 'active', 'company', (seq IN (1, 4, 8)), now() - ((seq * 2) || ' days')::interval, false,
    mf, lat, lng, 1,
    'PM', true, 1, 'TN'
FROM demo_contacts;

-- ---------------------------------------------------------------------
-- 2) Demo sales/orders
-- ---------------------------------------------------------------------
WITH seeded_contacts AS (
    SELECT
        "Id",
        "Name",
        "Company",
        row_number() OVER (ORDER BY "Id") AS rn
    FROM "Contacts"
    WHERE "TenantId" = 0
      AND "CreatedBy" = 'seed-invoices-visible-demo'
),
order_recipes(seq, status, payment_status, payment_method, title, category, source, subtotal, tax_rate, discount_amount, currency, days_ago) AS (
    VALUES
      (1,  'completed', 'unpaid',         'bank_transfer', 'Solar audit and materials order',          'solar',       'direct',      1280.00, 19.00,   0.00, 'TND',  2),
      (2,  'completed', 'partially_paid', 'bank_transfer', 'Medical supply replenishment',             'medical',     'offer',       3420.00,  7.00, 120.00, 'TND',  6),
      (3,  'completed', 'partially_paid', 'cheque',        'Green building installation package',      'construction','deal',        7850.00, 19.00, 350.00, 'TND', 11),
      (4,  'completed', 'unpaid',         'bank_transfer', 'Clinic maintenance and spare parts',       'maintenance', 'service',     2210.00, 19.00,  50.00, 'TND', 16),
      (5,  'completed', 'fully_paid',     'cash',          'Hotel energy efficiency kit',              'hospitality', 'direct',      4650.00, 19.00, 200.00, 'TND', 21),
      (6,  'completed', 'fully_paid',     'bank_transfer', 'Pharma cold-room control devices',         'medical',     'direct',      5980.00,  7.00,   0.00, 'TND', 28),
      (7,  'completed', 'unpaid',         'bank_transfer', 'Auto workshop equipment order',            'equipment',   'offer',       1120.00, 19.00,   0.00, 'TND', 33),
      (8,  'completed', 'partially_paid', 'bank_transfer', 'IT services annual support package',       'services',    'web',         8200.00, 19.00, 500.00, 'TND', 39),
      (9,  'completed', 'unpaid',         'wire',          'Export consulting and documentation',      'export',      'referral',    3100.00,  0.00,   0.00, 'EUR', 46),
      (10, 'completed', 'fully_paid',     'card',          'Retail POS hardware rollout',              'retail',      'direct',      2740.00, 19.00,  90.00, 'TND', 54),
      (11, 'completed', 'fully_paid',     'bank_transfer', 'Office automation project milestone',      'office',      'deal',       12900.00, 19.00, 900.00, 'TND', 67),
      (12, 'completed', 'fully_paid',     'wire',          'Agritech field monitoring equipment',      'agritech',    'offer',       6850.00, 13.00, 250.00, 'TND', 89)
)
INSERT INTO "Sales" (
    "TenantId", "SaleNumber", "ContactId", "SaleDate", "Status",
    "TotalAmount", "DiscountPercent", "DiscountAmount", "TaxAmount", "GrandTotal",
    "PaymentStatus", "PaymentMethod", "Notes", "CreatedDate", "CreatedBy", "CreatedByName",
    "Title", "Description", "Currency", "Taxes", "Discount", "Stage", "Priority", "Category", "Source",
    "BillingAddress", "BillingPostalCode", "BillingCountry", "DeliveryAddress", "DeliveryPostalCode", "DeliveryCountry",
    "Tags", "ActualCloseDate", "UpdatedAt", "LastActivity", "MaterialsFulfillment", "ServiceOrdersStatus",
    "TaxType", "FiscalStamp", "ContactLatitude", "ContactLongitude", "ContactHasLocation", "DiscountType",
    "IsDeleted", "IsDeal", "IsAutoGenerated"
)
SELECT
    0,
    'DEMO-ORD-' || lpad(o.seq::text, 4, '0'),
    c."Id",
    now() - (o.days_ago || ' days')::interval,
    o.status,
    o.subtotal,
    NULL,
    o.discount_amount,
    round((o.subtotal - o.discount_amount) * o.tax_rate / 100.0, 2),
    round((o.subtotal - o.discount_amount) * (1 + o.tax_rate / 100.0), 2),
    o.payment_status,
    o.payment_method,
    'Demo order used as invoice source for ' || c."Company",
    now() - (o.days_ago || ' days')::interval,
    'seed-invoices-visible-demo',
    'Demo Seeder',
    o.title,
    'Complete seeded order with matching invoice, lines, activities and payments.',
    o.currency,
    round((o.subtotal - o.discount_amount) * o.tax_rate / 100.0, 2),
    o.discount_amount,
    'closed',
    CASE WHEN o.subtotal >= 7000 THEN 'high' ELSE 'medium' END,
    o.category,
    o.source,
    'Demo billing address - ' || c."Company",
    '1000',
    'Tunisia',
    'Demo delivery address - ' || c."Company",
    '1000',
    'Tunisia',
    ARRAY['demo','invoice','order'],
    now() - ((o.days_ago - 1) || ' days')::interval,
    now(),
    now() - ((o.days_ago - 1) || ' days')::interval,
    'completed',
    'none',
    'percentage',
    1.000,
    NULL,
    NULL,
    0,
    'fixed',
    false,
    false,
    false
FROM order_recipes o
JOIN seeded_contacts c ON c.rn = o.seq;

-- ---------------------------------------------------------------------
-- 3) Demo sale/order line items
-- ---------------------------------------------------------------------
WITH seeded_sales AS (
    SELECT
        "Id",
        "SaleNumber",
        "Currency",
        row_number() OVER (ORDER BY "SaleNumber") AS rn
    FROM "Sales"
    WHERE "TenantId" = 0
      AND "CreatedBy" = 'seed-invoices-visible-demo'
),
line_recipes(order_seq, line_no, item_name, item_code, description, qty, unit_price, tax_rate, discount) AS (
    VALUES
      (1,1,'Site survey & measurement','SRV-SURVEY','Initial technical survey and customer requirements validation',1.00,280.00,19.00,0.00),
      (1,2,'Solar protection kit','KIT-SOLAR-PROT','DC/AC protection kit with cabling accessories',2.00,500.00,19.00,0.00),
      (2,1,'Medical storage cabinet','MED-CAB-01','Certified medical storage cabinet',3.00,650.00,7.00,0.00),
      (2,2,'Temperature logger','MED-TLOG','Calibrated temperature logger with certificate',6.00,245.00,7.00,0.00),
      (3,1,'Inverter 5kW hybrid','INV-HYB-5K','Hybrid inverter installation-ready',1.00,3850.00,19.00,0.00),
      (3,2,'Installation labor','SRV-INSTALL','Two-day installation and commissioning crew',2.00,1100.00,19.00,0.00),
      (3,3,'Cabling & protections kit','KIT-CABLE','Power cabling and protection accessories',1.00,1800.00,19.00,0.00),
      (4,1,'Preventive maintenance visit','SRV-MAINT','Clinic equipment preventive maintenance',1.00,850.00,19.00,0.00),
      (4,2,'Spare parts bundle','KIT-SPARE','Mixed spare parts and consumables',4.00,340.00,19.00,0.00),
      (5,1,'Energy efficiency controller','CTRL-ENERGY','Smart controller and metering bundle',5.00,690.00,19.00,0.00),
      (5,2,'Commissioning & handover','SRV-COMM','Commissioning, staff handover and documentation',1.00,1200.00,19.00,0.00),
      (6,1,'Cold-room sensor pack','PHARMA-SENSOR','Certified sensor pack for cold-room monitoring',8.00,420.00,7.00,0.00),
      (6,2,'Compliance reporting setup','SRV-COMP','Dashboard configuration and reporting templates',1.00,2620.00,7.00,0.00),
      (7,1,'Workshop diagnostic tablet','AUTO-TAB','Vehicle diagnostic tablet with adapter set',2.00,560.00,19.00,0.00),
      (8,1,'Annual support subscription','SRV-SUPPORT','Managed support package - 12 months',1.00,5200.00,19.00,0.00),
      (8,2,'Onsite consulting days','SRV-CONSULT','Senior consultant onsite days',4.00,750.00,19.00,0.00),
      (9,1,'Export documentation package','SRV-EXPORT-DOC','Export documentation and compliance review',1.00,1800.00,0.00,0.00),
      (9,2,'International logistics coordination','SRV-LOG-INTL','Coordination with carriers and customs broker',2.00,650.00,0.00,0.00),
      (10,1,'POS terminal','POS-TERM','Retail POS terminal with printer',4.00,520.00,19.00,0.00),
      (10,2,'Rollout service','SRV-POS-ROLL','Installation and branch rollout service',1.00,660.00,19.00,0.00),
      (11,1,'Automation hardware pack','OFF-AUTO-HW','Office automation gateway and sensors',6.00,1350.00,19.00,0.00),
      (11,2,'Project milestone services','SRV-MILESTONE','Configuration, testing and acceptance milestone',1.00,4800.00,19.00,0.00),
      (12,1,'Field monitoring node','AGRI-NODE','Solar-powered field monitoring node',10.00,485.00,13.00,0.00),
      (12,2,'Gateway and dashboard setup','AGRI-GW','Gateway installation and dashboard setup',1.00,2000.00,13.00,0.00)
)
INSERT INTO "SaleItems" (
    "TenantId", "SaleId", "ArticleId", "Description", "Quantity", "UnitPrice", "Discount", "TaxRate", "LineTotal",
    "DisplayOrder", "Type", "ItemName", "ItemCode", "DiscountType", "RequiresServiceOrder", "ServiceOrderGenerated",
    "FulfillmentStatus", "Currency"
)
SELECT
    0,
    s."Id",
    NULL,
    l.description,
    l.qty,
    l.unit_price,
    l.discount,
    l.tax_rate,
    round((l.qty * l.unit_price) - l.discount, 2),
    l.line_no,
    CASE WHEN l.item_code LIKE 'SRV-%' THEN 'service' ELSE 'article' END,
    l.item_name,
    l.item_code,
    'fixed',
    false,
    false,
    'fulfilled',
    s."Currency"
FROM line_recipes l
JOIN seeded_sales s ON s.rn = l.order_seq;

-- ---------------------------------------------------------------------
-- 4) Demo invoices linked to the demo sales/orders
-- ---------------------------------------------------------------------
WITH seeded_sales AS (
    SELECT
        s."Id",
        s."SaleNumber",
        s."ContactId",
        s."Title",
        s."Currency",
        row_number() OVER (ORDER BY s."SaleNumber") AS rn
    FROM "Sales" s
    WHERE s."TenantId" = 0
      AND s."CreatedBy" = 'seed-invoices-visible-demo'
),
invoice_recipes(order_seq, invoice_no, status, issue_days_ago, due_days_after_issue, paid_ratio, notes, void_reason) AS (
    VALUES
      (1,  NULL,            'draft',   1,  30, 0.00, 'Draft invoice awaiting internal review before posting.', NULL),
      (2,  NULL,            'draft',   3,  30, 0.00, 'Draft invoice prepared from order and not numbered yet.', NULL),
      (3,  'DEMO-INV-0001', 'posted',  7,  30, 0.00, 'Posted invoice awaiting first payment.', NULL),
      (4,  'DEMO-INV-0002', 'posted', 18,  30, 0.40, 'Partially paid invoice; remaining balance still open.', NULL),
      (5,  'DEMO-INV-0003', 'posted', 34,  30, 0.00, 'Overdue posted invoice; payment reminder should be visible.', NULL),
      (6,  'DEMO-INV-0004', 'posted', 61,  30, 0.50, 'Overdue partial payment with dispute on remaining amount.', NULL),
      (7,  'DEMO-INV-0005', 'paid',    9,  15, 1.00, 'Paid in full by cash.', NULL),
      (8,  'DEMO-INV-0006', 'paid',   22,  30, 1.00, 'Paid in full by bank transfer.', NULL),
      (9,  'DEMO-INV-0007', 'paid',   46,  30, 1.00, 'Paid export invoice in EUR with zero VAT.', NULL),
      (10, 'DEMO-INV-0008', 'paid',   55,  30, 1.00, 'Paid retail rollout invoice.', NULL),
      (11, 'DEMO-INV-0009', 'void',   12,  30, 0.00, 'Voided duplicate invoice; replacement was issued separately.', 'Duplicate invoice'),
      (12, 'DEMO-INV-0010', 'void',   38,  30, 0.00, 'Voided because customer cancelled order after posting.', 'Customer cancelled order')
),
invoice_totals AS (
    SELECT
        r.order_seq,
        r.invoice_no,
        r.status,
        r.issue_days_ago,
        r.due_days_after_issue,
        r.paid_ratio,
        r.notes,
        r.void_reason,
        s."Id" AS sale_id,
        s."SaleNumber",
        s."ContactId",
        s."Title",
        s."Currency",
        COALESCE(sum(si."LineTotal"), 0) AS subtotal,
        COALESCE(sum(round(si."LineTotal" * si."TaxRate" / 100.0, 2)), 0) AS tax_amount
    FROM invoice_recipes r
    JOIN seeded_sales s ON s.rn = r.order_seq
    LEFT JOIN "SaleItems" si ON si."TenantId" = 0 AND si."SaleId" = s."Id"
    GROUP BY r.order_seq, r.invoice_no, r.status, r.issue_days_ago, r.due_days_after_issue, r.paid_ratio, r.notes, r.void_reason,
             s."Id", s."SaleNumber", s."ContactId", s."Title", s."Currency"
)
INSERT INTO "Invoices" (
    "TenantId", "IsDeleted", "InvoiceNumber", "Status", "ContactId", "SaleId", "ServiceOrderId",
    "Title", "Notes", "Currency", "Subtotal", "TaxAmount", "GrandTotal", "AmountPaid",
    "IssueDate", "DueDate", "PostedAt", "VoidedAt", "VoidReason", "CreatedBy", "CreatedAt", "UpdatedAt"
)
SELECT
    0,
    false,
    invoice_no,
    status,
    "ContactId",
    sale_id,
    NULL,
    'Invoice for ' || "Title",
    notes,
    "Currency",
    round(subtotal, 2),
    round(tax_amount, 2),
    round(subtotal + tax_amount, 2),
    CASE
        WHEN status = 'paid' THEN round(subtotal + tax_amount, 2)
        WHEN status = 'posted' THEN round((subtotal + tax_amount) * paid_ratio, 2)
        ELSE 0
    END,
    now() - (issue_days_ago || ' days')::interval,
    (now() - (issue_days_ago || ' days')::interval) + (due_days_after_issue || ' days')::interval,
    CASE WHEN status IN ('posted','paid','void') THEN (now() - (issue_days_ago || ' days')::interval) + interval '2 hours' ELSE NULL END,
    CASE WHEN status = 'void' THEN (now() - (issue_days_ago || ' days')::interval) + interval '1 day' ELSE NULL END,
    void_reason,
    'seed-invoices-visible-demo',
    now() - (issue_days_ago || ' days')::interval,
    now()
FROM invoice_totals;

-- ---------------------------------------------------------------------
-- 5) Invoice lines copied from sale/order line items
-- ---------------------------------------------------------------------
INSERT INTO "InvoiceLines" (
    "TenantId", "InvoiceId", "SourceType", "SourceId", "ItemName", "Description",
    "Quantity", "Unit", "UnitPrice", "TaxRate", "LineTotal", "TaxAmount", "DisplayOrder", "CreatedAt"
)
SELECT
    0,
    i."Id",
    'sale_item',
    si."Id"::text,
    COALESCE(si."ItemName", si."Description"),
    si."Description",
    si."Quantity",
    CASE WHEN si."Type" = 'service' THEN 'hr' ELSE 'pcs' END,
    si."UnitPrice",
    si."TaxRate",
    si."LineTotal",
    round(si."LineTotal" * si."TaxRate" / 100.0, 2),
    si."DisplayOrder",
    i."CreatedAt"
FROM "Invoices" i
JOIN "SaleItems" si ON si."TenantId" = 0 AND si."SaleId" = i."SaleId"
WHERE i."TenantId" = 0
  AND i."CreatedBy" = 'seed-invoices-visible-demo';

-- ---------------------------------------------------------------------
-- 6) Payments for partially paid and paid invoices
-- ---------------------------------------------------------------------
INSERT INTO "payments" (
    "id", "entity_type", "entity_id", "plan_id", "installment_id", "amount", "currency",
    "payment_method", "payment_reference", "payment_date", "status", "notes", "receipt_number",
    "created_by", "created_by_name", "created_at", "updated_at", "TenantId"
)
SELECT
    'demo-pay-inv-' || i."Id"::text,
    'invoice',
    i."Id"::text,
    NULL,
    NULL,
    i."AmountPaid",
    i."Currency",
    CASE
        WHEN i."InvoiceNumber" IN ('DEMO-INV-0005','DEMO-INV-0008') THEN 'cash'
        WHEN i."Currency" = 'EUR' THEN 'wire'
        ELSE 'bank_transfer'
    END,
    'DEMO-INV-PAY-' || COALESCE(i."InvoiceNumber", i."Id"::text),
    COALESCE(i."PostedAt", i."CreatedAt") + interval '3 days',
    'completed',
    'Demo payment generated for invoice module seed.',
    'RCPT-' || COALESCE(i."InvoiceNumber", i."Id"::text),
    'seed-invoices-visible-demo',
    'Demo Seeder',
    COALESCE(i."PostedAt", i."CreatedAt") + interval '3 days',
    now(),
    0
FROM "Invoices" i
WHERE i."TenantId" = 0
  AND i."CreatedBy" = 'seed-invoices-visible-demo'
  AND i."AmountPaid" > 0
  AND i."Status" <> 'void';

-- ---------------------------------------------------------------------
-- 7) Activity trail
-- ---------------------------------------------------------------------
INSERT INTO "InvoiceActivities" ("TenantId", "InvoiceId", "ActivityType", "Description", "OldValue", "NewValue", "CreatedAt", "CreatedBy")
SELECT
    0,
    i."Id",
    'created_from_sale',
    'Invoice created from order ' || s."SaleNumber",
    NULL,
    'draft',
    i."CreatedAt",
    'seed-invoices-visible-demo'
FROM "Invoices" i
JOIN "Sales" s ON s."Id" = i."SaleId"
WHERE i."TenantId" = 0
  AND i."CreatedBy" = 'seed-invoices-visible-demo';

INSERT INTO "InvoiceActivities" ("TenantId", "InvoiceId", "ActivityType", "Description", "OldValue", "NewValue", "CreatedAt", "CreatedBy")
SELECT
    0,
    i."Id",
    'posted',
    'Invoice posted and assigned number ' || i."InvoiceNumber",
    'draft',
    i."Status",
    i."PostedAt",
    'seed-invoices-visible-demo'
FROM "Invoices" i
WHERE i."TenantId" = 0
  AND i."CreatedBy" = 'seed-invoices-visible-demo'
  AND i."Status" IN ('posted','paid','void');

INSERT INTO "InvoiceActivities" ("TenantId", "InvoiceId", "ActivityType", "Description", "OldValue", "NewValue", "CreatedAt", "CreatedBy")
SELECT
    0,
    i."Id",
    CASE WHEN i."Status" = 'paid' THEN 'auto_marked_paid' ELSE 'payment_recorded' END,
    'Payment recorded: ' || i."Currency" || ' ' || i."AmountPaid"::text,
    '0',
    i."AmountPaid"::text,
    COALESCE(i."PostedAt", i."CreatedAt") + interval '3 days',
    'seed-invoices-visible-demo'
FROM "Invoices" i
WHERE i."TenantId" = 0
  AND i."CreatedBy" = 'seed-invoices-visible-demo'
  AND i."AmountPaid" > 0
  AND i."Status" <> 'void';

INSERT INTO "InvoiceActivities" ("TenantId", "InvoiceId", "ActivityType", "Description", "OldValue", "NewValue", "CreatedAt", "CreatedBy")
SELECT
    0,
    i."Id",
    'voided',
    'Invoice voided: ' || COALESCE(i."VoidReason", 'No reason provided'),
    'posted',
    'void',
    i."VoidedAt",
    'seed-invoices-visible-demo'
FROM "Invoices" i
WHERE i."TenantId" = 0
  AND i."CreatedBy" = 'seed-invoices-visible-demo'
  AND i."Status" = 'void';

COMMIT;

-- ---------------------------------------------------------------------
-- 8) Quick verification
-- ---------------------------------------------------------------------
SELECT
    'contacts' AS table_name,
    count(*) AS rows_created
FROM "Contacts"
WHERE "TenantId" = 0 AND "CreatedBy" = 'seed-invoices-visible-demo'
UNION ALL
SELECT 'orders', count(*) FROM "Sales" WHERE "TenantId" = 0 AND "CreatedBy" = 'seed-invoices-visible-demo'
UNION ALL
SELECT 'order_lines', count(*) FROM "SaleItems" si JOIN "Sales" s ON s."Id" = si."SaleId" WHERE s."TenantId" = 0 AND s."CreatedBy" = 'seed-invoices-visible-demo'
UNION ALL
SELECT 'invoices', count(*) FROM "Invoices" WHERE "TenantId" = 0 AND "CreatedBy" = 'seed-invoices-visible-demo'
UNION ALL
SELECT 'invoice_lines', count(*) FROM "InvoiceLines" il JOIN "Invoices" i ON i."Id" = il."InvoiceId" WHERE i."TenantId" = 0 AND i."CreatedBy" = 'seed-invoices-visible-demo'
UNION ALL
SELECT 'invoice_activities', count(*) FROM "InvoiceActivities" ia JOIN "Invoices" i ON i."Id" = ia."InvoiceId" WHERE i."TenantId" = 0 AND i."CreatedBy" = 'seed-invoices-visible-demo'
UNION ALL
SELECT 'payments', count(*) FROM "payments" WHERE "TenantId" = 0 AND "created_by" = 'seed-invoices-visible-demo';

SELECT
    "Status",
    count(*) AS invoice_count,
    sum("GrandTotal") AS total_amount,
    sum("AmountPaid") AS paid_amount,
    sum("GrandTotal" - "AmountPaid") AS open_amount
FROM "Invoices"
WHERE "TenantId" = 0
  AND "CreatedBy" = 'seed-invoices-visible-demo'
GROUP BY "Status"
ORDER BY "Status";