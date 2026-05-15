import { useState, useEffect } from 'react';
import { Search, List, Table, Filter, X, MapPin } from "lucide-react";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locationsApi, LookupItem } from "@/services/api/lookupsApi";

interface InventorySearchControlsProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterLocation: string;
  setFilterLocation: (v: string) => void;
  serviceCategories: { id: string; name: string }[];
  viewMode: 'list' | 'table';
  setViewMode: (v: 'list' | 'table') => void;
}

export function InventorySearchControls({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterLocation,
  setFilterLocation,
  serviceCategories,
  viewMode,
  setViewMode,
}: InventorySearchControlsProps) {
  const { t } = useTranslation(['inventory-services', 'translation']);
  const [localShowFilters, setLocalShowFilters] = useState(false);
  const [locations, setLocations] = useState<LookupItem[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Calculate active filter count
  const activeFilterCount = 
    (filterType !== 'all' ? 1 : 0) + 
    (filterLocation !== 'all' ? 1 : 0);

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
    setFilterType('all');
    setFilterLocation('all');
  };

  // Show location filter only when materials is selected or all types
  const showLocationFilter = filterType === 'all' || filterType === 'material';

  return (
    <div className="p-3 sm:p-4 border-b border-border bg-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
        <div className="flex gap-2 sm:gap-3 flex-1 w-full">
          <CollapsibleSearch 
            placeholder={t('filter.search_placeholder')}
            value={searchTerm}
            onChange={setSearchTerm}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <Button 
              variant={localShowFilters ? "default" : "outline"} 
              size="sm" 
              className="gap-1 sm:gap-2 px-2 sm:px-3" 
              onClick={() => setLocalShowFilters(v => !v)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{t('translation:filters')}</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('list')} 
            className={`flex-1 sm:flex-none ${viewMode === 'list' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
          >
            <List className={`h-4 w-4 ${viewMode === 'list' ? 'text-primary-foreground' : ''}`} />
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('table')} 
            className={`flex-1 sm:flex-none ${viewMode === 'table' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
          >
            <Table className={`h-4 w-4 ${viewMode === 'table' ? 'text-primary-foreground' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      {localShowFilters && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap items-end gap-3">
            {/* Type Filter */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">
                {t('filter.type')}
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('filter.all')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('filter.all')}</SelectItem>
                  <SelectItem value="material">{t('filter.materials')}</SelectItem>
                  <SelectItem value="service">{t('filter.services')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter - Only for materials */}
            {showLocationFilter && (
              <div className="flex flex-col gap-1.5 min-w-[180px]">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {t('filter.location')}
                </label>
                <Select 
                  value={filterLocation} 
                  onValueChange={setFilterLocation}
                  disabled={loadingLocations}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder={t('filter.all_locations')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('filter.all_locations')}</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearFilters}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {t('filter.clear_filters')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
