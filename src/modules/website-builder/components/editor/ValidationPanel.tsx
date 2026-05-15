import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BuilderComponent } from '../../types';
import { validatePage, ValidationIssue, getIssueCounts } from '../../utils/componentValidation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ChevronRight } from 'lucide-react';

interface ValidationPanelProps {
  components: BuilderComponent[];
  onSelectComponent: (id: string) => void;
}


export function ValidationPanel({ components, onSelectComponent }: ValidationPanelProps) {
  const { t } = useTranslation();
  const { componentIssues, pageIssues } = useMemo(() => validatePage(components), [components]);

  const allIssues: Array<{ issue: ValidationIssue; componentId?: string; componentLabel?: string }> = [];

  pageIssues.forEach(issue => allIssues.push({ issue }));

  componentIssues.forEach((issues, compId) => {
    const comp = components.find(c => c.id === compId);
    issues.forEach(issue => allIssues.push({ issue, componentId: compId, componentLabel: comp?.label }));
  });

  const counts = getIssueCounts(allIssues.map(i => i.issue));
  const totalIssues = allIssues.length;

  const SEVERITY_CONFIG = {
    error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', label: t('wb:validation.error') },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', label: t('wb:validation.warning') },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', label: t('wb:validation.tip') },
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {t('wb:validation.validation')}
          </h3>
          {totalIssues === 0 ? (
            <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {t('wb:validation.allClear')}
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              {counts.errors > 0 && (
                <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">
                  {counts.errors} {t('wb:validation.error').toLowerCase()}{counts.errors > 1 ? 's' : ''}
                </span>
              )}
              {counts.warnings > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
                  {counts.warnings}
                </span>
              )}
              {counts.infos > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                  {counts.infos}
                </span>
              )}
            </div>
          )}
        </div>

        {totalIssues === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('wb:validation.pageLooksGreat')}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{t('wb:validation.noIssuesDetected')}</p>
          </div>
        )}

        <div className="space-y-2">
          {allIssues.map((item, i) => {
            const cfg = SEVERITY_CONFIG[item.issue.severity];
            const Icon = cfg.icon;
            return (
              <button
                key={i}
                onClick={() => item.componentId && onSelectComponent(item.componentId)}
                className={`w-full text-left p-2.5 rounded-lg border ${cfg.border} ${cfg.bg} transition-all hover:shadow-sm ${item.componentId ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{cfg.label}</span>
                      {item.componentLabel && (
                        <>
                          <span className="text-[10px] opacity-30">·</span>
                          <span className="text-[10px] font-medium text-foreground/70 truncate">{item.componentLabel}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs font-medium mt-0.5">{item.issue.message}</p>
                    {item.issue.suggestion && (
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{item.issue.suggestion}</p>
                    )}
                  </div>
                  {item.componentId && <ChevronRight className="h-3 w-3 shrink-0 mt-1 opacity-30" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
