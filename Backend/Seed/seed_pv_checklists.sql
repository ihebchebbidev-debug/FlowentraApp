-- =====================================================================
-- DEMO SEED — Photovoltaic (Solar PV) CHECKLISTS (Dynamic Forms).
--
-- Creates 6 PV inspection/commissioning form templates (DynamicForms,
-- Released) and attaches checklist instances (EntityFormDocuments) to the
-- PV deals & projects seeded by seed_deals_projects_demo.sql — some filled
-- (completed) with Pass/Fail answers, some still draft.
--
-- Field jsonb is PascalCase (Id/Type/LabelEn/LabelFr/Required/Order/Options),
-- form Status = 1 (Released), checklist Status is lowercase 'draft'/'completed'
-- (DB CHECK), Responses keyed by field Id.
--
-- Tenant-scoped (set v_tenant). Idempotent: re-running removes the prior
-- checklist seed (CreatedBy='seed-demo') first. Run AFTER the deals/projects
-- seed. PostgreSQL.
-- =====================================================================

DO $$
DECLARE
    v_tenant int  := 0;            -- <<< set to your TenantId if not 0
    v_user   text := 'seed-demo';
    v_owner  text := 'Aymen Admin';

    -- Reusable Pass / Fail / N/A option set for radio fields.
    v_pfn jsonb := jsonb_build_array(
        jsonb_build_object('Id','a','Value','pass','LabelEn','Pass','LabelFr','Conforme'),
        jsonb_build_object('Id','b','Value','fail','LabelEn','Fail','LabelFr','Non conforme'),
        jsonb_build_object('Id','c','Value','na',  'LabelEn','N/A', 'LabelFr','N/A'));

    f_survey int; f_struct int; f_install int; f_earth int; f_steg int; f_oem int;
    rec record;
