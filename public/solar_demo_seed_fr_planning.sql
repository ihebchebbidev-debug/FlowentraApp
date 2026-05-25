-- =============================================================================
--  Flowentra — DEMO PLANNING (FR) — Service Orders & Jobs : planifiés / non planifiés
--  À exécuter APRÈS dummy_fr_data.sql (et idéalement dummy_fr_data_xl.sql).
--
--  Objectif : produire un jeu de données visuellement parfait pour les écrans
--  de planning (Kanban, calendrier, dispatch board) :
--
--    • 40 Service Orders PLANIFIÉS (statut 'scheduled')   — dates J+1 → J+30
--    • 25 Service Orders NON PLANIFIÉS (statut 'pending') — ScheduledDate NULL
--    • 15 Service Orders EN COURS    (statut 'in_progress')
--    • 10 Service Orders TERMINÉS    (statut 'completed') — historique récent
--
--  Pour chaque SO : 3 jobs (étude / pose / mise en service) avec statuts
--  cohérents, et dispatches assignés uniquement pour les SO planifiés/en cours.
--
--  Préfixes idempotents :  SO-PLN-####  (planifiés)
--                          SO-UNP-####  (non planifiés)
--                          SO-WIP-####  (en cours)
--                          SO-DON-####  (terminés)
--                          DSP-PLN-#####
--
--  Schéma 100% aligné avec dummy_fr_data_xl.sql (colonnes vérifiées).
--  Rollback : bloc à la fin du fichier.
-- =============================================================================
BEGIN;

-- ---------------------------------------------------------------------------
-- 1) SERVICE ORDERS — PLANIFIÉS (40)   statut 'scheduled', ScheduledDate J+1..J+30
-- ---------------------------------------------------------------------------
INSERT INTO "ServiceOrders" ("OrderNumber","ContactId","OrderDate","ServiceType","Priority","Status",
                             "ScheduledDate","TotalAmount","Notes","CreatedDate","CreatedBy",
                             "Description","StartDate","TargetCompletionDate",
                             "EstimatedDuration","EstimatedCost","Tax","CompletionPercentage")
SELECT 'SO-PLN-'||lpad(g::text,4,'0'),
       c."Id",
       NOW() - ((g%7)::text||' days')::interval,
       CASE WHEN (g%4)=0 THEN 'Maintenance préventive'
            WHEN (g%4)=1 THEN 'Installation Résidentielle'
            WHEN (g%4)=2 THEN 'Installation Tertiaire'
            ELSE 'Dépannage onduleur' END,
       (ARRAY['low','medium','high','urgent'])[1+((g*3)%4)],
       'scheduled',
       NOW() + ((1 + (g%30))::text||' days')::interval,
       ((3+(g%10))*2200)::numeric(18,2),
       'Intervention planifiée — équipe assignée, matériel réservé.',
       NOW(), 'seed-planning',
       'Intervention planifiée n°'||g,
       NOW() + ((1 + (g%30))::text||' days')::interval,
       NOW() + ((3 + (g%30))::text||' days')::interval,
       480, ((3+(g%10))*1500)::numeric(18,2),
       ((3+(g%10))*2200*0.19)::numeric(18,2),
       0
FROM generate_series(1,40) g
JOIN LATERAL (
  SELECT "Id" FROM "Contacts"
  WHERE "Type" IN ('individual','company')
  ORDER BY "Id"
  OFFSET ((g*7) % GREATEST((SELECT COUNT(*) FROM "Contacts" WHERE "Type" IN ('individual','company')),1))
  LIMIT 1
) c ON TRUE
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) SERVICE ORDERS — NON PLANIFIÉS (25)   statut 'pending', ScheduledDate NULL
-- ---------------------------------------------------------------------------
INSERT INTO "ServiceOrders" ("OrderNumber","ContactId","OrderDate","ServiceType","Priority","Status",
                             "ScheduledDate","TotalAmount","Notes","CreatedDate","CreatedBy",
                             "Description","StartDate","TargetCompletionDate",
                             "EstimatedDuration","EstimatedCost","Tax","CompletionPercentage")
SELECT 'SO-UNP-'||lpad(g::text,4,'0'),
       c."Id",
       NOW() - ((g%14)::text||' days')::interval,
       CASE WHEN (g%3)=0 THEN 'Demande de devis'
            WHEN (g%3)=1 THEN 'Visite technique à planifier'
            ELSE 'Réparation à programmer' END,
       (ARRAY['low','medium','high'])[1+((g*2)%3)],
       'pending',
       NULL,
       ((2+(g%8))*1800)::numeric(18,2),
       'À planifier — en attente d''attribution technicien / créneau client.',
       NOW(), 'seed-planning',
       'Demande client non encore planifiée n°'||g,
       NULL, NULL,
       240, ((2+(g%8))*1200)::numeric(18,2),
       ((2+(g%8))*1800*0.19)::numeric(18,2),
       0
