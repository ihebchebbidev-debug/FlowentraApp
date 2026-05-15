// Entity Link Parser - Detects and parses entity mentions in AI responses
// Format: @[type:id:name] e.g., @[contact:123:John Doe] or @[task:456:Review proposal]

export type EntityType = 'contact' | 'task' | 'offer' | 'job' | 'dispatch' | 'article' | 'installation';

export interface ParsedEntity {
  type: EntityType;
  id: string | number;
  name: string;
  originalText: string;
  startIndex: number;
  endIndex: number;
}

export interface TextSegment {
  type: 'text' | 'entity';
  content: string;
  entity?: ParsedEntity;
}

// Regex to match entity mentions: @[type:id:name]
const ENTITY_PATTERN = /@\[(contact|task|offer|job|dispatch|article|installation):(\d+):([^\]]+)\]/gi;

// Alternative patterns the AI might use naturally
const NATURAL_PATTERNS = {
  contact: /\b(?:contact|client|customer)\s+"([^"]+)"\s*\(#(\d+)\)/gi,
  task: /\b(?:task)\s+"([^"]+)"\s*\(#(\d+)\)/gi,
  offer: /\b(?:offer|quote|proposal)\s+"([^"]+)"\s*\(#(\d+)\)/gi,
  job: /\b(?:job)\s+"([^"]+)"\s*\(#(\d+)\)/gi,
};

export function parseEntityLinks(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const entities: ParsedEntity[] = [];
  
  // Find all entity mentions using the structured format
  let match;
  const regex = new RegExp(ENTITY_PATTERN.source, 'gi');
  
  while ((match = regex.exec(text)) !== null) {
    entities.push({
      type: match[1].toLowerCase() as EntityType,
      id: parseInt(match[2], 10),
      name: match[3],
      originalText: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }
  
  // Also check for natural language patterns
  Object.entries(NATURAL_PATTERNS).forEach(([type, pattern]) => {
    const naturalRegex = new RegExp(pattern.source, 'gi');
    while ((match = naturalRegex.exec(text)) !== null) {
      // Check if this overlaps with an existing entity
      const overlaps = entities.some(
        e => (match!.index >= e.startIndex && match!.index < e.endIndex) ||
             (e.startIndex >= match!.index && e.startIndex < match!.index + match![0].length)
      );
      
      if (!overlaps) {
        entities.push({
          type: type as EntityType,
          id: parseInt(match[2], 10),
          name: match[1],
          originalText: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }
  });
  
  // Sort entities by start index
  entities.sort((a, b) => a.startIndex - b.startIndex);
  
  // Build segments
  let lastIndex = 0;
  
  for (const entity of entities) {
    // Add text before this entity
    if (entity.startIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, entity.startIndex),
      });
    }
    
    // Add the entity
    segments.push({
      type: 'entity',
      content: entity.name,
      entity,
    });
    
    lastIndex = entity.endIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }
  
  // If no entities found, return the whole text as a single segment
  if (segments.length === 0) {
    segments.push({ type: 'text', content: text });
  }
  
  return segments;
}

// Helper to format entity mention for AI to use
export function formatEntityMention(type: EntityType, id: number | string, name: string): string {
  return `@[${type}:${id}:${name}]`;
}

// Get route for entity type
export function getEntityRoute(type: EntityType, id: number | string): string {
  const routes: Record<EntityType, string> = {
    contact: `/dashboard/contacts/${id}`,
    task: `/dashboard/tasks/${id}`,
    offer: `/dashboard/offers/${id}`,
    job: `/dashboard/jobs/${id}`,
    dispatch: `/dashboard/dispatch/${id}`,
    article: `/dashboard/inventory/articles/${id}`,
    installation: `/dashboard/installations/${id}`,
  };
  
  return routes[type] || '/dashboard';
}

// Get icon name for entity type
export function getEntityIcon(type: EntityType): string {
  const icons: Record<EntityType, string> = {
    contact: 'User',
    task: 'CheckSquare',
    offer: 'FileText',
    job: 'Briefcase',
    dispatch: 'Truck',
    article: 'Package',
    installation: 'Building2',
  };
  
  return icons[type] || 'Link';
}

// Get color class for entity type
export function getEntityColor(type: EntityType): string {
  const colors: Record<EntityType, string> = {
    contact: 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-950 dark:hover:bg-blue-900',
    task: 'text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-950 dark:hover:bg-green-900',
    offer: 'text-purple-600 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-950 dark:hover:bg-purple-900',
    job: 'text-orange-600 bg-orange-50 hover:bg-orange-100 dark:text-orange-400 dark:bg-orange-950 dark:hover:bg-orange-900',
    dispatch: 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-950 dark:hover:bg-cyan-900',
    article: 'text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-950 dark:hover:bg-amber-900',
    installation: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950 dark:hover:bg-indigo-900',
  };
  
  return colors[type] || 'text-primary bg-primary/10 hover:bg-primary/20';
}
