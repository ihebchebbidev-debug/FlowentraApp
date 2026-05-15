import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, FileText, Globe, FolderOpen, Loader2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FormBuilder } from '../components/FormBuilder';
import { useCreateDynamicForm } from '../hooks/useDynamicForms';
import { useFormCategories } from '@/modules/lookups/hooks/useLookups';
import { FormField, CreateDynamicFormDto } from '../types';
import { usePermissions } from '@/hooks/usePermissions.tsx';
import { useToast } from '@/hooks/use-toast';
import { useActionLogger } from '@/hooks/useActionLogger';

export default function CreateFormPage() {
  const { t, i18n } = useTranslation('dynamic-forms');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateDynamicForm();
  const { items: categories, isLoading: loadingCategories } = useFormCategories();
  const { isMainAdmin, hasPermission, isLoading: permissionsLoading } = usePermissions();
  const { logButtonClick } = useActionLogger('DynamicForms');
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;
  
  // Permission check
  const canCreate = isMainAdmin || hasPermission('dynamic_forms', 'create');
  
  const [formData, setFormData] = useState<{
    name_en: string;
    name_fr: string;
    description_en: string;
    description_fr: string;
    category: string;
    fields: FormField[];
  }>({
    name_en: '',
    name_fr: '',
    description_en: '',
    description_fr: '',
    category: '',
    fields: [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Redirect if no create permission
  useEffect(() => {
    if (!permissionsLoading && !canCreate) {
      toast({
        title: t('common.access_denied', 'Access Denied'),
        description: t('common.no_create_permission', "You don't have permission to create forms."),
        variant: 'destructive',
      });
      navigate('/dashboard/settings/dynamic-forms', { replace: true });
    }
  }, [canCreate, permissionsLoading, navigate, toast, t]);
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name_en.trim()) {
      newErrors.name_en = t('validation.name_en_required');
    }
    if (!formData.name_fr.trim()) {
      newErrors.name_fr = t('validation.name_fr_required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validate()) return;
    
    const dto: CreateDynamicFormDto = {
      name_en: formData.name_en,
      name_fr: formData.name_fr,
      description_en: formData.description_en || undefined,
      description_fr: formData.description_fr || undefined,
      category: formData.category || undefined,
      fields: formData.fields,
    };
    
    try {
      const createdForm = await createMutation.mutateAsync(dto);
      // Navigate directly to the edit page so user can add fields in the builder
      navigate(`/dashboard/settings/dynamic-forms/${createdForm.id}/edit`);
    } catch (error: any) {
      // Error toast is handled by the mutation's onError callback
      // Just log for debugging - navigation won't happen on error
      console.error('Failed to create form:', error);
    }
  };
  
  const handleBack = () => {
    logButtonClick('Back', { entityType: 'DynamicForm' });
    navigate('/dashboard/settings/dynamic-forms');
  };

  // Get active categories sorted by sortOrder
  const activeCategories = categories
    .filter(cat => cat.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Auto-select category: default one or only one available
  useEffect(() => {
    if (!loadingCategories && activeCategories.length > 0 && !formData.category) {
      // First priority: select the default category
      const defaultCategory = activeCategories.find(cat => cat.isDefault);
      if (defaultCategory) {
        setFormData(prev => ({ ...prev, category: defaultCategory.value || defaultCategory.id }));
        return;
      }
      // Second priority: if only one category exists, select it
      if (activeCategories.length === 1) {
        setFormData(prev => ({ ...prev, category: activeCategories[0].value || activeCategories[0].id }));
      }
    }
  }, [loadingCategories, activeCategories, formData.category]);
  
  // Show loading or nothing while checking permissions
  if (permissionsLoading || !canCreate) {
    return null;
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('create.title')}</h1>
            <p className="text-[11px] text-muted-foreground">{t('create.subtitle')}</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="gradient-primary"
        >
          <Save className="h-4 w-4 mr-2" />
          {t('common.save')}
        </Button>
      </header>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Basic Information Section */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{t('create.basic_info')}</CardTitle>
                  <CardDescription className="text-xs">{t('create.basic_info_desc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* English Content */}
                <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium px-2 py-1 rounded bg-primary/10 text-primary">EN</span>
                    <span className="text-sm font-medium text-muted-foreground">{t('create.english_content')}</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_en" className="text-sm">{t('fields.name_en')} <span className="text-destructive">*</span></Label>
                    <Input
                      id="name_en"
                      value={formData.name_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                      placeholder={t('create.name_placeholder_en')}
                      className={`bg-background ${errors.name_en ? 'border-destructive' : ''}`}
                    />
                    {errors.name_en && (
                      <p className="text-xs text-destructive">{errors.name_en}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_en" className="text-sm">{t('fields.description_en')}</Label>
                    <Textarea
                      id="description_en"
                      value={formData.description_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                      placeholder={t('create.description_placeholder_en')}
                      rows={3}
                      className="bg-background resize-none"
                    />
                  </div>
                </div>
                
                {/* French Content */}
                <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium px-2 py-1 rounded bg-secondary text-secondary-foreground">FR</span>
                    <span className="text-sm font-medium text-muted-foreground">{t('create.french_content')}</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_fr" className="text-sm">{t('fields.name_fr')} <span className="text-destructive">*</span></Label>
                    <Input
                      id="name_fr"
                      value={formData.name_fr}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_fr: e.target.value }))}
                      placeholder={t('create.name_placeholder_fr')}
                      className={`bg-background ${errors.name_fr ? 'border-destructive' : ''}`}
                    />
                    {errors.name_fr && (
                      <p className="text-xs text-destructive">{errors.name_fr}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_fr" className="text-sm">{t('fields.description_fr')}</Label>
                    <Textarea
                      id="description_fr"
                      value={formData.description_fr}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_fr: e.target.value }))}
                      placeholder={t('create.description_placeholder_fr')}
                      rows={3}
                      className="bg-background resize-none"
                    />
                  </div>
                </div>
              </div>
              
              {/* Category */}
              <div className="mt-6 max-w-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="category" className="text-sm">{t('fields.category')}</Label>
                  </div>
                  <Link 
                    to={`/dashboard/lookups?tab=formCategories&returnUrl=${encodeURIComponent(currentPath)}`}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <Settings2 className="h-3 w-3" />
                    {t('common.manage', 'Manage')}
                  </Link>
                </div>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  disabled={loadingCategories}
                >
                  <SelectTrigger id="category" className="bg-background">
                    {loadingCategories ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-muted-foreground">{t('common.loading')}</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={t('create.select_category')} />
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {activeCategories.length > 0 ? (
                      activeCategories.map((category) => (
                        <SelectItem key={category.id} value={category.value || category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        {t('create.no_categories')}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Separator />
          
          {/* Form Builder Section */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t('builder.title')}</CardTitle>
                    <CardDescription className="text-xs">{t('builder.subtitle')}</CardDescription>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formData.fields.length} {t('builder.fields_count')}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <FormBuilder
                fields={formData.fields}
                onFieldsChange={(fields) => setFormData(prev => ({ ...prev, fields }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
