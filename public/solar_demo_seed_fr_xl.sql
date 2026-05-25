-- =============================================================================
--  Flowentra — Extension VOLUME XL "Énergie Solaire" (FR)
--  À exécuter APRÈS solar_demo_seed_fr.sql
--
--  Génère massivement, via generate_series :
--    +200 contacts clients, +30 fournisseurs, +60 articles,
--    +25 users (techniciens/commerciaux), +300 offres, +200 ventes,
--    +250 service orders, +600 jobs, +500 dispatches (~150 non planifiés),
--    +180 installations, +80 bons de commande fournisseurs.
--
--  Usage :
--    psql "$DATABASE_URL" -v tenant_id=0 -f solar_demo_seed_fr_xl.sql
--
--  Idempotent par préfixes : OFF-XL-, SAL-XL-, SO-XL-, DSP-XL-, INST-XL-, BC-XL-
--  Rollback : voir bloc à la fin.
-- =============================================================================
BEGIN;

\set tenant_id 0
CREATE TEMP TABLE _xl (key text PRIMARY KEY, val text);
INSERT INTO _xl VALUES ('tenant_id', :'tenant_id');

-- ---------------------------------------------------------------------------
-- Pools réalistes
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _cities (i int PRIMARY KEY, ville text, lat numeric, lng numeric);
INSERT INTO _cities VALUES
 (1,'Tunis',36.8065,10.1815),(2,'Sfax',34.7406,10.7603),(3,'Sousse',35.8256,10.6369),
 (4,'Bizerte',37.2746,9.8739),(5,'Gabès',33.8815,10.0982),(6,'Kairouan',35.6781,10.0963),
 (7,'Gafsa',34.4250,8.7842),(8,'Monastir',35.7780,10.8262),(9,'Médenine',33.3548,10.5055),
 (10,'Nabeul',36.4513,10.7357),(11,'Ariana',36.8625,10.1956),(12,'Ben Arous',36.7533,10.2189),
 (13,'Manouba',36.8101,10.0956),(14,'Mahdia',35.5047,11.0622),(15,'Tozeur',33.9197,8.1335),
 (16,'Kébili',33.7041,8.9690),(17,'Tataouine',32.9297,10.4518),(18,'Jendouba',36.5011,8.7803),
 (19,'Béja',36.7333,9.1844),(20,'Kasserine',35.1676,8.8365),(21,'Siliana',36.0844,9.3708),
 (22,'Zaghouan',36.4028,10.1428),(23,'Sidi Bouzid',35.0381,9.4858),(24,'Le Kef',36.1742,8.7050);

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
-- 1) CONTACTS CLIENTS (+200)
-- ---------------------------------------------------------------------------
INSERT INTO "Contacts" ("TenantId","Type","FirstName","LastName","Email","PhoneNumber",
                        "Company","JobTitle","Address","City","Country","CreatedBy","IsActive","IsDeleted")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'customer',
       f.prenom,
       l.nom,
       'cli'||g||'.'||lower(f.prenom)||'.'||lower(l.nom)||'@mail.tn',
       '+216 '||(20+(g%79))::text||' '||lpad(((g*37)%900+100)::text,3,'0')||' '||lpad(((g*53)%900+100)::text,3,'0'),
       CASE WHEN g%3=0 THEN co.nom ELSE NULL END,
       CASE WHEN g%3=0 THEN initcap(co.secteur) ELSE 'Particulier' END,
       'Rue '||((g%200)+1)::text||', '||c.ville,
       c.ville, 'Tunisie', 'seed', TRUE, FALSE
