-- =============================================================================
--  Flowentra — Extension VOLUME XL "Énergie Solaire" (FR) — LIVE-SCHEMA-CORRECTED
--  À exécuter APRÈS solar_demo_seed_fr.sql
--
--  Génère via generate_series :
--    +200 contacts clients, +30 fournisseurs, +60 articles,
--    +25 users (techniciens/commerciaux), +300 offres, +200 ventes,
--    +250 service orders, +750 jobs, dispatches sur ~70% des jobs,
--    +180 installations, +80 bons de commande fournisseurs.
--
--  Toutes les colonnes correspondent EXACTEMENT au schéma réel utilisé par
--  solar_demo_seed_fr.sql (DB legacy : "Contacts".Name, lowercase offers/sales,
--  ServiceOrders.ContactId, Articles.SalesPrice, Contacts.CreatedDate, etc.).
--
--  Idempotent par préfixes : XL- (articles, emails, numbers)
--  Rollback : voir bloc à la fin.
-- =============================================================================
BEGIN;

\set tenant_id 0
CREATE TEMP TABLE _xl (key text PRIMARY KEY, val text);
INSERT INTO _xl VALUES ('tenant_id', :'tenant_id');

-- ---------------------------------------------------------------------------
-- Pools réalistes
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _cities (i int PRIMARY KEY, ville text);
INSERT INTO _cities VALUES
 (1,'Tunis'),(2,'Sfax'),(3,'Sousse'),(4,'Bizerte'),(5,'Gabès'),(6,'Kairouan'),
 (7,'Gafsa'),(8,'Monastir'),(9,'Médenine'),(10,'Nabeul'),(11,'Ariana'),(12,'Ben Arous'),
 (13,'Manouba'),(14,'Mahdia'),(15,'Tozeur'),(16,'Kébili'),(17,'Tataouine'),(18,'Jendouba'),
 (19,'Béja'),(20,'Kasserine'),(21,'Siliana'),(22,'Zaghouan'),(23,'Sidi Bouzid'),(24,'Le Kef');

CREATE TEMP TABLE _first (i int PRIMARY KEY, prenom text);
INSERT INTO _first VALUES
 (1,'Ahmed'),(2,'Mohamed'),(3,'Karim'),(4,'Sami'),(5,'Hichem'),(6,'Youssef'),(7,'Wassim'),
 (8,'Anis'),(9,'Tarek'),(10,'Nizar'),(11,'Mehdi'),(12,'Rami'),(13,'Slim'),(14,'Adel'),
 (15,'Kamel'),(16,'Walid'),(17,'Bilel'),(18,'Aymen'),(19,'Skander'),(20,'Marouane'),
 (21,'Amel'),(22,'Sonia'),(23,'Leila'),(24,'Nadia'),(25,'Imen'),(26,'Rim'),(27,'Sarra'),
 (28,'Hanen'),(29,'Mariem'),(30,'Olfa');

CREATE TEMP TABLE _last (i int PRIMARY KEY, nom text);
INSERT INTO _last VALUES
 (1,'BenAli'),(2,'Trabelsi'),(3,'Bouazizi'),(4,'Mansouri'),(5,'Gharbi'),(6,'Hamdi'),
 (7,'Jlassi'),(8,'Khelifi'),(9,'Lahmar'),(10,'Mejri'),(11,'Nasri'),(12,'Ouali'),
 (13,'Riahi'),(14,'Saidi'),(15,'Tlili'),(16,'Zouari'),(17,'Abidi'),(18,'Belhadj'),
 (19,'Chaabane'),(20,'Daoud'),(21,'ElAmri'),(22,'Fitouri'),(23,'Guesmi'),(24,'Hammami'),(25,'Issaoui');

CREATE TEMP TABLE _company (i int PRIMARY KEY, nom text, secteur text);
INSERT INTO _company VALUES
 (1,'Résidence Les Oliviers','résidentiel'),(2,'Villa El Manar','résidentiel'),
 (3,'Domaine Carthage','résidentiel'),(4,'Médina Trade SARL','commerce'),
 (5,'Boulangerie Sidi Bou','commerce'),(6,'Pharmacie Centrale','commerce'),
 (7,'Hôtel Dar El Bahr','tourisme'),(8,'Auberge des Dunes','tourisme'),
 (9,'Resort Hammamet Bay','tourisme'),(10,'Clinique El Amen','santé'),
 (11,'Centre Médical Ibn Sina','santé'),(12,'Usine Textile Sahel','industrie'),
 (13,'Conserverie El Bahr','industrie'),(14,'Laiterie Vitalait Sud','industrie'),
 (15,'Cimenterie Carthago','industrie'),(16,'Ferme Aïn Soltane','agriculture'),
 (17,'Coopérative Olives Mahdia','agriculture'),(18,'Serres Cap Bon','agriculture'),
 (19,'École Internationale Tunis','éducation'),(20,'Lycée El Amel','éducation'),
 (21,'Université Carthage Privée','éducation'),(22,'Mairie Hammam Sousse','collectivité'),
 (23,'Station Total Médenine','commerce'),(24,'Garage Auto Plus','commerce'),
 (25,'Bureau Études Atlas','services'),(26,'Cabinet Avocats Ben Salah','services'),
 (27,'Agence Sahara Voyages','services'),(28,'Restaurant Dar Zarrouk','tourisme'),
 (29,'Café Le Colisée','commerce'),(30,'Mosquée Ezzitouna Nord','collectivité');

