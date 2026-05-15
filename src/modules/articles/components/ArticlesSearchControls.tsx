import { Search, Filter, List, Grid, Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ArticlesSearchControls({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  viewMode,
  setViewMode,
  onExport,
  onImport,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterStatus: 'all' | string;
  setFilterStatus: (v: 'all' | string) => void;
  filterCategory: 'all' | string;
  setFilterCategory: (v: 'all' | string) => void;
  viewMode: 'list' | 'grid';
  setViewMode: (v: 'list' | 'grid') => void;
  onExport: () => void;
  onImport: () => void;
}) {
  const { t } = useTranslation('articles');
  return (
    <div className="p-3 sm:p-4 border-b border-border bg-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
        <div className="flex gap-2 sm:gap-3 flex-1 w-full sm:max-w-md">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 sm:h-10 border-border bg-background text-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t("filters.filters")}</span>
                {(filterStatus !== 'all' || filterCategory !== 'all') && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {[filterStatus !== 'all' ? 1 : 0, filterCategory !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{t("filters.filter_by_status")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                {t("filters.all_statuses")} {filterStatus === 'all' && '\u2713'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('available')}>
                {t("statuses.available")} {filterStatus === 'available' && '\u2713'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('low_stock')}>
                {t("statuses.low_stock")} {filterStatus === 'low_stock' && '\u2713'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('out_of_stock')}>
                {t("statuses.out_of_stock")} {filterStatus === 'out_of_stock' && '\u2713'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t("filters.filter_by_category")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterCategory('all')}>
                {t("filters.all_categories")} {filterCategory === 'all' && '\u2713'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('Tools')}>
                {t("categories.tools")} {filterCategory === 'Tools' && '\u2713'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('Electrical')}>
                {t("categories.electrical")} {filterCategory === 'Electrical' && '\u2713'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('Safety')}>
                {t("categories.safety")} {filterCategory === 'Safety' && '\u2713'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('Plumbing')}>
                {t("categories.plumbing")} {filterCategory === 'Plumbing' && '\u2713'}
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={onImport}>
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">{t("filters.import")}</span>
              </Button>
            </div>
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={onExport}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{t("filters.export")}</span>
              </Button>
            </div>
          </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-1 sm:gap-2 flex-1 sm:flex-none"
          >
            <List className="h-4 w-4" />
            <span>{t("filters.list")}</span>
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="gap-1 sm:gap-2 flex-1 sm:flex-none"
          >
            <Grid className="h-4 w-4" />
            <span>{t("filters.grid")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