FROM generate_series(1,200) g
JOIN _first   f  ON f.i  = ((g-1)%30)+1
JOIN _last    l  ON l.i  = ((g*7-1)%25)+1
JOIN _cities  c  ON c.i  = ((g*3-1)%24)+1
JOIN _company co ON co.i = ((g*11-1)%30)+1
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) CONTACTS FOURNISSEURS (+30)
-- ---------------------------------------------------------------------------
INSERT INTO "Contacts" ("TenantId","Type","FirstName","LastName","Email","PhoneNumber",
                        "Company","JobTitle","Address","City","Country","CreatedBy","IsActive","IsDeleted")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'supplier',
       'Contact',
       'Fournisseur '||g,
       'contact@fournisseur-'||g||'.tn',
       '+216 71 '||lpad(((g*41)%900+100)::text,3,'0')||' '||lpad(((g*29)%900+100)::text,3,'0'),
       (CASE (g%10)
         WHEN 0 THEN 'SolarTech '||g WHEN 1 THEN 'PV Industrie '||g
         WHEN 2 THEN 'Inverter Solutions '||g WHEN 3 THEN 'BatterieMed '||g
         WHEN 4 THEN 'Câbles Pro '||g WHEN 5 THEN 'Structures Métal '||g
         WHEN 6 THEN 'EcoVolt '||g WHEN 7 THEN 'Voltika '||g
         WHEN 8 THEN 'SunMaghreb '||g ELSE 'EnergieFlux '||g END),
       'Responsable commercial',
       'ZI '||c.ville||' Lot '||g, c.ville, 'Tunisie', 'seed', TRUE, FALSE
FROM generate_series(1,30) g
JOIN _cities c ON c.i = ((g-1)%24)+1
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) ARTICLES (+60) — variantes de panneaux/onduleurs/batteries/accessoires
-- ---------------------------------------------------------------------------
INSERT INTO "Articles" ("TenantId","ArticleNumber","Name","Description","Category","Unit",
                        "PurchasePrice","SalePrice","TaxRate","StockQuantity","MinStockLevel",
                        "IsActive","IsDeleted","CreatedBy")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'XL-PV-'||(400+g*5)||'-'||g,
       'Panneau PV '||(400+g*5)||'W Mono '||g,
       'Panneau photovoltaïque monocristallin '||(400+g*5)||'W, série XL-'||g,
       'Panneaux solaires', 'unité',
       (180+g*1.2)::numeric(10,2), (240+g*1.5)::numeric(10,2), 19.00,
       (200-g)::int, 10, TRUE, FALSE, 'seed'
FROM generate_series(1,20) g
ON CONFLICT DO NOTHING;

INSERT INTO "Articles" ("TenantId","ArticleNumber","Name","Description","Category","Unit",
                        "PurchasePrice","SalePrice","TaxRate","StockQuantity","MinStockLevel",
                        "IsActive","IsDeleted","CreatedBy")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'XL-INV-'||(3+g)||'K-'||g,
       'Onduleur '||(3+g)||'kW Hybride XL-'||g,
       'Onduleur hybride '||(3+g)||'kW, MPPT double, monitoring Wi-Fi',
       'Onduleurs', 'unité',
       (650+g*45)::numeric(10,2), (950+g*60)::numeric(10,2), 19.00,
       (40-g)::int, 5, TRUE, FALSE, 'seed'
FROM generate_series(1,15) g
ON CONFLICT DO NOTHING;

INSERT INTO "Articles" ("TenantId","ArticleNumber","Name","Description","Category","Unit",
                        "PurchasePrice","SalePrice","TaxRate","StockQuantity","MinStockLevel",
                        "IsActive","IsDeleted","CreatedBy")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'XL-BAT-'||(5+g*2)||'K-'||g,
       'Batterie LFP '||(5+g*2)||'kWh XL-'||g,
       'Batterie lithium fer phosphate '||(5+g*2)||'kWh, 6000 cycles',
       'Batteries', 'unité',
       (1800+g*120)::numeric(10,2), (2600+g*180)::numeric(10,2), 19.00,
       (25-g)::int, 3, TRUE, FALSE, 'seed'
FROM generate_series(1,10) g
ON CONFLICT DO NOTHING;

INSERT INTO "Articles" ("TenantId","ArticleNumber","Name","Description","Category","Unit",
                        "PurchasePrice","SalePrice","TaxRate","StockQuantity","MinStockLevel",
                        "IsActive","IsDeleted","CreatedBy")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'XL-ACC-'||g,
       (CASE (g%5) WHEN 0 THEN 'Connecteur MC4 Pro ' WHEN 1 THEN 'Câble solaire DC 6mm² '
                   WHEN 2 THEN 'Coffret protection DC ' WHEN 3 THEN 'Rail de fixation alu '
                   ELSE 'Optimiseur de puissance ' END)||g,
       'Accessoire installation solaire — référence XL-'||g,
       'Accessoires', 'unité',
       (8+g*0.5)::numeric(10,2), (15+g*0.9)::numeric(10,2), 19.00,
       (500-g*2)::int, 50, TRUE, FALSE, 'seed'
