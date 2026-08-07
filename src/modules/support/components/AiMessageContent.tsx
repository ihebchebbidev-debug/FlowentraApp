import React from 'react';
import ReactMarkdown from 'react-markdown';
import { parseEntityLinks, TextSegment } from '../utils/entityLinkParser';
import { EntityLink } from './EntityLink';

interface AiMessageContentProps {
  content: string;
  className?: string;
}

export function AiMessageContent({ content, className }: AiMessageContentProps) {
  const segments = parseEntityLinks(content);
  
  // Check if we have any entities
  const hasEntities = segments.some(s => s.type === 'entity');
  
  if (!hasEntities) {
    // No entities, render as markdown
    return (
      <div className={className} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0" style={{ wordBreak: 'break-word' }}>{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1" style={{ wordBreak: 'break-word' }}>{children}</li>,
              code: ({ children }) => (
                <code className="bg-muted px-1 py-0.5 rounded text-sm" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{children}</code>
              ),
              pre: ({ children }) => (
                <pre className="bg-muted p-2 rounded-md overflow-x-auto mb-2" style={{ maxWidth: '100%' }}>{children}</pre>
              ),
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
              table: ({ children }) => (
                <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
  
  // Has entities, render with entity links
  return (
    <div className={className} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      {segments.map((segment, index) => (
        <RenderSegment key={index} segment={segment} />
      ))}
    </div>
  );
}

function RenderSegment({ segment }: { segment: TextSegment }) {
  if (segment.type === 'entity' && segment.entity) {
    return <EntityLink entity={segment.entity} />;
  }
  
  // For text segments, render as markdown but inline
  return (
    <span className="prose prose-sm dark:prose-invert max-w-none inline" style={{ wordBreak: 'break-word' }}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <span>{children}</span>,
          ul: ({ children }) => <ul className="list-disc pl-4 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 my-2">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 rounded text-sm" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-muted p-2 rounded-md overflow-x-auto my-2" style={{ maxWidth: '100%' }}>{children}</pre>
          ),
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
        }}
      >
        {segment.content}
      </ReactMarkdown>
    </span>
  );
}

export default AiMessageContent;
