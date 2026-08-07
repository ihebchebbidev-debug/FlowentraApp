// AI Task Creation Service - Intelligently creates daily tasks from user descriptions
import { tasksApi, CreateDailyTaskRequestDto } from '@/services/api/tasksApi';
import { QueryClient } from '@tanstack/react-query';
import type { DailyTask } from '@/modules/tasks/types';
import { detectTaskIntentSmart } from './aiSmartIntentRecognizer';

// Reference to query client for cache invalidation
let queryClientRef: QueryClient | null = null;

export const setQueryClient = (client: QueryClient) => {
  queryClientRef = client;
};

// Task suggestion from AI analysis
export interface TaskSuggestion {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration?: string;
  dueDate?: Date; // Optional due date, defaults to today
}

// Result of task creation
export interface TaskCreationResult {
  success: boolean;
  createdTasks: DailyTask[];
  failedTasks: { suggestion: TaskSuggestion; error: string }[];
  message: string;
}

// Get current user ID from localStorage
const getCurrentUserId = (): number | null => {
  try {
    const userData = localStorage.getItem('user_data');
    if (!userData) return null;
    const user = JSON.parse(userData);
    return user?.id ? Number(user.id) : null;
  } catch {
    return null;
  }
};

// Get today's date in ISO format
const getTodayDate = (): string => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today.toISOString();
};