FROM generate_series(1,25) g
JOIN LATERAL (
  SELECT "Id" FROM "Contacts"
  WHERE "Type" IN ('individual','company')
  ORDER BY "Id" DESC
  OFFSET ((g*5) % GREATEST((SELECT COUNT(*) FROM "Contacts" WHERE "Type" IN ('individual','company')),1))
  LIMIT 1
) c ON TRUE
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) SERVICE ORDERS — EN COURS (15)   statut 'in_progress'
-- ---------------------------------------------------------------------------
INSERT INTO "ServiceOrders" ("OrderNumber","ContactId","OrderDate","ServiceType","Priority","Status",
                             "ScheduledDate","TotalAmount","Notes","CreatedDate","CreatedBy",
                             "Description","StartDate","TargetCompletionDate",
                             "EstimatedDuration","EstimatedCost","Tax","CompletionPercentage")
SELECT 'SO-WIP-'||lpad(g::text,4,'0'),
       c."Id",
       NOW() - ((5 + (g%10))::text||' days')::interval,
       'Installation Résidentielle',
       (ARRAY['medium','high','urgent'])[1+(g%3)],
       'in_progress',
       NOW() - ((g%3)::text||' days')::interval,
       ((4+(g%6))*2500)::numeric(18,2),
       'Chantier en cours — équipe sur site.',
       NOW(), 'seed-planning',
       'Chantier actif n°'||g,
       NOW() - ((g%3)::text||' days')::interval,
       NOW() + ((2 + (g%5))::text||' days')::interval,
       720, ((4+(g%6))*1700)::numeric(18,2),
       ((4+(g%6))*2500*0.19)::numeric(18,2),
       30 + (g*4)%60
FROM generate_series(1,15) g
JOIN LATERAL (
  SELECT "Id" FROM "Contacts"
  WHERE "Type" IN ('individual','company')
  ORDER BY "Id"
  OFFSET ((g*3) % GREATEST((SELECT COUNT(*) FROM "Contacts" WHERE "Type" IN ('individual','company')),1))
  LIMIT 1
) c ON TRUE
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) SERVICE ORDERS — TERMINÉS (10)   statut 'completed'  (historique)
-- ---------------------------------------------------------------------------
INSERT INTO "ServiceOrders" ("OrderNumber","ContactId","OrderDate","ServiceType","Priority","Status",
                             "ScheduledDate","TotalAmount","Notes","CreatedDate","CreatedBy",
                             "Description","StartDate","TargetCompletionDate",
                             "EstimatedDuration","EstimatedCost","Tax","CompletionPercentage")
SELECT 'SO-DON-'||lpad(g::text,4,'0'),
       c."Id",
       NOW() - ((30 + (g%30))::text||' days')::interval,
       'Installation Résidentielle',
       'medium',
       'completed',
       NOW() - ((10 + (g%20))::text||' days')::interval,
       ((5+(g%5))*2300)::numeric(18,2),
       'Mission livrée — PV de réception signé, garantie active.',
       NOW(), 'seed-planning',
       'Installation livrée n°'||g,
       NOW() - ((15 + (g%15))::text||' days')::interval,
       NOW() - ((5 + (g%5))::text||' days')::interval,
       600, ((5+(g%5))*1600)::numeric(18,2),
       ((5+(g%5))*2300*0.19)::numeric(18,2),
       100
FROM generate_series(1,10) g
JOIN LATERAL (
  SELECT "Id" FROM "Contacts"
  WHERE "Type" IN ('individual','company')
  ORDER BY "Id"
  OFFSET ((g*9) % GREATEST((SELECT COUNT(*) FROM "Contacts" WHERE "Type" IN ('individual','company')),1))
  LIMIT 1
) c ON TRUE
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5) JOBS (3 par SO) — statuts cohérents avec le statut du Service Order
-- ---------------------------------------------------------------------------
-- 5a) Jobs pour SO PLANIFIÉS : tous 'scheduled'
INSERT INTO "ServiceOrderJobs" ("ServiceOrderId","JobDescription","Status","EstimatedHours","Title",
                                "WorkType","Priority","ScheduledDate","EstimatedDuration",
                                "EstimatedCost","RequiredSkills","CompletionPercentage")
