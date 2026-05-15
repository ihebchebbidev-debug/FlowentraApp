import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  Type, 
  AlignLeft, 
  Hash, 
  CheckSquare, 
  Circle, 
  ChevronDown, 
  Calendar, 
  Mail, 
  Phone, 
  LayoutList,
  GripVertical,
  PenTool,
  Star,
  FileStack,
  FileText
} from 'lucide-react';
import { FIELD_TYPES, FieldType } from '../../types';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  AlignLeft,
  Hash,
  CheckSquare,
  Circle,
  ChevronDown,
  Calendar,
  Mail,
  Phone,
  LayoutList,
  PenTool,
  Star,
  FileStack,
  FileText,
};

interface DraggableFieldProps {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
}

function DraggableField({ type, label, icon, description }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      type,
      fromPalette: true,
    },
  });
  
  const Icon = ICONS[icon] || Type;
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-border bg-background hover:bg-accent/50 cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md"
    >
      <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{description}</p>
      </div>
      <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
    </div>
  );
}

export function FieldPalette() {
  const { t, i18n } = useTranslation('dynamic-forms');
  const isEnglish = i18n.language === 'en';
  
  // Group field types
  const basicFields = FIELD_TYPES.filter(f => ['text', 'textarea', 'number', 'email', 'phone'].includes(f.type));
  const choiceFields = FIELD_TYPES.filter(f => ['checkbox', 'radio', 'select'].includes(f.type));
  const advancedFields = FIELD_TYPES.filter(f => ['date', 'section', 'signature', 'rating', 'content'].includes(f.type));
  const layoutFields = FIELD_TYPES.filter(f => ['page_break'].includes(f.type));
  
  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {t('builder.field_palette')}
        </h3>
        <p className="text-[11px] text-muted-foreground">
          {t('builder.drag_hint')}
        </p>
      </div>
      
      {/* Basic Fields */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t('builder.basic_fields')}
        </p>
        <div className="space-y-1.5">
          {basicFields.map((field) => (
            <DraggableField
              key={field.type}
              type={field.type}
              label={isEnglish ? field.label_en : field.label_fr}
              icon={field.icon}
              description={t(`field_types.${field.type}_desc`)}
            />
          ))}
        </div>
      </div>
      
      {/* Choice Fields */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t('builder.choice_fields')}
        </p>
        <div className="space-y-1.5">
          {choiceFields.map((field) => (
            <DraggableField
              key={field.type}
              type={field.type}
              label={isEnglish ? field.label_en : field.label_fr}
              icon={field.icon}
              description={t(`field_types.${field.type}_desc`)}
            />
          ))}
        </div>
      </div>
      
      {/* Advanced Fields */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t('builder.advanced_fields')}
        </p>
        <div className="space-y-1.5">
          {advancedFields.map((field) => (
            <DraggableField
              key={field.type}
              type={field.type}
              label={isEnglish ? field.label_en : field.label_fr}
              icon={field.icon}
              description={t(`field_types.${field.type}_desc`)}
            />
          ))}
        </div>
      </div>
      
      {/* Layout Fields */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t('builder.layout_fields')}
        </p>
        <div className="space-y-1.5">
          {layoutFields.map((field) => (
            <DraggableField
              key={field.type}
              type={field.type}
              label={isEnglish ? field.label_en : field.label_fr}
              icon={field.icon}
              description={t(`field_types.${field.type}_desc`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
