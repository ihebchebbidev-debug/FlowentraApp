// Translations for the Lookups autopilot demo (EN + FR).
// English captions live inline in lookupsDemoScript.ts. The FR caption array must
// stay exactly LK_STEPS.length long (asserted at runtime) in step order.

import { LK_STEPS, LK_CHAPTERS } from './lookupsDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(LK_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview': 'Vue d’ensemble',
    'anatomy':  'Anatomie',
    'add':      'Ajouter une valeur',
    'manage':   'Gérer',
    'typed':    'Listes intelligentes',
    'powers':   'Source unique',
    'wrapup':   'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Bienvenue dans les Listes de référence — le panneau de contrôle derrière chaque menu déroulant de Flowentra. Statuts, catégories, priorités, sources, compétences, emplacements : définissez-les une fois ici, et ils apparaissent, cohérents, partout où votre équipe travaille.',
  'À gauche, le catalogue complet des types de référence — répartis sur le CRM, les ventes, l’inventaire, le service terrain, les projets et les RH. Chacun est une liste que vous possédez et entretenez.',
  'Chaque type indique combien de valeurs il contient, pour toujours connaître la forme de votre configuration d’un coup d’œil.',
  'Cliquez un type et ses valeurs s’ouvrent à droite. Voici vos Statuts de tâche — les options exactes qui apparaissent quand quelqu’un définit le statut d’une tâche dans l’application.',
  'Chaque ligne est une valeur — son nom est exactement ce que voient les utilisateurs dans le menu. Renommez-la ici et elle se met à jour partout d’un coup.',
  'L’étoile marque la valeur par défaut — celle présélectionnée sur les nouveaux enregistrements. Une seule par liste, pour qu’une nouvelle tâche démarre toujours dans le bon état sans que personne n’ait à choisir.',
  'Et l’interrupteur de statut retire une valeur sans supprimer son historique — passez-la en inactive et elle disparaît des nouveaux menus tandis que les anciens enregistrements gardent leur libellé.',
  'Ajouter une valeur prend quelques secondes. Cliquez Ajouter pour ouvrir le formulaire — pas de développeur, pas de déploiement, votre configuration vous appartient.',
  'Donnez-lui un nom et un ordre de tri — l’ordre de tri décide exactement de sa place dans le menu, pour que les options les plus utilisées viennent en premier.',
  'Certaines listes portent un sens supplémentaire. Un Statut de tâche peut être marqué comme état terminé — pour que l’application sache que la tâche est finie, et pas seulement nommée différemment. Activez-la pour la publier.',
  'Enregistrez, et la nouvelle valeur rejoint la liste instantanément — active dans tous les menus de l’application dès la confirmation.',
  'Modifiez n’importe quelle valeur pour la renommer, changer son ordre, basculer ses drapeaux ou ajuster sa couleur — le même formulaire, ouvert sur une ligne existante.',
  'Cliquez l’étoile d’une autre valeur pour en faire la nouvelle valeur par défaut — Flowentra rétrograde l’ancienne automatiquement, il y en a donc toujours exactement une.',
  'Et supprimez une valeur dont vous n’avez plus besoin — avec une confirmation, et en toute sécurité, car les valeurs utilisées restent protégées pour que rien ne casse en aval.',
  'Les listes ne sont pas que des libellés — beaucoup portent des données que l’application exploite. Les Types de congé en sont un parfait exemple.',
  'Chaque type de congé est marqué payé ou non payé — et les RH utilisent ce drapeau automatiquement pour calculer les soldes et la paie. La liste n’est pas cosmétique ; elle pilote les calculs.',
  'Les Compétences portent une catégorie et alimentent le tableau d’envoi — le planificateur associe les compétences requises d’un job au bon technicien, le tout issu de cette seule liste.',
  'Les Emplacements pilotent l’inventaire et le travail terrain — les entrepôts et stocks de van entre lesquels vous transférez les pièces, et les sites que visitent vos techniciens, tous définis ici.',
  'Prenez les Sources d’offre — recommandation, site web, salon professionnel. Une simple liste en apparence…',
  '…mais ces valeurs exactes deviennent le menu sur chaque offre et vente — puis les colonnes de vos rapports. Entretenez la liste ici, et vos analyses restent propres et comparables.',
  'C’est la puissance d’une source unique de vérité — changez une valeur une fois, et chaque formulaire, badge, filtre et rapport de Flowentra se met à jour ensemble. Aucune dérive, aucun doublon, aucune donnée incohérente.',
  'Voilà les Listes de référence — un seul endroit pour définir chaque statut, catégorie, priorité, source, compétence et emplacement sur lesquels tourne votre activité, chacun modifiable en quelques secondes et instantanément cohérent partout.',
  'Configurez vos listes une fois, et le reste de Flowentra parle votre langage — vos statuts, vos catégories, vos termes. Ouvrez les Listes de référence et faites de l’application vraiment la vôtre.',
];

if (CAPTIONS_FR.length !== LK_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[lookups demo] caption translation count mismatch', { en: LK_STEPS.length, fr: CAPTIONS_FR.length });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
