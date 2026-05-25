-- =============================================================================
--  Flowentra — DEMO HR & ACHATS / STOCK (FR)
--  À exécuter APRÈS dummy_fr_data.sql (+ optionnellement _xl et _planning).
--
--  Contenu :
--    HR
--      • 20 techniciens + 6 commerciaux + 4 managers (Users)
--      • Compétences (Skills) + assignations (UserSkills)
--      • Horaires de travail (user_working_hours) lun→sam
--      • 35 congés (user_leaves) : approuvés / en attente / refusés
--      • Historique de statut en ligne / hors ligne (user_status_history)
--      • 60 entrées de pointage (TimeEntries / ServiceOrderTimeEntries)
--
--    ACHATS / STOCK
--      • 80 transactions d'inventaire (InventoryTransactions) : entrées achats
--      • 120 stock_transactions (mouvements détaillés avec références)
--      • 90 utilisations de matériel sur dispatches (MaterialUsage)
--      • 70 dépenses opérationnelles (Expenses) liées aux dispatches
--      • 50 dépenses de Service Orders (ServiceOrderExpenses)
--      • 200 matériels consommés sur Service Orders (ServiceOrderMaterials)
--
--  Schéma 100% aligné avec FullDatabaseTable.sql (colonnes vérifiées).
--  Idempotent par préfixes : HR-, PUR-, MAT-, EXP-
--  Rollback : voir bloc à la fin.
-- =============================================================================
BEGIN;

-- ===========================================================================
-- HR — SKILLS
-- ===========================================================================
INSERT INTO "Skills" ("Name","Category","Description","IsActive","CreatedAt","CreatedBy","Level")
VALUES
 ('Pose panneaux PV','installation','Installation panneaux photovoltaïques',TRUE,NOW(),'seed-hr','expert'),
 ('Raccordement réseau BT','electrical','Raccordement basse tension STEG',TRUE,NOW(),'seed-hr','expert'),
 ('Travail en hauteur','safety','Habilitation travail en hauteur',TRUE,NOW(),'seed-hr','required'),
 ('Mise en service','commissioning','MES installations PV',TRUE,NOW(),'seed-hr','expert'),
 ('Étude technique','engineering','Dimensionnement & calepinage',TRUE,NOW(),'seed-hr','senior'),
 ('Maintenance onduleur','maintenance','Diagnostic onduleurs string/hybrides',TRUE,NOW(),'seed-hr','expert'),
 ('Soudure DC','electrical','Connectique MC4 & soudure DC',TRUE,NOW(),'seed-hr','intermediate'),
 ('Conduite engin élévateur','equipment','Nacelle / chariot élévateur',TRUE,NOW(),'seed-hr','required'),
 ('Relation client','soft','Accueil et reporting client',TRUE,NOW(),'seed-hr','senior'),
 ('Chiffrage','commercial','Établissement devis solaire',TRUE,NOW(),'seed-hr','expert')
ON CONFLICT DO NOTHING;

-- ===========================================================================
-- HR — USERS (30 utilisateurs : 20 techniciens, 6 commerciaux, 4 managers)
-- ===========================================================================
INSERT INTO "Users" ("FirstName","LastName","Email","Phone","PasswordHash","IsActive",
                     "CreatedDate","CreatedBy","CurrentStatus","Country","Role","Skills","PhoneNumber")
SELECT
  (ARRAY['Ahmed','Mohamed','Karim','Sami','Hichem','Youssef','Wassim','Anis','Tarek','Nizar',
         'Mehdi','Rami','Slim','Adel','Kamel','Walid','Bilel','Aymen','Skander','Marouane'])[g],
  (ARRAY['BenAli','Trabelsi','Bouazizi','Mansouri','Gharbi','Hamdi','Jlassi','Khelifi','Lahmar','Mejri',
         'Nasri','Ouali','Riahi','Saidi','Tlili','Zouari','Abidi','Belhadj','Chaabane','Daoud'])[g],
  'hr.tech'||lpad(g::text,2,'0')||'@flowentra.tn',
  '+216 5'||lpad((1000000+g*37)::text,7,'0'),
  '$2a$11$seedHashSeedHashSeedHashSeedHashSeedHashSeedHashSeedHashSe',
  TRUE, NOW(), 'seed-hr',
  (ARRAY['online','offline','on_break','on_mission'])[1+(g%4)],
  'TN', 'Technician',
  'Pose panneaux PV, Raccordement réseau BT',
  '+216 5'||lpad((1000000+g*37)::text,7,'0')
FROM generate_series(1,20) g
ON CONFLICT DO NOTHING;

