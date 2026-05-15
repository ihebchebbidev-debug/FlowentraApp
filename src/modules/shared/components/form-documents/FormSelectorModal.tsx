import { useState, useEffect } from 'react';
import { ListSkeleton } from '@/components/ui/page-skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { DynamicForm } from '@/modules/dynamic-forms/types';
import { dynamicFormsService } from '@/modules/dynamic-forms/services/dynamicFormsService';
import { cn } from '@/lib/utils';

const translations = {
  en: {
    select_form: 'Select Form Template',
    select_form_description: 'Choose a released form template to attach to this record',
    search_forms: 'Search forms...',
    no_forms_available: 'No forms available',
    no_forms_hint: 'Release a form in the Dynamic Forms module first',
    fields: 'fields',
    use_form: 'Use This Form',
    cancel: 'Cancel',
  },
  fr: {
    select_form: 'Sélectionner un Modèle',
    select_form_description: 'Choisissez un modèle de formulaire publié à joindre',
    search_forms: 'Rechercher des formulaires...',
    no_forms_available: 'Aucun formulaire disponible',
    no_forms_hint: 'Publiez d\'abord un formulaire dans le module Formulaires Dynamiques',
    fields: 'champs',
    use_form: 'Utiliser ce Formulaire',
    cancel: 'Annuler',
  },
};

interface FormSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectForm: (form: DynamicForm) => void;
  language: 'en' | 'fr';
}

export function FormSelectorModal({
  open,
  onOpenChange,
  onSelectForm,
  language,
}: FormSelectorModalProps) {
  const t = translations[language];
  const [forms, setForms] = useState<DynamicForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      loadForms();
    }
  }, [open]);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await dynamicFormsService.getAll({ status: 'released' });
      setForms(data);
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredForms = forms.filter(form => {
    const name = language === 'en' ? form.name_en : form.name_fr;
    const description = language === 'en' ? form.description_en : form.description_fr;
    const query = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      (description?.toLowerCase().includes(query) ?? false) ||
      (form.category?.toLowerCase().includes(query) ?? false)
    );
  });

  const handleSelect = () => {
    const selectedForm = forms.find(f => f.id === selectedFormId);
    if (selectedForm) {
      onSelectForm(selectedForm);
      onOpenChange(false);
      setSelectedFormId(null);
      setSearchQuery('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.select_form}
          </DialogTitle>
          <DialogDescription>
            {t.select_form_description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.search_forms}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[400px] border rounded-lg">
            {loading ? (
              <ListSkeleton rows={4} />
            ) : filteredForms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-2 opacity-50" />
                <p>{t.no_forms_available}</p>
                <p className="text-sm">{t.no_forms_hint}</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredForms.map((form) => {
                  const name = language === 'en' ? form.name_en : form.name_fr;
                  const description = language === 'en' ? form.description_en : form.description_fr;
                  const isSelected = selectedFormId === form.id;

                  return (
                    <div
                      key={form.id}
                      onClick={() => setSelectedFormId(form.id)}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground truncate">
                              {name}
                            </h4>
                            {form.category && (
                              <Badge variant="outline" className="text-xs">
                                {form.category}
                              </Badge>
                            )}
                          </div>
                          {description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {form.fields.length} {t.fields} • v{form.version}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSelect} disabled={!selectedFormId}>
              {t.use_form}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