-- ---------------------------------------------------------------------------
-- 1) CONTACTS CLIENTS (+200) — schéma EF/live : FirstName, LastName, Name,
--    Email, Phone, Company, Position, Address, City, Country, Status, Type,
--    CreatedDate, CreatedBy, IsActive, IsDeleted
-- ---------------------------------------------------------------------------
INSERT INTO "Contacts" ("FirstName","LastName","Name","Email","Phone","Company","Position",
                        "Address","City","Country","Status","Type",
                        "CreatedDate","CreatedBy","IsActive","IsDeleted")
SELECT f.prenom,
       l.nom||' #'||g,
       f.prenom||' '||l.nom||' #'||g,
       'xl.cli'||g||'.'||lower(f.prenom)||'.'||lower(l.nom)||'@mail.tn',
       '+216 '||(20+(g%79))::text||' '||lpad(((g*37)%900+100)::text,3,'0')||' '||lpad(((g*53)%900+100)::text,3,'0'),
       CASE WHEN g%3=0 THEN co.nom ELSE NULL END,
       CASE WHEN g%3=0 THEN initcap(co.secteur) ELSE 'Particulier' END,
       'Rue '||((g%200)+1)::text||', '||c.ville,
       c.ville, 'Tunisie', 'active',
       CASE WHEN g%3=0 THEN 'company' ELSE 'individual' END,
       NOW(), 'seed', TRUE, FALSE
FROM generate_series(1,200) g
JOIN _first   f  ON f.i  = ((g-1)%30)+1
JOIN _last    l  ON l.i  = ((g*7-1)%25)+1
JOIN _cities  c  ON c.i  = ((g*3-1)%24)+1
JOIN _company co ON co.i = ((g*11-1)%30)+1
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) CONTACTS FOURNISSEURS (+30)
-- ---------------------------------------------------------------------------
INSERT INTO "Contacts" ("FirstName","LastName","Name","Email","Phone","Company","Position",
                        "Address","City","Country","Status","Type",
                        "CreatedDate","CreatedBy","IsActive","IsDeleted")
SELECT 'Fournisseur',
       'XL '||g,
       'Fournisseur XL '||g,
       'xl.supplier-'||g||'@fournisseur.tn',
       '+216 71 '||lpad(((g*41)%900+100)::text,3,'0')||' '||lpad(((g*29)%900+100)::text,3,'0'),
       (CASE (g%10)
         WHEN 0 THEN 'SolarTech XL '||g WHEN 1 THEN 'PV Industrie XL '||g
         WHEN 2 THEN 'Inverter Solutions XL '||g WHEN 3 THEN 'BatterieMed XL '||g
         WHEN 4 THEN 'Câbles Pro XL '||g WHEN 5 THEN 'Structures Métal XL '||g
         WHEN 6 THEN 'EcoVolt XL '||g WHEN 7 THEN 'Voltika XL '||g
         WHEN 8 THEN 'SunMaghreb XL '||g ELSE 'EnergieFlux XL '||g END),
       'Responsable commercial',
       'ZI '||c.ville||' Lot '||g, c.ville, 'Tunisie',
       'active','supplier',
       NOW(), 'seed', TRUE, FALSE
FROM generate_series(1,30) g
JOIN _cities c ON c.i = ((g-1)%24)+1
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) ARTICLES (+60) — colonnes : ArticleNumber, Name, Description, Unit,
--    PurchasePrice, SalesPrice, StockQuantity, MinStockLevel, Supplier,
--    IsActive, CreatedDate, CreatedBy, Type (schéma v1)
-- ---------------------------------------------------------------------------
INSERT INTO "Articles" ("ArticleNumber","Name","Description","Unit",
                        "PurchasePrice","SalesPrice","StockQuantity","MinStockLevel",
                        "Supplier","IsActive","CreatedDate","CreatedBy","Type")