FROM generate_series(1,15) g
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) USERS (+25 — techniciens, commerciaux)
-- ---------------------------------------------------------------------------
INSERT INTO "Users" ("TenantId","Username","Email","PasswordHash","FirstName","LastName",
                     "PhoneNumber","IsActive","IsDeleted","CreatedBy","EmailConfirmed")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'tech.xl'||g,
       'tech.xl'||g||'@solarpro.tn',
       '$2a$11$wHc8Q9rL5xH3yK8mJ4nW7eVbN2aP6sT1uX0yZ9cD3fG8hI4jK5lM6',
       f.prenom, l.nom||g::text,
       '+216 9'||(g%10)::text||' '||lpad(((g*37)%900+100)::text,3,'0')||' '||lpad(((g*53)%900+100)::text,3,'0'),
       TRUE, FALSE, 'seed', TRUE
FROM generate_series(1,20) g
JOIN _first f ON f.i = ((g-1)%30)+1
JOIN _last  l ON l.i = ((g*3-1)%25)+1
ON CONFLICT DO NOTHING;

INSERT INTO "Users" ("TenantId","Username","Email","PasswordHash","FirstName","LastName",
                     "PhoneNumber","IsActive","IsDeleted","CreatedBy","EmailConfirmed")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'com.xl'||g,
       'com.xl'||g||'@solarpro.tn',
       '$2a$11$wHc8Q9rL5xH3yK8mJ4nW7eVbN2aP6sT1uX0yZ9cD3fG8hI4jK5lM6',
       f.prenom, l.nom||g::text,
       '+216 5'||(g%10)::text||' '||lpad(((g*41)%900+100)::text,3,'0')||' '||lpad(((g*29)%900+100)::text,3,'0'),
       TRUE, FALSE, 'seed', TRUE
FROM generate_series(1,5) g
JOIN _first f ON f.i = ((g*5-1)%30)+1
JOIN _last  l ON l.i = ((g*7-1)%25)+1
ON CONFLICT DO NOTHING;

-- Attribution des rôles aux nouveaux users
INSERT INTO "UserRoles" ("UserId","RoleId","AssignedBy","IsActive")
SELECT u."Id", r."Id", 'seed', TRUE
FROM "Users" u
JOIN "Roles" r ON r."Name" = CASE WHEN u."Username" LIKE 'tech.xl%' THEN 'Technicien Solaire' ELSE 'Commercial' END
WHERE u."CreatedBy"='seed' AND (u."Username" LIKE 'tech.xl%' OR u."Username" LIKE 'com.xl%')
ON CONFLICT DO NOTHING;

-- Compétences pour les nouveaux techniciens (rotation sur skills existantes)
INSERT INTO "UserSkills" ("UserId","SkillId","Level","AssignedBy")
SELECT u."Id", s."Id",
       (CASE (row_number() OVER (PARTITION BY u."Id" ORDER BY s."Id")) % 3
          WHEN 0 THEN 'expert' WHEN 1 THEN 'avancé' ELSE 'intermédiaire' END),
       'seed'
FROM "Users" u
CROSS JOIN LATERAL (
  SELECT "Id" FROM "Skills" WHERE "CreatedUser"='seed' ORDER BY random() LIMIT 3
) s
WHERE u."Username" LIKE 'tech.xl%'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5) OFFRES (+300)
-- ---------------------------------------------------------------------------
-- On suppose une table 'offers' (lowercase) déjà utilisée par le seed v1.
INSERT INTO offers (id, tenant_id, offer_number, title, customer_id, customer_name,
                    status, subtotal, tax_amount, discount_amount, total_amount,
                    valid_until, notes, created_by, created_at, updated_at)
SELECT
  'OFF-XL-'||lpad(g::text,5,'0'),
  (SELECT val::int FROM _xl WHERE key='tenant_id'),
  'OFF-XL-'||lpad(g::text,5,'0'),
  'Offre installation solaire '||(3+(g%12))||'kWc — '||c."FirstName"||' '||c."LastName",
  c."Id"::text,
  COALESCE(c."Company", c."FirstName"||' '||c."LastName"),
  (ARRAY['draft','sent','accepted','rejected','expired'])[1+((g*7)%5)],
  ((3+(g%12))*1850)::numeric(12,2),
  ((3+(g%12))*1850*0.19)::numeric(12,2),
  CASE WHEN g%5=0 THEN ((3+(g%12))*1850*0.05)::numeric(12,2) ELSE 0 END,
  ((3+(g%12))*1850*1.19 - CASE WHEN g%5=0 THEN ((3+(g%12))*1850*0.05) ELSE 0 END)::numeric(12,2),
  NOW() + ((30 + (g%30))::text||' days')::interval,
  'Offre générée automatiquement — kit '||(3+(g%12))||'kWc clé-en-main',
  'seed',
  NOW() - ((g%180)::text||' days')::interval,
  NOW() - ((g%30)::text||' days')::interval
