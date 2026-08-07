import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { offerStatusConfig } from '@/config/entity-statuses';
import { getStatusTranslationKey } from '@/config/entity-statuses';
import { useLookups } from '@/shared/contexts/LookupsContext';
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { OfferFilters } from "../types";

interface OffersSearchControlsProps {
  filters: OfferFilters;
  onFiltersChange: (filters: OfferFilters) => void;
}

export function OffersSearchControls({ filters, onFiltersChange }: OffersSearchControlsProps) {
  const { t } = useTranslation('offers');
  const { offerCategories, offerSources } = useLookups();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      status: value === 'all' ? undefined : value 
    });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      category: value === 'all' ? undefined : value 
    });
  };

  const handleSourceChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      source: value === 'all' ? undefined : value 
    });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    onFiltersChange({});
  };

  const activeFilterCount = [
    filters.status ? 1 : 0,
    filters.category ? 1 : 0,
    filters.source ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="p-3 sm:p-4 border-b border-border bg-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
        <div className="flex gap-2 sm:gap-3 flex-1 w-full">
          <CollapsibleSearch 
            placeholder={t('searchOffers')}
            value={searchTerm}
            onChange={handleSearchChange}
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
              <span className="hidden sm:inline">{t('filters.filters', { defaultValue: 'Filters' })}</span>
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
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap items-end gap-3">
            {/* Status Filter */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">
                {t('filters.by_status')}
              </label>
              <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('filters.all_offers')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('filters.all_offers')}</SelectItem>
                  {offerStatusConfig.statuses.map(s => (
                    <SelectItem key={s.id} value={s.id}>{t(s.translationKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">
                Category
              </label>
              <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">All Categories</SelectItem>
                  {offerCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Filter */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">
                Source
              </label>
              <Select value={filters.source || 'all'} onValueChange={handleSourceChange}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">All Sources</SelectItem>
                  {offerSources.map((src) => (
                    <SelectItem key={src.id} value={src.name}>{src.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {t('clearFilters') || 'Clear all'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}