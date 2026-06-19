// Translations for the Deals (pipeline) autopilot demo (EN + FR).
// English captions live inline in dealsDemoScript.ts. The FR caption array
// must stay exactly DL_STEPS.length long (asserted at runtime) in step order.

import { DL_STEPS, DL_CHAPTERS } from './dealsDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(DL_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview': 'Pipeline',
    'views':    'Tableau & Vues',
    'create':   'Créer une affaire',
    'detail':   'Espace de l’affaire',
    'convert':  'Convertir',
    'wrapup':   'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Bienvenue dans les Affaires — votre pipeline commercial. Une affaire est une opportunité : qui est le client, combien elle vaut, et à quel point elle est proche de la signature. Une fois gagnée, vous la transformez en vente ou en projet en un clic.',
  'Les cartes KPI résument votre pipeline d’un coup d’œil. Total des affaires compte chaque opportunité que vous suivez.',
  'Valeur en cours, c’est l’argent encore en jeu — la valeur de chaque affaire ni gagnée ni perdue. C’est votre prévision en temps réel.',
  'Valeur gagnée, c’est ce que vous avez déjà conclu — du revenu sécurisé, prêt à devenir des ventes et des projets.',
  'Et le Taux de réussite vous dit à quelle fréquence vous concluez — la part des affaires décidées qui se sont terminées par une victoire.',
  'En dessous, votre prévision en temps réel : le pipeline pondéré (valeur × probabilité), un entonnoir par étape, et le nombre d’affaires à risque — devenues silencieuses ou dont la relance est dépassée. Un coup d’œil suffit pour savoir où agir.',
  'Par défaut, vos affaires s’ouvrent dans une liste claire et triable — chaque opportunité avec son étape, son client, sa valeur et sa probabilité, côte à côte. Cliquez une ligne pour l’ouvrir.',
  'Vous préférez un pipeline visuel ? Un clic bascule les mêmes affaires vers un tableau kanban.',
  'Le tableau montre votre pipeline étape par étape — Prospect, Qualifiée, Proposition, Négociation, puis Gagnée ou Perdue. Chaque colonne affiche son nombre et sa valeur totale.',
  'Glissez simplement une carte pour faire avancer une affaire. Amenez celle-ci en Négociation et son étape se met à jour aussitôt — votre prévision se recalcule avec elle.',
  'Retour à la liste. Recherchez par titre d’affaire, client et numéro — trouvez n’importe quelle opportunité en quelques secondes.',
  'Et filtrez par étape pour vous concentrer exactement sur les affaires qui comptent maintenant.',
  'Créons une affaire. Ajouter une affaire ouvre un véritable espace de travail — la même structure qu’un devis ou une vente, avec un contact, des installations et un sélecteur d’articles du catalogue — tout en restant plus léger, sans document fiscal.',
  'Choisissez le contact — une personne ou une entreprise — depuis votre CRM, avec le même sélecteur que les offres et les ventes.',
  'À droite se trouve tout ce qui fait d’elle une affaire prévisible — étape, probabilité, devise et date de clôture prévue. Vous pouvez aussi relier l’installation du client.',
  'Ajoutez des articles et des services directement depuis votre catalogue — et reliez chacun à une installation — avec le même sélecteur d’articles que les offres et les ventes.',
  'Enregistrez, et l’affaire arrive dans la colonne Prospect, prête à parcourir votre pipeline.',
  'Ouvrez n’importe quelle affaire pour voir son tableau complet — titre, client, étape, et les actions les plus utiles : modifier et convertir.',
  'Les indicateurs clés sont en haut — valeur estimée, probabilité, date de clôture prévue, et l’origine de l’affaire.',
  'L’onglet Articles liste l’objet de l’affaire — les articles et services, avec leurs quantités et totaux.',
  'Activité, c’est la chronologie — création, changements d’étape, chaque note — un historique automatique de la progression de l’affaire.',
  'Et les Notes gardent le contexte — ce que le client a dit, la prochaine étape, les conditions convenues.',
  'Voici la magie. Quand une affaire est gagnée, vous ne ressaisissez rien — vous la convertissez. Convertir ouvre vos options.',
  'Convertissez en Vente, et une commande est créée avec le même client et les mêmes lignes — directement vers la facturation.',
  'Ou convertissez en Projet pour réaliser le travail — un projet est créé et relié à l’affaire. Une affaire peut même devenir les deux à la fois.',
  'Confirmez, et l’affaire passe en Gagnée et se relie à tout ce qu’elle est devenue — aucune double saisie, toute la chaîne reste connectée.',
  'Voilà les Affaires — une liste triable avec une prévision en temps réel, un tableau kanban optionnel, une façon rapide de capturer les opportunités, et la conversion en ventes et projets en un clic. Suivez chaque opportunité, du premier prospect à la victoire.',
];

if (CAPTIONS_FR.length !== DL_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[deals demo] caption translation count mismatch', { en: DL_STEPS.length, fr: CAPTIONS_FR.length });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
