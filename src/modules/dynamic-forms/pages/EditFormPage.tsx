import { useState, useEffect } from 'react';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useNavigate, useParams, useSearchParams, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, FolderOpen, Loader2, Settings, FileText, Settings2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormBuilder } from '../components/FormBuilder';
import { ThankYouSettings } from '../components/ThankYouSettings';
import { useDynamicForm, useUpdateDynamicForm } from '../hooks/useDynamicForms';
import { useFormCategories } from '@/modules/lookups/hooks/useLookups';
import { FormField, UpdateDynamicFormDto, ThankYouSettings as ThankYouSettingsType } from '../types';
import { usePermissions } from '@/hooks/usePermissions.tsx';
import { useToast } from '@/hooks/use-toast';
import { useActionLogger } from '@/hooks/useActionLogger';

export default function EditFormPage() {
  const { t, i18n } = useTranslation('dynamic-forms');
  const isEnglish = i18n.language === 'en';
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const formId = id ? parseInt(id) : undefined;
  const { isMainAdmin, hasPermission, isLoading: permissionsLoading } = usePermissions();
  const { logButtonClick } = useActionLogger('DynamicForms');
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;
  
  // Default to info tab (first step), or use URL param if specified
  const initialTab = searchParams.get('tab') || 'info';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Permission check
  const canEdit = isMainAdmin || hasPermission('dynamic_forms', 'update');
  
  const { data: form, isLoading } = useDynamicForm(formId);
  const updateMutation = useUpdateDynamicForm();
  const { items: categories, isLoading: loadingCategories } = useFormCategories();
  
  // Get active categories sorted by sortOrder
  const activeCategories = categories
    .filter(cat => cat.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  
  const [formData, setFormData] = useState<{
    name_en: string;
    name_fr: string;
    description_en: string;
    description_fr: string;
    category: string;
    fields: FormField[];
    thank_you_settings: ThankYouSettingsType;
  }>({
    name_en: '',
    name_fr: '',
    description_en: '',
    description_fr: '',
    category: '',
    fields: [],
    thank_you_settings: {
      default_message: {
        title_en: 'Thank You!',
        title_fr: 'Merci !',
        message_en: 'Your response has been recorded.',
        message_fr: 'Votre réponse a été enregistrée.',
        enable_redirect: false,
        redirect_url: '',
        redirect_delay: 3,
      },
      rules: [],
    },
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Redirect if no edit permission
  useEffect(() => {
    if (!permissionsLoading && !canEdit) {
      toast({
        title: t('common.access_denied'),
        description: t('common.no_edit_permission'),
        variant: 'destructive',
      });
      navigate('/dashboard/settings/dynamic-forms', { replace: true });
    }
  }, [canEdit, permissionsLoading, navigate, toast, t]);
  
  // Redirect if form is released (cannot edit released forms)
  useEffect(() => {
    if (form && form.status !== 'draft') {
      toast({
        title: t('common.access_denied'),
        description: t('common.form_released_no_edit'),
        variant: 'destructive',
      });
      navigate(`/dashboard/settings/dynamic-forms/${formId}/preview`, { replace: true });
    }
  }, [form, formId, navigate, toast, t]);
  
  useEffect(() => {
    if (form) {
      setFormData({
        name_en: form.name_en,
        name_fr: form.name_fr,
        description_en: form.description_en || '',
        description_fr: form.description_fr || '',
        category: form.category || '',
        fields: form.fields,
        thank_you_settings: form.thank_you_settings || {
          default_message: {
            title_en: 'Thank You!',
            title_fr: 'Merci !',
            message_en: 'Your response has been recorded.',
            message_fr: 'Votre réponse a été enregistrée.',
            enable_redirect: false,
            redirect_url: '',
            redirect_delay: 3,
          },
          rules: [],
        },
      });
    }
  }, [form]);
  
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
    if (!formId || !validate()) {
      // If validation fails, switch to basic info tab to show errors
      if (!formData.name_en.trim() || !formData.name_fr.trim()) {
        setActiveTab('info');
      }
      return;
    }
    
    const dto: UpdateDynamicFormDto = {
      id: formId,
      name_en: formData.name_en,
      name_fr: formData.name_fr,
      description_en: formData.description_en || undefined,
      description_fr: formData.description_fr || undefined,
      category: formData.category || undefined,
      fields: formData.fields,
      thank_you_settings: formData.thank_you_settings,
    };
    
    await updateMutation.mutateAsync(dto);
    navigate('/dashboard/settings/dynamic-forms');
  };
  
  const handleBack = () => {
    logButtonClick('Back', { entityType: 'DynamicForm', entityId: formId });
    navigate('/dashboard/settings/dynamic-forms');
  };
  
  // Show loading while checking permissions
  if (permissionsLoading || !canEdit) {
    return null;
  }
  
  if (isLoading) {
    return <PageSkeleton />;
  }
  
  if (!form) {
    return (
      <div className="flex items-center justify-center p-12">
        <p>{t('responses.form_not_found')}</p>
      </div>
    );
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
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('edit.title')}</h1>
            <p className="text-[11px] text-muted-foreground">{form.name_en || form.name_fr}</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="gradient-primary"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('common.save')}
        </Button>
      </header>
      
      {/* Content with Tabs */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full max-w-lg mb-6 ${form.is_public ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="info" className="gap-2">
                <Settings className="h-4 w-4" />
                {t('create.basic_info')}
              </TabsTrigger>
              <TabsTrigger value="builder" className="gap-2">
                <FileText className="h-4 w-4" />
                {t('builder.title')}
              </TabsTrigger>
              {form.is_public && (
                <TabsTrigger value="thankyou" className="gap-2">
                  <Gift className="h-4 w-4" />
                  {t('thank_you.title')}
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* Form Builder Tab */}
            <TabsContent value="builder" className="mt-0">
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
                    formName={isEnglish ? formData.name_en : formData.name_fr}
                    formDescription={isEnglish ? formData.description_en : formData.description_fr}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Basic Information Tab */}
            <TabsContent value="info" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Settings className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t('create.basic_info')}</CardTitle>
                      <CardDescription className="text-xs">{t('create.basic_info_desc')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="en" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-xs">
                      <TabsTrigger value="en">{t('languages.english')}</TabsTrigger>
                      <TabsTrigger value="fr">{t('languages.french')}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="en" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name_en">{t('fields.name_en')} <span className="text-destructive">*</span></Label>
                        <Input
                          id="name_en"
                          value={formData.name_en}
                          onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                          className={errors.name_en ? 'border-destructive' : ''}
                        />
                        {errors.name_en && (
                          <p className="text-xs text-destructive">{errors.name_en}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_en">{t('fields.description_en')}</Label>
                        <Textarea
                          id="description_en"
                          value={formData.description_en}
                          onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="fr" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name_fr">{t('fields.name_fr')} <span className="text-destructive">*</span></Label>
                        <Input
                          id="name_fr"
                          value={formData.name_fr}
                          onChange={(e) => setFormData(prev => ({ ...prev, name_fr: e.target.value }))}
                          className={errors.name_fr ? 'border-destructive' : ''}
                        />
                        {errors.name_fr && (
                          <p className="text-xs text-destructive">{errors.name_fr}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_fr">{t('fields.description_fr')}</Label>
                        <Textarea
                          id="description_fr"
                          value={formData.description_fr}
                          onChange={(e) => setFormData(prev => ({ ...prev, description_fr: e.target.value }))}
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-6 max-w-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="category">{t('fields.category')}</Label>
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
                          <SelectValue placeholder={t('filters.category')} />
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
            </TabsContent>
            
            {/* Thank You Page Tab - Only for public forms */}
            {form.is_public && (
              <TabsContent value="thankyou" className="mt-0">
                <ThankYouSettings
                  settings={formData.thank_you_settings}
                  fields={formData.fields}
                  onChange={(settings) => setFormData(prev => ({ ...prev, thank_you_settings: settings }))}
                />
              </TabsContent>
            )}
            
          </Tabs>
        </div>
      </div>
    </div>
  );
}
