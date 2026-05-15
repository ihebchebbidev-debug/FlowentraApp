import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, CheckCircle, Search, Loader2 } from 'lucide-react';
import { DocumentsService } from '../services/documents.service';
import { toast } from 'sonner';
import { offersApi } from '@/services/api/offersApi';
import { salesApi } from '@/services/api/salesApi';
import { serviceOrdersApi } from '@/services/api/serviceOrdersApi';
import { installationsApi } from '@/services/api/installationsApi';

interface SearchResult {
  id: string;
  label: string;
  type: 'sales' | 'offers' | 'services' | 'installations';
  subLabel?: string;
}

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  initialFiles?: File[];
  preselectedModule?: {
    type: string;
    id: string;
    name: string;
  };
}

export function DocumentUploadModal({ 
  isOpen, 
  onClose, 
  onUploadComplete, 
  initialFiles,
  preselectedModule 
}: DocumentUploadModalProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>(initialFiles || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [moduleType, setModuleType] = useState(preselectedModule?.type || 'offers');
  const [description, setDescription] = useState('');

  // Auto-determine category from module type
  const getCategoryFromModule = (mod: string): 'crm' | 'field' => {
    if (mod === 'field' || mod === 'installations') return 'field';
    return 'crm';
  };

  // Associated record search
  const [recordSearch, setRecordSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SearchResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const category = getCategoryFromModule(selectedRecord?.type || moduleType);

  // Sync initialFiles
  const prevInitialRef = useCallback((newFiles: File[] | undefined) => {
    if (newFiles && newFiles.length > 0) setFiles(newFiles);
  }, []);

  if (initialFiles && initialFiles.length > 0 && files.length === 0) {
    prevInitialRef(initialFiles);
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Clear selected record when module changes
  const handleModuleChange = useCallback((value: string) => {
    setModuleType(value);
    setSelectedRecord(null);
    setRecordSearch('');
    setSearchResults([]);
    setShowDropdown(false);
  }, []);

  // Search records across ALL modules for comprehensive results
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    try {
      const results: SearchResult[] = [];

      // Search all modules in parallel for comprehensive results
      const [offersRes, salesRes, servicesRes, installationsRes] = await Promise.all([
        offersApi.getAll({ search: query, limit: 10 }).catch(() => null),
        salesApi.getAll({ search: query, limit: 10 }).catch(() => null),
        serviceOrdersApi.getAll({ search: query, pageSize: 10 }).catch(() => null),
        installationsApi.getAll({ search: query, pageSize: 10 }).catch(() => null),
      ]);

      // Offers
      if (offersRes) {
        const offers = (offersRes as any).data?.offers || (offersRes as any).offers || [];
        offers.forEach((o: any) => results.push({
          id: String(o.id),
          label: [o.offerNumber, o.title].filter(Boolean).join(' — ') || `Offre #${o.id}`,
          type: 'offers',
          subLabel: [o.contactName, o.validUntil ? `${t('offers.validUntil', 'Valid until')}: ${new Date(o.validUntil).toLocaleDateString()}` : ''].filter(Boolean).join(' · '),
        }));
      }

      // Sales
      if (salesRes) {
        const sales = (salesRes as any).data?.sales || (salesRes as any).sales || [];
        sales.forEach((s: any) => results.push({
          id: String(s.id),
          label: [s.saleNumber, s.title].filter(Boolean).join(' — ') || `Vente #${s.id}`,
          type: 'sales',
          subLabel: [s.contactName, s.status].filter(Boolean).join(' · '),
        }));
      }

      // Service Orders
      if (servicesRes) {
        const orders = (servicesRes as any).data?.serviceOrders || (servicesRes as any).serviceOrders || [];
        orders.forEach((so: any) => results.push({
          id: String(so.id),
          label: [so.orderNumber, so.title].filter(Boolean).join(' — ') || `OS #${so.id}`,
          type: 'services',
          subLabel: [so.customer?.contactPerson, so.status].filter(Boolean).join(' · '),
        }));
      }

      // Installations
      if (installationsRes) {
        const installations = installationsRes.installations || [];
        installations.forEach((inst: any) => results.push({
          id: String(inst.id),
          label: [inst.installationNumber, inst.name].filter(Boolean).join(' — ') || `Installation #${inst.id}`,
          type: 'installations',
          subLabel: [inst.manufacturer, inst.model, inst.serialNumber].filter(Boolean).join(' · '),
        }));
      }

      setSearchResults(results);
      setShowDropdown(results.length > 0);
    } catch (err) {
      console.error('Record search error:', err);
    } finally {
      setSearching(false);
    }
  }, [t]);

  const handleSearchChange = useCallback((value: string) => {
    setRecordSearch(value);
    if (selectedRecord) {
      setSelectedRecord(null);
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => performSearch(value), 200);
  }, [performSearch, selectedRecord]);

  const handleSelectRecord = useCallback((record: SearchResult) => {
    setSelectedRecord(record);
    setRecordSearch(record.label);
    setShowDropdown(false);
    // Auto-set module type to match selected record
    if (!preselectedModule) {
      setModuleType(record.type === 'installations' ? 'installations' : record.type);
    }
  }, [preselectedModule]);

  const clearSelectedRecord = useCallback(() => {
    setSelectedRecord(null);
    setRecordSearch('');
    setSearchResults([]);
  }, []);

  const typeLabels: Record<string, string> = useMemo(() => ({
    offers: t('documents.offers', 'Offres'),
    sales: t('documents.sales', 'Ventes'),
    services: t('documents.services', 'Service'),
    installations: 'Installation',
    field: t('documents.operation', 'Opération'),
  }), [t]);

  const typeBadgeColors: Record<string, string> = {
    offers: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    sales: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    services: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    installations: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    field: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setFiles(prev => [...prev, ...Array.from(event.dataTransfer.files)]);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error(t('documents.selectFiles'));
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Use the moduleType directly — selectedRecord type should match
      // Map 'installations' to 'field' for backend compatibility
      const backendModuleType = (moduleType === 'installations') ? 'field' : moduleType;

      await DocumentsService.uploadDocuments(
        {
          files,
          moduleType: backendModuleType,
          moduleId: selectedRecord?.id || undefined,
          moduleName: selectedRecord?.label || undefined,
          description: description.trim() || undefined,
          tags: [],
          category,
        },
        (info) => setUploadProgress(info.percent),
      );

      setUploadProgress(100);
      toast.success(t('documents.uploadSuccess'));
      onUploadComplete();
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('documents.uploadError'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setModuleType(preselectedModule?.type || 'offers');
      setDescription('');
      setUploadProgress(0);
      setSelectedRecord(null);
      setRecordSearch('');
      setSearchResults([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('documents.uploadFiles')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Module */}
          <div className="space-y-2">
            <Label htmlFor="module-type">{t('documents.module')}</Label>
            <Select 
              value={moduleType} 
              onValueChange={handleModuleChange}
              disabled={!!preselectedModule}
            >
              <SelectTrigger id="module-type">
                <SelectValue placeholder={t('documents.select_module')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offers">{t('documents.offers')}</SelectItem>
                <SelectItem value="sales">{t('documents.sales')}</SelectItem>
                <SelectItem value="services">{t('documents.services')}</SelectItem>
                <SelectItem value="field">{t('documents.operation', 'Opération')}</SelectItem>
                <SelectItem value="installations">Installation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Associated Record — Searchable */}
          <div className="space-y-2">
            <Label>
              {moduleType === 'offers' && (t('documents.searchOfferHint', 'Rechercher une offre à associer'))}
              {moduleType === 'sales' && (t('documents.searchSaleHint', 'Rechercher une vente à associer'))}
              {moduleType === 'services' && (t('documents.searchServiceHint', 'Rechercher un ordre de service à associer'))}
              {(moduleType === 'installations' || moduleType === 'field') && (t('documents.searchInstallationHint', 'Rechercher une installation à associer'))}
              {!['offers','sales','services','installations','field'].includes(moduleType) && t('documents.associatedRecord')}
            </Label>
            <div className="relative" ref={dropdownRef}>
              {selectedRecord ? (
                <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/30">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeBadgeColors[selectedRecord.type]}`}>
                    {typeLabels[selectedRecord.type]}
                  </span>
                  <span className="text-sm font-medium flex-1 truncate">{selectedRecord.label}</span>
                  {selectedRecord.subLabel && (
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">{selectedRecord.subLabel}</span>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={clearSelectedRecord}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={recordSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={t('documents.searchRecordPlaceholder', 'Rechercher par nom, numéro...')}
                    className="pl-9 pr-8"
                    disabled={!!preselectedModule}
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Search Results Dropdown */}
              {(showDropdown || searching) && !selectedRecord && (
                <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-xl max-h-72 overflow-y-auto divide-y divide-border">
                  {searching && searchResults.length === 0 && (
                    <div className="px-3 py-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('documents.searching', 'Recherche en cours...')}
                    </div>
                  )}
                  {/* Group results by type */}
                  {(['offers', 'sales', 'services', 'installations'] as const).map((type) => {
                    const group = searchResults.filter(r => r.type === type);
                    if (group.length === 0) return null;
                    return (
                      <div key={type}>
                        <div className="px-3 py-1.5 bg-muted/40 sticky top-0">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide ${typeBadgeColors[type]?.split(' ').find(c => c.startsWith('text-')) || 'text-muted-foreground'}`}>
                            {typeLabels[type]} ({group.length})
                          </span>
                        </div>
                        {group.map((result) => (
                          <button
                            key={`${result.type}-${result.id}`}
                            className="w-full text-left px-3 py-2 hover:bg-accent/60 focus:bg-accent/60 transition-colors flex items-center gap-2.5 outline-none"
                            onClick={() => handleSelectRecord(result)}
                          >
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${typeBadgeColors[result.type]}`}>
                              {typeLabels[result.type]}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result.label}</p>
                              {result.subLabel && (
                                <p className="text-[11px] text-muted-foreground truncate">{result.subLabel}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                  {searchResults.length === 0 && !searching && recordSearch.length >= 1 && (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      {t('documents.noResultsFound', 'Aucun résultat trouvé')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('documents.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('documents.description_placeholder')}
              rows={2}
            />
          </div>

          {/* File Upload Area */}
          <div>
            <Label>{t('documents.selectFiles')}</Label>
            <div
              className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-5 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('file-upload-modal')?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-base font-medium mb-1">{t('documents.dropFilesHere')}</p>
              <p className="text-sm text-muted-foreground mb-1">{t('documents.supportedFormats')}</p>
              <p className="text-xs text-muted-foreground">{t('documents.maxFileSize')}</p>
            </div>
            <input
              id="file-upload-modal"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>{t('documents.selectedFiles', { count: files.length })}</Label>
              <div className="max-h-36 overflow-y-auto space-y-1.5">
                {files.map((file, index) => (
                  <Card key={`${file.name}-${index}`}>
                    <CardContent className="p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {DocumentsService.formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                          disabled={uploading}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('documents.uploading')}</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              {t('documents.cancel')}
            </Button>
            <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  {t('documents.uploading')} ({uploadProgress}%)
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('documents.upload')} ({files.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
