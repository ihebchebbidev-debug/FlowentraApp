import type { DocsLocalePack } from "./types";

/**
 * French docs pack.
 *
 * Only overrides are listed — anything absent falls back to the English source
 * content, so this file can be extended module by module without breaking the
 * docs pages. Product/plugin codes (PL00xx), route paths, entity names, status
 * codes, table/column names and file paths are deliberately left untranslated.
 */
export const FR_DOCS: DocsLocalePack = {
  categories: {
    Core: "Cœur",
    CRM: "CRM",
    Sales: "Ventes",
    Inventory: "Stock",
    Procurement: "Achats",
    HR: "RH",
    Operations: "Opérations",
    Productivity: "Productivité",
    Integration: "Intégrations",
    Insights: "Analyse",
    Marketing: "Marketing",
    System: "Système",
    Finance: "Finance",
    "Field Service": "Service terrain",
  },

  modules: {
    dashboard: {
      name: "Tableau de bord",
      description:
        "L'écran d'accueil sur lequel arrive chaque utilisateur après connexion. Il présente des tableaux de bord intégrés adaptés au rôle (Service, Ventes, Terrain, RH, Finance, Direction) avec des tuiles d'indicateurs, des graphiques et un fil d'activité récente, ainsi que des filtres globaux rapides (société cible, responsable, période) qui s'appliquent à tous les widgets à la fois.",
    },
    contacts: {
      name: "Contacts (CRM)",
      description:
        "Annuaire unifié des personnes, sociétés et fournisseurs. Chaque contact porte son identité, ses identifiants fiscaux (CIN, matricule fiscale), son adresse géolocalisée, son statut et un historique 360° (installations, offres, ventes, ordres de service, achats, notes). Les fournisseurs sont des entités de premier plan avec leur propre liste sur /dashboard/suppliers, tout en restant visibles dans l'annuaire global des contacts.",
    },
    offers: {
      name: "Offres / Devis",
      description:
        "Processus complet de proposition commerciale : composer une offre multi-lignes (produits + services), l'envoyer au client par e-mail ou en PDF, suivre sa réponse via un flux de statuts configurable, puis convertir les offres gagnées en commandes de vente et/ou en ordres de service en un clic. Multi-société (sélecteur de société cible), localisé EN/FR avec le TND par défaut, soumis au plugin PL0005OFFERS.",
    },
    sales: {
      name: "Ventes / Factures",
      description:
        "Commandes de vente et factures avec cycle de vie complet : Créée → En cours → Facturée (ou Partiellement facturée) → Clôturée. Suit les paiements par vente, génère des factures PDF à votre charte et peut créer automatiquement un ordre de service lorsque la vente passe En cours et contient des lignes de service. Soumis au plugin PL0002SALES, dépend de Contacts.",
    },
    deals: {
      name: "Pipeline d'affaires",
      description:
        "Gestion visuelle du pipeline commercial. Suit les opportunités à travers des étapes configurables (Prospect → Qualifié → Proposition → Négociation → Gagné / Perdu) avec prévision pondérée, attribution d'un responsable, journal d'activité et conversion en offres / ventes. Multi-société, soumis aux droits d'accès, avec vues Kanban / Tableau / Prévisions.",
    },
    articles: {
      name: "Articles et catalogue",
      description:
        "Catalogue de produits et de services — la source de vérité unique pour toute ligne utilisée dans les offres, ventes, achats, le stock et les ordres de service. Chaque article porte son identité, ses prix, sa fiscalité, ses fournisseurs, ses seuils de stock, ses images et un système de listes de prix réutilisables. Multi-société, soumis au plugin, avec import/export en masse.",
    },
    "inventory-services": {
      name: "Stock et services",
      description:
        "Espace unifié qui réunit les articles stockés et les services non stockés dans une seule liste consultable. Utile aux commerciaux et aux répartiteurs qui doivent retrouver tout ce qui est réservable — une pièce en rayon comme une prestation de main-d'œuvre — depuis un seul écran.",
    },
    "stock-management": {
      name: "Gestion des stocks",
      description:
        "Pilotage du stock multi-entrepôts. Suit chaque mouvement (entrée/sortie/ajustement/transfert/réservation), gère les quantités par entrepôt, les alertes de stock bas, les inventaires périodiques et les propositions de réapprovisionnement basées sur les seuils min/max et les délais fournisseurs.",
    },
    purchases: {
      name: "Achats (Procure-to-Pay)",
      description:
        "Processus Procure-to-Pay (P2P) complet adapté au contexte fiscal tunisien : commande d'achat → réception de marchandises → facture fournisseur → paiement, avec rapprochement à trois voies, retenue à la source (RS), conformité TEJ / Facture en Ligne et piste d'audit complète. Les documents sont versionnés, exportables en PDF et liés tout au long de la chaîne, de sorte que chaque ligne peut être tracée de la commande à la facture puis au paiement.",
    },
    hr: {
      name: "Ressources humaines (RH)",
      description:
        "Suite RH complète alignée sur le droit social tunisien (CNSS, CSS, IRPP, abattements). Gère tout le cycle de vie du salarié — recrutement → embauche → présence → congés → paie → primes/retenues → déclaration CNSS → entretien d'évaluation — avec des dossiers salariés multi-onglets, des paies mensuelles en TND, un historique de taux configurable et des exports CSV/Excel pour la comptabilité et les déclarations CNSS.",
    },
    field: {
      name: "Service terrain",
      description:
        "Centre opérationnel du travail sur site — ordres de service, opérations, installations, stock terrain et temps et dépenses. Combine un tableau de planification (Répartiteur), une interface mobile pensée pour les techniciens et un reporting riche. Fait le pont entre les ventes (création automatique d'ordres de service) et les RH (compétences des techniciens, saisies de temps remontant vers la paie).",
    },
    tasks: {
      name: "Tâches",
      description:
        "Suivi de tâches léger pour les individus et les équipes. Les tâches peuvent être autonomes ou rattachées à n'importe quelle entité (contact, offre, vente, ordre de service, projet). Prend en charge les listes de contrôle, le suivi du temps, les tâches récurrentes, les rappels et une boîte de réception Aujourd'hui / À venir / En retard.",
    },
    calendar: {
      name: "Calendrier",
      description:
        "Calendrier unifié qui superpose les événements internes (réunions, rappels), les tâches avec échéance, les congés RH, les opérations terrain et les calendriers externes synchronisés (Google / Microsoft). Codes couleur par source, détection de conflits, replanification par glisser-déposer et agenda imprimable.",
    },
    "email-calendar": {
      name: "Synchronisation e-mail et calendrier",
      description:
        "Synchronisation bidirectionnelle des e-mails et du calendrier avec des fournisseurs externes (Google Workspace, Microsoft 365, IMAP/SMTP génériques, CalDAV). Affiche les échanges clients à côté de leur fiche CRM, journalise automatiquement appels et réunions, et permet de répondre depuis l'application.",
    },
    projects: {
      name: "Projets",
      description:
        "Gestion de projet légère pour les missions clients. Chaque projet regroupe tâches, saisies de temps, documents, jalons et budget ; il peut être consolidé dans les ventes pour une facturation en régie.",
    },
    communication: {
      name: "Communication",
      description:
        "Centre de messagerie sortante : newsletters, campagnes automatisées, modèles transactionnels, historique des échanges par contact (e-mail + SMS). S'appuie sur les comptes e-mail connectés et un fournisseur SMS (Twilio/Vonage). Conforme au RGPD avec suivi du consentement par contact.",
    },
    documents: {
      name: "Documents",
      description:
        "Référentiel documentaire centralisé, rattachable à toute entité métier. Téléversements versionnés, aperçu dans le navigateur (PDF/Office/images), demandes de signature électronique, compression intelligente, recherche plein texte, arborescence de dossiers, liens de partage et piste d'audit.",
    },
    workflow: {
      name: "Workflow",
      description:
        "Moteur d'automatisation visuel no-code/low-code (style n8n / React-Flow). Concevez des processus métier de bout en bout — offres → ventes → ordres de service → opérations — en reliant des déclencheurs d'entité à des actions via conditions, boucles, aiguillages, branches parallèles et Try/Catch. Inclut un générateur de workflow par IA, un débogueur d'exécution en direct, l'historique des versions, les groupes, l'import/export, la diffusion temps réel SignalR, ainsi que des vues opérationnelles (calendrier, tableau des opérations) et des pages de détail de flux par entité. Soumis au plugin PL0031WORKFLOW, adossé au backend WorkflowEngine (4 contrôleurs, 17 services, ~10K lignes).",
    },
    automation: {
      name: "Automatisation",
      description:
        "Moteur de règles léger pour les organisations qui veulent des automatisations déclencheur→action sans le canevas Workflow complet. Définissez des règles en langage clair (Quand / Si / Alors), suivez les entités traitées, rejouez les échecs et ajustez les limitations. Complément du générateur visuel de workflows.",
    },
    external: {
      name: "API externes / points d'entrée webhook",
      description:
        "Permet d'exposer des points d'entrée HTTPS publics basés sur un slug (ex. https://api.flowentra.app/api/external-receive/contact-form-6f019d) pour recevoir des données de systèmes tiers — formulaires de landing page, webhooks CRM, intégrations partenaires. Chaque point d'entrée possède sa propre clé d'API, un interrupteur Actif, des méthodes HTTP autorisées et un journal complet des entrées. Les données reçues peuvent être transformées en fiches CRM (offres / ventes) directement depuis l'entrée du journal. Des modèles de démarrage rapide permettent à un utilisateur non technique de brancher un formulaire de contact en moins d'une minute.",
    },
    analytics: {
      name: "Analyse",
      description:
        "Espace décisionnel transverse. Rapports prêts à l'emploi pour les ventes, offres, achats, RH et le service terrain, ainsi qu'un générateur de graphiques personnalisés appuyé sur les widgets du constructeur de tableaux de bord. Comparaison de périodes, exploration détaillée et export CSV/PDF par rapport.",
    },
    "website-builder": {
      name: "Créateur de site web",
      description:
        "Constructeur visuel de sites pour les pages marketing publiques, les landing pages et les catalogues en ligne. Les pages sont publiées sur /public/sites/:slug et indexées par les moteurs de recherche. Il exploite en direct les données des articles (catalogue), des formulaires dynamiques et des points d'entrée externes (captation de prospects).",
    },
    lookups: {
      name: "Données de référence",
      description:
        "Source de vérité unique pour chaque valeur de liste déroulante de l'application. Les centraliser évite les fautes de saisie et permet aux administrateurs de faire évoluer les nomenclatures sans code. Chaque catégorie possède des valeurs typées, un ordre, une couleur, un indicateur d'activité et des traductions.",
    },
    notifications: {
      name: "Notifications",
      description:
        "Centre de notifications destiné aux utilisateurs, complété par des préférences de canal par utilisateur. Les notifications proviennent de tous les modules (mentions, affectations, changements de statut, validations, alertes système) et sont diffusées dans l'application, par e-mail et éventuellement par notification push web.",
    },
    support: {
      name: "Support / Tickets",
      description:
        "Helpdesk interne et système de tickets côté client. Les utilisateurs ouvrent un ticket depuis la page Aide ; les administrateurs trient, commentent, rattachent des fiches et résolvent depuis l'administration des tickets. Inclut priorité, compteurs de SLA, catégories et notifications par e-mail.",
    },
    settings: {
      name: "Paramètres",
      description:
        "Centre de toute l'administration. Espace personnel (profil, société, sécurité, préférences, données hors ligne) et espace d'administration (sociétés, utilisateurs, rôles, intégrations, abonnement, système, historique de synchronisation). Chaque section dispose de sa documentation dédiée dans l'index des paramètres.",
    },
    "service-orders": {
      name: "Ordres de service (terrain)",
      description:
        "Ordres de travail terrain qui relient les ventes à l'exécution sur site. Un ordre de service regroupe des travaux, des opérations (affectations de techniciens avec date/heure/tournée), des saisies de temps et dépenses, la consommation de matériel, des pièces jointes et un journal d'activité. Le statut se propage automatiquement selon l'avancement des opérations.",
    },
    "ai-assistant": {
      name: "Assistant IA",
      description:
        "Assistant conversationnel intégré, propulsé par Lovable AI / OpenRouter. Il aide à naviguer, résumer des fiches, rédiger des offres et répondre à des questions sur vos données.",
    },
    auth: {
      name: "Authentification",
      description:
        "Inscription, connexion, réinitialisation de mot de passe et fournisseurs OAuth (Google, Microsoft). Compatible multi-locataire avec routage par sous-domaine.",
    },
    payments: {
      name: "Paiements",
      description:
        "Suivez et rapprochez les paiements reçus sur les ventes / factures et les paiements émis sur les factures fournisseurs.",
    },
    onboarding: {
      name: "Prise en main et visite guidée",
      description:
        "Expérience de premier lancement guidée : configuration du profil de société, devise, langue, utilisateurs par défaut, puis visite contextuelle du produit sur le tableau de bord.",
    },
    preferences: {
      name: "Préférences utilisateur",
      description:
        "Préférences d'interface par utilisateur : thème, langue, mode de mise en page, modes d'affichage par défaut, configuration de la barre latérale, visibilité des colonnes de tableau.",
    },
    scheduling: {
      name: "Planification",
      description:
        "Planifiez le travail des techniciens sur une grille calendaire. Glissez les travaux depuis la file d'attente vers les lignes de techniciens / créneaux horaires.",
    },
    dispatcher: {
      name: "Console du répartiteur",
      description:
        "Vue carte et liste en temps réel des techniciens et des opérations en cours. Réaffectez, priorisez et communiquez depuis un seul écran.",
    },
    skills: {
      name: "Compétences",
      description:
        "Catalogue de compétences et niveaux de maîtrise par utilisateur. Utilisé par la planification pour proposer le bon technicien pour un travail.",
    },
    users: {
      name: "Utilisateurs et rôles",
      description:
        "Gérez les utilisateurs de l'application, attribuez les rôles et configurez des permissions fines par module / action.",
    },
    "dynamic-forms": {
      name: "Formulaires dynamiques",
      description:
        "Composez des formulaires personnalisés (champs en glisser-déposer), publiez-les sur une URL publique et collectez les réponses dans le back-office.",
    },
    signatures: {
      name: "Signatures électroniques",
      description:
        "Recueillez des signatures électroniques sur les offres, contrats, bons de livraison et documents RH. Conservées avec horodatage et identité du signataire.",
    },
    sync: {
      name: "Synchronisation hors ligne",
      description:
        "Mode hors ligne basé sur un service worker. Les modifications sont mises en file localement puis rejouées au retour de la connexion.",
    },
    plugins: {
      name: "Plugins",
      description:
        "Activez ou désactivez les modules par locataire. Les plugins cœur (Système, Paramètres, Authentification, Tableau de bord) ne peuvent pas être désactivés. Les dépendances sont respectées.",
    },
  },
};

export default FR_DOCS;