SELECT so."Id", v.descr, 'scheduled', v.hrs, v.title, v.wtype, so."Priority",
       so."ScheduledDate" + (v.offs::text||' days')::interval, v.dur, v.cost,
       v.skills, 0
FROM "ServiceOrders" so
CROSS JOIN (VALUES
  ('Étude de faisabilité, mesures, dimensionnement',2.0,'Étude technique','survey',0,120,300.00,ARRAY['Étude technique']),
  ('Pose panneaux + onduleur + câblage DC',6.0,'Pose des panneaux','installation',1,360,1200.00,ARRAY['Pose panneaux PV','Travail en hauteur']),
  ('Raccordement AC, tests, mise en service',3.0,'Mise en service','commissioning',2,180,600.00,ARRAY['Raccordement réseau BT','Mise en service'])
) v(descr,hrs,title,wtype,offs,dur,cost,skills)
WHERE so."OrderNumber" LIKE 'SO-PLN-%'
ON CONFLICT DO NOTHING;

-- 5b) Jobs pour SO NON PLANIFIÉS : tous 'pending', ScheduledDate NULL
INSERT INTO "ServiceOrderJobs" ("ServiceOrderId","JobDescription","Status","EstimatedHours","Title",
                                "WorkType","Priority","ScheduledDate","EstimatedDuration",
                                "EstimatedCost","RequiredSkills","CompletionPercentage")
SELECT so."Id", v.descr, 'pending', v.hrs, v.title, v.wtype, so."Priority",
       NULL, v.dur, v.cost, v.skills, 0
FROM "ServiceOrders" so
CROSS JOIN (VALUES
  ('Visite technique à programmer',1.5,'Visite technique','survey',90,200.00,ARRAY['Étude technique']),
  ('Devis matériel à finaliser',1.0,'Devis détaillé','quote',60,150.00,ARRAY['Chiffrage']),
  ('Planification à confirmer avec le client',0.5,'Confirmation créneau','scheduling',30,80.00,ARRAY['Coordination'])
) v(descr,hrs,title,wtype,dur,cost,skills)
WHERE so."OrderNumber" LIKE 'SO-UNP-%'
ON CONFLICT DO NOTHING;

-- 5c) Jobs pour SO EN COURS : 1 completed + 1 in_progress + 1 scheduled
INSERT INTO "ServiceOrderJobs" ("ServiceOrderId","JobDescription","Status","EstimatedHours","Title",
                                "WorkType","Priority","ScheduledDate","EstimatedDuration",
                                "EstimatedCost","RequiredSkills","CompletionPercentage")
SELECT so."Id", v.descr, v.st, v.hrs, v.title, v.wtype, so."Priority",
       so."ScheduledDate" + (v.offs::text||' days')::interval, v.dur, v.cost,
       v.skills, v.pct
FROM "ServiceOrders" so
CROSS JOIN (VALUES
  ('Étude technique réalisée','completed',2.0,'Étude technique','survey',0,120,300.00,ARRAY['Étude technique'],100),
  ('Pose en cours sur site','in_progress',6.0,'Pose des panneaux','installation',1,360,1200.00,ARRAY['Pose panneaux PV'],55),
  ('Raccordement à venir','scheduled',3.0,'Mise en service','commissioning',2,180,600.00,ARRAY['Mise en service'],0)
) v(descr,st,hrs,title,wtype,offs,dur,cost,skills,pct)
WHERE so."OrderNumber" LIKE 'SO-WIP-%'
ON CONFLICT DO NOTHING;

-- 5d) Jobs pour SO TERMINÉS : tous 'completed'
INSERT INTO "ServiceOrderJobs" ("ServiceOrderId","JobDescription","Status","EstimatedHours","Title",
                                "WorkType","Priority","ScheduledDate","EstimatedDuration",
                                "EstimatedCost","RequiredSkills","CompletionPercentage")
SELECT so."Id", v.descr, 'completed', v.hrs, v.title, v.wtype, so."Priority",
       so."ScheduledDate" + (v.offs::text||' days')::interval, v.dur, v.cost,
       v.skills, 100
