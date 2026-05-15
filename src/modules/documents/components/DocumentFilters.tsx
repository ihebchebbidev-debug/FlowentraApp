import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { DocumentFilters as FilterType } from '../types';

interface DocumentFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export function DocumentFilters({ filters, onFiltersChange }: DocumentFiltersProps) {
  const { t } = useTranslation();

  const updateFilter = (key: keyof FilterType, value: any) => {
    // Map sentinel 'all' to undefined for internal representation
    const final = value === '' || value === 'all' ? undefined : value;
    onFiltersChange({
      ...filters,
      [key]: final
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Module Filter */}
        <div className="space-y-2">
          <Label htmlFor="module-filter">{t('documents.filterByModule')}</Label>
          <Select value={filters.moduleType || ''} onValueChange={(value) => updateFilter('moduleType', value)}>
            <SelectTrigger id="module-filter">
              <SelectValue placeholder={t('documents.allModules')} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              <SelectItem value="all">{t('documents.allModules')}</SelectItem>
              <SelectItem value="general">{t('documents.general')}</SelectItem>
              <SelectItem value="contacts">{t('documents.contacts')}</SelectItem>
              <SelectItem value="sales">{t('documents.sales')}</SelectItem>
              <SelectItem value="offers">{t('documents.offers')}</SelectItem>
              <SelectItem value="services">{t('documents.services')}</SelectItem>
              <SelectItem value="installations">Installation</SelectItem>
              <SelectItem value="projects">{t('documents.projects')}</SelectItem>
              <SelectItem value="field">{t('documents.field')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* File Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="type-filter">{t('documents.filterByType')}</Label>
          <Select value={filters.fileType || ''} onValueChange={(value) => updateFilter('fileType', value)}>
            <SelectTrigger id="type-filter">
              <SelectValue placeholder={t('documents.allTypes')} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              <SelectItem value="all">{t('documents.allTypes')}</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="gif">GIF</SelectItem>
              <SelectItem value="doc">DOC</SelectItem>
              <SelectItem value="docx">DOCX</SelectItem>
              <SelectItem value="xls">XLS</SelectItem>
              <SelectItem value="xlsx">XLSX</SelectItem>
              <SelectItem value="txt">TXT</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>



        {/* Uploader Filter */}
        <div className="space-y-2">
          <Label htmlFor="uploader-filter">{t('documents.filterByUploader')}</Label>
          <Select value={filters.uploadedBy || ''} onValueChange={(value) => updateFilter('uploadedBy', value)}>
            <SelectTrigger id="uploader-filter">
              <SelectValue placeholder={t('documents.allUploaders')} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              <SelectItem value="all">{t('documents.allUploaders')}</SelectItem>
              <SelectItem value="user-1">John Sales</SelectItem>
              <SelectItem value="user-2">Jane Manager</SelectItem>
              <SelectItem value="user-3">Mike Designer</SelectItem>
              <SelectItem value="user-4">Alex Technician</SelectItem>
              <SelectItem value="user-5">Sarah Technician</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            {t('documents.clearFilters')}
          </Button>
        </div>
      )}
    </div>
  );
}