import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface AiThinkingIndicatorProps {
  isAnalyzingImage?: boolean;
  className?: string;
}

export function AiThinkingIndicator({ isAnalyzingImage, className }: AiThinkingIndicatorProps) {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(prev => prev + 1), 800);
    return () => clearInterval(interval);
  }, []);

  // Quick cycling label for responsiveness feel
  const label = isAnalyzingImage
    ? (isFr ? 'Analyse de l\'image' : 'Analyzing image')
    : elapsed < 2
      ? (isFr ? 'Connexion à l\'IA' : 'Connecting to AI')
      : elapsed < 5
        ? (isFr ? 'L\'IA réfléchit' : 'AI is thinking')
        : (isFr ? 'Génération de la réponse' : 'Generating response');

  return (
    <div className={cn('flex items-center gap-2.5 py-1', className)}>
      {/* Bouncing dots — feels instant and alive */}
      <div className="flex items-center gap-[3px]">
        <span className="ai-dot h-[6px] w-[6px] rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
        <span className="ai-dot h-[6px] w-[6px] rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
        <span className="ai-dot h-[6px] w-[6px] rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Label */}
      <span
        key={label}
        className="text-sm text-muted-foreground animate-fade-in"
      >
        {label}
      </span>

      {/* Image badge */}
      {isAnalyzingImage && (
        <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          + image
        </span>
      )}

      <style>{`
        @keyframes ai-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        .ai-dot {
          animation: ai-bounce 0.9s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default AiThinkingIndicator;
