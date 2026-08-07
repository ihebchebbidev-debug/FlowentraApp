// Translations for the Dynamic Forms autopilot demo (EN + FR).
// English captions live inline in dynamicFormsDemoScript.ts. The FR caption array
// must stay exactly DF_STEPS.length long (asserted at runtime) in step order.

import { DF_STEPS, DF_CHAPTERS } from './dynamicFormsDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(DF_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview':  'Vue d’ensemble',
    'builder':   'Le constructeur',
    'fields':    'Types de champs',
    'config':    'Configurer',
    'logic':     'Logique & Données',
    'finish':    'Finaliser & Partager',
    'preview':   'Aperçu',
    'public':    'Formulaire public',
    'responses': 'Réponses',
    'wrapup':    'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Bienvenue dans les Formulaires dynamiques — votre constructeur de formulaires sans code. Glissez des champs pour concevoir n’importe quel formulaire, ajoutez de la logique et des données en direct, publiez un lien public, et collectez les réponses directement dans Flowentra — sans écrire une ligne de code.',
  'Chaque formulaire que vous avez créé vit ici — son nom, son statut, et le nombre de réponses collectées. Modifier, prévisualiser, partager, dupliquer ou ouvrir ses réponses, tout depuis une seule ligne.',
  'Les formulaires suivent un cycle simple — Brouillon pendant la conception, Publié une fois en ligne et partageable, et Archivé une fois retiré. Filtrez par statut pour vous concentrer sur l’essentiel.',
  'Construisons-en un de zéro. Nouveau formulaire ouvre le constructeur visuel — un studio en glisser-déposer où le formulaire prend forme sous vos yeux.',
  'Voici le constructeur — trois volets. À gauche, une palette de champs ; au centre, votre canevas en direct ; à droite, les propriétés de ce que vous sélectionnez. Construire, voir et affiner au même endroit.',
  'La palette contient chaque type de champ, regroupé — saisies de base, champs de choix, avancés comme signature et notation, et blocs de mise en page. Saisissez-en un et déposez-le sur le canevas.',
  'Le canevas est votre formulaire, exactement comme le verront les utilisateurs. Glissez des champs, réorganisez-les, et répartissez-les sur la largeur — c’est WYSIWYG dès la première seconde.',
  'Sélectionnez un champ et le panneau de propriétés ouvre sa configuration complète — libellés en anglais et français, texte d’aide, validation, options, logique et données, le tout par onglets et bien rangé.',
  'Commencez par les bases — texte, texte long, nombre, e-mail et téléphone. Déposez un Nom complet et un E-mail et votre formulaire capture déjà l’essentiel.',
  'Ajoutez des champs de choix — cases à cocher, boutons radio et listes déroulantes — pour des réponses structurées. Une liste Service transforme du texte libre en données propres et exploitables.',
  'Puis les champs avancés — une Notation par étoiles pour mesurer la satisfaction, et un pavé de Signature pour capturer une validation réelle, à valeur juridique, directement sur l’appareil.',
  'Les blocs de mise en page façonnent l’expérience — des Sections pour grouper les champs, du Contenu enrichi pour les instructions, et un Saut de page pour découper un long formulaire en étapes agréables.',
  'Configurez chaque champ dans le détail — son libellé dans les deux langues, s’il est obligatoire, et sa largeur : pleine, moitié ou tiers, pour que deux champs tiennent côte à côte proprement.',
  'La validation garde les réponses propres — longueur minimale et maximale, plages numériques, et règles de format — pour qu’un e-mail soit vraiment un e-mail avant que le formulaire ne se soumette.',
  'Pour les champs de choix, gérez les options ici même — ajouter, renommer, réordonner, chacune libellée en anglais et français — exactement ce que l’utilisateur sélectionne.',
  'Et les petites touches comptent — texte d’indication, lignes d’aide et descriptions de champ guident la personne qui remplit, pour que votre formulaire soit aussi clair que puissant.',
  'Place à la magie — la logique conditionnelle. Affichez ou masquez un champ selon une autre réponse : demandez « qu’est-ce qui n’a pas marché ? » seulement quand quelqu’un vous note en dessous de trois étoiles. Le formulaire s’adapte à chaque personne.',
  'Les listes déroulantes peuvent tirer des données en direct de Flowentra — liez un champ à vos Contacts, Articles ou Emplacements, et les options restent synchronisées avec vos vraies données, jamais obsolètes.',
  'Enchaînez-les en listes en cascade — choisissez un client et le champ suivant n’affiche que les sites de ce client. Dépendant, filtré, et sans effort pour la personne qui remplit.',
  'Un saut de page transforme un long formulaire en un parcours guidé en plusieurs étapes avec une barre de progression — bien moins intimidant, et prouvé pour augmenter le taux de complétion.',
  'Concevez ce qui se passe après l’envoi — une page de Remerciement personnalisée, avec des messages conditionnels qui changent selon la réponse, et une redirection optionnelle vers votre site après quelques secondes.',
  'Le partage est un clic — générez un lien public que n’importe qui peut ouvrir et soumettre sans se connecter, prêt à glisser dans un e-mail, un QR code ou votre site web.',
  'Quand il est prêt, Publiez le formulaire — il passe de Brouillon à en ligne, le lien public s’active, et il commence à accepter des réponses immédiatement.',
  'Avant de le diffuser, l’Aperçu montre le formulaire réel et fonctionnel — chaque champ, votre identité visuelle, le parcours multi-étapes — exactement comme un visiteur l’expérimentera.',
  'Parcourez-le page par page — la barre de progression se remplit, les champs conditionnels apparaissent et disparaissent, et la validation s’exécute en direct, pour livrer un formulaire que vous avez réellement testé.',
  'Voici le formulaire public que voient vos clients — épuré, à votre marque, et adapté au mobile, ouvert depuis le lien sans compte ni friction.',
  'Ils le remplissent comme vous l’avez conçu — la notation, le suivi conditionnel, la signature — chaque interaction fluide, guidée par vos indications et votre validation.',
  'Ils soumettent, et votre page de Remerciement apparaît — confirmant la réception, et redirigeant ensuite si vous l’avez paramétré. La réponse est déjà en route vers Flowentra.',
  'Chaque soumission arrive dans la vue Réponses — qui a répondu, quand, et un compteur en direct — construisant un jeu de données propre dès la mise en ligne de votre formulaire.',
  'Ouvrez une réponse pour voir chaque réponse présentée — y compris la signature et la notation capturées — un enregistrement complet et lisible de ce qui a été soumis.',
  'Exportez le tout en un clic — l’ensemble des réponses vers Excel pour l’analyse, ou n’importe quelle réponse en PDF à votre marque pour vos archives.',
  'Mieux encore, poussez une réponse directement dans Flowentra — transformez une soumission en Contact, Ordre de service ou Ticket en une étape. Le formulaire n’est pas une impasse ; il alimente toute votre activité.',
  'Voilà les Formulaires dynamiques de bout en bout — un constructeur en glisser-déposer avec treize types de champs, logique conditionnelle, données en direct et listes en cascade, pages multi-étapes, page de remerciement, partage public, et des réponses qui reviennent dans votre activité.',
  'Enquêtes, formulaires d’admission, inspections, validations, capture de prospects — concevez-le une fois, partagez un lien, et regardez les données structurées affluer. Créez votre premier formulaire et mettez-le au travail.',
];

if (CAPTIONS_FR.length !== DF_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[dynamic-forms demo] FR caption count mismatch', { en: DF_STEPS.length, fr: CAPTIONS_FR.length });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
