-- =====================================================================
-- DEMO SEED — Photovoltaic (Solar PV) service company.
--
-- 30 deals total:
--   • ~22 WON deals, each converted to a delivery PROJECT with a full PV
--     task board (To Do / In Progress / Done) and (every 3rd) a linked SALE.
--   • ~8 OPEN pipeline deals (lead / qualified / proposal / negotiation)
--     with next-action follow-ups so the forecast & funnel are populated.
--
-- Mirrors ConvertDealAsync exactly:
--   Deal.Stage='won', Deal.ProjectId / ConvertedToProjectId set,
--   Project.ConvertedFromDealId + Project.Budget = deal value,
--   ProjectTasks linked by ProjectId + RelatedEntityType='project',
--   task Status drives its kanban column (open→To Do, in progress→In Progress,
--   completed→Done), Sale.DealId / Sale.ProjectId back-links.
--
-- Tenant-scoped: set v_tenant to YOUR company's TenantId (default 0).
-- Idempotent: re-running first removes the previous seed
-- (Source='seed-demo' on deals, Notes='SEED_DEMO' on contacts).
-- PostgreSQL.
-- =====================================================================

DO $$
DECLARE
    v_tenant int  := 0;            -- <<< change to your TenantId if not 0
    v_user   text := 'seed-demo';
    v_owner  text := 'Aymen Admin';

    -- PV-oriented clients (factories, resorts, farms, utilities…)
    v_companies   text[] := ARRAY[
        'Médina Resorts','Sahara Foods','Carthage Cement','Sfax Textile Mills','Sousse Marina Hotel',
        'Bizerte Steel','Gabès Chemicals','Nabeul Pottery Works','Monastir Dairy','Kairouan Carpets',
        'Djerba Beach Resort','El Kef AgriCoop','Tozeur Date Farm','Mahdia Cold Storage','Zarzis Logistics',
        'Tunis Business Park','Hammamet Spa Resort','Gafsa Mining Co','Béja Flour Mills','Jendouba Poultry',
        'Médenine Greenhouses','Tataouine Water Authority','Siliana Olive Press','Kasserine Plastics','Manouba University',
        'Ariana Tech Campus','Ben Arous Auto Parts','Nabeul Bottling','Sidi Bouzid Irrigation','Kébili Oasis Farms'];

    -- PV project / deal titles
    v_titles      text[] := ARRAY[
        '220 kWc Rooftop PV Plant','Solar Carport 80 kWc','Off-grid PV + Battery','Solar Water Pumping 15 kW','Self-consumption PV 50 kWc',
        'Hybrid PV + Storage 30 kWc','Ground-mount PV 500 kWc','Solar Street Lighting','Cold Store Solar Retrofit','Rooftop PV 120 kWc',
        'Agrivoltaic Pilot 40 kWc','Net-metering PV 30 kWc','Floating PV Demo','EV + Solar Canopy','Solar Desalination Assist',
        'PV O&M Upgrade','Bifacial Ground Array 250 kWc','Microgrid + PV 60 kWc','Solar Cooling System','Industrial Rooftop 350 kWc',
        'Solar Borehole Pump','PV Self-consumption 75 kWc','Solar Telecom Tower','Greenhouse PV Roof','Solar Pumping + Drip',
        'Rooftop PV 200 kWc','Battery Backup Add-on','Solar Awning Array','PV Repowering 90 kWc','Resort Solar + Storage'];

    v_cities      text[] := ARRAY['Tunis','Sfax','Sousse','Bizerte','Gabès','Nabeul','Monastir','Kairouan','Djerba','Tozeur'];
    -- PV categories & lead sources
    v_cats        text[] := ARRAY['Rooftop PV','Ground-mount PV','Off-grid PV','Hybrid PV + Storage','Solar Pumping','PV O&M'];
    v_srcs        text[] := ARRAY['Referral','Website','Trade show','STEG tender','Partner installer'];

    -- PV equipment catalog (name, type, unit price TND)
    v_item_names  text[]    := ARRAY[
        'Monocrystalline panel 550Wc','String inverter 50 kW','Hybrid inverter 10 kW','Lithium battery 10 kWh','Aluminium mounting structure',
        'DC solar cable (per 100 m)','AC cable (per 100 m)','DC combiner box','Monitoring & datalogger','Earthing & SPD kit',
        'Power optimizer','STEG grid connection & net-metering','Installation & commissioning','O&M contract (1 year)'];
    v_item_types  text[]    := ARRAY['article','article','article','article','article','article','article','article','article','article','article','service','service','service'];
    v_item_prices numeric[] := ARRAY[220, 6800, 4200, 5400, 95, 320, 240, 480, 350, 620, 70, 1500, 2500, 1800];

    -- PV delivery task workflow (Title, TaskType, Status)
    v_task_titles text[] := ARRAY[
        'Site survey & shading analysis','Structural & roof assessment','Engineering & single-line diagram',
        'STEG grid-connection application','Procurement of panels & inverters','Mounting structure installation',
        'Panel mounting & racking','DC wiring & combiner boxes','Inverter & AC connection',
        'Earthing & lightning protection','Commissioning & performance test','Net-metering activation & handover'];
    v_task_types  text[] := ARRAY['visit','visit','follow-up','follow-up','follow-up','visit','visit','visit','visit','visit','visit','meeting'];
    -- statuses: first 3 done, next 2 in progress, rest open → fills all 3 columns
    v_task_status text[] := ARRAY['completed','completed','completed','in progress','in progress','open','open','open','open','open','open','open'];

    i int; j int; idx int; n_items int := 4; n_tasks int;
    v_company text; v_cat text; v_src text;
    v_contact int; v_deal int; v_project int; v_sale int;
    v_col1 int; v_col2 int; v_col3 int;
    v_value numeric; v_qty numeric; v_price numeric; v_line numeric;
    v_item text; v_itype text;
    v_close timestamptz; v_dnum text;
    v_is_open boolean; v_stage text; v_prob int;
