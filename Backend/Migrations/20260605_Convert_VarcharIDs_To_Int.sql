-- Migration: Convert varchar ID/FK columns to integer where EF expects int
-- Generated: 2026-06-05
-- WARNING: Review the non-numeric reports before running the conversion section.
-- Run this file in psql against the tenant database.

-- =====================================================
-- 1) Report candidate FK columns where FK is varchar and referenced PK is integer
-- =====================================================
WITH fk_info AS (
  SELECT
    fk.constraint_name AS fk_constraint,
    fk.table_name AS fk_table,
    fk.column_name AS fk_column,
    pk.table_name AS pk_table,
    pk.column_name AS pk_column
  FROM
    information_schema.key_column_usage fk
    JOIN information_schema.referential_constraints rc ON fk.constraint_name = rc.constraint_name AND fk.constraint_schema = rc.constraint_schema
    JOIN information_schema.key_column_usage pk ON rc.unique_constraint_name = pk.constraint_name AND fk.ordinal_position = pk.ordinal_position AND fk.constraint_schema = pk.constraint_schema
  WHERE
    fk.constraint_schema = 'public'
),
fk_type_mismatch AS (
  SELECT
    f.*,
    (SELECT data_type FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name = f.fk_table AND c.column_name = f.fk_column) AS fk_data_type,
    (SELECT data_type FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name = f.pk_table AND c.column_name = f.pk_column) AS pk_data_type
  FROM fk_info f
)
SELECT * FROM fk_type_mismatch WHERE fk_data_type = 'character varying' AND pk_data_type = 'integer';

-- =====================================================
-- 2) For each row returned above, run the following (replace names):
--    SELECT <fk_column> FROM public."<fk_table>" WHERE <fk_column> IS NOT NULL AND NOT (<fk_column> ~ '^[0-9]+$') LIMIT 100;
-- This shows up to 100 non-numeric values that must be fixed manually before conversion.
-- =====================================================

-- =====================================================
-- 3) Automatic conversion: for each FK candidate with only numeric values,
--    this DO block drops the FK constraint, ALTERs the column to integer using a safe cast,
--    and recreates a minimal FK constraint with the same name.
--    If any non-numeric values exist the script will skip that column and WARN.
-- NOTE: this recreates a simple FK (no ON DELETE/ON UPDATE clauses).
-- =====================================================
DO
$$
DECLARE
  rec RECORD;
  nonnum_count int;
  ddl text;
BEGIN
  FOR rec IN
    SELECT
      fk.constraint_name AS fk_constraint,
      fk.table_name AS fk_table,
      fk.column_name AS fk_column,
      pk.table_name AS pk_table,
      pk.column_name AS pk_column
    FROM
      information_schema.key_column_usage fk
      JOIN information_schema.referential_constraints rc ON fk.constraint_name = rc.constraint_name AND fk.constraint_schema = rc.constraint_schema
      JOIN information_schema.key_column_usage pk ON rc.unique_constraint_name = pk.constraint_name AND fk.ordinal_position = pk.ordinal_position AND fk.constraint_schema = pk.constraint_schema
    WHERE
      fk.constraint_schema = 'public'
      AND (SELECT data_type FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name = fk.table_name AND c.column_name = fk.column_name) = 'character varying'
      AND (SELECT data_type FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name = pk.table_name AND c.column_name = pk.column_name) = 'integer'
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I IS NOT NULL AND NOT (%I ~ ''^[0-9]+$'')', rec.fk_table, rec.fk_column, rec.fk_column) INTO nonnum_count;
    RAISE NOTICE 'Checking % - non-numeric count = %', rec.fk_table||'.'||rec.fk_column, nonnum_count;

    IF nonnum_count > 0 THEN
      RAISE WARNING 'Column %I.%I contains non-numeric values (%). Skipping automatic conversion. Inspect and fix those values before conversion.', rec.fk_table, rec.fk_column, nonnum_count;
    ELSE
      -- Drop FK constraint
      ddl := format('ALTER TABLE public.%I DROP CONSTRAINT %I;', rec.fk_table, rec.fk_constraint);
      RAISE NOTICE 'Dropping constraint: %', ddl;
      EXECUTE ddl;

      -- Alter column type to integer (safe cast; empty strings become NULL)
      ddl := format('ALTER TABLE public.%I ALTER COLUMN %I TYPE integer USING CASE WHEN %I = '''' THEN NULL ELSE %I::integer END;', rec.fk_table, rec.fk_column, rec.fk_column, rec.fk_column);
      RAISE NOTICE 'Altering column type: %', ddl;
      EXECUTE ddl;

      -- Recreate FK (minimal)
      ddl := format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(%I);', rec.fk_table, rec.fk_constraint, rec.fk_column, rec.pk_table, rec.pk_column);
      RAISE NOTICE 'Recreating FK constraint (minimal): %', ddl;
      EXECUTE ddl;

      RAISE NOTICE 'Converted %I.%I to integer and recreated FK %I -> %I.%I', rec.fk_table, rec.fk_column, rec.fk_constraint, rec.pk_table, rec.pk_column;
    END IF;
  END LOOP;
END
$$;

-- =====================================================
-- 4) Report any PRIMARY KEY columns that are still varchar but are referenced
--    by integer FKs (manual PK conversion required).
-- =====================================================
SELECT
  t.table_name,
  c.column_name,
  c.data_type
FROM
  information_schema.table_constraints t
  JOIN information_schema.constraint_column_usage u ON t.constraint_name = u.constraint_name AND t.constraint_schema = u.constraint_schema
  JOIN information_schema.columns c ON c.table_schema = u.table_schema AND c.table_name = u.table_name AND c.column_name = u.column_name
WHERE
  t.constraint_type = 'PRIMARY KEY'
  AND c.data_type = 'character varying'
  AND EXISTS (
    SELECT 1 FROM information_schema.key_column_usage k
    JOIN information_schema.referential_constraints rc ON k.constraint_name = rc.constraint_name AND k.constraint_schema = rc.constraint_schema
    WHERE rc.unique_constraint_name = t.constraint_name AND rc.constraint_schema = t.constraint_schema
      AND (SELECT data_type FROM information_schema.columns cc WHERE cc.table_schema = k.table_schema AND cc.table_name = k.table_name AND cc.column_name = k.column_name) = 'integer'
  );

-- =====================================================
-- 5) Manual PK conversion notes (if any PKs found above):
--    - Ensure referencing FK columns were converted to integer first (step 3).
--    - Add a temporary integer column, populate from old varchar PK using a safe cast, verify no NULLs,
--      create sequence and default if desired, swap columns and recreate PK and FKs.
--    - Back up DB and test on staging first.
-- =====================================================

-- Final: Re-run the report in section (1) to ensure no remaining varchar->int mismatches.
