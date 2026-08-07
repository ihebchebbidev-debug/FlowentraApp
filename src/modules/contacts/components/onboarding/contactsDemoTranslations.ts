// Translations for the Contacts (CRM) autopilot demo (EN + FR).
// English captions live inline in contactsDemoScript.ts as the source-of-truth
// fallback. The FR caption array must stay exactly CT_STEPS.length long
// (asserted at runtime below) and in the same order as the steps.

import { CT_STEPS, CT_CHAPTERS } from './contactsDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

// ─── Chapter titles ──────────────────────────────────────────────────────────
export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(CT_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview':  'Vue d’ensemble',
    'filters':   'Recherche & Filtres',
    'map':       'Vue carte',
    'bulk':      'Actions en lot',
    'create':    'Ajouter un contact',
    'import':    'Import en masse',
    'detail':    'Fiche contact',
    'crm':       'CRM 360°',
    'engage':    'Achats & Notes',
    'suppliers': 'Fournisseurs',
    'wrapup':    'Conclusion',
  },
};

// ─── Step captions ───────────────────────────────────────────────────────────

const CAPTIONS_FR: string[] = [
  'Bienvenue dans Contacts — votre carnet d’adresses CRM. Personnes, entreprises et fournisseurs au même endroit, chacun étant un pôle relié à ses offres, ventes, ordres de service, notes et historique.',
  'Trois cartes KPI en haut, qui sont aussi des filtres. La première affiche le total de vos contacts, tous types confondus.',
  'Cliquez Personnes pour réduire instantanément la liste aux individus — ceux avec qui vous traitez directement : décideurs, techniciens et prospects.',
  'Entreprises regroupe vos organisations — clients et partenaires — chacune pouvant contenir ses propres personnes, adresses et identité fiscale.',
  'Le tableau des contacts affiche le nom avec le rôle, l’entreprise, l’e-mail, le téléphone, un badge de type et un badge de statut. Cliquez une ligne pour ouvrir la fiche 360°.',
  'La barre de recherche correspond instantanément sur les noms, entreprises, e-mails et numéros — trouvez n’importe qui en quelques secondes, même dans un annuaire de milliers.',
  'Le panneau Filtres ajoute de la précision — combinez statut, type et favoris pour construire n’importe quel segment.',
  'Filtrez par statut du cycle de vie — Prospect, Client, Actif, Inactif ou Partenaire — pour vous concentrer sur les relations qui comptent maintenant.',
  'Filtrez par type pour séparer individus, entreprises et fournisseurs — utile pour agir sur une audience à la fois.',
  'Et filtrez par favoris pour faire ressortir vos comptes clés. Marquez un contact en favori avec l’étoile et il remonte en tête de votre liste.',
  'Un clic sur l’étoile épingle un contact en favori — mis en évidence dans toute la liste, vos relations les plus importantes sont toujours à portée d’œil.',
  'Les contacts sont géolocalisés. Activez la carte pour voir chaque contact placé par adresse — parfait pour planifier les visites terrain ou comprendre où se regroupent vos clients.',
  'Les épingles sont colorées et cliquables — ouvrez un contact ou lancez une modification directement depuis la carte, le routage et le CRM dans une seule vue.',
  'Cochez la case d’en-tête pour sélectionner tous les contacts de la page, ou choisissez des lignes — la barre d’actions en lot apparaît dès qu’un élément est sélectionné.',
  'La barre en lot indique le nombre sélectionné et permet d’agir sur tout l’ensemble d’un coup — fini le travail répétitif un par un.',
  'La suppression en lot retire plusieurs contacts en une action confirmée, avec une barre de progression en direct — et elle respecte les permissions, seuls les utilisateurs autorisés la voient.',
  'Cliquez Ajouter un contact pour ouvrir le formulaire. Un seul formulaire guidé capture tout — identité, coordonnées, adresse et infos fiscales.',
  'Commencez par choisir le type — Individu, Entreprise ou Fournisseur. Le type décide du comportement de ce contact dans le reste de l’application.',
  'Saisissez l’identité : nom complet, l’entreprise à laquelle il appartient, et son rôle ou poste — l’essentiel de qui est ce contact.',
  'Ajoutez les moyens de le joindre — e-mail et téléphone. Ils alimentent les liens mailto et appel en un clic, ainsi que l’e-mailing et les rappels.',
  'Renseignez l’adresse, la ville et le pays. C’est ce qui pilote la vue carte et pré-remplit les adresses de livraison et de facturation sur les documents.',
  'Pour la conformité tunisienne, enregistrez le CIN et le Matricule Fiscal. Ils passent directement sur les factures, attestations de retenue à la source et exports TEJ — saisis une fois, réutilisés partout.',
  'Enfin, définissez le statut du cycle de vie, marquez-le en favori et ajoutez des étiquettes pour votre propre segmentation — puis enregistrez.',
  'Enregistrez, et le contact est actif — compté dans les KPI, cherchable, cartographiable, et prêt à être lié aux offres, ventes et ordres de service.',
  'Vous avez déjà une base ? Le bouton Import importe toute votre liste de contacts depuis un tableur en une seule passe.',
  'Téléchargez le modèle prêt à l’emploi avec toutes les colonnes prises en charge — nom, e-mail, téléphone, entreprise, type, statut, adresse, CIN et Matricule Fiscal — puis collez vos données.',
  'À l’upload, les colonnes sont auto-mappées et les valeurs normalisées — « entreprise » et « société » deviennent Entreprise, « client » devient Client, et les noms se séparent automatiquement en prénom et nom.',
  'Avant l’enregistrement, les doublons sont détectés par nom et e-mail — vous décidez par ligne : ignorer, mettre à jour le contact existant, ou importer comme nouveau. Rien n’est écrasé en silence.',
  'Confirmez, et vos contacts arrivent en quelques secondes — entièrement structurés, validés et immédiatement cherchables dans le CRM.',
  'Ouvrez un contact pour accéder à sa fiche 360°. L’en-tête porte l’avatar, le nom, le rôle et l’entreprise, avec l’étoile favori et la modification toujours à portée.',
  'La Vue d’ensemble présente tout : e-mail, téléphone, entreprise, poste, adresse, CIN, Matricule Fiscal, dernier contact et date de création — l’identité complète, modifiable en un clic.',
  'Les badges de statut et de type sont en bas, donnant une lecture immédiate de l’état de la relation et de son comportement dans l’application.',
  'C’est ici qu’un contact devient un vrai pôle CRM. L’onglet Offres liste chaque devis envoyé — numéro, statut, date et montant — chacun renvoyant au document complet.',
  'Offre gagnée ? Elle bascule automatiquement en Ventes. Chaque enregistrement lié est à un clic du contact, vous ne perdez jamais le fil d’une relation.',
  'L’onglet Ventes montre les factures émises pour ce contact avec leur statut de paiement et leurs totaux — le côté financier de la relation en un coup d’œil.',
  'Les Ordres de service suivent les interventions terrain livrées — planifiées, en cours ou terminées — reliant le back-office à ce qui se passe sur site.',
  'Et les Installations consignent les équipements déployés sur leurs sites — le prochain technicien arrive en connaissant déjà tout l’historique.',
  'L’onglet Achats agrège tout ce que ce contact a acheté — un historique d’achats qui sert aussi de vue fidélité et de valeur vie client.',
  'L’onglet Notes est votre mémoire partagée — une chronologie de chaque appel, réunion et décision, horodatée avec son auteur.',
  'Ajoutez une note en quelques secondes et toute l’équipe la voit — le contexte voyage avec le contact, chacun peut reprendre la relation sans rien manquer.',
  'Les fournisseurs sont aussi des contacts. Ouvrez-en un et la fiche s’adapte — les onglets CRM laissent place à une vue fournisseur centrée sur ce que vous lui achetez.',
  'L’onglet Articles liste chaque article sourcé chez ce fournisseur avec sa référence et son prix — le même lien multi-fournisseurs vu dans l’Inventaire, côté fournisseur.',
  'Voilà Contacts de bout en bout — personnes, entreprises et fournisseurs dans un seul CRM, avec recherche, filtres, carte, outils en lot, import, et une fiche 360° qui relie offres, ventes, service, achats et notes.',
  'Chaque contact est un pôle, et chaque document y renvoie. Ajoutez votre premier contact et voyez toute votre activité se câbler autour de vos relations.',
];


// Sanity-check translation arrays match step count.
if (CAPTIONS_FR.length !== CT_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[contacts demo] caption translation count mismatch', {
    en: CT_STEPS.length, fr: CAPTIONS_FR.length,
  });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}

export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
