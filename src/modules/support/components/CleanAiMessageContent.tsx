import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { parseEntityLinks, TextSegment } from '../utils/entityLinkParser';
import { EntityLink } from './EntityLink';

interface CleanAiMessageContentProps {
  content: string;
  className?: string;
  hideFormJson?: boolean;
}

/**
 * Removes JSON code blocks from content when a form was detected
 * More aggressive cleaning to ensure no JSON leaks to UI
 */
function cleanFormJsonFromContent(content: string): string {
  let cleaned = content;
  
  // 1. Remove hidden JSON blocks (main pattern) - handle multiline
  cleaned = cleaned.replace(/<!--\s*FORM_JSON_START\s*-->[\s\S]*?<!--\s*FORM_JSON_END\s*-->/gi, '');
  
  // 2. Remove partial/incomplete hidden blocks (streaming might show partial)
  cleaned = cleaned.replace(/<!--\s*FORM_JSON_START\s*-->[\s\S]*/gi, '');
  cleaned = cleaned.replace(/[\s\S]*<!--\s*FORM_JSON_END\s*-->/gi, '');
  
  // 3. Remove any remaining HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/gi, '');
  cleaned = cleaned.replace(/<!--[^>]*/gi, ''); // Incomplete comments
  
  // 4. Remove JSON code blocks (```json ... ```)
  cleaned = cleaned.replace(/```(?:json)?\s*[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```(?:json)?[^`]*/gi, ''); // Incomplete code blocks
  
  // 5. Remove standalone JSON objects with form-like keys
  cleaned = cleaned.replace(/\{[^{}]*"(?:name_en|name_fr|fields|label_en|label_fr|description_en|description_fr|category)"[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gi, '');
  
  // 6. Remove any JSON-like structures with nested brackets
  cleaned = cleaned.replace(/\{\s*"[^"]+"\s*:\s*(?:"[^"]*"|true|false|null|\d+|\[[\s\S]*?\]|\{[\s\S]*?\})[\s\S]*?\}/g, '');
  
  // 7. Remove lines that look like JSON fragments
  cleaned = cleaned.replace(/^\s*[\{\}\[\]]\s*$/gm, '');
  cleaned = cleaned.replace(/^\s*"[^"]+"\s*:\s*.*/gm, '');
  
  // 8. Clean up whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/^\s+|\s+$/g, '');
  
  // 9. Remove trailing separators
  cleaned = cleaned.replace(/---\s*$/g, '');
  
  return cleaned.trim();
}

export function CleanAiMessageContent({ content, className, hideFormJson }: CleanAiMessageContentProps) {
  const { t } = useTranslation('aiAssistant');
  
  // Clean content if we're hiding form JSON
  const displayContent = hideFormJson ? cleanFormJsonFromContent(content) : content;
  
  // If content is empty after cleaning, show a translated message
  if (!displayContent || displayContent.length < 10) {
    return (
      <div className={`text-sm ${className || ''}`}>
        <p className="text-muted-foreground italic">{t('formStructureReady')}</p>
      </div>
    );
  }
  
  const segments = parseEntityLinks(displayContent);
  const hasEntities = segments.some(s => s.type === 'entity');
  
  if (!hasEntities) {
    return (
      <div className={`text-sm min-w-0 max-w-full overflow-hidden ${className || ''}`}>
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 break-words [word-break:break-word]">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 break-words">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 break-words">{children}</ol>,
              li: ({ children }) => <li className="mb-0.5 break-words">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              code: ({ children, className }) => {
                // Hide code blocks that look like JSON (form data)
                const isCodeBlock = className?.includes('language-');
                if (isCodeBlock && hideFormJson) {
                  return null;
                }
                return (
                  <code 
                    className="bg-muted px-1 py-0.5 rounded text-xs"
                    style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => {
                // Skip pre blocks if they might contain form JSON
                if (hideFormJson) {
                  const childText = React.Children.toArray(children)
                    .map(c => typeof c === 'string' ? c : '')
                    .join('');
                  if (childText.includes('"fields"') || childText.includes('"name_en"')) {
                    return null;
                  }
                }
                return (
                  <pre 
                    className="bg-muted p-2 rounded-md overflow-x-auto mb-2 text-xs"
                    style={{ maxWidth: '100%' }}
                  >
                    {children}
                  </pre>
                );
              },
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                  style={{ wordBreak: 'break-all' }}
                >
                  {children}
                </a>
              ),
              h1: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
              h2: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
              h3: ({ children }) => <h5 className="text-sm font-medium mt-2 mb-1">{children}</h5>,
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
  
  // Has entities, render with entity links
  return (
    <div className={`text-sm min-w-0 max-w-full overflow-hidden break-words [word-break:break-word] ${className || ''}`}>
      {segments.map((segment, index) => (
        <RenderSegment key={index} segment={segment} hideFormJson={hideFormJson} />
      ))}
    </div>
  );
}

function RenderSegment({ segment, hideFormJson }: { segment: TextSegment; hideFormJson?: boolean }) {
  if (segment.type === 'entity' && segment.entity) {
    return <EntityLink entity={segment.entity} />;
  }
  
  const displayContent = hideFormJson ? cleanFormJsonFromContent(segment.content) : segment.content;
  
  if (!displayContent.trim()) {
    return null;
  }
  
  return (
    <span className="prose prose-sm dark:prose-invert max-w-none inline">
      <ReactMarkdown
        components={{
          p: ({ children }) => <span>{children}</span>,
          ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 my-1">{children}</ol>,
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>
          ),
          pre: () => null, // Hide pre blocks in inline rendering
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </span>
  );
}

export default CleanAiMessageContent;
