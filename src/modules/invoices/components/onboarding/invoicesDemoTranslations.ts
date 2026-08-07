// Translations for the Invoices autopilot demo (EN + FR).
// English captions live inline in invoicesDemoScript.ts. The FR array
// must stay INV_STEPS.length long, same step order.

import { INV_STEPS, INV_CHAPTERS } from './invoicesDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(INV_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview': 'Vue d’ensemble & KPI',
    'controls': 'Recherche & Vues',
    'create':   'Créer depuis une vente',
    'detail':   'Détail & Onglets',
    'actions':  'Post / Payée / Annuler',
    'pdf':      'PDF & Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Voici Factures — le côté financier de chaque vente. Visualisez ce qui est facturé, ce qui est payé et ce qui reste dû, au même endroit.',
  'Total facturé additionne toutes les factures postées ou payées — l’argent que vous avez réellement facturé à vos clients.',
  'Reste dû, c’est ce qu’on vous doit encore — factures postées et en retard, moins ce qui a été payé. Votre créance active.',
  'Payé affiche le montant encaissé — chaque facture entièrement réglée. Cliquez sur n’importe quel KPI pour filtrer la liste.',
  'En retard compte les factures dépassées et non payées — celles que votre équipe doit relancer en premier.',
  'Recherchez par numéro de facture, titre ou notes — retrouvez n’importe quelle facture en quelques touches.',
  'Les filtres affinent par statut et plage de dates — construisez la vue exacte pour une relance ou un bilan mensuel.',
  'Deux façons de voir les mêmes données — un Tableau dense pour scanner ou une Liste plus aérée façon fil.',
  'Chaque facture naît d’une vente — c’est ce qui garde l’audit propre. Nouveau depuis une vente ouvre le sélecteur.',
  'Choisissez une vente éligible et ses lignes, son client et ses totaux sont copiés dans un brouillon de facture.',
  'Confirmez, et le brouillon est créé — mêmes articles, mêmes taxes, prêt à être relu avant publication.',
  'Le détail de la facture est le foyer du document — numéro, client, vente liée et les actions les plus utilisées.',
  'Le flux de statut est à sens unique — Brouillon devient Postée devient Payée, avec Annulée comme branche confirmée. Rien ne change par accident.',
  'Lignes affiche exactement ce qui est facturé — quantité, prix unitaire, taux de TVA et totaux pour chaque article.',
  'La carte récapitulative détaille sous-total, taxes, total, payé et restant dû — toujours à jour, toujours dans la devise de la facture.',
  'Paiements suit chaque règlement contre la facture et met à jour automatiquement les totaux Payé et Restant dû.',
  'Activité, c’est la piste d’audit complète — chaque publication, annulation, marquage payé et réouverture, avec l’auteur, la date et le mémo.',
  'Publier attribue le numéro officiel de facture et gèle les totaux — la facture devient un vrai document comptable.',
  'Marquer payée, Annuler et Réouvrir exigent un mémo — la raison est conservée dans l’audit, vous savez toujours pourquoi le statut a changé.',
  'Confirmez, la facture passe à Payée, une entrée « marqué payé manuel » arrive dans Activité, et le KPI Payé monte.',
  'Télécharger PDF exporte un document à votre marque — en-tête, bloc client, lignes, totaux et un résumé de paiement dédié — au pixel près comme vos PDF d’offres et de ventes.',
  'Envoyez-le, imprimez-le, partagez-le — le même document net à chaque fois, avec payé et restant dû calculés au millime.',
  'Voilà Factures de bout en bout — créances pilotées par les KPI, brouillons snapshotés depuis chaque vente, flux de statut à sens unique avec mémos audités, et un PDF de marque prêt à envoyer. Facturez votre première vente.',
];

if (CAPTIONS_FR.length !== INV_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[invoices demo] caption translation count mismatch', { en: INV_STEPS.length, fr: CAPTIONS_FR.length });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
