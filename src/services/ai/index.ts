// AI Services - Central exports
// This file provides clean imports for all AI-related services

// Smart Intent Recognition (the "second brain")
export {
  recognizeIntent,
  detectFormIntentSmart,
  detectTaskIntentSmart,
  detectDispatchAssignmentIntent,
  detectStockModificationIntent,
  detectIntentUniversal,
  type ActionType,
  type SmartIntentResult,
  type SmartDetectionResult,
} from './aiSmartIntentRecognizer';

// Form Creation
export {
  detectFormCreationIntent,
  detectFormCreationIntentSmart,
  parseFormFromResponse,
  createFormFromParsedData,
  getFormCreationPrompt,
  formatFormCreationMessage,
  parseFormCreationFromResponse,
  executeFormCreation,
  type ParsedFormData,
  type FormCreationResult,
  type PendingFormCreation,
} from './aiFormCreationService';

// Task Creation
export {
  detectTaskCreationIntent,
  detectTaskCreationIntentSmart,
  parseTaskSuggestions,
  createTasksFromSuggestions,
  formatCreatedTasksMessage,
  type TaskSuggestion,
  type TaskCreationResult,
} from './aiTaskCreationService';

// Intent Analysis (legacy)
export {
  analyzeUserIntent,
  type IntentAnalysis,
} from '../aiIntentAnalyzer';

// Data Queries
export {
  detectAndExecuteDataQuery,
  aiDataQueries,
  type DataQueryResult,
} from './aiDataService';

// Assistant Service
export {
  streamMessageToAI,
  type ChatMessage,
  type AIResponse,
  type AIContextOptions,
} from './aiAssistantService';
