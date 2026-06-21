// Translations for the Sales (Invoices) autopilot demo (EN + FR).
// English captions live inline in salesDemoScript.ts. The FR caption array
// must stay exactly SA_STEPS.length long (asserted at runtime) in step order.

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
    'create':   'Créer une vente',
    'detail':   'Détail & Statut',
    'tabs':     'Espace de la vente',
    'pdf':      'Facture & PDF',
    'convert':  'Vers ordre de service',
    'wrapup':   'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Bienvenue dans Ventes — là où les offres acceptées deviennent du revenu. Émettez des factures, suivez paiement et livraison, et transmettez les ventes finalisées à votre équipe terrain en ordres de service.',
  'Les cartes KPI donnent l’état de l’activité d’un coup d’œil, et chacune filtre la liste. Total compte chaque vente enregistrée.',
  'Actives, c’est le travail en cours — ventes créées ou en cours, en route vers l’exécution et la facturation.',
  'Facturées montre ce qui a été facturé — totalement ou partiellement — pour toujours savoir combien de revenu est comptabilisé contre ce qui reste en attente.',
  'Et Valeur totale, c’est le chiffre phare — la valeur de vos ventes dans votre devise, le nombre autour duquel toute l’équipe se rassemble.',
  'Le tableau des ventes liste chacune avec client, montant, statut et priorité — coloré pour voir d’un coup ce qui est créé, en cours, facturé ou clôturé. Cliquez une ligne pour l’ouvrir.',
  'Recherchez instantanément par titre, client et numéro de vente — trouvez n’importe quelle affaire en quelques secondes.',
  'Les filtres affinent par statut, priorité et plage de dates — faites ressortir les ventes urgentes à facturer aujourd’hui.',
  'Voyez vos ventes de deux façons — un Tableau dense pour scanner, ou une Liste aérée pour le détail — choisissez la vue qui colle à la tâche.',
  'Chaque vente porte l’emplacement du client, alors une vue Carte les place géographiquement — pratique pour planifier les livraisons et l’analyse régionale.',
  'Exportez vers Excel pour la comptabilité et le reporting — vos données de revenu vont directement dans les outils que votre équipe finance utilise déjà.',
  'La plupart des ventes arrivent automatiquement d’une offre acceptée — mais vous pouvez aussi en créer une directement. Nouvelle vente ouvre un formulaire guidé.',
  'Choisissez le client et ses détails se remplissent automatiquement — y compris l’identité fiscale nécessaire à une facture conforme.',
  'Ajoutez des lignes depuis votre catalogue — produits et services ensemble — chacune avec quantité, prix et remise optionnelle, exactement comme sur l’offre.',
  'Les totaux se calculent en direct dans l’ordre conforme — sous-total, remise, TVA sur le montant remisé, frais de port, et timbre fiscal — pour une facture exacte au millime.',
  'Fixez une date de livraison et une priorité, et marquez-la récurrente pour les abonnements ou contrats de maintenance à facturer selon un calendrier.',
  'Enregistrez, et la vente entre dans votre pipeline d’exécution — comptée dans les KPI et prête à facturer.',
  'La page de détail de la vente est son foyer — titre, client, montant, et les actions les plus utilisées : envoyer la facture, exporter, et convertir en ordre de service.',
  'Le flux de statut mène la vente de Créée à En cours à Facturée à Clôturée — y compris la facturation partielle pour les affaires facturées par étapes. Chaque étape est en un clic et entièrement suivie.',
  'La Vue d’ensemble rassemble tout : détails client et fiscaux, résumé financier avec port et timbre, date de livraison, et l’offre d’origine dont elle a été convertie.',
  'L’onglet Articles liste chaque ligne avec ses totaux — ajustez quantités et prix avant que la vente soit facturée.',
  'Les Notes gardent la trace de chaque échange — modalités de livraison, promesses de paiement, conditions spéciales — horodatées avec qui et quand.',
  'Les checklists pilotent l’exécution — confirmer le stock, planifier la livraison, récupérer le bon de livraison signé. Et une checklist sur une ligne de service est reprise depuis l’offre et suit la vente → job de l’ordre de service → intervention, pour que le technicien ait les bonnes étapes par job.',
  'Documents et pièces jointes restent avec la vente — le devis signé, les bons de livraison, la preuve de paiement — toute la trace papier au même endroit.',
  'Et l’onglet Activité est la chronologie complète — créée, facturée, payée, clôturée — un historique immuable de toute la transaction.',
  'Envoyez la facture par e-mail en un clic — Flowentra joint le PDF et fait passer le statut à Facturée, l’envoi étant suivi sur la fiche.',
  'La facture générée est un document soigné et conforme — votre logo et Matricule Fiscal, le bloc client, les lignes détaillées, la TVA, le timbre fiscal, et le montant dû.',
  'Et la mise en page vous appartient — un studio pour couleurs, typographie, disposition et champs affichés, pour que chaque facture porte votre marque et respecte les règles.',
  'Téléchargez-la, imprimez-la ou envoyez-la — la même facture conforme à chaque fois, avec TVA et timbre fiscal calculés automatiquement.',
  'Quand une vente inclut du travail sur site, elle ne s’arrête pas à la facture. Convertir transforme la vente en Ordre de service pour votre équipe terrain.',
  'Configurez l’ordre de service — quelles lignes deviennent des jobs, le site, et la priorité — et il atterrit dans la Planification, prêt à être envoyé. De la vente au travail planifié, sans rien ressaisir.',
  'Voilà Ventes de bout en bout — des KPI et un pipeline d’exécution, un constructeur guidé aux factures conformes, un détail 360° avec notes, checklists et documents, des PDF à votre marque, et la conversion en ordres de service en un clic.',
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