FROM generate_series(1,300) g
JOIN LATERAL (
  SELECT "Id","FirstName","LastName","Company" FROM "Contacts"
  WHERE "Type"='customer' AND "CreatedBy"='seed'
  OFFSET ((g*13) % 200) LIMIT 1
) c ON TRUE
ON CONFLICT (id) DO NOTHING;

-- Lignes d'offres (3 lignes par offre en moyenne)
INSERT INTO offer_items (id, offer_id, article_id, article_name, article_number,
                         description, quantity, unit_price, tax_rate, line_total, display_order)
SELECT 'OI-'||o.id||'-'||k,
       o.id,
       a."Id"::text, a."Name", a."ArticleNumber",
       a."Name",
       (CASE k WHEN 1 THEN (3+(substring(o.id from 8)::int % 12))*2  -- panneaux
              WHEN 2 THEN 1                                          -- onduleur
              ELSE 2 END),
       a."SalePrice", 19.00,
       (CASE k WHEN 1 THEN (3+(substring(o.id from 8)::int % 12))*2
              WHEN 2 THEN 1 ELSE 2 END) * a."SalePrice",
       k
FROM offers o
CROSS JOIN generate_series(1,3) k
JOIN LATERAL (
  SELECT "Id","Name","ArticleNumber","SalePrice" FROM "Articles"
  WHERE "CreatedBy"='seed' AND "Category" = CASE k
       WHEN 1 THEN 'Panneaux solaires' WHEN 2 THEN 'Onduleurs' ELSE 'Accessoires' END
  ORDER BY random() LIMIT 1
) a ON TRUE
WHERE o.id LIKE 'OFF-XL-%'
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6) VENTES (+200) — issues des offres acceptées
-- ---------------------------------------------------------------------------
INSERT INTO sales (id, tenant_id, sale_number, offer_id, customer_id, customer_name,
                   status, subtotal, tax_amount, discount_amount, total_amount,
                   payment_status, notes, created_by, created_at, updated_at)
SELECT
  'SAL-XL-'||lpad(g::text,5,'0'),
  (SELECT val::int FROM _xl WHERE key='tenant_id'),
  'SAL-XL-'||lpad(g::text,5,'0'),
  o.id, o.customer_id, o.customer_name,
  (ARRAY['confirmed','in_progress','completed','cancelled'])[1+((g*3)%4)],
  o.subtotal, o.tax_amount, o.discount_amount, o.total_amount,
  (ARRAY['unpaid','partial','paid'])[1+(g%3)],
  'Vente XL '||g||' — installation '||c."City",
  'seed',
  o.created_at + '7 days'::interval,
  NOW() - ((g%14)::text||' days')::interval
FROM generate_series(1,200) g
JOIN LATERAL (
  SELECT id, customer_id, customer_name, subtotal, tax_amount, discount_amount, total_amount, created_at
  FROM offers WHERE id LIKE 'OFF-XL-%' AND status IN ('accepted','sent')
  OFFSET ((g*17) % 200) LIMIT 1
) o ON TRUE
JOIN "Contacts" c ON c."Id"::text = o.customer_id
ON CONFLICT (id) DO NOTHING;

INSERT INTO sale_items (id, sale_id, article_id, article_name, article_number,
                        description, quantity, unit_price, tax_rate, line_total, display_order)
SELECT 'SI-'||s.id||'-'||oi.display_order,
       s.id, oi.article_id, oi.article_name, oi.article_number,
       oi.description, oi.quantity, oi.unit_price, oi.tax_rate, oi.line_total, oi.display_order
