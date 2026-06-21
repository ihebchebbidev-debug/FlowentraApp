// Translations for the Planning & Dispatch autopilot demo (EN + FR).
// English captions live inline in planningDemoScript.ts as the source-of-truth
// fallback. The FR caption array must stay exactly PL_STEPS.length long
// (asserted at runtime below) and in the same order as the steps.

import { PL_STEPS, PL_CHAPTERS } from './planningDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

// ─── Chapter titles ──────────────────────────────────────────────────────────
export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(PL_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview':   'Aperçu des envois',
    'controls':   'Filtres & Vues',
    'calendar':   'Tableau de planification',
    'unassigned': 'Jobs non planifiés',
    'dragdrop':   'Glisser-déposer',
    'suggest':    'Suggestion intelligente',
    'autofill':   'Remplissage auto',
    'map':        'Vue carte',
    'profiles':   'Profils de planification',
    'scheduler':  'Heures de travail',
    'singledispatch': 'Envoi unique',
    'wrapup':     'Conclusion',
  },
};

// ─── Step captions ───────────────────────────────────────────────────────────

const CAPTIONS_FR: string[] = [
  'Bienvenue dans Planification & Envoi — la tour de contrôle de vos opérations terrain. Elle transforme les ordres de service en travail planifié, affecte le bon technicien à chaque job, et suit chaque envoi jusqu’à la clôture.',
  'Quatre cartes KPI en haut, chacune étant un filtre en un clic. Total compte chaque envoi en cours dans toute votre équipe.',
  'Affecté affiche les jobs qui ont un technicien mais n’ont pas encore démarré — votre file prête à partir pour la journée.',
  'En cours, c’est le travail qui se déroule maintenant sur site — d’un coup d’œil, vous savez exactement ce que fait votre terrain à la minute.',
  'En attente signale les envois qui attendent encore un technicien — la file qui réclame votre attention avant que la journée ne file.',
  'Le tableau des envois liste chacun avec son ordre de service, le client, le statut, la priorité et l’heure planifiée — cliquez une ligne pour ouvrir le job, ou le client pour aller à sa fiche CRM.',
  'La recherche balaie instantanément les numéros d’envoi, les ordres de service, les techniciens et les clients — trouvez n’importe quel job en quelques secondes.',
  'Les filtres réduisent par statut et priorité — combinez « En attente » et « Urgent » pour faire ressortir exactement ce qu’il faut envoyer en premier.',
  'Basculez entre un Tableau dense pour scanner et une Liste aérée pour le détail — et un Kanban pour glisser les envois entre colonnes de statut. Votre choix est mémorisé.',
  'Sélectionnez plusieurs envois pour agir ensemble — supprimez en lot les travaux annulés ou en double en une étape confirmée, dans le respect des permissions.',
  'Mais la vraie magie, c’est le tableau de planification. Cliquez Envoyer les jobs pour ouvrir le poste de pilotage où le travail non planifié rencontre le calendrier de votre équipe.',
  'Voici le tableau de planification. À gauche, les calendriers de vos techniciens ; à droite, les jobs encore à planifier — le glisser-déposer transforme l’un en l’autre.',
  'Chaque technicien est une colonne ; la journée se déroule de haut en bas en créneaux horaires. Heures de travail, congés et jobs existants sont disposés pour voir instantanément qui a de la capacité.',
  'Un job planifié est un bloc coloré — par statut, priorité, ordre de service ou technicien — montrant client, heure et durée d’un coup d’œil. Cliquez pour ouvrir, ou glissez pour replanifier.',
  'Basculez entre les vues Jour et Semaine pour planifier à la bonne altitude — une journée chargée, ou toute la forme de la semaine à travers l’équipe.',
  'La barre latérale droite contient chaque job non planifié, regroupé par ordre de service pour garder le travail lié ensemble. C’est votre boîte de réception de planification.',
  'La recherche reste ici, et un seul bouton Filtres ouvre tout le reste — filtrez par priorité ou statut, triez par urgence, plus récents ou durée, et groupez la file en sections repliables par contact, statut ou date de création. Les ordres de service restent repliés : vous voyez l’ordre et révélez ses jobs au survol.',
  'Par défaut, le tableau affiche des ordres de service entiers, pas des jobs individuels — pour planifier tout un ordre d’un coup. Dépliez-en un pour révéler ses jobs, chacun marqué d’un point de priorité.',
  'Survolez pour voir le reste — et vous décidez exactement ce qui apparaît : client, site, durée, compétences, et même les jobs de l’ordre de service. Le contenu du survol est entièrement configurable dans les Profils de planification.',
  'Un bouton Afficher planifiés révèle ce qui est déjà programmé à côté du backlog — rien n’est doublement réservé et vous voyez toujours la charge complète.',
  'La planification est physique : saisissez un job, une installation entière ou tout un ordre de service et glissez-le sur le calendrier d’un technicien.',
  'Déposez-le sur un créneau et l’envoi est créé instantanément. Déposez tout un ordre de service et il devient un seul envoi regroupant tous ses jobs — affecté, planifié et visible par le technicien en temps réel.',
  'Et c’est sûr : si le créneau chevauche un travail existant ou sort des heures de travail, le tableau vous avertit avant de confirmer — aucune double réservation accidentelle.',
  'Pas sûr de qui convient le mieux ? La Planification intelligente réfléchit pour vous. Ouvrez Suggérer pour une liste classée des meilleurs techniciens pour chaque job non planifié.',
  'Chaque technicien est noté sur 100 et classé — le meilleur choix est mis en avant, une bonne affectation est à un clic même un jour chargé.',
  'Le score est transparent : compétences correspondantes, disponibilité actuelle, distance du site, et une pénalité d’équilibrage pour que le même technicien vedette ne croule pas sous tous les jobs. Une planification fiable et explicable.',
  'Besoin de planifier toute une journée d’un coup ? Le Remplissage auto programme chaque ordre de service non planifié — par défaut une seule intervention par ordre de service (tous ses jobs), en choisissant le meilleur technicien et le premier créneau libre dans ses heures de travail.',
  'Il prévisualise exactement ce qu’il va faire — combien d’ordres de service, sur combien de techniciens — et ne touche jamais aux affectations existantes ni au passé. Vous préférez une intervention par job ? Changez le réglage dans votre profil de planification.',
  'Lancez-le et le tableau se remplit en quelques secondes — jobs placés bout à bout, conflits évités, priorités d’abord. Une journée entière planifiée en un clic, prête à être ajustée.',
  'Le travail terrain est géographique, alors le tableau a une carte. Passez en vue Carte pour voir chaque job et technicien placés par emplacement.',
  'Le routage devient évident — regroupez les jobs proches, repérez le technicien déjà dans le secteur, et réduisez le temps de route pour toute l’équipe.',
  'Affectez directement depuis la carte : choisissez une épingle de job, le technicien disponible le plus proche, et l’envoi est créé — géographie et planification en un seul geste.',
  'Chaque répartiteur travaille différemment, alors tout le tableau est configurable via les Profils de planification — des configurations enregistrées que vous changez en un clic.',
  'Gardez des profils privés pour vous, ou partagés pour l’équipe — « Plomberie — Nord », « Urgences seulement », « Semaine complète ». Dupliquez, étoilez un défaut, et appliquez instantanément.',
  'Les réglages d’affichage façonnent le tableau — et les cartes elles-mêmes. Choisissez ce que montre l’étiquette de chaque carte : numéro d’ordre de service, nom du contact, installation, ou une combinaison comme « SO-123 · Acme Corp », et exactement quels champs s’affichent au survol. Le mode, jour ou semaine, les week-ends et les couleurs sont aussi ici.',
  'Choisissez quels techniciens apparaissent — masquez ceux sans heures de travail ou en congé aujourd’hui — pour que le tableau ne montre que l’équipe que vous planifiez vraiment.',
  'Filtrez par compétences requises — au moins une ou toutes — et triez les techniciens selon leur adéquation, pour que les bons spécialistes remontent automatiquement.',
  'Les permissions et comportements sont ici : le réglage par défaut « Remplissage auto : une intervention par ordre de service », la planification dans le passé, la confirmation en cas de chevauchement, et qui peut modifier ou désaffecter les envois — une planification sûre pour chaque rôle.',
  'Enregistrez et appliquez, et tout le tableau se remodèle selon votre profil en un instant — une config pour les urgences, une autre pour les semaines de routine, basculées quand vous voulez.',
  'Tout cela repose sur le fait de savoir quand votre équipe travaille. Le Planificateur gère les heures de travail de chaque technicien, jour par jour.',
  'Définissez les heures de début et de fin par jour, avec pauses et jours de repos — ces heures bornent le calendrier, pilotent le remplissage auto, et décident qui peut prendre un job tardif.',
  'Modifiez l’horaire d’un technicien et tout le tableau le respecte aussitôt — une capacité toujours exacte, pour des plans toujours réalistes.',
  'Vous planifiez tout un ordre de service ? Quand vous le déposez sur le calendrier, cette boîte de dialogue s’ouvre. Le bouton « Planifier en une seule intervention » — activé par défaut — crée un seul envoi regroupant tous les jobs de l’ordre, pour qu’il voyage comme une seule visite. Désactivez-le pour créer un envoi par job.',
  'Voilà Planification & Envoi de bout en bout — un aperçu des envois, un calendrier en glisser-déposer, des suggestions intelligentes et un remplissage auto en un clic, une carte de routage, des profils configurables et les heures de travail de l’équipe, tout connecté.',
  'Les ordres de service arrivent, le bon technicien est associé en quelques secondes, et chaque job est suivi jusqu’au bout. Ouvrez le tableau et planifiez votre journée — toute votre équipe terrain, orchestrée depuis un seul écran.',
];


// Sanity-check translation arrays match step count.
if (CAPTIONS_FR.length !== PL_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[planning demo] caption translation count mismatch', {
    en: PL_STEPS.length, fr: CAPTIONS_FR.length,
  });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}

export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
