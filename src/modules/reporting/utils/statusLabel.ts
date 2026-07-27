// ============================================================================
// Reporting — Shared status label translator
// Resolves backend status strings (any casing / language / alias) to the
// user's translated status label, using the centralized entity-status configs
// as the single source of truth. Falls back to a title-cased version of the
// original value when no config matches.
// ============================================================================

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { entityStatusConfigs, allEntityTypes } from '@/config/entity-statuses';

/** Normalize an arbitrary status label ("In Progress", "IN-PROGRESS") to a canonical id ("in_progress"). */
const normalize = (raw: string): string =>
  raw.trim().toLowerCase().replace(/[\s\-]+/g, '_');

/** Title-case fallback: "in_progress" → "In Progress". */
const titleize = (raw: string): string =>
  raw
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');

/**
 * Translate a status name coming from the backend/report data.
 * Scans all entity-status configs for a matching id or alias and resolves
 * its `translationKey`. Uses a Title-Cased version of the input as fallback.
 */
export const translateStatusLabel = (
  t: TFunction,
  raw: string | null | undefined,
): string => {
  if (raw == null) return '—';
  const value = String(raw).trim();
  if (!value) return '—';

  const id = normalize(value);
  const fallback = titleize(value);

  for (const type of allEntityTypes) {
    const config = entityStatusConfigs[type];
    if (!config) continue;
    for (const status of config.statuses) {
      if (status.id === id || status.aliases?.includes(id)) {
        return t(status.translationKey, { defaultValue: fallback }) as string;
      }
    }
  }
  return fallback;
};

/** React hook returning a memoized status label translator. */
export const useStatusLabel = () => {
  const { t } = useTranslation();
  return useCallback((raw: string | null | undefined) => translateStatusLabel(t, raw), [t]);
};
