// AI Follow-up Questions Service
// Generates contextual follow-up question suggestions using backend LLM

import { callForJson } from '@/services/aiKeyManager';

// Rate limiting state
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // Reduced from 2s to 500ms

/**
 * Generate follow-up question suggestions — returns smart fallbacks instantly,
 * then upgrades with LLM suggestions if available quickly.
 */
export const generateFollowUpQuestions = async (
  userMessage: string,
  aiResponse: string,
  language: 'en' | 'fr' = 'en'
): Promise<string[]> => {
  // Always have instant fallback questions ready
  const fallbacks = getSmartFallbackQuestions(userMessage, aiResponse, language);

  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    // Skip LLM call if too frequent — return fallbacks instantly
    return fallbacks;
  }
  lastRequestTime = Date.now();

  try {
    // Race: LLM call vs 3-second timeout — use fallbacks if LLM is too slow
    const llmPromise = callLLMForFollowUps(userMessage, aiResponse, language);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));

    const result = await Promise.race([llmPromise, timeoutPromise]);
    return result && result.length >= 2 ? result : fallbacks;
  } catch {
    return fallbacks;
  }
};

async function callLLMForFollowUps(
  userMessage: string,
  aiResponse: string,
  language: 'en' | 'fr'
): Promise<string[] | null> {
  const systemPrompt = language === 'fr' 
    ? `Tu es un assistant qui génère des questions de suivi pertinentes pour Flowentra. Génère exactement 3 questions de suivi DIFFÉRENTES de la question originale. Concises (max 10 mots), en français. Réponds UNIQUEMENT avec un tableau JSON de 3 questions.`
    : `You are an assistant generating relevant follow-up questions for Flowentra. Generate exactly 3 follow-up questions DIFFERENT from the original. Concise (max 10 words), in English. Reply ONLY with a JSON array of 3 questions.`;

  const userPrompt = language === 'fr'
    ? `Question originale (NE PAS RÉPÉTER): \"${userMessage}\"\nRéponse: \"${aiResponse.substring(0, 300)}\"\nGénère 3 questions de suivi DIFFÉRENTES en JSON:`
    : `Original question (DO NOT REPEAT): \"${userMessage}\"\nResponse: \"${aiResponse.substring(0, 300)}\"\nGenerate 3 DIFFERENT follow-up questions as JSON:`;

  const result = await callForJson<string[]>({
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    temperature: 0.7,
    maxTokens: 150, // Reduced from 200
  });

  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    const filtered = result.data
      .slice(0, 3)
      .map(q => String(q).trim())
      .filter(q => !isSimilarQuestion(q, userMessage));
    
    if (filtered.length >= 2) return filtered.slice(0, 3);
  }
  return null;
}

