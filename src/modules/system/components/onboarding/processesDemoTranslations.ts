// Translations for the Processes autopilot demo (EN + FR).
// English captions live inline in processesDemoScript.ts. The FR array
// must stay PROC_STEPS.length long, same step order.

import { PROC_STEPS, PROC_CHAPTERS } from './processesDemoScript';

export type DemoLang = 'en' | 'fr';

export function pickLang(lng: string | undefined): DemoLang {
  const l = (lng || 'en').toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  return 'en';
}

export const CHAPTER_TITLES: Record<DemoLang, Record<string, string>> = {
  en: Object.fromEntries(PROC_CHAPTERS.map(c => [c.id, c.title])),
  fr: {
    'overview': 'Vue d’ensemble & KPI',
    'controls': 'Recherche & Filtres',
    'list':     'Liste & Statut',
    'actions':  'Exécuter & Pause',
    'drawer':   'Panneau détaillé',
    'wrap':     'Synchro & Conclusion',
  },
};

const CAPTIONS_FR: string[] = [
  'Voici Processus — la tour de contrôle de chaque tâche récurrente ou d’arrière-plan qui garde la plateforme propre : factures en retard, offres expirées, purges de logs, missions manquées, et bien plus.',
  'En cours compte les tâches qui s’exécutent maintenant. Le planificateur pose un verrou consultatif pendant l’exécution, donc la même tâche ne peut jamais se déclencher deux fois, même après un redémarrage.',
  'Échecs affiche les tâches dont la dernière exécution a levé une erreur. L’échelle de reprise les temporise automatiquement, et vous pouvez remettre le compteur à zéro dès que la cause est corrigée.',
  'Bloqué signifie qu’une tâche ne peut pas encore s’exécuter — souvent une table manquante, une config absente, ou une dépendance non installée. L’onglet Diagnostics vous dit exactement pourquoi.',
  'En pause, c’est le nombre de planifications que vous avez arrêtées manuellement. Les lignes restent listées pour que vous puissiez les reprendre au moment voulu.',
  'Total, c’est chaque processus adossé à un vrai handler vérifié — ceux dont nous savons qu’ils s’exécutent de bout en bout sur vos serveurs. Les stubs peu fiables sont masqués volontairement.',
  'La recherche filtre le nom, le module et la description en même temps — tapez « facture » pour sauter directement à toutes les tâches liées à la facturation.',
  'Le filtre Espace réduit à Ventes, Terrain, Admin, Communication… les mêmes espaces que vous connaissez déjà dans le reste de l’application.',
  'Le filtre Statut fige la liste sur En cours, Échecs, Bloqué, En pause ou Idle — parfait pour un balayage rapide de ce qui demande votre attention aujourd’hui.',
  'Les processus sont regroupés par espace pour que la propriété soit évidente. Chaque groupe affiche le nombre de tâches qu’il contient.',
  'Chaque ligne raconte toute l’histoire d’un coup d’œil — nom, module et clé, planification en clair, dernière exécution et prochaine exécution.',
  'La pastille de statut est vivante — Idle en attente, En cours pendant l’exécution, Échec avec l’info-bulle d’erreur, Bloqué avec la raison exacte : jamais de devinette.',
  'Exécuter contourne la planification à la demande, mais respecte le verrou — si le planificateur exécute déjà la tâche, vous obtenez un toast « déjà en cours » au lieu d’un doublon.',
  'Pause stoppe les prochaines exécutions de cette tâche sans la désactiver. Idéal pour les fenêtres de maintenance — reprenez, et la planification enchaîne pile là où elle s’était arrêtée.',
  'Cliquez une ligne pour ouvrir le panneau détaillé — tag d’espace, statut en direct, et la description humaine de ce que la tâche fait réellement sous le capot.',
  'La barre d’actions met Exécuter, Pause, Stop et Réinitialiser les échecs à un clic. Stop est honnête — il prévient qu’il est indicatif, on ne prétend jamais tuer une exécution en cours.',
  'Le switch Activé, c’est l’interrupteur maître — off, le planificateur ne touchera pas à la tâche. Activez une fois, et la planification est créée automatiquement pour que la boucle la reprenne.',
  'Vue d’ensemble donne les constantes vitales — planning, fuseau, dernière durée, éléments traités, prochaine exécution, taux de succès sur 30 runs et compteur d’échecs consécutifs.',
  'L’onglet Planification permet de changer la cadence — les tâches à intervalle ont un éditeur en direct, celles en cron affichent leur expression. Le fuseau est toujours écrit : rien ne tourne dans la mauvaise fenêtre.',
  'Historique, c’est la piste d’audit — chaque exécution avec heure de début, durée, éléments traités, déclencheur, et succès ou échec avec le message d’erreur exact en dessous.',
  'Diagnostics répond automatiquement à « pourquoi c’est bloqué ? » — table existe, permissions accordées, dépendances prêtes. Vert = ok, rouge pointe le correctif exact.',
  'La page interroge le backend toutes les 15 secondes, et Actualiser force une synchro immédiate. Les runs déclenchés par le planificateur remontent tout seuls — pas besoin de recharger.',
  'Voilà Processus de bout en bout — tâches auto-exécutées avec verrouillage sûr, KPI en direct, actions par ligne, panneau profond avec édition de planning, historique réel et diagnostics auto. Configurez une fois, la plateforme se maintient toute seule.',
];

if (CAPTIONS_FR.length !== PROC_STEPS.length) {
  // eslint-disable-next-line no-console
  console.warn('[processes demo] caption translation count mismatch', { en: PROC_STEPS.length, fr: CAPTIONS_FR.length });
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang === 'fr') return CAPTIONS_FR[index] ?? fallback;
  return fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
