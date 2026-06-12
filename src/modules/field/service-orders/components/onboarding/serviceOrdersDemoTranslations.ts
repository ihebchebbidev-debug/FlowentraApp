// Translations for the Service Orders autopilot demo (EN + FR).
// English captions live inline in serviceOrdersDemoScript.ts. FR/AR arrays must
// stay exactly SO_STEPS.length long (asserted at runtime) in step order.

import { SO_STEPS, SO_CHAPTERS } from './serviceOrdersDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(SO_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview': 'Vue d’ensemble', 'controls': 'Filtres & Vues', 'map': 'Carte terrain',
    'create': 'Créer un ordre', 'detail': 'Détail & Statut', 'jobs': 'Tâches & Planning',
    'execution': 'Temps & Matériels', 'tabs': 'Preuves', 'invoice': 'Facture & PDF', 'wrapup': 'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Bienvenue dans Ordres de service — le bon de travail au cœur du service terrain. Chaque intervention de votre équipe vit ici : pour qui, quoi faire, qui le fait, et comment c’est facturé.',
  'Quatre cartes KPI résument votre activité, et chacune filtre la liste. Total compte chaque ordre de service en cours.',
  'Actifs, c’est le travail en mouvement — planifié, en cours, ou partiellement terminé. C’est ce que votre équipe terrain livre en ce moment.',
  'Terminés montre le travail fini — techniquement achevé, prêt à facturer et clôturer. Le débit de votre activité.',
  'Et Valeur totale additionne la valeur de vos ordres — le revenu que porte votre opération terrain.',
  'Le tableau des ordres liste chacun avec client, type, statut, priorité et date planifiée — coloré pour voir d’un coup ce qui est en attente, planifié, en cours ou terminé. Cliquez une ligne pour l’ouvrir.',
  'Recherchez instantanément par numéro d’ordre, client et titre — trouvez n’importe quelle intervention en quelques secondes.',
  'Les filtres affinent par statut, priorité et date — faites ressortir les jobs urgents à planifier ou facturer aujourd’hui.',
  'Voyez vos ordres de trois façons — un Tableau dense, une Liste aérée, et une Carte de chaque site d’intervention.',
  'Sélectionnez plusieurs ordres pour agir ensemble — mise à jour de statut en lot ou export — dans le respect des permissions.',
  'La vue Carte place chaque ordre de service sur son site — voyez toute votre charge terrain géographiquement, regroupez les jobs proches, et planifiez des tournées efficaces.',
  'Chaque épingle est colorée par statut et cliquable — ouvrez l’ordre, voyez le client et le technicien affecté, sans quitter la carte.',
  'La plupart des ordres arrivent automatiquement d’une vente acceptée — mais vous pouvez aussi en créer un directement. Nouvel ordre ouvre un formulaire guidé.',
  'Recherchez et sélectionnez le client depuis votre CRM — son adresse de site, son contact et ses détails fiscaux arrivent directement.',
  'Capturez le travail lui-même — le type de service, l’équipement ou l’installation concernée, le problème signalé, et la priorité.',
  'Décomposez l’ordre en tâches — les interventions individuelles à réaliser sur site, chacune avec une durée estimée et les compétences requises. C’est ce qui est planifié et envoyé.',
  'Enregistrez, et l’ordre entre dans votre pipeline en En attente — compté dans les KPI et prêt à planifier.',
  'La page de détail de l’ordre est son poste de commande — client, statut, et les actions les plus utilisées : planifier, envoyer, facturer et exporter.',
  'Le flux de statut mène l’ordre dans tout son cycle de vie — En attente, Planifié, En cours, Techniquement terminé, Prêt à facturer, Facturé, Clôturé — chaque étape en un clic et entièrement suivie.',
  'La Vue d’ensemble rassemble tout : client et site, problème signalé et détails de réparation, la vente liée d’où il vient, et un résumé en direct des tâches, matériels et coûts.',
  'L’onglet Tâches liste chaque tâche de l’ordre avec son statut et sa durée — le travail granulaire qui transforme un ordre en action.',
  'Planifiez une tâche à une date et une heure en quelques clics — ou confiez tout l’ordre au tableau de Planification pour une affectation par glisser-déposer.',
  'Affectez les techniciens par compétence et disponibilité — le système met en avant le meilleur profil, et dès que vous confirmez, un envoi est créé et le technicien notifié.',
  'L’onglet Envois montre les tickets terrain générés par cet ordre — l’affectation de chaque technicien avec son propre statut, suivie d’affecté à terminé.',
  'Temps & Dépenses capture tout ce qui est consigné sur l’ordre sur site — heures de main-d’œuvre par technicien et frais — alimentant directement la facture.',
  'Bookez la main-d’œuvre comme le terrain le fait — lancez un chrono à l’arrivée et arrêtez-le à la fin, ou saisissez les heures directement. Chaque saisie est attribuée au bon technicien et immédiatement facturable.',
  'Consignez les frais sur le champ — déplacement, pièces achetées sur place, péages — et joignez la photo du reçu. Chaque coût est capturé pour la facture au lieu d’être perdu sur un carnet.',
  'L’onglet Matériels suit les pièces et consommables utilisés — tirés de votre inventaire pour que le stock soit décrémenté automatiquement et facturé avec précision.',
  'Les Pièces jointes contiennent les preuves terrain — photos avant/après, rapport d’intervention signé, bons de livraison — tout ce que le job a produit.',
  'Les Checklists transforment les procédures en étapes garanties — contrôles de sécurité, critères d’achèvement, validations — pour que chaque job soit fait selon les règles.',
  'Et l’onglet Activité est la chronologie complète — créé, planifié, envoyé, terminé, facturé — un historique immuable de tout le job.',
  'Quand le travail est techniquement terminé, Préparer la facture rassemble la main-d’œuvre, les matériels et les frais consignés sur site en une vente prête à facturer — sans ressaisie.',
  'L’ordre de service lui-même s’imprime en document soigné et à votre marque — votre logo et identité fiscale, le client et le site, les tâches réalisées et les matériels utilisés.',
  'Et la mise en page vous appartient — un studio pour couleurs, typographie, disposition et champs affichés, pour que chaque document colle à votre marque.',
  'Envoyez-le au client par e-mail en un clic — le PDF joint, l’envoi suivi — bouclant la boucle du travail réalisé au client informé.',
  'Voilà Ordres de service de bout en bout — des KPI et une carte de votre terrain, un constructeur guidé, tâches et planning, envoi et exécution avec temps et matériels, documents à votre marque, et facturation en un clic.',
  'Les ventes deviennent des ordres de service, les ordres des envois, les envois des factures — et chaque heure, pièce et signature est suivie. Créez votre premier ordre et mettez votre équipe terrain au travail.',
];


if (CAPTIONS_FR.length !== SO_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[service-orders demo] caption count mismatch', { en: SO_STEPS.length, fr: CAPTIONS_FR.length });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