SELECT 'XL-PV-'||(400+g*5)||'-'||g,
       'Panneau PV '||(400+g*5)||'W Mono '||g,
       'Panneau photovoltaïque monocristallin '||(400+g*5)||'W, série XL-'||g,
       'pcs',
       (180+g*1.2)::numeric(10,2), (240+g*1.5)::numeric(10,2),
       (200-g)::numeric, 10, 'SolarTech XL',
       TRUE, NOW(), 'seed', 'material'
FROM generate_series(1,20) g
ON CONFLICT DO NOTHING;

INSERT INTO "Articles" ("ArticleNumber","Name","Description","Unit",
                        "PurchasePrice","SalesPrice","StockQuantity","MinStockLevel",
                        "Supplier","IsActive","CreatedDate","CreatedBy","Type")
SELECT 'XL-INV-'||(3+g)||'K-'||g,
       'Onduleur '||(3+g)||'kW Hybride XL-'||g,
       'Onduleur hybride '||(3+g)||'kW, MPPT double, monitoring Wi-Fi',
       'pcs',
       (650+g*45)::numeric(10,2), (950+g*60)::numeric(10,2),
       (40-g)::numeric, 5, 'Volta Power Systems XL',
       TRUE, NOW(), 'seed', 'material'
FROM generate_series(1,15) g
ON CONFLICT DO NOTHING;

INSERT INTO "Articles" ("ArticleNumber","Name","Description","Unit",
                        "PurchasePrice","SalesPrice","StockQuantity","MinStockLevel",
                        "Supplier","IsActive","CreatedDate","CreatedBy","Type")
SELECT 'XL-BAT-'||(5+g*2)||'K-'||g,
       'Batterie LFP '||(5+g*2)||'kWh XL-'||g,
       'Batterie lithium fer phosphate '||(5+g*2)||'kWh, 6000 cycles',
       'pcs',
       (1800+g*120)::numeric(10,2), (2600+g*180)::numeric(10,2),
       (25-g)::numeric, 3, 'BatteryHub XL',
       TRUE, NOW(), 'seed', 'material'
FROM generate_series(1,10) g
ON CONFLICT DO NOTHING;

INSERT INTO "Articles" ("ArticleNumber","Name","Description","Unit",
                        "PurchasePrice","SalesPrice","StockQuantity","MinStockLevel",
                        "Supplier","IsActive","CreatedDate","CreatedBy","Type")
SELECT 'XL-ACC-'||g,
       (CASE (g%5) WHEN 0 THEN 'Connecteur MC4 Pro ' WHEN 1 THEN 'Câble solaire DC 6mm² '
                   WHEN 2 THEN 'Coffret protection DC ' WHEN 3 THEN 'Rail de fixation alu '
                   ELSE 'Optimiseur de puissance ' END)||g,
       'Accessoire installation solaire — référence XL-'||g,
       'pcs',
       (8+g*0.5)::numeric(10,2), (15+g*0.9)::numeric(10,2),
       (500-g*2)::numeric, 50, 'Câbles & Connect XL',
       TRUE, NOW(), 'seed', 'material'
FROM generate_series(1,15) g
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) USERS (+25 — techniciens, commerciaux)
--    Colonnes : FirstName, LastName, Email, Phone, PasswordHash,
--    IsActive, IsDeleted, CreatedDate, CreatedBy (schéma v1)
-- ---------------------------------------------------------------------------
INSERT INTO "Users" ("FirstName","LastName","Email","Phone","PasswordHash",
                     "IsActive","IsDeleted","CreatedDate","CreatedBy")
SELECT f.prenom, l.nom||g::text,
       'tech.xl'||g||'@solarpro.tn',
       '+216 9'||(g%10)::text||' '||lpad(((g*37)%900+100)::text,3,'0')||' '||lpad(((g*53)%900+100)::text,3,'0'),
       '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
       TRUE, FALSE, NOW(), 'seed'
FROM generate_series(1,20) g
JOIN _first f ON f.i = ((g-1)%30)+1
JOIN _last  l ON l.i = ((g*3-1)%25)+1
ON CONFLICT ("Email") DO NOTHING;

INSERT INTO "Users" ("FirstName","LastName","Email","Phone","PasswordHash",
                     "IsActive","IsDeleted","CreatedDate","CreatedBy")
SELECT f.prenom, l.nom||g::text,
       'com.xl'||g||'@solarpro.tn',
       '+216 5'||(g%10)::text||' '||lpad(((g*41)%900+100)::text,3,'0')||' '||lpad(((g*29)%900+100)::text,3,'0'),
       '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
       TRUE, FALSE, NOW(), 'seed'
