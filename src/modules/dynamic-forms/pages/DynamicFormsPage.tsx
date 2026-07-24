import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, FileText, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DynamicFormsAutopilotDemo } from '../components/onboarding/DynamicFormsAutopilotDemo';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDynamicForms } from '../hooks/useDynamicForms';
import { FormsTable } from '../components/FormsTable';
import { FormStatus } from '../types';
import { usePermissions } from '@/hooks/usePermissions.tsx';
import { useActionLogger } from '@/hooks/useActionLogger';
import { useToast } from '@/hooks/use-toast';
import { PermissionButton } from '@/components/permissions/PermissionButton';

export default function DynamicFormsPage() {
  const { t } = useTranslation('dynamic-forms');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMainAdmin, hasPermission, isLoading: permissionsLoading } = usePermissions();
  const { logFilter, logButtonClick } = useActionLogger('DynamicForms');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all');
  const [demoOpen, setDemoOpen] = useState(false);
  
  // Permission checks
  const canView = isMainAdmin || hasPermission('dynamic_forms', 'read');
  const canCreate = isMainAdmin || hasPermission('dynamic_forms', 'create');
  
  const { data: forms, isLoading } = useDynamicForms({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchTerm || undefined,
  });
  
  const activeFilterCount = [statusFilter !== 'all' ? statusFilter : null].filter(Boolean).length;
  
  // Log filter changes
  const handleStatusFilterChange = (value: FormStatus | 'all') => {
    setStatusFilter(value);
    if (value !== 'all') {
      logFilter('status', value, { entityType: 'DynamicForm' });
    }
  };
  
  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    logButtonClick('Clear Filters', { entityType: 'DynamicForm' });
  };
  
  const handleCreateClick = () => {
    logButtonClick('Create Form', { entityType: 'DynamicForm' });
    navigate('/dashboard/settings/dynamic-forms/create');
  };
  
  // Redirect if no view permission
  useEffect(() => {
    if (!permissionsLoading && !canView) {
      toast({
        title: t('common.access_denied', 'Access Denied'),
        description: t('common.no_permission', "You don't have permission to view this page."),
        variant: 'destructive',
      });
      navigate('/dashboard/settings', { replace: true });
    }
  }, [canView, permissionsLoading, navigate, toast, t]);
  
  // Show loading or nothing while checking permissions
  if (permissionsLoading || !canView) {
    return null;
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{t('header.title')}</h1>
            <p className="text-px-10 sm:text-px-11 text-muted-foreground truncate">{t('header.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex gap-1.5">
            <Play className="h-3.5 w-3.5" /> <span className="hidden md:inline">{t('actions.watchDemo', 'Watch Demo')}</span>
          </Button>
          <PermissionButton
            module="dynamic_forms"
            action="create"
            onClick={handleCreateClick}
            className="gradient-primary"
            tooltipWhenDisabled={t('common.no_create_permission', "You don't have permission to create forms")}
          >
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{t('actions.create')}</span>
          </PermissionButton>
        </div>
      </header>

      {/* Autopilot product demo */}
      <DynamicFormsAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
      
      {/* Search and filters row */}
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CollapsibleSearch
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={setSearchTerm}
            />
            
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                {t('filters.clear')}
              </Button>
            )}
          </div>
          
          {/* Filters on the right */}
          <div className="flex items-center gap-2">
            <Select 
              value={statusFilter} 
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder={t('filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('status.all')}</SelectItem>
                <SelectItem value="draft">{t('status.draft')}</SelectItem>
                <SelectItem value="released">{t('status.released')}</SelectItem>
                <SelectItem value="archived">{t('status.archived')}</SelectItem>
              </SelectContent>
            </Select>
            
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-6 px-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
        
      {/* Table with card container */}
      <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <FormsTable forms={forms || []} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