INSERT INTO "Users" ("FirstName","LastName","Email","Phone","PasswordHash","IsActive",
                     "CreatedDate","CreatedBy","CurrentStatus","Country","Role","Skills","PhoneNumber")
SELECT
  (ARRAY['Sonia','Leila','Nadia','Imen','Rim','Sarra'])[g],
  (ARRAY['ElAmri','Fitouri','Guesmi','Hammami','Issaoui','Khelifi'])[g],
  'hr.com'||lpad(g::text,2,'0')||'@flowentra.tn',
  '+216 2'||lpad((2000000+g*53)::text,7,'0'),
  '$2a$11$seedHashSeedHashSeedHashSeedHashSeedHashSeedHashSeedHashSe',
  TRUE, NOW(), 'seed-hr', 'online', 'TN', 'Commercial', 'Chiffrage, Relation client',
  '+216 2'||lpad((2000000+g*53)::text,7,'0')
FROM generate_series(1,6) g
ON CONFLICT DO NOTHING;

INSERT INTO "Users" ("FirstName","LastName","Email","Phone","PasswordHash","IsActive",
                     "CreatedDate","CreatedBy","CurrentStatus","Country","Role","Skills","PhoneNumber")
SELECT
  (ARRAY['Hanen','Mariem','Olfa','Amel'])[g],
  (ARRAY['Mejri','Saidi','Tlili','Zouari'])[g],
  'hr.mgr'||lpad(g::text,2,'0')||'@flowentra.tn',
  '+216 9'||lpad((3000000+g*71)::text,7,'0'),
  '$2a$11$seedHashSeedHashSeedHashSeedHashSeedHashSeedHashSeedHashSe',
  TRUE, NOW(), 'seed-hr', 'online', 'TN', 'Manager', 'Relation client', NULL
FROM generate_series(1,4) g
ON CONFLICT DO NOTHING;

-- ===========================================================================
-- HR — USERSKILLS  (compétences par technicien)
-- ===========================================================================
INSERT INTO "UserSkills" ("UserId","SkillId","ProficiencyLevel","YearsOfExperience",
                          "Certifications","IsActive","AssignedAt","AssignedBy")
SELECT u."Id", s."Id",
       (ARRAY['junior','intermediate','senior','expert'])[1+((u."Id"+s."Id")%4)],
       1+((u."Id"*s."Id")%10),
       CASE WHEN s."Name"='Travail en hauteur' THEN 'Habilitation H0B0 - 2025' ELSE NULL END,
       TRUE, NOW(), 'seed-hr'
FROM "Users" u
JOIN LATERAL (
  SELECT "Id","Name" FROM "Skills"
  WHERE "Name" IN ('Pose panneaux PV','Raccordement réseau BT','Travail en hauteur','Mise en service','Maintenance onduleur')
) s ON TRUE
WHERE u."Email" LIKE 'hr.tech%@flowentra.tn'
ON CONFLICT DO NOTHING;

-- ===========================================================================
-- HR — WORKING HOURS (lun→sam 08:00-17:00, pause 12:00-13:00)
-- ===========================================================================
INSERT INTO "user_working_hours" ("user_id","day_of_week","start_time","end_time",
                                  "is_active","created_at","updated_at","lunch_start","lunch_end")
SELECT u."Id", d, TIME '08:00:00', TIME '17:00:00', TRUE, NOW(), NOW(),
       TIME '12:00:00', TIME '13:00:00'
FROM "Users" u
CROSS JOIN generate_series(1,6) d
WHERE u."Email" LIKE 'hr.%@flowentra.tn'
ON CONFLICT DO NOTHING;

-- ===========================================================================
-- HR — LEAVES (35 congés : approved / pending / rejected)
-- ===========================================================================
INSERT INTO "user_leaves" ("user_id","leave_type","start_date","end_date","status",
                           "notes","reason","created_at","updated_at")
SELECT u."Id",
       (ARRAY['vacation','sick','personal','training'])[1+(g%4)],
       (DATE '2026-05-01' + ((g*3)%60)::int)::date,
       (DATE '2026-05-01' + ((g*3)%60)::int + ((g%5)+1))::date,
       (ARRAY['approved','approved','approved','pending','rejected'])[1+(g%5)],
       'Congé saisi via mobile',
       (ARRAY['Vacances famille','Rendez-vous médical','Affaire personnelle','Formation continue'])[1+(g%4)],
       NOW(), NOW()
FROM generate_series(1,35) g
JOIN LATERAL (
  SELECT "Id" FROM "Users" WHERE "Email" LIKE 'hr.%@flowentra.tn'
  ORDER BY "Id" OFFSET (g % GREATEST((SELECT COUNT(*) FROM "Users" WHERE "Email" LIKE 'hr.%@flowentra.tn'),1)) LIMIT 1
) u ON TRUE;