FROM generate_series(1,5) g
JOIN _first f ON f.i = ((g*5-1)%30)+1
JOIN _last  l ON l.i = ((g*7-1)%25)+1
ON CONFLICT ("Email") DO NOTHING;

-- Attribution des rôles aux nouveaux users (rôles créés par v1)
INSERT INTO "UserRoles" ("UserId","RoleId","AssignedBy","IsActive")
SELECT u."Id", r."Id", 'seed', TRUE
FROM "Users" u
JOIN "Roles" r ON r."Name" = CASE WHEN u."Email" LIKE 'tech.xl%' THEN 'Technicien Solaire' ELSE 'Commercial' END
WHERE u."Email" LIKE 'tech.xl%@solarpro.tn' OR u."Email" LIKE 'com.xl%@solarpro.tn'
ON CONFLICT DO NOTHING;

-- Compétences (3 skills aléatoires par technicien XL)
INSERT INTO "UserSkills" ("UserId","SkillId","ProficiencyLevel","YearsOfExperience","AssignedBy","IsActive")
SELECT u."Id", s."Id",
       (CASE (row_number() OVER (PARTITION BY u."Id" ORDER BY s."Id")) % 3
          WHEN 0 THEN 'Expert' WHEN 1 THEN 'Avancé' ELSE 'Intermédiaire' END),
       2 + (u."Id" % 8),
       'seed', TRUE
FROM "Users" u
CROSS JOIN LATERAL (
  SELECT "Id" FROM "Skills" ORDER BY random() LIMIT 3
) s
WHERE u."Email" LIKE 'tech.xl%@solarpro.tn'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5) OFFRES (+300) — table lowercase `offers` (schéma legacy)
--    Colonnes : id, title, description, contact_id, amount, currency, taxes,
--    discount, status, category, valid_until, assigned_to_name, created_by,
--    created_at, updated_at
-- ---------------------------------------------------------------------------
INSERT INTO offers (id, title, description, contact_id, amount, currency, taxes, discount,
                    status, category, valid_until, assigned_to_name, created_by,
                    created_at, updated_at)
SELECT
  'OFF-XL-'||lpad(g::text,5,'0'),
  'Offre installation solaire '||(3+(g%12))||'kWc — '||c."Name",
  'Offre générée automatiquement — kit '||(3+(g%12))||'kWc clé-en-main',
  c."Id",
  ((3+(g%12))*1850)::numeric(15,2),
  'TND',
  ((3+(g%12))*1850*0.19)::numeric(15,2),
  CASE WHEN g%5=0 THEN ((3+(g%12))*1850*0.05)::numeric(15,2) ELSE 0 END,
  (ARRAY['draft','sent','accepted','rejected','expired'])[1+((g*7)%5)],
  'solaire',
  NOW() + ((30 + (g%30))::text||' days')::interval,
  'Leïla Trabelsi',
  'seed',
  NOW() - ((g%180)::text||' days')::interval,
  NOW() - ((g%30)::text||' days')::interval
FROM generate_series(1,300) g
JOIN LATERAL (
  SELECT "Id","Name" FROM "Contacts"
  WHERE "Type" IN ('individual','company') AND "Email" LIKE 'xl.cli%@mail.tn'
  OFFSET ((g*13) % 200) LIMIT 1
) c ON TRUE
ON CONFLICT (id) DO NOTHING;

-- Lignes d'offres (3 lignes par offre)
-- offer_items : id, offer_id, type, article_id (varchar), item_name, item_code,
--               description, quantity, unit_price, discount
INSERT INTO offer_items (id, offer_id, type, article_id, item_name, item_code,
                         description, quantity, unit_price, discount)
SELECT 'OI-'||o.id||'-'||k,
       o.id,
       'article',
       a."Id"::text,
       a."Name", a."ArticleNumber",
       a."Name",
       (CASE k WHEN 1 THEN (3+(substring(o.id from 8)::int % 12))*2
              WHEN 2 THEN 1 ELSE 2 END)::numeric(10,2),
       a."SalesPrice",
       0
FROM offers o
CROSS JOIN generate_series(1,3) k
JOIN LATERAL (
  SELECT "Id","Name","ArticleNumber","SalesPrice" FROM "Articles"
  WHERE "ArticleNumber" LIKE CASE k
       WHEN 1 THEN 'XL-PV-%' WHEN 2 THEN 'XL-INV-%' ELSE 'XL-ACC-%' END
  ORDER BY random() LIMIT 1
) a ON TRUE
WHERE o.id LIKE 'OFF-XL-%'
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6) VENTES (+200) — table lowercase `sales`
--    Colonnes : id, title, description, contact_id, offer_id, amount, currency,
--    taxes, discount, status, stage, priority, created_by, created_at, updated_at
-- ---------------------------------------------------------------------------
INSERT INTO sales (id, title, description, contact_id, offer_id, amount, currency,
                   taxes, discount, status, stage, priority,
                   created_by, created_at, updated_at)
