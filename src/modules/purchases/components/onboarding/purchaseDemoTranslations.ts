// Translations for the Purchases autopilot demo (EN + FR).
// English captions live inline in purchaseDemoScript.ts as the source-of-truth
// fallback. Translations here are keyed by step index and chapter id. The FR
// caption array must stay exactly PO_STEPS.length long (asserted at runtime below).

import { PO_STEPS, PO_CHAPTERS } from './purchaseDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

// ─── Chapter titles ──────────────────────────────────────────────────────────
export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(PO_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'dashboard':  'Tableau de bord',
    'orders':     'Bons de commande',
    'create':     'Créer un BC',
    'detail':     'Détail du BC',
    'pdf':        'PDF du BC',
    'po-tej':     'BC · XML TEJ',
    'as':         'Articles-Fournisseurs',
    'receipts':   'Bons de réception',
    'invoices':   'Factures fournisseurs',
    'inv-flow':   'Paiement & FEL',
    'inv-tej':    'Facture · XML TEJ',
    'compliance': 'Conformité',
    'reports':    'Rapports',
    'audit':      'Journal d\'audit',
    'ux':         'Ergonomie & Productivité',
    'wrapup':     'Conclusion',
  },
};

// ─── Step captions ───────────────────────────────────────────────────────────
// Each language array has exactly PO_STEPS.length entries — verified at runtime.

