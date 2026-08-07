// Translations for the Settings autopilot demo (EN + FR).
// English captions live inline in settingsDemoScript.ts. The FR caption array
// must stay exactly SET_STEPS.length long (asserted at runtime) in step order.

import { SET_STEPS, SET_CHAPTERS } from './settingsDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(SET_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview':     'Vue d’ensemble',
    'profile':      'Profil',
    'security':     'Sécurité',
    'company':      'Entreprise',
    'subscription': 'Abonnement',
    'companies':    'Entreprises',
    'offline':      'Sync hors-ligne',
    'system':       'Système',
    'wrapup':       'Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Bienvenue dans les Paramètres — le centre de contrôle de votre espace de travail Flowentra. Votre profil, votre entreprise, votre abonnement, la synchronisation hors-ligne et la configuration système : tout vit ici, au même endroit.',
  'Tout est réparti en deux groupes. Personnel — votre profil et la sécurité. Général — votre entreprise et vos préférences, votre abonnement et vos sièges, la synchronisation hors-ligne et la configuration système.',
  'Commencez par votre profil. Ajoutez une photo, définissez votre prénom et nom, votre e-mail, téléphone et entreprise. C’est votre identité personnelle dans l’espace de travail — enregistrez, et tout se met à jour partout.',
  'La Sécurité, c’est là que vous changez votre mot de passe — saisissez l’actuel, puis le nouveau deux fois pour confirmer. Votre compte verrouillé en quelques secondes.',
  'Juste en dessous, activez l’authentification à deux facteurs. Chaque connexion demande alors un code à usage unique envoyé par e-mail — le moyen le plus rapide de protéger votre espace de travail.',
  'Les paramètres d’entreprise contiennent votre marque. Téléchargez un logo — il apparaît dans la barre latérale, l’en-tête, la page de connexion et chaque rapport PDF — puis renseignez le nom, le site web et le téléphone de l’entreprise.',
  'Plus bas, les coordonnées bancaires — nom de la banque, compte ou IBAN, et SWIFT / BIC — ainsi que le message de pied de page des rapports. Tout ce que vous saisissez ici s’imprime en bas des rapports et PDF de cette société, et l’aperçu en direct montre exactement le rendu.',
  'Juste en dessous de la carte entreprise se trouvent vos préférences. Passez en sombre et tout l’espace de travail suit instantanément. Vos préférences n’appartiennent qu’à vous et ne changent jamais ce que voient vos collègues.',
  'Choisissez une couleur d’accent principale, votre langue, la disposition de navigation — barre latérale ou barre supérieure — et l’affichage des listes en tableaux ou en cartes. Les préférences s’enregistrent automatiquement.',
  'L’Abonnement est là où les propriétaires gèrent le plan du tenant. Voyez le plan actuel, son statut, votre fréquence de facturation, le nombre de sièges et la prochaine date de renouvellement d’un seul coup d’œil.',
  'Changez de plan d’un clic — Starter, Growth ou Business. Basculez entre facturation mensuelle et annuelle, ouvrez le portail de facturation pour les factures, ou annulez si besoin.',
  'Chaque facture arrive ici — numéro, date, montant et statut : payée, en attente ou échouée. Téléchargez-les et gardez votre comptabilité en ordre sans quitter l’application.',
  'Sous la facturation se trouvent les Modules activés — chaque module de votre espace avec son code et un badge Actif ou Inactif en direct, plus un compteur et une recherche pour les retrouver instantanément.',
  'Un module que vous n’avez pas encore ? Cliquez sur l’icône panier pour demander son achat. Un module dont vous n’avez plus besoin ? L’icône moins demande sa désactivation. Les modules cœur restent verrouillés.',
  'La boîte de dialogue rappelle le module, votre espace et son URL, puis demande un court message — obligatoire, pour que notre équipe sache exactement ce dont vous avez besoin. Envoyez, et un e-mail arrive immédiatement chez notre équipe, avec votre adresse, l’heure exacte et l’action requise.',
  'Entreprises, c’est là que les propriétaires gèrent chaque société du tenant — nom, slug, contact, statut et utilisateurs — créez, modifiez ou désactivez en un clic.',
  'La Portée des données par module décide, module par module, si les données sont partagées entre toutes les sociétés ou strictement cloisonnées par société. Contacts partagés, ventes par société — à vous de choisir.',
  'La synchronisation hors-ligne décide de ce qui vous accompagne sur le terrain. Cochez les modules à hydrater sur l’appareil — contacts, articles, ordres de service, dispatches — le reste reste côté serveur.',
  'Tout sélectionner en un clic, tout désélectionner, ou réinitialiser aux valeurs par défaut. Et le panneau Dernière exécution montre exactement quand chaque module a été synchronisé — plus de doute.',
  'La configuration système est là où les admins règlent la façon dont l’app convertit le travail. D’abord, le Mode de conversion des jobs — une installation devient un seul job avec tous ses services, ou chaque service devient son propre job individuel ?',
  'Choisissez Basé sur le service et chaque ligne de service est dispatchée seule. Choisissez Basé sur l’installation et les services restent groupés dans un seul dispatch. Un seul commutateur, et tout le flux de planification suit.',
  'En dessous, la Numérotation des documents — les modèles qui génèrent chaque numéro d’offre, de vente, d’ordre de service, de dispatch, de deal et de facture. Ouvrez-en un pour le configurer.',
  'Composez le modèle avec des jetons — année, date, séquence atomique, GUID, horodatage — choisissez la stratégie, la fréquence de remise à zéro, et prévisualisez le numéro exact que recevra votre prochain document.',
  'Voilà les Paramètres — votre profil et la sécurité, votre entreprise et vos préférences, votre abonnement et vos sièges, la synchronisation hors-ligne et la configuration système qui régit la numérotation et la conversion des jobs. Un seul centre de contrôle pour tout votre espace de travail.',
];

if (CAPTIONS_FR.length !== SET_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[settings demo] caption translation count mismatch', { en: SET_STEPS.length, fr: CAPTIONS_FR.length });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
