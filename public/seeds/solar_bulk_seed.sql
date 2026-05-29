-- =====================================================
-- BULK SEED: Solar Panel Installation Company
-- Projects + Columns + Notes + Activities + Tasks + Comments
-- + TimeEntries + Checklists + ChecklistItems + Attachments
-- Tag: seed:solar   TenantId: 1   Projects: 60
-- Idempotent: deletes previous seed:solar rows first.
-- Requires: 20260529_ProjectsModule_MissingTables.sql applied.
-- =====================================================
BEGIN;

-- ---------- CLEANUP previous seed ----------
DELETE FROM "TaskChecklistItems" WHERE "CreatedBy" = 'seed:solar';
DELETE FROM "TaskChecklists"     WHERE "CreatedBy" = 'seed:solar';
DELETE FROM "TaskComments"       WHERE "CreatedBy" = 'seed:solar' OR "AuthorName" LIKE 'seed:solar%';
DELETE FROM "TaskTimeEntries"    WHERE "CreatedBy" = 'seed:solar';
DELETE FROM "TaskAttachments"    WHERE "UploadedBy" = 'seed:solar';
DELETE FROM "ProjectActivities"  WHERE "CreatedBy" = 'seed:solar';
DELETE FROM "ProjectNotes"       WHERE "CreatedBy" = 'seed:solar';
DELETE FROM "ProjectColumns"     WHERE "ProjectId" IN (SELECT "Id" FROM "Projects" WHERE "CreatedBy" = 'seed:solar');
DELETE FROM "ProjectTasks"       WHERE "CreatedBy" = 'seed:solar';
DELETE FROM "Projects"           WHERE "CreatedBy" = 'seed:solar';

-- ---------- PROJECTS ----------
CREATE TEMP TABLE _seed_proj_map (idx INT, project_id INT);

WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – Atlas Renewables #001', 'Residential Off-Grid for Atlas Renewables at Tunis. Includes Trina Vertex 660W panels, Sungrow SG inverter, Pylontech US3000 storage.', '2024-02-08', '2024-04-22', 'active', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 1, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Battery Retrofit – PhotonEdge SARL #002', 'Residential Battery Retrofit for PhotonEdge SARL at Gafsa. Includes REC Alpha 410W panels, GoodWe MT inverter.', '2024-03-04', '2025-01-23', 'active', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 2, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – HelioTech SARL #003', 'Residential Off-Grid for HelioTech SARL at Sousse. Includes JA Solar 550W panels, Fronius Symo inverter.', '2025-11-29', '2026-03-31', 'completed', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 3, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Rooftop – SolarMed SARL #004', 'Residential Rooftop for SolarMed SARL at Gafsa. Includes REC Alpha 410W panels, Sungrow SG inverter, Tesla Powerwall 3 storage.', '2025-04-21', '2026-03-16', 'active', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 4, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – TerraWatt SA #005', 'Residential Off-Grid for TerraWatt SA at Monastir. Includes JA Solar 550W panels, SolarEdge SE inverter.', '2025-04-04', '2025-09-28', 'active', 'client', 'low', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 5, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Commercial Carport – Sahara Solar Co #006', 'Commercial Carport for Sahara Solar Co at Sousse. Includes Canadian Solar 545W panels, Huawei SUN2000 inverter.', '2024-03-20', '2025-01-29', 'active', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 6, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Agricultural Solar Pump – NovaSun Group #007', 'Agricultural Solar Pump for NovaSun Group at Hammamet. Includes SunPower Maxeon 440W panels, Huawei SUN2000 inverter.', '2025-04-30', '2025-07-02', 'completed', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 7, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Warehouse Solar Array – CapSolar Investments #008', 'Warehouse Solar Array for CapSolar Investments at Gabès. Includes JinkoSolar 550W panels, SolarEdge SE inverter, BYD Battery-Box storage.', '2025-05-20', '2025-07-19', 'completed', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 8, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – HelioTech SARL #009', 'Residential Off-Grid for HelioTech SARL at Ben Arous. Includes JinkoSolar 550W panels, SMA Sunny Tripower inverter, Tesla Powerwall 3 storage.', '2024-05-20', '2025-01-25', 'active', 'client', 'urgent', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 9, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Workshop Inverter Testbed – SunFarm Holdings #010', 'Workshop Inverter Testbed for SunFarm Holdings at Sousse. Includes LONGi Hi-MO 6 560W panels, SMA Sunny Tripower inverter.', '2024-01-13', '2024-10-17', 'active', 'internal', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 10, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – Mediterra Energy #011', 'Residential Off-Grid for Mediterra Energy at Nabeul. Includes LONGi Hi-MO 6 560W panels, GoodWe MT inverter.', '2025-09-24', '2026-09-24', 'active', 'client', 'urgent', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 11, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Solar + BESS Microgrid – HelioTech SARL #012', 'Solar + BESS Microgrid for HelioTech SARL at Gabès. Includes JinkoSolar 550W panels, SolarEdge SE inverter.', '2024-03-04', '2024-07-09', 'completed', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 12, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Rooftop – NovaSun Group #013', 'Residential Rooftop for NovaSun Group at Tunis. Includes JA Solar 550W panels, SMA Sunny Tripower inverter.', '2025-01-07', '2025-12-17', 'completed', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 13, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Commercial Carport – BrightGrid Industries #014', 'Commercial Carport for BrightGrid Industries at Nabeul. Includes Canadian Solar 545W panels, Huawei SUN2000 inverter, Huawei LUNA2000 storage.', '2025-04-22', '2026-01-22', 'active', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 14, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Hybrid – BrightGrid Industries #015', 'Residential Hybrid for BrightGrid Industries at Kairouan. Includes JA Solar 550W panels, Huawei SUN2000 inverter, Tesla Powerwall 3 storage.', '2024-05-30', '2025-04-03', 'on-hold', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 15, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'R&D Panel Efficiency Lab – Mediterra Energy #016', 'R&D Panel Efficiency Lab for Mediterra Energy at Nabeul. Includes Trina Vertex 660W panels, SMA Sunny Tripower inverter.', '2025-05-29', '2025-12-13', 'on-hold', 'internal', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 16, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Floating Solar Plant – SunFarm Holdings #017', 'Floating Solar Plant for SunFarm Holdings at Mahdia. Includes REC Alpha 410W panels, Huawei SUN2000 inverter.', '2024-10-13', '2025-07-11', 'on-hold', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 17, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Hybrid – GreenPower Tunisie #018', 'Residential Hybrid for GreenPower Tunisie at Monastir. Includes Canadian Solar 545W panels, SMA Sunny Tripower inverter, Huawei LUNA2000 storage.', '2025-10-01', '2026-09-08', 'planning', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 18, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Commercial Rooftop – GreenPower Tunisie #019', 'Commercial Rooftop for GreenPower Tunisie at Ben Arous. Includes Canadian Solar 545W panels, SMA Sunny Tripower inverter, Tesla Powerwall 3 storage.', '2024-03-29', '2024-11-16', 'active', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 19, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – EcoEnergie SA #020', 'Residential Off-Grid for EcoEnergie SA at Gafsa. Includes SunPower Maxeon 440W panels, GoodWe MT inverter, Huawei LUNA2000 storage.', '2025-11-04', '2026-06-01', 'completed', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 20, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Rooftop – CapSolar Investments #021', 'Residential Rooftop for CapSolar Investments at Ben Arous. Includes SunPower Maxeon 440W panels, SMA Sunny Tripower inverter.', '2024-08-04', '2024-09-17', 'active', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 21, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Industrial Ground-Mount – Mediterra Energy #022', 'Industrial Ground-Mount for Mediterra Energy at Gabès. Includes JinkoSolar 550W panels, GoodWe MT inverter, Huawei LUNA2000 storage.', '2025-11-09', '2026-10-03', 'on-hold', 'client', 'urgent', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 22, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Solar + BESS Microgrid – Mediterra Energy #023', 'Solar + BESS Microgrid for Mediterra Energy at Sousse. Includes SunPower Maxeon 440W panels, SolarEdge SE inverter.', '2025-09-15', '2025-10-17', 'active', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 23, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Rooftop – SolarMed SARL #024', 'Residential Rooftop for SolarMed SARL at Nabeul. Includes SunPower Maxeon 440W panels, Huawei SUN2000 inverter.', '2024-02-28', '2024-08-03', 'completed', 'client', 'low', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 24, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Agricultural Solar Pump – Mediterra Energy #025', 'Agricultural Solar Pump for Mediterra Energy at Tunis. Includes Canadian Solar 545W panels, Fronius Symo inverter.', '2025-06-01', '2026-05-07', 'active', 'client', 'urgent', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 25, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Warehouse Solar Array – SunFarm Holdings #026', 'Warehouse Solar Array for SunFarm Holdings at Djerba. Includes JA Solar 550W panels, SMA Sunny Tripower inverter.', '2024-05-20', '2025-01-18', 'completed', 'client', 'urgent', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 26, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – GreenPower Tunisie #027', 'Residential Off-Grid for GreenPower Tunisie at Monastir. Includes SunPower Maxeon 440W panels, Huawei SUN2000 inverter.', '2024-06-07', '2025-06-01', 'active', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 27, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Floating Solar Plant – CapSolar Investments #028', 'Floating Solar Plant for CapSolar Investments at Sfax. Includes LONGi Hi-MO 6 560W panels, GoodWe MT inverter.', '2024-06-14', '2025-02-19', 'planning', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 28, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Hybrid – GreenPower Tunisie #029', 'Residential Hybrid for GreenPower Tunisie at Djerba. Includes Trina Vertex 660W panels, Sungrow SG inverter, BYD Battery-Box storage.', '2025-01-28', '2025-08-15', 'active', 'client', 'low', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 29, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – GreenPower Tunisie #030', 'Residential Off-Grid for GreenPower Tunisie at Bizerte. Includes SunPower Maxeon 440W panels, SMA Sunny Tripower inverter, Pylontech US3000 storage.', '2025-03-08', '2025-08-17', 'on-hold', 'client', 'urgent', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 30, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Commercial Rooftop – SolarMed SARL #031', 'Commercial Rooftop for SolarMed SARL at Hammamet. Includes Canadian Solar 545W panels, Huawei SUN2000 inverter, BYD Battery-Box storage.', '2025-10-11', '2025-12-25', 'active', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 31, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Rooftop – SolarMed SARL #032', 'Residential Rooftop for SolarMed SARL at Nabeul. Includes Trina Vertex 660W panels, Sungrow SG inverter, Pylontech US3000 storage.', '2024-04-22', '2024-08-12', 'active', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 32, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Workshop Inverter Testbed – Mediterra Energy #033', 'Workshop Inverter Testbed for Mediterra Energy at Hammamet. Includes Canadian Solar 545W panels, Sungrow SG inverter.', '2024-10-04', '2025-04-29', 'active', 'internal', 'low', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 33, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – Voltaic Partners #034', 'Residential Off-Grid for Voltaic Partners at Monastir. Includes JinkoSolar 550W panels, GoodWe MT inverter.', '2025-03-18', '2025-12-26', 'planning', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 34, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Commercial Carport – SunFarm Holdings #035', 'Commercial Carport for SunFarm Holdings at Ariana. Includes Canadian Solar 545W panels, Fronius Symo inverter.', '2024-05-12', '2024-06-18', 'completed', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 35, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Rooftop – Atlas Renewables #036', 'Residential Rooftop for Atlas Renewables at Ariana. Includes JA Solar 550W panels, SMA Sunny Tripower inverter.', '2024-02-16', '2024-11-07', 'completed', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 36, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Hybrid – Sahara Solar Co #037', 'Residential Hybrid for Sahara Solar Co at Mahdia. Includes JinkoSolar 550W panels, Fronius Symo inverter, Pylontech US3000 storage.', '2024-01-02', '2024-07-21', 'planning', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 37, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Commercial Carport – Mediterra Energy #038', 'Commercial Carport for Mediterra Energy at Hammamet. Includes Trina Vertex 660W panels, Huawei SUN2000 inverter, BYD Battery-Box storage.', '2025-02-07', '2025-03-20', 'active', 'client', 'low', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 38, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Agricultural Solar Pump – EcoEnergie SA #039', 'Agricultural Solar Pump for EcoEnergie SA at Tozeur. Includes SunPower Maxeon 440W panels, Fronius Symo inverter.', '2025-05-21', '2025-09-04', 'on-hold', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 39, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Battery Retrofit – CapSolar Investments #040', 'Residential Battery Retrofit for CapSolar Investments at Hammamet. Includes JA Solar 550W panels, Sungrow SG inverter.', '2024-01-17', '2024-12-11', 'active', 'client', 'low', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 40, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – Sahara Solar Co #041', 'Residential Off-Grid for Sahara Solar Co at Sfax. Includes JA Solar 550W panels, Huawei SUN2000 inverter.', '2025-10-03', '2026-08-01', 'planning', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 41, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Rooftop – Lumière Verte #042', 'Residential Rooftop for Lumière Verte at Mahdia. Includes REC Alpha 410W panels, Sungrow SG inverter, Huawei LUNA2000 storage.', '2024-09-15', '2024-11-22', 'active', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 42, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Battery Retrofit – PhotonEdge SARL #043', 'Residential Battery Retrofit for PhotonEdge SARL at Gabès. Includes REC Alpha 410W panels, Fronius Symo inverter.', '2025-09-23', '2026-09-11', 'active', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 43, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Hybrid – NovaSun Group #044', 'Residential Hybrid for NovaSun Group at Sousse. Includes JinkoSolar 550W panels, SolarEdge SE inverter, BYD Battery-Box storage.', '2024-08-10', '2025-05-17', 'on-hold', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 44, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Warehouse Solar Array – GreenPower Tunisie #045', 'Warehouse Solar Array for GreenPower Tunisie at Ben Arous. Includes Trina Vertex 660W panels, Huawei SUN2000 inverter.', '2024-01-18', '2024-07-14', 'on-hold', 'client', 'urgent', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 45, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Internal Training Installation – Lumière Verte #046', 'Internal Training Installation for Lumière Verte at Ben Arous. Includes JA Solar 550W panels, Huawei SUN2000 inverter, Tesla Powerwall 3 storage.', '2025-01-03', '2025-04-10', 'on-hold', 'internal', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 46, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Solar + BESS Microgrid – SunFarm Holdings #047', 'Solar + BESS Microgrid for SunFarm Holdings at Kairouan. Includes Canadian Solar 545W panels, Huawei SUN2000 inverter, Huawei LUNA2000 storage.', '2025-11-28', '2026-08-15', 'active', 'client', 'urgent', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 47, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Hybrid – PhotonEdge SARL #048', 'Residential Hybrid for PhotonEdge SARL at Nabeul. Includes SunPower Maxeon 440W panels, Fronius Symo inverter.', '2024-05-02', '2024-09-09', 'active', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 48, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Battery Retrofit – PhotonEdge SARL #049', 'Residential Battery Retrofit for PhotonEdge SARL at Gafsa. Includes Canadian Solar 545W panels, Fronius Symo inverter.', '2024-10-14', '2025-01-04', 'completed', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 49, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Commercial Carport – BrightGrid Industries #050', 'Commercial Carport for BrightGrid Industries at Gabès. Includes LONGi Hi-MO 6 560W panels, Fronius Symo inverter.', '2025-03-14', '2025-04-27', 'planning', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 50, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Commercial Rooftop – HelioTech SARL #051', 'Commercial Rooftop for HelioTech SARL at Kairouan. Includes REC Alpha 410W panels, Fronius Symo inverter, Pylontech US3000 storage.', '2024-06-23', '2025-03-21', 'active', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 51, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Hybrid – Atlas Renewables #052', 'Residential Hybrid for Atlas Renewables at Monastir. Includes JA Solar 550W panels, GoodWe MT inverter, Pylontech US3000 storage.', '2025-10-20', '2026-02-09', 'completed', 'client', 'urgent', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 52, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Warehouse Solar Array – TerraWatt SA #053', 'Warehouse Solar Array for TerraWatt SA at Kairouan. Includes JA Solar 550W panels, SMA Sunny Tripower inverter, Pylontech US3000 storage.', '2024-12-16', '2025-10-26', 'completed', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 53, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – CapSolar Investments #054', 'Residential Off-Grid for CapSolar Investments at Ariana. Includes Canadian Solar 545W panels, GoodWe MT inverter.', '2025-01-20', '2025-07-07', 'active', 'client', 'urgent', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 54, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Hybrid – Atlas Renewables #055', 'Residential Hybrid for Atlas Renewables at Mahdia. Includes JinkoSolar 550W panels, Fronius Symo inverter.', '2025-01-28', '2025-09-19', 'planning', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 55, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Utility-Scale Solar Farm – SolarMed SARL #056', 'Utility-Scale Solar Farm for SolarMed SARL at Gabès. Includes JA Solar 550W panels, SolarEdge SE inverter, Huawei LUNA2000 storage.', '2025-06-24', '2026-03-20', 'active', 'client', 'low', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 56, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Off-Grid – Atlas Renewables #057', 'Residential Off-Grid for Atlas Renewables at Sfax. Includes JinkoSolar 550W panels, Sungrow SG inverter.', '2024-01-02', '2024-04-05', 'completed', 'client', 'low', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 57, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Industrial Ground-Mount – Atlas Renewables #058', 'Industrial Ground-Mount for Atlas Renewables at Bizerte. Includes REC Alpha 410W panels, Huawei SUN2000 inverter, Tesla Powerwall 3 storage.', '2025-06-21', '2026-05-15', 'completed', 'client', 'high', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 58, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Rooftop – Mediterra Energy #059', 'Residential Rooftop for Mediterra Energy at Bizerte. Includes Trina Vertex 660W panels, GoodWe MT inverter.', '2024-09-05', '2025-06-05', 'on-hold', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 59, "Id" FROM ins;
WITH ins AS (
  INSERT INTO "Projects" ("TenantId","Name","Description","StartDate","EndDate","Status","ProjectKind","Priority","CreatedDate","CreatedBy")
  VALUES (1, 'Residential Battery Retrofit – Atlas Renewables #060', 'Residential Battery Retrofit for Atlas Renewables at Bizerte. Includes LONGi Hi-MO 6 560W panels, SolarEdge SE inverter.', '2025-10-24', '2026-06-26', 'completed', 'client', 'medium', NOW(), 'seed:solar')
  RETURNING "Id"
) INSERT INTO _seed_proj_map(idx, project_id) SELECT 60, "Id" FROM ins;