SELECT
  'SAL-XL-'||lpad(g::text,5,'0'),
  o.title,
  'Vente XL '||g||' — '||COALESCE(o.description,''),
  o.contact_id, o.id,
  o.amount, 'TND', o.taxes, o.discount,
  (ARRAY['confirmed','in_progress','completed','cancelled'])[1+((g*3)%4)],
  'closed',
  (ARRAY['low','medium','high'])[1+(g%3)],
  'seed',
  o.created_at + '7 days'::interval,
  NOW() - ((g%14)::text||' days')::interval
FROM generate_series(1,200) g
JOIN LATERAL (
  SELECT id, contact_id, amount, taxes, discount, title, description, created_at
  FROM offers
  WHERE id LIKE 'OFF-XL-%' AND status IN ('accepted','sent')
  OFFSET ((g*17) % 200) LIMIT 1
) o ON TRUE
ON CONFLICT (id) DO NOTHING;

-- Lignes de ventes (clonées depuis les offres)
INSERT INTO sale_items (id, sale_id, type, article_id, item_name, item_code,
                        description, quantity, unit_price, discount)
SELECT 'SI-'||s.id||'-'||substring(oi.id from '-(\d+)$'),
       s.id, oi.type, oi.article_id, oi.item_name, oi.item_code,
       oi.description, oi.quantity, oi.unit_price, oi.discount
FROM sales s
JOIN offer_items oi ON oi.offer_id = s.offer_id
WHERE s.id LIKE 'SAL-XL-%'
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7) SERVICE ORDERS (+250) — table "ServiceOrders"
--    Colonnes : OrderNumber, ContactId, OrderDate, ServiceType, Priority, Status,
--    ScheduledDate, TotalAmount, Notes, CreatedDate, CreatedBy, SaleId,
--    Description, StartDate, TargetCompletionDate, EstimatedDuration,
--    EstimatedCost, Tax, CompletionPercentage
-- ---------------------------------------------------------------------------
INSERT INTO "ServiceOrders" ("OrderNumber","ContactId","OrderDate","ServiceType","Priority","Status",
                             "ScheduledDate","TotalAmount","Notes","CreatedDate","CreatedBy",
                             "SaleId","Description","StartDate","TargetCompletionDate",
                             "EstimatedDuration","EstimatedCost","Tax","CompletionPercentage")
SELECT 'SO-XL-'||lpad(g::text,5,'0'),
       c."Id",
       NOW() - ((g%30)::text||' days')::interval,
       CASE WHEN (g%5)=0 THEN 'Installation Tertiaire' ELSE 'Installation Résidentielle' END,
       (ARRAY['low','medium','high','urgent'])[1+((g*3)%4)],
       (ARRAY['pending','scheduled','in_progress','completed','cancelled'])[1+((g*5)%5)],
       NOW() + ((((g*7)%30) - 7)::text||' days')::interval,
       ((3+(g%10))*2200)::numeric(18,2),
       'Installation complète : panneaux + onduleur + raccordement + mise en service.',
       NOW(), 'seed',
       'SAL-XL-'||lpad(((g%200)+1)::text,5,'0'),
       'Installation solaire '||(3+(g%10))||'kWc clé-en-main',
       NOW() + (((g*2)%10)::text||' days')::interval,
       NOW() + (((g*2)%30 + 10)::text||' days')::interval,
       CASE WHEN (g%5)=0 THEN 1440 ELSE 720 END,
       ((3+(g%10))*1500)::numeric(18,2),
       ((3+(g%10))*2200*0.19)::numeric(18,2),
       0
FROM generate_series(1,250) g
JOIN LATERAL (
  SELECT "Id" FROM "Contacts"
  WHERE "Type" IN ('individual','company') AND "Email" LIKE 'xl.cli%@mail.tn'
  OFFSET ((g*11) % 200) LIMIT 1
) c ON TRUE
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8) SERVICE ORDER JOBS — 3 jobs par SO XL
--    Colonnes : ServiceOrderId, JobDescription, Status, EstimatedHours, Title,
--    WorkType, Priority, ScheduledDate, EstimatedDuration, EstimatedCost,
--    RequiredSkills, CompletionPercentage
-- ---------------------------------------------------------------------------
INSERT INTO "ServiceOrderJobs" ("ServiceOrderId","JobDescription","Status","EstimatedHours","Title",
                                "WorkType","Priority","ScheduledDate","EstimatedDuration",
                                "EstimatedCost","RequiredSkills","CompletionPercentage")
