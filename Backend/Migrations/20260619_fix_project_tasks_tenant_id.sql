-- Align ProjectTasks.TenantId with parent Projects row so per_company filters return tasks.
-- Run once on databases where tasks were inserted with TenantId=0 but belong to a project.

UPDATE "ProjectTasks" AS pt
SET "TenantId" = p."TenantId"
FROM "Projects" AS p
WHERE LOWER(pt."RelatedEntityType") = 'project'
  AND pt."RelatedEntityId" = p."Id"
  AND pt."TenantId" IS DISTINCT FROM p."TenantId";
