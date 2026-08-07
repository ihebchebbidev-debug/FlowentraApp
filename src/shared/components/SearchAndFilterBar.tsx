import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  type?: 'select' | 'multiselect';
}

interface SearchAndFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filterGroups?: FilterGroup[];
  activeFilters?: Record<string, string | string[]>;
  onFilterChange?: (key: string, value: string | string[]) => void;
  onClearFilters?: () => void;
  className?: string;
  fullWidth?: boolean;
  labels?: {
    allPrefix?: string; // default: "All"
    clearAll?: string;  // default: "Clear all"
    filters?: string;   // default: "Filters"
    filtersTitle?: string; // default: "Filters"
    selectPrefix?: string; // default: "Select"
    filterCountSuffixSingular?: string; // default: "filter"
    filterCountSuffixPlural?: string; // default: "filters"
  };
}

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = "Search...",
  filterGroups = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  className = "",
  fullWidth = false,
  labels
}) => {
  const allPrefix = labels?.allPrefix ?? 'All';
  const clearAll = labels?.clearAll ?? 'Clear all';
  const filtersLabel = labels?.filters ?? 'Filters';
  const filtersTitle = labels?.filtersTitle ?? filtersLabel;
  const selectPrefix = labels?.selectPrefix ?? 'Select';
  const filterSingular = labels?.filterCountSuffixSingular ?? 'filter';
  const filterPlural = labels?.filterCountSuffixPlural ?? 'filters';

  const hasActiveFilters = Object.values(activeFilters).some(filter => 
    Array.isArray(filter) ? filter.length > 0 : filter !== '' && filter !== 'all'
  );
  const activeFilterCount = Object.values(activeFilters).reduce((count, filter) => {
    if (Array.isArray(filter)) {
      return count + filter.length;
    }
    return filter && filter !== 'all' ? count + 1 : count;
  }, 0);

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex flex-1 items-center gap-3">
        {/* Search Input */}
        <div className={`flex-1 ${fullWidth ? 'max-w-none' : 'max-w-md'}`}>
          <CollapsibleSearch 
            placeholder={placeholder}
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full"
          />
        </div>

        {/* Quick Filter Buttons */}
        {filterGroups.length > 0 && (
          <div className="flex items-center gap-2">
            {filterGroups.slice(0, 1).map((group) => (
              <Select
                key={group.key}
                value={activeFilters[group.key] as string || 'all'}
                onValueChange={(value) => onFilterChange?.(group.key, value)}
              >
                <SelectTrigger className="w-32 bg-background border-border">
                  <SelectValue placeholder={group.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{allPrefix} {group.label}</SelectItem>
                  {group.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        {option.count !== undefined && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {option.count}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeFilterCount} {activeFilterCount === 1 ? filterSingular : filterPlural}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2 text-xs"
            >
              {clearAll}
            </Button>
          </div>
        )}

        {/* Advanced Filters */}
        {filterGroups.length > 1 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`gap-2 ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {filtersLabel}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{filtersTitle}</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearFilters}
                      className="h-6 px-2 text-xs"
                    >
                      {clearAll}
                    </Button>
                  )}
                </div>
                <Separator />
                
                {filterGroups.slice(1).map((group, index) => (
                  <div key={group.key} className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {group.label}
                    </label>
                    <Select
                      value={activeFilters[group.key] as string || 'all'}
                      onValueChange={(value) => onFilterChange?.(group.key, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`${selectPrefix} ${group.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{allPrefix} {group.label}</SelectItem>
                        {group.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{option.label}</span>
                              {option.count !== undefined && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {option.count}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {index < filterGroups.slice(1).length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};