FROM "ServiceOrders" so
CROSS JOIN (VALUES
  ('Étude technique réalisée',2.0,'Étude technique','survey',0,120,300.00,ARRAY['Étude technique']),
  ('Installation terminée',6.0,'Pose des panneaux','installation',1,360,1200.00,ARRAY['Pose panneaux PV']),
  ('Mise en service validée',3.0,'Mise en service','commissioning',2,180,600.00,ARRAY['Mise en service'])
) v(descr,hrs,title,wtype,offs,dur,cost,skills)
WHERE so."OrderNumber" LIKE 'SO-DON-%'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6) DISPATCHES — uniquement pour SO planifiés et en cours
--    (les non planifiés n'ont aucun dispatch — c'est le point de la démo)
-- ---------------------------------------------------------------------------
INSERT INTO "Dispatches" ("DispatchNumber","ContactId","ServiceOrderId","ScheduledDate","Status",
                          "Priority","Description","SiteAddress","CreatedDate","CreatedBy",
                          "JobId","RequiredSkills","CompletionPercentage","IsDeleted")
SELECT 'DSP-PLN-'||lpad((ROW_NUMBER() OVER (ORDER BY j."Id"))::text,5,'0'),
       so."ContactId", so."Id",
       j."ScheduledDate",
       CASE WHEN so."Status"='in_progress' AND j."Status"='completed' THEN 'completed'
            WHEN so."Status"='in_progress' AND j."Status"='in_progress' THEN 'in_progress'
            ELSE 'scheduled' END,
       COALESCE(j."Priority",'medium'),
       j."JobDescription",
       COALESCE(c."Address", 'Adresse client à confirmer'),
       NOW(), 'seed-planning',
       j."Id"::text,
       j."RequiredSkills", COALESCE(j."CompletionPercentage",0), FALSE
FROM "ServiceOrderJobs" j
JOIN "ServiceOrders" so ON so."Id" = j."ServiceOrderId"
JOIN "Contacts"      c  ON c."Id"  = so."ContactId"
WHERE so."OrderNumber" LIKE 'SO-PLN-%'
   OR so."OrderNumber" LIKE 'SO-WIP-%'
ON CONFLICT DO NOTHING;

INSERT INTO "DispatchJobs" ("DispatchId","JobId")
SELECT d."Id", CAST(d."JobId" AS INT)
FROM "Dispatches" d
WHERE d."DispatchNumber" LIKE 'DSP-PLN-%' AND d."JobId" ~ '^\d+$'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7) SERVICE ORDERS — À PLANIFIER (35)  jobs 'scheduled' SANS dispatch
--    Dates fixées en MAI 2026 (semaine 21→22) pour remplir le calendrier
--    de l'écran dispatcher. Ces jobs apparaîtront comme "à assigner".
-- ---------------------------------------------------------------------------
INSERT INTO "ServiceOrders" ("OrderNumber","ContactId","OrderDate","ServiceType","Priority","Status",
                             "ScheduledDate","TotalAmount","Notes","CreatedDate","CreatedBy",
                             "Description","StartDate","TargetCompletionDate",
                             "EstimatedDuration","EstimatedCost","Tax","CompletionPercentage")
SELECT 'SO-TOP-'||lpad(g::text,4,'0'),
       c."Id",
       DATE '2026-05-20' + ((g%5)::text||' days')::interval,
       CASE WHEN (g%4)=0 THEN 'Maintenance préventive'
            WHEN (g%4)=1 THEN 'Installation Résidentielle'
            WHEN (g%4)=2 THEN 'Installation Tertiaire'
            ELSE 'Dépannage onduleur' END,
       (ARRAY['low','medium','high','urgent'])[1+((g*3)%4)],
       'scheduled',
       DATE '2026-05-26' + ((g%14)::text||' days')::interval,
       ((3+(g%10))*2400)::numeric(18,2),
       'À assigner — créneau réservé, technicien à attribuer.',
       NOW(), 'seed-planning',
       'Mission à planifier n°'||g||' (mai-juin 2026)',
       DATE '2026-05-26' + ((g%14)::text||' days')::interval,
       DATE '2026-05-26' + (((g%14)+3)::text||' days')::interval,
       480, ((3+(g%10))*1500)::numeric(18,2),
       ((3+(g%10))*2400*0.19)::numeric(18,2),
       0
FROM generate_series(1,35) g
JOIN LATERAL (
  SELECT "Id" FROM "Contacts"
  WHERE "Type" IN ('individual','company')
  ORDER BY "Id"
  OFFSET ((g*13) % GREATEST((SELECT COUNT(*) FROM "Contacts" WHERE "Type" IN ('individual','company')),1))
  LIMIT 1
) c ON TRUE
ON CONFLICT DO NOTHING;