FROM sales s
JOIN offer_items oi ON oi.offer_id = s.offer_id
WHERE s.id LIKE 'SAL-XL-%'
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7) SERVICE ORDERS (+250) + JOBS (+600)
-- ---------------------------------------------------------------------------
INSERT INTO "ServiceOrders" ("TenantId","OrderNumber","Title","Description","CustomerId","CustomerName",
                             "Status","Priority","SaleId","Address","City","Country",
                             "ScheduledDate","CreatedBy","IsActive","IsDeleted")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'SO-XL-'||lpad(g::text,5,'0'),
       'Installation solaire '||(3+(g%10))||'kWc — '||c."City",
       'Installation complète : panneaux + onduleur + raccordement + mise en service. Client : '||c."FirstName"||' '||c."LastName",
       c."Id"::text,
       COALESCE(c."Company", c."FirstName"||' '||c."LastName"),
       (ARRAY['pending','scheduled','in_progress','completed','cancelled'])[1+((g*5)%5)],
       (ARRAY['low','normal','high','urgent'])[1+((g*3)%4)],
       NULLIF('SAL-XL-'||lpad(((g%200)+1)::text,5,'0'),''),
       'Rue '||((g%200)+1)||', '||c."City",
       c."City", 'Tunisie',
       NOW() + ((((g*7)%30) - 7)::text||' days')::interval,
       'seed', TRUE, FALSE
FROM generate_series(1,250) g
JOIN LATERAL (
  SELECT "Id","FirstName","LastName","Company","City" FROM "Contacts"
  WHERE "Type"='customer' AND "CreatedBy"='seed'
  OFFSET ((g*11) % 200) LIMIT 1
) c ON TRUE
ON CONFLICT DO NOTHING;

-- 2 à 3 jobs par service order
INSERT INTO "ServiceOrderJobs" ("TenantId","ServiceOrderId","JobNumber","Title","Description","Status","Priority",
                                "EstimatedDuration","RequiredSkills","Address","City",
                                "ScheduledStart","ScheduledEnd","CreatedBy","IsActive","IsDeleted")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       so."Id",
       so."OrderNumber"||'-J'||k,
       (CASE k WHEN 1 THEN 'Étude technique et repérage'
               WHEN 2 THEN 'Pose des panneaux et structure'
               ELSE 'Raccordement et mise en service' END),
       (CASE k WHEN 1 THEN 'Étude de faisabilité, mesures, dimensionnement'
               WHEN 2 THEN 'Installation panneaux + onduleur + câblage DC'
               ELSE 'Raccordement AC, tests, mise en service STEG' END),
       (ARRAY['pending','scheduled','assigned','in_progress','completed'])[1+((substring(so."OrderNumber" from 7)::int + k)%5)],
       'normal',
       (CASE k WHEN 1 THEN 120 WHEN 2 THEN 360 ELSE 180 END),
       (CASE k WHEN 1 THEN ARRAY['Étude technique']
               WHEN 2 THEN ARRAY['Pose panneaux','Structure toiture']
               ELSE ARRAY['Raccordement électrique','Mise en service'] END),
       so."Address", so."City",
       so."ScheduledDate" + ((k-1)::text||' days')::interval + '08:00:00'::interval,
       so."ScheduledDate" + ((k-1)::text||' days')::interval + (CASE k WHEN 1 THEN '10:00:00' WHEN 2 THEN '16:00:00' ELSE '12:00:00' END)::interval,
       'seed', TRUE, FALSE
