import React, { useState, useRef, useEffect } from 'react';
import { useLayoutModeContext } from '@/hooks/useLayoutMode';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronRight, ListChecks, Calendar, Folder, Flag, Package, MapPin, Clock, Coins, Tag, Megaphone, Wrench, DollarSign, FolderKanban, FileText, ArrowLeft } from 'lucide-react';
import { LookupTable } from '../components/LookupTable';
import { 
  useTaskStatuses, 
  // useEventTypes, // Commented out - not needed for now 
  useServiceCategories, 
  usePriorities, 
  useArticleCategories,
  useLocations,
  useArticleGroups,
  useLeaveTypes,
  // useCurrencies, // Commented out - not needed for now
  useOfferCategories,
  useOfferSources,
  // useInstallationTypes, // Commented out - using hardcoded External/Internal
  useInstallationCategories,
  useWorkTypes,
  useExpenseTypes,
  useProjectTypes,
  useFormCategories,
  useDocumentTypes
} from '../hooks/useLookups';
import { cn } from '@/lib/utils';

export default function LookupsPage() {
  const { t } = useTranslation('lookups');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedLookup, setSelectedLookup] = useState<string | null>(null);
  const { isMobile } = useLayoutModeContext();
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Get returnUrl from query params for back navigation
  const returnUrl = searchParams.get('returnUrl');
  
  // Map tab parameter to lookup id for auto-selection
  const tabToLookupMap: Record<string, string> = {
    'offerCategories': 'offer-categories',
    'offerSources': 'offer-sources',
    'articleCategories': 'article-categories',
    'locations': 'locations',
    'articleGroups': 'article-groups',
    'taskStatuses': 'task-statuses',
    'serviceCategories': 'service-categories',
    'priorities': 'priorities',
    'leaveTypes': 'leave-types',
    'installationCategories': 'installation-categories',
    'workTypes': 'work-types',
    'expenseTypes': 'expense-types',
    'projectTypes': 'project-types',
    'formCategories': 'form-categories',
    'documentTypes': 'document-types',
    'salesCategories': 'offer-categories', // Sales uses same categories
    'salesSources': 'offer-sources', // Sales uses same sources
  };
  
  // Auto-select lookup based on tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabToLookupMap[tab]) {
      setSelectedLookup(tabToLookupMap[tab]);
    }
  }, [searchParams]);

  // Handle lookup selection with auto-scroll on mobile
  const handleLookupSelect = (lookupId: string) => {
    setSelectedLookup(lookupId);
    
    // On mobile, scroll to the content section after selection
    if (isMobile) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };
  
  // Handle back navigation
  const handleGoBack = () => {
    if (returnUrl) {
      navigate(returnUrl);
    }
  };

  // Hook calls
  const taskStatuses = useTaskStatuses();
  // const eventTypes = useEventTypes(); // Commented out - not needed for now
  const serviceCategories = useServiceCategories();
  const priorities = usePriorities();
  const articleCategories = useArticleCategories();
  const locations = useLocations();
  const articleGroups = useArticleGroups();
  const leaveTypes = useLeaveTypes();
  // const currencies = useCurrencies(); // Commented out - not needed for now
  const offerCategories = useOfferCategories();
  const offerSources = useOfferSources();
  // const installationTypes = useInstallationTypes(); // Commented out - using hardcoded External/Internal
  const installationCategories = useInstallationCategories();
  const workTypes = useWorkTypes();
  const expenseTypes = useExpenseTypes();
  const projectTypes = useProjectTypes();
  const formCategories = useFormCategories();
  const documentTypes = useDocumentTypes();

  const lookupTypes = [
    {
      id: 'task-statuses',
      label: t('taskStatusTypes'),
      description: t('selectLookup'),
      icon: ListChecks,
      hook: taskStatuses,
      typeFields: { isCompleted: true }
    },
    // Event types commented out - not needed for now
    // {
    //   id: 'event-types',
    //   label: t('eventTypes'),
    //   description: t('selectLookup'),
    //   icon: Calendar,
    //   hook: eventTypes,
    //   typeFields: { defaultDuration: true }
    // },
    {
      id: 'service-categories',
      label: t('serviceCategories'),
      description: t('selectLookup'),
      icon: Folder,
      hook: serviceCategories,
      typeFields: {}
    },
    {
      id: 'priorities',
      label: t('priorities'),
      description: t('selectLookup'),
      icon: Flag,
      hook: priorities,
      typeFields: {}
    },
    {
      id: 'article-categories',
      label: t('articleCategories'),
      description: t('selectLookup'),
      icon: Package,
      hook: articleCategories,
      typeFields: {}
    },
    {
      id: 'locations',
      label: t('locations'),
      description: t('selectLookup'),
      icon: MapPin,
      hook: locations,
      typeFields: {}
    },
    {
      id: 'article-groups',
      label: t('articleGroups', 'Article Groups'),
      description: t('selectLookup'),
      icon: Package,
      hook: articleGroups,
      typeFields: {}
    },
    {
      id: 'leave-types',
      label: t('leaveTypes'),
      description: t('selectLookup'),
      icon: Clock,
      hook: leaveTypes,
      typeFields: { isPaid: true }
    },
    {
      id: 'offer-categories',
      label: t('offerCategories'),
      description: t('selectLookup'),
      icon: Tag,
      hook: offerCategories,
      typeFields: {}
    },
    {
      id: 'offer-sources',
      label: t('offerSources'),
      description: t('selectLookup'),
      icon: Megaphone,
      hook: offerSources,
      typeFields: {}
    },
    // Installation Types commented out - using hardcoded External/Internal
    // {
    //   id: 'installation-types',
    //   label: t('installationTypes', 'Installation Types'),
    //   description: t('selectLookup'),
    //   icon: Wrench,
    //   hook: installationTypes,
    //   typeFields: {}
    // },
    {
      id: 'installation-categories',
      label: t('installationCategories', 'Installation Categories'),
      description: t('selectLookup'),
      icon: Package,
      hook: installationCategories,
      typeFields: {}
    },
    {
      id: 'work-types',
      label: t('workTypes', 'Work Types'),
      description: t('selectLookup'),
      icon: Clock,
      hook: workTypes,
      typeFields: {}
    },
    {
      id: 'expense-types',
      label: t('expenseTypes', 'Expense Types'),
      description: t('selectLookup'),
      icon: DollarSign,
      hook: expenseTypes,
      typeFields: {}
    },
    {
      id: 'project-types',
      label: t('projectTypes', 'Project Types'),
      description: t('selectLookup'),
      icon: FolderKanban,
      hook: projectTypes,
      typeFields: {}
    },
    {
      id: 'form-categories',
      label: t('formCategories', 'Form Categories'),
      description: t('selectLookup'),
      icon: FileText,
      hook: formCategories,
      typeFields: {}
    },
    {
      id: 'document-types',
      label: t('documentTypes', 'Document Types'),
      description: t('selectLookup'),
      icon: FileText,
      hook: documentTypes,
      typeFields: {}
    },
    // Currencies commented out - not needed for now
    // {
    //   id: 'currencies',
    //   label: t('currencies'),
    //   description: t('selectLookup'),
    //   icon: Coins,
    //   hook: currencies,
    //   typeFields: {},
    //   isCurrency: true
    // }
  ];

  const selectedType = lookupTypes.find(type => type.id === selectedLookup);

  return (
    <div className="flex flex-col">
      {/* Header (consistent with Articles/Contacts pattern) */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {returnUrl && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleGoBack}
              className="mr-2"
              title={t('backToPage')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="p-2 rounded-lg bg-primary/10">
            <ListChecks className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
            <p className="text-[11px] text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        {returnUrl && (
          <Button onClick={handleGoBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('continueEditing')}
          </Button>
        )}
      </div>

      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {returnUrl && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleGoBack}
              title={t('backToPage')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="p-2 rounded-lg bg-primary/10">
            <ListChecks className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-foreground truncate">{t('title')}</h1>
            <p className="text-[11px] text-muted-foreground truncate">{t('subtitle')}</p>
          </div>
        </div>
        {returnUrl && (
          <Button onClick={handleGoBack} variant="outline" size="sm" className="w-full mt-3">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('continueEditing')}
          </Button>
        )}
      </div>

      {/* Content padding (header stays flush) */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Lookup Categories List */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('allLookups')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {lookupTypes.map((type) => {
                    const Icon = type.icon;
                      const itemCount = (type.hook as any).items?.length || 0;
                    const isSelected = selectedLookup === type.id;
                    
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleLookupSelect(type.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50",
                            isSelected && "bg-primary/10 border-l-2 border-l-primary"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            isSelected && "text-primary"
                          )}>
                            {type.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {itemCount} {t('items')}
                          </p>
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isSelected && "text-primary rotate-90"
                        )} />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Selected Lookup */}
          <div className="lg:col-span-8" ref={contentRef}>
            {selectedType ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <selectedType.icon className="h-5 w-5 text-primary" />
                      {selectedType.label}
                    </div>
                    <Badge variant={(selectedType.hook as any).isLoading ? "secondary" : "default"}>
                      {(selectedType.hook as any).items?.length || 0} {t('items')}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{selectedType.description}</CardDescription>
                </CardHeader>
                <CardContent>
                {selectedType.hook.error && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center">
                    <AlertCircle className="h-4 w-4 text-destructive mr-2" />
                    <span className="text-destructive text-sm">{selectedType.hook.error}</span>
                  </div>
                )}
                
                {/* Currency section commented out - not needed for now */}
                <LookupTable
                  items={(selectedType.hook as any).items}
                  isLoading={(selectedType.hook as any).isLoading}
                  onCreate={(selectedType.hook as any).createItem}
                  onUpdate={(selectedType.hook as any).updateItem}
                  onDelete={(selectedType.hook as any).deleteItem}
                  onSetDefault={(selectedType.hook as any).setDefaultItem}
                  showTypeFields={selectedType.typeFields}
                />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ListChecks className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{t('selectLookup')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('subtitle')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Floating back button when returnUrl is present */}
      {returnUrl && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <Button onClick={handleGoBack} className="shadow-lg gap-2 px-6">
            <ArrowLeft className="h-4 w-4" />
            {t('continueEditing')}
          </Button>
        </div>
      )}
    </div>
  );
}
