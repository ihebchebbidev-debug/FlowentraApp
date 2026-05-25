-- =============================================================================
--  Flowentra — Jeu de données de démonstration "Énergie Solaire" (FR)
--  Solar Pro SARL — installateur de centrales photovoltaïques en Tunisie
-- =============================================================================
--  Cible : schéma PascalCase (production EF Core) — Tables :
--    Contacts, Users, Roles, UserRoles, Skills, UserSkills,
--    Articles, Installations, Offers/OfferItems, Sales/SaleItems,
--    ServiceOrders, ServiceOrderJobs, Dispatches, DispatchJobs,
--    PurchaseOrders, PurchaseOrderItems
--
--  Mode d'emploi :
--    1) Choisir le TenantId cible ligne suivante  (0 = société par défaut)
--    2) psql "$DATABASE_URL" -f solar_demo_seed_fr.sql
--    3) Le script est idempotent par lot (ON CONFLICT) sur les numéros métier
--       et borné dans une transaction.
--
--  Volume :  ~25 contacts/clients, 6 fournisseurs, 12 utilisateurs (techs +
--            commerciaux + dispatcher + admin), 40+ articles solaires,
--            20 offres, 15 ventes, 18 service orders, 35 jobs, 30 dispatches
--            (planifiés + non planifiés), 12 bons de commande fournisseur,
--            20 installations.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0) PARAMÈTRES — éditer ici uniquement
-- ---------------------------------------------------------------------------
\set tenant_id 0

-- Variables temporaires (psql \set ne fonctionne pas dans les triggers EF —
-- on utilise donc une CTE de session via une table temporaire de mapping).
CREATE TEMP TABLE _seed_cfg (key text PRIMARY KEY, val text);
INSERT INTO _seed_cfg VALUES
  ('tenant_id', :'tenant_id'),
  ('created_by', 'seed.fr@solarpro.tn'),
  ('today',  to_char(NOW(),       'YYYY-MM-DD')),
  ('tomorrow', to_char(NOW()+'1 day'::interval,'YYYY-MM-DD'));

