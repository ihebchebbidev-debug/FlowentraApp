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

const camelStatusKey = (id: string): string =>
  id.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());

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

  // Prefer the explicit global status dictionary. It contains exact shared
  // labels for dashboards/reporting and avoids config aliases turning
  // "completed" into sale "closed", etc.
  const globalLabel = t(`statuses.${id}`, { defaultValue: '' }) as string;
  if (globalLabel) return globalLabel;

  for (const type of allEntityTypes) {
    const config = entityStatusConfigs[type];
    if (!config) continue;
    for (const status of config.statuses) {
      if (status.id === id || status.aliases?.includes(id)) {
        const byCanonicalStatus = t(`statuses.${status.id}`, { defaultValue: '' }) as string;
        if (byCanonicalStatus) return byCanonicalStatus;

        const byTranslationKey = t(status.translationKey, { defaultValue: '' }) as string;
        if (byTranslationKey) return byTranslationKey;

        const byWorkflowKey = t(status.workflowTranslationKey, { defaultValue: '' }) as string;
        if (byWorkflowKey) return byWorkflowKey;
      }
    }
  }

  const statusLabel = t(`status.${id}`, { defaultValue: '' }) as string;
  if (statusLabel) return statusLabel;

  const statusFlowLabel = t(`statusFlow.${camelStatusKey(id)}`, { defaultValue: '' }) as string;
  if (statusFlowLabel) return statusFlowLabel;

  return fallback;
};

/** React hook returning a memoized status label translator. */
export const useStatusLabel = () => {
  const { t } = useTranslation();
  return useCallback((raw: string | null | undefined) => translateStatusLabel(t, raw), [t]);
};
