-- Trilingual lookup labels: `label` stays the default (FR) wording,
-- `label_en` / `label_ar` are optional overrides resolved client-side
-- from the current UI language (same pattern as cause labels).
alter table if exists public.oas_lookup_values
  add column if not exists label_en text,
  add column if not exists label_ar text;