-- ---------- PROJECT COLUMNS (7 per project) ----------
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Backlog', 0, '#94a3b8' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Site Survey', 1, '#3b82f6' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Design & Permits', 2, '#8b5cf6' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Procurement', 3, '#f59e0b' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Installation', 4, '#10b981' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Commissioning', 5, '#ec4899' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectColumns"("TenantId","ProjectId","Name","DisplayOrder","Color") SELECT 1, project_id, 'Completed', 6, '#22c55e' FROM _seed_proj_map WHERE idx=60;

-- ---------- PROJECT NOTES (5 per project) ----------
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '2 days', 'seed:solar' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 137x JinkoSolar 550W, projected 27.0 kWp, annual yield ~57537 kWh.', NOW() - INTERVAL '50 days', 'seed:solar' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 24°, structural integrity verified.', NOW() - INTERVAL '160 days', 'seed:solar' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '153 days', 'seed:solar' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 104m², south-facing, no shading.', NOW() - INTERVAL '107 days', 'seed:solar' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 260m², south-facing, no shading.', NOW() - INTERVAL '85 days', 'seed:solar' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '171 days', 'seed:solar' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '72 days', 'seed:solar' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 21°, structural integrity verified.', NOW() - INTERVAL '92 days', 'seed:solar' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '96 days', 'seed:solar' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '97 days', 'seed:solar' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 24°, structural integrity verified.', NOW() - INTERVAL '17 days', 'seed:solar' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 100x Trina Vertex 660W, projected 42.2 kWp, annual yield ~166737 kWh.', NOW() - INTERVAL '68 days', 'seed:solar' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '163 days', 'seed:solar' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '99 days', 'seed:solar' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-06-03.', NOW() - INTERVAL '61 days', 'seed:solar' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '132 days', 'seed:solar' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '9 days', 'seed:solar' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 27°, structural integrity verified.', NOW() - INTERVAL '19 days', 'seed:solar' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '115 days', 'seed:solar' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 68x REC Alpha 410W, projected 66.0 kWp, annual yield ~179175 kWh.', NOW() - INTERVAL '32 days', 'seed:solar' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 19°, structural integrity verified.', NOW() - INTERVAL '67 days', 'seed:solar' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '149 days', 'seed:solar' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '135 days', 'seed:solar' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-04-15.', NOW() - INTERVAL '2 days', 'seed:solar' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '150 days', 'seed:solar' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '67 days', 'seed:solar' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 10°, structural integrity verified.', NOW() - INTERVAL '56 days', 'seed:solar' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '154 days', 'seed:solar' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 10x SunPower Maxeon 440W, projected 41.3 kWp, annual yield ~102467 kWh.', NOW() - INTERVAL '159 days', 'seed:solar' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-06-16.', NOW() - INTERVAL '141 days', 'seed:solar' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 109m², south-facing, no shading.', NOW() - INTERVAL '70 days', 'seed:solar' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 19°, structural integrity verified.', NOW() - INTERVAL '146 days', 'seed:solar' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '51 days', 'seed:solar' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '109 days', 'seed:solar' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 34°, structural integrity verified.', NOW() - INTERVAL '165 days', 'seed:solar' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '38 days', 'seed:solar' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 208m², south-facing, no shading.', NOW() - INTERVAL '99 days', 'seed:solar' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '81 days', 'seed:solar' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 170x Canadian Solar 545W, projected 13.1 kWp, annual yield ~167619 kWh.', NOW() - INTERVAL '42 days', 'seed:solar' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '99 days', 'seed:solar' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-05-27.', NOW() - INTERVAL '144 days', 'seed:solar' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '117 days', 'seed:solar' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '109 days', 'seed:solar' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 31°, structural integrity verified.', NOW() - INTERVAL '1 days', 'seed:solar' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '111 days', 'seed:solar' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '163 days', 'seed:solar' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 12°, structural integrity verified.', NOW() - INTERVAL '14 days', 'seed:solar' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '178 days', 'seed:solar' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-03-01.', NOW() - INTERVAL '57 days', 'seed:solar' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 20°, structural integrity verified.', NOW() - INTERVAL '66 days', 'seed:solar' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '82 days', 'seed:solar' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 58x LONGi Hi-MO 6 560W, projected 50.2 kWp, annual yield ~171873 kWh.', NOW() - INTERVAL '174 days', 'seed:solar' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-11-17.', NOW() - INTERVAL '136 days', 'seed:solar' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '177 days', 'seed:solar' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 22°, structural integrity verified.', NOW() - INTERVAL '21 days', 'seed:solar' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 53x JA Solar 550W, projected 90.0 kWp, annual yield ~17659 kWh.', NOW() - INTERVAL '133 days', 'seed:solar' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-03-29.', NOW() - INTERVAL '1 days', 'seed:solar' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '132 days', 'seed:solar' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '6 days', 'seed:solar' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 84m², south-facing, no shading.', NOW() - INTERVAL '151 days', 'seed:solar' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '4 days', 'seed:solar' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-01-21.', NOW() - INTERVAL '171 days', 'seed:solar' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 75x JinkoSolar 550W, projected 9.6 kWp, annual yield ~152411 kWh.', NOW() - INTERVAL '153 days', 'seed:solar' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '43 days', 'seed:solar' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 237m², south-facing, no shading.', NOW() - INTERVAL '157 days', 'seed:solar' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '165 days', 'seed:solar' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '80 days', 'seed:solar' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-06-11.', NOW() - INTERVAL '138 days', 'seed:solar' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '168 days', 'seed:solar' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '14 days', 'seed:solar' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 30°, structural integrity verified.', NOW() - INTERVAL '76 days', 'seed:solar' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '52 days', 'seed:solar' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 111m², south-facing, no shading.', NOW() - INTERVAL '62 days', 'seed:solar' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 185x REC Alpha 410W, projected 101.5 kWp, annual yield ~145602 kWh.', NOW() - INTERVAL '121 days', 'seed:solar' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 322m², south-facing, no shading.', NOW() - INTERVAL '44 days', 'seed:solar' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '37 days', 'seed:solar' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '11 days', 'seed:solar' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '94 days', 'seed:solar' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 27°, structural integrity verified.', NOW() - INTERVAL '64 days', 'seed:solar' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '34 days', 'seed:solar' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 35°, structural integrity verified.', NOW() - INTERVAL '67 days', 'seed:solar' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 40m², south-facing, no shading.', NOW() - INTERVAL '155 days', 'seed:solar' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '112 days', 'seed:solar' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-11-21.', NOW() - INTERVAL '145 days', 'seed:solar' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '90 days', 'seed:solar' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '152 days', 'seed:solar' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 207m², south-facing, no shading.', NOW() - INTERVAL '55 days', 'seed:solar' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-11-24.', NOW() - INTERVAL '21 days', 'seed:solar' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 186x JA Solar 550W, projected 95.1 kWp, annual yield ~169608 kWh.', NOW() - INTERVAL '92 days', 'seed:solar' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 10°, structural integrity verified.', NOW() - INTERVAL '129 days', 'seed:solar' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '153 days', 'seed:solar' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '134 days', 'seed:solar' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 109m², south-facing, no shading.', NOW() - INTERVAL '113 days', 'seed:solar' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '165 days', 'seed:solar' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '84 days', 'seed:solar' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-11-25.', NOW() - INTERVAL '27 days', 'seed:solar' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 31°, structural integrity verified.', NOW() - INTERVAL '78 days', 'seed:solar' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 78x LONGi Hi-MO 6 560W, projected 15.8 kWp, annual yield ~33015 kWh.', NOW() - INTERVAL '53 days', 'seed:solar' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '57 days', 'seed:solar' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-09-22.', NOW() - INTERVAL '147 days', 'seed:solar' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '165 days', 'seed:solar' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 388m², south-facing, no shading.', NOW() - INTERVAL '111 days', 'seed:solar' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 18°, structural integrity verified.', NOW() - INTERVAL '103 days', 'seed:solar' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 169x LONGi Hi-MO 6 560W, projected 32.3 kWp, annual yield ~116038 kWh.', NOW() - INTERVAL '117 days', 'seed:solar' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 365m², south-facing, no shading.', NOW() - INTERVAL '65 days', 'seed:solar' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-12-17.', NOW() - INTERVAL '90 days', 'seed:solar' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '5 days', 'seed:solar' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '176 days', 'seed:solar' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 22°, structural integrity verified.', NOW() - INTERVAL '164 days', 'seed:solar' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 61m², south-facing, no shading.', NOW() - INTERVAL '173 days', 'seed:solar' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 75x JinkoSolar 550W, projected 29.3 kWp, annual yield ~109982 kWh.', NOW() - INTERVAL '57 days', 'seed:solar' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '163 days', 'seed:solar' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '171 days', 'seed:solar' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-10-31.', NOW() - INTERVAL '33 days', 'seed:solar' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '72 days', 'seed:solar' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 175x Trina Vertex 660W, projected 40.5 kWp, annual yield ~132118 kWh.', NOW() - INTERVAL '160 days', 'seed:solar' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 12°, structural integrity verified.', NOW() - INTERVAL '99 days', 'seed:solar' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '89 days', 'seed:solar' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '76 days', 'seed:solar' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-07-01.', NOW() - INTERVAL '137 days', 'seed:solar' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '141 days', 'seed:solar' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 355m², south-facing, no shading.', NOW() - INTERVAL '113 days', 'seed:solar' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '36 days', 'seed:solar' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 25°, structural integrity verified.', NOW() - INTERVAL '126 days', 'seed:solar' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '120 days', 'seed:solar' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '163 days', 'seed:solar' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 10°, structural integrity verified.', NOW() - INTERVAL '25 days', 'seed:solar' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-06-07.', NOW() - INTERVAL '107 days', 'seed:solar' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 350m², south-facing, no shading.', NOW() - INTERVAL '122 days', 'seed:solar' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '127 days', 'seed:solar' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 136x Trina Vertex 660W, projected 105.1 kWp, annual yield ~95389 kWh.', NOW() - INTERVAL '168 days', 'seed:solar' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '151 days', 'seed:solar' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '147 days', 'seed:solar' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '122 days', 'seed:solar' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 345m², south-facing, no shading.', NOW() - INTERVAL '22 days', 'seed:solar' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '170 days', 'seed:solar' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-06-19.', NOW() - INTERVAL '95 days', 'seed:solar' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '108 days', 'seed:solar' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '128 days', 'seed:solar' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 258m², south-facing, no shading.', NOW() - INTERVAL '40 days', 'seed:solar' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '55 days', 'seed:solar' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '23 days', 'seed:solar' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '116 days', 'seed:solar' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-03-20.', NOW() - INTERVAL '22 days', 'seed:solar' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-03-13.', NOW() - INTERVAL '167 days', 'seed:solar' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '125 days', 'seed:solar' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '174 days', 'seed:solar' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '107 days', 'seed:solar' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '75 days', 'seed:solar' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-11-22.', NOW() - INTERVAL '110 days', 'seed:solar' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 156m², south-facing, no shading.', NOW() - INTERVAL '116 days', 'seed:solar' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '151 days', 'seed:solar' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '71 days', 'seed:solar' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 135x Trina Vertex 660W, projected 65.5 kWp, annual yield ~146552 kWh.', NOW() - INTERVAL '125 days', 'seed:solar' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '151 days', 'seed:solar' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 35°, structural integrity verified.', NOW() - INTERVAL '91 days', 'seed:solar' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '134 days', 'seed:solar' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '24 days', 'seed:solar' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 187x Trina Vertex 660W, projected 45.5 kWp, annual yield ~152962 kWh.', NOW() - INTERVAL '104 days', 'seed:solar' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 169x Canadian Solar 545W, projected 95.1 kWp, annual yield ~45935 kWh.', NOW() - INTERVAL '153 days', 'seed:solar' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 21°, structural integrity verified.', NOW() - INTERVAL '53 days', 'seed:solar' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 319m², south-facing, no shading.', NOW() - INTERVAL '25 days', 'seed:solar' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '10 days', 'seed:solar' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '143 days', 'seed:solar' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '82 days', 'seed:solar' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '47 days', 'seed:solar' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '10 days', 'seed:solar' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '132 days', 'seed:solar' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-03-29.', NOW() - INTERVAL '38 days', 'seed:solar' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '96 days', 'seed:solar' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '62 days', 'seed:solar' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 103m², south-facing, no shading.', NOW() - INTERVAL '10 days', 'seed:solar' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 17°, structural integrity verified.', NOW() - INTERVAL '115 days', 'seed:solar' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 13x REC Alpha 410W, projected 11.8 kWp, annual yield ~94071 kWh.', NOW() - INTERVAL '60 days', 'seed:solar' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '38 days', 'seed:solar' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 254m², south-facing, no shading.', NOW() - INTERVAL '70 days', 'seed:solar' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '82 days', 'seed:solar' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 37x LONGi Hi-MO 6 560W, projected 117.5 kWp, annual yield ~19903 kWh.', NOW() - INTERVAL '172 days', 'seed:solar' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 27°, structural integrity verified.', NOW() - INTERVAL '52 days', 'seed:solar' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '76 days', 'seed:solar' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '36 days', 'seed:solar' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 142x Trina Vertex 660W, projected 24.7 kWp, annual yield ~119098 kWh.', NOW() - INTERVAL '105 days', 'seed:solar' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 18°, structural integrity verified.', NOW() - INTERVAL '59 days', 'seed:solar' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-02-14.', NOW() - INTERVAL '127 days', 'seed:solar' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-03-10.', NOW() - INTERVAL '15 days', 'seed:solar' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 35°, structural integrity verified.', NOW() - INTERVAL '127 days', 'seed:solar' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '64 days', 'seed:solar' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '153 days', 'seed:solar' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '92 days', 'seed:solar' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '138 days', 'seed:solar' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '27 days', 'seed:solar' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 150x SunPower Maxeon 440W, projected 114.8 kWp, annual yield ~10099 kWh.', NOW() - INTERVAL '179 days', 'seed:solar' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '134 days', 'seed:solar' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 152m², south-facing, no shading.', NOW() - INTERVAL '46 days', 'seed:solar' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 329m², south-facing, no shading.', NOW() - INTERVAL '139 days', 'seed:solar' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 66x LONGi Hi-MO 6 560W, projected 81.2 kWp, annual yield ~126124 kWh.', NOW() - INTERVAL '102 days', 'seed:solar' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '155 days', 'seed:solar' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '62 days', 'seed:solar' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-03-14.', NOW() - INTERVAL '103 days', 'seed:solar' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 157m², south-facing, no shading.', NOW() - INTERVAL '48 days', 'seed:solar' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 118x LONGi Hi-MO 6 560W, projected 62.1 kWp, annual yield ~10459 kWh.', NOW() - INTERVAL '36 days', 'seed:solar' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-10-10.', NOW() - INTERVAL '165 days', 'seed:solar' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 18°, structural integrity verified.', NOW() - INTERVAL '10 days', 'seed:solar' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '11 days', 'seed:solar' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-10-19.', NOW() - INTERVAL '152 days', 'seed:solar' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 303m², south-facing, no shading.', NOW() - INTERVAL '148 days', 'seed:solar' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 70x REC Alpha 410W, projected 13.3 kWp, annual yield ~148213 kWh.', NOW() - INTERVAL '117 days', 'seed:solar' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '94 days', 'seed:solar' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 27°, structural integrity verified.', NOW() - INTERVAL '63 days', 'seed:solar' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '143 days', 'seed:solar' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 25°, structural integrity verified.', NOW() - INTERVAL '15 days', 'seed:solar' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '169 days', 'seed:solar' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-10-31.', NOW() - INTERVAL '58 days', 'seed:solar' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '173 days', 'seed:solar' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '27 days', 'seed:solar' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-09-20.', NOW() - INTERVAL '39 days', 'seed:solar' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '116 days', 'seed:solar' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 81x REC Alpha 410W, projected 44.3 kWp, annual yield ~97524 kWh.', NOW() - INTERVAL '135 days', 'seed:solar' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 314m², south-facing, no shading.', NOW() - INTERVAL '114 days', 'seed:solar' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-02-12.', NOW() - INTERVAL '156 days', 'seed:solar' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 20°, structural integrity verified.', NOW() - INTERVAL '13 days', 'seed:solar' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '159 days', 'seed:solar' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 140x REC Alpha 410W, projected 83.2 kWp, annual yield ~107109 kWh.', NOW() - INTERVAL '92 days', 'seed:solar' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '18 days', 'seed:solar' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '103 days', 'seed:solar' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 255m², south-facing, no shading.', NOW() - INTERVAL '24 days', 'seed:solar' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '45 days', 'seed:solar' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 83x REC Alpha 410W, projected 43.2 kWp, annual yield ~138399 kWh.', NOW() - INTERVAL '162 days', 'seed:solar' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '106 days', 'seed:solar' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 169x REC Alpha 410W, projected 87.6 kWp, annual yield ~112850 kWh.', NOW() - INTERVAL '1 days', 'seed:solar' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 187m², south-facing, no shading.', NOW() - INTERVAL '26 days', 'seed:solar' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '142 days', 'seed:solar' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2026-01-08.', NOW() - INTERVAL '51 days', 'seed:solar' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '8 days', 'seed:solar' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 29°, structural integrity verified.', NOW() - INTERVAL '176 days', 'seed:solar' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 326m², south-facing, no shading.', NOW() - INTERVAL '9 days', 'seed:solar' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '90 days', 'seed:solar' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-06-01.', NOW() - INTERVAL '150 days', 'seed:solar' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '41 days', 'seed:solar' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 72x Canadian Solar 545W, projected 117.6 kWp, annual yield ~22701 kWh.', NOW() - INTERVAL '174 days', 'seed:solar' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '125 days', 'seed:solar' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 41m², south-facing, no shading.', NOW() - INTERVAL '48 days', 'seed:solar' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '99 days', 'seed:solar' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '90 days', 'seed:solar' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '40 days', 'seed:solar' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '33 days', 'seed:solar' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 24°, structural integrity verified.', NOW() - INTERVAL '95 days', 'seed:solar' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '77 days', 'seed:solar' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 60x LONGi Hi-MO 6 560W, projected 103.4 kWp, annual yield ~39326 kWh.', NOW() - INTERVAL '67 days', 'seed:solar' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '132 days', 'seed:solar' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-06-29.', NOW() - INTERVAL '169 days', 'seed:solar' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 45x Trina Vertex 660W, projected 4.8 kWp, annual yield ~27554 kWh.', NOW() - INTERVAL '46 days', 'seed:solar' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '93 days', 'seed:solar' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 34°, structural integrity verified.', NOW() - INTERVAL '58 days', 'seed:solar' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-12-19.', NOW() - INTERVAL '34 days', 'seed:solar' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 15°, structural integrity verified.', NOW() - INTERVAL '90 days', 'seed:solar' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '103 days', 'seed:solar' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '57 days', 'seed:solar' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 18x Canadian Solar 545W, projected 7.7 kWp, annual yield ~47470 kWh.', NOW() - INTERVAL '51 days', 'seed:solar' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-01-21.', NOW() - INTERVAL '134 days', 'seed:solar' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 23°, structural integrity verified.', NOW() - INTERVAL '168 days', 'seed:solar' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '29 days', 'seed:solar' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 49m², south-facing, no shading.', NOW() - INTERVAL '23 days', 'seed:solar' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 198x Canadian Solar 545W, projected 119.8 kWp, annual yield ~166305 kWh.', NOW() - INTERVAL '57 days', 'seed:solar' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-03-06.', NOW() - INTERVAL '116 days', 'seed:solar' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '33 days', 'seed:solar' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 280m², south-facing, no shading.', NOW() - INTERVAL '45 days', 'seed:solar' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 171x LONGi Hi-MO 6 560W, projected 66.6 kWp, annual yield ~70454 kWh.', NOW() - INTERVAL '44 days', 'seed:solar' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '35 days', 'seed:solar' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '179 days', 'seed:solar' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '162 days', 'seed:solar' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '154 days', 'seed:solar' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 34°, structural integrity verified.', NOW() - INTERVAL '93 days', 'seed:solar' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-02-14.', NOW() - INTERVAL '29 days', 'seed:solar' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-07-03.', NOW() - INTERVAL '12 days', 'seed:solar' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '145 days', 'seed:solar' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 165m², south-facing, no shading.', NOW() - INTERVAL '140 days', 'seed:solar' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 10°, structural integrity verified.', NOW() - INTERVAL '168 days', 'seed:solar' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 175x LONGi Hi-MO 6 560W, projected 12.1 kWp, annual yield ~12253 kWh.', NOW() - INTERVAL '102 days', 'seed:solar' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 192x SunPower Maxeon 440W, projected 39.3 kWp, annual yield ~166689 kWh.', NOW() - INTERVAL '98 days', 'seed:solar' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '95 days', 'seed:solar' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '104 days', 'seed:solar' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 16°, structural integrity verified.', NOW() - INTERVAL '155 days', 'seed:solar' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-01-15.', NOW() - INTERVAL '114 days', 'seed:solar' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '131 days', 'seed:solar' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 247m², south-facing, no shading.', NOW() - INTERVAL '108 days', 'seed:solar' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '43 days', 'seed:solar' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '51 days', 'seed:solar' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2025-07-30.', NOW() - INTERVAL '161 days', 'seed:solar' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 181x Trina Vertex 660W, projected 74.3 kWp, annual yield ~82866 kWh.', NOW() - INTERVAL '147 days', 'seed:solar' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Permit submitted to STEG. Awaiting grid connection approval.', NOW() - INTERVAL '88 days', 'seed:solar' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Materials delivered to site. Installation scheduled for 2024-10-24.', NOW() - INTERVAL '22 days', 'seed:solar' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Customer requested additional battery capacity – revised quote sent.', NOW() - INTERVAL '136 days', 'seed:solar' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 153m², south-facing, no shading.', NOW() - INTERVAL '52 days', 'seed:solar' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Site survey completed. Roof pitch 31°, structural integrity verified.', NOW() - INTERVAL '58 days', 'seed:solar' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Drone inspection done. Thermal scan clean, no hot spots detected.', NOW() - INTERVAL '21 days', 'seed:solar' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Design finalized: 26x SunPower Maxeon 440W, projected 54.4 kWp, annual yield ~136892 kWh.', NOW() - INTERVAL '130 days', 'seed:solar' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Initial customer call: confirmed roof area 395m², south-facing, no shading.', NOW() - INTERVAL '118 days', 'seed:solar' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectNotes"("TenantId","ProjectId","Content","CreatedDate","CreatedBy") SELECT 1, project_id, 'Net-metering agreement signed. Commissioning planned next week.', NOW() - INTERVAL '122 days', 'seed:solar' FROM _seed_proj_map WHERE idx=60;

