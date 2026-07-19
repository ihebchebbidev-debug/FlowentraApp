// Utility for translating auto-generated backend notes / activity descriptions
// to the user's current locale.
//
// Auto-generated messages are produced in English (see
// src/services/activityLogger.ts and the per-module Activity tabs) and stored
// as-is on the backend. When rendering we translate them fragment-by-fragment
// so multi-line messages, propagation prefixes, and status names all follow
// the user's language without needing a database migration.

type Locale = 'en' | 'fr';

// ---------------------------------------------------------------------------
// Simple label / prefix translations that can appear anywhere in a message.
// Ordered longest-first so more specific phrases win over shorter ones.
// ---------------------------------------------------------------------------
const fragmentMap: Array<{ en: RegExp; fr: RegExp; enText: string; frText: string }> = [
  // Activity headers (with emoji) — added / updated / removed
  { en: /⏱️\s*Time entry added by/gi, fr: /⏱️\s*Saisie de temps ajoutée par/gi, enText: '⏱️ Time entry added by', frText: '⏱️ Saisie de temps ajoutée par' },
  { en: /✏️\s*Time entry updated by/gi, fr: /✏️\s*Saisie de temps modifiée par/gi, enText: '✏️ Time entry updated by', frText: '✏️ Saisie de temps modifiée par' },
  { en: /🗑️\s*Time entry deleted by/gi, fr: /🗑️\s*Saisie de temps supprimée par/gi, enText: '🗑️ Time entry deleted by', frText: '🗑️ Saisie de temps supprimée par' },
  { en: /💰\s*Expense added by/gi, fr: /💰\s*Dépense ajoutée par/gi, enText: '💰 Expense added by', frText: '💰 Dépense ajoutée par' },
  { en: /✏️\s*Expense updated by/gi, fr: /✏️\s*Dépense modifiée par/gi, enText: '✏️ Expense updated by', frText: '✏️ Dépense modifiée par' },
  { en: /🗑️\s*Expense deleted by/gi, fr: /🗑️\s*Dépense supprimée par/gi, enText: '🗑️ Expense deleted by', frText: '🗑️ Dépense supprimée par' },
  { en: /📦\s*Material added by/gi, fr: /📦\s*Matériel ajouté par/gi, enText: '📦 Material added by', frText: '📦 Matériel ajouté par' },
  { en: /✏️\s*Material updated by/gi, fr: /✏️\s*Matériel modifié par/gi, enText: '✏️ Material updated by', frText: '✏️ Matériel modifié par' },
  { en: /🗑️\s*Material removed by/gi, fr: /🗑️\s*Matériel supprimé par/gi, enText: '🗑️ Material removed by', frText: '🗑️ Matériel supprimé par' },
  { en: /🔄\s*Status changed by/gi, fr: /🔄\s*Statut changé par/gi, enText: '🔄 Status changed by', frText: '🔄 Statut changé par' },
  { en: /▶️\s*Dispatch started by/gi, fr: /▶️\s*Intervention démarrée par/gi, enText: '▶️ Dispatch started by', frText: '▶️ Intervention démarrée par' },
  { en: /✅\s*Dispatch completed by/gi, fr: /✅\s*Intervention terminée par/gi, enText: '✅ Dispatch completed by', frText: '✅ Intervention terminée par' },
  { en: /❌\s*Dispatch cancelled by/gi, fr: /❌\s*Intervention annulée par/gi, enText: '❌ Dispatch cancelled by', frText: '❌ Intervention annulée par' },
  { en: /📝\s*Activity by/gi, fr: /📝\s*Activité par/gi, enText: '📝 Activity by', frText: '📝 Activité par' },

  // Propagation prefix
  { en: /\[From\s+/g, fr: /\[Depuis\s+/g, enText: '[From ', frText: '[Depuis ' },

  // Field labels used by activityLogger multi-line messages
  { en: /•\s*Type\s*:/g, fr: /•\s*Type\s*:/g, enText: '• Type:', frText: '• Type :' },
  { en: /•\s*Duration\s*:/g, fr: /•\s*Durée\s*:/g, enText: '• Duration:', frText: '• Durée :' },
  { en: /•\s*Description\s*:/g, fr: /•\s*Description\s*:/g, enText: '• Description:', frText: '• Description :' },
  { en: /•\s*Amount\s*:/g, fr: /•\s*Montant\s*:/g, enText: '• Amount:', frText: '• Montant :' },
  { en: /•\s*Article\s*:/g, fr: /•\s*Article\s*:/g, enText: '• Article:', frText: '• Article :' },
  { en: /•\s*Quantity\s*:/g, fr: /•\s*Quantité\s*:/g, enText: '• Quantity:', frText: '• Quantité :' },
  { en: /•\s*Cost\s*:/g, fr: /•\s*Coût\s*:/g, enText: '• Cost:', frText: '• Coût :' },
  { en: /•\s*From\s*:/g, fr: /•\s*De\s*:/g, enText: '• From:', frText: '• De :' },
  { en: /•\s*To\s*:/g, fr: /•\s*À\s*:/g, enText: '• To:', frText: '• À :' },
  { en: /•\s*Date\s*:/g, fr: /•\s*Date\s*:/g, enText: '• Date:', frText: '• Date :' },

  // Short-form messages produced by DispatchActivityTab.mapActionToDescription
  { en: /\bDispatch created\b/g, fr: /\bIntervention créée\b/g, enText: 'Dispatch created', frText: 'Intervention créée' },
  { en: /\bDispatch started\b/g, fr: /\bIntervention démarrée\b/g, enText: 'Dispatch started', frText: 'Intervention démarrée' },
  { en: /\bDispatch completed\b/g, fr: /\bIntervention terminée\b/g, enText: 'Dispatch completed', frText: 'Intervention terminée' },
  { en: /\bDispatch cancelled\b/g, fr: /\bIntervention annulée\b/g, enText: 'Dispatch cancelled', frText: 'Intervention annulée' },
  { en: /\bDispatch updated\b/g, fr: /\bIntervention mise à jour\b/g, enText: 'Dispatch updated', frText: 'Intervention mise à jour' },
  { en: /\bDispatch planned\b/g, fr: /\bIntervention planifiée\b/g, enText: 'Dispatch planned', frText: 'Intervention planifiée' },
  { en: /\bTechnician assigned\b/g, fr: /\bTechnicien assigné\b/g, enText: 'Technician assigned', frText: 'Technicien assigné' },
  { en: /\bStatus changed\b/g, fr: /\bStatut changé\b/g, enText: 'Status changed', frText: 'Statut changé' },
  { en: /\bTime entry added\b/g, fr: /\bSaisie de temps ajoutée\b/g, enText: 'Time entry added', frText: 'Saisie de temps ajoutée' },
  { en: /\bTime entry updated\b/g, fr: /\bSaisie de temps modifiée\b/g, enText: 'Time entry updated', frText: 'Saisie de temps modifiée' },
  { en: /\bTime entry deleted\b/g, fr: /\bSaisie de temps supprimée\b/g, enText: 'Time entry deleted', frText: 'Saisie de temps supprimée' },
  { en: /\bExpense added\b/g, fr: /\bDépense ajoutée\b/g, enText: 'Expense added', frText: 'Dépense ajoutée' },
  { en: /\bExpense updated\b/g, fr: /\bDépense modifiée\b/g, enText: 'Expense updated', frText: 'Dépense modifiée' },
  { en: /\bExpense deleted\b/g, fr: /\bDépense supprimée\b/g, enText: 'Expense deleted', frText: 'Dépense supprimée' },
  { en: /\bMaterial added\b/g, fr: /\bMatériel ajouté\b/g, enText: 'Material added', frText: 'Matériel ajouté' },
  { en: /\bMaterial updated\b/g, fr: /\bMatériel modifié\b/g, enText: 'Material updated', frText: 'Matériel modifié' },
  { en: /\bMaterial removed\b/g, fr: /\bMatériel supprimé\b/g, enText: 'Material removed', frText: 'Matériel supprimé' },
  { en: /\bNote added\b/g, fr: /\bNote ajoutée\b/g, enText: 'Note added', frText: 'Note ajoutée' },
  { en: /\bRecord created\b/g, fr: /\bEnregistrement créé\b/g, enText: 'Record created', frText: 'Enregistrement créé' },

  // Sentence connectors ("planned by …", "by <user>")
  { en: /\bplanned by\b/g, fr: /\bplanifié par\b/g, enText: 'planned by', frText: 'planifié par' },
  { en: /(\s)by\s+/g, fr: /(\s)par\s+/g, enText: '$1by ', frText: '$1par ' },
];

// ---------------------------------------------------------------------------
// Whole-string patterns (kept for backwards compatibility with older notes).
// ---------------------------------------------------------------------------
const notePatterns: Array<{ pattern: RegExp; en: string; fr: string }> = [
    { pattern: /^Checklist ajouté\s*:\s*(.+)$/i, en: 'Checklist added: $1', fr: 'Checklist ajouté : $1' },
    { pattern: /^Checklist added\s*:\s*(.+)$/i, en: 'Checklist added: $1', fr: 'Checklist ajouté : $1' },
    { pattern: /^Checklist complété\s*:\s*(.+)$/i, en: 'Checklist completed: $1', fr: 'Checklist complété : $1' },
    { pattern: /^Checklist completed\s*:\s*(.+)$/i, en: 'Checklist completed: $1', fr: 'Checklist complété : $1' },
    { pattern: /^Un nouveau checklist "(.+)" a été ajouté\.$/i, en: 'A new checklist "$1" has been added.', fr: 'Un nouveau checklist "$1" a été ajouté.' },
    { pattern: /^A new checklist "(.+)" has been added\.$/i, en: 'A new checklist "$1" has been added.', fr: 'Un nouveau checklist "$1" a été ajouté.' },
    { pattern: /^Le checklist "(.+)" a été complété\.$/i, en: 'The checklist "$1" has been completed.', fr: 'Le checklist "$1" a été complété.' },
    { pattern: /^The checklist "(.+)" has been completed\.$/i, en: 'The checklist "$1" has been completed.', fr: 'Le checklist "$1" a été complété.' },
    { pattern: /^Note added$/i, en: 'Note added', fr: 'Note ajoutée' },
    { pattern: /^Note ajoutée$/i, en: 'Note added', fr: 'Note ajoutée' },
    { pattern: /^Checklist added from (Offer|Sale|Service Order|Dispatch)\s*:\s*(.+)$/i, en: 'Checklist added from $1: $2', fr: 'Checklist ajouté depuis $1 : $2' },
    { pattern: /^Checklist ajouté depuis (Offre|Vente|Ordre de Service|Intervention)\s*:\s*(.+)$/i, en: 'Checklist added from $1: $2', fr: 'Checklist ajouté depuis $1 : $2' },
    { pattern: /^Checklist completed from (Offer|Sale|Service Order|Dispatch)\s*:\s*(.+)$/i, en: 'Checklist completed from $1: $2', fr: 'Checklist complété depuis $1 : $2' },
    { pattern: /^Checklist complété depuis (Offre|Vente|Ordre de Service|Intervention)\s*:\s*(.+)$/i, en: 'Checklist completed from $1: $2', fr: 'Checklist complété depuis $1 : $2' },
];

const entityTypeTranslations: Record<string, { en: string; fr: string }> = {
  'offer': { en: 'Offer', fr: 'Offre' },
  'sale': { en: 'Sale', fr: 'Vente' },
  'service_order': { en: 'Service Order', fr: 'Ordre de Service' },
  'dispatch': { en: 'Dispatch', fr: 'Intervention' },
  'offre': { en: 'Offer', fr: 'Offre' },
  'vente': { en: 'Sale', fr: 'Vente' },
  'ordre de service': { en: 'Service Order', fr: 'Ordre de Service' },
  'intervention': { en: 'Dispatch', fr: 'Intervention' },
};

// Status translations
const statusTranslations: Record<string, { en: string; fr: string }> = {
  'draft': { en: 'Created', fr: 'Brouillon' },
  'brouillon': { en: 'Created', fr: 'Brouillon' },
  'sent': { en: 'Sent', fr: 'Envoyé' },
  'envoyé': { en: 'Sent', fr: 'Envoyé' },
  'pending': { en: 'Pending', fr: 'En attente' },
  'en attente': { en: 'Pending', fr: 'En attente' },
  'in_progress': { en: 'In Progress', fr: 'En cours' },
  'en cours': { en: 'In Progress', fr: 'En cours' },
  'completed': { en: 'Completed', fr: 'Terminé' },
  'terminé': { en: 'Completed', fr: 'Terminé' },
  'cancelled': { en: 'Cancelled', fr: 'Annulé' },
  'annulé': { en: 'Cancelled', fr: 'Annulé' },
  'accepted': { en: 'Accepted', fr: 'Accepté' },
  'accepté': { en: 'Accepted', fr: 'Accepté' },
  'rejected': { en: 'Rejected', fr: 'Rejeté' },
  'rejeté': { en: 'Rejected', fr: 'Rejeté' },
  'won': { en: 'Won', fr: 'Gagné' },
  'gagné': { en: 'Won', fr: 'Gagné' },
  'lost': { en: 'Lost', fr: 'Perdu' },
  'perdu': { en: 'Lost', fr: 'Perdu' },
  'scheduled': { en: 'Scheduled', fr: 'Planifié' },
  'planifié': { en: 'Scheduled', fr: 'Planifié' },
  'on_hold': { en: 'On Hold', fr: 'En attente' },
  'ready_for_planning': { en: 'Ready for Planning', fr: 'Prêt pour planification' },
  'prêt pour planification': { en: 'Ready for Planning', fr: 'Prêt pour planification' },
  'confirmed': { en: 'Confirmed', fr: 'Confirmé' },
  'confirmé': { en: 'Confirmed', fr: 'Confirmé' },
  'assigned': { en: 'Assigned', fr: 'Assigné' },
  'assigné': { en: 'Assigned', fr: 'Assigné' },
  'unassigned': { en: 'Unassigned', fr: 'Non assigné' },
  'active': { en: 'Active', fr: 'Actif' },
  'inactive': { en: 'Inactive', fr: 'Inactif' },
  'paid': { en: 'Paid', fr: 'Payé' },
  'unpaid': { en: 'Unpaid', fr: 'Non payé' },
  'overdue': { en: 'Overdue', fr: 'En retard' },
  'invoiced': { en: 'Invoiced', fr: 'Facturé' },
  'delivered': { en: 'Delivered', fr: 'Livré' },
  'partially_delivered': { en: 'Partially Delivered', fr: 'Partiellement livré' },
  'on hold': { en: 'On Hold', fr: 'En attente' },
};

// ---------------------------------------------------------------------------
// Activity "type" values used as badges — badge shows the action verb.
// ---------------------------------------------------------------------------
const activityTypeTranslations: Record<string, { en: string; fr: string }> = {
  'created': { en: 'created', fr: 'créé' },
  'create': { en: 'created', fr: 'créé' },
  'updated': { en: 'updated', fr: 'mis à jour' },
  'update': { en: 'updated', fr: 'mis à jour' },
  'deleted': { en: 'deleted', fr: 'supprimé' },
  'status_changed': { en: 'status changed', fr: 'statut changé' },
  'statuschanged': { en: 'status changed', fr: 'statut changé' },
  'status change': { en: 'status changed', fr: 'statut changé' },
  'started': { en: 'started', fr: 'démarré' },
  'completed': { en: 'completed', fr: 'terminé' },
  'cancelled': { en: 'cancelled', fr: 'annulé' },
  'assigned': { en: 'assigned', fr: 'assigné' },
  'technician_assigned': { en: 'technician assigned', fr: 'technicien assigné' },
  'material_added': { en: 'material added', fr: 'matériel ajouté' },
  'material added': { en: 'material added', fr: 'matériel ajouté' },
  'material_updated': { en: 'material updated', fr: 'matériel modifié' },
  'material_removed': { en: 'material removed', fr: 'matériel supprimé' },
  'material_deleted': { en: 'material removed', fr: 'matériel supprimé' },
  'time_entry': { en: 'time entry', fr: 'saisie de temps' },
  'time_entry_added': { en: 'time entry added', fr: 'saisie de temps ajoutée' },
  'time entry': { en: 'time entry', fr: 'saisie de temps' },
  'time entry added': { en: 'time entry added', fr: 'saisie de temps ajoutée' },
  'expense': { en: 'expense', fr: 'dépense' },
  'expense_added': { en: 'expense added', fr: 'dépense ajoutée' },
  'note': { en: 'note', fr: 'note' },
  'note_added': { en: 'note added', fr: 'note ajoutée' },
  'general': { en: 'note', fr: 'note' },
  'converted': { en: 'converted', fr: 'converti' },
  'sent': { en: 'sent', fr: 'envoyé' },
  'accepted': { en: 'accepted', fr: 'accepté' },
  'rejected': { en: 'rejected', fr: 'rejeté' },
  'call': { en: 'call', fr: 'appel' },
  'email': { en: 'email', fr: 'e-mail' },
  'meeting': { en: 'meeting', fr: 'réunion' },
};

/**
 * Translate a note content from backend to the specified locale
 * @param content - The note content from backend
 * @param targetLocale - The target locale ('en' or 'fr')
 * @returns The translated note content
 */
export function translateNote(content: string, targetLocale: Locale): string {
  if (!content) return content;

  // 1. Whole-string legacy patterns first (exact matches, e.g. checklist lines).
  for (const { pattern, en, fr } of notePatterns) {
    const match = content.match(pattern);
    if (match) {
      let translatedContent = targetLocale === 'fr' ? fr : en;
      for (let i = 1; i < match.length; i++) {
        let replacement = match[i];
        const lowerReplacement = replacement.toLowerCase();
        if (entityTypeTranslations[lowerReplacement]) {
          replacement = entityTypeTranslations[lowerReplacement][targetLocale];
        } else if (statusTranslations[lowerReplacement]) {
          replacement = statusTranslations[lowerReplacement][targetLocale];
        }
        translatedContent = translatedContent.replace(`$${i}`, replacement);
      }
      return translatedContent;
    }
  }

  // 2. Fragment translation: replace headers, labels, and quoted status values
  //    anywhere in the message. Handles multi-line auto-generated notes.
  let result = content;

  for (const frag of fragmentMap) {
    if (targetLocale === 'fr') {
      result = result.replace(frag.en, frag.frText);
    } else {
      result = result.replace(frag.fr, frag.enText);
    }
  }

  // 3. Translate status names appearing inside "..." or '...' quotes.
  const translateQuoted = (_full: string, quote: string, inner: string) => {
    const key = inner.trim().toLowerCase();
    const mapped = statusTranslations[key]?.[targetLocale];
    return mapped ? `${quote}${mapped}${quote}` : `${quote}${inner}${quote}`;
  };
  result = result.replace(/(["'])([^"']+)\1/g, translateQuoted);

  return result;
}

/**
 * Translate an array of notes
 * @param notes - Array of note objects with content property
 * @param targetLocale - The target locale ('en' or 'fr')
 * @returns Array of notes with translated content
 */
export function translateNotes<T extends { content?: string; note?: string; description?: string }>(
  notes: T[],
  targetLocale: 'en' | 'fr'
): T[] {
  return notes.map(note => ({
    ...note,
    content: note.content ? translateNote(note.content, targetLocale) : note.content,
    note: note.note ? translateNote(note.note, targetLocale) : note.note,
    description: note.description ? translateNote(note.description, targetLocale) : note.description,
  }));
}

/**
 * Get entity type label in the specified locale
 */
export function getEntityTypeLabel(entityType: string, locale: 'en' | 'fr'): string {
  const key = entityType.toLowerCase();
  return entityTypeTranslations[key]?.[locale] || entityType;
}

/**
 * Get status label in the specified locale
 */
export function getStatusLabel(status: string, locale: 'en' | 'fr'): string {
  const key = status.toLowerCase();
  return statusTranslations[key]?.[locale] || status;
}

/**
 * Translate an activity-type value (used as a badge label like "status_changed"
 * or "material added") into a human-readable, localized phrase.
 */
export function translateActivityType(type: string, locale: Locale): string {
  if (!type) return type;
  const key = type.toLowerCase().trim();
  const spaced = key.replace(/_/g, ' ');
  const mapped =
    activityTypeTranslations[key]?.[locale] ??
    activityTypeTranslations[spaced]?.[locale];
  return mapped ?? spaced;
}
