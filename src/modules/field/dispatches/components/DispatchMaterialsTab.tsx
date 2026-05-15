import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
// ... keep existing code
import { getAuthHeaders } from '@/utils/apiHeaders';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Plus, Eye, Trash2, Package, User, Calendar, FileText, Pencil, Building } from "lucide-react";
import { AddMaterialModal } from "../../components/AddMaterialModal";
import { dispatchesApi, type MaterialUsage } from "@/services/api/dispatchesApi";
import { articlesApi } from "@/services/api/articlesApi";
import type { Article } from "@/modules/inventory-services/types";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getUnitLabel } from "@/constants/units";
import { useCurrency } from "@/shared/hooks/useCurrency";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { logDispatchActivityWithPropagation } from "@/services/activityLogger";

import { API_URL } from '@/config/api';

// Service order material type (comes from SO API)
interface ServiceOrderMaterial {
  id: number;
  serviceOrderId: number;
  saleItemId?: number;
  articleId?: string;
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  source?: string;
  internalComment?: string;
  externalComment?: string;
  replacing?: boolean;
  oldArticleModel?: string;
  oldArticleStatus?: string;
  installationId?: string;
  installationName?: string;
  createdBy?: string;
  createdAt?: string;
}

interface DispatchMaterialsTabProps {
  dispatchId: number;
  initialMaterials?: MaterialUsage[];
  onDataChange?: () => void;
  // New props for installation-related materials from service order
  installationId?: string;
  serviceOrderMaterials?: ServiceOrderMaterial[];
}

// Extended type to hold resolved names
interface MaterialWithResolvedNames extends MaterialUsage {
  resolvedArticleName?: string;
  resolvedUserName?: string;
  resolvedUnitCost?: number;
  articleDetails?: {
    sku?: string;
    category?: string;
    description?: string;
    stock?: number;
    supplier?: string;
    location?: string;
  };
}

// Edit form data type
interface EditMaterialFormData {
  quantity: number;
  unitPrice: number;
  description: string;
  internalComment: string;
}

