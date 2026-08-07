// AI Issue Detection Service
// Detects when users report issues and fetches relevant logs to provide intelligent responses

import { logsApi, SystemLog } from '@/services/api/logsApi';

export interface IssueAnalysisResult {
  isIssueReport: boolean;
  issueContext?: string;
  relevantLogs?: SystemLog[];
  suggestedCause?: string;
  formattedResponse?: string;
  // For UI display
  displayLogs?: SystemLog[];
}

// Patterns that indicate the user is reporting a problem
const ISSUE_REPORT_PATTERNS = [
  // English patterns
  /(?:i'm|i am|im)\s+(?:getting|seeing|having|experiencing)\s+(?:an?\s+)?(?:error|issue|problem|bug)/i,
  /(?:there's|there is|theres)\s+(?:an?\s+)?(?:error|issue|problem|bug)/i,
  /(?:something|it)\s+(?:is\s+)?(?:not\s+)?(?:working|broken|wrong|failing)/i,
  /(?:can't|cannot|cant|couldn't|could not)\s+(?:save|load|create|delete|update|open|access|login|submit)/i,
  /(?:why|what)\s+(?:is|does|did)\s+(?:this|it|the)\s+(?:error|issue|problem|fail)/i,
  /(?:error|issue|problem|bug|failure|exception)\s+(?:when|while|during|with)/i,
  /(?:keeps?|keep)\s+(?:failing|crashing|showing\s+error|giving\s+error)/i,
  /(?:doesn't|does not|doesnt|won't|will not|wont)\s+(?:work|load|save|open|respond)/i,
  /(?:stuck|freeze|frozen|hanging|crashed)/i,
  /(?:blank|empty|white)\s+(?:screen|page)/i,
  /(?:500|404|403|401|400)\s*(?:error)?/i,
  /(?:failed|failure|timeout|timed?\s*out)/i,
  /(?:help|fix|solve|resolve)\s+(?:this|the|my)\s+(?:error|issue|problem)/i,
  
  // French patterns
  /(?:j'ai|jai)\s+(?:une?\s+)?(?:erreur|problème|probleme|bug|souci)/i,
  /(?:ça|ca|il|elle)\s+(?:ne\s+)?(?:marche|fonctionne)\s+(?:pas|plus)/i,
  /(?:impossible|ne peux pas|ne peut pas)\s+(?:de\s+)?(?:sauvegarder|charger|créer|supprimer|ouvrir|accéder)/i,
  /(?:pourquoi|qu'est-ce que|c'est quoi)\s+(?:cette?\s+)?(?:erreur|problème)/i,
  /(?:aide|aidez|réparer|corriger|résoudre)/i,
  /(?:écran|page)\s+(?:blanc|blanche|vide)/i,
  /(?:bloqué|planté|figé|gelé)/i,
];

// Keywords that indicate specific issue areas
const ISSUE_CONTEXT_KEYWORDS: Record<string, string[]> = {
  authentication: ['login', 'logout', 'password', 'connexion', 'mot de passe', 'auth', 'token', 'session', 'unauthorized', '401', '403'],
  database: ['save', 'saving', 'database', 'data', 'record', 'enregistrer', 'sauvegarde', 'données'],
  api: ['api', 'request', 'response', 'endpoint', 'fetch', 'timeout', '500', '502', '503', '504'],
  network: ['network', 'connection', 'internet', 'offline', 'timeout', 'connexion', 'réseau'],
  offers: ['offer', 'devis', 'quote', 'quotation'],
  sales: ['sale', 'vente', 'invoice', 'facture', 'payment'],
  contacts: ['contact', 'client', 'customer', 'vendor', 'fournisseur'],
  tasks: ['task', 'tâche', 'todo', 'daily task', 'projet'],
  dispatches: ['dispatch', 'intervention', 'schedule', 'planning', 'technician'],
  articles: ['article', 'product', 'produit', 'inventory', 'stock', 'material', 'service'],
  installations: ['installation', 'equipment', 'équipement', 'machine'],
  forms: ['form', 'formulaire', 'submit', 'validation', 'field', 'champ'],
  upload: ['upload', 'file', 'image', 'attachment', 'fichier', 'télécharger', 'pièce jointe'],
  ui: ['button', 'click', 'page', 'screen', 'display', 'show', 'bouton', 'écran', 'affiche'],
};

// Detect if the message is an issue report
export const detectIssueReport = (message: string): { isIssue: boolean; contexts: string[] } => {
  const lowerMessage = message.toLowerCase();
  
  // Check against issue patterns
  const isIssue = ISSUE_REPORT_PATTERNS.some(pattern => pattern.test(message));
  
  if (!isIssue) {
    return { isIssue: false, contexts: [] };
  }
  
  // Detect which contexts are mentioned
  const contexts: string[] = [];
  for (const [context, keywords] of Object.entries(ISSUE_CONTEXT_KEYWORDS)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      contexts.push(context);
    }
  }
  
  return { isIssue: true, contexts };
};

// Fetch recent error logs relevant to the issue
export const fetchRelevantLogs = async (contexts: string[]): Promise<SystemLog[]> => {
  try {
    // Get errors from the last 24 hours
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24);
    
    // First, get recent errors
    const errorLogs = await logsApi.getAll({
      level: 'error',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      pageSize: 50,
      pageNumber: 1,
    });
    
    // Also get warnings that might be relevant
    const warningLogs = await logsApi.getAll({
      level: 'warning',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      pageSize: 20,
      pageNumber: 1,
    });
    
    let allLogs = [...(errorLogs.logs || []), ...(warningLogs.logs || [])];
    
    // Filter by context if we have specific contexts
    if (contexts.length > 0) {
      const contextFiltered = allLogs.filter(log => {
        const logText = `${log.message} ${log.module} ${log.entityType || ''} ${log.details || ''}`.toLowerCase();
        return contexts.some(ctx => {
          const keywords = ISSUE_CONTEXT_KEYWORDS[ctx] || [];
          return keywords.some(kw => logText.includes(kw)) || logText.includes(ctx);
        });
      });
      
      // If we found context-specific logs, use those; otherwise fall back to all logs
      if (contextFiltered.length > 0) {
        allLogs = contextFiltered;
      }
    }
    
    // Sort by timestamp (most recent first) and take top 15
    return allLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);
  } catch (error) {
    console.error('Failed to fetch logs for issue detection:', error);
    return [];
  }
};