SELECT so."Id",
       'Étude de faisabilité, mesures, dimensionnement',
       'pending', 2.0,
       'Étude technique et repérage',
       'survey', so."Priority",
       so."ScheduledDate", 120, 300.00,
       ARRAY['Étude technique'], 0
FROM "ServiceOrders" so
WHERE so."OrderNumber" LIKE 'SO-XL-%'
UNION ALL
SELECT so."Id",
       'Installation panneaux + onduleur + câblage DC',
       'pending', 6.0,
       'Pose des panneaux et structure',
       'installation', so."Priority",
       so."ScheduledDate" + interval '1 day', 360, 1200.00,
       ARRAY['Pose panneaux PV','Travail en hauteur'], 0
FROM "ServiceOrders" so
WHERE so."OrderNumber" LIKE 'SO-XL-%'
UNION ALL
SELECT so."Id",
       'Raccordement AC, tests, mise en service STEG',
       'pending', 3.0,
       'Raccordement et mise en service',
       'commissioning', so."Priority",
       so."ScheduledDate" + interval '2 days', 180, 600.00,
       ARRAY['Raccordement réseau BT','Mise en service'], 0
FROM "ServiceOrders" so
WHERE so."OrderNumber" LIKE 'SO-XL-%'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9) DISPATCHES (~70% des jobs XL) — table "Dispatches"
--    Colonnes : DispatchNumber, ContactId, ServiceOrderId, ScheduledDate, Status,
--    Priority, Description, SiteAddress, CreatedDate, CreatedBy, JobId,
--    RequiredSkills, CompletionPercentage, IsDeleted
--    NB: pas de colonne TechnicianId — assignation via DispatchTechnicians (junction).
-- ---------------------------------------------------------------------------
INSERT INTO "Dispatches" ("DispatchNumber","ContactId","ServiceOrderId","ScheduledDate","Status",
                          "Priority","Description","SiteAddress","CreatedDate","CreatedBy",
                          "JobId","RequiredSkills","CompletionPercentage","IsDeleted")
SELECT 'DSP-XL-'||lpad((ROW_NUMBER() OVER (ORDER BY j."Id"))::text,5,'0'),
       so."ContactId", so."Id",
       j."ScheduledDate",
       CASE WHEN (j."Id" % 10) < 3 THEN 'completed'
            WHEN (j."Id" % 10) < 6 THEN 'in_progress'
            ELSE 'scheduled' END,
       COALESCE(j."Priority",'medium'),
       j."JobDescription",
       COALESCE(c."Address", 'Adresse non renseignée'),
       NOW(), 'seed',
       j."Id"::text,
       j."RequiredSkills", 0, FALSE
FROM "ServiceOrderJobs" j
JOIN "ServiceOrders"    so ON so."Id" = j."ServiceOrderId"
JOIN "Contacts"         c  ON c."Id"  = so."ContactId"
WHERE so."OrderNumber" LIKE 'SO-XL-%'
  AND (j."Id" % 10) < 7   -- ≈70% planifiés
ON CONFLICT DO NOTHING;

-- Pivot Dispatch ↔ Job
INSERT INTO "DispatchJobs" ("DispatchId","JobId")
SELECT d."Id", CAST(d."JobId" AS INT)
FROM "Dispatches" d
WHERE d."DispatchNumber" LIKE 'DSP-XL-%' AND d."JobId" ~ '^\d+$'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10) INSTALLATIONS (+180) — table "Installations"
--     Colonnes : InstallationNumber, ContactId, SiteAddress, InstallationType,
--     InstallationDate, Status, WarrantyExpiry, Notes, CreatedDate, CreatedBy,
--     Name, Model, Manufacturer, Category, Type, WarrantyFrom, SerialNumber
-- ---------------------------------------------------------------------------
INSERT INTO "Installations" ("InstallationNumber","ContactId","SiteAddress","InstallationType",
                             "InstallationDate","Status","WarrantyExpiry","Notes","CreatedDate",
                             "CreatedBy","Name","Model","Manufacturer","Category","Type",
                             "WarrantyFrom","SerialNumber")
