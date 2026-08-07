import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLookups } from '@/shared/contexts/LookupsContext';
import { CollapsibleSearch } from "@/components/ui/collapsible-search";

export interface DispatcherFilters {
  searchTerm: string;
  status: string;
  priority: string;
}

interface DispatcherSearchControlsProps {
  filters: DispatcherFilters;
  onFiltersChange: (filters: DispatcherFilters) => void;
}

export function DispatcherSearchControls({ filters, onFiltersChange }: DispatcherSearchControlsProps) {
  const { t } = useTranslation();
  const [showFilterBar, setShowFilterBar] = useState(false);
  const { priorities: lookupPriorities } = useLookups();

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchTerm: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handlePriorityChange = (value: string) => {
    onFiltersChange({ ...filters, priority: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      status: 'all',
      priority: 'all'
    });
    setShowFilterBar(false);
  };

  const activeFiltersCount = [
    filters.status !== 'all' ? 1 : 0,
    filters.priority !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return {
    searchComponent: (
      <CollapsibleSearch 
        placeholder={t("dispatcher.search_placeholder")}
        value={filters.searchTerm}
        onChange={handleSearchChange}
        className="w-full"
      />
    ),
    filterButton: (
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-1 sm:gap-2 px-2 sm:px-3" 
        onClick={() => setShowFilterBar(s => !s)}
      >
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">{t('dispatcher.filter')}</span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
    ),
    showFilterBar,
    filterBar: showFilterBar && (
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground">
              {t('dispatcher.by_status')}
            </label>
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder={t('dispatcher.by_status')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md z-50">
                <SelectItem value="all">{t('dispatcher.by_status')}</SelectItem>
                <SelectItem value="unassigned">{t('dispatcher.status_unassigned')}</SelectItem>
                <SelectItem value="assigned">{t('dispatcher.status_assigned')}</SelectItem>
                <SelectItem value="in_progress">{t('dispatcher.status_in_progress')}</SelectItem>
                <SelectItem value="completed">{t('dispatcher.status_completed')}</SelectItem>
                <SelectItem value="cancelled">{t('dispatcher.status_cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground">
              {t('dispatcher.by_priority')}
            </label>
            <Select value={filters.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder={t('dispatcher.by_priority')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md z-50">
                <SelectItem value="all">{t('dispatcher.by_priority')}</SelectItem>
                {lookupPriorities.map((p:any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-9 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              {t('dispatcher.clear')}
            </Button>
          )}
        </div>
      </div>
    )
  };
}