-- =============================================================================
-- 1) RÔLES & COMPÉTENCES
-- =============================================================================
INSERT INTO "Roles" ("Name","Description","CreatedUser","IsActive","IsDeleted")
VALUES
  ('Administrateur',     'Accès total à la plateforme',                'seed', TRUE, FALSE),
  ('Commercial',         'Gestion des offres et ventes',               'seed', TRUE, FALSE),
  ('Dispatcher',         'Planification des interventions',            'seed', TRUE, FALSE),
  ('Technicien Solaire', 'Installation et maintenance photovoltaïque', 'seed', TRUE, FALSE),
  ('Électricien',        'Raccordements électriques BT/HT',            'seed', TRUE, FALSE),
  ('Chef de chantier',   'Supervision des installations sur site',     'seed', TRUE, FALSE),
  ('Magasinier',         'Gestion du stock et des sorties matériel',   'seed', TRUE, FALSE),
  ('Bureau d''études',   'Dimensionnement et études techniques',       'seed', TRUE, FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO "Skills" ("Name","Description","Category","Level","CreatedUser","IsActive","IsDeleted")
VALUES
  ('Pose panneaux PV',           'Installation panneaux photovoltaïques',     'Solaire',      'Avancé',  'seed', TRUE, FALSE),
  ('Câblage DC',                 'Câblage chaînes DC string',                 'Solaire',      'Avancé',  'seed', TRUE, FALSE),
  ('Onduleur string',            'Installation et configuration onduleurs',   'Solaire',      'Expert',  'seed', TRUE, FALSE),
  ('Micro-onduleurs',            'Pose micro-onduleurs Enphase/APsystems',    'Solaire',      'Avancé',  'seed', TRUE, FALSE),
  ('Batterie lithium',           'Installation batteries résidentielles',     'Stockage',     'Avancé',  'seed', TRUE, FALSE),
  ('Borne de recharge VE',       'Pose Wallbox / borne IRVE',                 'Mobilité',     'Avancé',  'seed', TRUE, FALSE),
  ('Raccordement réseau BT',     'Raccordement STEG basse tension',           'Électricité',  'Expert',  'seed', TRUE, FALSE),
  ('Mise en service',            'MES + contrôle production',                 'Maintenance',  'Expert',  'seed', TRUE, FALSE),
  ('Monitoring & supervision',   'Configuration plateformes (SolarEdge, …)',  'Numérique',    'Avancé',  'seed', TRUE, FALSE),
  ('Maintenance corrective',     'Diagnostic et dépannage installation',      'Maintenance',  'Avancé',  'seed', TRUE, FALSE),
  ('Maintenance préventive',     'Nettoyage modules, contrôles annuels',      'Maintenance',  'Standard','seed', TRUE, FALSE),
  ('Habilitation BR/BC',         'Habilitation électrique basse tension',     'Sécurité',     'Expert',  'seed', TRUE, FALSE),
  ('Travail en hauteur',         'Habilitation toiture et nacelle',           'Sécurité',     'Avancé',  'seed', TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 2) UTILISATEURS (techniciens + commerciaux + dispatcher + admin)
--    Mot de passe par défaut (hash bcrypt de "Solar2026!") :
--    $2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- =============================================================================
INSERT INTO "Users" ("FirstName","LastName","Email","Phone","PasswordHash",
                     "IsActive","IsDeleted","CreatedDate","CreatedBy")
VALUES
  ('Sami',      'Ben Salah',      'sami.bensalah@solarpro.tn',     '+216 22 111 001', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed'),
  ('Leïla',     'Trabelsi',       'leila.trabelsi@solarpro.tn',    '+216 22 111 002', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed'),
  ('Karim',     'Mansouri',       'karim.mansouri@solarpro.tn',    '+216 22 111 003', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed'),
  ('Nadia',     'Gharbi',         'nadia.gharbi@solarpro.tn',      '+216 22 111 004', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed'),
  ('Mohamed',   'Hamdi',          'mohamed.hamdi@solarpro.tn',     '+216 22 111 005', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed'),
  ('Yassine',   'Khelifi',        'yassine.khelifi@solarpro.tn',   '+216 22 111 006', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed'),
  ('Houda',     'Bouzid',         'houda.bouzid@solarpro.tn',      '+216 22 111 007', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed'),
  ('Ali',       'Jebali',         'ali.jebali@solarpro.tn',        '+216 22 111 008', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed'),
  ('Imen',      'Ferjani',        'imen.ferjani@solarpro.tn',      '+216 22 111 009', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed'),
  ('Walid',     'Riahi',          'walid.riahi@solarpro.tn',       '+216 22 111 010', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed'),
  ('Rania',     'Slimani',        'rania.slimani@solarpro.tn',     '+216 22 111 011', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed'),
  ('Tarek',     'Chaabani',       'tarek.chaabani@solarpro.tn',    '+216 22 111 012', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, FALSE, NOW(), 'seed')
ON CONFLICT ("Email") DO NOTHING;

-- Lien Users ↔ Roles (mapping métier)
INSERT INTO "UserRoles" ("UserId","RoleId","AssignedBy","IsActive")
SELECT u."Id", r."Id", 'seed', TRUE
FROM (VALUES
  ('sami.bensalah@solarpro.tn',     'Administrateur'),
  ('leila.trabelsi@solarpro.tn',    'Commercial'),
  ('leila.trabelsi@solarpro.tn',    'Bureau d''études'),
  ('karim.mansouri@solarpro.tn',    'Commercial'),
  ('nadia.gharbi@solarpro.tn',      'Dispatcher'),
  ('mohamed.hamdi@solarpro.tn',     'Chef de chantier'),
  ('mohamed.hamdi@solarpro.tn',     'Technicien Solaire'),
  ('yassine.khelifi@solarpro.tn',   'Technicien Solaire'),
  ('houda.bouzid@solarpro.tn',      'Technicien Solaire'),
  ('ali.jebali@solarpro.tn',        'Électricien'),
  ('imen.ferjani@solarpro.tn',      'Technicien Solaire'),
  ('walid.riahi@solarpro.tn',       'Magasinier'),
  ('rania.slimani@solarpro.tn',     'Bureau d''études'),
  ('tarek.chaabani@solarpro.tn',    'Électricien')
) m(email,role)
JOIN "Users" u ON u."Email" = m.email
JOIN "Roles" r ON r."Name"  = m.role
ON CONFLICT DO NOTHING;

-- Compétences par technicien (réaliste : pas tous experts en tout)
INSERT INTO "UserSkills" ("UserId","SkillId","ProficiencyLevel","YearsOfExperience","AssignedBy","IsActive")
SELECT u."Id", s."Id", m.lvl, m.yrs, 'seed', TRUE
FROM (VALUES
  ('mohamed.hamdi@solarpro.tn',   'Pose panneaux PV',         'Expert', 8),
  ('mohamed.hamdi@solarpro.tn',   'Câblage DC',               'Expert', 8),
  ('mohamed.hamdi@solarpro.tn',   'Onduleur string',          'Expert', 7),
  ('mohamed.hamdi@solarpro.tn',   'Travail en hauteur',       'Expert', 8),
  ('yassine.khelifi@solarpro.tn', 'Pose panneaux PV',         'Avancé', 4),
  ('yassine.khelifi@solarpro.tn', 'Micro-onduleurs',          'Avancé', 3),
  ('yassine.khelifi@solarpro.tn', 'Travail en hauteur',       'Avancé', 4),
  ('houda.bouzid@solarpro.tn',    'Pose panneaux PV',         'Avancé', 3),
  ('houda.bouzid@solarpro.tn',    'Maintenance préventive',   'Avancé', 3),
  ('houda.bouzid@solarpro.tn',    'Monitoring & supervision', 'Avancé', 2),
  ('ali.jebali@solarpro.tn',      'Raccordement réseau BT',   'Expert', 10),
  ('ali.jebali@solarpro.tn',      'Habilitation BR/BC',       'Expert', 10),
  ('ali.jebali@solarpro.tn',      'Mise en service',          'Expert', 9),
  ('imen.ferjani@solarpro.tn',    'Batterie lithium',         'Avancé', 4),
  ('imen.ferjani@solarpro.tn',    'Borne de recharge VE',     'Avancé', 3),
  ('imen.ferjani@solarpro.tn',    'Mise en service',          'Avancé', 4),
  ('tarek.chaabani@solarpro.tn',  'Raccordement réseau BT',   'Avancé', 5),
  ('tarek.chaabani@solarpro.tn',  'Habilitation BR/BC',       'Avancé', 5),
  ('tarek.chaabani@solarpro.tn',  'Maintenance corrective',   'Avancé', 4)
) m(email,skill,lvl,yrs)
JOIN "Users"  u ON u."Email" = m.email
JOIN "Skills" s ON s."Name"  = m.skill
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 3) CONTACTS  — clients particuliers, entreprises, et FOURNISSEURS
--    Type : 'individual' = particulier, 'company' = entreprise, 'supplier' = fournisseur
-- =============================================================================
INSERT INTO "Contacts" ("Name","Email","Phone","Company","Position","Status","Type",
                        "Address","Cin","MatriculeFiscale","CreatedAt","CreatedBy","IsDeleted")
VALUES
  -- Clients particuliers (résidentiel solaire)
  ('Ahmed Belhaj',         'ahmed.belhaj@gmail.com',       '+216 98 100 001', NULL,                          'Particulier',     'active','individual', 'Rue Hédi Nouira, 2080 Ariana',           '01234567', NULL,              NOW(),'seed',FALSE),
  ('Salma Trabelsi',       'salma.trabelsi@yahoo.fr',      '+216 98 100 002', NULL,                          'Particulier',     'active','individual', 'Av. de la République, 3000 Sfax',        '02345678', NULL,              NOW(),'seed',FALSE),
  ('Mohamed Sassi',        'm.sassi@outlook.com',          '+216 98 100 003', NULL,                          'Particulier',     'active','individual', 'Rue Ibn Khaldoun, 4000 Sousse',          '03456789', NULL,              NOW(),'seed',FALSE),
  ('Faten Mejri',          'faten.mejri@gmail.com',        '+216 98 100 004', NULL,                          'Particulier',     'active','individual', 'Lot. El Yasmine, 8000 Nabeul',           '04567890', NULL,              NOW(),'seed',FALSE),
  ('Hichem Zouari',        'hichem.zouari@gmail.com',      '+216 98 100 005', NULL,                          'Particulier',     'active','individual', 'Rue de Carthage, 1002 Tunis',            '05678901', NULL,              NOW(),'seed',FALSE),
  ('Amel Khelil',          'amel.khelil@gmail.com',        '+216 98 100 006', NULL,                          'Particulier',     'active','individual', 'Av. Habib Bourguiba, 5000 Monastir',     '06789012', NULL,              NOW(),'seed',FALSE),
  ('Riadh Hammami',        'riadh.hammami@gmail.com',      '+216 98 100 007', NULL,                          'Particulier',     'active','individual', 'Rue Tahar Haddad, 7000 Bizerte',         '07890123', NULL,              NOW(),'seed',FALSE),
  ('Olfa Belghith',        'olfa.belghith@gmail.com',      '+216 98 100 008', NULL,                          'Particulier',     'active','individual', 'Cité Olympique, 1003 Tunis',             '08901234', NULL,              NOW(),'seed',FALSE),
  ('Nizar Gargouri',       'nizar.gargouri@gmail.com',     '+216 98 100 009', NULL,                          'Particulier',     'active','individual', 'Route de Tunis, 3002 Sfax',              '09012345', NULL,              NOW(),'seed',FALSE),
  ('Sonia Bouazizi',       'sonia.bouazizi@gmail.com',     '+216 98 100 010', NULL,                          'Particulier',     'active','individual', 'Rue Mongi Slim, 2010 La Manouba',        '10123456', NULL,              NOW(),'seed',FALSE),

  -- Clients entreprises (tertiaire/industriel)
  ('Mounir Saidi',         'contact@cliniqueennour.tn',    '+216 71 800 001', 'Clinique En-Nour',            'Directeur Général','active','company',   'Av. de la Liberté, 1004 Tunis',          NULL,       '1234567/A/M/000', NOW(),'seed',FALSE),
  ('Sonia Mahjoub',        'achats@hotelmarinasousse.tn',  '+216 73 800 002', 'Hôtel Marina Sousse',         'Resp. Achats',     'active','company',   'Bd. 14 Janvier, 4000 Sousse',            NULL,       '2345678/A/M/000', NOW(),'seed',FALSE),
  ('Slim Khaldi',          'slim.khaldi@bati-tech.tn',     '+216 74 800 003', 'Bati-Tech Industries',        'Directeur Tech.',  'active','company',   'ZI Sfax Sud, 3013 Sfax',                 NULL,       '3456789/A/M/000', NOW(),'seed',FALSE),
  ('Hela Mansouri',        'h.mansouri@coop-agri-cap.tn',  '+216 72 800 004', 'Coopérative Agricole du Cap', 'Gérante',          'active','company',   'Route de Kelibia, 8000 Nabeul',          NULL,       '4567890/A/M/000', NOW(),'seed',FALSE),
  ('Fethi Ben Romdhane',   'admin@ecole-pilote-tunis.tn',  '+216 71 800 005', 'École Pilote de Tunis',       'Administrateur',   'active','company',   'Av. Mohamed V, 1002 Tunis',              NULL,       '5678901/A/M/000', NOW(),'seed',FALSE),
  ('Aymen Souissi',        'aymen@logistik-medenine.tn',   '+216 75 800 006', 'Logistik Medenine SARL',      'Co-fondateur',     'active','company',   'ZI Medenine, 4100 Medenine',             NULL,       '6789012/A/M/000', NOW(),'seed',FALSE),
  ('Inès Daoudi',          'ines@green-resort-djerba.tn',  '+216 75 800 007', 'Green Resort Djerba',         'Resp. Maintenance','active','company',   'Zone Touristique, 4180 Djerba',          NULL,       '7890123/A/M/000', NOW(),'seed',FALSE),

  -- FOURNISSEURS (matériel solaire)
  ('SolarTech Distribution', 'commercial@solartech-tn.com', '+216 71 900 001','SolarTech Distribution',      'Distributeur PV',  'active','supplier',  'ZI Charguia II, 2035 Tunis',             NULL,       '9001234/A/M/000', NOW(),'seed',FALSE),
  ('PV Maghreb',             'sales@pv-maghreb.com',        '+216 71 900 002','PV Maghreb',                  'Importateur',      'active','supplier',  'Rue de l''Industrie, 2080 Ariana',       NULL,       '9002345/A/M/000', NOW(),'seed',FALSE),
  ('Volta Power Systems',    'contact@volta-power.tn',      '+216 73 900 003','Volta Power Systems',         'Onduleurs & BMS',  'active','supplier',  'ZI Sidi Abdelhamid, 4000 Sousse',        NULL,       '9003456/A/M/000', NOW(),'seed',FALSE),
  ('Câbles & Connect',       'achat@cables-connect.tn',     '+216 71 900 004','Câbles & Connect',            'Câblerie',         'active','supplier',  'Av. de Carthage, 2074 La Marsa',         NULL,       '9004567/A/M/000', NOW(),'seed',FALSE),
  ('Structures Alu Pro',     'devis@alu-pro.tn',            '+216 74 900 005','Structures Alu Pro',          'Structures toiture','active','supplier', 'ZI Sfax Nord, 3000 Sfax',                NULL,       '9005678/A/M/000', NOW(),'seed',FALSE),
  ('BatteryHub Tunisie',     'contact@batteryhub.tn',       '+216 71 900 006','BatteryHub Tunisie',          'Stockage Li-Ion',  'active','supplier',  'Lac 2, 1053 Tunis',                      NULL,       '9006789/A/M/000', NOW(),'seed',FALSE)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4) ARTICLES — catalogue solaire (matériel + services)
-- =============================================================================
INSERT INTO "Articles" ("ArticleNumber","Name","Description","Unit",
                        "PurchasePrice","SalesPrice","StockQuantity","MinStockLevel",
                        "Supplier","IsActive","CreatedDate","CreatedBy","Type","Duration")
VALUES
  -- Modules photovoltaïques
  ('PV-450-MONO',  'Panneau monocristallin 450 Wc',          'Module PV monocristallin demi-cellules 450 Wc — cadre noir', 'pcs', 380.00,  520.00, 480, 60, 'SolarTech Distribution', TRUE, NOW(),'seed','material', NULL),
  ('PV-550-MONO',  'Panneau monocristallin 550 Wc bifacial', 'Module bifacial PERC 550 Wc',                                'pcs', 460.00,  640.00, 220, 40, 'PV Maghreb',             TRUE, NOW(),'seed','material', NULL),
  ('PV-330-POLY',  'Panneau polycristallin 330 Wc',          'Module polycristallin 330 Wc — résidentiel économique',      'pcs', 250.00,  360.00, 150, 30, 'SolarTech Distribution', TRUE, NOW(),'seed','material', NULL),
  -- Onduleurs
  ('INV-5K-STR',   'Onduleur string 5 kW monophasé',         'Onduleur string monophasé 5 kW — 2 MPPT',                    'pcs', 1900.00, 2650.00, 35, 5,  'Volta Power Systems',    TRUE, NOW(),'seed','material', NULL),
  ('INV-10K-3PH',  'Onduleur string 10 kW triphasé',         'Onduleur string triphasé 10 kW — IP65',                      'pcs', 3450.00, 4800.00, 22, 4,  'Volta Power Systems',    TRUE, NOW(),'seed','material', NULL),
  ('INV-25K-3PH',  'Onduleur string 25 kW triphasé',         'Onduleur string triphasé 25 kW — commercial',                'pcs', 6800.00, 9400.00, 12, 2,  'Volta Power Systems',    TRUE, NOW(),'seed','material', NULL),
  ('INV-MICRO',    'Micro-onduleur 350W',                    'Micro-onduleur module-level',                                'pcs', 220.00,  310.00, 280, 40, 'Volta Power Systems',    TRUE, NOW(),'seed','material', NULL),
  -- Stockage
  ('BAT-5K-LFP',   'Batterie LFP 5 kWh 48V',                 'Batterie lithium fer-phosphate résidentielle 5 kWh',         'pcs', 2900.00, 4100.00, 18, 3,  'BatteryHub Tunisie',     TRUE, NOW(),'seed','material', NULL),
  ('BAT-10K-LFP',  'Batterie LFP 10 kWh 48V',                'Batterie lithium fer-phosphate 10 kWh',                      'pcs', 5400.00, 7600.00, 14, 2,  'BatteryHub Tunisie',     TRUE, NOW(),'seed','material', NULL),
  ('BAT-BMS',      'BMS + module de management',             'Battery Management System + écran',                          'pcs', 720.00,  1050.00, 25, 5,  'BatteryHub Tunisie',     TRUE, NOW(),'seed','material', NULL),
  -- Borne VE
  ('EV-WB-7K',     'Borne de recharge 7,4 kW (Wallbox)',     'Borne murale Type 2 monophasée 7,4 kW',                      'pcs', 950.00,  1400.00, 30, 5,  'Volta Power Systems',    TRUE, NOW(),'seed','material', NULL),
  ('EV-WB-22K',    'Borne de recharge 22 kW triphasée',      'Borne murale Type 2 triphasée 22 kW',                        'pcs', 1700.00, 2400.00, 18, 4,  'Volta Power Systems',    TRUE, NOW(),'seed','material', NULL),
  -- Structures & fixations
  ('STR-TOIT-TUI', 'Kit fixation toiture tuile (par panneau)','Crochet + rail alu + visserie inox',                        'set', 38.00,   62.00,  600, 80, 'Structures Alu Pro',     TRUE, NOW(),'seed','material', NULL),
  ('STR-TOIT-TOL', 'Kit fixation toiture bac-acier',         'Profilé alu + tirefonds + EPDM',                             'set', 32.00,   54.00,  500, 60, 'Structures Alu Pro',     TRUE, NOW(),'seed','material', NULL),
  ('STR-GROUND',   'Structure au sol (par 4 panneaux)',      'Structure inclinée fixe galvanisée',                         'set', 280.00,  420.00, 60,  10, 'Structures Alu Pro',     TRUE, NOW(),'seed','material', NULL),
  -- Câblage & protection
  ('CAB-DC-6',     'Câble solaire DC 6 mm² (rouleau 100m)',  'Câble photovoltaïque DC 6 mm² rouge ou noir',                'm',  2.10,    3.40,    4800, 600, 'Câbles & Connect',     TRUE, NOW(),'seed','material', NULL),
  ('CAB-AC-10',    'Câble AC 3G10 (au mètre)',               'Câble U-1000 R2V 3G10',                                      'm',  4.20,    6.80,    2200, 400, 'Câbles & Connect',     TRUE, NOW(),'seed','material', NULL),
  ('CON-MC4',      'Connecteur MC4 paire',                   'Connecteur étanche IP67 — paire mâle/femelle',               'pcs', 1.60,    3.20,    1800, 300, 'Câbles & Connect',     TRUE, NOW(),'seed','material', NULL),
  ('PROT-DC',      'Coffret DC 2 strings + parafoudre',      'Coffret DC pré-câblé 2 strings — parafoudre T2',             'pcs', 180.00,  290.00,  60,  10, 'Câbles & Connect',     TRUE, NOW(),'seed','material', NULL),
  ('PROT-AC',      'Coffret AC monophasé avec disjoncteur',  'Coffret AC monophasé 40A — différentiel 30 mA',              'pcs', 140.00,  230.00,  55,  10, 'Câbles & Connect',     TRUE, NOW(),'seed','material', NULL),
  ('METER-PROD',   'Compteur de production STEG',            'Compteur monophasé homologué STEG',                          'pcs', 220.00,  340.00,  40,  6,  'Câbles & Connect',     TRUE, NOW(),'seed','material', NULL),
  -- Services / main-d'œuvre
  ('SVC-INST-RES',  'Installation résidentielle 3-6 kWc',    'Pose complète main-d''œuvre — installation résidentielle',   'forfait', 0, 1800.00, 999, NULL, NULL,                  TRUE, NOW(),'seed','service',  720),
  ('SVC-INST-TER',  'Installation tertiaire 10-30 kWc',      'Pose complète main-d''œuvre — site tertiaire',               'forfait', 0, 5400.00, 999, NULL, NULL,                  TRUE, NOW(),'seed','service',  1440),
  ('SVC-MES',       'Mise en service + déclaration STEG',    'Tests, MES onduleur, monitoring + dossier STEG',             'forfait', 0, 650.00,  999, NULL, NULL,                  TRUE, NOW(),'seed','service',  240),
  ('SVC-MAINT-AN',  'Contrat de maintenance annuel',         'Visite annuelle + nettoyage modules + rapport',              'an',      0, 480.00,  999, NULL, NULL,                  TRUE, NOW(),'seed','service',  240),
  ('SVC-DIAG',      'Diagnostic / dépannage sur site',       'Intervention diagnostic — main-d''œuvre 1h',                 'h',       0, 95.00,   999, NULL, NULL,                  TRUE, NOW(),'seed','service',  60),
  ('SVC-ETUDE',     'Étude photovoltaïque + dimensionnement','Étude technique, simulation PVGIS, plans',                   'forfait', 0, 850.00,  999, NULL, NULL,                  TRUE, NOW(),'seed','service',  480),
  ('SVC-IRVE',      'Pose borne de recharge VE',             'Pose et configuration borne IRVE résidentielle',             'forfait', 0, 480.00,  999, NULL, NULL,                  TRUE, NOW(),'seed','service',  240)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 5) OFFRES — offers liées aux contacts ; offer_items liées aux articles
-- =============================================================================
INSERT INTO offers (id,title,description,contact_id,amount,currency,taxes,discount,status,category,
                    valid_until,assigned_to_name,created_by,created_at,updated_at)
SELECT 'OFF-2026-' || LPAD(rn::text,4,'0'),
       o.title, o.description, c."Id", o.amount, 'TND', o.taxes, o.discount, o.status, 'solaire',
       NOW() + (interval '30 days'),
       'Leïla Trabelsi', 'leila.trabelsi@solarpro.tn', NOW() - (rn || ' days')::interval, NOW()
FROM (
  VALUES
   (1,  'Kit résidentiel 3 kWc autoconsommation',          'Ahmed Belhaj',       6500.00,  1235.00, 0,     'sent',     'Offre kit 6×PV 450Wc + onduleur 5kW + pose'),
   (2,  'Kit résidentiel 5 kWc + monitoring',              'Salma Trabelsi',     9800.00,  1862.00, 200,   'accepted', 'Offre kit 10×PV 450Wc + 5kW + supervision SolarEdge'),
   (3,  'Installation 6 kWc + batterie 5 kWh',             'Mohamed Sassi',     14200.00,  2698.00, 0,     'sent',     'PV 6kWc + batterie LFP 5kWh + borne VE'),
   (4,  'Pompage solaire agricole',                        'Hela Mansouri',     11800.00,  2242.00, 500,   'sent',     'Système pompage hors-réseau 4 kWc'),
   (5,  'Solaire école pilote 30 kWc',                     'Fethi Ben Romdhane',62000.00, 11780.00, 1500,  'accepted', 'Centrale toiture 30 kWc, autoconsommation totale'),
   (6,  'Maintenance annuelle clinique',                   'Mounir Saidi',       2400.00,   456.00, 0,     'accepted', 'Contrat 1 an — 4 visites + monitoring'),
   (7,  'Centrale hôtelière 80 kWc',                       'Sonia Mahjoub',    154000.00, 29260.00, 4000,  'sent',     'Centrale 80 kWc — étude + pose + MES'),
   (8,  'Installation Bati-Tech 50 kWc',                   'Slim Khaldi',       96000.00, 18240.00, 0,     'sent',     'Toiture industrielle 50 kWc + monitoring'),
   (9,  'Solaire + batterie green resort',                 'Inès Daoudi',       38000.00,  7220.00, 800,   'draft',    'Hybride 20 kWc + 20 kWh stockage'),
   (10, 'Solaire entrepôt Logistik',                       'Aymen Souissi',     74000.00, 14060.00, 0,     'sent',     '40 kWc + onduleur 25kW + bac-acier'),
   (11, 'Borne VE résidentielle 7 kW',                     'Hichem Zouari',      2200.00,   418.00, 0,     'accepted', 'Pose Wallbox 7,4 kW + coffret AC'),
   (12, 'Borne VE 22 kW triphasée',                        'Olfa Belghith',      3400.00,   646.00, 0,     'sent',     'Borne triphasée 22 kW + raccord STEG'),
   (13, 'Étude PV 12 kWc',                                 'Riadh Hammami',       850.00,   162.00, 0,     'accepted', 'Étude + dimensionnement + plans'),
   (14, 'Maintenance annuelle particulier',                 'Faten Mejri',         480.00,    91.00, 0,     'accepted', 'Contrat annuel — 1 visite'),
   (15, 'Dépannage onduleur défectueux',                   'Amel Khelil',         320.00,    61.00, 0,     'accepted', 'Diagnostic + remplacement onduleur 5kW'),
   (16, 'Kit hybride 4 kWc + 10 kWh',                       'Nizar Gargouri',    13500.00,  2565.00, 0,     'rejected', 'Refusé — délai trop long'),
   (17, 'Centrale Coop agricole 25 kWc',                   'Hela Mansouri',     49500.00,  9405.00, 0,     'draft',    'Autoconsommation + revente surplus'),
   (18, 'Système autonome cabane hors-réseau',             'Sonia Bouazizi',     6200.00,  1178.00, 0,     'sent',     'PV 2 kWc + batterie 5 kWh hors-réseau'),
   (19, 'Maintenance hôtel Sousse',                        'Sonia Mahjoub',      3800.00,   722.00, 0,     'accepted', '4 visites/an + nettoyage modules'),
   (20, 'Audit énergétique préalable',                     'Slim Khaldi',         950.00,   180.00, 0,     'accepted', 'Audit énergétique site industriel')
) AS o(rn,client_name,amount,taxes,discount,status,title,description)
JOIN "Contacts" c ON c."Name" = o.client_name
ON CONFLICT (id) DO NOTHING;

-- Lignes d'offre principales (1 ligne PV + 1 ligne service par offre)
INSERT INTO offer_items (id,offer_id,type,article_id,item_name,item_code,description,quantity,unit_price,discount)
SELECT 'OI-' || o.id || '-PV',
       o.id, 'material', a."ArticleNumber",
       a."Name", a."ArticleNumber",
       'Modules photovoltaïques pour ' || o.title,
       CASE WHEN o.amount > 50000 THEN 60
            WHEN o.amount > 20000 THEN 20
            WHEN o.amount > 8000  THEN 10
            ELSE 6 END,
       a."SalesPrice", 0
FROM offers o
JOIN "Articles" a ON a."ArticleNumber" =
     CASE WHEN o.amount > 50000 THEN 'PV-550-MONO' ELSE 'PV-450-MONO' END
WHERE o.id LIKE 'OFF-2026-%'
ON CONFLICT (id) DO NOTHING;

INSERT INTO offer_items (id,offer_id,type,article_id,item_name,item_code,description,quantity,unit_price,discount)
SELECT 'OI-' || o.id || '-SVC',
       o.id, 'service', a."ArticleNumber",
       a."Name", a."ArticleNumber",
       'Main-d''œuvre + MES',
       1, a."SalesPrice", 0
FROM offers o
JOIN "Articles" a ON a."ArticleNumber" =
     CASE WHEN o.amount > 50000 THEN 'SVC-INST-TER' ELSE 'SVC-INST-RES' END
WHERE o.id LIKE 'OFF-2026-%'
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6) VENTES (sales) — issues des offres acceptées
-- =============================================================================
INSERT INTO sales (id,title,description,contact_id,offer_id,amount,currency,taxes,discount,
                   status,stage,priority,assigned_to_name,created_by,created_at,updated_at,
                   estimated_close_date)
SELECT REPLACE(o.id,'OFF-','SAL-'),
       o.title, o.description, o.contact_id, o.id, o.amount, o.currency, o.taxes, o.discount,
       CASE WHEN random() < 0.4 THEN 'completed'
            WHEN random() < 0.7 THEN 'in_progress'
            ELSE 'won' END,
       'closed_won', 'high',
       o.assigned_to_name, o.created_by, o.created_at, NOW(),
       NOW() + interval '15 days'
FROM offers o
WHERE o.status IN ('accepted')
ON CONFLICT (id) DO NOTHING;

-- Copie des lignes d'offre vers lignes de vente
INSERT INTO sale_items (id,sale_id,type,article_id,item_name,item_code,description,quantity,unit_price,discount)
SELECT REPLACE(oi.id,'OI-OFF-','SI-SAL-'),
       REPLACE(oi.offer_id,'OFF-','SAL-'),
       oi.type, oi.article_id, oi.item_name, oi.item_code, oi.description,
       oi.quantity, oi.unit_price, oi.discount
FROM offer_items oi
JOIN offers o  ON o.id = oi.offer_id
WHERE o.status = 'accepted'
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7) SERVICE ORDERS — issus des ventes
-- =============================================================================
INSERT INTO "ServiceOrders" ("OrderNumber","ContactId","OrderDate","ServiceType","Priority","Status",
                             "ScheduledDate","TotalAmount","Notes","CreatedDate","CreatedBy",
                             "SaleId","OfferId","Description","StartDate","TargetCompletionDate",
                             "EstimatedDuration","EstimatedCost","Tax","CompletionPercentage")
SELECT 'SO-2026-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.id)::text,4,'0'),
       s.contact_id,
       NOW() - (random()*15 || ' days')::interval,
       CASE WHEN s.amount > 50000 THEN 'Installation Tertiaire'
            WHEN s.amount > 8000  THEN 'Installation Résidentielle'
            ELSE 'Maintenance' END,
       'high',
       CASE WHEN random() < 0.4 THEN 'completed'
            WHEN random() < 0.7 THEN 'in_progress'
            ELSE 'scheduled' END,
       NOW() + ((random()*20)::int || ' days')::interval,
       s.amount + s.taxes - s.discount,
       'Bon de travail généré depuis vente ' || s.id,
       NOW(), 'seed', s.id, s.offer_id,
       s.description,
       NOW() + ((random()*5)::int  || ' days')::interval,
       NOW() + ((random()*30)::int || ' days')::interval,
       CASE WHEN s.amount > 50000 THEN 1440 ELSE 720 END,
       s.amount * 0.6, s.taxes, 0
FROM sales s
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 8) SERVICE ORDER JOBS — tâches granulaires par service order
--    (3 jobs par service order : Pose / Câblage+Onduleur / MES)
-- =============================================================================
INSERT INTO "ServiceOrderJobs" ("ServiceOrderId","JobDescription","Status","EstimatedHours","Title",
                                "WorkType","Priority","ScheduledDate","EstimatedDuration",
                                "EstimatedCost","RequiredSkills","CompletionPercentage")
SELECT so."Id",
       'Pose des modules photovoltaïques sur site',
       CASE WHEN random() < 0.3 THEN 'completed' ELSE 'pending' END,
       8.0, 'Pose modules PV', 'installation', so."Priority",
       so."ScheduledDate", 480, 1200.00,
       ARRAY['Pose panneaux PV','Travail en hauteur'], 0
FROM "ServiceOrders" so
WHERE so."OrderNumber" LIKE 'SO-2026-%'
UNION ALL
SELECT so."Id",
       'Câblage DC, pose onduleur et coffret AC',
       CASE WHEN random() < 0.3 THEN 'completed' ELSE 'pending' END,
       6.0, 'Câblage + onduleur', 'installation', so."Priority",
       so."ScheduledDate" + interval '1 day', 360, 900.00,
       ARRAY['Câblage DC','Onduleur string','Raccordement réseau BT'], 0
FROM "ServiceOrders" so
WHERE so."OrderNumber" LIKE 'SO-2026-%'
UNION ALL
SELECT so."Id",
       'Mise en service, tests, déclaration STEG, monitoring',
       'pending',
       4.0, 'Mise en service + monitoring', 'commissioning', so."Priority",
       so."ScheduledDate" + interval '2 days', 240, 600.00,
       ARRAY['Mise en service','Monitoring & supervision'], 0
FROM "ServiceOrders" so
WHERE so."OrderNumber" LIKE 'SO-2026-%'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 9) DISPATCHES — interventions planifiées
--    On crée 1 dispatch par job sur un sous-ensemble (≈ 70% planifiés),
--    le reste reste "non planifié" (jobs sans dispatch → apparaît dans la
--    UnassignedJobsList du planning board).
-- =============================================================================
INSERT INTO "Dispatches" ("DispatchNumber","ContactId","ServiceOrderId","ScheduledDate","Status",
                          "Priority","Description","SiteAddress","CreatedDate","CreatedBy",
                          "JobId","RequiredSkills","CompletionPercentage","IsDeleted")
SELECT 'DSP-2026-' || LPAD(ROW_NUMBER() OVER (ORDER BY j."Id")::text,4,'0'),
       so."ContactId", so."Id",
       j."ScheduledDate",
       CASE WHEN random() < 0.25 THEN 'completed'
            WHEN random() < 0.55 THEN 'in_progress'
            ELSE 'scheduled' END,
       j."Priority",
       j."JobDescription",
       COALESCE(c."Address", 'Adresse non renseignée'),
       NOW(), 'nadia.gharbi@solarpro.tn',
       j."Id"::text,
       j."RequiredSkills", 0, FALSE
FROM "ServiceOrderJobs" j
JOIN "ServiceOrders"    so ON so."Id" = j."ServiceOrderId"
JOIN "Contacts"         c  ON c."Id"  = so."ContactId"
WHERE so."OrderNumber" LIKE 'SO-2026-%'
  AND random() < 0.70
ON CONFLICT DO NOTHING;

-- Pivot Dispatch ↔ Job (table de jonction)
INSERT INTO "DispatchJobs" ("DispatchId","JobId")
SELECT d."Id", CAST(d."JobId" AS INT)
FROM "Dispatches" d
WHERE d."DispatchNumber" LIKE 'DSP-2026-%' AND d."JobId" ~ '^\d+$'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 10) INSTALLATIONS — parc installé déclaré chez les clients
-- =============================================================================
INSERT INTO "Installations" ("InstallationNumber","ContactId","SiteAddress","InstallationType",
                             "InstallationDate","Status","WarrantyExpiry","Notes","CreatedDate",
                             "CreatedBy","Name","Model","Manufacturer","Category","Type",
                             "WarrantyFrom","SerialNumber")
SELECT 'INST-2026-' || LPAD(ROW_NUMBER() OVER (ORDER BY so."Id")::text,4,'0'),
       so."ContactId", COALESCE(c."Address",'-'),
       CASE WHEN so."TotalAmount" > 50000 THEN 'Centrale toiture tertiaire'
            ELSE 'Installation résidentielle' END,
       NOW() - ((random()*90)::int || ' days')::interval,
       'active',
       NOW() + interval '10 years',
       'Installation issue du SO ' || so."OrderNumber",
       NOW(), 'seed',
       'Centrale PV ' || c."Name",
       CASE WHEN so."TotalAmount" > 50000 THEN 'Volta 25kW + 60×PV 550Wc'
            ELSE 'Volta 5kW + 10×PV 450Wc' END,
       'Volta / SolarTech',
       'Photovoltaïque',
       CASE WHEN so."TotalAmount" > 50000 THEN 'tertiaire' ELSE 'residentiel' END,
       NOW() - ((random()*90)::int || ' days')::interval,
       'SN-' || LPAD((random()*999999)::int::text,6,'0')
FROM "ServiceOrders" so
JOIN "Contacts" c ON c."Id" = so."ContactId"
WHERE so."OrderNumber" LIKE 'SO-2026-%'
  AND random() < 0.85
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 11) BONS DE COMMANDE FOURNISSEUR
-- =============================================================================
INSERT INTO "PurchaseOrders" ("TenantId","OrderNumber","Title","Description","SupplierId","SupplierName",
                              "Status","OrderDate","ExpectedDelivery","Currency",
                              "SubTotal","TaxAmount","GrandTotal","PaymentTerms","PaymentStatus",
                              "Notes","CreatedDate","CreatedBy","CreatedByName","IsDeleted")
SELECT (SELECT val::int FROM _seed_cfg WHERE key='tenant_id'),
       'BC-2026-' || LPAD(rn::text,4,'0'),
       p.title, p.descr, c."Id", c."Company",
       p.status,
       NOW() - (rn || ' days')::interval,
       NOW() + interval '14 days',
       'TND', p.subtotal, p.subtotal * 0.19, p.subtotal * 1.19,
       'net30','pending', 'Réappro stock atelier — ' || p.title,
       NOW(),'walid.riahi@solarpro.tn','Walid Riahi', FALSE
FROM (VALUES
  (1,  'SolarTech Distribution', 'Réappro modules 450Wc',         'Commande 120×PV-450-MONO',                   45600.00, 'received'),
  (2,  'PV Maghreb',             'Modules bifacial 550Wc',        '60×PV-550-MONO pour chantier tertiaire',     27600.00, 'sent'),
  (3,  'Volta Power Systems',    'Onduleurs string',              '10×INV-5K-STR + 6×INV-10K-3PH',              39700.00, 'received'),
  (4,  'Volta Power Systems',    'Onduleur 25 kW chantier hôtel', '4×INV-25K-3PH',                              27200.00, 'sent'),
  (5,  'BatteryHub Tunisie',     'Batteries LFP 10 kWh',          '6×BAT-10K-LFP + 6×BAT-BMS',                  36720.00, 'approved'),
  (6,  'Structures Alu Pro',     'Structures toiture tuile',      '600×STR-TOIT-TUI',                           22800.00, 'received'),
  (7,  'Structures Alu Pro',     'Structures bac-acier',          '400×STR-TOIT-TOL',                           12800.00, 'sent'),
  (8,  'Câbles & Connect',       'Câblerie + connectique',        'Câbles DC/AC + connecteurs MC4',              8400.00, 'received'),
  (9,  'Câbles & Connect',       'Coffrets DC + AC',              '30×PROT-DC + 30×PROT-AC',                     9600.00, 'sent'),
  (10, 'Volta Power Systems',    'Lot bornes VE',                 '10×EV-WB-7K + 4×EV-WB-22K',                  16300.00, 'draft'),
  (11, 'SolarTech Distribution', 'Stock tampon Q2',               'Réappro stock atelier',                      18500.00, 'draft'),
  (12, 'PV Maghreb',             'Compteurs STEG',                '40×METER-PROD',                               8800.00, 'received')
) AS p(rn,supplier_company,title,descr,subtotal,status)
JOIN "Contacts" c ON c."Company" = p.supplier_company AND c."Type" = 'supplier'
ON CONFLICT DO NOTHING;

-- Lignes BC fournisseur (simplifiées : 2 lignes par BC)
INSERT INTO "PurchaseOrderItems" ("TenantId","PurchaseOrderId","ArticleId","ArticleName","ArticleNumber",
                                  "Description","Quantity","UnitPrice","TaxRate","LineTotal","Unit","DisplayOrder")
SELECT (SELECT val::int FROM _seed_cfg WHERE key='tenant_id'),
       po."Id", a."Id", a."Name", a."ArticleNumber",
       a."Name",
       CASE WHEN po."GrandTotal" > 30000 THEN 60 ELSE 20 END,
       a."PurchasePrice", 19.00,
       CASE WHEN po."GrandTotal" > 30000 THEN 60 ELSE 20 END * a."PurchasePrice",
       a."Unit", 1
FROM "PurchaseOrders" po
JOIN "Articles" a ON a."ArticleNumber" =
     CASE WHEN po."Title" ILIKE '%450%'        THEN 'PV-450-MONO'
          WHEN po."Title" ILIKE '%550%'        THEN 'PV-550-MONO'
          WHEN po."Title" ILIKE '%Onduleur%25%' THEN 'INV-25K-3PH'
          WHEN po."Title" ILIKE '%Onduleur%'   THEN 'INV-5K-STR'
          WHEN po."Title" ILIKE '%Batterie%'   THEN 'BAT-10K-LFP'
          WHEN po."Title" ILIKE '%tuile%'      THEN 'STR-TOIT-TUI'
          WHEN po."Title" ILIKE '%bac-acier%'  THEN 'STR-TOIT-TOL'
          WHEN po."Title" ILIKE '%Câblerie%'   THEN 'CAB-DC-6'
          WHEN po."Title" ILIKE '%Coffret%'    THEN 'PROT-DC'
          WHEN po."Title" ILIKE '%borne%'      THEN 'EV-WB-7K'
          WHEN po."Title" ILIKE '%Compteur%'   THEN 'METER-PROD'
          ELSE 'CON-MC4' END
WHERE po."OrderNumber" LIKE 'BC-2026-%'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 12) VÉRIFICATIONS
-- =============================================================================
SELECT 'Contacts (clients+fournisseurs)' AS entite, COUNT(*) FROM "Contacts"        WHERE "CreatedBy" = 'seed'
UNION ALL SELECT 'Users',          COUNT(*) FROM "Users"           WHERE "CreatedBy" = 'seed'
UNION ALL SELECT 'Roles',          COUNT(*) FROM "Roles"           WHERE "CreatedUser" = 'seed'
UNION ALL SELECT 'Skills',         COUNT(*) FROM "Skills"          WHERE "CreatedUser" = 'seed'
UNION ALL SELECT 'Articles',       COUNT(*) FROM "Articles"        WHERE "CreatedBy" = 'seed'
UNION ALL SELECT 'Offers',         COUNT(*) FROM offers            WHERE id LIKE 'OFF-2026-%'
UNION ALL SELECT 'Offer items',    COUNT(*) FROM offer_items       WHERE id LIKE 'OI-OFF-2026-%'
UNION ALL SELECT 'Sales',          COUNT(*) FROM sales             WHERE id LIKE 'SAL-2026-%'
UNION ALL SELECT 'Sale items',     COUNT(*) FROM sale_items        WHERE id LIKE 'SI-SAL-2026-%'
UNION ALL SELECT 'ServiceOrders',  COUNT(*) FROM "ServiceOrders"   WHERE "OrderNumber" LIKE 'SO-2026-%'
UNION ALL SELECT 'ServiceOrderJobs', COUNT(*) FROM "ServiceOrderJobs"
UNION ALL SELECT 'Dispatches',     COUNT(*) FROM "Dispatches"      WHERE "DispatchNumber" LIKE 'DSP-2026-%'
UNION ALL SELECT 'Installations',  COUNT(*) FROM "Installations"   WHERE "InstallationNumber" LIKE 'INST-2026-%'
UNION ALL SELECT 'PurchaseOrders', COUNT(*) FROM "PurchaseOrders"  WHERE "OrderNumber" LIKE 'BC-2026-%';

COMMIT;

-- =============================================================================
-- FIN — Pour ré-exécuter proprement :
--   BEGIN;
--   DELETE FROM "DispatchJobs"      WHERE "DispatchId" IN (SELECT "Id" FROM "Dispatches" WHERE "DispatchNumber" LIKE 'DSP-2026-%');
--   DELETE FROM "Dispatches"        WHERE "DispatchNumber"     LIKE 'DSP-2026-%';
--   DELETE FROM "Installations"     WHERE "InstallationNumber" LIKE 'INST-2026-%';
--   DELETE FROM "ServiceOrderJobs"  WHERE "ServiceOrderId" IN (SELECT "Id" FROM "ServiceOrders" WHERE "OrderNumber" LIKE 'SO-2026-%');
--   DELETE FROM "ServiceOrders"     WHERE "OrderNumber" LIKE 'SO-2026-%';
--   DELETE FROM sale_items          WHERE sale_id LIKE 'SAL-2026-%';
--   DELETE FROM sales               WHERE id      LIKE 'SAL-2026-%';
--   DELETE FROM offer_items         WHERE offer_id LIKE 'OFF-2026-%';
--   DELETE FROM offers              WHERE id       LIKE 'OFF-2026-%';
--   DELETE FROM "PurchaseOrderItems" WHERE "PurchaseOrderId" IN (SELECT "Id" FROM "PurchaseOrders" WHERE "OrderNumber" LIKE 'BC-2026-%');
--   DELETE FROM "PurchaseOrders"    WHERE "OrderNumber" LIKE 'BC-2026-%';
--   DELETE FROM "UserSkills"        WHERE "AssignedBy" = 'seed';
--   DELETE FROM "UserRoles"         WHERE "AssignedBy" = 'seed';
--   DELETE FROM "Users"             WHERE "CreatedBy"  = 'seed';
--   DELETE FROM "Contacts"          WHERE "CreatedBy"  = 'seed';
--   DELETE FROM "Articles"          WHERE "CreatedBy"  = 'seed';
--   DELETE FROM "Skills"            WHERE "CreatedUser"= 'seed';
--   DELETE FROM "Roles"             WHERE "CreatedUser"= 'seed';
--   COMMIT;
-- =============================================================================