export function DispatchMaterialsTab({ dispatchId, initialMaterials = [], onDataChange, installationId, serviceOrderMaterials = [] }: DispatchMaterialsTabProps) {
  const { t } = useTranslation('dispatches');
  const [materials, setMaterials] = useState<MaterialUsage[]>(initialMaterials);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<Article[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialWithResolvedNames | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // View details state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [materialToView, setMaterialToView] = useState<MaterialWithResolvedNames | null>(null);

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<MaterialWithResolvedNames | null>(null);
  const [editFormData, setEditFormData] = useState<EditMaterialFormData>({
    quantity: 1,
    unitPrice: 0,
    description: '',
    internalComment: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // Caches for resolved data
  const [articleNamesById, setArticleNamesById] = useState<Record<string, { name: string; cost: number; details?: any }>>({});
  const [userNamesById, setUserNamesById] = useState<Record<string, string>>({});
  const inFlightArticleFetches = useRef<Set<string>>(new Set());
  const inFlightUserFetches = useRef<Set<string>>(new Set());

  // Use dynamic currency from user settings (defaults to TND)
  const { format: formatCurrency } = useCurrency();

  // Get current user data from localStorage
  const getCurrentUserData = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        return {
          id: String(parsed.id || ''),
          name: `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || 'Unknown'
        };
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return { id: '', name: 'Unknown' };
  };

  // Check if a string looks like a numeric ID
  const isLikelyNumericId = (value: string): boolean => {
    if (!value) return false;
    return /^\d+$/.test(value.trim());
  };

  // Fetch user name by ID (same logic as TimeExpensesTab)
  const fetchUserNameById = async (userId: string): Promise<string | null> => {
    if (!userId || !isLikelyNumericId(userId)) return null;

    const extractName = (data: any): string | null => {
      const user = data?.data || data;
      const firstName = user?.firstName || user?.FirstName || '';
      const lastName = user?.lastName || user?.LastName || '';
      const name = `${firstName} ${lastName}`.trim();
      if (name) return name;
      if (typeof user?.name === 'string' && user.name.trim()) return user.name.trim();
      return null;
    };

    // Try main admin endpoint first
    try {
      const adminRes = await fetch(`${API_URL}/api/Auth/user/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (adminRes.ok) {
        const data = await adminRes.json();
        const name = extractName(data);
        if (name) return name;
      }
    } catch {
      // ignore
    }

    // Fallback: regular users endpoint
    try {
      const userRes = await fetch(`${API_URL}/api/Users/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (userRes.ok) {
        const data = await userRes.json();
        const name = extractName(data);
        if (name) return name;
      }
    } catch {
      // ignore
    }

    return null;
  };

  // Get display name for user (handles various backend formats)
  const getUserDisplayName = (material: MaterialUsage): string => {
    const technicianId = material.technicianId || material.usedBy || material.createdBy;
    const currentUser = getCurrentUserData();

    // If we resolved a name from cache, use it
    if (technicianId && userNamesById[technicianId]) {
      return userNamesById[technicianId];
    }

    // If technicianId matches current user's ID, return their name
    if (technicianId && technicianId === currentUser.id) {
      return currentUser.name;
    }

    // If backend stored a non-numeric value (could be name or placeholder)
    if (technicianId && !isLikelyNumericId(technicianId)) {
      const genericPlaceholders = ['user name', 'unknown', 'technician', 'system'];
      if (genericPlaceholders.includes(technicianId.toLowerCase().trim())) {
        if (currentUser.name && currentUser.name !== 'Unknown') {
          return currentUser.name;
        }
      }
      // It might be a real name stored directly
      return technicianId;
    }

    // Fallback
    return material.usedBy || material.createdBy || 'System';
  };

  // Fetch article details by ID
  const fetchArticleById = async (articleId: string): Promise<{ name: string; cost: number; details?: any } | null> => {
    if (!articleId) return null;

    try {
      const article = await articlesApi.getById(articleId);
      return {
        name: article.name || `Article #${articleId}`,
        cost: article.costPrice || article.sellPrice || (article as any).purchasePrice || (article as any).salesPrice || 0,
        details: {
          sku: article.sku || (article as any).articleNumber,
          category: article.category,
          description: article.description,
          stock: article.stock || (article as any).stockQuantity,
          supplier: article.supplier,
          location: article.location,
        }
      };
    } catch (error) {
      console.error(`Failed to fetch article ${articleId}:`, error);
      return null;
    }
  };

  // Fetch materials on mount
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await dispatchesApi.getMaterials(dispatchId);
        setMaterials(data);
      } catch (error) {
        console.error('Failed to fetch materials:', error);
      }
    };
    fetchMaterials();
  }, [dispatchId]);

  // Resolve article names and costs
  useEffect(() => {
    const articleIds = new Set<string>(
      materials.map(m => m.articleId).filter(Boolean)
    );

    articleIds.forEach(async (id) => {
      if (!id) return;
      if (articleNamesById[id]) return;
      if (inFlightArticleFetches.current.has(id)) return;

      inFlightArticleFetches.current.add(id);
      try {
        const resolved = await fetchArticleById(id);
        if (resolved) {
          setArticleNamesById(prev => (prev[id] ? prev : { ...prev, [id]: resolved }));
        }
      } finally {
        inFlightArticleFetches.current.delete(id);
      }
    });
  }, [materials, articleNamesById]);

  // Resolve user names
  useEffect(() => {
    const userIds = new Set<string>(
      materials
        .map(m => m.technicianId || m.usedBy || m.createdBy)
        .filter(Boolean)
        .filter(id => isLikelyNumericId(id!))
    );

    userIds.forEach(async (id) => {
      if (!id) return;
      if (userNamesById[id]) return;
      if (inFlightUserFetches.current.has(id)) return;

      inFlightUserFetches.current.add(id);
      try {
        const resolved = await fetchUserNameById(id);
        if (resolved) {
          setUserNamesById(prev => (prev[id] ? prev : { ...prev, [id]: resolved }));
        }
      } finally {
        inFlightUserFetches.current.delete(id);
      }
    });
  }, [materials, userNamesById]);

  // Fetch available materials when modal opens
  useEffect(() => {
    const fetchAvailableMaterials = async () => {
      if (!isMaterialModalOpen) return;
      
      setLoadingMaterials(true);
      try {
        const response = await articlesApi.getAll({ type: 'material', limit: 500 });
        const apiMaterials = response.data || [];
        const mappedMaterials: Article[] = (Array.isArray(apiMaterials) ? apiMaterials : []).map((m: any) => ({
          id: String(m.id),
          name: m.name || '',
          sku: m.sku,
          description: m.description,
          category: m.category || '',
          type: m.type as 'material' | 'service',
          status: m.status || 'available',
          stock: m.stock,
          minStock: m.minStock,
          costPrice: m.costPrice || m.purchasePrice,
          sellPrice: m.sellPrice || m.salesPrice,
          supplier: m.supplier,
          location: m.location,
          subLocation: m.subLocation,
          basePrice: m.basePrice,
          duration: m.duration,
          skillsRequired: m.skillsRequired,
          materialsNeeded: m.materialsNeeded,
          preferredUsers: m.preferredUsers,
          lastUsed: m.lastUsed ? new Date(m.lastUsed) : undefined,
          lastUsedBy: m.lastUsedBy,
          tags: m.tags || [],
          notes: m.notes,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
          createdBy: m.createdBy || 'system',
          modifiedBy: m.modifiedBy || 'system',
        }));
        setAvailableMaterials(mappedMaterials);
      } catch (error) {
        console.error('Failed to fetch materials:', error);
        toast.error('Failed to load materials');
      } finally {
        setLoadingMaterials(false);
      }
    };
    fetchAvailableMaterials();
  }, [isMaterialModalOpen]);

  const handleMaterialAdd = async (materialData: any) => {
    try {
      const currentUser = getCurrentUserData();
      await dispatchesApi.addMaterial(dispatchId, {
        articleId: materialData.articleId,
        articleName: materialData.articleName,
        quantity: materialData.quantity || 1,
        unitPrice: materialData.unitPrice || 0,
        usedBy: currentUser.name,
        notes: materialData.externalComment,
        internalComment: materialData.internalComment,
        replacing: materialData.replacing,
        oldArticleModel: materialData.oldArticleModel,
        description: materialData.externalComment || materialData.internalComment,
        unit: materialData.unit || 'piece',
      });

      // Log activity with propagation to service order, sale, and offer
      await logDispatchActivityWithPropagation(dispatchId, {
        type: 'material_added',
        userName: currentUser.name,
        articleName: materialData.articleName,
        quantity: materialData.quantity || 1,
        amount: (materialData.unitPrice || 0) * (materialData.quantity || 1),
      });

      setIsMaterialModalOpen(false);
      toast.success('Material added successfully');
      
      // Refresh materials
      const data = await dispatchesApi.getMaterials(dispatchId);
      setMaterials(data);
      onDataChange?.();
    } catch (error) {
      console.error('Failed to add material:', error);
      toast.error('Failed to add material');
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (material: MaterialWithResolvedNames) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;
    
    const currentUser = getCurrentUserData();
    
    setIsDeleting(true);
    try {
      await dispatchesApi.deleteMaterial(dispatchId, materialToDelete.id);

      // Log activity with propagation
      await logDispatchActivityWithPropagation(dispatchId, {
        type: 'material_deleted',
        userName: currentUser.name,
        articleName: materialToDelete.resolvedArticleName || 'Unknown',
        quantity: materialToDelete.quantity,
      });

      toast.success('Material deleted successfully');
      
      // Refresh materials
      const data = await dispatchesApi.getMaterials(dispatchId);
      setMaterials(data);
      onDataChange?.();
    } catch (error) {
      console.error('Failed to delete material:', error);
      toast.error('Failed to delete material');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
    }
  };

  // Handle view details
  const handleViewClick = (material: MaterialWithResolvedNames) => {
    setMaterialToView(material);
    setViewDialogOpen(true);
  };

  // Handle edit
  const handleEditClick = (material: MaterialWithResolvedNames) => {
    setMaterialToEdit(material);
    setEditFormData({
      quantity: material.quantity || 1,
      unitPrice: material.resolvedUnitCost || material.unitPrice || material.unitCost || 0,
      description: material.notes || '',
      internalComment: '',
    });
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!materialToEdit) return;
    
    const currentUser = getCurrentUserData();
    
    setIsEditing(true);
    try {
      await dispatchesApi.updateMaterial(dispatchId, materialToEdit.id, {
        quantity: editFormData.quantity,
        unitPrice: editFormData.unitPrice,
        description: editFormData.description || undefined,
        internalComment: editFormData.internalComment || undefined,
      });

      // Log activity with propagation
      await logDispatchActivityWithPropagation(dispatchId, {
        type: 'material_updated',
        userName: currentUser.name,
        articleName: materialToEdit.resolvedArticleName || 'Unknown',
        quantity: editFormData.quantity,
        amount: editFormData.unitPrice * editFormData.quantity,
      });

      toast.success('Material updated successfully');
      
      // Refresh materials
      const data = await dispatchesApi.getMaterials(dispatchId);
      setMaterials(data);
      onDataChange?.();
    } catch (error: any) {
      console.error('Failed to update material:', error);
      toast.error(error.message || 'Failed to update material');
    } finally {
      setIsEditing(false);
      setEditDialogOpen(false);
      setMaterialToEdit(null);
    }
  };

  // Compute materials with resolved names and costs
  const materialsWithDetails = useMemo((): MaterialWithResolvedNames[] => {
    return materials.map(material => {
      const articleInfo = articleNamesById[material.articleId];
      // Use backend unitPrice/totalPrice if available, otherwise fall back to article cost
      const unitCost = material.unitPrice ?? material.unitCost ?? articleInfo?.cost ?? 0;
      
      return {
        ...material,
        resolvedArticleName: material.articleName || articleInfo?.name || `Article #${material.articleId}`,
        resolvedUserName: getUserDisplayName(material),
        resolvedUnitCost: unitCost,
        articleDetails: articleInfo?.details,
      };
    });
  }, [materials, articleNamesById, userNamesById]);

  const totalCost = materialsWithDetails.reduce((sum, m) => {
    const unitCost = m.resolvedUnitCost || 0;
    return sum + (unitCost * m.quantity);
  }, 0);

  // Filter service order materials by installation ID
  const installationMaterials = useMemo(() => {
    if (!installationId || !serviceOrderMaterials || serviceOrderMaterials.length === 0) {
      return [];
    }
    return serviceOrderMaterials.filter(m => m.installationId === installationId);
  }, [installationId, serviceOrderMaterials]);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              {t('materials_tab.materials_used')} ({materials.length})
            </CardTitle>
            {materials.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2" 
                onClick={() => setIsMaterialModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t('materials_tab.add_materials')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {materialsWithDetails.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.material_name')}</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.quantity')}</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.unit_cost')}</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.total_cost')}</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.added_by')}</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialsWithDetails.map((material) => {
                      const unitCost = material.resolvedUnitCost || 0;
                      const materialTotalCost = unitCost * material.quantity;
                      
                      return (
                        <tr key={material.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium">{material.resolvedArticleName}</td>
                          <td className="px-4 py-3 text-sm">{material.quantity} {getUnitLabel((material as any).unit || 'piece', t)}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(unitCost)}</td>
                          <td className="px-4 py-3 text-sm font-medium">{formatCurrency(materialTotalCost)}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{material.resolvedUserName}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewClick(material)}
                                title={t('materials_tab.view_details')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditClick(material)}
                                title={t('materials_tab.edit')}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClick(material)}
                                title={t('materials_tab.delete_action')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Materials Cost Summary */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {t('materials_tab.total_materials')}: <span className="font-medium text-foreground">{materials.length} {t('materials_tab.items')}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t('materials_tab.total_cost')}</p>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(totalCost)}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Wrench className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="text-sm font-medium text-foreground mb-2">{t('materials_tab.no_materials_title')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('materials_tab.no_materials_description')}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setIsMaterialModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t('materials_tab.add_first_material')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installation-Related Materials from Service Order */}
      {installationMaterials.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              {t('materials_tab.installation_materials')} ({installationMaterials.length})
              <Badge variant="secondary" className="ml-2 text-xs">{t('materials_tab.from_service_order')}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('materials_tab.installation_materials_linked')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                     <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.material_name')}</th>
                     <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.sku')}</th>
                     <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.quantity')}</th>
                     <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.unit_price')}</th>
                     <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.total')}</th>
                     <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.status')}</th>
                     <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('materials_tab.source')}</th>
                  </tr>
                </thead>
                <tbody>
                  {installationMaterials.map((material) => (
                    <tr key={material.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{material.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{material.sku || '-'}</td>
                      <td className="px-4 py-3 text-sm">{material.quantity} {getUnitLabel((material as any).unit || 'piece', t)}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(material.unitPrice)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(material.totalPrice)}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="secondary" className="capitalize">
                          {material.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground capitalize">
                        {material.source?.replace('_', ' ') || t('materials_tab.manual')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Installation Materials Cost Summary */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {t('materials_tab.total_installation_materials')}: <span className="font-medium text-foreground">{installationMaterials.length} {t('materials_tab.items')}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('materials_tab.total_value')}</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(installationMaterials.reduce((sum, m) => sum + m.totalPrice, 0))}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AddMaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSubmit={handleMaterialAdd}
        availableMaterials={availableMaterials}
        context="dispatch"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('materials_tab.delete_material')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('materials_tab.delete_material_confirm', { name: materialToDelete?.resolvedArticleName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('materials_tab.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('materials_tab.deleting') : t('materials_tab.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Material Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t('materials_tab.material_details')}
            </DialogTitle>
          </DialogHeader>
          
          {materialToView && (
            <div className="space-y-4">
              {/* Material Name */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium">{materialToView.resolvedArticleName}</h3>
                {materialToView.articleDetails?.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {materialToView.articleDetails.sku}</p>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('materials_tab.quantity')}</p>
                  <p className="font-medium">{materialToView.quantity} {getUnitLabel((materialToView as any).unit || 'piece', t)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('materials_tab.unit_cost')}</p>
                  <p className="font-medium">{formatCurrency(materialToView.resolvedUnitCost || 0)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('materials_tab.total_cost')}</p>
                  <p className="font-medium text-primary">
                    {formatCurrency((materialToView.resolvedUnitCost || 0) * materialToView.quantity)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('materials_tab.status')}</p>
                  <Badge variant={materialToView.isApproved ? "default" : "secondary"}>
                    {materialToView.isApproved ? t('materials_tab.approved') : t('materials_tab.pending')}
                  </Badge>
                </div>
              </div>

              {/* Added By */}
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <User className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('materials_tab.added_by')}</p>
                  <p className="text-sm font-medium">{materialToView.resolvedUserName}</p>
                </div>
                {materialToView.createdAt && (
                  <>
                    <Calendar className="h-4 w-4 text-muted-foreground ml-4" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('materials_tab.date_added')}</p>
                      <p className="text-sm font-medium">
                        {format(new Date(materialToView.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Article Details */}
              {materialToView.articleDetails && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('materials_tab.article_information')}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {materialToView.articleDetails.category && (
                      <div>
                        <span className="text-muted-foreground">{t('materials_tab.category')}:</span>{' '}
                        <span>{materialToView.articleDetails.category}</span>
                      </div>
                    )}
                    {materialToView.articleDetails.stock !== undefined && (
                      <div>
                        <span className="text-muted-foreground">{t('materials_tab.stock')}:</span>{' '}
                        <span>{materialToView.articleDetails.stock}</span>
                      </div>
                    )}
                    {materialToView.articleDetails.supplier && (
                      <div>
                        <span className="text-muted-foreground">{t('materials_tab.supplier')}:</span>{' '}
                        <span>{materialToView.articleDetails.supplier}</span>
                      </div>
                    )}
                    {materialToView.articleDetails.location && (
                      <div>
                        <span className="text-muted-foreground">{t('materials_tab.location')}:</span>{' '}
                        <span>{materialToView.articleDetails.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {materialToView.notes && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider">
                    <FileText className="h-3 w-3" />
                    {t('materials_tab.notes')}
                  </div>
                  <p className="text-sm p-3 bg-muted/30 rounded-lg">{materialToView.notes}</p>
                </div>
              )}

              {/* Description */}
              {materialToView.articleDetails?.description && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('materials_tab.description')}</p>
                  <p className="text-sm text-muted-foreground">{materialToView.articleDetails.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Material Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              {t('materials_tab.edit_material')}
            </DialogTitle>
          </DialogHeader>
          
          {materialToEdit && (
            <div className="space-y-4">
              {/* Material Name (read-only) */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{materialToEdit.resolvedArticleName}</p>
                {materialToEdit.articleDetails?.sku && (
                  <p className="text-xs text-muted-foreground">SKU: {materialToEdit.articleDetails.sku}</p>
                )}
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">{t('materials_tab.quantity')}{materialToEdit?.unit ? ` (${getUnitLabel((materialToEdit as any).unit || 'piece', t)})` : ''}</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min={1}
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData(prev => ({ 
                      ...prev, 
                      quantity: Math.max(1, parseInt(e.target.value) || 1) 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit-price">{t('materials_tab.unit_price')}</Label>
                  <Input
                    id="edit-unit-price"
                    type="number"
                    step="0.01"
                    min={0}
                    value={editFormData.unitPrice}
                    onChange={(e) => setEditFormData(prev => ({ 
                      ...prev, 
                      unitPrice: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>

              {/* Total Cost Preview */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('materials_tab.total_cost')}</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(editFormData.quantity * editFormData.unitPrice)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">{t('materials_tab.notes')}</Label>
                <Textarea
                  id="edit-notes"
                  placeholder={t('materials_tab.notes_placeholder')}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-internal-comment">{t('materials_tab.internal_comment')}</Label>
                <Textarea
                  id="edit-internal-comment"
                  placeholder={t('materials_tab.internal_comment_placeholder')}
                  value={editFormData.internalComment}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, internalComment: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isEditing}>
              {t('materials_tab.cancel')}
            </Button>
            <Button onClick={handleConfirmEdit} disabled={isEditing}>
              {isEditing ? t('materials_tab.saving') : t('materials_tab.save_changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
