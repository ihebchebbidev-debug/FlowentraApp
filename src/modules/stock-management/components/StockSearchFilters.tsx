import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, ChevronDown, MapPin, X } from 'lucide-react';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locationsApi, LookupItem } from "@/services/api/lookupsApi";
import type { StockFilter, StockStatus } from '../types';

interface StockSearchFiltersProps {
  filter: StockFilter;
  onFilterChange: (filter: Partial<StockFilter>) => void;
}

export function StockSearchFilters({ filter, onFilterChange }: StockSearchFiltersProps) {
  const { t } = useTranslation('stock-management');
  const [showFilters, setShowFilters] = useState(false);
  const [locations, setLocations] = useState<LookupItem[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  // Calculate active filter count
  const activeFilterCount = 
    (filter.status !== 'all' ? 1 : 0) + 
    (filter.location !== 'all' ? 1 : 0);

  // Load locations dynamically
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const response = await locationsApi.getAll();
        setLocations(response.items || []);
      } catch (error) {
        console.error('Failed to load locations:', error);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  const handleClearFilters = () => {
    onFilterChange({ status: 'all', location: 'all' });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
        <div className="flex gap-2 sm:gap-3 flex-1 w-full">
          <CollapsibleSearch 
            placeholder={t('search_placeholder')}
            value={filter.search}
            onChange={(value) => onFilterChange({ search: value })}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <Button 
              variant={showFilters ? "default" : "outline"}
              size="sm" 
              className="gap-1 sm:gap-2 px-2 sm:px-3" 
              onClick={() => setShowFilters(v => !v)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{t('filters')}</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="pt-3 border-t border-border">
          <div className="flex flex-wrap items-end gap-3">
            {/* Status Filter */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">
                {t('filter.status_label')}
              </label>
              <Select 
                value={filter.status} 
                onValueChange={(value) => onFilterChange({ status: value as StockStatus | 'all' })}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('filter.all')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('filter.all')}</SelectItem>
                  <SelectItem value="critical">{t('filter.critical')}</SelectItem>
                  <SelectItem value="low">{t('filter.low')}</SelectItem>
                  <SelectItem value="good">{t('filter.good')}</SelectItem>
                  <SelectItem value="excess">{t('filter.excess')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {t('filter.location') || 'Location'}
              </label>
              <Select 
                value={filter.location} 
                onValueChange={(value) => onFilterChange({ location: value })}
                disabled={loadingLocations}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('filter.all_locations') || 'All Locations'} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('filter.all_locations') || 'All Locations'}</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearFilters}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {t('filter.clear_filters') || 'Clear filters'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
