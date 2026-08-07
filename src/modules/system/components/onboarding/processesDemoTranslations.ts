// Translations for the Processes autopilot demo (EN + FR).
// English captions live inline in processesDemoScript.ts. The FR array
// must stay PROC_STEPS.length long, same step order.

import { PROC_STEPS, PROC_CHAPTERS, PROCESS_TALK_FR } from './processesDemoScript';

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
    'list':     'Liste',
    'tour':     'Chaque processus',
    'actions':  'Exécuter & Pause',
    'drawer':   'Panneau détaillé',
    'wrap':     'Synchro & Conclusion',
  },
};

// FR translations for the fixed (non-per-process) steps, keyed by the exact
// English caption. Per-process step captions are translated via PROCESS_TALK_FR
// which is looked up by the row target id.
const FIXED_FR: Record<string, string> = {
  'This is Background Services — the control tower for every recurring or background job that keeps the platform tidy: overdue invoices, expiring offers, log purges, missed dispatches, and more.':
    'Voici les Services d’arrière-plan — la tour de contrôle de chaque tâche récurrente ou d’arrière-plan qui garde la plateforme propre : factures en retard, offres expirées, purges de logs, missions manquées, et bien plus.',
  'Running counts the jobs firing right now. The scheduler holds an advisory lock while a job runs so the exact same job can never double-fire, even across restarts.':
    'En cours compte les tâches qui s’exécutent maintenant. Le planificateur pose un verrou consultatif pendant l’exécution, donc la même tâche ne peut jamais se déclencher deux fois, même après un redémarrage.',
  'Failed shows jobs whose last run threw an error. The retry ladder backs them off automatically, and you can clear the counter once you fix the cause.':
    'Échecs affiche les tâches dont la dernière exécution a levé une erreur. L’échelle de reprise les temporise automatiquement, et vous pouvez remettre le compteur à zéro dès que la cause est corrigée.',
  'Blocked means a job cannot run yet — its handler is not registered, or the scheduler has missed its window past the grace period. The diagnostics tab tells you exactly why.':
    'Bloqué signifie qu’une tâche ne peut pas encore s’exécuter — son handler n’est pas enregistré, ou le planificateur a dépassé son délai de grâce. L’onglet Diagnostics vous dit exactement pourquoi.',
  'Paused is the count of schedules you have manually stopped. The rows stay listed so you can resume them the moment they are needed again.':
    'En pause, c’est le nombre de planifications que vous avez arrêtées manuellement. Les lignes restent listées pour que vous puissiez les reprendre au moment voulu.',
  'Total is every process backed by a real, verified handler — the ones we know execute end to end on your servers. Unreliable stubs are hidden by design.':
    'Total, c’est chaque processus adossé à un vrai handler vérifié — ceux dont nous savons qu’ils s’exécutent de bout en bout sur vos serveurs. Les stubs peu fiables sont masqués volontairement.',
  'Search matches the name, module and description at once — type "invoice" to jump straight to every job that touches invoicing.':
    'La recherche filtre le nom, le module et la description en même temps — tapez « facture » pour sauter directement à toutes les tâches liées à la facturation.',
  'Workspace filter narrows to Sales, Field, Admin, Communication and more — the same workspace groups you already know from the rest of the app.':
    'Le filtre Espace réduit à Ventes, Terrain, Admin, Communication… les mêmes espaces que vous connaissez déjà dans le reste de l’application.',
  'Status filter pins the list to Running, Failed, Blocked or Paused — perfect when you want a quick sweep of what needs your attention today.':
    'Le filtre Statut fige la liste sur En cours, Échecs, Bloqué ou En pause — parfait pour un balayage rapide de ce qui demande votre attention aujourd’hui.',
  'Background Services are grouped by workspace so the ownership is obvious. Each group shows a count of the jobs living inside it.':
    'Les processus sont regroupés par espace pour que la propriété soit évidente. Chaque groupe affiche le nombre de tâches qu’il contient.',
  'Each row tells the whole story at a glance — job name, module, schedule in plain English, and the last and next run.':
    'Chaque ligne raconte toute l’histoire d’un coup d’œil — nom, module, planification en clair, et dernière et prochaine exécution.',
  'Run now fires the job on demand — it bypasses the schedule but respects the advisory lock, so if the scheduler is already running it you get a friendly "already running" toast instead of a duplicate.':
    'Exécuter contourne la planification à la demande, mais respecte le verrou — si le planificateur exécute déjà la tâche, vous obtenez un toast « déjà en cours » au lieu d’un doublon.',
  'Pause stops future runs of this specific job without disabling it. Great for maintenance windows — flip it back on and the schedule picks up right where it left off.':
    'Pause stoppe les prochaines exécutions de cette tâche sans la désactiver. Idéal pour les fenêtres de maintenance — reprenez, et la planification enchaîne pile là où elle s’était arrêtée.',
  'Click any row to open the deep-dive drawer — workspace tag, live status, and the human description of what the job actually does under the hood.':
    'Cliquez une ligne pour ouvrir le panneau détaillé — tag d’espace, statut en direct, et la description humaine de ce que la tâche fait réellement sous le capot.',
  'The action bar puts Run now, Pause, Stop and Reset failures one click away. Stop is honest — it warns you it is advisory, so we never pretend to kill an in-flight run.':
    'La barre d’actions met Exécuter, Pause, Stop et Réinitialiser les échecs à un clic. Stop est honnête — il prévient qu’il est indicatif, on ne prétend jamais tuer une exécution en cours.',
  'The Enabled switch is the master power — off means the scheduler will not touch this job at all. Flip it on once and the schedule row is auto-created so the tick loop picks it up.':
    'Le switch Activé, c’est l’interrupteur maître — off, le planificateur ne touchera pas à la tâche. Activez une fois, et la planification est créée automatiquement pour que la boucle la reprenne.',
  'Overview gives you the vitals — schedule, timezone, last duration, items processed last run, next scheduled run, 30-run success rate and the consecutive-failure counter.':
    'Vue d’ensemble donne les constantes vitales — planning, fuseau, dernière durée, éléments traités, prochaine exécution, taux de succès sur 30 runs et compteur d’échecs consécutifs.',
  'Schedule tab lets you change the cadence — interval jobs get a live editor, cron jobs show their expression. Every job also exposes its own configurable knobs: retention days, grace periods, batch size, retry limits. They are schema-driven — the backend publishes defaults, min and max, so bad values are clamped before they ever hit the database, and labels and hints are localized from the same source of truth.':
    'L’onglet Planification permet de changer la cadence — les tâches à intervalle ont un éditeur en direct, celles en cron affichent leur expression. Chaque tâche expose aussi ses propres paramètres : jours de rétention, périodes de grâce, taille de lot, limites de reprise. Le tout est piloté par un schéma — le backend publie défauts, minimum et maximum, les valeurs invalides sont bornées avant même d’atteindre la base, et les libellés et aides sont traduits depuis la même source de vérité.',
  'Under the interval, the Configuration panel exposes this job\'s own knobs — here grace_days for overdue invoices. Every field shows the current value, the schema default and the allowed range, so you never have to guess. Change grace_days from 3 to 5, hit Save, and the backend sanitises, clamps and persists — the next tick reads the new value.':
    'Sous l’intervalle, le panneau Configuration expose les paramètres propres à la tâche — ici grace_days pour les factures en retard. Chaque champ affiche la valeur courante, la valeur par défaut du schéma et la plage autorisée : plus besoin de deviner. Passez grace_days de 3 à 5, cliquez Enregistrer, et le backend nettoie, borne et persiste — la prochaine exécution lit la nouvelle valeur.',
  'History is the audit trail — every run with start time, duration, items processed, who triggered it, and success or failure with the exact error message underneath.':
    'Historique, c’est la piste d’audit — chaque exécution avec heure de début, durée, éléments traités, déclencheur, et succès ou échec avec le message d’erreur exact en dessous.',
  'Diagnostics answers "why is this blocked?" automatically — table exists, permissions granted, dependencies ready. Green means safe to run, red points at the exact fix.':
    'Diagnostics répond automatiquement à « pourquoi c’est bloqué ? » — table existe, permissions accordées, dépendances prêtes. Vert = ok, rouge pointe le correctif exact.',
  'The page polls the backend every fifteen seconds, and Refresh forces an immediate sync. Scheduler-driven runs surface here automatically — no page reload required.':
    'La page interroge le backend toutes les 15 secondes, et Actualiser force une synchro immédiate. Les runs déclenchés par le planificateur remontent tout seuls — pas besoin de recharger.',
  'That is Background Services end-to-end — every automated job explained, with lock-safe execution, live KPIs, per-row controls, a deep drawer, real history, and self-diagnosing checks. Set it once, and your platform keeps itself clean.':
    'Voilà les Services d’arrière-plan de bout en bout — chaque tâche automatisée expliquée, avec verrouillage sûr, KPI en direct, actions par ligne, panneau profond, historique réel et diagnostics auto. Configurez une fois, la plateforme se maintient toute seule.',
};

// Tour intro caption: dynamic (contains a count), matched by prefix.
function tourIntroFr(en: string): string | null {
  const m = en.match(/^Here are all (\d+) live processes/);
  if (!m) return null;
  return `Voici les ${m[1]} processus actifs qui tournent sur votre plateforme aujourd’hui. Je vous les présente un par un — ce qu’ils font et à quelle fréquence.`;
}

export function getCaption(lang: DemoLang, index: number, fallback: string): string {
  if (lang !== 'fr') return fallback;
  // Per-process step? Match by row-target id encoded into the step target.
  const step = PROC_STEPS[index];
  if (step) {
    const m = step.target.match(/^proc-demo-row-key-(.+)$/);
    if (m && PROCESS_TALK_FR[m[1]]) return PROCESS_TALK_FR[m[1]];
  }
  return FIXED_FR[fallback] ?? tourIntroFr(fallback) ?? fallback;
}
export function getChapterTitle(lang: DemoLang, id: string, fallback: string): string {
  return CHAPTER_TITLES[lang]?.[id] ?? fallback;
}
