// Translations for the Articles (Inventory & Services) autopilot demo (EN + FR).
// English captions live inline in articlesDemoScript.ts as the source-of-truth
// fallback. The FR caption array must stay exactly ART_STEPS.length long
// (asserted at runtime below) and in the same order as the steps.

import { ART_STEPS, ART_CHAPTERS } from './articlesDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

// ─── Chapter titles ──────────────────────────────────────────────────────────
export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(ART_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview':  'Vue d’ensemble',
    'filters':   'Recherche & Filtres',
    'material':  'Ajouter un matériel',
    'service':   'Ajouter un service',
    'import':    'Import en masse',
    'detail':    'Détail article',
    'inventory': 'Inventaire',
    'movements': 'Mouvements de stock',
    'suppliers': 'Fournisseurs',
    'activity':  'Activité',
    'reorder':   'Stock bas → BC',
    'wrapup':    'Conclusion',
  },
};

// ─── Step captions ───────────────────────────────────────────────────────────

const CAPTIONS_FR: string[] = [
  'Bienvenue dans Inventaire & Services — votre catalogue unique pour tout ce que vous achetez, stockez et vendez. Des matériels avec stock en temps réel et des services avec tarifs et durées, au même endroit.',
  'Quatre cartes KPI en haut. La première compte vos Matériels — articles physiques suivis en stock : pièces, consommables, équipements.',
  'La carte Services compte vos services facturables — installations, maintenance, inspections — chacun avec un tarif de base et une durée plutôt qu’un stock.',
  'La carte Stock bas est votre signal d’alerte : chaque matériel dont la quantité est tombée au niveau minimum ou en dessous. Elle est cliquable — un appui filtre la liste sur exactement ces articles.',
  'La carte Total articles indique la taille complète de votre catalogue, tous types et statuts confondus : vous connaissez toujours l’ampleur de ce que vous gérez.',
  'Le tableau du catalogue liste chaque article : icône de type, nom, SKU ou catégorie, badge de statut, stock en direct avec alerte de stock bas, prix et emplacement — avec des actions en ligne à droite.',
  'La barre de recherche fait une correspondance plein texte instantanée sur les noms, SKU et catégories — les résultats se réduisent à la frappe, trouver un article prend quelques secondes même avec des milliers en stock.',
  'Le filtre Type sépare le catalogue en Matériels ou Services en un clic — parfait pour réviser les tarifs de tous les services ou faire un inventaire des seuls matériels.',
  'Le filtre Statut cible un seul état — Disponible, Stock bas, Rupture ou Abandonné — pour vous concentrer exactement sur les articles à traiter.',
  'Cliquer la carte Stock bas filtre instantanément les articles au niveau minimum ou en dessous — le chemin le plus rapide entre « quelque chose s’épuise » et l’action.',
  'Cliquez Ajouter un article pour ouvrir le formulaire. Un formulaire unique et épuré s’adapte à ce que vous ajoutez — créons d’abord un matériel.',
  'Le sélecteur de type décide de tout le formulaire. Matériel débloque le stock, le niveau minimum, les prix d’achat et de vente, le fournisseur et un emplacement de stockage.',
  'Commencez par l’identité : le nom de l’article, un SKU unique pour le scan et le rapprochement, et une catégorie pour garder le catalogue organisé et cherchable.',
  'Définissez le stock initial et le niveau minimum. Le minimum est le déclencheur : dès que le stock l’atteint, l’article passe en Stock bas et apparaît dans vos alertes.',
  'Saisissez le prix d’achat que vous payez et le prix de vente que vous facturez. Flowentra calcule la marge automatiquement et l’affiche sur l’article — pour des décisions de prix toujours éclairées.',
  'Enfin, choisissez un fournisseur par défaut et un emplacement de stockage. Le fournisseur alimente le réapprovisionnement et les bons de commande ; l’emplacement pilote les transferts de stock entre entrepôts.',
  'Enregistrez, et le matériel rejoint votre catalogue immédiatement — compté dans les KPI, cherchable, et prêt à être reçu, transféré ou vendu.',
  'Basculez le sélecteur sur Service et le formulaire se transforme : stock et stockage disparaissent, remplacés par un tarif de base et une durée — car un service, c’est du temps et de l’expertise, pas de la quantité.',
  'Définissez le prix de base et la durée prévue, puis attachez éventuellement les compétences requises. Cela permet au planning d’affecter le bon technicien et de pré-remplir devis et ordres de travail.',
  'Enregistrez, et le service est aussitôt disponible pour vos offres, ventes et interventions — tarifé et prêt, sans stock à gérer.',
  'Vous migrez un catalogue existant ? Le bouton Import importe des centaines d’articles depuis un tableur en une seule passe — sans ressaisie manuelle.',
  'Téléchargez le modèle Excel prêt à l’emploi avec toutes les colonnes prises en charge — nom, SKU, type, catégorie, stock, stock min, prix, fournisseur et emplacement — puis collez vos données.',
  'À l’upload, Flowentra mappe automatiquement vos colonnes et normalise les valeurs hétérogènes — « matériel », « product » ou « mat » deviennent tous Matériel ; les décimales françaises et les unités sont analysées proprement.',
  'Chaque ligne est validée avant tout enregistrement. Les erreurs bloquantes arrêtent une ligne ; des avertissements intelligents signalent par exemple un service avec du stock ou un minimum supérieur à la quantité actuelle.',
  'Confirmez, et seules les lignes valides sont importées — les doublons par nom et SKU sont ignorés automatiquement. Tout votre catalogue arrive en quelques secondes, entièrement structuré.',
  'Ouvrez n’importe quel article pour accéder à son espace de détail. L’en-tête porte le nom, le SKU, le statut et les actions les plus utilisées — ajuster le stock, transférer et modifier.',
  'Les cartes de statut donnent une lecture immédiate : stock actuel par rapport à la capacité, valeur du stock, prix de vente, et un statut en direct qui se met à jour quand les quantités changent.',
  'Le panneau de prix détaille le coût, le prix de vente et la marge qui en résulte, en devise et en pourcentage — pour repérer les marges faibles dès qu’elles apparaissent.',
  'À côté, le panneau de détails contient catégorie, emplacement, fournisseur, unité et notes — l’identité complète de l’article, modifiable en un clic.',
  'L’onglet Inventaire est le cockpit de stock de ce matériel — niveaux, calculs de réappro et actions rapides, le tout dans une seule vue.',
  'La jauge de stock montre la quantité actuelle par rapport à la capacité, avec une couleur qui passe en alerte sous le minimum — et une bannière Stock bas claire quand il faut réapprovisionner.',
  'Le panneau de réappro calcule votre point de commande et une quantité suggérée pour revenir à la capacité — transformant les approximations en un bon de commande en un clic.',
  'Les Actions rapides gardent les mouvements quotidiens à portée de clic — ajouter du stock, en retirer, ou passer directement à la modification de l’article.',
  'Ajouter du stock enregistre un mouvement entrant — un nouvel achat, un retour client ou un ajustement d’inventaire — avec une quantité et un motif, pour que chaque hausse soit traçable.',
  'Retirer du stock capture le côté sortant — utilisé sur un projet, endommagé, perdu ou transféré — et est plafonné à la quantité disponible, le stock ne peut jamais devenir négatif.',
  'Le transfert déplace de la quantité entre emplacements en une seule transaction — en choisissant un entrepôt source et destination, avec origine/destination, motif et référence consignés pour l’audit.',
  'L’onglet Fournisseurs rend chaque matériel multi-source — liez plusieurs vendeurs et comparez-les côte à côte au lieu d’être verrouillé sur un seul.',
  'Chaque fournisseur lié affiche sa référence, son prix d’achat, son délai en jours, sa quantité minimale de commande et la date de sa dernière livraison — tout ce qu’il faut pour décider.',
  'Marquez un vendeur comme Préféré et Flowentra l’utilise en premier pour le réappro et les bons de commande — et rétrograde les autres de façon atomique, il y a toujours exactement une source par défaut.',
  'Chaque changement de prix est capturé comme ligne d’historique immuable — ancien prix, nouveau prix, variation en pourcentage, et la date — pour que les hausses des fournisseurs ne passent jamais inaperçues.',
  'Ajouter un fournisseur est un formulaire rapide : choisissez le vendeur, sa référence, le prix d’achat, le délai et la commande minimale — et marquez-le préféré si c’est votre source de référence.',
  'L’onglet Activité est l’historique complet de l’article — chaque mouvement de stock, changement de prix et modification, dans l’ordre.',
  'Chaque entrée montre ce qui s’est passé, la variation de quantité ou de valeur, qui l’a fait et quand — une piste d’audit immuable qui répond instantanément à « pourquoi le stock est-il à ce chiffre ? ».',
  'L’inventaire ne s’arrête pas au suivi. Quand un matériel est bas ou en rupture, une action Créer BC apparaît sur sa ligne — pré-remplissant un bon de commande avec le fournisseur préféré et une ligne prête.',
  'Voilà Inventaire & Services de bout en bout — matériels et services dans un seul catalogue, stock en direct avec alertes, import en masse, sourcing multi-fournisseurs avec historique de prix, transferts et piste d’audit complète.',
  'Tout est connecté : le stock bas alimente les achats, les articles alimentent les offres et les ventes, et chaque mouvement est journalisé. Ajoutez votre premier article et voyez le catalogue prendre vie.',
];


// Sanity-check translation arrays match step count.
if (CAPTIONS_FR.length !== ART_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[articles demo] caption translation count mismatch', {
    en: ART_STEPS.length, fr: CAPTIONS_FR.length,
  });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}

export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