SELECT 'INST-XL-'||lpad(g::text,5,'0'),
       c."Id",
       COALESCE(c."Address",'-'),
       CASE WHEN (g%4)=0 THEN 'Centrale toiture tertiaire' ELSE 'Installation résidentielle' END,
       NOW() - ((g*2)::text||' days')::interval,
       (ARRAY['active','maintenance','inactive'])[1+(g%3)],
       NOW() + interval '10 years',
       'Installation XL #'||g||' — '||(3+(g%15))||'kWc, '||(8+(g%30))||' panneaux. Supervision continue activée.',
       NOW(), 'seed',
       'Centrale PV '||c."Name",
       CASE (g%4) WHEN 0 THEN 'Huawei SUN2000-5KTL' WHEN 1 THEN 'Sungrow SH10RT'
                  WHEN 2 THEN 'Solis S6-EH3P10K' ELSE 'Growatt MIN 6000TL-X' END,
       CASE (g%4) WHEN 0 THEN 'Huawei' WHEN 1 THEN 'Sungrow'
                  WHEN 2 THEN 'Solis' ELSE 'Growatt' END,
       'Photovoltaïque',
       CASE WHEN (g%4)=0 THEN 'tertiaire' ELSE 'residentiel' END,
       NOW() - ((g*2)::text||' days')::interval,
       'SN-XL-'||lpad(g::text,6,'0')
FROM generate_series(1,180) g
JOIN LATERAL (
  SELECT "Id","Name","Address" FROM "Contacts"
  WHERE "Type" IN ('individual','company') AND "Email" LIKE 'xl.cli%@mail.tn'
  OFFSET ((g*19) % 200) LIMIT 1
) c ON TRUE
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 11) BONS DE COMMANDE FOURNISSEURS (+80) — table "PurchaseOrders"
--     Colonnes : TenantId, OrderNumber, Title, Description, SupplierId, SupplierName,
--     Status, OrderDate, ExpectedDelivery, Currency, SubTotal, TaxAmount, GrandTotal,
--     PaymentTerms, PaymentStatus, Notes, CreatedDate, CreatedBy, CreatedByName, IsDeleted
-- ---------------------------------------------------------------------------
INSERT INTO "PurchaseOrders" ("TenantId","OrderNumber","Title","Description","SupplierId","SupplierName",
                              "Status","OrderDate","ExpectedDelivery","Currency",
                              "SubTotal","TaxAmount","GrandTotal","PaymentTerms","PaymentStatus",
                              "Notes","CreatedDate","CreatedBy","CreatedByName","IsDeleted")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'BC-XL-'||lpad(g::text,5,'0'),
       'Réappro '||(CASE (g%5) WHEN 0 THEN 'panneaux' WHEN 1 THEN 'onduleurs'
                                WHEN 2 THEN 'batteries' WHEN 3 THEN 'structures' ELSE 'accessoires' END)||' Q'||(1+(g%4)),
       'Bon de commande XL #'||g||' — '||s."Company",
       s."Id", s."Company",
       (ARRAY['draft','sent','confirmed','received','cancelled'])[1+((g*3)%5)],
       NOW() - ((g%90)::text||' days')::interval,
       NOW() + (((g%30)+5)::text||' days')::interval,
       'TND',
       (5000 + (g*350))::numeric(18,2),
       ((5000 + (g*350))*0.19)::numeric(18,2),
       ((5000 + (g*350))*1.19)::numeric(18,2),
       'net30','pending',
       'Bon de commande généré (XL).',
       NOW(),'seed','Seed XL', FALSE
FROM generate_series(1,80) g
JOIN LATERAL (
  SELECT "Id","Company" FROM "Contacts"
  WHERE "Type" = 'supplier' AND "Email" LIKE 'xl.supplier-%@fournisseur.tn'
  OFFSET ((g*7) % 30) LIMIT 1
) s ON TRUE
ON CONFLICT DO NOTHING;

-- Lignes BC (2 par BC)
INSERT INTO "PurchaseOrderItems" ("TenantId","PurchaseOrderId","ArticleId","ArticleName","ArticleNumber",
                                  "Description","Quantity","UnitPrice","TaxRate","LineTotal","Unit","DisplayOrder")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       po."Id", a."Id", a."Name", a."ArticleNumber",
       a."Name",
       (10 + (substring(po."OrderNumber" from 7)::int % 50))::numeric(18,2),
       a."PurchasePrice", 19.00,
       ((10 + (substring(po."OrderNumber" from 7)::int % 50)) * a."PurchasePrice")::numeric(18,2),
       a."Unit", k
