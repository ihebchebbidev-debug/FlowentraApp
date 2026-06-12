// Translations for the HR autopilot demo (EN + FR).
// English captions live inline in hrDemoScript.ts as the source-of-truth
// fallback. Translations here are keyed by step index and chapter id.

import { HR_STEPS, HR_CHAPTERS } from './hrDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

// ─── Chapter titles ──────────────────────────────────────────────────────────
export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(HR_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'dashboard':    'Tableau de bord',
    'employees':    'Employés',
    'attendance':   'Présence',
    'leaves':       'Congés',
    'payroll':      'Paie',
    'bonuses-cnss': 'Primes & CNSS',
    'departments':  'Départements',
    'performance':  'Performance',
    'recruitment':  'Recrutement',
    'reports':      'Rapports',
    'deepdive':     'Approfondissement',
    'wrapup':       'Conclusion',
  },
};

// ─── Step captions (63 total) ────────────────────────────────────────────────

const CAPTIONS_FR: string[] = [
  'Bienvenue dans le module RH — votre centre complet de gestion des ressources humaines : employés, présence, congés, paie, primes, CNSS, performance et recrutement, tous connectés.',
  'Le tableau de bord s\'ouvre sur des KPI en direct : effectif total, employés en congé aujourd\'hui, demandes de congés en attente, et coût de paie mensuel total en TND.',
  'Le panneau « Congés en un coup d\'œil » montre qui est absent aujourd\'hui et les demandes en attente nécessitant une décision — rien ne passe sans action.',
  'Les alertes de fin de contrat signalent les employés dont le CDD se termine dans les 60 jours — laissant à la RH le temps de renouveler, convertir ou planifier un départ.',
  'Les tuiles d\'accès rapide ouvrent Présence, Paie, Primes, CNSS, Rapports, Paramètres, Départements et Recrutement — chaque fonction RH à un clic.',
  'La page Employés liste chaque membre de l\'équipe avec son département, salaire brut et statut « prêt pour la paie ». Trois cartes de stats interactives filtrent la liste instantanément.',
  'Cliquer « Prêt pour la paie » filtre vers les employés ayant une configuration salariale complète — vous savez toujours qui peut être inclus dans la prochaine paie.',
  'La barre de recherche filtre par nom, e-mail ou département en temps réel — utile pour les équipes de dizaines ou centaines d\'employés.',
  'Chaque ligne affiche l\'avatar, le nom complet, l\'e-mail, le département, le salaire brut et un badge prêt-pour-paie. Cliquer ouvre le profil complet.',
  'La page détail employé montre la photo, le poste, le département, la date d\'embauche, le type de contrat et le statut — tout modifiable par les gestionnaires RH autorisés.',
  'L\'onglet Salaire contient la configuration complète : brut, cotisations CNSS employé et patronale, tranche IRPP, aperçu du net, et indemnités supplémentaires.',
  'L\'onglet Documents stocke contrats scannés, copies CIN, diplômes et toute pièce RH — organisés par catégorie avec date de dépôt et déposant.',
  'La page Présence affiche une grille mensuelle des pointages d\'entrée et sortie. Les jours sont colorés : présent, en retard, absent, ou en congé approuvé.',
  'Chaque cellule montre les heures travaillées. Les retards en ambre et les absences en rouge — les managers repèrent les schémas sans lire chaque ligne.',
  'Le bandeau de synthèse affiche le taux de présence du mois, le total des retards, des absences et la moyenne d\'heures par jour — directement intégré aux retenues de paie.',
  'Le bouton Export télécharge le rapport mensuel complet en Excel — prêt pour le traitement de la paie ou les audits externes.',
  'La page Congés gère tout le cycle dans quatre onglets : liste des demandes, calendrier d\'équipe, soldes par employé et file d\'approbation.',
  'Cliquer « Nouvelle demande de congé » ouvre un formulaire où l\'employé choisit le type — annuel, maladie, maternité, exceptionnel — et fixe les dates.',
  'L\'onglet Liste affiche toutes les demandes avec badges : En attente (ambre), Approuvée (vert), Rejetée (rouge). Cliquez une ligne pour voir l\'historique d\'approbation.',
  'L\'onglet Calendrier montre tous les congés approuvés comme blocs colorés sur un calendrier mensuel — idéal pour repérer les manques de couverture avant d\'approuver.',
  'L\'onglet Soldes montre les jours restants par type pour chaque employé sur l\'année — utilisés, disponibles et total côte à côte.',
  'L\'onglet Approbation liste chaque demande en attente avec boutons Approuver et Rejeter en un clic. L\'approbation met à jour le solde et notifie l\'employé.',
  'La page Paie est l\'endroit où vous exécutez la paie mensuelle. Elle applique automatiquement la loi fiscale tunisienne — CNSS, tranches IRPP et calcul du net.',
  'Cliquer « Exécuter la paie » ouvre l\'assistant. Vous choisissez le mois et l\'année, sélectionnez les employés, et le moteur calcule tout automatiquement.',
  'Étape 1 : sélectionnez la période de paie — juin 2025 ici. L\'assistant connaît le nombre de jours ouvrables et ajuste au prorata pour les nouveaux arrivants.',
  'Étape 2 : sélectionnez les employés à inclure. Seuls les employés prêts pour la paie apparaissent ici. Des cases permettent d\'exclure des individus.',
  'L\'aperçu montre pour chaque employé : brut, retenue CNSS salarié, cotisation CNSS patronale, IRPP, primes, retenues présence, et net final.',
  'Cliquer un employé ouvre le détail complet du bulletin — décomposition ligne par ligne au format officiel tunisien, avec tous les composants étiquetés clairement.',
  'L\'export PDF génère un bulletin formaté prêt à remettre à l\'employé ou à archiver. L\'export en masse télécharge les bulletins de tous les employés sélectionnés.',
  'La page Primes permet de définir et allouer des primes pour n\'importe quel mois — performance, Aïd, achèvement de projet — qui passent automatiquement dans la prochaine paie.',
  'Chaque ligne montre l\'employé, le type de prime, le montant, le mois et si elle a été incluse dans une paie. Ajouter une prime se fait via un simple formulaire.',
  'La page CNSS gère les déclarations de sécurité sociale tunisienne. Elle montre les taux employeur et salarié, les totaux mensuels, et le statut de déclaration par période.',
  'Le tableau CNSS détaille les cotisations par employé et par période. La configuration des taux actifs garantit que les calculs reflètent toujours les % CNSS officiels en vigueur.',
  'La page Départements est l\'ossature de votre organigramme. Chaque département a un nom, un responsable et un badge d\'effectif en direct depuis l\'annuaire employés.',
  'Les départements sont listés avec le nom du responsable, le nombre d\'employés actifs et la masse salariale brute totale. Cliquez pour voir les membres et éditer.',
  'Créer un département prend quelques secondes — nommez-le, assignez un responsable, et il apparaît immédiatement dans le menu d\'affectation à travers toute la plateforme.',
  'Le module Performance gère la croissance des employés via objectifs SMART, cycles d\'évaluation structurés et revues de performance formelles avec notes et commentaires écrits.',
  'L\'onglet Objectifs montre chaque objectif actif avec titre, propriétaire, échéance et % d\'avancement. Employés et managers mettent à jour à mesure que le travail avance.',
  'Les Cycles d\'évaluation définissent quand les revues ont lieu — trimestriel, semestriel ou annuel. Chaque cycle a un début, une fin et un statut.',
  'L\'onglet Revues liste chaque évaluation avec l\'évaluateur, l\'évalué, le score global et le statut. Cliquer ouvre la fiche complète avec critères et commentaires.',
  'Chaque revue génère un score global sur cinq points. Les scores alimentent le profil de l\'employé pour suivre les tendances de performance sur plusieurs cycles.',
  'Le module Recrutement suit toute la chaîne d\'embauche — postes ouverts, progression des candidats, entretiens planifiés et gestion des offres — sans quitter Flowentra.',
  'Le tableau Recrutement montre des KPI : postes ouverts, candidats actifs, entretiens cette semaine, et offres en cours.',
  'L\'onglet Offres d\'emploi liste chaque poste ouvert avec type de contrat (CDI ou CDD), niveau de séniorité, nombre de places et statut — ouvert, en pause ou fermé.',
  'L\'onglet Candidats montre chaque candidat avec son étape : Postulé → Présélection → Entretien → Offre → Embauché ou Refusé. Déplacement entre étapes en un clic.',
  'L\'onglet Entretiens liste chaque entretien planifié avec date, heure, intervieweur, candidat et le poste lié — facilitant la préparation et le suivi.',
  'Marquer un candidat comme Embauché crée automatiquement une fiche employé, l\'affecte au bon département et vous invite à configurer son salaire.',
  'La page Rapports vous donne des insights basés sur les données : effectif par département, distribution salariale, taux de présence, usage des congés, et tendance des coûts paie.',
  'Le graphique Effectif par Département montre votre distribution organisationnelle d\'un coup d\'œil — identifiant où la main-d\'œuvre est concentrée ou sous-effective.',
  'Le graphique Coût Mensuel de la Paie suit la dépense salariale dans le temps, aidant la finance à prévoir les budgets et repérer les anomalies avant escalade.',
  'Les Paramètres RH permettent de configurer les types de congés avec leur droit annuel en jours, définir les jours fériés de l\'année, fixer les règles de calcul de paie et gérer les taux CNSS.',
  'De retour sur un profil employé, l\'onglet CNSS stocke son numéro CNSS personnel, sa date d\'affiliation, ses personnes à charge et tout dépassement de cotisation — exactement ce qui est déclaré chaque trimestre.',
  'L\'onglet Primes du profil liste chaque prime jamais reçue, avec le mois, le type, le montant et la paie qui l\'a versée — un historique complet de rémunération individuelle.',
  'L\'onglet Congés du profil montre l\'historique personnel de congés et les soldes actuels par type — annuel, maladie, maternité, exceptionnel — d\'un coup d\'œil.',
  'L\'onglet Historique est un journal d\'audit par employé : chaque modification de salaire, contrat, département ou statut est consignée avec date, auteur et valeur précédente conservée.',
  'Dans Paie, le panneau Paramètres permet de régler les règles de calcul — coefficient heures supplémentaires, taux jour férié, base de jours ouvrés, politique d\'arrondi — appliqués uniformément à chaque paie.',
  'Le bulletin PDF généré est bilingue français/arabe, inclut l\'en-tête de votre société, l\'identité fiscale, le bloc employé, la décomposition complète gains/retenues, le net en chiffres et en lettres, et un espace signature.',
  'Le hub Rapports possède aussi un onglet Coût — coût total de la paie par employé avec brut, primes, retenues, part CNSS patronale, coût mensuel total et cumul année à date dans un seul tableau.',
  'Deux autres onglets de rapport : CNSS agrège les cotisations patronales + salariales par mois pour vos déclarations DGI, et Absences montre le total de jours d\'absence par employé ventilés par type.',
  'Les Paramètres RH regroupent trois onglets : taux CNSS (% patronal et salarié pour chaque période effective), Jours fériés (le calendrier officiel tunisien avec ajouts personnalisés), et règles générales de paie.',
  'Voilà le tour complet du module RH — Employés avec profil détaillé, Présence, Congés, Paie avec loi fiscale tunisienne intégrée, Primes, CNSS, Départements, Performance et Recrutement.',
  'Chaque section est connectée : un candidat embauché devient employé, son salaire alimente la paie, ses congés mettent à jour le calendrier de présence et ses évaluations nourrissent l\'historique de performance.',
  'À vous de jouer. Ajoutez votre équipe, configurez les salaires, exécutez votre première paie, et laissez Flowentra gérer la conformité et le reporting automatiquement.',
];

if (CAPTIONS_FR.length !== HR_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[hr demo] caption translation count mismatch', {
    en: HR_STEPS.length, fr: CAPTIONS_FR.length,
  });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}

export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