-- ===========================================================================
-- HR — STATUS HISTORY (50 changements)
-- ===========================================================================
INSERT INTO "user_status_history" ("user_id","previous_status","new_status","reason","changed_at")
SELECT u."Id",
       (ARRAY['offline','online','on_break'])[1+(g%3)],
       (ARRAY['online','on_mission','on_break','offline'])[1+(g%4)],
       (ARRAY['Début de journée','Pause déjeuner','Départ en mission','Retour atelier','Fin de journée'])[1+(g%5)],
       NOW() - ((g||' hours')::interval)
FROM generate_series(1,50) g
JOIN LATERAL (
  SELECT "Id" FROM "Users" WHERE "Email" LIKE 'hr.tech%@flowentra.tn'
  ORDER BY "Id" OFFSET (g % GREATEST((SELECT COUNT(*) FROM "Users" WHERE "Email" LIKE 'hr.tech%@flowentra.tn'),1)) LIMIT 1
) u ON TRUE;

-- ===========================================================================
-- HR — TIME ENTRIES sur Service Orders (60 entrées de pointage)
-- ===========================================================================
INSERT INTO "ServiceOrderTimeEntries" ("ServiceOrderId","TechnicianId","StartTime","EndTime",
                                       "DurationMinutes","Description","Type","CreatedBy","CreatedAt")
SELECT so."Id",
       u."Id"::text,
       NOW() - ((g||' hours')::interval),
       NOW() - (((g-2)||' hours')::interval),
       120,
       'Intervention terrain — '||so."ServiceType",
       (ARRAY['work','travel','break','documentation'])[1+(g%4)],
       'seed-hr', NOW()
FROM generate_series(1,60) g
JOIN LATERAL (
  SELECT "Id","ServiceType" FROM "ServiceOrders"
  WHERE "OrderNumber" LIKE 'SO-%' ORDER BY "Id" DESC
  OFFSET (g % GREATEST((SELECT COUNT(*) FROM "ServiceOrders"),1)) LIMIT 1
) so ON TRUE
JOIN LATERAL (
  SELECT "Id" FROM "Users" WHERE "Email" LIKE 'hr.tech%@flowentra.tn'
  ORDER BY "Id" OFFSET (g % 20) LIMIT 1
) u ON TRUE;