// Detect if a user message is requesting task creation (regex-based, fast)
export const detectTaskCreationIntent = (message: string): boolean => {
  const taskCreationPatterns = [
    // English patterns
    /(?:i need to|i have to|i want to|i should|i must|i'll|i will)\s+(?:do|complete|finish|work on|handle|take care of)/i,
    /(?:create|add|make)\s+(?:a\s+)?(?:task|todo|to-do|tasks|todos)/i,
    /(?:my|today'?s?)\s+(?:tasks?|todo|to-do|work|agenda)/i,
    /(?:help me|can you)\s+(?:plan|organize|schedule|create)/i,
    /(?:today|tomorrow|this week)\s+(?:i need|i have|i should|i must)/i,
    /(?:remind me to|don't forget to|remember to)/i,
    /(?:add|create|schedule|plan)\s+(?:the following|these|my)/i,
    /(?:here'?s?|this is)\s+(?:what i need|my tasks|my todo)/i,
    
    // French patterns
    /(?:je dois|j'ai besoin de|je veux|il faut que je|je devrais)/i,
    /(?:créer?|ajouter?|faire)\s+(?:une?\s+)?(?:tâche|todo|tâches)/i,
    /(?:mes|aujourd'hui)\s+(?:tâches?|travail|agenda)/i,
    /(?:aide-?moi|peux-?tu)\s+(?:planifier|organiser|créer)/i,
    /(?:aujourd'hui|demain|cette semaine)\s+(?:je dois|j'ai|il faut)/i,
    /(?:rappelle-?moi de|n'oublie pas de|souviens-?toi de)/i,
    
    // Direct task indicators
    /(?:^|\s)-\s+/m, // Bullet points
    /(?:^|\s)\d+[.)]\s+/m, // Numbered lists
    /(?:first|then|after that|finally|next|second|third)/i,
    /(?:d'abord|ensuite|après|finalement|puis)/i
  ];

  return taskCreationPatterns.some(pattern => pattern.test(message));
};

// Smart task detection with LLM fallback
export const detectTaskCreationIntentSmart = async (message: string): Promise<{
  hasIntent: boolean;
  confidence: number;
  source: 'regex' | 'llm' | 'combined';
}> => {
  const regexMatched = detectTaskCreationIntent(message);
  return detectTaskIntentSmart(message, regexMatched);
};

// Parse task suggestions from AI response
export const parseTaskSuggestions = (aiResponse: string): TaskSuggestion[] => {
  const suggestions: TaskSuggestion[] = [];
  
  // Look for JSON-like task blocks
  const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed)) {
        return parsed.map(t => ({
          title: t.title || t.name || 'Untitled Task',
          description: t.description || t.details,
          priority: normalizePriority(t.priority),
          estimatedDuration: t.duration || t.estimatedDuration
        }));
      }
    } catch {
      // Continue with text parsing
    }
  }

  // Look for TASKS_TO_CREATE marker
  const tasksMatch = aiResponse.match(/TASKS_TO_CREATE:\s*([\s\S]*?)(?:END_TASKS|$)/i);
  if (tasksMatch) {
    const lines = tasksMatch[1].split('\n').filter(l => l.trim());
    for (const line of lines) {
      const task = parseTaskLine(line);
      if (task) suggestions.push(task);
    }
    if (suggestions.length > 0) return suggestions;
  }

  // Fallback: Parse numbered or bulleted lists
  const lines = aiResponse.split('\n');
  for (const line of lines) {
    const task = parseTaskLine(line);
    if (task) suggestions.push(task);
  }

  return suggestions;
};

// Parse a single task line
const parseTaskLine = (line: string): TaskSuggestion | null => {
  // Remove common prefixes
  let cleaned = line
    .replace(/^[\s-*•◦▪️✅☐☑️⬜️🔲]+/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/^\[.*?\]\s*/, '')
    .trim();

  if (!cleaned || cleaned.length < 3) return null;

  // Extract priority from brackets or keywords
  let priority: TaskSuggestion['priority'] = 'medium';
  const priorityMatch = cleaned.match(/\[(urgent|high|medium|low|haute|basse|moyenne|urgente?)\]/i);
  if (priorityMatch) {
    priority = normalizePriority(priorityMatch[1]);
    cleaned = cleaned.replace(priorityMatch[0], '').trim();
  }

  // Check for priority keywords in the text
  if (/urgent|crítico|asap|immediately|immédiatement/i.test(cleaned)) {
    priority = 'urgent';
  } else if (/important|high priority|haute priorité/i.test(cleaned)) {
    priority = 'high';
  }

  // Extract duration if present
  let estimatedDuration: string | undefined;
  const durationMatch = cleaned.match(/\((\d+\s*(?:min|hour|h|hr|minute|heure)s?)\)/i);
  if (durationMatch) {
    estimatedDuration = durationMatch[1];
    cleaned = cleaned.replace(durationMatch[0], '').trim();
  }

  // Split title and description by colon or dash
  let title = cleaned;
  let description: string | undefined;
  
  const colonIndex = cleaned.indexOf(':');
  if (colonIndex > 5 && colonIndex < cleaned.length - 2) {
    title = cleaned.substring(0, colonIndex).trim();
    description = cleaned.substring(colonIndex + 1).trim();
  }

  // Truncate title if too long
  if (title.length > 150) {
    description = title;
    title = title.substring(0, 147) + '...';
  }

  return {
    title,
    description,
    priority,
    estimatedDuration
  };
};

// Normalize priority strings
const normalizePriority = (p: string): TaskSuggestion['priority'] => {
  const lower = (p || '').toLowerCase();
  if (/urgent|crítico|urgente/.test(lower)) return 'urgent';
  if (/high|haute|alto/.test(lower)) return 'high';
  if (/low|basse|bajo/.test(lower)) return 'low';
  return 'medium';
};

// Create tasks from suggestions via API
export const createTasksFromSuggestions = async (
  suggestions: TaskSuggestion[]
): Promise<TaskCreationResult> => {
  const userId = getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      createdTasks: [],
      failedTasks: suggestions.map(s => ({ suggestion: s, error: 'User not logged in' })),
      message: 'Unable to create tasks: User not authenticated'
    };
  }

  const createdTasks: DailyTask[] = [];
  const failedTasks: { suggestion: TaskSuggestion; error: string }[] = [];
  const defaultDueDate = getTodayDate();

  for (const suggestion of suggestions) {
    try {
      // Use task-specific due date or default to today
      const taskDueDate = suggestion.dueDate 
        ? new Date(suggestion.dueDate).toISOString() 
        : defaultDueDate;
      
      const createDto: CreateDailyTaskRequestDto = {
        title: suggestion.title,
        description: suggestion.description || '',
        priority: suggestion.priority,
        assignedUserId: userId,
        dueDate: taskDueDate,
        status: 'todo'
      };

      const created = await tasksApi.createDailyTask(createDto);
      createdTasks.push(created);
    } catch (error) {
      failedTasks.push({
        suggestion,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Invalidate the daily tasks query to refresh the UI
  if (createdTasks.length > 0 && queryClientRef) {
    queryClientRef.invalidateQueries({ queryKey: ['dailyTasks'] });
  }

  const total = suggestions.length;
  const successCount = createdTasks.length;
  
  let message: string;
  if (successCount === total) {
    message = `✅ Successfully created ${successCount} task${successCount !== 1 ? 's' : ''}!`;
  } else if (successCount > 0) {
    message = `⚠️ Created ${successCount} of ${total} tasks. ${failedTasks.length} failed.`;
  } else {
    message = `❌ Failed to create tasks. Please try again.`;
  }

  return {
    success: successCount > 0,
    createdTasks,
    failedTasks,
    message
  };
};

// Get task creation instructions for AI system prompt
export const getTaskCreationInstructions = (): string => {
  return `
## TASK CREATION CAPABILITY

You can help users create daily tasks. When users describe what they need to do, you should:

1. **Analyze their request** - Break down complex work into actionable tasks
2. **Suggest clear task titles** - Make them specific and actionable (start with a verb)
3. **Assign priorities** - Based on urgency and importance:
   - "urgent": Must be done today, critical
   - "high": Important, should be prioritized
   - "medium": Standard priority (default)
   - "low": Can be done later if time permits

4. **Format your response** with tasks clearly marked:

TASKS_TO_CREATE:
1. [priority] Task title: Optional description
2. [priority] Another task title
END_TASKS

**Example:**
User: "I need to prepare for tomorrow's client meeting, review the proposal, and send it for approval"

Response: "I'll help you organize that! Here are your tasks:

TASKS_TO_CREATE:
1. [high] Review client proposal: Check all sections, pricing, and terms
2. [high] Update proposal with feedback: Make necessary revisions
3. [urgent] Send proposal for approval: Email to manager for sign-off
4. [medium] Prepare meeting notes: Key talking points for client meeting
END_TASKS

These tasks will be created and assigned to you for today."

**Guidelines:**
- Keep task titles concise but descriptive (under 100 characters)
- Use action verbs: Review, Create, Update, Send, Complete, Prepare, Schedule, etc.
- Break complex tasks into smaller, achievable steps
- Always confirm the tasks before they're created
- Tasks will automatically be assigned to the current user with today's due date
`;
};

// Format created tasks for display in chat
export const formatCreatedTasksMessage = (result: TaskCreationResult): string => {
  if (!result.success || result.createdTasks.length === 0) {
    return result.message;
  }

  let message = `${result.message}\n\n**Created Tasks:**\n`;
  
  for (const task of result.createdTasks) {
    const priorityEmoji = getPriorityEmoji(task.priority);
    message += `${priorityEmoji} **${task.title}**\n`;
    if (task.description) {
      message += `   _${task.description}_\n`;
    }
  }

  message += `\n📋 [View your daily tasks](/dashboard/tasks/daily)`;
  
  return message;
};

const getPriorityEmoji = (priority: string): string => {
  switch (priority) {
    case 'urgent': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
};
