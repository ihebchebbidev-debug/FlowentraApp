// Optional, module-agnostic label overrides for the shared PDF stack.
// The offer PDF document/components are built around the "offers" namespace, but
// the same stack is reused by other modules (e.g. deals). Those modules pass a
// small set of overrides so the document reads with their own wording while every
// generic field label (date, client, qty, total, …) keeps its existing translation.

export interface PdfLabelOverrides {
  /** Document type word, e.g. "Offer"/"Quote" → "Deal". Maps to `offer`. */
  documentType?: string;
  /** "Offer Number" → "Deal Number". Maps to `offerNumber`. */
  documentNumber?: string;
  /** "Offer Details" → "Deal Details". Maps to `offerDetails`. */
  documentDetails?: string;
  /** "Offer Items" → "Deal Items". Maps to `offerItems`. */
  documentItems?: string;
  /** Closing line shown at the bottom of the document. */
  thankYouMessage?: string;
  /** Pre-resolved status/stage label (the caller knows its own status taxonomy). */
  statusValue?: string;
}

/** Merge overrides onto a built pdfTranslations object (only non-empty values win). */
export function applyPdfLabelOverrides<T extends Record<string, any>>(base: T, o?: PdfLabelOverrides): T {
  if (!o) return base;
  return {
    ...base,
    ...(o.documentType ? { offer: o.documentType } : {}),
    ...(o.documentNumber ? { offerNumber: o.documentNumber } : {}),
    ...(o.documentDetails ? { offerDetails: o.documentDetails } : {}),
    ...(o.documentItems ? { offerItems: o.documentItems } : {}),
    ...(o.thankYouMessage ? { thankYouMessage: o.thankYouMessage } : {}),
    ...(o.statusValue ? { statusValue: o.statusValue } : {}),
  };
}