// Analyze logs and suggest cause
const analyzeLogsForCause = (logs: SystemLog[], contexts: string[]): string | undefined => {
  if (logs.length === 0) return undefined;
  
  // Count error types
  const errorCounts: Record<string, number> = {};
  const recentErrors: string[] = [];
  
  for (const log of logs) {
    const errorType = log.entityType || log.module || 'Unknown';
    errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    
    if (log.level === 'error' && recentErrors.length < 5) {
      recentErrors.push(log.message);
    }
  }
  
  // Find most common error type
  const sortedErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]);
  const mostCommon = sortedErrors[0];
  
  if (mostCommon && mostCommon[1] >= 2) {
    return `Multiple ${mostCommon[0]} errors detected (${mostCommon[1]} occurrences in the last 24 hours)`;
  }
  
  return undefined;
};

// Format logs for AI context
export const formatLogsForAI = (logs: SystemLog[]): string => {
  if (logs.length === 0) {
    return 'No recent error logs found in the system.';
  }
  
  let result = `**Recent System Logs (${logs.length} entries from last 24 hours):**\n\n`;
  
  for (const log of logs.slice(0, 10)) {
    const time = new Date(log.timestamp).toLocaleString();
    const levelEmoji = log.level === 'error' ? '🔴' : log.level === 'warning' ? '🟡' : 'ℹ️';
    
    result += `${levelEmoji} **[${log.level.toUpperCase()}]** ${time}\n`;
    result += `   Module: ${log.module}\n`;
    result += `   Message: ${log.message.slice(0, 200)}${log.message.length > 200 ? '...' : ''}\n`;
    if (log.entityType) result += `   Entity: ${log.entityType}`;
    if (log.entityId) result += ` (ID: ${log.entityId})`;
    if (log.entityType || log.entityId) result += '\n';
    if (log.details) {
      try {
        const details = JSON.parse(log.details);
        if (details.stack) {
          result += `   Stack: ${details.stack.split('\n')[0]}\n`;
        }
        if (details.url) {
          result += `   URL: ${details.url}\n`;
        }
      } catch {
        result += `   Details: ${log.details.slice(0, 100)}...\n`;
      }
    }
    result += '\n';
  }
  
  if (logs.length > 10) {
    result += `_... and ${logs.length - 10} more log entries_\n`;
  }
  
  return result;
};

// Main function to analyze user's issue report
export const analyzeUserIssue = async (message: string): Promise<IssueAnalysisResult> => {
  const { isIssue, contexts } = detectIssueReport(message);
  
  if (!isIssue) {
    return { isIssueReport: false };
  }
  
  // Fetch relevant logs
  const logs = await fetchRelevantLogs(contexts);
  
  // Analyze for cause
  const suggestedCause = analyzeLogsForCause(logs, contexts);
  
  // Format response for AI
  let formattedResponse = '';
  
  if (logs.length > 0) {
    formattedResponse = `[ISSUE DETECTION ACTIVATED]\n\n`;
    formattedResponse += `**Issue Context:** ${contexts.length > 0 ? contexts.join(', ') : 'General'}\n\n`;
    
    if (suggestedCause) {
      formattedResponse += `**Preliminary Analysis:** ${suggestedCause}\n\n`;
    }
    
    formattedResponse += formatLogsForAI(logs);
    formattedResponse += `\n[INSTRUCTION]: Analyze the above system logs to help diagnose the user's reported issue. Explain what might be causing the problem in simple terms and suggest potential solutions. If the logs don't seem related to their specific issue, mention that and ask for more details.`;
  } else {
    formattedResponse = `[ISSUE DETECTION ACTIVATED]\n\n`;
    formattedResponse += `**Issue Context:** ${contexts.length > 0 ? contexts.join(', ') : 'General'}\n\n`;
    formattedResponse += `No recent error logs found in the system related to this issue.\n\n`;
    formattedResponse += `[INSTRUCTION]: The user reported an issue but no relevant error logs were found. Ask them for more specific details about what they were trying to do, what error message they saw (if any), and when the issue occurred. Provide general troubleshooting tips relevant to the ${contexts.length > 0 ? contexts.join('/') : 'system'}.`;
  }
  
  return {
    isIssueReport: true,
    issueContext: contexts.join(', '),
    relevantLogs: logs,
    suggestedCause,
    formattedResponse,
    // Include logs for UI display
    displayLogs: logs,
  };
};

// Quick check function for integration
export const isIssueReportMessage = (message: string): boolean => {
  return detectIssueReport(message).isIssue;
};