const isSimilarQuestion = (question1: string, question2: string): boolean => {
  const normalize = (s: string) => s.toLowerCase().replace(/[?!.,]/g, '').trim();
  const q1 = normalize(question1);
  const q2 = normalize(question2);
  if (q1 === q2) return true;
  if (q1.includes(q2) || q2.includes(q1)) return true;
  const words1 = new Set(q1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(q2.split(/\s+/).filter(w => w.length > 3));
  const intersection = [...words1].filter(w => words2.has(w));
  const minSetSize = Math.min(words1.size, words2.size);
  return minSetSize > 0 && intersection.length / minSetSize > 0.6;
};

const getSmartFallbackQuestions = (
  userMessage: string,
  aiResponse: string,
  language: 'en' | 'fr'
): string[] => {
  const lowerResponse = aiResponse.toLowerCase();
  const lowerMessage = userMessage.toLowerCase();
  
  const topics = {
    onboarding: /newly set up|getting started|start by adding|recommended starting|first contact|setup tasks|checklist|begin with|initial setup|no data|0 contacts|empty|configure|new account/i,
    summary: /summary|overview|résumé|aperçu|how.*business|état.*entreprise|business health|full summary|comprehensive/i,
    tasks: /task|tâche|todo|action|complete|assign|overdue|priority|deadline/i,
    contacts: /contact|client|customer|supplier|fournisseur|lead|prospect/i,
    sales: /sale|vente|revenue|chiffre|order|commande|invoice|payment/i,
    service: /service|intervention|dispatch|technician|technicien|field|terrain/i,
    offers: /offer|devis|quote|proposal|proposition|estimate/i,
    projects: /project|projet|kanban|board|column|sprint/i,
    inventory: /inventory|stock|article|product|material|asset/i,
    reports: /report|analytics|statistics|dashboard|metrics|kpi/i,
  };
  
  let detectedTopic: string | null = null;
  for (const [topic, pattern] of Object.entries(topics)) {
    if (pattern.test(lowerResponse)) { detectedTopic = topic; break; }
  }
  if (!detectedTopic) {
    for (const [topic, pattern] of Object.entries(topics)) {
      if (pattern.test(lowerMessage)) { detectedTopic = topic; break; }
    }
  }
  
  const questionPools: Record<string, { en: string[], fr: string[] }> = {
    onboarding: { en: ["How do I add my first contact?", "Guide me through product setup", "How to create my first offer?"], fr: ["Comment ajouter mon premier contact ?", "Guide pour configurer les produits", "Comment créer mon premier devis ?"] },
    summary: { en: ["Show today's activity", "What needs my attention?", "Compare with last month"], fr: ["Activité d'aujourd'hui", "Qu'est-ce qui nécessite mon attention ?", "Comparer avec le mois dernier"] },
    tasks: { en: ["What are my priority tasks?", "How to assign tasks to team?", "Show completed tasks today"], fr: ["Quelles sont mes tâches prioritaires ?", "Comment assigner des tâches ?", "Tâches terminées aujourd'hui ?"] },
    sales: { en: ["What's the revenue this month?", "Show pending sales orders", "Top customers by revenue?"], fr: ["Chiffre d'affaires ce mois ?", "Ventes en attente ?", "Meilleurs clients ?"] },
    service: { en: ["What service orders today?", "How to assign a technician?", "Technician availability?"], fr: ["Interventions aujourd'hui ?", "Comment assigner un technicien ?", "Disponibilité techniciens ?"] },
    contacts: { en: ["How to add a new contact?", "Search contacts by company", "Export contacts list"], fr: ["Ajouter un nouveau contact ?", "Rechercher par entreprise", "Exporter les contacts"] },
    offers: { en: ["How to create an offer?", "Pending offers to follow up?", "Convert offer to sale"], fr: ["Comment créer un devis ?", "Devis en attente ?", "Convertir devis en vente"] },
    projects: { en: ["Create a new project", "View project kanban board", "Project progress overview"], fr: ["Créer un projet", "Voir tableau kanban", "Avancement du projet"] },
    inventory: { en: ["Low stock alerts?", "Add inventory item", "Stock movement history"], fr: ["Alertes stock bas ?", "Ajouter article stock", "Historique mouvements"] },
    reports: { en: ["View dashboard KPIs", "Export analytics report", "Revenue trends chart"], fr: ["Voir KPIs tableau de bord", "Exporter rapport analytique", "Graphique tendance revenus"] },
    default: { en: ["What can I do in Flowentra?", "Show me today's summary", "What features are available?"], fr: ["Que puis-je faire ?", "Résumé d'aujourd'hui", "Fonctionnalités disponibles ?"] },
  };
  
  const pool = questionPools[detectedTopic || 'default'] || questionPools.default;
  const questions = language === 'fr' ? pool.fr : pool.en;
  const filtered = questions.filter(q => !isSimilarQuestion(q, userMessage));
  return filtered.sort(() => Math.random() - 0.5).slice(0, 3);
};

export const detectLanguageFromText = (text: string): 'en' | 'fr' => {
  const lowerText = text.toLowerCase();
  const strongFrenchIndicators = ['bonjour', 'bonsoir', 'salut', 'merci', 'oui', 'qu\'est-ce', 'est-ce que', 'pourquoi', 'comment', 'combien'];
  if (strongFrenchIndicators.some(word => lowerText.includes(word))) return 'fr';
  const frenchWords = ['je', 'tu', 'il', 'elle', 'nous', 'vous', 'les', 'des', 'une', 'est', 'sont', 'mon', 'ma', 'mes', 'pour', 'avec', 'dans', 'devis', 'vente', 'client', 'tâche'];
  const words = lowerText.split(/\s+/);
  const frenchWordCount = words.filter(word => frenchWords.includes(word.replace(/[.,?!;:]/g, ''))).length;
  const frenchRatio = words.length > 0 ? frenchWordCount / words.length : 0;
  return (frenchWordCount >= 1 && frenchRatio >= 0.2) || frenchWordCount >= 2 ? 'fr' : 'en';
};