FROM "ServiceOrders" so
CROSS JOIN generate_series(1,3) k
WHERE so."OrderNumber" LIKE 'SO-XL-%'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8) DISPATCHES (+500) — ~70% planifiés sur 7 prochains jours, ~30% non planifiés
-- ---------------------------------------------------------------------------
WITH techs AS (
  SELECT u."Id", row_number() OVER (ORDER BY u."Id") AS rn, COUNT(*) OVER () AS total
  FROM "Users" u
  JOIN "UserRoles" ur ON ur."UserId" = u."Id"
  JOIN "Roles" r ON r."Id" = ur."RoleId" AND r."Name" IN ('Technicien Solaire','Électricien','Chef de chantier')
  WHERE u."CreatedBy"='seed'
),
jobs_pool AS (
  SELECT j."Id", j."ServiceOrderId", j."Title", j."EstimatedDuration", j."Address", j."City",
         row_number() OVER (ORDER BY j."Id") AS rn
  FROM "ServiceOrderJobs" j
  WHERE j."CreatedBy"='seed'
  LIMIT 500
)
INSERT INTO "Dispatches" ("TenantId","DispatchNumber","JobId","ServiceOrderId","TechnicianId",
                          "ScheduledStart","ScheduledEnd","Status","Notes","Address","City",
                          "CreatedBy","IsActive","IsDeleted")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'DSP-XL-'||lpad(jp.rn::text,5,'0'),
       jp."Id", jp."ServiceOrderId",
       CASE WHEN jp.rn % 10 < 7 THEN t."Id" ELSE NULL END,  -- 30% non planifiés
       CASE WHEN jp.rn % 10 < 7
            THEN NOW()::date + ((jp.rn % 7)::text||' days')::interval
                              + ((8 + (jp.rn % 6))::text||' hours')::interval
            ELSE NULL END,
       CASE WHEN jp.rn % 10 < 7
            THEN NOW()::date + ((jp.rn % 7)::text||' days')::interval
                              + ((8 + (jp.rn % 6))::text||' hours')::interval
                              + (jp."EstimatedDuration"||' minutes')::interval
            ELSE NULL END,
       CASE WHEN jp.rn % 10 < 7
            THEN (ARRAY['scheduled','assigned','in_progress','completed'])[1+(jp.rn%4)]
            ELSE 'unassigned' END,
       'Dispatch généré XL #'||jp.rn,
       jp."Address", jp."City",
       'seed', TRUE, FALSE
FROM jobs_pool jp
LEFT JOIN techs t ON t.rn = ((jp.rn-1) % (SELECT MAX(total) FROM techs)) + 1
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9) INSTALLATIONS (+180)
-- ---------------------------------------------------------------------------
INSERT INTO "Installations" ("TenantId","InstallationNumber","CustomerId","CustomerName",
                             "Address","City","Country","SystemPower","PanelCount",
                             "InverterModel","BatteryCapacity","CommissioningDate","Status",
                             "Notes","CreatedBy","IsActive","IsDeleted")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'INST-XL-'||lpad(g::text,5,'0'),
       c."Id"::text,
       COALESCE(c."Company", c."FirstName"||' '||c."LastName"),
       'Rue '||((g%200)+1)||', '||c."City",
       c."City", 'Tunisie',
       (3 + (g%15))::numeric(6,2),
       (8 + (g%30)),
       CASE (g%4) WHEN 0 THEN 'Huawei SUN2000-5KTL' WHEN 1 THEN 'Sungrow SH10RT'
                  WHEN 2 THEN 'Solis S6-EH3P10K' ELSE 'Growatt MIN 6000TL-X' END,
       CASE WHEN g%3=0 THEN (5 + (g%15))::numeric(6,2) ELSE 0 END,
       NOW() - ((g*2)::text||' days')::interval,
       (ARRAY['active','maintenance','inactive'])[1+(g%3)],
       'Installation XL #'||g||' — supervision continue activée',
       'seed', TRUE, FALSE
FROM generate_series(1,180) g
JOIN LATERAL (
  SELECT "Id","FirstName","LastName","Company","City" FROM "Contacts"
  WHERE "Type"='customer' AND "CreatedBy"='seed'
  OFFSET ((g*19) % 200) LIMIT 1
) c ON TRUE
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10) BONS DE COMMANDE FOURNISSEURS (+80)
-- ---------------------------------------------------------------------------
INSERT INTO "PurchaseOrders" ("TenantId","OrderNumber","SupplierId","SupplierName","Title","Description",
                              "Status","Subtotal","TaxAmount","GrandTotal","OrderDate",
                              "ExpectedDelivery","CreatedBy","IsActive","IsDeleted")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       'BC-XL-'||lpad(g::text,5,'0'),
       s."Id"::text, s."Company",
       'Réappro '||(CASE (g%5) WHEN 0 THEN 'panneaux' WHEN 1 THEN 'onduleurs'
                                WHEN 2 THEN 'batteries' WHEN 3 THEN 'structures' ELSE 'accessoires' END)||' Q'||(1+(g%4)),
       'Bon de commande XL #'||g||' — '||s."Company",
       (ARRAY['draft','sent','confirmed','received','cancelled'])[1+((g*3)%5)],
       (5000 + (g*350))::numeric(12,2),
       ((5000 + (g*350))*0.19)::numeric(12,2),
       ((5000 + (g*350))*1.19)::numeric(12,2),
       NOW() - ((g%90)::text||' days')::interval,
       NOW() + (((g%30)+5)::text||' days')::interval,
       'seed', TRUE, FALSE
