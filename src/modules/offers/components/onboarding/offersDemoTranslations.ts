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
    'controls': 'Recherche & Vues',
    'create':   'Créer un devis',
    'detail':   'Détail & Statut',
    'tabs':     'Espace du deal',
    'pdf':      'Envoi & PDF',
    'convert':  'Convertir en vente',
    'planning': 'Traçabilité planning',
    'renew':    'Renouveler',
    'wrapup':   'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Voici Offres — là où commence chaque affaire. Créez un devis, envoyez-le, suivez-le dans le pipeline et convertissez les gagnants en ventes.',
  'Quatre cartes KPI trônent au-dessus de la liste, et chacune la filtre. Total compte toutes vos offres.',
  'Pipeline, c’est l’argent en mouvement — les offres encore ouvertes et relançables.',
  'Acceptées, ce sont les affaires gagnées — prêtes à devenir des ventes.',
  'Valeur totale additionne vos offres dans votre devise — le chiffre clé qui dit combien d’affaires sont sur la table.',
  'Le tableau affiche chaque devis avec client, montant, statut et date de validité, coloré selon son état.',
  'Chaque ligne a son menu — Voir, Modifier, Envoyer, Convertir en vente, Rapport, Supprimer — vous agissez sans ouvrir l’offre.',
  'Cochez plusieurs lignes et une barre d’actions groupées apparaît — nettoyez les brouillons ou archivez les affaires perdues en un geste.',
  'Recherchez par titre, client ou numéro d’offre — trouvez n’importe quel devis en quelques touches.',
  'Les filtres affinent par statut, affectation et plage de dates — construisez la vue exacte qu’il vous faut.',
  'Deux façons de voir les mêmes données — un Tableau dense pour scanner ou une Liste plus aérée pour le détail.',
  'Les offres portent la localisation du client, alors une vue Carte place chaque affaire géographiquement — pratique pour planifier les visites.',
  'Et vous pouvez importer en masse une liste de devis depuis un tableur — vos données arrivent en un seul coup.',
  'Construisons un devis. Nouvelle offre ouvre un formulaire guidé — client, lignes, totaux, tout sur une seule page.',
  'Choisissez le client depuis votre CRM et ses détails se remplissent — CIN et Matricule Fiscale compris, pour des documents conformes.',
  'Ajoutez des lignes depuis votre catalogue — matériels et services ensemble — chacune avec quantité, prix et remise optionnelle.',
  'Les totaux se calculent en direct dans le bon ordre — sous-total, remise, TVA sur le montant remisé, puis le timbre fiscal tunisien.',
  'Étiquetez l’affaire avec une catégorie et une source, fixez une date de validité, ajoutez des notes — le contexte qui alimentera vos rapports.',
  'Enregistrez, et l’offre rejoint votre pipeline en brouillon — comptée dans les KPI et prête à envoyer.',
  'La page de détail est le foyer de l’affaire — titre, client, montant et les actions les plus utilisées.',
  'Le flux de statut mène l’offre de Brouillon à Envoyé à Accepté, avec des branches confirmées vers Refuser et Annuler pour ne rien clôturer par erreur.',
  'La Vue d’ensemble rassemble tout — client et détails fiscaux, résumé financier, validité, et l’installation liée si le devis est sur site.',
  'Articles liste chaque ligne avec ses totaux — modifiez quantité, prix et remise en ligne tant que l’offre est en brouillon.',
  'Les checklists transforment un devis en processus. Celles au niveau de l’offre couvrent la qualification avant envoi ; et une checklist liée à une ligne de service voyage avec elle — offre, vente, job d’ordre de service, intervention — pour que le terrain reçoive les étapes exactes.',
  'Documents garde spécifications, plans et approbations signées avec l’offre — tout ce dont l’affaire a besoin, au même endroit.',
  'Activité est votre fil de notes sur l’affaire — chaque appel et relance horodaté avec son auteur.',
  'Envoyez l’offre par e-mail en un clic — le PDF est joint, le compteur d’envois s’incrémente, et le statut passe à Envoyé automatiquement.',
  'Le PDF généré est un devis soigné et à votre marque — logo et identité fiscale, bloc client, lignes détaillées, totaux et conditions.',
  'Et il vous appartient totalement — un studio pour couleurs, typographie, mise en page, champs de données et options avancées, pour que chaque devis colle à votre marque.',
  'Téléchargez-le, imprimez-le ou partagez-le — le même document net à chaque fois, avec timbre et totaux calculés au millime.',
  'Voici où l’offre porte ses fruits. Une fois acceptée, Convertir transforme le devis en vente en un clic.',
  'Vous confirmez le client, le nombre de lignes et le total — la vente est créée, liée à l’offre, prête à facturer ou à planifier en ordre de service.',
  'Chaque ligne d’offre peut porter son plan — minutes de main-d’œuvre, frais planifiés comme le déplacement, et matériels planifiés. Ce plan voyage avec l’article : l’offre devient vente, la vente devient ordre de service.',
  'Sur l’ordre de service, le même plan côtoie le réel — plan contre réalisé, en vert, orange ou rouge — les dépassements apparaissent à la seconde.',
  'Quand un devis expire ou est refusé, Renouveler le clone en un clic — une nouvelle offre avec le même client et les mêmes lignes, prête à relancer.',
  'Voilà Offres de bout en bout — pipeline piloté par les KPI, constructeur guidé aux totaux conformes, entrées de planning qui voyagent jusqu’au terrain, PDF à votre marque et conversion en un clic.',
  'Chaque devis devient une vente, chaque vente une livraison — et chaque étape est suivie. Créez votre première offre et commencez à transformer les prospects en revenus.',
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