-- ---------- PROJECT ACTIVITIES (5 per project) ----------
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '95 days', 'seed:solar' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Called Atlas Renewables – discussed installation timeline.', NOW() - INTERVAL '103 days', 'seed:solar' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Called Atlas Renewables – discussed installation timeline.', NOW() - INTERVAL '95 days', 'seed:solar' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Called Atlas Renewables – discussed installation timeline.', NOW() - INTERVAL '179 days', 'seed:solar' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '117 days', 'seed:solar' FROM _seed_proj_map WHERE idx=1;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Emailed quote revision to PhotonEdge SARL.', NOW() - INTERVAL '181 days', 'seed:solar' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Trained PhotonEdge SARL staff on monitoring portal.', NOW() - INTERVAL '22 days', 'seed:solar' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '144 days', 'seed:solar' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '43 days', 'seed:solar' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '195 days', 'seed:solar' FROM _seed_proj_map WHERE idx=2;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '31 days', 'seed:solar' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '131 days', 'seed:solar' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '184 days', 'seed:solar' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Called HelioTech SARL – discussed installation timeline.', NOW() - INTERVAL '154 days', 'seed:solar' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Emailed quote revision to HelioTech SARL.', NOW() - INTERVAL '91 days', 'seed:solar' FROM _seed_proj_map WHERE idx=3;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '154 days', 'seed:solar' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Called SolarMed SARL – discussed installation timeline.', NOW() - INTERVAL '172 days', 'seed:solar' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '90 days', 'seed:solar' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '5 days', 'seed:solar' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '29 days', 'seed:solar' FROM _seed_proj_map WHERE idx=4;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '28 days', 'seed:solar' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '47 days', 'seed:solar' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '175 days', 'seed:solar' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '150 days', 'seed:solar' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '113 days', 'seed:solar' FROM _seed_proj_map WHERE idx=5;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Called Sahara Solar Co – discussed installation timeline.', NOW() - INTERVAL '87 days', 'seed:solar' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '128 days', 'seed:solar' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Called Sahara Solar Co – discussed installation timeline.', NOW() - INTERVAL '9 days', 'seed:solar' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '158 days', 'seed:solar' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Trained Sahara Solar Co staff on monitoring portal.', NOW() - INTERVAL '121 days', 'seed:solar' FROM _seed_proj_map WHERE idx=6;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '100 days', 'seed:solar' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Emailed quote revision to NovaSun Group.', NOW() - INTERVAL '92 days', 'seed:solar' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '79 days', 'seed:solar' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Called NovaSun Group – discussed installation timeline.', NOW() - INTERVAL '54 days', 'seed:solar' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '186 days', 'seed:solar' FROM _seed_proj_map WHERE idx=7;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '147 days', 'seed:solar' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Trained CapSolar Investments staff on monitoring portal.', NOW() - INTERVAL '90 days', 'seed:solar' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Called CapSolar Investments – discussed installation timeline.', NOW() - INTERVAL '85 days', 'seed:solar' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '85 days', 'seed:solar' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Called CapSolar Investments – discussed installation timeline.', NOW() - INTERVAL '63 days', 'seed:solar' FROM _seed_proj_map WHERE idx=8;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Called HelioTech SARL – discussed installation timeline.', NOW() - INTERVAL '161 days', 'seed:solar' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '69 days', 'seed:solar' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '16 days', 'seed:solar' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '91 days', 'seed:solar' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '178 days', 'seed:solar' FROM _seed_proj_map WHERE idx=9;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Emailed quote revision to SunFarm Holdings.', NOW() - INTERVAL '51 days', 'seed:solar' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Emailed quote revision to SunFarm Holdings.', NOW() - INTERVAL '92 days', 'seed:solar' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '36 days', 'seed:solar' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '195 days', 'seed:solar' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '130 days', 'seed:solar' FROM _seed_proj_map WHERE idx=10;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '140 days', 'seed:solar' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '15 days', 'seed:solar' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '200 days', 'seed:solar' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '62 days', 'seed:solar' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '38 days', 'seed:solar' FROM _seed_proj_map WHERE idx=11;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '1 days', 'seed:solar' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Trained HelioTech SARL staff on monitoring portal.', NOW() - INTERVAL '114 days', 'seed:solar' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '43 days', 'seed:solar' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Emailed quote revision to HelioTech SARL.', NOW() - INTERVAL '36 days', 'seed:solar' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '64 days', 'seed:solar' FROM _seed_proj_map WHERE idx=12;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '18 days', 'seed:solar' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Emailed quote revision to NovaSun Group.', NOW() - INTERVAL '149 days', 'seed:solar' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '148 days', 'seed:solar' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '91 days', 'seed:solar' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Emailed quote revision to NovaSun Group.', NOW() - INTERVAL '124 days', 'seed:solar' FROM _seed_proj_map WHERE idx=13;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '70 days', 'seed:solar' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Called BrightGrid Industries – discussed installation timeline.', NOW() - INTERVAL '194 days', 'seed:solar' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '60 days', 'seed:solar' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '12 days', 'seed:solar' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '51 days', 'seed:solar' FROM _seed_proj_map WHERE idx=14;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '128 days', 'seed:solar' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '61 days', 'seed:solar' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '153 days', 'seed:solar' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Emailed quote revision to BrightGrid Industries.', NOW() - INTERVAL '18 days', 'seed:solar' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '184 days', 'seed:solar' FROM _seed_proj_map WHERE idx=15;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Called Mediterra Energy – discussed installation timeline.', NOW() - INTERVAL '48 days', 'seed:solar' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Called Mediterra Energy – discussed installation timeline.', NOW() - INTERVAL '163 days', 'seed:solar' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Called Mediterra Energy – discussed installation timeline.', NOW() - INTERVAL '54 days', 'seed:solar' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '191 days', 'seed:solar' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '103 days', 'seed:solar' FROM _seed_proj_map WHERE idx=16;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '44 days', 'seed:solar' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Trained SunFarm Holdings staff on monitoring portal.', NOW() - INTERVAL '11 days', 'seed:solar' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '198 days', 'seed:solar' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Trained SunFarm Holdings staff on monitoring portal.', NOW() - INTERVAL '65 days', 'seed:solar' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Called SunFarm Holdings – discussed installation timeline.', NOW() - INTERVAL '6 days', 'seed:solar' FROM _seed_proj_map WHERE idx=17;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '14 days', 'seed:solar' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '40 days', 'seed:solar' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Called GreenPower Tunisie – discussed installation timeline.', NOW() - INTERVAL '39 days', 'seed:solar' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '135 days', 'seed:solar' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '92 days', 'seed:solar' FROM _seed_proj_map WHERE idx=18;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '137 days', 'seed:solar' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '168 days', 'seed:solar' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '58 days', 'seed:solar' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '182 days', 'seed:solar' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Called GreenPower Tunisie – discussed installation timeline.', NOW() - INTERVAL '198 days', 'seed:solar' FROM _seed_proj_map WHERE idx=19;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '143 days', 'seed:solar' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '133 days', 'seed:solar' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '33 days', 'seed:solar' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Called EcoEnergie SA – discussed installation timeline.', NOW() - INTERVAL '142 days', 'seed:solar' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Emailed quote revision to EcoEnergie SA.', NOW() - INTERVAL '167 days', 'seed:solar' FROM _seed_proj_map WHERE idx=20;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '160 days', 'seed:solar' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Trained CapSolar Investments staff on monitoring portal.', NOW() - INTERVAL '193 days', 'seed:solar' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Called CapSolar Investments – discussed installation timeline.', NOW() - INTERVAL '159 days', 'seed:solar' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Emailed quote revision to CapSolar Investments.', NOW() - INTERVAL '15 days', 'seed:solar' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '142 days', 'seed:solar' FROM _seed_proj_map WHERE idx=21;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '155 days', 'seed:solar' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '45 days', 'seed:solar' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Called Mediterra Energy – discussed installation timeline.', NOW() - INTERVAL '89 days', 'seed:solar' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '127 days', 'seed:solar' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '99 days', 'seed:solar' FROM _seed_proj_map WHERE idx=22;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '82 days', 'seed:solar' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Emailed quote revision to Mediterra Energy.', NOW() - INTERVAL '168 days', 'seed:solar' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Emailed quote revision to Mediterra Energy.', NOW() - INTERVAL '165 days', 'seed:solar' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '15 days', 'seed:solar' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Trained Mediterra Energy staff on monitoring portal.', NOW() - INTERVAL '104 days', 'seed:solar' FROM _seed_proj_map WHERE idx=23;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '7 days', 'seed:solar' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Called SolarMed SARL – discussed installation timeline.', NOW() - INTERVAL '67 days', 'seed:solar' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '59 days', 'seed:solar' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '83 days', 'seed:solar' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '76 days', 'seed:solar' FROM _seed_proj_map WHERE idx=24;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '145 days', 'seed:solar' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '196 days', 'seed:solar' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '76 days', 'seed:solar' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Emailed quote revision to Mediterra Energy.', NOW() - INTERVAL '84 days', 'seed:solar' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '63 days', 'seed:solar' FROM _seed_proj_map WHERE idx=25;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '174 days', 'seed:solar' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '54 days', 'seed:solar' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Called SunFarm Holdings – discussed installation timeline.', NOW() - INTERVAL '200 days', 'seed:solar' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '11 days', 'seed:solar' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '111 days', 'seed:solar' FROM _seed_proj_map WHERE idx=26;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '175 days', 'seed:solar' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Emailed quote revision to GreenPower Tunisie.', NOW() - INTERVAL '38 days', 'seed:solar' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '77 days', 'seed:solar' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '24 days', 'seed:solar' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '174 days', 'seed:solar' FROM _seed_proj_map WHERE idx=27;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Emailed quote revision to CapSolar Investments.', NOW() - INTERVAL '106 days', 'seed:solar' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Trained CapSolar Investments staff on monitoring portal.', NOW() - INTERVAL '85 days', 'seed:solar' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '51 days', 'seed:solar' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Called CapSolar Investments – discussed installation timeline.', NOW() - INTERVAL '34 days', 'seed:solar' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '147 days', 'seed:solar' FROM _seed_proj_map WHERE idx=28;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Emailed quote revision to GreenPower Tunisie.', NOW() - INTERVAL '186 days', 'seed:solar' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Called GreenPower Tunisie – discussed installation timeline.', NOW() - INTERVAL '81 days', 'seed:solar' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Emailed quote revision to GreenPower Tunisie.', NOW() - INTERVAL '30 days', 'seed:solar' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '134 days', 'seed:solar' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Called GreenPower Tunisie – discussed installation timeline.', NOW() - INTERVAL '45 days', 'seed:solar' FROM _seed_proj_map WHERE idx=29;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '162 days', 'seed:solar' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Emailed quote revision to GreenPower Tunisie.', NOW() - INTERVAL '135 days', 'seed:solar' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '19 days', 'seed:solar' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '57 days', 'seed:solar' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '180 days', 'seed:solar' FROM _seed_proj_map WHERE idx=30;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Called SolarMed SARL – discussed installation timeline.', NOW() - INTERVAL '67 days', 'seed:solar' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Emailed quote revision to SolarMed SARL.', NOW() - INTERVAL '11 days', 'seed:solar' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Called SolarMed SARL – discussed installation timeline.', NOW() - INTERVAL '104 days', 'seed:solar' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '68 days', 'seed:solar' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '176 days', 'seed:solar' FROM _seed_proj_map WHERE idx=31;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '139 days', 'seed:solar' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '176 days', 'seed:solar' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '102 days', 'seed:solar' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '138 days', 'seed:solar' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Trained SolarMed SARL staff on monitoring portal.', NOW() - INTERVAL '38 days', 'seed:solar' FROM _seed_proj_map WHERE idx=32;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Trained Mediterra Energy staff on monitoring portal.', NOW() - INTERVAL '104 days', 'seed:solar' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Called Mediterra Energy – discussed installation timeline.', NOW() - INTERVAL '61 days', 'seed:solar' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '177 days', 'seed:solar' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Trained Mediterra Energy staff on monitoring portal.', NOW() - INTERVAL '61 days', 'seed:solar' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Emailed quote revision to Mediterra Energy.', NOW() - INTERVAL '22 days', 'seed:solar' FROM _seed_proj_map WHERE idx=33;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Called Voltaic Partners – discussed installation timeline.', NOW() - INTERVAL '183 days', 'seed:solar' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Trained Voltaic Partners staff on monitoring portal.', NOW() - INTERVAL '177 days', 'seed:solar' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '175 days', 'seed:solar' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '116 days', 'seed:solar' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Called Voltaic Partners – discussed installation timeline.', NOW() - INTERVAL '121 days', 'seed:solar' FROM _seed_proj_map WHERE idx=34;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '151 days', 'seed:solar' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Trained SunFarm Holdings staff on monitoring portal.', NOW() - INTERVAL '60 days', 'seed:solar' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '182 days', 'seed:solar' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Trained SunFarm Holdings staff on monitoring portal.', NOW() - INTERVAL '134 days', 'seed:solar' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '18 days', 'seed:solar' FROM _seed_proj_map WHERE idx=35;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '156 days', 'seed:solar' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '121 days', 'seed:solar' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '146 days', 'seed:solar' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '16 days', 'seed:solar' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '134 days', 'seed:solar' FROM _seed_proj_map WHERE idx=36;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '93 days', 'seed:solar' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '39 days', 'seed:solar' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '163 days', 'seed:solar' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '97 days', 'seed:solar' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Trained Sahara Solar Co staff on monitoring portal.', NOW() - INTERVAL '31 days', 'seed:solar' FROM _seed_proj_map WHERE idx=37;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '179 days', 'seed:solar' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Trained Mediterra Energy staff on monitoring portal.', NOW() - INTERVAL '26 days', 'seed:solar' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '169 days', 'seed:solar' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '115 days', 'seed:solar' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '101 days', 'seed:solar' FROM _seed_proj_map WHERE idx=38;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '177 days', 'seed:solar' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '162 days', 'seed:solar' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '194 days', 'seed:solar' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '1 days', 'seed:solar' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '125 days', 'seed:solar' FROM _seed_proj_map WHERE idx=39;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '159 days', 'seed:solar' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '97 days', 'seed:solar' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Called CapSolar Investments – discussed installation timeline.', NOW() - INTERVAL '142 days', 'seed:solar' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Called CapSolar Investments – discussed installation timeline.', NOW() - INTERVAL '146 days', 'seed:solar' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Called CapSolar Investments – discussed installation timeline.', NOW() - INTERVAL '151 days', 'seed:solar' FROM _seed_proj_map WHERE idx=40;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '183 days', 'seed:solar' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '82 days', 'seed:solar' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '67 days', 'seed:solar' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Emailed quote revision to Sahara Solar Co.', NOW() - INTERVAL '134 days', 'seed:solar' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Emailed quote revision to Sahara Solar Co.', NOW() - INTERVAL '51 days', 'seed:solar' FROM _seed_proj_map WHERE idx=41;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Trained Lumière Verte staff on monitoring portal.', NOW() - INTERVAL '74 days', 'seed:solar' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '11 days', 'seed:solar' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Trained Lumière Verte staff on monitoring portal.', NOW() - INTERVAL '93 days', 'seed:solar' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '104 days', 'seed:solar' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '90 days', 'seed:solar' FROM _seed_proj_map WHERE idx=42;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Trained PhotonEdge SARL staff on monitoring portal.', NOW() - INTERVAL '148 days', 'seed:solar' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '182 days', 'seed:solar' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '16 days', 'seed:solar' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '18 days', 'seed:solar' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '97 days', 'seed:solar' FROM _seed_proj_map WHERE idx=43;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Trained NovaSun Group staff on monitoring portal.', NOW() - INTERVAL '127 days', 'seed:solar' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Emailed quote revision to NovaSun Group.', NOW() - INTERVAL '151 days', 'seed:solar' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '118 days', 'seed:solar' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Trained NovaSun Group staff on monitoring portal.', NOW() - INTERVAL '121 days', 'seed:solar' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Emailed quote revision to NovaSun Group.', NOW() - INTERVAL '112 days', 'seed:solar' FROM _seed_proj_map WHERE idx=44;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '34 days', 'seed:solar' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Called GreenPower Tunisie – discussed installation timeline.', NOW() - INTERVAL '171 days', 'seed:solar' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '102 days', 'seed:solar' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Called GreenPower Tunisie – discussed installation timeline.', NOW() - INTERVAL '174 days', 'seed:solar' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '196 days', 'seed:solar' FROM _seed_proj_map WHERE idx=45;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '30 days', 'seed:solar' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '19 days', 'seed:solar' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Called Lumière Verte – discussed installation timeline.', NOW() - INTERVAL '26 days', 'seed:solar' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Emailed quote revision to Lumière Verte.', NOW() - INTERVAL '192 days', 'seed:solar' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '14 days', 'seed:solar' FROM _seed_proj_map WHERE idx=46;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '123 days', 'seed:solar' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Trained SunFarm Holdings staff on monitoring portal.', NOW() - INTERVAL '149 days', 'seed:solar' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Trained SunFarm Holdings staff on monitoring portal.', NOW() - INTERVAL '12 days', 'seed:solar' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '85 days', 'seed:solar' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Called SunFarm Holdings – discussed installation timeline.', NOW() - INTERVAL '47 days', 'seed:solar' FROM _seed_proj_map WHERE idx=47;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '133 days', 'seed:solar' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Emailed quote revision to PhotonEdge SARL.', NOW() - INTERVAL '80 days', 'seed:solar' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '169 days', 'seed:solar' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Trained PhotonEdge SARL staff on monitoring portal.', NOW() - INTERVAL '130 days', 'seed:solar' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Called PhotonEdge SARL – discussed installation timeline.', NOW() - INTERVAL '78 days', 'seed:solar' FROM _seed_proj_map WHERE idx=48;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '97 days', 'seed:solar' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '78 days', 'seed:solar' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '13 days', 'seed:solar' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '118 days', 'seed:solar' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '93 days', 'seed:solar' FROM _seed_proj_map WHERE idx=49;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '116 days', 'seed:solar' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Called BrightGrid Industries – discussed installation timeline.', NOW() - INTERVAL '186 days', 'seed:solar' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Called BrightGrid Industries – discussed installation timeline.', NOW() - INTERVAL '136 days', 'seed:solar' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Trained BrightGrid Industries staff on monitoring portal.', NOW() - INTERVAL '144 days', 'seed:solar' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Called BrightGrid Industries – discussed installation timeline.', NOW() - INTERVAL '70 days', 'seed:solar' FROM _seed_proj_map WHERE idx=50;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '74 days', 'seed:solar' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '151 days', 'seed:solar' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '103 days', 'seed:solar' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '52 days', 'seed:solar' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '111 days', 'seed:solar' FROM _seed_proj_map WHERE idx=51;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Called Atlas Renewables – discussed installation timeline.', NOW() - INTERVAL '35 days', 'seed:solar' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '46 days', 'seed:solar' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '127 days', 'seed:solar' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '54 days', 'seed:solar' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '37 days', 'seed:solar' FROM _seed_proj_map WHERE idx=52;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Emailed quote revision to TerraWatt SA.', NOW() - INTERVAL '119 days', 'seed:solar' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '200 days', 'seed:solar' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Called TerraWatt SA – discussed installation timeline.', NOW() - INTERVAL '106 days', 'seed:solar' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '180 days', 'seed:solar' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Trained TerraWatt SA staff on monitoring portal.', NOW() - INTERVAL '39 days', 'seed:solar' FROM _seed_proj_map WHERE idx=53;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '10 days', 'seed:solar' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '75 days', 'seed:solar' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '180 days', 'seed:solar' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '79 days', 'seed:solar' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '140 days', 'seed:solar' FROM _seed_proj_map WHERE idx=54;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '170 days', 'seed:solar' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Trained Atlas Renewables staff on monitoring portal.', NOW() - INTERVAL '8 days', 'seed:solar' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Trained Atlas Renewables staff on monitoring portal.', NOW() - INTERVAL '39 days', 'seed:solar' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '167 days', 'seed:solar' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Emailed quote revision to Atlas Renewables.', NOW() - INTERVAL '50 days', 'seed:solar' FROM _seed_proj_map WHERE idx=55;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '186 days', 'seed:solar' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Trained SolarMed SARL staff on monitoring portal.', NOW() - INTERVAL '85 days', 'seed:solar' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Emailed quote revision to SolarMed SARL.', NOW() - INTERVAL '9 days', 'seed:solar' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Emailed quote revision to SolarMed SARL.', NOW() - INTERVAL '168 days', 'seed:solar' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Emailed quote revision to SolarMed SARL.', NOW() - INTERVAL '74 days', 'seed:solar' FROM _seed_proj_map WHERE idx=56;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '4 days', 'seed:solar' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Emailed quote revision to Atlas Renewables.', NOW() - INTERVAL '51 days', 'seed:solar' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '77 days', 'seed:solar' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Emailed quote revision to Atlas Renewables.', NOW() - INTERVAL '51 days', 'seed:solar' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '69 days', 'seed:solar' FROM _seed_proj_map WHERE idx=57;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Customer signed final acceptance certificate.', NOW() - INTERVAL '8 days', 'seed:solar' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Emailed quote revision to Atlas Renewables.', NOW() - INTERVAL '0 days', 'seed:solar' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '38 days', 'seed:solar' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Called Atlas Renewables – discussed installation timeline.', NOW() - INTERVAL '44 days', 'seed:solar' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Coordinated crane delivery with logistics team.', NOW() - INTERVAL '115 days', 'seed:solar' FROM _seed_proj_map WHERE idx=58;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'site_visit', 'Site visit: verified inverter location and cable routing.', NOW() - INTERVAL '84 days', 'seed:solar' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'On-site meeting with electrical engineer.', NOW() - INTERVAL '28 days', 'seed:solar' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Emailed quote revision to Mediterra Energy.', NOW() - INTERVAL '185 days', 'seed:solar' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Performed IV-curve test on string 3 – within spec.', NOW() - INTERVAL '24 days', 'seed:solar' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Emailed quote revision to Mediterra Energy.', NOW() - INTERVAL '41 days', 'seed:solar' FROM _seed_proj_map WHERE idx=59;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Trained Atlas Renewables staff on monitoring portal.', NOW() - INTERVAL '118 days', 'seed:solar' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'call', 'Called Atlas Renewables – discussed installation timeline.', NOW() - INTERVAL '10 days', 'seed:solar' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'note', 'Emailed quote revision to Atlas Renewables.', NOW() - INTERVAL '105 days', 'seed:solar' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'email', 'Trained Atlas Renewables staff on monitoring portal.', NOW() - INTERVAL '147 days', 'seed:solar' FROM _seed_proj_map WHERE idx=60;
INSERT INTO "ProjectActivities"("TenantId","ProjectId","ActivityType","Description","CreatedDate","CreatedBy") SELECT 1, project_id, 'meeting', 'Emailed quote revision to Atlas Renewables.', NOW() - INTERVAL '95 days', 'seed:solar' FROM _seed_proj_map WHERE idx=60;