const CAPTIONS_FR: string[] = [
  'Bienvenue dans le module Achats — votre centre complet de gestion des approvisionnements : bons de commande, réceptions, factures fournisseurs, conformité et analyses.',
  'Quatre cartes KPI en haut : Total des bons de commande, Réceptions en attente, Factures ouvertes à payer, et dépenses totales du mois.',
  'Le tableau Commandes récentes affiche vos cinq derniers bons — numéro, fournisseur, statut coloré, total. Cliquez une ligne pour ouvrir le détail.',
  'Le panneau Réceptions en attente liste chaque BC en statut « Commandé » ou « Partiellement reçu », trié par date de livraison.',
  'Les boutons d\'accès rapide ouvrent la Conformité, les Rapports, le Journal d\'audit et l\'annuaire Fournisseurs.',
  'En naviguant vers Bons de commande, vous voyez chaque BC de votre compte avec stats temps réel, filtres puissants et actions en lot.',
  'Les cartes de statistiques sont interactives. Cliquer « Ouvert » filtre instantanément la liste sur brouillon, validé, commandé ou partiellement reçu.',
  'La barre de recherche effectue une recherche plein texte instantanée sur les numéros, fournisseurs et notes — résultats en direct, sans appels API inutiles.',
  'Le panneau Filtres ajoute un statut et un statut de paiement. Combinez « Commandé » et « Non payé » pour voir ce qui nécessite un suivi urgent.',
  'Basculez entre vue Tableau pour scanner les données et vue Liste pour un rendu mobile. Votre préférence est sauvegardée automatiquement.',
  'Cochez des lignes ou l\'en-tête pour tout sélectionner. La barre d\'actions en lot apparaît immédiatement — suppression multiple avec rollback optimiste.',
  'Le bouton Export ouvre une modale : choisissez colonnes (numéro, fournisseur, statut, totaux, notes) et téléchargez en CSV ou Excel.',
  'Cliquer « Nouvelle commande » ouvre le formulaire de création — mise en page claire, du fournisseur aux lignes jusqu\'aux totaux.',
  'Sélectionnez le fournisseur depuis une liste recherchable. Le choix pré-remplit la devise par défaut et les conditions de paiement.',
  'Définissez la Date de commande et la Date de livraison prévue — elles alimentent le panneau Réceptions et déclenchent les alertes de retard.',
  'Ajoutez des lignes depuis votre catalogue ou en texte libre. Chaque ligne a quantité, unité, prix, remise, TVA — le total se recalcule instantanément.',
  'Le résumé financier affiche sous-total, TVA et total. Ajoutez des notes internes ou une référence fournisseur avant validation.',
  'Enregistrer comme brouillon n\'enferme pas le BC ; vous pouvez encore éditer. Cliquez Valider pour passer en « Validé » et verrouiller les lignes.',
  'Le détail du BC affiche numéro, fournisseur, dates, devise et un badge de statut coloré — tout dans l\'en-tête.',
  'La barre de progression montre tout le cycle : Brouillon → Validé → Commandé → Partiellement reçu → Reçu → Clôturé. Cliquez un stade pour avancer.',
  'L\'onglet Aperçu liste chaque ligne avec article, description, quantité, prix, remise, TVA et total. Les brouillons permettent l\'édition en ligne.',
  'En dessous, le résumé financier détaille sous-total, TVA et total. La carte fournisseur montre adresse, contact et conditions de paiement.',
  'L\'onglet Réceptions liste toutes les réceptions liées au BC — date, articles reçus, quantités, et si la livraison est partielle ou complète.',
  'L\'onglet Factures montre chaque facture émise contre ce BC avec montants, statut de paiement et détails RS — vue de rapprochement à trois voies.',
  'L\'onglet Activité est une piste d\'audit immuable : chaque changement de statut, édition et action est tracé avec horodatage et utilisateur.',
  'Le bouton PDF génère un document professionnel. Voici l\'aperçu en direct — logo, lignes, totaux et bloc fournisseur auto-composés.',
  'Voici le PDF rendu. L\'en-tête porte votre marque, identité fiscale et coordonnées. Le bloc « Adressé à » miroir à droite.',
  'Le tableau des lignes montre chaque article avec description, quantité, prix, remise, TVA et total — formaté pour envoi par e-mail.',
  'Le bloc de totaux somme sous-total, remise, TVA, timbre fiscal et total. Notes et conditions en bas. Deux clics : télécharger ou envoyer.',
  'De retour sur le détail, le bouton TEJ XML exporte les attestations de retenue à la source dans la norme officielle tunisienne. Ouvrons l\'aperçu.',
  'Voici le XML que Flowentra génère — schéma v1.0, UTF-8 sans BOM (TEJ rejette le BOM). Le bloc Déclarant porte votre matricule fiscal et raison sociale.',
  'Chaque Certificat porte le code opération (RS1_xxxxxx), le bénéficiaire avec son MF, la référence facture, la date de paiement, et tous les montants en millimes.',
  'Avant génération, Flowentra valide chaque champ obligatoire TEJ. S\'il manque quelque chose, l\'API renvoie un 400 structuré avec la liste exacte des champs.',
  'Chaque article peut être sourcé chez plusieurs fournisseurs. Le panneau Articles-Fournisseurs liste chaque vendeur avec sa réf, prix, MOQ, délai et étoile « préféré ».',
  'Marquer un fournisseur préféré est atomique — Flowentra rétrograde les autres en une seule transaction, vous avez toujours exactement une source préférée.',
  'Chaque changement de prix est capturé comme ligne d\'historique immuable — ancien prix, nouveau, par qui, quand, raison. Le graphique visualise la dérive.',
  'Un clic sur un fournisseur lance un nouveau BC pré-rempli avec ce vendeur, sa référence et le prix négocié — sourcing en quelques secondes.',
  'Les Réceptions de marchandises enregistrent ce qui a été livré. La liste affiche chaque réception avec son BC lié, fournisseur, date et statut.',
  'Statuts : Partiel (ambre) si certains articles, Complet (vert) confirme la livraison totale, Refusé (rouge) si refus à l\'inspection.',
  'Créer une réception la lie au BC d\'origine. Saisissez les quantités réelles par ligne — le système calcule partiel ou complet et met à jour le BC.',
  'Le détail montre articles reçus, quantités commandées vs reçues, BC lié, emplacement entrepôt et l\'utilisateur qui a confirmé.',
  'Les réceptions sont modifiables après création — utile pour corriger une erreur avant rapprochement facture. Chaque édition est auditée et inverse le stock.',
  'Les Factures fournisseurs suivent ce que vous devez. La liste montre numéro, fournisseur, BC lié, total, statut de paiement et drapeaux de conformité tunisienne.',
  'Statuts factures : Brouillon → En attente → Partiellement payée → Payée. Les factures en retard sont signalées par une alerte.',
  'La colonne RS affiche le montant de Retenue à la Source. Quand le type d\'opération l\'exige, le taux applicable et le net déductible s\'affichent.',
  'Créer une facture la lie à un BC pour rapprochement trois voies. Saisissez numéro, date, montant et le type d\'opération RS si retenue applicable.',
  'Le détail montre le statut Facture en Ligne — Flowentra suit si cette facture est enregistrée sur la plateforme officielle tunisienne d\'e-facturation.',
  'Le badge Sync TEJ indique si la facture a été exportée et soumise. Les sync en attente sont en ambre — rien ne passe à travers votre checklist.',
  'Cliquez « Enregistrer paiement » pour un acompte ou solder. Le dialogue applique une protection serveur sous verrou ligne — jamais de double facturation.',
  'Choisissez méthode, date et montant — Flowentra calcule le solde restant en direct et bascule le statut. Le statut paiement du BC se synchronise dans la même transaction.',
  'Une fois la facture réglée, envoyez-la à Facture en Ligne. Le statut passe à « Envoyé » avec horodatage et ID de suivi — la conformité se met à jour en direct.',
  'Enfin, exportez le XML TEJ pour cette facture. Voici exactement ce qui est soumis — tous les champs du schéma TEJ inclus.',
  'Voici le XML en direct. Le Déclarant vous identifie avec TypeIdentifiant=1 (Matricule Fiscal), votre catégorie et le bloc contact complet — adresse, e-mail, téléphone.',
  'Le Certificat porte l\'IdTypeOperation (ici RS1_500000 pour Honoraires 5%), le bénéficiaire avec son identité fiscale, résidence et adresse.',
  'Le sous-élément Facture capture numéro, dates et tous les montants en millimes — MontantHT, MontantTVA, TauxRS, MontantRS, MontantNetServi, PriseEnCharge. Validés avant téléchargement.',
  'Le tableau de Conformité est dédié aux obligations fiscales tunisiennes — totaux RS, statut Facture en Ligne et santé Sync TEJ, sur un seul écran.',
  'La carte RS montre votre passif total de retenue à la source pour l\'année, ventilé par facture — alimente directement vos déclarations annuelles DGI.',
  'La carte Facture en Ligne liste les factures restant à enregistrer sur la plateforme — avec leur statut actuel pour action immédiate.',
  'La section Sync TEJ compte les factures en attente d\'export XML. Cliquez une ligne pour ouvrir la facture et lancer le téléchargement.',
  'Flowentra livre le catalogue RS complet : P1 à 1,5%, P2 à 5% (honoraires), P3 à 10%, P4 à 15%, P5 à 25% — plus les codes DGI hérités. Le calcul est automatique.',
  'Le hub Rapports fournit des analyses : dépense par fournisseur, tendance mensuelle, et trois sous-rapports — Performance fournisseur, Évolution des prix, Vieillissement factures.',
  'Le graphique Dépense par fournisseur classe chaque vendeur par valeur d\'achat. Survolez une barre pour le montant exact — utile pour le risque de concentration.',
  'Le graphique Dépense mensuelle montre le volume dans le temps — idéal pour les pics saisonniers, dépassements budgétaires et planification de trésorerie.',
  'Performance fournisseur note chaque vendeur de A à D selon livraison à temps, délai moyen et historique de paiement — calculé en direct sur vos données réelles.',
  'Le tableau de score montre nb BC, dépense, % à temps, délai moyen en jours et la note composite. Cliquez pour ouvrir le drilldown complet.',
  'Le graphique de performance permet de comparer tous les fournisseurs côte à côte sur n\'importe quel KPI — base factuelle pour les décisions sourcing.',
  'Évolution des prix trace l\'historique du prix d\'un article chez tous ses fournisseurs — un coup d\'œil révèle qui est resté stable et qui a augmenté.',
  'Sous le graphique, chaque changement de prix est listé avec fournisseur, ancien, nouveau, delta % et utilisateur — traçabilité complète pour audit.',
  'Vieillissement des factures regroupe chaque facture ouverte en tranches : non-due, 1–30, 31–60, 61–90, et plus de 90 jours — exactement ce qu\'il faut au CFO.',
  'Le tableau détaille chaque facture en retard avec fournisseur, échéance, jours de retard et solde — pour adresser d\'abord les plus grosses expositions.',
  'Le Journal d\'audit est un registre immuable de chaque action dans Achats — qui a créé, modifié, validé ou supprimé quel document, et exactement quand.',
  'Chaque entrée montre le type d\'action, la référence du document, l\'utilisateur déclencheur et un résumé lisible — avec anciennes et nouvelles valeurs préservées.',
  'Filtrez par type de document (BC, Réception, Facture), action (créé, validé, supprimé) ou période pour pointer n\'importe quel événement en secondes.',
  'Les filtres intelligents répondent à « qu\'est-ce qui requiert mon attention ? » en un clic. « Réception en attente > 7 jours » fait remonter instantanément chaque BC commandé non confirmé depuis plus d\'une semaine — sans saisie ni combinaisons à retenir.',
  'Toute combinaison de filtres peut être enregistrée comme vue nommée — « Réception en attente — Acme », « Brouillons de mon équipe ». Elles persistent par utilisateur entre les rechargements : votre flux quotidien à un clic.',
  'Sélectionnez plusieurs commandes et la barre groupée gagne des actions de cycle de vie : Valider, Envoyer au fournisseur, Clôturer et Exporter — appliquez une transition à des dizaines de BC d\'un coup, avec UI optimiste et nouvelle tentative automatique des échecs.',
  'Chaque commande et facture porte désormais une chronologie d\'activité en ligne sur l\'Aperçu — qui l\'a créée, qui l\'a validée, quand elle a été reçue — unifiée avec le journal d\'audit, toute l\'histoire visible sans changer d\'onglet.',
  'Le constructeur de BC est pensé clavier : Alt+N ajoute une ligne, Entrée depuis la dernière cellule crée une ligne, et Ctrl+S enregistre — saisissez une longue commande sans jamais toucher la souris.',
  'En saisissant chaque prix, Flowentra affiche le dernier prix négocié pour cet article-fournisseur sous le champ — en ambre s\'il diffère. Un clic l\'applique : les dérives de coûts ne passent plus inaperçues.',
  'Voilà la visite complète du module Achats — BC, Réceptions, Factures, sourcing Articles-Fournisseurs, conformité fiscale tunisienne (RS, FEL, TEJ XML), outils de productivité et analyses en direct.',
  'Chaque document est connecté : un BC est lié à ses réceptions et factures, vous donnant un vrai rapprochement à trois voies et une source unique de vérité.',
  'À vous de jouer. Créez votre premier BC, confirmez la livraison avec une réception, enregistrez la facture, et regardez les rapports refléter tout cela automatiquement.',
];

// Sanity-check translation arrays match step count.
if (CAPTIONS_FR.length !== PO_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[purchase demo] caption translation count mismatch', {
    en: PO_STEPS.length, fr: CAPTIONS_FR.length,
  });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}

export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
