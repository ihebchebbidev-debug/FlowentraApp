import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { FieldPalette } from './FieldPalette';
import { FormCanvas } from './FormCanvas';
import { FieldProperties } from './FieldProperties';
import { FormField, FieldType, FIELD_TYPES } from '../../types';

interface FormBuilderProps {
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
  formName?: string;
  formDescription?: string;
}

export function FormBuilder({ fields, onFieldsChange, formName, formDescription }: FormBuilderProps) {
  const { t, i18n } = useTranslation('dynamic-forms');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
  
  const selectedField = fields.find(f => f.id === selectedFieldId) || null;
  const isEnglish = i18n.language === 'en';
  
  const createNewField = (type: FieldType): FormField => {
    const config = FIELD_TYPES.find(f => f.type === type);
    return {
      id: `field_${Date.now()}`,
      type,
      label_en: config?.label_en || 'New Field',
      label_fr: config?.label_fr || 'Nouveau Champ',
      required: false,
      order: fields.length,
      ...(config?.defaultProps || {}),
    };
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    // Check if dragged from palette
    if (active.data.current?.fromPalette) {
      const fieldType = active.data.current.type as FieldType;
      const newField = createNewField(fieldType);
      
      if (over.id === 'form-canvas') {
        // Add to end
        onFieldsChange([...fields, newField]);
      } else {
        // Insert before the target field
        const targetIndex = fields.findIndex(f => f.id === over.id);
        if (targetIndex !== -1) {
          const newFields = [...fields];
          newFields.splice(targetIndex, 0, newField);
          onFieldsChange(newFields);
        } else {
          onFieldsChange([...fields, newField]);
        }
      }
      setSelectedFieldId(newField.id);
    } else {
      // Reordering existing fields
      if (active.id !== over.id) {
        const oldIndex = fields.findIndex(f => f.id === active.id);
        const newIndex = fields.findIndex(f => f.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newFields = arrayMove(fields, oldIndex, newIndex).map((f, idx) => ({
            ...f,
            order: idx,
          }));
          onFieldsChange(newFields);
        }
      }
    }
  }, [fields, onFieldsChange]);
  
  const handleRemoveField = useCallback((id: string) => {
    onFieldsChange(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  }, [fields, onFieldsChange, selectedFieldId]);
  
  const handleDuplicateField = useCallback((id: string) => {
    const fieldToDuplicate = fields.find(f => f.id === id);
    if (!fieldToDuplicate) return;
    
    const newField: FormField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}`,
      label_en: `${fieldToDuplicate.label_en} (${t('builder.copy')})`,
      label_fr: `${fieldToDuplicate.label_fr} (${t('builder.copy')})`,
      order: fields.length,
    };
    
    const fieldIndex = fields.findIndex(f => f.id === id);
    const newFields = [...fields];
    newFields.splice(fieldIndex + 1, 0, newField);
    onFieldsChange(newFields);
    setSelectedFieldId(newField.id);
  }, [fields, onFieldsChange, t]);
  
  const handleUpdateField = useCallback((updates: Partial<FormField>) => {
    if (!selectedFieldId) return;
    
    onFieldsChange(
      fields.map(f => 
        f.id === selectedFieldId ? { ...f, ...updates } : f
      )
    );
  }, [fields, onFieldsChange, selectedFieldId]);
  
  // Get the dragging field info for overlay
  const getDraggedFieldInfo = () => {
    if (!activeId) return null;
    
    if (activeId.startsWith('palette-')) {
      const type = activeId.replace('palette-', '') as FieldType;
      const config = FIELD_TYPES.find(f => f.type === type);
      return config ? (isEnglish ? config.label_en : config.label_fr) : null;
    }
    
    const field = fields.find(f => f.id === activeId);
    return field ? (isEnglish ? field.label_en : field.label_fr) : null;
  };
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="border-t border-border">
        <div className="grid grid-cols-12 min-h-[600px]">
          {/* Field Palette */}
          <div className="col-span-3 border-r border-border bg-muted/30 overflow-y-auto">
            <FieldPalette />
          </div>
          
          {/* Form Canvas - Expands when no field selected */}
          <div className={`border-r border-border bg-muted/10 overflow-y-auto transition-all duration-300 ${
            selectedFieldId ? 'col-span-5' : 'col-span-9'
          }`}>
            <FormCanvas
              fields={fields}
              selectedFieldId={selectedFieldId}
              onSelectField={setSelectedFieldId}
              onRemoveField={handleRemoveField}
              onDuplicateField={handleDuplicateField}
              formName={formName}
              formDescription={formDescription}
            />
          </div>
          
          {/* Field Properties - Only visible when field selected */}
          <div className={`bg-muted/20 overflow-y-auto transition-all duration-300 ${
            selectedFieldId ? 'col-span-4 opacity-100' : 'col-span-0 w-0 opacity-0 overflow-hidden'
          }`}>
            {selectedFieldId && (
              <FieldProperties
                field={selectedField}
                allFields={fields}
                onUpdate={handleUpdateField}
              />
            )}
          </div>
        </div>
      </div>
      
      <DragOverlay>
        {activeId && (
          <div className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg text-sm font-medium">
            {getDraggedFieldInfo()}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export { FieldPalette } from './FieldPalette';
export { FormCanvas } from './FormCanvas';
export { FieldProperties } from './FieldProperties';
export { SignatureCanvas } from './SignatureCanvas';
export { RatingInput } from './RatingInput';
