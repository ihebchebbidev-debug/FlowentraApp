// Translations for the Settings autopilot demo (EN + FR).
// English captions live inline in settingsDemoScript.ts. The FR caption array
// must stay exactly SET_STEPS.length long (asserted at runtime) in step order.

import { SET_STEPS, SET_CHAPTERS } from './settingsDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(SET_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview':    'Vue d’ensemble',
    'profile':     'Compte',
    'users':       'Utilisateurs',
    'permissions': 'Permissions',
    'skills':      'Compétences',
    'preferences': 'Préférences',
    'admin':       'Outils admin',
    'wrapup':      'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Bienvenue dans les Paramètres — le centre de contrôle de tout votre espace de travail Flowentra. Votre profil, votre entreprise, les personnes de votre équipe, ce que chacune peut faire et le comportement de l’application : tout vit ici, au même endroit.',
  'Tout est réparti en deux groupes. Personnel — votre profil, votre entreprise, la sécurité, les préférences et les données hors-ligne. Et Administration — utilisateurs, rôles, intégrations, abonnement, outils système et historique de synchronisation.',
  'Commencez par votre profil. Ajoutez une photo, définissez votre prénom et nom, votre e-mail, téléphone et entreprise. C’est votre identité personnelle dans l’espace de travail — enregistrez, et tout se met à jour partout.',
  'Les paramètres d’entreprise contiennent votre marque. Téléchargez un logo — il apparaît dans la barre latérale, l’en-tête, la page de connexion et chaque rapport PDF — puis renseignez le nom, le site web et le téléphone de l’entreprise.',
  'La Sécurité, c’est là que vous changez votre mot de passe — saisissez l’actuel, puis le nouveau deux fois pour confirmer. Votre compte verrouillé en quelques secondes.',
  'Voici maintenant le cœur de l’administration — vos collaborateurs. Ouvrez Utilisateurs pour voir tous ceux qui ont accès à l’espace de travail.',
  'Voici l’annuaire de votre équipe — chaque membre avec son avatar, son e-mail, les rôles qu’il détient, s’il est actif et sa date d’arrivée. Le propriétaire de l’espace est toujours épinglé en haut.',
  'À mesure que l’équipe grandit, la recherche et les filtres gardent tout maîtrisable — affinez par statut, rôle ou pays pour trouver la bonne personne en quelques secondes.',
  'Ajouter un collègue est tout aussi rapide. Cliquez Ajouter un utilisateur pour ouvrir le formulaire.',
  'Ajoutez une photo, son nom, un e-mail unique — vérifié en direct pendant la saisie — un mot de passe initial, le téléphone et le code pays. Créez, et le compte est prêt.',
  'Le voilà — actif dans votre annuaire. Depuis le menu d’actions, vous pouvez modifier les informations, attribuer ses rôles ou retirer l’accès dès qu’une personne part. Les rôles s’attribuent ici, séparément — une personne peut donc en cumuler plusieurs.',
  'Mais on ne définit jamais les permissions personne par personne. On construit plutôt des Rôles — des ensembles d’accès réutilisables que vous attribuez aux gens. Ouvrons-les.',
  'Chaque rôle est un profil de poste — Administrateur, Manager, Répartiteur, Commercial, Technicien — avec sa description, le nombre de personnes qui le détiennent, son statut et sa date de création. Modifiez un rôle une fois, et tout le monde dans ce rôle se met à jour ensemble.',
  'Ouvrez un rôle et passez à son onglet Permissions — c’est ici que l’accès est réellement défini, organisé par catégorie : CRM, Service terrain, Temps & Dépenses, Inventaire et Administration.',
  'Chaque module se déploie en quatre actions — Voir, Créer, Modifier et Supprimer — et un badge indique combien sont accordées. Tout accorder ou Tout révoquer bascule un module entier d’un clic.',
  'Ainsi un Répartiteur peut voir et modifier les jobs sans jamais les supprimer ; un Commercial voit les offres mais pas la paie. Cochez exactement ce dont chaque rôle a besoin, puis Enregistrer les permissions — le moindre privilège par conception, rien de plus.',
  'Les rôles portent plus que des permissions — ils portent des compétences. Depuis un rôle, vous pouvez gérer les compétences qu’il requiert.',
  'Chaque compétence a un niveau — débutant, intermédiaire, avancé ou expert — et une catégorie. Elles proviennent directement de votre liste de Compétences, pour que toute l’entreprise parle un seul langage. Choisissez-en une et attribuez-la d’un clic.',
  'Et ce ne sont pas de simples libellés. Le tableau d’envoi associe automatiquement les compétences requises d’un job aux bonnes personnes qualifiées — vos paramètres ici alimentent une planification plus intelligente sur le terrain.',
  'Les Préférences façonnent le ressenti de l’application. Choisissez votre thème, une couleur d’accent principale, votre langue, la disposition de navigation — barre latérale ou barre supérieure — et l’affichage des listes en tableaux ou en cartes.',
  'Passez en sombre et tout l’espace de travail suit instantanément. Vos préférences n’appartiennent qu’à vous et ne changent jamais ce que voient vos collègues — puis Enregistrer les préférences pour les conserver.',
  'Vous gérez plusieurs activités ? Les Entreprises permettent aux propriétaires de gérer plusieurs espaces de travail — chacun avec sa propre équipe, sa marque et ses données — et de basculer entre eux d’un clic.',
  'Enfin, le Système réunit les contrôles techniques — journaux d’activité, historique de synchronisation, intégrations, votre abonnement et la numérotation des documents pour les offres, ventes, ordres de service et plus — pour que les admins gardent toute l’exploitation en bonne santé depuis un seul écran.',
  'Voilà les Paramètres — votre profil, votre entreprise et la sécurité, les personnes de votre équipe, les rôles, permissions précises et compétences qui les régissent, vos préférences et les outils d’administration qui font tourner le tout. Un seul centre de contrôle pour tout votre espace de travail.',
];

if (CAPTIONS_FR.length !== SET_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[settings demo] caption translation count mismatch', { en: SET_STEPS.length, fr: CAPTIONS_FR.length });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
