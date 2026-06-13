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
    'views':    'Recherche & Vues',
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
  'Le tableau est votre pipeline, étape par étape — Prospect, Qualifiée, Proposition, Négociation, puis Gagnée ou Perdue. Chaque colonne affiche son nombre et sa valeur totale.',
  'Glissez simplement une carte pour faire avancer une affaire. Amenez celle-ci en Négociation et son étape se met à jour aussitôt — votre prévision se recalcule avec elle.',
  'Recherchez par titre d’affaire, client et numéro — trouvez n’importe quelle opportunité en quelques secondes.',
  'Filtrez le pipeline par étape pour vous concentrer exactement sur les affaires qui comptent maintenant.',
  'Vous préférez une vue tableur ? Passez du tableau à une liste triable avec valeur, probabilité et date de clôture côte à côte.',
  'Toutes les affaires d’un seul regard — étape, client, valeur et probabilité de conclusion.',
  'Créons une affaire. Ajouter une affaire ouvre un formulaire simple — plus léger qu’un devis, car une affaire sert à suivre l’opportunité, pas encore à chiffrer un document.',
  'Choisissez le client dans vos Contacts — chaque affaire est liée à un compte réel de votre CRM.',
  'Définissez l’étape, la valeur estimée et la probabilité de conclusion. C’est tout ce qu’il faut pour que l’affaire compte dans votre pipeline et votre prévision.',
  'Ajoutez si besoin des lignes directement depuis votre catalogue — articles comme services — pour que l’affaire porte déjà ce que vous comptez vendre.',
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
  'Voilà les Affaires — un pipeline visuel avec une prévision en temps réel, une façon rapide de capturer les opportunités, et la conversion en ventes et projets en un clic. Suivez chaque opportunité, du premier prospect à la victoire.',
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