FROM "PurchaseOrders" po
CROSS JOIN generate_series(1,2) k
JOIN LATERAL (
  SELECT "Id","Name","ArticleNumber","PurchasePrice","Unit"
  FROM "Articles" WHERE "ArticleNumber" LIKE CASE k
        WHEN 1 THEN 'XL-PV-%' ELSE 'XL-INV-%' END
   ORDER BY random() LIMIT 1
) a ON TRUE
WHERE po."OrderNumber" LIKE 'BC-XL-%'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- VÉRIFICATIONS
-- =============================================================================
SELECT 'XL Contacts clients',  COUNT(*) FROM "Contacts" WHERE "Email" LIKE 'xl.cli%@mail.tn'
UNION ALL SELECT 'XL Contacts fournisseurs', COUNT(*) FROM "Contacts" WHERE "Email" LIKE 'xl.supplier-%@fournisseur.tn'
UNION ALL SELECT 'XL Users',   COUNT(*) FROM "Users"    WHERE "Email" LIKE '%.xl%@solarpro.tn'
UNION ALL SELECT 'XL Articles', COUNT(*) FROM "Articles" WHERE "ArticleNumber" LIKE 'XL-%'
UNION ALL SELECT 'XL Offers', COUNT(*) FROM offers           WHERE id LIKE 'OFF-XL-%'
UNION ALL SELECT 'XL Offer items', COUNT(*) FROM offer_items WHERE offer_id LIKE 'OFF-XL-%'
UNION ALL SELECT 'XL Sales',  COUNT(*) FROM sales            WHERE id LIKE 'SAL-XL-%'
UNION ALL SELECT 'XL Sale items', COUNT(*) FROM sale_items   WHERE sale_id LIKE 'SAL-XL-%'
UNION ALL SELECT 'XL Service orders', COUNT(*) FROM "ServiceOrders" WHERE "OrderNumber" LIKE 'SO-XL-%'
UNION ALL SELECT 'XL Jobs', COUNT(*) FROM "ServiceOrderJobs" j JOIN "ServiceOrders" o ON o."Id"=j."ServiceOrderId" WHERE o."OrderNumber" LIKE 'SO-XL-%'
UNION ALL SELECT 'XL Dispatches', COUNT(*) FROM "Dispatches" WHERE "DispatchNumber" LIKE 'DSP-XL-%'
UNION ALL SELECT 'XL Installations', COUNT(*) FROM "Installations" WHERE "InstallationNumber" LIKE 'INST-XL-%'
UNION ALL SELECT 'XL Purchase orders', COUNT(*) FROM "PurchaseOrders" WHERE "OrderNumber" LIKE 'BC-XL-%';

COMMIT;

-- =============================================================================
-- ROLLBACK XL — pour retirer uniquement le volume XL :
--   BEGIN;
--   DELETE FROM "DispatchJobs" WHERE "DispatchId" IN (SELECT "Id" FROM "Dispatches" WHERE "DispatchNumber" LIKE 'DSP-XL-%');
--   DELETE FROM "Dispatches"        WHERE "DispatchNumber"     LIKE 'DSP-XL-%';
--   DELETE FROM "Installations"     WHERE "InstallationNumber" LIKE 'INST-XL-%';
--   DELETE FROM "ServiceOrderJobs"  WHERE "ServiceOrderId" IN (SELECT "Id" FROM "ServiceOrders" WHERE "OrderNumber" LIKE 'SO-XL-%');
--   DELETE FROM "ServiceOrders"     WHERE "OrderNumber"       LIKE 'SO-XL-%';
--   DELETE FROM sale_items          WHERE sale_id              LIKE 'SAL-XL-%';
--   DELETE FROM sales               WHERE id                   LIKE 'SAL-XL-%';
--   DELETE FROM offer_items         WHERE offer_id             LIKE 'OFF-XL-%';
--   DELETE FROM offers              WHERE id                   LIKE 'OFF-XL-%';
--   DELETE FROM "PurchaseOrderItems" WHERE "PurchaseOrderId" IN (SELECT "Id" FROM "PurchaseOrders" WHERE "OrderNumber" LIKE 'BC-XL-%');
--   DELETE FROM "PurchaseOrders"    WHERE "OrderNumber"       LIKE 'BC-XL-%';
--   DELETE FROM "UserSkills"        WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Email" LIKE '%.xl%@solarpro.tn');
--   DELETE FROM "UserRoles"         WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Email" LIKE '%.xl%@solarpro.tn');
--   DELETE FROM "Users"             WHERE "Email"             LIKE '%.xl%@solarpro.tn';
--   DELETE FROM "Articles"          WHERE "ArticleNumber"     LIKE 'XL-%';
--   DELETE FROM "Contacts"          WHERE "Email" LIKE 'xl.cli%@mail.tn' OR "Email" LIKE 'xl.supplier-%@fournisseur.tn';
--   COMMIT;
-- =============================================================================
