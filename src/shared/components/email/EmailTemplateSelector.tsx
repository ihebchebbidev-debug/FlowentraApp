import { useTranslation } from 'react-i18next';
import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  EMAIL_TEMPLATES,
  type EmailTemplateDefinition,
  type DocumentType,
  getSavedTemplateId,
  saveDefaultTemplateId,
} from './emailTemplateDefinitions';

interface EmailTemplateSelectorProps {
  documentType: DocumentType;
  selectedId: string;
  onSelect: (id: string) => void;
}

const typeAccents: Record<DocumentType, string> = {
  offer: 'bg-foreground',
  sale: 'bg-foreground',
  serviceOrder: 'bg-foreground',
  dispatch: 'bg-foreground',
};

export function EmailTemplateSelector({ documentType, selectedId, onSelect }: EmailTemplateSelectorProps) {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith('en');
  const defaultId = getSavedTemplateId(documentType);

  const handleSetDefault = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    saveDefaultTemplateId(documentType, templateId);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {en ? 'Email Template' : 'Modèle d\'e-mail'}
        </span>
        <Badge variant="outline" className="text-[10px]">
          {EMAIL_TEMPLATES.length} {en ? 'templates' : 'modèles'}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {EMAIL_TEMPLATES.map((tpl) => (
          <TemplateCard
            key={tpl.id}
            template={tpl}
            isSelected={selectedId === tpl.id}
            isDefault={defaultId === tpl.id}
            accentClass={typeAccents[documentType]}
            en={en}
            onSelect={() => onSelect(tpl.id)}
            onSetDefault={(e) => handleSetDefault(e, tpl.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  isSelected,
  isDefault,
  accentClass,
  en,
  onSelect,
  onSetDefault,
}: {
  template: EmailTemplateDefinition;
  isSelected: boolean;
  isDefault: boolean;
  accentClass: string;
  en: boolean;
  onSelect: () => void;
  onSetDefault: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-center transition-all duration-150',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm'
          : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'
      )}
    >
      {/* Mini preview bars */}
      <div className="w-full h-10 rounded-md overflow-hidden bg-muted/50 flex flex-col">
        <div className={cn('h-3 w-full', accentClass)} />
        <div className="flex-1 p-1 space-y-0.5">
          <div className="h-1 w-3/4 bg-muted-foreground/15 rounded-full" />
          <div className="h-1 w-1/2 bg-muted-foreground/10 rounded-full" />
        </div>
      </div>

      <span className="text-[10px] font-medium text-foreground leading-tight line-clamp-1">
        {en ? template.nameEn : template.nameFr}
      </span>

      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      )}

      {isDefault && (
        <div className="absolute -top-1 -left-1">
          <Star className="h-3 w-3 text-warning fill-warning" />
        </div>
      )}

      {isSelected && !isDefault && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-muted border border-border/60"
                onClick={onSetDefault}
              >
                <Star className="h-2.5 w-2.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {en ? 'Set as default' : 'Définir par défaut'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </button>
  );
}