BEGIN
    -- ── Idempotent cleanup of any previous run ───────────────────────
    DELETE FROM "ProjectTasks"   WHERE "ProjectId" IN (SELECT "Id" FROM "Projects" WHERE "ConvertedFromDealId" IN (SELECT "Id" FROM "Deals" WHERE "Source" = 'seed-demo'));
    DELETE FROM "ProjectColumns" WHERE "ProjectId" IN (SELECT "Id" FROM "Projects" WHERE "ConvertedFromDealId" IN (SELECT "Id" FROM "Deals" WHERE "Source" = 'seed-demo'));
    DELETE FROM "ProjectNotes"   WHERE "ProjectId" IN (SELECT "Id" FROM "Projects" WHERE "ConvertedFromDealId" IN (SELECT "Id" FROM "Deals" WHERE "Source" = 'seed-demo'));
    DELETE FROM "Sales"          WHERE "DealId"    IN (SELECT "Id" FROM "Deals" WHERE "Source" = 'seed-demo');
    DELETE FROM "Projects"       WHERE "ConvertedFromDealId" IN (SELECT "Id" FROM "Deals" WHERE "Source" = 'seed-demo');
    DELETE FROM "DealActivities" WHERE "DealId"    IN (SELECT "Id" FROM "Deals" WHERE "Source" = 'seed-demo');
    DELETE FROM "DealItems"      WHERE "DealId"    IN (SELECT "Id" FROM "Deals" WHERE "Source" = 'seed-demo');
    DELETE FROM "Deals"          WHERE "Source" = 'seed-demo';
    DELETE FROM "Contacts"       WHERE "Notes" = 'SEED_DEMO';

    FOR i IN 1..30 LOOP
        v_company := v_companies[i];
        v_cat     := v_cats[((i - 1) % array_length(v_cats, 1)) + 1];
        v_src     := v_srcs[((i - 1) % array_length(v_srcs, 1)) + 1];
        v_close   := now() - ((i)::text || ' days')::interval;

        -- Every 4th deal stays OPEN in the pipeline; the rest are WON → projects.
        v_is_open := (i % 4 = 0);
        IF v_is_open THEN
            v_stage := (ARRAY['lead','qualified','proposal','negotiation'])[((i / 4) % 4) + 1];
            v_prob  := (ARRAY[20, 45, 65, 80])[((i / 4) % 4) + 1];
        ELSE
            v_stage := 'won';
            v_prob  := 100;
        END IF;

        -- ── Contact (PV client) ─────────────────────────────────────
        INSERT INTO "Contacts"(
            "FirstName","LastName","Name","Company","Email","Phone","Address","City","Country",
            "Status","Type","IsActive","IsDeleted","CreatedBy","CreatedDate","TenantId","IsResident","PaysCode","Notes")
        VALUES (
            'Energy Manager', v_company, v_company, v_company,
            'energy' || i || '@demo.seed', '+216 7' || lpad((1000000 + i * 137)::text, 7, '0'),
            (100 + i) || ' Zone Industrielle', v_cities[((i - 1) % array_length(v_cities, 1)) + 1], 'Tunisia',
            'active', 'company', true, false, v_user, now() - ((i + 20)::text || ' days')::interval, v_tenant, true, 'TN', 'SEED_DEMO')
        RETURNING "Id" INTO v_contact;

        -- ── Deal ────────────────────────────────────────────────────
        INSERT INTO "Deals"(
            "TenantId","IsDeleted","Title","Description","ContactId","Stage","Probability","EstimatedValue",
            "Currency","ExpectedCloseDate","ActualCloseDate","Category","Source","Notes","Tags",
            "AssignedTo","AssignedToName","CreatedDate","CreatedBy","CreatedByName","LastActivity",
            "ConvertedAt","NextAction","NextActionDate")
        VALUES (
            v_tenant, false, v_titles[i] || ' — ' || v_company,
            'Solar PV opportunity: ' || v_titles[i] || ' for ' || v_company || '. Includes supply, installation and STEG grid connection.',
            v_contact, v_stage, v_prob, 0, 'TND',
            CASE WHEN v_is_open THEN now() + ((10 + i)::text || ' days')::interval ELSE v_close END,
            CASE WHEN v_is_open THEN NULL ELSE v_close END,
            v_cat, 'seed-demo',
            CASE WHEN v_is_open THEN 'Awaiting client decision on the PV proposal.' ELSE 'Won — delivered via the linked project.' END,
            ARRAY['seed-demo', v_cat, 'photovoltaic'],
            '1', v_owner,
            now() - ((i + 12)::text || ' days')::interval,  -- CreatedDate
            v_user, v_owner,                                -- CreatedBy, CreatedByName
            v_close,                                        -- LastActivity
            CASE WHEN v_is_open THEN NULL ELSE v_close END, -- ConvertedAt
            CASE WHEN v_is_open THEN 'Call to confirm budget & roof access' ELSE NULL END,            -- NextAction
            CASE WHEN v_is_open THEN now() + ((2 + (i % 5))::text || ' days')::interval ELSE NULL END) -- NextActionDate
        RETURNING "Id" INTO v_deal;

        v_value := 0;

        -- ── Deal items (PV equipment) ───────────────────────────────
        FOR j IN 0..(n_items - 1) LOOP
            idx     := ((i + j - 1) % array_length(v_item_names, 1)) + 1;
            v_item  := v_item_names[idx];
            v_itype := v_item_types[idx];
            v_price := v_item_prices[idx];
            v_qty   := CASE WHEN v_itype = 'service' THEN 1 ELSE 4 + ((i + j) % 12) * 5 END;  -- bulk panels/cable, single services
            v_line  := round(v_qty * v_price, 2);
            v_value := v_value + v_line;

            INSERT INTO "DealItems"(
                "TenantId","DealId","Type","ItemName","ItemCode","Description","Quantity","UnitPrice",
                "Discount","DiscountType","LineTotal","DisplayOrder")
            VALUES (
                v_tenant, v_deal, v_itype, v_item, 'PV-' || lpad((idx)::text, 3, '0'),
                v_item || ' for ' || v_titles[i], v_qty, v_price, 0, 'percentage', v_line, j);
        END LOOP;

        v_dnum := 'DEAL-' || lpad(v_deal::text, 5, '0');
        UPDATE "Deals" SET "EstimatedValue" = v_value, "DealNumber" = v_dnum WHERE "Id" = v_deal;

        -- ── Deal activities ─────────────────────────────────────────
        INSERT INTO "DealActivities"("TenantId","DealId","Type","Description","CreatedAt","CreatedBy","CreatedByName") VALUES
            (v_tenant, v_deal, 'created',       'Deal created from ' || v_src,                       now() - ((i + 12)::text || ' days')::interval, v_user, v_owner),
            (v_tenant, v_deal, 'status_change', 'Stage changed to ' || v_stage,                      now() - ((i + 6)::text  || ' days')::interval, v_user, v_owner),
            (v_tenant, v_deal, 'note',          'PV proposal sent (' || v_value || ' TND).',         now() - ((i + 3)::text  || ' days')::interval, v_user, v_owner);

        -- Open deals stop here (live pipeline). Won deals get a project + tasks.
        IF v_is_open THEN
            CONTINUE;
        END IF;

        INSERT INTO "DealActivities"("TenantId","DealId","Type","Description","CreatedAt","CreatedBy","CreatedByName")
        VALUES (v_tenant, v_deal, 'converted', 'Converted to a delivery project.', v_close, v_user, v_owner);

        -- ── Project (converted from the deal) ───────────────────────
        INSERT INTO "Projects"(
            "Name","Description","Status","Priority","ContactId","CreatedDate","CreatedBy",
            "TenantId","ProjectKind","ConvertedFromDealId","Budget","StartDate")
        VALUES (
            v_titles[i] || ' — ' || v_company,
            'PV delivery project for the won deal "' || v_titles[i] || '" (' || v_dnum || '). Supply, mounting, wiring, STEG connection & commissioning.',
            'active', (CASE WHEN i % 3 = 0 THEN 'high' WHEN i % 3 = 1 THEN 'medium' ELSE 'low' END),
            v_contact, now(), v_user, v_tenant, 'client', v_deal, v_value, v_close)
        RETURNING "Id" INTO v_project;

        UPDATE "Deals" SET "ProjectId" = v_project, "ConvertedToProjectId" = v_project::text WHERE "Id" = v_deal;

        INSERT INTO "ProjectNotes"("ProjectId","Content","CreatedDate","CreatedBy","TenantId")
        VALUES (v_project, 'PV project auto-created from deal ' || v_dnum || ' (' || v_value || ' TND). Category: ' || v_cat || '.', now(), v_user, v_tenant);

        -- ── Kanban columns ──────────────────────────────────────────
        INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") VALUES (v_tenant, v_project, 'To Do',       1, '#94a3b8') RETURNING "Id" INTO v_col1;
        INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") VALUES (v_tenant, v_project, 'In Progress', 2, '#3b82f6') RETURNING "Id" INTO v_col2;
        INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") VALUES (v_tenant, v_project, 'Done',        3, '#10b981') RETURNING "Id" INTO v_col3;

        -- ── PV delivery task workflow ───────────────────────────────
        n_tasks := array_length(v_task_titles, 1);
        FOR j IN 1..n_tasks LOOP
            INSERT INTO "ProjectTasks"(
                "Title","Description","Priority","DueDate","CreatedDate","CreatedBy","TenantId",
                "RelatedEntityType","RelatedEntityId","ProjectId","TaskType","Status","EstimatedHours")
            VALUES (
                v_task_titles[j], v_task_titles[j] || ' for ' || v_company,
                (CASE WHEN j <= 4 THEN 'high' WHEN j <= 8 THEN 'medium' ELSE 'low' END),
                now() + ((j * 3)::text || ' days')::interval, now(), v_user, v_tenant,
                'project', v_project, v_project, v_task_types[j], v_task_status[j],
                (CASE WHEN v_task_types[j] = 'visit' THEN 8 ELSE 3 END));
        END LOOP;

        -- One install task per major equipment line item
        FOR j IN 0..(n_items - 1) LOOP
            idx    := ((i + j - 1) % array_length(v_item_names, 1)) + 1;
            v_item := v_item_names[idx];
            IF v_item_types[idx] = 'article' THEN
                INSERT INTO "ProjectTasks"(
                    "Title","Description","Priority","DueDate","CreatedDate","CreatedBy","TenantId",
                    "RelatedEntityType","RelatedEntityId","ProjectId","TaskType","Status","EstimatedHours")
                VALUES (
                    'Install: ' || v_item, 'Install / mount ' || v_item || ' on site',
                    'medium', now() + ((14 + j * 2)::text || ' days')::interval, now(), v_user, v_tenant,
                    'project', v_project, v_project, 'follow-up',
                    (CASE WHEN j = 0 THEN 'in progress' ELSE 'open' END), 4);
            END IF;
        END LOOP;

        -- ── Every 3rd won deal also becomes a Sale (deal → sale → project) ──
        IF i % 3 = 0 THEN
            INSERT INTO "Sales"(
                "SaleNumber","ContactId","SaleDate","Status","TotalAmount","TaxAmount","GrandTotal","PaymentStatus",
                "CreatedBy","CreatedDate","Title","Description","Currency","Stage","Priority","Category","Source",
                "TenantId","IsDeleted","ProjectId","DealId","IsDeal","FiscalStamp")
            VALUES (
                'SALE-SEED-' || lpad(v_deal::text, 5, '0'), v_contact, v_close, 'created',
                v_value, round(v_value * 0.19, 2), round(v_value * 1.19, 2), 'pending',
                v_user, now(), v_titles[i] || ' — ' || v_company, 'Sale created from won PV deal ' || v_dnum,
                'TND', 'closed', 'medium', v_cat, 'seed-demo', v_tenant, false, v_project, v_deal, false, 1.000)
            RETURNING "Id" INTO v_sale;

            UPDATE "Deals" SET "ConvertedToSaleId" = v_sale::text WHERE "Id" = v_deal;
        END IF;

    END LOOP;

    RAISE NOTICE 'PV seed complete — tenant %: 30 deals (~22 won + projects, ~8 open pipeline), PV equipment items, full task boards & linked sales.', v_tenant;
END $$;