-- ---------- PROJECT TASKS (15 per project) ----------
CREATE TEMP TABLE _seed_task_map (proj_idx INT, task_idx INT, task_id INT);

WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Atlas Renewables', '2024-02-14', 2, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Atlas Renewables', '2024-02-19', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '78 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Atlas Renewables', '2024-02-26', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '62 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Atlas Renewables', '2024-03-07', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '138 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Atlas Renewables', '2024-03-14', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '42 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Atlas Renewables', '2024-03-22', 3, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '94 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Atlas Renewables', '2024-03-28', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '53 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Atlas Renewables', '2024-04-06', 5, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '129 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Atlas Renewables', '2024-04-08', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '28 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Atlas Renewables', '2024-04-21', 5, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '54 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Atlas Renewables', '2024-04-22', 2, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '40 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Atlas Renewables', '2024-05-02', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '160 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Atlas Renewables', '2024-05-10', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '22 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Atlas Renewables', '2024-05-14', 2, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '153 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Atlas Renewables', '2024-05-26', 2, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '19 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=1
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 1,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for PhotonEdge SARL', '2024-03-08', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '159 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for PhotonEdge SARL', '2024-03-21', 3, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '88 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for PhotonEdge SARL', '2024-03-28', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '152 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for PhotonEdge SARL', '2024-03-31', 4, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '105 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for PhotonEdge SARL', '2024-04-11', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '38 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for PhotonEdge SARL', '2024-04-13', 3, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '198 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for PhotonEdge SARL', '2024-04-20', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '176 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for PhotonEdge SARL', '2024-04-26', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '123 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for PhotonEdge SARL', '2024-05-07', 3, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '18 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for PhotonEdge SARL', '2024-05-11', 1, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '94 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for PhotonEdge SARL', '2024-05-22', 3, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '150 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for PhotonEdge SARL', '2024-05-27', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '35 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for PhotonEdge SARL', '2024-06-05', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '14 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for PhotonEdge SARL', '2024-06-10', 4, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '164 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for PhotonEdge SARL', '2024-06-19', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '137 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=2
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 2,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for HelioTech SARL', '2025-12-08', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '18 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for HelioTech SARL', '2025-12-16', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '193 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for HelioTech SARL', '2025-12-23', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '62 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for HelioTech SARL', '2025-12-25', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '118 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for HelioTech SARL', '2026-01-04', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '127 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for HelioTech SARL', '2026-01-11', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '101 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for HelioTech SARL', '2026-01-19', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '161 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for HelioTech SARL', '2026-01-26', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '98 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for HelioTech SARL', '2026-01-31', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '59 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for HelioTech SARL', '2026-02-09', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for HelioTech SARL', '2026-02-15', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '79 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for HelioTech SARL', '2026-02-18', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '126 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for HelioTech SARL', '2026-03-01', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '29 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for HelioTech SARL', '2026-03-10', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '108 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for HelioTech SARL', '2026-03-14', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '77 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=3
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 3,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for SolarMed SARL', '2025-04-29', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '22 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for SolarMed SARL', '2025-05-08', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '159 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for SolarMed SARL', '2025-05-11', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '70 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for SolarMed SARL', '2025-05-19', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for SolarMed SARL', '2025-05-23', 2, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '175 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for SolarMed SARL', '2025-06-05', 2, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '100 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for SolarMed SARL', '2025-06-07', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '43 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for SolarMed SARL', '2025-06-19', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '101 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for SolarMed SARL', '2025-06-22', 5, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '156 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for SolarMed SARL', '2025-07-03', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '101 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for SolarMed SARL', '2025-07-10', 2, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '27 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for SolarMed SARL', '2025-07-15', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '189 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for SolarMed SARL', '2025-07-18', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '189 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for SolarMed SARL', '2025-07-26', 3, 'meeting', 'cancelled', 'project', project_id, NOW() - INTERVAL '171 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for SolarMed SARL', '2025-08-04', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '76 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=4
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 4,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for TerraWatt SA', '2025-04-13', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '134 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for TerraWatt SA', '2025-04-20', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '127 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for TerraWatt SA', '2025-04-22', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '175 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for TerraWatt SA', '2025-05-02', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '80 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for TerraWatt SA', '2025-05-11', 5, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '192 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for TerraWatt SA', '2025-05-16', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '2 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for TerraWatt SA', '2025-05-21', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '151 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for TerraWatt SA', '2025-05-30', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '192 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for TerraWatt SA', '2025-06-08', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '75 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for TerraWatt SA', '2025-06-13', 5, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '105 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for TerraWatt SA', '2025-06-20', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '177 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for TerraWatt SA', '2025-06-25', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '127 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for TerraWatt SA', '2025-07-02', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '133 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for TerraWatt SA', '2025-07-09', 3, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '190 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for TerraWatt SA', '2025-07-15', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '77 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=5
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 5,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Sahara Solar Co', '2024-03-29', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '70 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Sahara Solar Co', '2024-04-03', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '159 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Sahara Solar Co', '2024-04-10', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '28 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Sahara Solar Co', '2024-04-17', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '99 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Sahara Solar Co', '2024-04-23', 1, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '53 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Sahara Solar Co', '2024-05-02', 4, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '164 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Sahara Solar Co', '2024-05-07', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '39 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Sahara Solar Co', '2024-05-16', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Sahara Solar Co', '2024-05-25', 1, 'call', 'cancelled', 'project', project_id, NOW() - INTERVAL '71 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Sahara Solar Co', '2024-05-31', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '136 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Sahara Solar Co', '2024-06-04', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '198 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Sahara Solar Co', '2024-06-13', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '79 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Sahara Solar Co', '2024-06-18', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '63 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Sahara Solar Co', '2024-06-29', 5, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '174 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Sahara Solar Co', '2024-07-02', 2, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '166 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=6
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 6,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for NovaSun Group', '2025-05-05', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '199 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for NovaSun Group', '2025-05-14', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '191 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for NovaSun Group', '2025-05-24', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '103 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for NovaSun Group', '2025-05-28', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '87 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for NovaSun Group', '2025-06-03', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '183 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for NovaSun Group', '2025-06-14', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '137 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for NovaSun Group', '2025-06-20', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '106 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for NovaSun Group', '2025-06-27', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '35 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for NovaSun Group', '2025-06-30', 3, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '175 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for NovaSun Group', '2025-07-06', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '18 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for NovaSun Group', '2025-07-17', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '147 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for NovaSun Group', '2025-07-25', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '148 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for NovaSun Group', '2025-07-30', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '55 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for NovaSun Group', '2025-08-07', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '174 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for NovaSun Group', '2025-08-16', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '39 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=7
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 7,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for CapSolar Investments', '2025-05-25', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '129 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for CapSolar Investments', '2025-05-31', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '9 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for CapSolar Investments', '2025-06-12', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '74 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for CapSolar Investments', '2025-06-15', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '157 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for CapSolar Investments', '2025-06-23', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '198 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for CapSolar Investments', '2025-07-02', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '131 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for CapSolar Investments', '2025-07-07', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '55 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for CapSolar Investments', '2025-07-13', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '25 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for CapSolar Investments', '2025-07-21', 5, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '21 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for CapSolar Investments', '2025-07-28', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '180 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for CapSolar Investments', '2025-08-06', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '32 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for CapSolar Investments', '2025-08-15', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '56 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for CapSolar Investments', '2025-08-16', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '162 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for CapSolar Investments', '2025-08-29', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '115 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for CapSolar Investments', '2025-09-01', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '16 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=8
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 8,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for HelioTech SARL', '2024-05-24', 5, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '120 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for HelioTech SARL', '2024-06-01', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '162 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for HelioTech SARL', '2024-06-11', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '59 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for HelioTech SARL', '2024-06-20', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '73 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for HelioTech SARL', '2024-06-22', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '8 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for HelioTech SARL', '2024-07-01', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '17 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for HelioTech SARL', '2024-07-10', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '150 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for HelioTech SARL', '2024-07-15', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '151 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for HelioTech SARL', '2024-07-25', 3, 'call', 'open', 'project', project_id, NOW() - INTERVAL '137 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for HelioTech SARL', '2024-07-28', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '165 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for HelioTech SARL', '2024-08-05', 4, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '175 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for HelioTech SARL', '2024-08-10', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '158 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for HelioTech SARL', '2024-08-19', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '73 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for HelioTech SARL', '2024-08-28', 5, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '5 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for HelioTech SARL', '2024-09-05', 2, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '198 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=9
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 9,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for SunFarm Holdings', '2024-01-21', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '192 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for SunFarm Holdings', '2024-01-29', 5, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '185 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for SunFarm Holdings', '2024-02-02', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '107 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for SunFarm Holdings', '2024-02-13', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '68 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for SunFarm Holdings', '2024-02-18', 3, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '91 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for SunFarm Holdings', '2024-02-21', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '177 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for SunFarm Holdings', '2024-02-28', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '198 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for SunFarm Holdings', '2024-03-06', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '94 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for SunFarm Holdings', '2024-03-16', 1, 'call', 'cancelled', 'project', project_id, NOW() - INTERVAL '87 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for SunFarm Holdings', '2024-03-26', 2, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '28 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for SunFarm Holdings', '2024-03-31', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '54 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for SunFarm Holdings', '2024-04-08', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '50 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for SunFarm Holdings', '2024-04-16', 4, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '42 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for SunFarm Holdings', '2024-04-18', 2, 'meeting', 'cancelled', 'project', project_id, NOW() - INTERVAL '4 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for SunFarm Holdings', '2024-04-29', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '137 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=10
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 10,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Mediterra Energy', '2025-09-28', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '119 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Mediterra Energy', '2025-10-09', 5, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '19 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Mediterra Energy', '2025-10-16', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '119 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Mediterra Energy', '2025-10-19', 2, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '53 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Mediterra Energy', '2025-10-26', 1, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '152 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Mediterra Energy', '2025-11-05', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '147 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Mediterra Energy', '2025-11-15', 1, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '146 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Mediterra Energy', '2025-11-22', 4, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '44 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Mediterra Energy', '2025-11-28', 4, 'call', 'in progress', 'project', project_id, NOW() - INTERVAL '178 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Mediterra Energy', '2025-11-30', 4, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '154 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Mediterra Energy', '2025-12-12', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '59 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Mediterra Energy', '2025-12-18', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '163 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Mediterra Energy', '2025-12-22', 1, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '52 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Mediterra Energy', '2025-12-31', 1, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '103 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Mediterra Energy', '2026-01-05', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '143 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=11
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 11,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for HelioTech SARL', '2024-03-13', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '106 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for HelioTech SARL', '2024-03-17', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '40 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for HelioTech SARL', '2024-03-25', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '123 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for HelioTech SARL', '2024-04-04', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '195 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for HelioTech SARL', '2024-04-10', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '48 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for HelioTech SARL', '2024-04-13', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '42 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for HelioTech SARL', '2024-04-23', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '83 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for HelioTech SARL', '2024-04-26', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '98 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for HelioTech SARL', '2024-05-03', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '8 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for HelioTech SARL', '2024-05-14', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '129 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for HelioTech SARL', '2024-05-21', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '157 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for HelioTech SARL', '2024-05-28', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '20 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for HelioTech SARL', '2024-06-05', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for HelioTech SARL', '2024-06-11', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '75 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for HelioTech SARL', '2024-06-17', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '172 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=12
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 12,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for NovaSun Group', '2025-01-11', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '191 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for NovaSun Group', '2025-01-19', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '48 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for NovaSun Group', '2025-01-31', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '118 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for NovaSun Group', '2025-02-02', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '182 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for NovaSun Group', '2025-02-13', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '172 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for NovaSun Group', '2025-02-18', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '157 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for NovaSun Group', '2025-02-22', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '134 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for NovaSun Group', '2025-03-03', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '23 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for NovaSun Group', '2025-03-13', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '26 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for NovaSun Group', '2025-03-15', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '71 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for NovaSun Group', '2025-03-24', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '196 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for NovaSun Group', '2025-03-31', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '127 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for NovaSun Group', '2025-04-09', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '86 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for NovaSun Group', '2025-04-18', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '2 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for NovaSun Group', '2025-04-19', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '12 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=13
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 13,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for BrightGrid Industries', '2025-05-01', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '55 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for BrightGrid Industries', '2025-05-06', 5, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '148 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for BrightGrid Industries', '2025-05-10', 1, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '184 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for BrightGrid Industries', '2025-05-23', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '15 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for BrightGrid Industries', '2025-05-26', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '66 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for BrightGrid Industries', '2025-06-06', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '90 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for BrightGrid Industries', '2025-06-10', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '42 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for BrightGrid Industries', '2025-06-20', 5, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '193 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for BrightGrid Industries', '2025-06-23', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '4 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for BrightGrid Industries', '2025-06-30', 2, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '140 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for BrightGrid Industries', '2025-07-05', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '88 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for BrightGrid Industries', '2025-07-12', 1, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '81 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for BrightGrid Industries', '2025-07-21', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '138 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for BrightGrid Industries', '2025-07-29', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '55 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for BrightGrid Industries', '2025-08-05', 5, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '177 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=14
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 14,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for BrightGrid Industries', '2024-06-08', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '56 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for BrightGrid Industries', '2024-06-10', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '111 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for BrightGrid Industries', '2024-06-21', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '158 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for BrightGrid Industries', '2024-06-30', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '64 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for BrightGrid Industries', '2024-07-01', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '177 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for BrightGrid Industries', '2024-07-12', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '37 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for BrightGrid Industries', '2024-07-20', 4, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '78 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for BrightGrid Industries', '2024-07-27', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '138 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for BrightGrid Industries', '2024-07-31', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '37 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for BrightGrid Industries', '2024-08-10', 5, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '177 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for BrightGrid Industries', '2024-08-13', 1, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '66 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for BrightGrid Industries', '2024-08-22', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '114 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for BrightGrid Industries', '2024-09-01', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '88 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for BrightGrid Industries', '2024-09-03', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '100 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for BrightGrid Industries', '2024-09-09', 2, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '90 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=15
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 15,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Mediterra Energy', '2025-06-06', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '49 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Mediterra Energy', '2025-06-09', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '169 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Mediterra Energy', '2025-06-21', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '47 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Mediterra Energy', '2025-06-26', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '15 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Mediterra Energy', '2025-07-05', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '146 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Mediterra Energy', '2025-07-07', 3, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '4 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Mediterra Energy', '2025-07-15', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '94 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Mediterra Energy', '2025-07-22', 3, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '189 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Mediterra Energy', '2025-07-30', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '134 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Mediterra Energy', '2025-08-10', 2, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '74 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Mediterra Energy', '2025-08-12', 2, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '57 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Mediterra Energy', '2025-08-19', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '68 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Mediterra Energy', '2025-08-25', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '95 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Mediterra Energy', '2025-09-01', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '113 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Mediterra Energy', '2025-09-11', 5, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '183 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=16
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 16,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for SunFarm Holdings', '2024-10-17', 4, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '123 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for SunFarm Holdings', '2024-10-27', 4, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '16 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for SunFarm Holdings', '2024-10-31', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '93 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for SunFarm Holdings', '2024-11-09', 5, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '15 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for SunFarm Holdings', '2024-11-15', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '191 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for SunFarm Holdings', '2024-11-25', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '29 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for SunFarm Holdings', '2024-12-01', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '15 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for SunFarm Holdings', '2024-12-06', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '81 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for SunFarm Holdings', '2024-12-12', 4, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '68 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for SunFarm Holdings', '2024-12-25', 2, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '20 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for SunFarm Holdings', '2024-12-26', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '72 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for SunFarm Holdings', '2025-01-02', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '181 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for SunFarm Holdings', '2025-01-11', 2, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '131 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for SunFarm Holdings', '2025-01-21', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '7 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for SunFarm Holdings', '2025-01-27', 2, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '198 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=17
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 17,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for GreenPower Tunisie', '2025-10-10', 3, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '38 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for GreenPower Tunisie', '2025-10-14', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '95 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for GreenPower Tunisie', '2025-10-24', 2, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '5 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for GreenPower Tunisie', '2025-10-29', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '10 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for GreenPower Tunisie', '2025-11-03', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '78 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for GreenPower Tunisie', '2025-11-09', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '7 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for GreenPower Tunisie', '2025-11-18', 4, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '60 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for GreenPower Tunisie', '2025-11-25', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '191 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for GreenPower Tunisie', '2025-12-04', 2, 'call', 'in progress', 'project', project_id, NOW() - INTERVAL '50 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for GreenPower Tunisie', '2025-12-09', 4, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '70 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for GreenPower Tunisie', '2025-12-20', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '9 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for GreenPower Tunisie', '2025-12-24', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '146 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for GreenPower Tunisie', '2025-12-29', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '1 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for GreenPower Tunisie', '2026-01-10', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '156 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for GreenPower Tunisie', '2026-01-12', 3, 'meeting', 'cancelled', 'project', project_id, NOW() - INTERVAL '62 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=18
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 18,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for GreenPower Tunisie', '2024-04-05', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '36 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for GreenPower Tunisie', '2024-04-13', 3, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '193 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for GreenPower Tunisie', '2024-04-17', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '43 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for GreenPower Tunisie', '2024-04-29', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '105 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for GreenPower Tunisie', '2024-05-04', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '39 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for GreenPower Tunisie', '2024-05-12', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '25 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for GreenPower Tunisie', '2024-05-20', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '5 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for GreenPower Tunisie', '2024-05-23', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '36 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for GreenPower Tunisie', '2024-06-03', 3, 'call', 'cancelled', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for GreenPower Tunisie', '2024-06-07', 2, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '128 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for GreenPower Tunisie', '2024-06-15', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '50 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for GreenPower Tunisie', '2024-06-22', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '47 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for GreenPower Tunisie', '2024-06-30', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '106 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for GreenPower Tunisie', '2024-07-06', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '174 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for GreenPower Tunisie', '2024-07-13', 4, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '55 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=19
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 19,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for EcoEnergie SA', '2025-11-13', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '3 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for EcoEnergie SA', '2025-11-18', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '88 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for EcoEnergie SA', '2025-11-27', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '120 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for EcoEnergie SA', '2025-12-01', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '111 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for EcoEnergie SA', '2025-12-06', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '139 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for EcoEnergie SA', '2025-12-16', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '35 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for EcoEnergie SA', '2025-12-25', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '95 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for EcoEnergie SA', '2026-01-01', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '98 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for EcoEnergie SA', '2026-01-08', 4, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '197 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for EcoEnergie SA', '2026-01-12', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '57 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for EcoEnergie SA', '2026-01-22', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '69 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for EcoEnergie SA', '2026-01-24', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '131 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for EcoEnergie SA', '2026-02-01', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '158 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for EcoEnergie SA', '2026-02-10', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '121 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for EcoEnergie SA', '2026-02-18', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '86 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=20
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 20,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for CapSolar Investments', '2024-08-10', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '81 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for CapSolar Investments', '2024-08-18', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '174 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for CapSolar Investments', '2024-08-25', 3, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '30 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for CapSolar Investments', '2024-09-04', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '165 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for CapSolar Investments', '2024-09-06', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '197 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for CapSolar Investments', '2024-09-18', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '167 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for CapSolar Investments', '2024-09-25', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '154 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for CapSolar Investments', '2024-09-27', 1, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '153 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for CapSolar Investments', '2024-10-03', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '2 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for CapSolar Investments', '2024-10-15', 2, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '2 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for CapSolar Investments', '2024-10-18', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '183 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for CapSolar Investments', '2024-10-24', 1, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '30 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for CapSolar Investments', '2024-10-31', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '39 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for CapSolar Investments', '2024-11-11', 3, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '82 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for CapSolar Investments', '2024-11-19', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '67 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=21
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 21,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Mediterra Energy', '2025-11-13', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '42 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Mediterra Energy', '2025-11-20', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '14 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Mediterra Energy', '2025-11-28', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '88 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Mediterra Energy', '2025-12-05', 5, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '144 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Mediterra Energy', '2025-12-17', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '99 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Mediterra Energy', '2025-12-18', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '80 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Mediterra Energy', '2025-12-25', 1, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '151 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Mediterra Energy', '2026-01-07', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '120 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Mediterra Energy', '2026-01-12', 1, 'call', 'in progress', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Mediterra Energy', '2026-01-16', 1, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '50 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Mediterra Energy', '2026-01-22', 4, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '62 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Mediterra Energy', '2026-02-02', 5, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '85 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Mediterra Energy', '2026-02-06', 1, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '57 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Mediterra Energy', '2026-02-17', 4, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '158 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Mediterra Energy', '2026-02-20', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '80 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=22
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 22,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Mediterra Energy', '2025-09-20', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '16 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Mediterra Energy', '2025-10-02', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '181 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Mediterra Energy', '2025-10-06', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '134 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Mediterra Energy', '2025-10-16', 5, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '81 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Mediterra Energy', '2025-10-17', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '132 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Mediterra Energy', '2025-10-25', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '119 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Mediterra Energy', '2025-11-02', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '130 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Mediterra Energy', '2025-11-12', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '136 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Mediterra Energy', '2025-11-14', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '169 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Mediterra Energy', '2025-11-24', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '124 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Mediterra Energy', '2025-12-04', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '57 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Mediterra Energy', '2025-12-10', 4, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '198 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Mediterra Energy', '2025-12-18', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '159 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Mediterra Energy', '2025-12-25', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '23 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Mediterra Energy', '2025-12-27', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '143 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=23
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 23,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for SolarMed SARL', '2024-03-04', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '120 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for SolarMed SARL', '2024-03-15', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '9 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for SolarMed SARL', '2024-03-19', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '193 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for SolarMed SARL', '2024-03-29', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '112 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for SolarMed SARL', '2024-04-04', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '38 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for SolarMed SARL', '2024-04-10', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '184 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for SolarMed SARL', '2024-04-19', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '9 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for SolarMed SARL', '2024-04-23', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '136 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for SolarMed SARL', '2024-04-28', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '81 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for SolarMed SARL', '2024-05-06', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '155 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for SolarMed SARL', '2024-05-18', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '44 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for SolarMed SARL', '2024-05-20', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '100 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for SolarMed SARL', '2024-06-01', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '182 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for SolarMed SARL', '2024-06-04', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '32 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for SolarMed SARL', '2024-06-10', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '142 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=24
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 24,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Mediterra Energy', '2025-06-07', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '122 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Mediterra Energy', '2025-06-13', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '74 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Mediterra Energy', '2025-06-24', 2, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '188 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Mediterra Energy', '2025-06-29', 1, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '132 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Mediterra Energy', '2025-07-04', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '66 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Mediterra Energy', '2025-07-16', 5, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '83 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Mediterra Energy', '2025-07-22', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '175 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Mediterra Energy', '2025-07-27', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '1 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Mediterra Energy', '2025-07-31', 3, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '156 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Mediterra Energy', '2025-08-07', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '59 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Mediterra Energy', '2025-08-16', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '96 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Mediterra Energy', '2025-08-24', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '29 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Mediterra Energy', '2025-09-02', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '194 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Mediterra Energy', '2025-09-10', 1, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '187 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Mediterra Energy', '2025-09-12', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '65 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=25
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 25,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for SunFarm Holdings', '2024-05-28', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '98 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for SunFarm Holdings', '2024-06-03', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '35 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for SunFarm Holdings', '2024-06-08', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '183 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for SunFarm Holdings', '2024-06-16', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '89 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for SunFarm Holdings', '2024-06-27', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '82 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for SunFarm Holdings', '2024-07-04', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '191 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for SunFarm Holdings', '2024-07-11', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '168 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for SunFarm Holdings', '2024-07-12', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '117 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for SunFarm Holdings', '2024-07-21', 4, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '119 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for SunFarm Holdings', '2024-08-01', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '187 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for SunFarm Holdings', '2024-08-04', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '64 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for SunFarm Holdings', '2024-08-09', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '31 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for SunFarm Holdings', '2024-08-18', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '7 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for SunFarm Holdings', '2024-08-24', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '19 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for SunFarm Holdings', '2024-09-03', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '128 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=26
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 26,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for GreenPower Tunisie', '2024-06-17', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '164 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for GreenPower Tunisie', '2024-06-21', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '164 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for GreenPower Tunisie', '2024-06-27', 3, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '188 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for GreenPower Tunisie', '2024-07-06', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '154 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for GreenPower Tunisie', '2024-07-12', 4, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '107 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for GreenPower Tunisie', '2024-07-21', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '54 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for GreenPower Tunisie', '2024-07-27', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '169 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for GreenPower Tunisie', '2024-08-04', 5, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '9 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for GreenPower Tunisie', '2024-08-06', 2, 'call', 'cancelled', 'project', project_id, NOW() - INTERVAL '110 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for GreenPower Tunisie', '2024-08-17', 3, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '132 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for GreenPower Tunisie', '2024-08-20', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '191 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for GreenPower Tunisie', '2024-08-28', 3, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '189 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for GreenPower Tunisie', '2024-09-08', 1, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '107 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for GreenPower Tunisie', '2024-09-12', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '132 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for GreenPower Tunisie', '2024-09-20', 5, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '193 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=27
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 27,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for CapSolar Investments', '2024-06-22', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '144 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for CapSolar Investments', '2024-06-26', 1, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '167 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for CapSolar Investments', '2024-07-08', 5, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '93 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for CapSolar Investments', '2024-07-09', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '130 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for CapSolar Investments', '2024-07-20', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '131 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for CapSolar Investments', '2024-07-27', 2, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '37 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for CapSolar Investments', '2024-08-02', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '109 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for CapSolar Investments', '2024-08-11', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '155 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for CapSolar Investments', '2024-08-16', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '132 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for CapSolar Investments', '2024-08-20', 1, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '88 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for CapSolar Investments', '2024-09-01', 2, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '138 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for CapSolar Investments', '2024-09-07', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '60 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for CapSolar Investments', '2024-09-14', 1, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '192 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for CapSolar Investments', '2024-09-19', 4, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '131 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for CapSolar Investments', '2024-09-24', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '23 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=28
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 28,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for GreenPower Tunisie', '2025-02-02', 3, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '118 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for GreenPower Tunisie', '2025-02-09', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '87 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for GreenPower Tunisie', '2025-02-16', 2, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '42 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for GreenPower Tunisie', '2025-02-26', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '78 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for GreenPower Tunisie', '2025-03-06', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '115 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for GreenPower Tunisie', '2025-03-09', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '81 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for GreenPower Tunisie', '2025-03-17', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '107 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for GreenPower Tunisie', '2025-03-28', 5, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '125 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for GreenPower Tunisie', '2025-04-01', 5, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '51 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for GreenPower Tunisie', '2025-04-09', 2, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '60 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for GreenPower Tunisie', '2025-04-17', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '18 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for GreenPower Tunisie', '2025-04-24', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '86 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for GreenPower Tunisie', '2025-05-01', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '166 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for GreenPower Tunisie', '2025-05-09', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '141 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for GreenPower Tunisie', '2025-05-16', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '91 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=29
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 29,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for GreenPower Tunisie', '2025-03-15', 5, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '77 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for GreenPower Tunisie', '2025-03-24', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '176 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for GreenPower Tunisie', '2025-03-28', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '84 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for GreenPower Tunisie', '2025-04-04', 2, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '141 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for GreenPower Tunisie', '2025-04-11', 1, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '35 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for GreenPower Tunisie', '2025-04-20', 3, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '123 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for GreenPower Tunisie', '2025-04-25', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '6 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for GreenPower Tunisie', '2025-05-04', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '164 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for GreenPower Tunisie', '2025-05-09', 3, 'call', 'open', 'project', project_id, NOW() - INTERVAL '100 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for GreenPower Tunisie', '2025-05-14', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '100 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for GreenPower Tunisie', '2025-05-27', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '4 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for GreenPower Tunisie', '2025-05-30', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '127 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for GreenPower Tunisie', '2025-06-09', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '6 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for GreenPower Tunisie', '2025-06-12', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '189 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for GreenPower Tunisie', '2025-06-20', 2, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '57 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=30
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 30,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for SolarMed SARL', '2025-10-17', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '188 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for SolarMed SARL', '2025-10-23', 5, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '142 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for SolarMed SARL', '2025-11-04', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '112 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for SolarMed SARL', '2025-11-10', 4, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '187 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for SolarMed SARL', '2025-11-12', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '153 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for SolarMed SARL', '2025-11-21', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '22 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for SolarMed SARL', '2025-11-26', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '6 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for SolarMed SARL', '2025-12-08', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '29 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for SolarMed SARL', '2025-12-11', 2, 'call', 'open', 'project', project_id, NOW() - INTERVAL '156 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for SolarMed SARL', '2025-12-18', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '31 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for SolarMed SARL', '2025-12-26', 4, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '105 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for SolarMed SARL', '2026-01-01', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '7 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for SolarMed SARL', '2026-01-08', 2, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '39 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for SolarMed SARL', '2026-01-17', 5, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '160 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for SolarMed SARL', '2026-01-27', 4, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '141 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=31
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 31,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for SolarMed SARL', '2024-04-29', 4, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '6 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for SolarMed SARL', '2024-05-08', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '131 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for SolarMed SARL', '2024-05-16', 5, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '133 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for SolarMed SARL', '2024-05-18', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '41 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for SolarMed SARL', '2024-05-28', 5, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '2 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for SolarMed SARL', '2024-06-03', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '146 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for SolarMed SARL', '2024-06-12', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '86 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for SolarMed SARL', '2024-06-16', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '49 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for SolarMed SARL', '2024-06-22', 5, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '2 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for SolarMed SARL', '2024-06-30', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '68 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for SolarMed SARL', '2024-07-06', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '140 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for SolarMed SARL', '2024-07-18', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '126 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for SolarMed SARL', '2024-07-20', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '195 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for SolarMed SARL', '2024-07-29', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '151 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for SolarMed SARL', '2024-08-02', 5, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '199 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=32
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 32,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Mediterra Energy', '2024-10-11', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '30 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Mediterra Energy', '2024-10-18', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '21 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Mediterra Energy', '2024-10-22', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '127 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Mediterra Energy', '2024-10-30', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '168 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Mediterra Energy', '2024-11-11', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '53 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Mediterra Energy', '2024-11-18', 5, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '178 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Mediterra Energy', '2024-11-22', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '103 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Mediterra Energy', '2024-11-26', 1, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '192 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Mediterra Energy', '2024-12-03', 5, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '139 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Mediterra Energy', '2024-12-12', 4, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '64 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Mediterra Energy', '2024-12-21', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '114 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Mediterra Energy', '2024-12-24', 1, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '56 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Mediterra Energy', '2025-01-05', 1, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '187 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Mediterra Energy', '2025-01-13', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '48 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Mediterra Energy', '2025-01-19', 2, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '129 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=33
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 33,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Voltaic Partners', '2025-03-23', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '58 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Voltaic Partners', '2025-03-31', 3, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '16 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Voltaic Partners', '2025-04-09', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '198 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Voltaic Partners', '2025-04-15', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '160 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Voltaic Partners', '2025-04-20', 1, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '107 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Voltaic Partners', '2025-05-01', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '191 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Voltaic Partners', '2025-05-08', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '124 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Voltaic Partners', '2025-05-12', 2, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '134 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Voltaic Partners', '2025-05-20', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '36 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Voltaic Partners', '2025-05-27', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '145 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Voltaic Partners', '2025-06-04', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '196 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Voltaic Partners', '2025-06-08', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '25 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Voltaic Partners', '2025-06-14', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '128 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Voltaic Partners', '2025-06-24', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '141 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Voltaic Partners', '2025-07-04', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '82 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=34
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 34,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for SunFarm Holdings', '2024-05-17', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '32 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for SunFarm Holdings', '2024-05-25', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '162 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for SunFarm Holdings', '2024-06-01', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '200 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for SunFarm Holdings', '2024-06-11', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '124 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for SunFarm Holdings', '2024-06-18', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '140 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for SunFarm Holdings', '2024-06-26', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '93 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for SunFarm Holdings', '2024-06-28', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '49 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for SunFarm Holdings', '2024-07-06', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '182 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for SunFarm Holdings', '2024-07-12', 5, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '17 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for SunFarm Holdings', '2024-07-21', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '54 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for SunFarm Holdings', '2024-07-29', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '53 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for SunFarm Holdings', '2024-08-05', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for SunFarm Holdings', '2024-08-08', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '172 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for SunFarm Holdings', '2024-08-15', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '26 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for SunFarm Holdings', '2024-08-23', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '183 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=35
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 35,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Atlas Renewables', '2024-02-25', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '69 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Atlas Renewables', '2024-02-27', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '23 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Atlas Renewables', '2024-03-07', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '146 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Atlas Renewables', '2024-03-17', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '132 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Atlas Renewables', '2024-03-22', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '182 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Atlas Renewables', '2024-03-30', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '47 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Atlas Renewables', '2024-04-02', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '52 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Atlas Renewables', '2024-04-10', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '27 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Atlas Renewables', '2024-04-17', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '69 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Atlas Renewables', '2024-04-27', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '83 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Atlas Renewables', '2024-05-05', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '104 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Atlas Renewables', '2024-05-12', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '18 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Atlas Renewables', '2024-05-18', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '29 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Atlas Renewables', '2024-05-27', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '132 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Atlas Renewables', '2024-05-29', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '94 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=36
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 36,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Sahara Solar Co', '2024-01-06', 1, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '110 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Sahara Solar Co', '2024-01-14', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '186 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Sahara Solar Co', '2024-01-21', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '95 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Sahara Solar Co', '2024-01-28', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '41 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Sahara Solar Co', '2024-02-03', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '32 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Sahara Solar Co', '2024-02-14', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '148 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Sahara Solar Co', '2024-02-20', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '119 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Sahara Solar Co', '2024-02-29', 1, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '61 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Sahara Solar Co', '2024-03-08', 1, 'call', 'in progress', 'project', project_id, NOW() - INTERVAL '62 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Sahara Solar Co', '2024-03-10', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '123 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Sahara Solar Co', '2024-03-18', 4, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '196 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Sahara Solar Co', '2024-03-28', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '116 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Sahara Solar Co', '2024-03-30', 5, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '47 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Sahara Solar Co', '2024-04-08', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '199 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Sahara Solar Co', '2024-04-13', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '167 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=37
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 37,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Mediterra Energy', '2025-02-17', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '19 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Mediterra Energy', '2025-02-19', 2, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '45 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Mediterra Energy', '2025-02-27', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '181 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Mediterra Energy', '2025-03-08', 1, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '128 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Mediterra Energy', '2025-03-17', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '161 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Mediterra Energy', '2025-03-22', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '86 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Mediterra Energy', '2025-03-29', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '131 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Mediterra Energy', '2025-04-06', 2, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '111 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Mediterra Energy', '2025-04-11', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '62 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Mediterra Energy', '2025-04-20', 2, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Mediterra Energy', '2025-04-23', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '23 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Mediterra Energy', '2025-05-01', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '64 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Mediterra Energy', '2025-05-11', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '57 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Mediterra Energy', '2025-05-16', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '18 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Mediterra Energy', '2025-05-20', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '140 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=38
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 38,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for EcoEnergie SA', '2025-05-27', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '98 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for EcoEnergie SA', '2025-06-03', 2, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '26 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for EcoEnergie SA', '2025-06-12', 4, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '75 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for EcoEnergie SA', '2025-06-19', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '33 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for EcoEnergie SA', '2025-06-25', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '33 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for EcoEnergie SA', '2025-07-04', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '149 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for EcoEnergie SA', '2025-07-12', 1, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '29 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for EcoEnergie SA', '2025-07-13', 2, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '150 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for EcoEnergie SA', '2025-07-22', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '179 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for EcoEnergie SA', '2025-08-01', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '42 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for EcoEnergie SA', '2025-08-04', 1, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '34 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for EcoEnergie SA', '2025-08-15', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '61 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for EcoEnergie SA', '2025-08-22', 3, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '184 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for EcoEnergie SA', '2025-08-30', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '24 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for EcoEnergie SA', '2025-09-01', 1, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '91 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=39
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 39,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for CapSolar Investments', '2024-01-23', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '82 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for CapSolar Investments', '2024-02-02', 5, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '137 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for CapSolar Investments', '2024-02-08', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '124 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for CapSolar Investments', '2024-02-13', 3, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '131 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for CapSolar Investments', '2024-02-22', 3, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '169 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for CapSolar Investments', '2024-02-28', 4, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '171 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for CapSolar Investments', '2024-03-07', 3, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '71 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for CapSolar Investments', '2024-03-15', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '200 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for CapSolar Investments', '2024-03-20', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '181 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for CapSolar Investments', '2024-03-28', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '76 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for CapSolar Investments', '2024-04-06', 3, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '124 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for CapSolar Investments', '2024-04-12', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '187 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for CapSolar Investments', '2024-04-19', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '117 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for CapSolar Investments', '2024-04-27', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '188 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for CapSolar Investments', '2024-05-04', 4, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '168 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=40
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 40,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Sahara Solar Co', '2025-10-12', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '178 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Sahara Solar Co', '2025-10-18', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '88 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Sahara Solar Co', '2025-10-21', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '156 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Sahara Solar Co', '2025-11-03', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '88 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Sahara Solar Co', '2025-11-04', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '125 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Sahara Solar Co', '2025-11-12', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '125 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Sahara Solar Co', '2025-11-19', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '108 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Sahara Solar Co', '2025-11-27', 4, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '40 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Sahara Solar Co', '2025-12-07', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '183 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Sahara Solar Co', '2025-12-11', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '173 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Sahara Solar Co', '2025-12-16', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '14 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Sahara Solar Co', '2025-12-24', 3, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '131 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Sahara Solar Co', '2026-01-01', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '131 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Sahara Solar Co', '2026-01-10', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '6 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Sahara Solar Co', '2026-01-14', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '3 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=41
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 41,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Lumière Verte', '2024-09-25', 3, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '86 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Lumière Verte', '2024-09-26', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '184 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Lumière Verte', '2024-10-03', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '173 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Lumière Verte', '2024-10-12', 1, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '52 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Lumière Verte', '2024-10-18', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '151 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Lumière Verte', '2024-10-24', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '147 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Lumière Verte', '2024-11-05', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '24 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Lumière Verte', '2024-11-08', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '113 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Lumière Verte', '2024-11-17', 3, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '4 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Lumière Verte', '2024-11-23', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '62 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Lumière Verte', '2024-11-29', 3, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '151 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Lumière Verte', '2024-12-10', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '134 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Lumière Verte', '2024-12-14', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '199 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Lumière Verte', '2024-12-19', 1, 'meeting', 'cancelled', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Lumière Verte', '2024-12-27', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '160 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=42
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 42,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for PhotonEdge SARL', '2025-10-01', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '141 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for PhotonEdge SARL', '2025-10-10', 1, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '67 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for PhotonEdge SARL', '2025-10-11', 3, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '119 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for PhotonEdge SARL', '2025-10-18', 1, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '24 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for PhotonEdge SARL', '2025-10-25', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '106 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for PhotonEdge SARL', '2025-11-06', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '133 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for PhotonEdge SARL', '2025-11-13', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '26 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for PhotonEdge SARL', '2025-11-15', 3, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '75 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for PhotonEdge SARL', '2025-11-23', 4, 'call', 'in progress', 'project', project_id, NOW() - INTERVAL '92 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for PhotonEdge SARL', '2025-12-01', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '159 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for PhotonEdge SARL', '2025-12-12', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '94 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for PhotonEdge SARL', '2025-12-14', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '173 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for PhotonEdge SARL', '2025-12-21', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '6 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for PhotonEdge SARL', '2025-12-28', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '1 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for PhotonEdge SARL', '2026-01-08', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '171 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=43
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 43,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for NovaSun Group', '2024-08-17', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '60 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for NovaSun Group', '2024-08-26', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '43 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for NovaSun Group', '2024-09-03', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '8 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for NovaSun Group', '2024-09-06', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '173 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for NovaSun Group', '2024-09-15', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '51 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for NovaSun Group', '2024-09-23', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '178 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for NovaSun Group', '2024-10-01', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '35 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for NovaSun Group', '2024-10-07', 5, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '81 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for NovaSun Group', '2024-10-13', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '184 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for NovaSun Group', '2024-10-17', 3, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '80 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for NovaSun Group', '2024-10-24', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '158 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for NovaSun Group', '2024-11-04', 4, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '191 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for NovaSun Group', '2024-11-12', 3, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '127 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for NovaSun Group', '2024-11-19', 1, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '168 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for NovaSun Group', '2024-11-24', 5, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '9 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=44
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 44,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for GreenPower Tunisie', '2024-01-24', 1, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '46 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for GreenPower Tunisie', '2024-01-29', 5, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '59 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for GreenPower Tunisie', '2024-02-09', 2, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '47 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for GreenPower Tunisie', '2024-02-17', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '155 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for GreenPower Tunisie', '2024-02-21', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '17 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for GreenPower Tunisie', '2024-03-01', 1, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '13 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for GreenPower Tunisie', '2024-03-06', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '77 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for GreenPower Tunisie', '2024-03-17', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '113 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for GreenPower Tunisie', '2024-03-22', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '16 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for GreenPower Tunisie', '2024-03-27', 1, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for GreenPower Tunisie', '2024-04-04', 5, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '119 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for GreenPower Tunisie', '2024-04-14', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '51 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for GreenPower Tunisie', '2024-04-17', 3, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '191 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for GreenPower Tunisie', '2024-04-23', 3, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '102 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for GreenPower Tunisie', '2024-04-29', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '113 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=45
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 45,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Lumière Verte', '2025-01-10', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '90 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Lumière Verte', '2025-01-18', 3, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '103 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Lumière Verte', '2025-01-23', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '188 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Lumière Verte', '2025-01-29', 5, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '196 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Lumière Verte', '2025-02-05', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '130 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Lumière Verte', '2025-02-12', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '91 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Lumière Verte', '2025-02-20', 3, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '90 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Lumière Verte', '2025-02-27', 4, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '152 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Lumière Verte', '2025-03-06', 4, 'call', 'in progress', 'project', project_id, NOW() - INTERVAL '1 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Lumière Verte', '2025-03-13', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '142 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Lumière Verte', '2025-03-23', 2, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '75 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Lumière Verte', '2025-03-31', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '120 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Lumière Verte', '2025-04-02', 1, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '40 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Lumière Verte', '2025-04-10', 2, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '165 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Lumière Verte', '2025-04-17', 2, 'meeting', 'cancelled', 'project', project_id, NOW() - INTERVAL '26 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=46
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 46,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for SunFarm Holdings', '2025-12-06', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '42 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for SunFarm Holdings', '2025-12-12', 5, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '125 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for SunFarm Holdings', '2025-12-22', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '114 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for SunFarm Holdings', '2025-12-29', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '27 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for SunFarm Holdings', '2026-01-05', 3, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '162 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for SunFarm Holdings', '2026-01-10', 2, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '166 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for SunFarm Holdings', '2026-01-13', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '17 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for SunFarm Holdings', '2026-01-25', 3, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '40 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for SunFarm Holdings', '2026-02-02', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '16 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for SunFarm Holdings', '2026-02-04', 2, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '53 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for SunFarm Holdings', '2026-02-12', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '68 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for SunFarm Holdings', '2026-02-17', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '119 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for SunFarm Holdings', '2026-02-25', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '30 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for SunFarm Holdings', '2026-03-03', 3, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '192 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for SunFarm Holdings', '2026-03-15', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '200 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=47
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 47,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for PhotonEdge SARL', '2024-05-07', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '90 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for PhotonEdge SARL', '2024-05-19', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '106 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for PhotonEdge SARL', '2024-05-21', 3, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '107 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for PhotonEdge SARL', '2024-06-02', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '192 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for PhotonEdge SARL', '2024-06-07', 5, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '194 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for PhotonEdge SARL', '2024-06-16', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '105 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for PhotonEdge SARL', '2024-06-17', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '56 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for PhotonEdge SARL', '2024-06-28', 5, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '31 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for PhotonEdge SARL', '2024-07-03', 4, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '3 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for PhotonEdge SARL', '2024-07-13', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '162 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for PhotonEdge SARL', '2024-07-16', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '34 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for PhotonEdge SARL', '2024-07-27', 2, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '37 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for PhotonEdge SARL', '2024-08-03', 3, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '6 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for PhotonEdge SARL', '2024-08-10', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '134 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for PhotonEdge SARL', '2024-08-12', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '13 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=48
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 48,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for PhotonEdge SARL', '2024-10-23', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '74 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for PhotonEdge SARL', '2024-10-25', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '79 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for PhotonEdge SARL', '2024-11-07', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '177 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for PhotonEdge SARL', '2024-11-14', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '30 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for PhotonEdge SARL', '2024-11-15', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '77 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for PhotonEdge SARL', '2024-11-22', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '181 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for PhotonEdge SARL', '2024-11-30', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '102 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for PhotonEdge SARL', '2024-12-11', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '190 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for PhotonEdge SARL', '2024-12-16', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '31 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for PhotonEdge SARL', '2024-12-24', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '77 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for PhotonEdge SARL', '2024-12-30', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '99 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for PhotonEdge SARL', '2025-01-03', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '59 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for PhotonEdge SARL', '2025-01-13', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '83 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for PhotonEdge SARL', '2025-01-20', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '101 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for PhotonEdge SARL', '2025-01-28', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '72 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=49
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 49,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for BrightGrid Industries', '2025-03-23', 4, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '68 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for BrightGrid Industries', '2025-03-26', 4, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '100 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for BrightGrid Industries', '2025-04-03', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '155 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for BrightGrid Industries', '2025-04-09', 3, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '61 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for BrightGrid Industries', '2025-04-15', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '21 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for BrightGrid Industries', '2025-04-25', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '151 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for BrightGrid Industries', '2025-04-29', 1, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '104 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for BrightGrid Industries', '2025-05-11', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '97 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for BrightGrid Industries', '2025-05-19', 4, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '23 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for BrightGrid Industries', '2025-05-21', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '57 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for BrightGrid Industries', '2025-05-31', 2, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '155 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for BrightGrid Industries', '2025-06-05', 4, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '113 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for BrightGrid Industries', '2025-06-11', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '13 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for BrightGrid Industries', '2025-06-21', 4, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '79 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for BrightGrid Industries', '2025-06-24', 4, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '17 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=50
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 50,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for HelioTech SARL', '2024-07-01', 3, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '174 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for HelioTech SARL', '2024-07-08', 4, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '6 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for HelioTech SARL', '2024-07-15', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '77 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for HelioTech SARL', '2024-07-18', 5, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '127 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for HelioTech SARL', '2024-07-27', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '82 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for HelioTech SARL', '2024-08-06', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '96 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for HelioTech SARL', '2024-08-12', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '153 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for HelioTech SARL', '2024-08-18', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '66 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for HelioTech SARL', '2024-08-23', 5, 'call', 'in progress', 'project', project_id, NOW() - INTERVAL '166 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for HelioTech SARL', '2024-09-04', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '4 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for HelioTech SARL', '2024-09-11', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '93 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for HelioTech SARL', '2024-09-16', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '103 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for HelioTech SARL', '2024-09-21', 1, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '48 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for HelioTech SARL', '2024-09-26', 2, 'meeting', 'cancelled', 'project', project_id, NOW() - INTERVAL '101 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for HelioTech SARL', '2024-10-06', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '96 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=51
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 51,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Atlas Renewables', '2025-10-29', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '190 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Atlas Renewables', '2025-11-05', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '104 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Atlas Renewables', '2025-11-12', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '103 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Atlas Renewables', '2025-11-18', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '49 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Atlas Renewables', '2025-11-24', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '132 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Atlas Renewables', '2025-12-04', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '143 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Atlas Renewables', '2025-12-08', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '21 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Atlas Renewables', '2025-12-13', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '184 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Atlas Renewables', '2025-12-23', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '93 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Atlas Renewables', '2026-01-01', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '118 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Atlas Renewables', '2026-01-05', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '80 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Atlas Renewables', '2026-01-13', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '48 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Atlas Renewables', '2026-01-22', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '172 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Atlas Renewables', '2026-01-24', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '23 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Atlas Renewables', '2026-01-31', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '136 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=52
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 52,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for TerraWatt SA', '2024-12-21', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '87 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for TerraWatt SA', '2025-01-02', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '135 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for TerraWatt SA', '2025-01-04', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '184 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for TerraWatt SA', '2025-01-14', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '85 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for TerraWatt SA', '2025-01-23', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '78 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for TerraWatt SA', '2025-01-24', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '53 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for TerraWatt SA', '2025-02-03', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '112 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for TerraWatt SA', '2025-02-08', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '120 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for TerraWatt SA', '2025-02-14', 4, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '162 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for TerraWatt SA', '2025-02-24', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '25 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for TerraWatt SA', '2025-03-01', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '65 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for TerraWatt SA', '2025-03-08', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '152 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for TerraWatt SA', '2025-03-14', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '182 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for TerraWatt SA', '2025-03-24', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '171 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for TerraWatt SA', '2025-04-01', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '64 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=53
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 53,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for CapSolar Investments', '2025-01-24', 3, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '147 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for CapSolar Investments', '2025-02-06', 5, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '6 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for CapSolar Investments', '2025-02-11', 2, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '103 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for CapSolar Investments', '2025-02-18', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '69 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for CapSolar Investments', '2025-02-22', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '24 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for CapSolar Investments', '2025-03-04', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '50 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for CapSolar Investments', '2025-03-07', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '96 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for CapSolar Investments', '2025-03-16', 3, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '181 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for CapSolar Investments', '2025-03-26', 3, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '111 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for CapSolar Investments', '2025-03-31', 4, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '120 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for CapSolar Investments', '2025-04-04', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '45 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for CapSolar Investments', '2025-04-16', 2, 'visit', 'in progress', 'project', project_id, NOW() - INTERVAL '54 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for CapSolar Investments', '2025-04-21', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '49 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for CapSolar Investments', '2025-04-28', 1, 'meeting', 'cancelled', 'project', project_id, NOW() - INTERVAL '162 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for CapSolar Investments', '2025-05-03', 4, 'meeting', 'open', 'project', project_id, NOW() - INTERVAL '20 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=54
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 54,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Atlas Renewables', '2025-02-01', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '124 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Atlas Renewables', '2025-02-11', 2, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '36 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Atlas Renewables', '2025-02-16', 3, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '79 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Atlas Renewables', '2025-02-25', 1, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '166 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Atlas Renewables', '2025-03-03', 1, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '156 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Atlas Renewables', '2025-03-09', 2, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '86 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Atlas Renewables', '2025-03-15', 1, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '109 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Atlas Renewables', '2025-03-27', 4, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '96 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Atlas Renewables', '2025-04-02', 3, 'call', 'cancelled', 'project', project_id, NOW() - INTERVAL '4 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Atlas Renewables', '2025-04-08', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '17 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Atlas Renewables', '2025-04-12', 4, 'visit', 'cancelled', 'project', project_id, NOW() - INTERVAL '26 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Atlas Renewables', '2025-04-22', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '130 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Atlas Renewables', '2025-05-01', 5, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '121 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Atlas Renewables', '2025-05-03', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '108 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Atlas Renewables', '2025-05-15', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '122 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=55
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 55,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for SolarMed SARL', '2025-06-30', 5, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '120 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for SolarMed SARL', '2025-07-07', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '158 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for SolarMed SARL', '2025-07-14', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '61 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for SolarMed SARL', '2025-07-23', 1, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '111 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for SolarMed SARL', '2025-07-30', 4, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '78 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for SolarMed SARL', '2025-08-07', 3, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '171 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for SolarMed SARL', '2025-08-11', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '196 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for SolarMed SARL', '2025-08-21', 2, 'follow-up', 'open', 'project', project_id, NOW() - INTERVAL '68 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for SolarMed SARL', '2025-08-26', 2, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '191 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for SolarMed SARL', '2025-09-03', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '37 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for SolarMed SARL', '2025-09-07', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '133 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for SolarMed SARL', '2025-09-14', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '45 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for SolarMed SARL', '2025-09-22', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '136 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for SolarMed SARL', '2025-09-30', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '32 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for SolarMed SARL', '2025-10-10', 1, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '102 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=56
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 56,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Atlas Renewables', '2024-01-12', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '175 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Atlas Renewables', '2024-01-18', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '84 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Atlas Renewables', '2024-01-22', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '40 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Atlas Renewables', '2024-01-30', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '78 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Atlas Renewables', '2024-02-07', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '149 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Atlas Renewables', '2024-02-10', 4, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '130 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Atlas Renewables', '2024-02-23', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '125 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Atlas Renewables', '2024-03-01', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '56 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Atlas Renewables', '2024-03-03', 3, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '59 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Atlas Renewables', '2024-03-09', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '67 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Atlas Renewables', '2024-03-16', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '198 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Atlas Renewables', '2024-03-26', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '84 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Atlas Renewables', '2024-04-05', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '48 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Atlas Renewables', '2024-04-08', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '176 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Atlas Renewables', '2024-04-14', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '115 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=57
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 57,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Atlas Renewables', '2025-06-27', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '155 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Atlas Renewables', '2025-07-06', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '35 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Atlas Renewables', '2025-07-13', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '39 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Atlas Renewables', '2025-07-17', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '173 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Atlas Renewables', '2025-07-29', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '52 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Atlas Renewables', '2025-08-05', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '197 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Atlas Renewables', '2025-08-06', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '83 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Atlas Renewables', '2025-08-13', 3, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '198 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Atlas Renewables', '2025-08-25', 4, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '139 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Atlas Renewables', '2025-08-28', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '28 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Atlas Renewables', '2025-09-03', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '103 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Atlas Renewables', '2025-09-11', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '54 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Atlas Renewables', '2025-09-17', 1, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '24 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Atlas Renewables', '2025-09-29', 4, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '22 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Atlas Renewables', '2025-10-02', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '117 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=58
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 58,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Mediterra Energy', '2024-09-14', 4, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '30 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Mediterra Energy', '2024-09-18', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '62 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Mediterra Energy', '2024-09-28', 3, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '117 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Mediterra Energy', '2024-10-03', 1, 'follow-up', 'in progress', 'project', project_id, NOW() - INTERVAL '75 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Mediterra Energy', '2024-10-12', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '55 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Mediterra Energy', '2024-10-16', 2, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '164 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Mediterra Energy', '2024-10-24', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '23 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Mediterra Energy', '2024-10-28', 5, 'follow-up', 'cancelled', 'project', project_id, NOW() - INTERVAL '114 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Mediterra Energy', '2024-11-07', 3, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '102 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Mediterra Energy', '2024-11-15', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '131 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Mediterra Energy', '2024-11-21', 4, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '88 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Mediterra Energy', '2024-11-25', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '163 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Mediterra Energy', '2024-12-05', 2, 'visit', 'open', 'project', project_id, NOW() - INTERVAL '79 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Mediterra Energy', '2024-12-11', 3, 'meeting', 'in progress', 'project', project_id, NOW() - INTERVAL '115 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Mediterra Energy', '2024-12-22', 5, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '123 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=59
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 59,15,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Initial customer consultation', 'Initial customer consultation for Atlas Renewables', '2025-11-01', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '36 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Roof structural assessment', 'Roof structural assessment for Atlas Renewables', '2025-11-05', 3, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '164 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Energy consumption analysis', 'Energy consumption analysis for Atlas Renewables', '2025-11-15', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '106 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,3,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'System sizing and design', 'System sizing and design for Atlas Renewables', '2025-11-23', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '71 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,4,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Generate 3D shading simulation', 'Generate 3D shading simulation for Atlas Renewables', '2025-12-01', 5, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '128 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,5,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Prepare technical proposal', 'Prepare technical proposal for Atlas Renewables', '2025-12-04', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '110 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,6,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Submit STEG grid-connection request', 'Submit STEG grid-connection request for Atlas Renewables', '2025-12-15', 1, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '120 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,7,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Order PV modules and inverters', 'Order PV modules and inverters for Atlas Renewables', '2025-12-19', 2, 'follow-up', 'completed', 'project', project_id, NOW() - INTERVAL '179 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,8,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Schedule installation crew', 'Schedule installation crew for Atlas Renewables', '2025-12-29', 1, 'call', 'completed', 'project', project_id, NOW() - INTERVAL '23 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,9,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Mount rails and PV panels', 'Mount rails and PV panels for Atlas Renewables', '2026-01-04', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '80 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,10,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Install inverter and DC/AC wiring', 'Install inverter and DC/AC wiring for Atlas Renewables', '2026-01-09', 2, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '107 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,11,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Battery installation and configuration', 'Battery installation and configuration for Atlas Renewables', '2026-01-15', 5, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '170 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,12,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Commissioning and performance test', 'Commissioning and performance test for Atlas Renewables', '2026-01-25', 4, 'visit', 'completed', 'project', project_id, NOW() - INTERVAL '163 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,13,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Customer training on monitoring app', 'Customer training on monitoring app for Atlas Renewables', '2026-01-30', 3, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '100 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,14,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "ProjectTasks"("TenantId","Title","Description","DueDate","AssignedUserId","TaskType","Status","RelatedEntityType","RelatedEntityId","CreatedDate","CreatedBy")
  SELECT 1, 'Hand-over and warranty registration', 'Hand-over and warranty registration for Atlas Renewables', '2026-02-03', 2, 'meeting', 'completed', 'project', project_id, NOW() - INTERVAL '18 days', 'seed:solar'
  FROM _seed_proj_map WHERE idx=60
  RETURNING "Id"
) INSERT INTO _seed_task_map(proj_idx,task_idx,task_id) SELECT 60,15,"Id" FROM ins;