FROM generate_series(1,80) g
JOIN LATERAL (
  SELECT "Id","Company" FROM "Contacts"
  WHERE "Type"='supplier' AND "CreatedBy"='seed'
  OFFSET ((g*7) % 30) LIMIT 1
) s ON TRUE
ON CONFLICT DO NOTHING;

-- Lignes BC (2 par BC)
INSERT INTO "PurchaseOrderItems" ("TenantId","PurchaseOrderId","ArticleId","ArticleName","ArticleNumber",
                                  "Description","Quantity","UnitPrice","TaxRate","LineTotal","Unit","DisplayOrder")
SELECT (SELECT val::int FROM _xl WHERE key='tenant_id'),
       po."Id", a."Id", a."Name", a."ArticleNumber", a."Name",
       (10 + (substring(po."OrderNumber" from 7)::int % 50)),
       a."PurchasePrice", 19.00,
       (10 + (substring(po."OrderNumber" from 7)::int % 50)) * a."PurchasePrice",
       a."Unit", k
FROM "PurchaseOrders" po
CROSS JOIN generate_series(1,2) k
JOIN LATERAL (
  SELECT "Id","Name","ArticleNumber","PurchasePrice","Unit"
  FROM "Articles" WHERE "CreatedBy"='seed' ORDER BY random() LIMIT 1
) a ON TRUE
WHERE po."OrderNumber" LIKE 'BC-XL-%'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- VÉRIFICATIONS
-- =============================================================================
SELECT 'XL Contacts',        COUNT(*) FROM "Contacts"        WHERE "CreatedBy"='seed'
UNION ALL SELECT 'XL Users', COUNT(*) FROM "Users"           WHERE "Username" LIKE '%.xl%'
UNION ALL SELECT 'XL Articles', COUNT(*) FROM "Articles"     WHERE "ArticleNumber" LIKE 'XL-%'
UNION ALL SELECT 'XL Offers', COUNT(*) FROM offers           WHERE id LIKE 'OFF-XL-%'
UNION ALL SELECT 'XL Offer items', COUNT(*) FROM offer_items WHERE offer_id LIKE 'OFF-XL-%'
UNION ALL SELECT 'XL Sales',  COUNT(*) FROM sales            WHERE id LIKE 'SAL-XL-%'
UNION ALL SELECT 'XL Sale items', COUNT(*) FROM sale_items   WHERE sale_id LIKE 'SAL-XL-%'
UNION ALL SELECT 'XL Service orders', COUNT(*) FROM "ServiceOrders" WHERE "OrderNumber" LIKE 'SO-XL-%'
UNION ALL SELECT 'XL Jobs', COUNT(*) FROM "ServiceOrderJobs" so JOIN "ServiceOrders" o ON o."Id"=so."ServiceOrderId" WHERE o."OrderNumber" LIKE 'SO-XL-%'
UNION ALL SELECT 'XL Dispatches', COUNT(*) FROM "Dispatches" WHERE "DispatchNumber" LIKE 'DSP-XL-%'
UNION ALL SELECT 'XL Dispatches non planifiés', COUNT(*) FROM "Dispatches" WHERE "DispatchNumber" LIKE 'DSP-XL-%' AND "TechnicianId" IS NULL
UNION ALL SELECT 'XL Installations', COUNT(*) FROM "Installations" WHERE "InstallationNumber" LIKE 'INST-XL-%'
UNION ALL SELECT 'XL Purchase orders', COUNT(*) FROM "PurchaseOrders" WHERE "OrderNumber" LIKE 'BC-XL-%';

COMMIT;

-- =============================================================================
-- ROLLBACK XL — pour retirer uniquement le volume XL :
--   BEGIN;
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
--   DELETE FROM "UserSkills"        WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Username" LIKE '%.xl%');
--   DELETE FROM "UserRoles"         WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Username" LIKE '%.xl%');
--   DELETE FROM "Users"             WHERE "Username"          LIKE '%.xl%';
--   DELETE FROM "Articles"          WHERE "ArticleNumber"     LIKE 'XL-%';
--   -- contacts XL : préfixés via Email pour identification
--   DELETE FROM "Contacts"          WHERE "Email" LIKE 'cli%@mail.tn' OR "Email" LIKE 'contact@fournisseur-%';
--   COMMIT;
-- =============================================================================