-- Jobs pour SO-TOP — 3 jobs 'scheduled' chacun, dates étalées MAI/JUIN 2026
INSERT INTO "ServiceOrderJobs" ("ServiceOrderId","JobDescription","Status","EstimatedHours","Title",
                                "WorkType","Priority","ScheduledDate","EstimatedDuration",
                                "EstimatedCost","RequiredSkills","CompletionPercentage")
SELECT so."Id", v.descr, 'scheduled', v.hrs, v.title, v.wtype, so."Priority",
       so."ScheduledDate" + (v.offs::text||' days')::interval, v.dur, v.cost,
       v.skills, 0
FROM "ServiceOrders" so
CROSS JOIN (VALUES
  ('Étude de faisabilité et repérage',2.0,'Étude technique','survey',0,120,300.00,ARRAY['Étude technique']),
  ('Pose panneaux + onduleur + câblage DC',6.0,'Pose des panneaux','installation',1,360,1200.00,ARRAY['Pose panneaux PV','Travail en hauteur']),
  ('Raccordement AC, tests, mise en service',3.0,'Mise en service','commissioning',2,180,600.00,ARRAY['Raccordement réseau BT','Mise en service'])
) v(descr,hrs,title,wtype,offs,dur,cost,skills)
WHERE so."OrderNumber" LIKE 'SO-TOP-%'
ON CONFLICT DO NOTHING;

-- NB: PAS de dispatches pour SO-TOP — c'est exactement ce que le
-- dispatcher doit voir comme "jobs à assigner" dans son interface.


-- ---------------------------------------------------------------------------
-- RÉCAP
-- ---------------------------------------------------------------------------
SELECT 'Planning - SO planifiés'   AS metric, COUNT(*) FROM "ServiceOrders" WHERE "OrderNumber" LIKE 'SO-PLN-%'
UNION ALL SELECT 'Planning - SO à planifier (mai 2026)', COUNT(*) FROM "ServiceOrders" WHERE "OrderNumber" LIKE 'SO-TOP-%'
UNION ALL SELECT 'Planning - SO non planifiés', COUNT(*) FROM "ServiceOrders" WHERE "OrderNumber" LIKE 'SO-UNP-%'
UNION ALL SELECT 'Planning - SO en cours',      COUNT(*) FROM "ServiceOrders" WHERE "OrderNumber" LIKE 'SO-WIP-%'
UNION ALL SELECT 'Planning - SO terminés',      COUNT(*) FROM "ServiceOrders" WHERE "OrderNumber" LIKE 'SO-DON-%'
UNION ALL SELECT 'Planning - Jobs',             COUNT(*) FROM "ServiceOrderJobs" j
                                                JOIN "ServiceOrders" o ON o."Id"=j."ServiceOrderId"
                                                WHERE o."OrderNumber" LIKE 'SO-PLN-%' OR o."OrderNumber" LIKE 'SO-UNP-%'
                                                   OR o."OrderNumber" LIKE 'SO-WIP-%' OR o."OrderNumber" LIKE 'SO-DON-%'
                                                   OR o."OrderNumber" LIKE 'SO-TOP-%'
UNION ALL SELECT 'Planning - Dispatches',       COUNT(*) FROM "Dispatches" WHERE "DispatchNumber" LIKE 'DSP-PLN-%';

COMMIT;

-- =============================================================================
-- ROLLBACK (à exécuter manuellement si besoin)
-- =============================================================================
-- BEGIN;
--   DELETE FROM "DispatchJobs" WHERE "DispatchId" IN (SELECT "Id" FROM "Dispatches" WHERE "DispatchNumber" LIKE 'DSP-PLN-%');
--   DELETE FROM "Dispatches"        WHERE "DispatchNumber" LIKE 'DSP-PLN-%';
--   DELETE FROM "ServiceOrderJobs"  WHERE "ServiceOrderId" IN (
--      SELECT "Id" FROM "ServiceOrders"
--      WHERE "OrderNumber" LIKE 'SO-PLN-%' OR "OrderNumber" LIKE 'SO-UNP-%'
--         OR "OrderNumber" LIKE 'SO-WIP-%' OR "OrderNumber" LIKE 'SO-DON-%' OR "OrderNumber" LIKE 'SO-TOP-%');
--   DELETE FROM "ServiceOrders"
--      WHERE "OrderNumber" LIKE 'SO-PLN-%' OR "OrderNumber" LIKE 'SO-UNP-%'
--         OR "OrderNumber" LIKE 'SO-WIP-%' OR "OrderNumber" LIKE 'SO-DON-%' OR "OrderNumber" LIKE 'SO-TOP-%';
-- COMMIT;