-- ---------- TASK COMMENTS (3 per task) ----------
INSERT INTO "TaskComments"("TenantId","ProjectTaskId","Content","AuthorId","AuthorName","CreatedAt","CreatedBy")
SELECT 1, task_id,
  (ARRAY['Confirmed with client by phone.', 'Pending material delivery from supplier.', 'Inspection passed without observations.', 'Re-scheduled due to weather conditions.', 'Crew reports completion ahead of schedule.', 'Customer expressed full satisfaction.', 'Need to coordinate with STEG technician.', 'Updated CAD drawings uploaded.'])[1 + (random()*7)::int],
  1 + (random()*4)::int,
  'seed:solar bot',
  NOW() - (random()*180 || ' days')::interval,
  'seed:solar'
FROM _seed_task_map, generate_series(1,3);

-- ---------- TASK TIME ENTRIES (3 per task) ----------
INSERT INTO "TaskTimeEntries"("TenantId","TaskId","UserId","Hours","Description","EntryDate","CreatedAt","CreatedBy")
SELECT 1, task_id,
  1 + (random()*4)::int,
  ROUND((0.5 + random()*7.5)::numeric, 2),
  'Field work and reporting',
  CURRENT_DATE - (random()*120)::int,
  NOW(),
  'seed:solar'