BEGIN
    -- ── 0. Make sure deal + project are valid entity types (defensive) ──
    DECLARE c text;
    BEGIN
        SELECT conname INTO c FROM pg_constraint
         WHERE conrelid = '"EntityFormDocuments"'::regclass AND contype = 'c'
           AND pg_get_constraintdef(oid) ILIKE '%EntityType%';
        IF c IS NOT NULL THEN EXECUTE format('ALTER TABLE "EntityFormDocuments" DROP CONSTRAINT %I', c); END IF;
        ALTER TABLE "EntityFormDocuments" ADD CONSTRAINT "CK_EntityFormDocuments_EntityType"
            CHECK ("EntityType" IN ('offer','sale','serviceorder','dispatch','deal','project'));
    END;

    -- ── 1. Idempotent cleanup ───────────────────────────────────────
    DELETE FROM "EntityFormDocuments" WHERE "CreatedBy" = 'seed-demo';
    DELETE FROM "DynamicForms"        WHERE "CreatedBy" = 'seed-demo';

    -- ── 2. PV form templates (Released) ─────────────────────────────
    INSERT INTO "DynamicForms"("NameEn","NameFr","DescriptionEn","DescriptionFr","Status","Version","Category","Fields","CreatedUser","CreatedBy","CreatedAt","IsDeleted","IsActive","IsPublic","TenantId")
    VALUES ('PV Site Survey & Shading','Etude de site PV & ombrage','Pre-installation solar site survey','Visite technique avant installation', 1, 1, 'Solar PV Checklist',
        jsonb_build_array(
            jsonb_build_object('Id','f1','Type','radio','LabelEn','Site access confirmed','LabelFr','Acces au site confirme','Required',true,'Order',0,'Options',v_pfn),
            jsonb_build_object('Id','f2','Type','radio','LabelEn','Shading acceptable (under 5 percent loss)','LabelFr','Ombrage acceptable','Required',true,'Order',1,'Options',v_pfn),
            jsonb_build_object('Id','f3','Type','radio','LabelEn','Orientation and tilt suitable','LabelFr','Orientation et inclinaison adaptees','Required',true,'Order',2,'Options',v_pfn),
            jsonb_build_object('Id','f4','Type','number','LabelEn','Usable area (m2)','LabelFr','Surface utile (m2)','Required',false,'Order',3),
            jsonb_build_object('Id','f5','Type','text','LabelEn','Roof / mounting type','LabelFr','Type de toiture / fixation','Required',false,'Order',4),
            jsonb_build_object('Id','f6','Type','textarea','LabelEn','Survey notes','LabelFr','Notes de visite','Required',false,'Order',5),
            jsonb_build_object('Id','f7','Type','date','LabelEn','Survey date','LabelFr','Date de visite','Required',false,'Order',6),
            jsonb_build_object('Id','f8','Type','signature','LabelEn','Surveyor signature','LabelFr','Signature du technicien','Required',false,'Order',7)),
        v_user, v_user, now(), false, true, false, v_tenant)
    RETURNING "Id" INTO f_survey;

    INSERT INTO "DynamicForms"("NameEn","NameFr","DescriptionEn","DescriptionFr","Status","Version","Category","Fields","CreatedUser","CreatedBy","CreatedAt","IsDeleted","IsActive","IsPublic","TenantId")
    VALUES ('PV Structural & Roof Assessment','Evaluation structurelle & toiture','Roof load and structure check','Verification structure et charge', 1, 1, 'Solar PV Checklist',
        jsonb_build_array(
            jsonb_build_object('Id','f1','Type','radio','LabelEn','Structure can bear PV load','LabelFr','Structure supporte la charge PV','Required',true,'Order',0,'Options',v_pfn),
            jsonb_build_object('Id','f2','Type','radio','LabelEn','Waterproofing intact','LabelFr','Etancheite intacte','Required',true,'Order',1,'Options',v_pfn),
            jsonb_build_object('Id','f3','Type','radio','LabelEn','Mounting points identified','LabelFr','Points de fixation identifies','Required',true,'Order',2,'Options',v_pfn),
            jsonb_build_object('Id','f4','Type','number','LabelEn','Roof slope (deg)','LabelFr','Pente toiture (deg)','Required',false,'Order',3),
            jsonb_build_object('Id','f5','Type','textarea','LabelEn','Reinforcement required?','LabelFr','Renforcement necessaire ?','Required',false,'Order',4),
            jsonb_build_object('Id','f6','Type','signature','LabelEn','Engineer signature','LabelFr','Signature ingenieur','Required',false,'Order',5)),
        v_user, v_user, now(), false, true, false, v_tenant)
    RETURNING "Id" INTO f_struct;

    INSERT INTO "DynamicForms"("NameEn","NameFr","DescriptionEn","DescriptionFr","Status","Version","Category","Fields","CreatedUser","CreatedBy","CreatedAt","IsDeleted","IsActive","IsPublic","TenantId")
    VALUES ('PV DC/AC Installation Checklist','Checklist installation DC/AC','Panel, DC string and inverter wiring checks','Verification panneaux, chaines DC et onduleur', 1, 1, 'Solar PV Checklist',
        jsonb_build_array(
            jsonb_build_object('Id','f1','Type','checkbox','LabelEn','Panels mounted and torqued','LabelFr','Panneaux montes et serres','Required',false,'Order',0),
            jsonb_build_object('Id','f2','Type','checkbox','LabelEn','DC string polarity verified','LabelFr','Polarite des chaines DC verifiee','Required',false,'Order',1),
            jsonb_build_object('Id','f3','Type','checkbox','LabelEn','Combiner box and fuses installed','LabelFr','Boite de jonction et fusibles installes','Required',false,'Order',2),
            jsonb_build_object('Id','f4','Type','checkbox','LabelEn','Inverter mounted and connected','LabelFr','Onduleur monte et raccorde','Required',false,'Order',3),
            jsonb_build_object('Id','f5','Type','checkbox','LabelEn','AC protection (breaker/RCD) installed','LabelFr','Protection AC (disjoncteur) installee','Required',false,'Order',4),
            jsonb_build_object('Id','f6','Type','radio','LabelEn','DC open-circuit voltage within range','LabelFr','Tension DC dans la plage','Required',true,'Order',5,'Options',v_pfn),
            jsonb_build_object('Id','f7','Type','textarea','LabelEn','Installation notes','LabelFr','Notes installation','Required',false,'Order',6),
            jsonb_build_object('Id','f8','Type','signature','LabelEn','Installer signature','LabelFr','Signature installateur','Required',false,'Order',7)),
        v_user, v_user, now(), false, true, false, v_tenant)
    RETURNING "Id" INTO f_install;

    INSERT INTO "DynamicForms"("NameEn","NameFr","DescriptionEn","DescriptionFr","Status","Version","Category","Fields","CreatedUser","CreatedBy","CreatedAt","IsDeleted","IsActive","IsPublic","TenantId")
    VALUES ('PV Earthing & Lightning Protection','Mise a la terre & protection foudre','Earthing, bonding and SPD verification','Verification terre, liaison et parafoudre', 1, 1, 'Solar PV Checklist',
        jsonb_build_array(
            jsonb_build_object('Id','f1','Type','radio','LabelEn','Equipotential bonding done','LabelFr','Liaison equipotentielle realisee','Required',true,'Order',0,'Options',v_pfn),
            jsonb_build_object('Id','f2','Type','number','LabelEn','Earth resistance (ohm)','LabelFr','Resistance de terre (ohm)','Required',false,'Order',1),
            jsonb_build_object('Id','f3','Type','radio','LabelEn','Surge protection (SPD) installed','LabelFr','Parafoudre (SPD) installe','Required',true,'Order',2,'Options',v_pfn),
            jsonb_build_object('Id','f4','Type','radio','LabelEn','Lightning protection verified','LabelFr','Protection foudre verifiee','Required',true,'Order',3,'Options',v_pfn),
            jsonb_build_object('Id','f5','Type','signature','LabelEn','Inspector signature','LabelFr','Signature controleur','Required',false,'Order',4)),
        v_user, v_user, now(), false, true, false, v_tenant)
    RETURNING "Id" INTO f_earth;

    INSERT INTO "DynamicForms"("NameEn","NameFr","DescriptionEn","DescriptionFr","Status","Version","Category","Fields","CreatedUser","CreatedBy","CreatedAt","IsDeleted","IsActive","IsPublic","TenantId")
    VALUES ('STEG Grid Connection & Commissioning','Raccordement STEG & mise en service','Net-metering, anti-islanding and performance tests','Comptage net, anti-ilotage et tests de performance', 1, 1, 'Solar PV Checklist',
        jsonb_build_array(
            jsonb_build_object('Id','f1','Type','checkbox','LabelEn','STEG meter / net-metering installed','LabelFr','Compteur STEG / comptage net installe','Required',false,'Order',0),
            jsonb_build_object('Id','f2','Type','radio','LabelEn','Anti-islanding test passed','LabelFr','Test anti-ilotage reussi','Required',true,'Order',1,'Options',v_pfn),
            jsonb_build_object('Id','f3','Type','number','LabelEn','Measured AC power (kW)','LabelFr','Puissance AC mesuree (kW)','Required',false,'Order',2),
            jsonb_build_object('Id','f4','Type','number','LabelEn','Performance ratio (percent)','LabelFr','Ratio de performance (pourcent)','Required',false,'Order',3),
            jsonb_build_object('Id','f5','Type','radio','LabelEn','Monitoring online','LabelFr','Supervision en ligne','Required',true,'Order',4,'Options',v_pfn),
            jsonb_build_object('Id','f6','Type','date','LabelEn','Commissioning date','LabelFr','Date de mise en service','Required',false,'Order',5),
            jsonb_build_object('Id','f7','Type','rating','LabelEn','Overall installation quality','LabelFr','Qualite globale','Required',false,'Order',6,'MaxStars',5),
            jsonb_build_object('Id','f8','Type','signature','LabelEn','Client acceptance signature','LabelFr','Signature acceptation client','Required',false,'Order',7)),
        v_user, v_user, now(), false, true, false, v_tenant)
    RETURNING "Id" INTO f_steg;

    INSERT INTO "DynamicForms"("NameEn","NameFr","DescriptionEn","DescriptionFr","Status","Version","Category","Fields","CreatedUser","CreatedBy","CreatedAt","IsDeleted","IsActive","IsPublic","TenantId")
    VALUES ('PV O&M Inspection','Inspection exploitation & maintenance PV','Periodic operation & maintenance checklist','Checklist exploitation et maintenance periodique', 1, 1, 'Solar PV Checklist',
        jsonb_build_array(
            jsonb_build_object('Id','f1','Type','radio','LabelEn','Panels clean','LabelFr','Panneaux propres','Required',true,'Order',0,'Options',v_pfn),
            jsonb_build_object('Id','f2','Type','radio','LabelEn','No hotspots (thermal scan)','LabelFr','Aucun point chaud (thermographie)','Required',true,'Order',1,'Options',v_pfn),
            jsonb_build_object('Id','f3','Type','radio','LabelEn','Connections tight and corrosion-free','LabelFr','Connexions serrees sans corrosion','Required',true,'Order',2,'Options',v_pfn),
            jsonb_build_object('Id','f4','Type','number','LabelEn','Yield vs expected (percent)','LabelFr','Rendement vs attendu (pourcent)','Required',false,'Order',3),
            jsonb_build_object('Id','f5','Type','textarea','LabelEn','Findings and actions','LabelFr','Constats et actions','Required',false,'Order',4),
            jsonb_build_object('Id','f6','Type','date','LabelEn','Inspection date','LabelFr','Date inspection','Required',false,'Order',5)),
        v_user, v_user, now(), false, true, false, v_tenant)
    RETURNING "Id" INTO f_oem;

    -- ── 3. Attach a completed Site Survey checklist to every seeded deal ──
    FOR rec IN SELECT "Id", "Title" FROM "Deals" WHERE "Source" = 'seed-demo' LOOP
        INSERT INTO "EntityFormDocuments"("EntityType","EntityId","FormId","FormVersion","Title","Status","Responses","CreatedBy","CreatedByName","CreatedAt","TenantId")
        VALUES ('deal', rec."Id", f_survey, 1, 'PV Site Survey & Shading', 'completed',
                jsonb_build_object('f1','pass','f2','pass','f3','pass','f4',350,'f5','Flat concrete roof','f6','Good site; minor parapet shading in winter.','f7', to_char(now() - interval '20 days','YYYY-MM-DD')),
                v_user, v_owner, now(), v_tenant);
    END LOOP;

    -- ── 4. Attach the full PV workflow of checklists to every seeded project ──
    FOR rec IN SELECT "Id", "Name" FROM "Projects" WHERE "ConvertedFromDealId" IN (SELECT "Id" FROM "Deals" WHERE "Source" = 'seed-demo') LOOP
        -- Structural assessment — completed
        INSERT INTO "EntityFormDocuments"("EntityType","EntityId","FormId","FormVersion","Title","Status","Responses","CreatedBy","CreatedByName","CreatedAt","TenantId")
        VALUES ('project', rec."Id", f_struct, 1, 'PV Structural & Roof Assessment', 'completed',
                jsonb_build_object('f1','pass','f2','pass','f3','pass','f4',7,'f5','No reinforcement required.'),
                v_user, v_owner, now(), v_tenant);

        -- DC/AC installation — completed
        INSERT INTO "EntityFormDocuments"("EntityType","EntityId","FormId","FormVersion","Title","Status","Responses","CreatedBy","CreatedByName","CreatedAt","TenantId")
        VALUES ('project', rec."Id", f_install, 1, 'PV DC/AC Installation Checklist', 'completed',
                jsonb_build_object('f1',true,'f2',true,'f3',true,'f4',true,'f5',true,'f6','pass','f7','Strings tested, polarity OK.'),
                v_user, v_owner, now(), v_tenant);

        -- Earthing & lightning protection — draft (in progress)
        INSERT INTO "EntityFormDocuments"("EntityType","EntityId","FormId","FormVersion","Title","Status","Responses","CreatedBy","CreatedByName","CreatedAt","TenantId")
        VALUES ('project', rec."Id", f_earth, 1, 'PV Earthing & Lightning Protection', 'draft',
                jsonb_build_object('f1','pass','f2',8), v_user, v_owner, now(), v_tenant);

        -- STEG grid connection & commissioning — draft
        INSERT INTO "EntityFormDocuments"("EntityType","EntityId","FormId","FormVersion","Title","Status","Responses","CreatedBy","CreatedByName","CreatedAt","TenantId")
        VALUES ('project', rec."Id", f_steg, 1, 'STEG Grid Connection & Commissioning', 'draft',
                '{}'::jsonb, v_user, v_owner, now(), v_tenant);

        -- O&M inspection — draft (scheduled)
        INSERT INTO "EntityFormDocuments"("EntityType","EntityId","FormId","FormVersion","Title","Status","Responses","CreatedBy","CreatedByName","CreatedAt","TenantId")
        VALUES ('project', rec."Id", f_oem, 1, 'PV O&M Inspection', 'draft',
                '{}'::jsonb, v_user, v_owner, now(), v_tenant);
    END LOOP;

    RAISE NOTICE 'PV checklist seed complete — tenant %: 6 form templates, checklists attached to all seed deals & projects.', v_tenant;
END $$;
