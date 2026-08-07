import { useState, useEffect } from "react";
import { ContentSkeleton } from "@/components/ui/page-skeleton";
import { useTranslation } from "react-i18next";
import { Search, Plus, Package, Building, MapPin, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { installationsApi } from "@/services/api/installationsApi";
import { toast } from "sonner";
import { CreateInstallationModal } from "./CreateInstallationModal";

interface InstallationItem {
  id: string | number;
  name: string;
  model?: string;
  manufacturer?: string;
  location?: string;
  type?: string;
  status?: string;
  contactName?: string;
  contactId?: number;
  serialNumber?: string;
  matricule?: string;
}

interface InstallationSelectorProps {
  onSelect: (installation: any) => void;
  selectedInstallation?: any | null;
  selectedInstallations?: any[];
  onCreateNew?: () => void;
}

export function InstallationSelector({ onSelect, selectedInstallation, selectedInstallations = [], onCreateNew }: InstallationSelectorProps) {
  const { t } = useTranslation('installations');
  const [searchTerm, setSearchTerm] = useState("");
  const [showSelector, setShowSelector] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Real data state
  const [installations, setInstallations] = useState<InstallationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  // Fetch installations when modal opens
  useEffect(() => {
    if (showSelector) {
      fetchInstallations();
    }
  }, [showSelector, currentPage, searchTerm]);

  const fetchInstallations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await installationsApi.getAll({
        search: searchTerm || undefined,
        page: currentPage,
        pageSize: pageSize,
      });
      
      // Map backend response
      const mappedInstallations: InstallationItem[] = (response.installations || []).map((inst: any) => ({
        id: inst.id,
        name: inst.name || inst.equipmentName || 'Unnamed Installation',
        model: inst.model || inst.equipmentModel || '',
        manufacturer: inst.manufacturer || inst.brand || '',
        location: inst.location?.address || inst.locationAddress || inst.address || '',
        type: inst.type || inst.installationType || 'internal',
        status: inst.status || 'active',
        contactName: inst.contact?.name || inst.contactName || inst.customerName || '',
        contactId: inst.contactId || inst.contact?.id,
        serialNumber: inst.serialNumber || '',
        matricule: inst.matricule || '',
      }));
      
      setInstallations(mappedInstallations);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.totalCount || mappedInstallations.length);
    } catch (err) {
      console.error('Failed to fetch installations:', err);
      setError(t('selector.loadError'));
      toast.error(t('selector.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (installation: InstallationItem) => {
    onSelect({
      id: installation.id,
      name: installation.name,
      model: installation.model,
      manufacturer: installation.manufacturer,
      location: installation.location,
      type: installation.type,
      serialNumber: installation.serialNumber,
      matricule: installation.matricule,
      customer: { company: installation.contactName },
    });
    setShowSelector(false);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const isInstallationSelected = (installationId: string | number) => {
    const normalizedId = String(installationId);
    if (selectedInstallation && String(selectedInstallation.id) === normalizedId) return true;
    return selectedInstallations.some((inst) => String(inst?.id) === normalizedId);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{t('selector.installationAssignment')}</Label>
      
      {selectedInstallation ? (
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{selectedInstallation.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedInstallation.manufacturer} - {selectedInstallation.model}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    {selectedInstallation.customer?.company && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building className="h-3 w-3" />
                        {selectedInstallation.customer.company}
                      </div>
                    )}
                    {selectedInstallation.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {selectedInstallation.location}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {selectedInstallation.type === 'internal' ? t('internal_sold') : t('external_owned')}
                  </Badge>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowSelector(true)}>
                {t('selector.change')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSelector(true)}
            className="flex-1 justify-start gap-2"
          >
            <Search className="h-4 w-4" />
            {t('selector.selectInstallation')}
          </Button>
        </div>
      )}

      {/* Installation Selector Dialog */}
      <Dialog open={showSelector} onOpenChange={setShowSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('selector.selectInstallation')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div>
              <Label>{t('selector.searchInstallations')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('selector.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Installations Grid */}
            {isLoading ? (
              <ContentSkeleton rows={6} />
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <p>{error}</p>
                <Button variant="outline" onClick={fetchInstallations} className="mt-2">
                  {t('selector.retry')}
                </Button>
              </div>
            ) : installations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {searchTerm ? (
                  <p>{t('selector.noInstallationsMatching', { search: searchTerm })}</p>
                ) : (
                  <p>{t('selector.noInstallationsAvailable')}</p>
                )}
                {onCreateNew && (
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => {
                    setShowSelector(false);
                    onCreateNew();
                  }}>
                    <Plus className="h-4 w-4" />
                    {t('selector.createNew')}
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {installations.map((installation) => (
                    <Card 
                      key={installation.id} 
                      className={`border transition-colors ${
                        isInstallationSelected(installation.id)
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30 cursor-default opacity-70'
                          : 'cursor-pointer hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        if (!isInstallationSelected(installation.id)) {
                          handleSelect(installation);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{installation.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {installation.manufacturer} {installation.model && `- ${installation.model}`}
                            </p>
                            {installation.contactName && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Building className="h-3 w-3" />
                                {installation.contactName}
                              </div>
                            )}
                            {installation.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {installation.location}
                              </div>
                            )}
                            {installation.serialNumber && (
                              <p className="text-xs text-muted-foreground mt-1">
                                S/N: {installation.serialNumber}
                              </p>
                            )}
                            {installation.matricule && (
                              <p className="text-xs text-muted-foreground">
                                {t('matricule', 'Matricule')}: {installation.matricule}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {installation.type === 'internal' ? t('internal') : t('external')}
                              </Badge>
                              {isInstallationSelected(installation.id) && (
                                <Badge className="text-xs bg-primary text-primary-foreground">
                                  {t('selector.selected', 'Sélectionné')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {t('selector.showing', { start: ((currentPage - 1) * pageSize) + 1, end: Math.min(currentPage * pageSize, totalCount), total: totalCount })}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t('selector.previous')}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {t('selector.page', { current: currentPage, total: totalPages })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        {t('selector.next')}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setShowSelector(false);
                setShowCreateModal(true);
              }} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('selector.createNew')}
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setShowSelector(false)}>
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Installation Modal */}
      <CreateInstallationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onInstallationCreated={(installation) => {
          // Select the newly created installation
          onSelect({
            id: installation.id,
            name: installation.name,
            model: installation.model,
            manufacturer: installation.manufacturer,
            location: installation.siteAddress,
            type: installation.installationType,
            customer: { company: installation.contact?.primaryContactName || '' },
          });
          // Refresh installations list
          fetchInstallations();
        }}
      />
    </div>
  );
}