FROM _seed_task_map, generate_series(1,3);

-- ---------- TASK CHECKLISTS (2 per project, 8 items each) ----------
CREATE TEMP TABLE _seed_chk_map (proj_idx INT, chk_idx INT, checklist_id INT);

WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for Atlas Renewables', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=1 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 1,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Atlas Renewables', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=1 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 1,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for PhotonEdge SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=2 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 2,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for PhotonEdge SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=2 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 2,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for HelioTech SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=3 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 3,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for HelioTech SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=3 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 3,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for SolarMed SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=4 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 4,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for SolarMed SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=4 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 4,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for TerraWatt SA', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=5 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 5,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for TerraWatt SA', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=5 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 5,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for Sahara Solar Co', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=6 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 6,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Sahara Solar Co', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=6 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 6,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for NovaSun Group', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=7 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 7,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for NovaSun Group', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=7 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 7,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for CapSolar Investments', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=8 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 8,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for CapSolar Investments', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=8 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 8,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for HelioTech SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=9 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 9,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for HelioTech SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=9 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 9,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for SunFarm Holdings', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=10 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 10,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for SunFarm Holdings', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=10 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 10,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for Mediterra Energy', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=11 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 11,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Mediterra Energy', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=11 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 11,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for HelioTech SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=12 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 12,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for HelioTech SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=12 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 12,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for NovaSun Group', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=13 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 13,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for NovaSun Group', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=13 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 13,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for BrightGrid Industries', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=14 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 14,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for BrightGrid Industries', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=14 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 14,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for BrightGrid Industries', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=15 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 15,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for BrightGrid Industries', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=15 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 15,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for Mediterra Energy', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=16 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 16,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Mediterra Energy', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=16 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 16,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for SunFarm Holdings', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=17 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 17,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for SunFarm Holdings', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=17 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 17,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for GreenPower Tunisie', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=18 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 18,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for GreenPower Tunisie', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=18 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 18,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for GreenPower Tunisie', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=19 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 19,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for GreenPower Tunisie', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=19 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 19,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for EcoEnergie SA', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=20 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 20,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for EcoEnergie SA', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=20 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 20,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for CapSolar Investments', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=21 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 21,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for CapSolar Investments', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=21 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 21,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Mediterra Energy', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=22 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 22,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for Mediterra Energy', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=22 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 22,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for Mediterra Energy', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=23 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 23,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Mediterra Energy', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=23 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 23,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for SolarMed SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=24 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 24,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for SolarMed SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=24 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 24,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for Mediterra Energy', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=25 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 25,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Mediterra Energy', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=25 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 25,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for SunFarm Holdings', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=26 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 26,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for SunFarm Holdings', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=26 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 26,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for GreenPower Tunisie', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=27 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 27,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for GreenPower Tunisie', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=27 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 27,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for CapSolar Investments', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=28 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 28,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for CapSolar Investments', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=28 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 28,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for GreenPower Tunisie', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=29 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 29,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for GreenPower Tunisie', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=29 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 29,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for GreenPower Tunisie', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=30 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 30,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for GreenPower Tunisie', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=30 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 30,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for SolarMed SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=31 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 31,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for SolarMed SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=31 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 31,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for SolarMed SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=32 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 32,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for SolarMed SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=32 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 32,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Mediterra Energy', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=33 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 33,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for Mediterra Energy', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=33 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 33,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Voltaic Partners', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=34 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 34,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for Voltaic Partners', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=34 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 34,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for SunFarm Holdings', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=35 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 35,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for SunFarm Holdings', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=35 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 35,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Atlas Renewables', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=36 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 36,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Atlas Renewables', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=36 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 36,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for Sahara Solar Co', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=37 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 37,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Sahara Solar Co', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=37 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 37,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Mediterra Energy', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=38 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 38,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for Mediterra Energy', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=38 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 38,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for EcoEnergie SA', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=39 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 39,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for EcoEnergie SA', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=39 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 39,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for CapSolar Investments', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=40 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 40,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for CapSolar Investments', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=40 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 40,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Sahara Solar Co', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=41 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 41,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Sahara Solar Co', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=41 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 41,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for Lumière Verte', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=42 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 42,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Lumière Verte', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=42 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 42,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for PhotonEdge SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=43 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 43,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for PhotonEdge SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=43 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 43,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for NovaSun Group', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=44 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 44,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for NovaSun Group', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=44 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 44,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for GreenPower Tunisie', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=45 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 45,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for GreenPower Tunisie', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=45 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 45,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Lumière Verte', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=46 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 46,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Lumière Verte', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=46 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 46,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for SunFarm Holdings', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=47 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 47,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for SunFarm Holdings', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=47 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 47,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for PhotonEdge SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=48 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 48,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for PhotonEdge SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=48 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 48,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for PhotonEdge SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=49 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 49,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for PhotonEdge SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=49 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 49,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for BrightGrid Industries', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=50 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 50,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for BrightGrid Industries', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=50 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 50,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for HelioTech SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=51 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 51,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for HelioTech SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=51 AND task_idx=15
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 51,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for Atlas Renewables', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=52 AND task_idx=10
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 52,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Atlas Renewables', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=52 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 52,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for TerraWatt SA', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=53 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 53,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for TerraWatt SA', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=53 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 53,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for CapSolar Investments', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=54 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 54,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for CapSolar Investments', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=54 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 54,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for Atlas Renewables', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=55 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 55,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for Atlas Renewables', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=55 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 55,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for SolarMed SARL', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=56 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 56,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for SolarMed SARL', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=56 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 56,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Atlas Renewables', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=57 AND task_idx=12
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 57,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Atlas Renewables', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=57 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 57,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Pre-installation Safety Checklist', 'Solar installation – Pre-installation Safety Checklist for Atlas Renewables', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=58 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 58,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Atlas Renewables', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=58 AND task_idx=14
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 58,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Site Survey Checklist', 'Solar installation – Site Survey Checklist for Mediterra Energy', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=59 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 59,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Mediterra Energy', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=59 AND task_idx=13
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 59,2,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Handover & Documentation Checklist', 'Solar installation – Handover & Documentation Checklist for Atlas Renewables', TRUE, 1, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=60 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 60,1,"Id" FROM ins;
WITH ins AS (
  INSERT INTO "TaskChecklists"("TenantId","ProjectTaskId","Title","Description","IsExpanded","SortOrder","CreatedDate","CreatedBy")
  SELECT 1, task_id, 'Commissioning & QA Checklist', 'Solar installation – Commissioning & QA Checklist for Atlas Renewables', TRUE, 2, NOW(), 'seed:solar'
  FROM _seed_task_map WHERE proj_idx=60 AND task_idx=11
  RETURNING "Id"
) INSERT INTO _seed_chk_map(proj_idx,chk_idx,checklist_id) SELECT 60,2,"Id" FROM ins;
INSERT INTO "TaskChecklistItems"("TenantId","ChecklistId","Title","IsCompleted","CompletedAt","CompletedById","CompletedByName","SortOrder","CreatedDate","CreatedBy")
SELECT 1, checklist_id,
  (ARRAY['Verify PPE for all crew', 'Check scaffolding and harnesses', 'Confirm DC isolator labels', 'Measure string voltages', 'Inspect torque on MC4 connectors', 'Test earthing continuity', 'Validate inverter firmware version', 'Capture as-built photos', 'Upload monitoring portal credentials', 'Sign customer acceptance form'])[1 + ((g-1) % 10)],
  (random() < 0.6),
  CASE WHEN random() < 0.6 THEN NOW() - (random()*60 || ' days')::interval ELSE NULL END,
  1 + (random()*4)::int,
  'seed:solar tech',
  g,
  NOW(),
  'seed:solar'
