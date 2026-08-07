// Translations for the Sales (Invoices) autopilot demo (EN + FR).
// English captions live inline in salesDemoScript.ts. CAPTIONS_FR must be exactly
// SA_STEPS.length long (asserted at runtime) in step order.

import { SA_STEPS, SA_CHAPTERS } from './salesDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(SA_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview': 'Vue d’ensemble',
    'controls': 'Filtres & Vues',
    'bulk':     'Sélection & Actions',
    'create':   'Créer une vente',
    'detail':   'Détail & Statut',
    'tabs':     'Espace de la vente',
    'pdf':      'Facture & PDF',
    'convert':  'Vers ordre de service',
    'wrapup':   'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  // 1 · Overview
  'Bienvenue dans Ventes — là où les offres acceptées se transforment en revenu. Suivez chaque affaire de la création à la facturation à la clôture, et transmettez le terrain à vos techniciens en un ordre de service.',
  'Quatre cartes KPI donnent l’état de l’activité d’un coup d’œil, et chacune filtre la liste. Total des ventes compte chaque affaire enregistrée.',
  'En cours, c’est le travail en action — les ventes passées de Créée à En cours, en route vers la facturation.',
  'Clôturées regroupe tout ce qui a bouclé le cycle — facturée, partiellement facturée ou clôturée — pour toujours savoir ce qui est acquis contre ce qui reste ouvert.',
  'Et Valeur totale, c’est le chiffre phare — la valeur des ventes filtrées dans votre devise, mise à jour en direct dès que vous découpez la liste.',
  'Le tableau des ventes affiche chaque affaire avec titre et numéro, contact et société, offre associée, montant TTC et statut — coloré pour voir d’un coup ce qui est créé, en cours, facturé ou clôturé. Cliquez une ligne pour l’ouvrir.',

  // 2 · Filters & Views
  'La recherche parcourt titres, numéros, contacts et sociétés — trouvez n’importe quelle affaire en quelques secondes.',
  'Les filtres affinent par statut, priorité, étape et responsable — faites ressortir les ventes urgentes à facturer aujourd’hui.',
  'Voyez vos ventes de deux façons — un Tableau dense pour scanner, ou une Liste aérée pour le détail — choisissez la vue qui colle à la tâche.',
  'Chaque vente porte l’emplacement du client, alors la vue Carte les place géographiquement — pratique pour planifier les livraisons et l’analyse régionale.',

  // 3 · Bulk & row actions
  'Cochez les cases pour sélectionner plusieurs ventes et agir dessus ensemble — la barre de sélection compte et permet de tout supprimer en une étape confirmée, avec une jauge de progression en direct.',
  'Chaque ligne a son menu rapide — Voir la vente, ouvrir son Rapport imprimable dans un nouvel onglet, ou la Supprimer. Tout le reste vit à l’intérieur de la vente.',

  // 4 · Raise a sale
  'La plupart des ventes arrivent automatiquement d’une offre acceptée — mais vous pouvez aussi en créer une directement. Nouvelle vente ouvre un formulaire guidé.',
  'Choisissez le client et ses détails fiscaux se remplissent automatiquement — y compris le Matricule Fiscal requis pour une facture conforme.',
  'Ajoutez des lignes depuis votre catalogue — produits et services ensemble — chacune avec quantité, prix et remise optionnelle, exactement comme sur l’offre.',
  'Les totaux se calculent en direct dans l’ordre fiscalement conforme — sous-total, remise, TVA sur le montant remisé, frais de port et timbre fiscal — précis au millime.',
  'Fixez une date de livraison et une priorité — haute, urgente, moyenne ou basse — pour que votre équipe sache où concentrer l’effort.',
  'Enregistrez, et la vente entre dans votre pipeline d’exécution — comptée dans les KPI et prête à facturer.',

  // 5 · Detail & status
  'Le détail de la vente est son foyer — numéro éditable, client, montant, et les quatre actions d’en-tête : Modifier, Envoyer la facture, Télécharger le PDF et Supprimer.',
  'Le flux de statut mène la vente de Créée à En cours à Facturée à Clôturée — un clic par étape, entièrement tracé dans le journal d’activité.',
  'Et il existe des branches quand l’affaire ne va pas tout droit — Partiellement facturée pour la facturation par étapes, et Annulée quand une vente est abandonnée. Le pipeline les gère sans casser le flux.',

  // 6 · Sale workspace tabs
  'L’onglet Articles liste chaque ligne avec ses totaux — ajustez quantités et prix avant que la vente soit facturée.',
  'Les Paiements vivent directement sur la vente — enregistrez espèces, chèque, virement ou carte avec référence, date et montant. Flowentra remonte le solde et marque la vente payée, partiellement payée ou en retard, pour des créances toujours à jour.',
  'Les checklists pilotent l’exécution — confirmer le stock, planifier la livraison, récupérer le bon de livraison signé. Et une checklist sur une ligne de service est reprise depuis l’offre et suit jusqu’au job de l’ordre de service et à l’intervention, pour que le technicien ait les bonnes étapes par job.',
  'Documents et pièces jointes restent avec la vente — le devis signé, les bons de livraison, la preuve de paiement — toute la trace papier au même endroit.',
  'Et l’onglet Activité est la chronologie complète — créée, statut changé, facture envoyée, paiement reçu, convertie — un historique immuable de toute la transaction.',

  // 7 · Invoice & PDF
  'Envoyez la facture par e-mail en un clic — Flowentra joint le PDF, enregistre l’envoi et peut faire passer le statut à Facturée automatiquement.',
  'La facture générée est un document soigné et conforme — votre logo et Matricule Fiscal, le bloc client, les lignes détaillées, la TVA, le timbre fiscal et le montant dû.',
  'Et la mise en page vous appartient — un studio pour couleurs, typographie, disposition et champs affichés, pour que chaque facture porte votre marque et respecte les règles.',
  'Téléchargez-la, imprimez-la ou envoyez-la — la même facture conforme à chaque fois, avec TVA et timbre fiscal calculés automatiquement.',

  // 8 · Convert to Service Order
  'Quand une vente inclut des services, une bannière apparaît sur la page de détail — en un clic vous pouvez convertir en Ordre de service, ou passer pour garder la vente en Ventes uniquement.',
  'Configurez l’ordre de service en une étape — notes, priorité, dates de début et cible planifiées. Il atterrit dans la Planification, prêt à être dispatché.',
  'Chaque ligne de service peut cibler une installation différente — une pour le compresseur de Chambre Froide 3, une autre pour le split du hall — pour que le technicien aille exactement au bon endroit. Rien ressaisi.',

  // 9 · Wrap-up
  'Voilà Ventes de bout en bout — KPI filtrables, actions groupées, factures conformes, paiements et rapprochement, PDF à votre marque, et un pont en un clic vers votre équipe terrain.',
  'Les offres deviennent des ventes, les ventes des factures et des ordres de service, et chaque dinar est suivi. Enregistrez votre première vente et bouclez la boucle du devis à l’encaissement à la livraison.',
];


if (CAPTIONS_FR.length !== SA_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[sales demo] caption translation count mismatch', { en: SA_STEPS.length, fr: CAPTIONS_FR.length });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
