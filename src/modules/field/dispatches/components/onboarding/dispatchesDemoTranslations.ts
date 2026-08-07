// Translations for the Dispatches autopilot demo (EN + FR).
// English captions live inline in dispatchesDemoScript.ts. FR array must stay
// exactly DP_STEPS.length long (asserted at runtime) in step order.

import { DP_STEPS, DP_CHAPTERS } from './dispatchesDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(DP_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview':  'Vue d’ensemble',
    'controls':  'Actions de liste',
    'detail':    'Ticket de job',
    'ov-tab':    'Onglet Aperçu',
    'jobs':      'Tâches',
    'time':      'Temps & Frais',
    'materials': 'Matériels',
    'evidence':  'Pièces jointes & Checklists',
    'activity':  'Activité',
    'send':      'Partage & Envoi',
    'pdf':       'Studio PDF',
    'wrapup':    'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  // Chapter 1 · Overview & Toolbar
  'Bienvenue dans Envois — le ticket de job du technicien. Quand un ordre de service est affecté, il devient un envoi : un job terrain qu’un technicien confirme, rejoint, exécute et livre — chaque heure, pièce et note capturée en chemin.',
  'La barre d’outils est simple et rapide — cherchez par numéro d’envoi, ordre de service, technicien ou client, et trouvez n’importe quel job en quelques secondes.',
  'Un filtre de statut unique affine la liste — en attente, planifié, confirmé, en cours, terminé, annulé ou rejeté — le cycle de vie que l’équipe terrain vit vraiment.',

  // Chapter 2 · List Views, Export, Row & Bulk actions
  'Activez la carte pour voir chaque envoi épinglé sur la géographie — sites clients, tournées des techniciens, toute la journée d’un coup d’œil.',
  'L’export sort la liste filtrée — numéros d’envoi, ordres de service, clients, plannings, statuts, techniciens — choisissez les colonnes et téléchargez.',
  'Chaque ligne a son menu — Voir pour ouvrir le ticket, Modifier pour l’ajuster, Rapport pour le rapport imprimable, et Supprimer quand il a été créé par erreur.',
  'Sélectionnez plusieurs envois pour agir ensemble. Une barre rouge apparaît — Supprimer les retire en une passe confirmée, avec un pourcentage de progression en direct pour toujours savoir où vous en êtes.',

  // Chapter 3 · Detail Header & Status Flow
  'Ouvrez un envoi et vous entrez dans l’espace du technicien — numéro d’envoi, ordre de service, client, et les actions d’en-tête utilisées chaque jour : Rapport, Partager, Envoyer.',
  'Le numéro d’envoi se modifie sur place — renommez-le selon votre propre numérotation, et Flowentra vérifie qu’il reste unique.',
  'Le flux de statut reflète une vraie journée terrain — En attente, Planifié, Affecté, Confirmé (relâché), En cours, Terminé — avec branches Rejeter et Annuler, et raccourcis Relâcher et Annuler juste à côté du stepper.',

  // Chapter 4 · Overview Tab
  'L’onglet Aperçu montre les vraies relations — l’ordre de service lié, le contact affecté et son e-mail, le site d’installation, la priorité, le statut courant, et les techniciens affectés.',
  'Les Compétences requises sont sur l’Aperçu — ajoutez ou retirez des puces depuis votre catalogue, pour toujours affecter le bon technicien au bon job.',

  // Chapter 5 · Jobs Tab
  'L’onglet Tâches liste les tâches couvertes par cet envoi, regroupées par installation. Filtrez par statut ou type d’activité — installation, réparation, maintenance, inspection, service — pour vous concentrer sur l’essentiel.',
  'Quand un envoi porte tous les jobs d’un ordre de service, le technicien fixe un job Courant. Chaque saisie qui suit est pré-remplie sur ce job — une visite, un technicien, l’ordre entier traité.',

  // Chapter 6 · Time & Expenses
  'Temps & Frais, c’est là que le job devient facturable. Bookez la main-d’œuvre par durée ou par heures début-fin — les types viennent de vos lookups : déplacement, travail, préparation, documentation, nettoyage — et chaque saisie se rattache au bon job.',
  'Consignez les frais sur le champ — déplacement, repas, parking, fournitures, autre — montant en TND, note, date, et sur un envoi multi-jobs, le job concerné.',
  'Les totaux planifiés en ligne s’affichent juste à côté du réel — minutes de main-d’œuvre, frais et matériels chiffrés — pour que les dépassements se voient dès qu’ils apparaissent.',

  // Chapter 7 · Materials
  'L’onglet Matériels enregistre les pièces utilisées — tirées de l’inventaire ou du stock du van — le stock se décrémente automatiquement. Sur les envois multi-jobs, chaque pièce est marquée sur le job qui l’a consommée.',
  'Ouvrez une pièce utilisée pour son détail complet — SKU, catégorie, stock disponible, fournisseur, emplacement, coût et technicien qui l’a posée — avec confirmation avant toute suppression.',

  // Chapter 8 · Attachments & Checklists
  'Les Pièces jointes unifient chaque document pertinent — fichiers déposés sur l’envoi, plus les documents liés à son ordre de service, sa vente et son offre — tout accessible au même endroit.',
  'Les Checklists suivent aussi — la checklist de l’envoi, celle de l’ordre de service lié, et la checklist par job définie sur chaque ligne de service — toutes complétées dans la même vue.',

  // Chapter 9 · Activity
  'L’onglet Activité est la chronologie complète — changements de statut, ajouts de matériels, temps consignés, notes écrites — tout horodaté, avec badges Activité système et Note utilisateur pour que la provenance soit toujours claire.',
  'Ajoutez une note en ligne directement dans la chronologie — un commentaire client, un suivi à faire, une astuce pour la prochaine visite — sauvegardée et partagée avec le bureau instantanément.',

  // Chapter 10 · Share, Send, PDF
  'Partager ouvre un dialogue de partage professionnel — un lien sécurisé, des options pour inclure ou masquer des sections, et le suivi dès que le client l’ouvre.',
  'Envoyer compose le rapport d’intervention en e-mail — PDF généré en pièce jointe, objet et corps pré-remplis, et l’envoi tracé dans l’activité de l’envoi.',
  'Le rapport d’intervention lui-même est un document soigné et à votre marque — client et site, tâches réalisées, heures et pièces totalisées, notes et pièces jointes — un enregistrement complet de la visite.',

  // Chapter 11 · PDF Settings
  'Depuis l’aperçu PDF, le studio de réglages s’ouvre avec cinq onglets — Données, Mise en page, Couleurs, Typographie, Avancé — plus Importer, Exporter et Réinitialiser, pour que chaque rapport porte votre marque exactement comme vous le voulez.',

  // Chapter 12 · Wrap-up
  'Voilà Envois de bout en bout — une liste nette avec carte, export et actions groupées ; un espace technicien avec numéro modifiable, flux de statut, compétences requises, temps, frais et matériels par job, pièces jointes et checklists unifiées, chronologie d’activité vivante, et rapport à votre marque. Votre équipe terrain, dans votre poche et sur un seul écran.',
];

if (CAPTIONS_FR.length !== DP_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[dispatches demo] caption count mismatch', { en: DP_STEPS.length, fr: CAPTIONS_FR.length });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
