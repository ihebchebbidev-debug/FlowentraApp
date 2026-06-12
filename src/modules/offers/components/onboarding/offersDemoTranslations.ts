// Translations for the Offers (Quotes) autopilot demo (EN + FR).
// English captions live inline in offersDemoScript.ts. The FR caption array
// must stay exactly OF_STEPS.length long (asserted at runtime) in step order.

import { OF_STEPS, OF_CHAPTERS } from './offersDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(OF_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview': 'Vue d’ensemble',
    'controls': 'Filtres & Vues',
    'kanban':   'Pipeline',
    'create':   'Créer un devis',
    'detail':   'Détail & Statut',
    'tabs':     'Espace du deal',
    'pdf':      'Envoi & PDF',
    'convert':  'Conversion',
    'wrapup':   'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Bienvenue dans Offres — là où commence chaque affaire. Créez des devis professionnels, envoyez-les, suivez-les dans votre pipeline, et convertissez les gagnants en ventes en un clic.',
  'Les cartes KPI résument toute votre activité de devis d’un coup d’œil — et chacune filtre la liste. Total compte chaque offre que vous avez créée.',
  'Pipeline, c’est l’argent en mouvement — les offres envoyées ou en négociation, encore ouvertes et relançables. C’est le pouls de votre équipe commerciale.',
  'Acceptées montre les affaires gagnées — prêtes à devenir des factures. Couplée au total, elle donne un taux de réussite instantané.',
  'Et Valeur totale additionne la valeur de vos offres dans votre devise — le chiffre clé qui dit combien d’affaires sont sur la table.',
  'Le tableau des offres liste chaque devis avec client, montant, statut et validité — coloré pour voir d’un coup ce qui est brouillon, envoyé, accepté ou perdu. Cliquez une ligne pour l’ouvrir.',
  'Recherchez instantanément par titre, client et numéro d’offre — trouvez n’importe quel devis en quelques secondes.',
  'Les filtres affinent par statut, affectation et plage de dates — construisez la vue exacte qu’il vous faut, comme « mes offres, envoyées ce mois-ci, encore ouvertes ».',
  'Voyez vos offres de trois façons : un Tableau dense pour scanner, une Liste aérée pour le détail, et un Kanban pour glisser les affaires dans votre pipeline.',
  'Les offres portent l’emplacement du client, alors une vue Carte place chaque affaire géographiquement — parfait pour planifier les visites et repérer les opportunités régionales.',
  'Exportez vers Excel pour le reporting, ou importez en masse une liste de devis existante depuis un tableur — vos données circulent dans les deux sens sans friction.',
  'Le tableau Kanban, c’est votre pipeline rendu visuel — des colonnes pour Brouillon, Envoyé, Négociation, Accepté et Perdu, chacune affichant son compte et sa valeur totale.',
  'Glissez une carte d’une colonne à la suivante pour faire avancer l’affaire — le statut se met à jour aussitôt, et le journal d’activité enregistre le changement.',
  'Construisons un devis. Nouvelle offre ouvre un formulaire guidé — client, lignes d’articles et totaux, le tout sur une seule page.',
  'Choisissez le client depuis votre CRM et ses détails se remplissent automatiquement — y compris l’identité fiscale (CIN et Matricule Fiscal) nécessaire aux documents conformes.',
  'Ajoutez des lignes directement depuis votre catalogue — matériels et services ensemble — chacune avec quantité, prix unitaire et remise optionnelle. Le catalogue garde des prix cohérents.',
  'Les totaux se calculent en direct dans le bon ordre : sous-total, puis remise, puis TVA sur le montant remisé, puis le timbre fiscal tunisien — toujours exact, toujours conforme.',
  'Classez l’affaire avec une catégorie et une source pour vos analyses, fixez une date de validité, et ajoutez des notes — le contexte qui alimentera vos rapports plus tard.',
  'Enregistrez, et l’offre rejoint votre pipeline en brouillon — comptée dans les KPI et prête à envoyer.',
  'La page de détail de l’offre est le foyer de l’affaire — titre, client, montant, et les actions les plus utilisées : envoyer, exporter et convertir.',
  'Le flux de statut mène l’offre de Brouillon à Envoyé à Accepté — avec des branches en un clic vers Refuser ou Annuler, chacune confirmée pour ne jamais clôturer une affaire par accident.',
  'La Vue d’ensemble rassemble tout : détails client et fiscaux, résumé financier, validité, et l’installation liée si le devis couvre un équipement sur site.',
  'L’onglet Articles liste chaque ligne avec ses totaux — modifiez quantités, prix et remises en ligne tant que l’offre est en brouillon.',
  'Les Notes gardent la conversation avec le client — chaque appel et relance, horodaté avec son auteur.',
  'Les Checklists transforment un devis en processus — étapes de qualification, approbations, points à confirmer avant l’envoi — pour ne rien oublier sur une grosse affaire.',
  'Documents et pièces jointes vivent avec l’offre — spécifications, plans, approbations signées — tout ce dont l’affaire a besoin au même endroit.',
  'Et l’onglet Activité est la chronologie complète — créée, envoyée, ouverte, acceptée — un historique immuable du parcours de l’affaire.',
  'Envoyez l’offre par e-mail en un clic — Flowentra joint le PDF, suit le nombre d’envois, et fait passer le statut à Envoyé automatiquement.',
  'Le PDF généré est un devis soigné et à votre marque — votre logo et identité fiscale, le bloc client, les lignes détaillées, les totaux et les conditions, prêt à remporter l’affaire.',
  'Et il vous appartient entièrement — un studio de réglages pour couleurs, typographie, mise en page et champs affichés, pour que chaque devis colle exactement à votre marque.',
  'Téléchargez-le, imprimez-le ou envoyez-le — le même document net à chaque fois, avec votre timbre fiscal et vos totaux calculés au millime.',
  'Voici où l’offre porte ses fruits. Une fois acceptée, Convertir transforme le devis en l’étape suivante de votre activité — sans ressaisie, rien de perdu.',
  'Convertissez-la en Vente pour facturer le client et — si elle inclut des services — en Ordre de service pour envoyer le travail, en une seule étape. Tout le pipeline, connecté de bout en bout.',
  'Voilà Offres de bout en bout — des KPI et un pipeline visuel, un constructeur guidé aux totaux conformes, un détail 360° avec notes, checklists et documents, des PDF à votre marque, le suivi des envois, et la conversion en un clic.',
  'Chaque devis devient une vente, chaque vente une livraison, et chaque étape est suivie. Créez votre première offre et commencez à transformer les prospects en revenus.',
];


if (CAPTIONS_FR.length !== OF_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[offers demo] caption translation count mismatch', { en: OF_STEPS.length, fr: CAPTIONS_FR.length });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