FROM _seed_chk_map, generate_series(1,8) AS g;

-- ---------- TASK ATTACHMENTS (3 per project) ----------
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/1/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '26 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=1 AND task_idx=4 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/1/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '64 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=1 AND task_idx=15 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/1/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '64 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=1 AND task_idx=1 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/2/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '61 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=2 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/2/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '138 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=2 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/2/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '127 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=2 AND task_idx=6 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/3/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '15 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=3 AND task_idx=4 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/3/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '171 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=3 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/3/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '60 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=3 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/4/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '88 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=4 AND task_idx=1 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/4/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '22 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=4 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/4/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '90 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=4 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/5/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '136 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=5 AND task_idx=15 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/5/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '45 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=5 AND task_idx=13 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/5/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '162 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=5 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/6/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '33 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=6 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/6/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '56 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=6 AND task_idx=10 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/6/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '86 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=6 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/7/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '102 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=7 AND task_idx=4 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/7/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '89 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=7 AND task_idx=1 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/7/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '126 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=7 AND task_idx=15 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/8/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '140 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=8 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/8/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '31 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=8 AND task_idx=12 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/8/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '118 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=8 AND task_idx=13 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/9/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '87 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=9 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/9/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '27 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=9 AND task_idx=4 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/9/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '144 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=9 AND task_idx=12 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/10/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '21 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=10 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/10/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '27 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=10 AND task_idx=13 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/10/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '139 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=10 AND task_idx=1 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/11/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '119 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=11 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/11/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '70 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=11 AND task_idx=13 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/11/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '88 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=11 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/12/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '46 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=12 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/12/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '53 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=12 AND task_idx=14 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/12/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '89 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=12 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/13/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '17 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=13 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/13/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '22 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=13 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/13/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '12 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=13 AND task_idx=10 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/14/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '125 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=14 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/14/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '153 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=14 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/14/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '65 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=14 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/15/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '70 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=15 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/15/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '11 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=15 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/15/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '35 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=15 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/16/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '63 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=16 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/16/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '8 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=16 AND task_idx=15 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/16/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '163 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=16 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/17/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '106 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=17 AND task_idx=6 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/17/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '1 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=17 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/17/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '108 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=17 AND task_idx=12 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/18/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '128 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=18 AND task_idx=10 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/18/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '11 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=18 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/18/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '179 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=18 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/19/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '45 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=19 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/19/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '132 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=19 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/19/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '34 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=19 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/20/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '22 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=20 AND task_idx=4 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/20/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '30 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=20 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/20/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '166 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=20 AND task_idx=6 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/21/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '137 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=21 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/21/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '47 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=21 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/21/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '56 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=21 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/22/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '60 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=22 AND task_idx=6 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/22/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '59 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=22 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/22/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '13 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=22 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/23/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '123 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=23 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/23/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '169 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=23 AND task_idx=12 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/23/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '55 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=23 AND task_idx=13 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/24/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '163 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=24 AND task_idx=4 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/24/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '37 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=24 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/24/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '175 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=24 AND task_idx=10 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/25/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '43 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=25 AND task_idx=1 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/25/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '89 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=25 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/25/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '54 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=25 AND task_idx=13 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/26/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '54 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=26 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/26/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '28 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=26 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/26/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '86 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=26 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/27/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '13 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=27 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/27/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '69 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=27 AND task_idx=10 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/27/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '2 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=27 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/28/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '34 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=28 AND task_idx=6 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/28/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '110 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=28 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/28/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '108 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=28 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/29/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '133 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=29 AND task_idx=6 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/29/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '133 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=29 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/29/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '38 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=29 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/30/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '156 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=30 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/30/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '113 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=30 AND task_idx=1 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/30/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '83 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=30 AND task_idx=12 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/31/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '115 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=31 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/31/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '152 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=31 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/31/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '94 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=31 AND task_idx=1 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/32/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '39 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=32 AND task_idx=14 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/32/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '14 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=32 AND task_idx=12 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/32/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '74 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=32 AND task_idx=14 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/33/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '15 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=33 AND task_idx=15 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/33/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '61 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=33 AND task_idx=14 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/33/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '172 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=33 AND task_idx=4 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/34/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '121 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=34 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/34/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '100 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=34 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/34/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '60 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=34 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/35/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '152 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=35 AND task_idx=14 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/35/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '118 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=35 AND task_idx=15 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/35/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '38 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=35 AND task_idx=1 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/36/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '18 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=36 AND task_idx=12 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/36/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '114 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=36 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/36/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '149 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=36 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/37/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '151 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=37 AND task_idx=1 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/37/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '108 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=37 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/37/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '64 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=37 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/38/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '113 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=38 AND task_idx=6 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/38/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '56 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=38 AND task_idx=10 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/38/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '84 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=38 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/39/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '133 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=39 AND task_idx=6 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/39/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '17 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=39 AND task_idx=6 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/39/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '156 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=39 AND task_idx=1 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/40/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '160 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=40 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/40/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '164 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=40 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/40/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '88 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=40 AND task_idx=14 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/41/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '83 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=41 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/41/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '53 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=41 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/41/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '79 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=41 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/42/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '66 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=42 AND task_idx=15 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/42/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '150 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=42 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/42/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '71 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=42 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/43/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '180 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=43 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/43/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '55 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=43 AND task_idx=15 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/43/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '156 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=43 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/44/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '55 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=44 AND task_idx=12 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/44/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '86 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=44 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/44/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '102 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=44 AND task_idx=14 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/45/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '102 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=45 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/45/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '94 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=45 AND task_idx=15 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/45/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '13 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=45 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/46/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '86 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=46 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/46/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '53 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=46 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/46/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '70 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=46 AND task_idx=14 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/47/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '179 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=47 AND task_idx=14 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/47/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '118 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=47 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/47/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '135 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=47 AND task_idx=10 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'panel_datasheet.pdf', '/uploads/solar/48/panel_datasheet.pdf', 812330, 'application/pdf', NOW() - INTERVAL '165 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=48 AND task_idx=6 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/48/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '175 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=48 AND task_idx=13 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/48/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '140 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=48 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/49/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '111 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=49 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/49/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '18 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=49 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/49/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '24 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=49 AND task_idx=4 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/50/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '141 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=50 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/50/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '84 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=50 AND task_idx=10 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/50/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '64 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=50 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/51/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '174 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=51 AND task_idx=13 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/51/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '179 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=51 AND task_idx=13 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/51/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '14 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=51 AND task_idx=12 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/52/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '6 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=52 AND task_idx=3 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/52/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '145 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=52 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/52/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '136 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=52 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/53/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '126 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=53 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/53/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '88 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=53 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/53/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '12 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=53 AND task_idx=14 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/54/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '102 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=54 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/54/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '92 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=54 AND task_idx=13 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/54/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '142 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=54 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/55/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '155 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=55 AND task_idx=11 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/55/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '175 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=55 AND task_idx=6 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/55/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '73 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=55 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/56/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '60 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=56 AND task_idx=13 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/56/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '12 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=56 AND task_idx=2 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'site_survey.pdf', '/uploads/solar/56/site_survey.pdf', 482311, 'application/pdf', NOW() - INTERVAL '157 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=56 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/57/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '168 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=57 AND task_idx=7 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/57/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '87 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=57 AND task_idx=15 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/57/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '69 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=57 AND task_idx=4 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/58/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '169 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=58 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'drone_thermal.jpg', '/uploads/solar/58/drone_thermal.jpg', 2450112, 'image/jpeg', NOW() - INTERVAL '131 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=58 AND task_idx=5 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/58/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '46 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=58 AND task_idx=10 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'electrical_diagram.dwg', '/uploads/solar/59/electrical_diagram.dwg', 1240092, 'application/acad', NOW() - INTERVAL '8 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=59 AND task_idx=4 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/59/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '95 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=59 AND task_idx=9 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'invoice_materials.pdf', '/uploads/solar/59/invoice_materials.pdf', 211450, 'application/pdf', NOW() - INTERVAL '132 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=59 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'permit_steg.pdf', '/uploads/solar/60/permit_steg.pdf', 302118, 'application/pdf', NOW() - INTERVAL '108 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=60 AND task_idx=15 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'inverter_datasheet.pdf', '/uploads/solar/60/inverter_datasheet.pdf', 712100, 'application/pdf', NOW() - INTERVAL '149 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=60 AND task_idx=8 LIMIT 1;
INSERT INTO "TaskAttachments"("TenantId","TaskId","FileName","FilePath","FileSize","ContentType","UploadedDate","UploadedBy")
SELECT 1, task_id, 'commissioning_report.pdf', '/uploads/solar/60/commissioning_report.pdf', 980220, 'application/pdf', NOW() - INTERVAL '43 days', 'seed:solar'
FROM _seed_task_map WHERE proj_idx=60 AND task_idx=1 LIMIT 1;