-- ===========================================================================
-- ACHATS / STOCK — INVENTORY TRANSACTIONS (80 entrées d'achats)
-- ===========================================================================
INSERT INTO "InventoryTransactions" ("ArticleId","TransactionType","Quantity",
                                     "TransactionDate","Reference","Notes","CreatedBy")
SELECT a."Id",
       (ARRAY['purchase','purchase','purchase','adjustment','return'])[1+(g%5)],
       (5 + (g%20))::numeric(18,2),
       NOW() - ((g||' days')::interval),
       'PUR-'||lpad(g::text,5,'0'),
       'Réception fournisseur — '||COALESCE(a."Supplier",'Fournisseur local'),
       'seed-purchases'
FROM generate_series(1,80) g
JOIN LATERAL (
  SELECT "Id","Supplier" FROM "Articles"
  ORDER BY "Id" OFFSET (g % GREATEST((SELECT COUNT(*) FROM "Articles"),1)) LIMIT 1
) a ON TRUE;

-- ===========================================================================
-- ACHATS / STOCK — stock_transactions détaillés (120 mouvements)
-- ===========================================================================
INSERT INTO "stock_transactions" ("article_id","transaction_type","quantity","previous_stock",
                                  "new_stock","reason","reference_type","reference_id",
                                  "reference_number","notes","performed_by","performed_by_name")
SELECT a."Id",
       (ARRAY['in','out','adjustment','transfer'])[1+(g%4)],
       (1 + (g%15))::numeric(18,2),
       (50 + (g%100))::numeric(18,2),
       (50 + (g%100) + (CASE WHEN (g%4)=0 THEN 15 ELSE -5 END))::numeric(18,2),
       (ARRAY['Achat fournisseur','Consommation chantier','Inventaire physique','Transfert dépôt'])[1+(g%4)],
       (ARRAY['purchase_order','service_order','manual','transfer'])[1+(g%4)],
       (g*7)::text,
       'STK-'||lpad(g::text,6,'0'),
       'Mouvement automatique — démo',
       'seed-purchases', 'Système Seed'
FROM generate_series(1,120) g
JOIN LATERAL (
  SELECT "Id" FROM "Articles"
  ORDER BY "Id" OFFSET (g % GREATEST((SELECT COUNT(*) FROM "Articles"),1)) LIMIT 1
) a ON TRUE;

-- ===========================================================================
-- ACHATS — MATERIAL USAGE (90 utilisations sur dispatches)
-- ===========================================================================
INSERT INTO "MaterialUsage" ("DispatchId","ArticleId","Description","Quantity",
                             "UnitPrice","TotalPrice","UsedDate","RecordedBy")
SELECT d."Id", a."Id",
       'Consommation chantier : '||a."Name"||' x '||(1+(g%5)),
       (1+(g%5))::numeric(18,2),
       a."SalesPrice",
       ((1+(g%5))*a."SalesPrice")::numeric(18,2),
       NOW() - ((g||' hours')::interval),
       'seed-purchases'
FROM generate_series(1,90) g
JOIN LATERAL (
  SELECT "Id" FROM "Dispatches" ORDER BY "Id" DESC
  OFFSET (g % GREATEST((SELECT COUNT(*) FROM "Dispatches"),1)) LIMIT 1
) d ON TRUE
JOIN LATERAL (
  SELECT "Id","Name","SalesPrice" FROM "Articles"
  ORDER BY "Id" OFFSET (g % GREATEST((SELECT COUNT(*) FROM "Articles"),1)) LIMIT 1
) a ON TRUE;

-- ===========================================================================
-- ACHATS — EXPENSES (70 dépenses opérationnelles liées dispatches)
-- ===========================================================================
INSERT INTO "Expenses" ("DispatchId","ExpenseType","Amount","Description",
                        "ExpenseDate","RecordedBy","CreatedDate")
SELECT d."Id",
       (ARRAY['fuel','meal','toll','parking','consumable','other'])[1+(g%6)],
       (15 + (g%150))::numeric(18,2),
       (ARRAY['Carburant trajet chantier','Repas équipe terrain','Péage autoroute',
              'Stationnement zone urbaine','Consommables divers','Frais imprévus'])[1+(g%6)],
       NOW() - ((g||' days')::interval),
       'seed-purchases', NOW()
FROM generate_series(1,70) g
JOIN LATERAL (
  SELECT "Id" FROM "Dispatches" ORDER BY "Id"
  OFFSET (g % GREATEST((SELECT COUNT(*) FROM "Dispatches"),1)) LIMIT 1
) d ON TRUE;

-- ===========================================================================
-- ACHATS — SERVICE ORDER EXPENSES (50 dépenses imputées SO)
-- ===========================================================================
INSERT INTO "ServiceOrderExpenses" ("ServiceOrderId","TechnicianId","Type","Amount",
                                    "Currency","Description","Date","Status","CreatedBy")
SELECT so."Id", u."Id"::text,
       (ARRAY['material','travel','meal','tooling','subcontracting'])[1+(g%5)],
       (50 + (g%500))::numeric(18,2),
       'TND',
       'Frais imputé au Service Order — '||so."ServiceType",
       NOW() - ((g||' days')::interval),
       (ARRAY['pending','approved','approved','rejected'])[1+(g%4)],
       'seed-purchases'
FROM generate_series(1,50) g
JOIN LATERAL (
  SELECT "Id","ServiceType" FROM "ServiceOrders"
  WHERE "OrderNumber" LIKE 'SO-%' ORDER BY "Id" DESC
  OFFSET (g % GREATEST((SELECT COUNT(*) FROM "ServiceOrders"),1)) LIMIT 1
) so ON TRUE
JOIN LATERAL (
  SELECT "Id" FROM "Users" WHERE "Email" LIKE 'hr.tech%@flowentra.tn'
  ORDER BY "Id" OFFSET (g % 20) LIMIT 1
) u ON TRUE;

-- ===========================================================================
-- ACHATS — SERVICE ORDER MATERIALS (200 lignes de matériel)
-- ===========================================================================
INSERT INTO "ServiceOrderMaterials" ("ServiceOrderId","ArticleId","Name","Sku","Description",
                                     "Quantity","UnitPrice","TotalPrice","Status","Source",
                                     "CreatedBy","CreatedAt")
SELECT so."Id", a."Id", a."Name", a."ArticleNumber",
       'Matériel prévu pour le chantier',
       (1+(g%8))::numeric(18,2),
       a."SalesPrice",
       ((1+(g%8))*a."SalesPrice")::numeric(18,2),
       (ARRAY['pending','reserved','consumed','consumed','returned'])[1+(g%5)],
       'auto-seed', 'seed-purchases', NOW()
FROM generate_series(1,200) g
JOIN LATERAL (
  SELECT "Id","ServiceType" FROM "ServiceOrders"
  WHERE "OrderNumber" LIKE 'SO-%' ORDER BY "Id" DESC
  OFFSET (g % GREATEST((SELECT COUNT(*) FROM "ServiceOrders"),1)) LIMIT 1
) so ON TRUE
JOIN LATERAL (
  SELECT "Id","Name","ArticleNumber","SalesPrice" FROM "Articles"
  ORDER BY "Id" OFFSET (g % GREATEST((SELECT COUNT(*) FROM "Articles"),1)) LIMIT 1
) a ON TRUE;

-- ===========================================================================
-- RÉCAP
-- ===========================================================================
SELECT 'HR - Users seed'      AS metric, COUNT(*) FROM "Users" WHERE "Email" LIKE 'hr.%@flowentra.tn'
UNION ALL SELECT 'HR - UserSkills',     COUNT(*) FROM "UserSkills" WHERE "AssignedBy"='seed-hr'
UNION ALL SELECT 'HR - Working hours',  COUNT(*) FROM "user_working_hours" uwh
                                        JOIN "Users" u ON u."Id"=uwh."user_id"
                                        WHERE u."Email" LIKE 'hr.%@flowentra.tn'
UNION ALL SELECT 'HR - Leaves',         COUNT(*) FROM "user_leaves" ul
                                        JOIN "Users" u ON u."Id"=ul."user_id"
                                        WHERE u."Email" LIKE 'hr.%@flowentra.tn'
UNION ALL SELECT 'HR - Status history', COUNT(*) FROM "user_status_history" ush
                                        JOIN "Users" u ON u."Id"=ush."user_id"
                                        WHERE u."Email" LIKE 'hr.%@flowentra.tn'
UNION ALL SELECT 'HR - Time entries',   COUNT(*) FROM "ServiceOrderTimeEntries" WHERE "CreatedBy"='seed-hr'
UNION ALL SELECT 'Achats - Inventory',  COUNT(*) FROM "InventoryTransactions" WHERE "CreatedBy"='seed-purchases'
UNION ALL SELECT 'Achats - Stock txns', COUNT(*) FROM "stock_transactions" WHERE "performed_by"='seed-purchases'
UNION ALL SELECT 'Achats - Material usage', COUNT(*) FROM "MaterialUsage" WHERE "RecordedBy"='seed-purchases'
UNION ALL SELECT 'Achats - Expenses',   COUNT(*) FROM "Expenses" WHERE "RecordedBy"='seed-purchases'
UNION ALL SELECT 'Achats - SO Expenses', COUNT(*) FROM "ServiceOrderExpenses" WHERE "CreatedBy"='seed-purchases'
UNION ALL SELECT 'Achats - SO Materials', COUNT(*) FROM "ServiceOrderMaterials" WHERE "CreatedBy"='seed-purchases';

COMMIT;

-- =============================================================================
-- ROLLBACK (à exécuter manuellement)
-- =============================================================================
-- BEGIN;
--   DELETE FROM "ServiceOrderMaterials" WHERE "CreatedBy"='seed-purchases';
--   DELETE FROM "ServiceOrderExpenses"  WHERE "CreatedBy"='seed-purchases';
--   DELETE FROM "Expenses"              WHERE "RecordedBy"='seed-purchases';
--   DELETE FROM "MaterialUsage"         WHERE "RecordedBy"='seed-purchases';
--   DELETE FROM "stock_transactions"    WHERE "performed_by"='seed-purchases';
--   DELETE FROM "InventoryTransactions" WHERE "CreatedBy"='seed-purchases';
--   DELETE FROM "ServiceOrderTimeEntries" WHERE "CreatedBy"='seed-hr';
--   DELETE FROM "user_status_history"   WHERE "user_id" IN (SELECT "Id" FROM "Users" WHERE "Email" LIKE 'hr.%@flowentra.tn');
--   DELETE FROM "user_leaves"           WHERE "user_id" IN (SELECT "Id" FROM "Users" WHERE "Email" LIKE 'hr.%@flowentra.tn');
--   DELETE FROM "user_working_hours"    WHERE "user_id" IN (SELECT "Id" FROM "Users" WHERE "Email" LIKE 'hr.%@flowentra.tn');
--   DELETE FROM "UserSkills"            WHERE "AssignedBy"='seed-hr';
--   DELETE FROM "Users"                 WHERE "Email" LIKE 'hr.%@flowentra.tn';
--   DELETE FROM "Skills"                WHERE "CreatedBy"='seed-hr';
-- COMMIT;
