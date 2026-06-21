// Translations for the Dispatches autopilot demo (EN + FR).
// English captions live inline in dispatchesDemoScript.ts. FR/AR arrays must stay
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
    'overview': 'Vue d’ensemble', 'controls': 'Filtres & Vues', 'detail': 'Ticket de job',
    'jobs': 'Tâches', 'time': 'Temps & Frais', 'materials': 'Matériels',
    'evidence': 'Preuves', 'signoff': 'Validation', 'report': 'Rapport', 'multijob': 'Envoi multi-jobs', 'wrapup': 'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Bienvenue dans Envois — le ticket de job du technicien. Quand un ordre de service est affecté, il devient un envoi : un job terrain qu’un technicien confirme, rejoint, exécute et fait valider — chaque heure, pièce et photo capturée en chemin.',
  'Quatre cartes KPI suivent votre débit terrain, et chacune filtre la liste. Total compte chaque envoi de votre équipe.',
  'Confirmés montre les jobs que les techniciens ont acceptés et sont prêts à démarrer — votre travail engagé pour la journée.',
  'En cours, c’est le travail qui se déroule sur site en ce moment — d’un coup d’œil, vous savez qui fait quoi à la minute.',
  'Terminés montre les jobs finis — validés et prêts à alimenter la facturation. Le pouls de votre opération terrain.',
  'Le tableau des envois liste chaque ticket avec son ordre de service, client, technicien affecté, statut, priorité et planning — cliquez un technicien pour voir son profil, ou une ligne pour ouvrir le job.',
  'Recherchez instantanément par numéro d’envoi, ordre de service, technicien et client — trouvez n’importe quel job en quelques secondes.',
  'Les filtres affinent par statut et priorité — faites ressortir les jobs urgents et ceux encore à confirmer.',
  'Basculez entre un Tableau dense pour scanner et une Liste aérée pour le détail — votre choix est mémorisé.',
  'Sélectionnez plusieurs envois pour agir ensemble — supprimez en lot les tickets annulés en une étape confirmée, dans le respect des permissions.',
  'Ouvrez un envoi pour atteindre l’espace du technicien — le job, son client, et les actions du terrain : naviguer, appeler, envoyer et mettre à jour le statut.',
  'Le flux de statut reflète une vraie journée terrain — En attente, Planifié, Confirmé, En cours, Terminé — avec branches Rejeter et Annuler. Le technicien le fait avancer depuis son téléphone au fil du job.',
  'La carte technicien montre qui est affecté, ses compétences, son téléphone et son statut en direct — un appui pour l’appeler ou lui écrire, pour que bureau et terrain restent synchronisés.',
  'L’onglet Tâches liste les tâches couvertes par cet envoi. Un seul envoi peut porter tous les jobs d’un ordre de service — un technicien prend en charge l’ordre entier en une visite, chaque job cochable au fur et à mesure.',
  'Ouvrez une tâche pour son brief complet — le problème, l’équipement, les compétences requises et tout historique — pour que le technicien arrive prêt, sans deviner.',
  'Temps & Frais, c’est là que le job devient facturable. Tout ce que le technicien consigne sur site atterrit ici et alimente directement la facture.',
  'Bookez la main-d’œuvre d’un geste — lancez et arrêtez un chrono, ou saisissez les heures directement. Quand l’envoi porte plusieurs jobs, vous choisissez à quel job le temps se rattache, pour que chaque minute tombe sur le bon job et le bon technicien.',
  'Consignez les frais sur le champ — déplacement, parking, consommables — joignez le reçu, et sur un envoi multi-jobs, marquez le job concerné, pour que chaque coût soit récupéré sur le bon job.',
  'L’onglet Matériels enregistre les pièces utilisées — tirées de l’inventaire ou du stock du van — le stock se décrémente automatiquement. Sur un envoi multi-jobs, vous choisissez à quel job chaque pièce se rattache, pour un coût par job exact et une facturation précise.',
  'Ajoutez une pièce depuis le catalogue d’un geste — quantité et prix pré-remplis — transformant ce qui a été posé en une ligne facturable précise, sans paperasse.',
  'Les Pièces jointes contiennent les preuves terrain — photos avant/après, plaque signalétique de l’équipement, bon de livraison — la preuve que le job a été bien fait.',
  'Les Checklists guident le technicien dans les étapes obligatoires — isolation de sécurité, résultats de test, critères d’achèvement — pour que chaque job atteigne le même standard.',
  'Les Notes capturent ce que les photos ne peuvent pas — les commentaires du client, un suivi nécessaire, une astuce pour la prochaine visite — partagées instantanément avec le bureau.',
  'L’onglet Activité est la chronologie complète — confirmé, en route, sur site, terminé — chaque étape horodatée, un enregistrement immuable de la journée terrain.',
  'Et cela se termine par la signature du client, capturée sur l’appareil — le moment d’achèvement consigné, transformant un job fini en une preuve sur laquelle vous pouvez compter.',
  'Envoyez le rapport d’intervention au client en un clic — le PDF signé joint, l’envoi suivi — il est informé avant même que le technicien quitte le site.',
  'Le rapport d’intervention est un document soigné et à votre marque — le client et le site, les tâches réalisées, les heures et les pièces, et la signature capturée — un enregistrement complet de la visite.',
  'Et la mise en page vous appartient — un studio pour couleurs, typographie, disposition et champs affichés, pour que chaque rapport porte votre marque.',
  'Téléchargez-le, imprimez-le ou envoyez-le — le même rapport net à chaque fois, heures et matériels totalisés automatiquement et prêts à facturer.',
  'Quand vous planifiez tout un ordre de service en un seul envoi, chaque job voyage dans le même ticket. L’onglet Tâches les montre tous, et le technicien en marque un comme job Courant — un technicien, une visite, l’ordre complet.',
  'Chaque saisie est rattachée à un job, et le job Courant est présélectionné — donc avant de consigner du temps, un frais ou une pièce, le bon job est déjà choisi (modifiable). Main-d’œuvre, coûts et matériels remontent au bon job, pas seulement à l’envoi.',
  'Les checklists suivent aussi : chaque job porte la checklist définie sur sa ligne de service dans le devis ou la vente — le technicien réalise les bonnes étapes pour chaque job, regroupées par job.',
  'Voilà Envois de bout en bout — des KPI sur votre équipe terrain, un espace technicien avec un vrai flux de statut, le booking temps et frais, les matériels du stock, photos, checklists, une signature capturée, et un rapport d’intervention à votre marque.',
  'Les ordres de service deviennent des envois, les envois des jobs validés, et chaque heure et pièce revient à la facturation. C’est votre équipe terrain, dans votre poche et sur un seul écran.',
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