-- ---------- VERIFICATION ----------
SELECT 'Projects'           AS entity, COUNT(*) FROM "Projects"           WHERE "CreatedBy" = 'seed:solar'
UNION ALL SELECT 'ProjectColumns',     COUNT(*) FROM "ProjectColumns"     WHERE "ProjectId" IN (SELECT "Id" FROM "Projects" WHERE "CreatedBy"='seed:solar')
UNION ALL SELECT 'ProjectNotes',       COUNT(*) FROM "ProjectNotes"       WHERE "CreatedBy" = 'seed:solar'
UNION ALL SELECT 'ProjectActivities',  COUNT(*) FROM "ProjectActivities"  WHERE "CreatedBy" = 'seed:solar'
UNION ALL SELECT 'ProjectTasks',       COUNT(*) FROM "ProjectTasks"       WHERE "CreatedBy" = 'seed:solar'
UNION ALL SELECT 'TaskComments',       COUNT(*) FROM "TaskComments"       WHERE "CreatedBy" = 'seed:solar'
UNION ALL SELECT 'TaskTimeEntries',    COUNT(*) FROM "TaskTimeEntries"    WHERE "CreatedBy" = 'seed:solar'
UNION ALL SELECT 'TaskChecklists',     COUNT(*) FROM "TaskChecklists"     WHERE "CreatedBy" = 'seed:solar'
UNION ALL SELECT 'TaskChecklistItems', COUNT(*) FROM "TaskChecklistItems" WHERE "CreatedBy" = 'seed:solar'
UNION ALL SELECT 'TaskAttachments',    COUNT(*) FROM "TaskAttachments"    WHERE "UploadedBy" = 'seed:solar';

COMMIT;