import { useState, useEffect, useRef, useMemo } from "react";
import { getAuthHeaders } from '@/utils/apiHeaders';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, Plus, Eye, Trash2, User, Calendar, FileText, Pencil 
} from "lucide-react";
import { AddMaterialModal } from "../../components/AddMaterialModal";
import { dispatchesApi } from "@/services/api/dispatchesApi";
import { serviceOrdersApi } from "@/services/api/serviceOrdersApi";
import { articlesApi } from "@/services/api/articlesApi";
import type { Article } from "@/modules/inventory-services/types";
import { toast } from "sonner";
import { useCurrency } from "@/shared/hooks/useCurrency";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


import { API_URL } from '@/config/api';
import { getUnitLabel } from "@/constants/units";

interface Dispatch {
  id: number;
  dispatchNumber?: string;
  status?: string;
}

interface MaterialEntry {
  id: number;
  serviceOrderId?: number;
  dispatchId?: number;
  articleId?: number | string;
  articleName?: string;
  name?: string;
  sku?: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  unitCost?: number;
  totalPrice?: number;
  totalCost?: number;
  usedBy?: string;
  technicianId?: string;
  createdBy?: string;
  createdAt?: string;
  usedAt?: string;
  notes?: string;
  status?: string;
  source?: string;
  isApproved?: boolean;
  internalComment?: string;
  externalComment?: string;
  replacing?: boolean;
  oldArticleModel?: string;
  oldArticleStatus?: string;
  installationId?: string;
  installationName?: string;
  unit?: string;
}

interface AggregatedMaterial extends MaterialEntry {
  sourceType: 'service-order' | 'dispatch';
  dispatchNumber?: string;
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
  installationId?: string;
  installationName?: string;
}

interface ServiceOrder {
  id: number | string;
  orderNumber?: string;
}

interface MaterialsTabProps {
  serviceOrder: ServiceOrder;
  onUpdate?: () => void;
}

export function MaterialsTab({ serviceOrder, onUpdate }: MaterialsTabProps) {
  const [aggregatedMaterials, setAggregatedMaterials] = useState<AggregatedMaterial[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Helper to get numeric ID
  const serviceOrderId = typeof serviceOrder.id === 'string' ? Number(serviceOrder.id) : serviceOrder.id;
  
  // Modal states
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<Article[]>([]);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<AggregatedMaterial | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // View details state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [materialToView, setMaterialToView] = useState<AggregatedMaterial | null>(null);

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<AggregatedMaterial | null>(null);
  const [editFormData, setEditFormData] = useState({
    quantity: 1,
    unitPrice: 0,
    description: '',
    internalComment: '',
    externalComment: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  
  
  // Caches for resolved data
  const [articleNamesById, setArticleNamesById] = useState<Record<string, { name: string; cost: number; details?: any }>>({});
  const [userNamesById, setUserNamesById] = useState<Record<string, string>>({});
  const inFlightArticleFetches = useRef<Set<string>>(new Set());
  const inFlightUserFetches = useRef<Set<string>>(new Set());

  const { format: formatCurrency } = useCurrency();

  // Get current user data
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

  const isLikelyNumericId = (value: string): boolean => {
    if (!value) return false;
    return /^\d+$/.test(value.trim());
  };

  // Fetch user name by ID
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
    } catch { /* ignore */ }

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
    } catch { /* ignore */ }

    return null;
  };

  // Get display name for user
  const getUserDisplayName = (material: MaterialEntry): string => {
    const technicianId = material.technicianId || material.usedBy || material.createdBy;
    const currentUser = getCurrentUserData();

    if (technicianId && userNamesById[technicianId]) {
      return userNamesById[technicianId];
    }

    if (technicianId && technicianId === currentUser.id) {
      return currentUser.name;
    }

    if (technicianId && !isLikelyNumericId(technicianId)) {
      const genericPlaceholders = ['user name', 'unknown', 'technician', 'system'];
      if (genericPlaceholders.includes(technicianId.toLowerCase().trim())) {
        if (currentUser.name && currentUser.name !== 'Unknown') {
          return currentUser.name;
        }
      }
      return technicianId;
    }

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

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch dispatches and service order materials in parallel
        const [dispatchList, soMaterials] = await Promise.all([
          serviceOrdersApi.getDispatches(serviceOrderId),
          serviceOrdersApi.getMaterials(serviceOrderId),
        ]);

        setDispatches(dispatchList || []);

        // The backend already aggregates materials from dispatches
        // But let's also ensure we have source information
        const allMaterials: AggregatedMaterial[] = [];

        // Process materials from service order API (may include dispatch materials)
        (soMaterials || []).forEach((material: any) => {
          const isFromDispatch = !!material.dispatchId;
          const dispatch = isFromDispatch 
            ? dispatchList.find((d: Dispatch) => d.id === material.dispatchId)
            : null;

          allMaterials.push({
            ...material,
            sourceType: isFromDispatch ? 'dispatch' : 'service-order',
            dispatchNumber: dispatch?.dispatchNumber || (material.dispatchId ? `Dispatch #${material.dispatchId}` : undefined),
          });
        });

        // If backend doesn't aggregate, fetch from each dispatch
        if (allMaterials.filter(m => m.sourceType === 'dispatch').length === 0 && dispatchList.length > 0) {
          const dispatchMaterialPromises = dispatchList.map(async (dispatch: Dispatch) => {
            try {
              const materials = await dispatchesApi.getMaterials(dispatch.id);
              return materials.map((m: any) => ({
                ...m,
                sourceType: 'dispatch' as const,
                dispatchId: dispatch.id,
                dispatchNumber: dispatch.dispatchNumber || `Dispatch #${dispatch.id}`,
              }));
            } catch {
              return [];
            }
          });

          const dispatchMaterialResults = await Promise.all(dispatchMaterialPromises);
          dispatchMaterialResults.flat().forEach(m => allMaterials.push(m));
        }

        setAggregatedMaterials(allMaterials);
      } catch (error) {
        console.error('Failed to fetch materials:', error);
        toast.error('Failed to load materials');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [serviceOrder.id]);

  // Resolve article names and costs
  useEffect(() => {
    const articleIds = new Set<string>(
      aggregatedMaterials.map(m => String(m.articleId)).filter(Boolean)
    );

    articleIds.forEach(async (id) => {
      if (!id || id === 'undefined') return;
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
  }, [aggregatedMaterials, articleNamesById]);

  // Resolve user names
  useEffect(() => {
    const userIds = new Set<string>(
      aggregatedMaterials
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
  }, [aggregatedMaterials, userNamesById]);

  // Fetch available materials when modal opens
  useEffect(() => {
    const fetchAvailableMaterials = async () => {
      if (!isMaterialModalOpen) return;
      
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
      }
    };
    fetchAvailableMaterials();
  }, [isMaterialModalOpen]);

  // Compute materials with resolved names
  const materialsWithDetails = useMemo((): AggregatedMaterial[] => {
    return aggregatedMaterials.map(material => {
      const articleInfo = articleNamesById[String(material.articleId)];
      const unitCost = material.unitPrice ?? material.unitCost ?? articleInfo?.cost ?? 0;
      
      return {
        ...material,
        resolvedArticleName: material.articleName || material.name || articleInfo?.name || `Article #${material.articleId}`,
        resolvedUserName: getUserDisplayName(material),
        resolvedUnitCost: unitCost,
        articleDetails: articleInfo?.details,
      };
    });
  }, [aggregatedMaterials, articleNamesById, userNamesById]);


  // Calculate totals from all materials
  const totalCost = materialsWithDetails.reduce((sum, m) => {
    const unitCost = m.resolvedUnitCost || 0;
    return sum + (unitCost * m.quantity);
  }, 0);

  // Handle add material
  const handleMaterialAdd = async (materialData: any) => {
    try {
      const currentUser = getCurrentUserData();
      await serviceOrdersApi.addMaterial(serviceOrderId, {
        articleId: materialData.articleId || undefined,
        name: materialData.articleName || materialData.name || 'Unknown Material',
        sku: materialData.sku || materialData.articleSku || undefined,
        description: materialData.description || undefined,
        quantity: materialData.quantity || 1,
        unitPrice: materialData.unitPrice || 0,
        internalComment: materialData.internalComment || undefined,
        externalComment: materialData.externalComment || undefined,
        replacing: materialData.replacing || false,
        oldArticleModel: materialData.oldArticleModel || undefined,
        oldArticleStatus: materialData.oldArticleStatus || undefined,
        unit: materialData.unit || 'piece',
      });
      setIsMaterialModalOpen(false);
      toast.success('Material added successfully');
      
      // Refresh
      const soMaterials = await serviceOrdersApi.getMaterials(serviceOrderId);
      const dispatchList = dispatches;
      
      const allMaterials: AggregatedMaterial[] = [];
      (soMaterials || []).forEach((material: any) => {
        const isFromDispatch = !!material.dispatchId;
        const dispatch = isFromDispatch 
          ? dispatchList.find((d: Dispatch) => d.id === material.dispatchId)
          : null;
        allMaterials.push({
          ...material,
          sourceType: isFromDispatch ? 'dispatch' : 'service-order',
          dispatchNumber: dispatch?.dispatchNumber || (material.dispatchId ? `Dispatch #${material.dispatchId}` : undefined),
        });
      });
      setAggregatedMaterials(allMaterials);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add material:', error);
      toast.error('Failed to add material');
    }
  };

  // Handle delete
  const handleDeleteClick = (material: AggregatedMaterial) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;
    
    setIsDeleting(true);
    try {
      // Context-aware deletion
      if (materialToDelete.sourceType === 'dispatch' && materialToDelete.dispatchId) {
        await dispatchesApi.deleteMaterial(materialToDelete.dispatchId, materialToDelete.id);
      } else {
        await serviceOrdersApi.deleteMaterial(serviceOrderId, materialToDelete.id);
      }
      
      toast.success('Material deleted successfully');
      
      // Refresh
      setAggregatedMaterials(prev => prev.filter(m => m.id !== materialToDelete.id));
      onUpdate?.();
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
  const handleViewClick = (material: AggregatedMaterial) => {
    setMaterialToView(material);
    setViewDialogOpen(true);
  };

  // Handle edit
  const handleEditClick = (material: AggregatedMaterial) => {
    setMaterialToEdit(material);
    setEditFormData({
      quantity: material.quantity || 1,
      unitPrice: material.resolvedUnitCost || material.unitPrice || material.unitCost || 0,
      description: material.description || '',
      internalComment: material.internalComment || '',
      externalComment: material.externalComment || '',
    });
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!materialToEdit) return;
    
    setIsEditing(true);
    try {
      // Context-aware update
      if (materialToEdit.sourceType === 'dispatch' && materialToEdit.dispatchId) {
        await dispatchesApi.updateMaterial(materialToEdit.dispatchId, materialToEdit.id, {
          quantity: editFormData.quantity,
          unitPrice: editFormData.unitPrice,
          description: editFormData.description || undefined,
          internalComment: editFormData.internalComment || undefined,
        });
      } else {
        await serviceOrdersApi.updateMaterial(serviceOrderId, materialToEdit.id, {
          quantity: editFormData.quantity,
          unitPrice: editFormData.unitPrice,
          description: editFormData.description || undefined,
          internalComment: editFormData.internalComment || undefined,
          externalComment: editFormData.externalComment || undefined,
        });
      }
      
      toast.success('Material updated successfully');
      
      // Refresh - update local state
      setAggregatedMaterials(prev => prev.map(m => {
        if (m.id === materialToEdit.id && m.sourceType === materialToEdit.sourceType) {
          return {
            ...m,
            quantity: editFormData.quantity,
            unitPrice: editFormData.unitPrice,
            unitCost: editFormData.unitPrice,
            description: editFormData.description,
            internalComment: editFormData.internalComment,
            externalComment: editFormData.externalComment,
            resolvedUnitCost: editFormData.unitPrice,
          };
        }
        return m;
      }));
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to update material:', error);
      toast.error(error.message || 'Failed to update material');
    } finally {
      setIsEditing(false);
      setEditDialogOpen(false);
      setMaterialToEdit(null);
    }
  };


  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="h-9 w-28 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/60 rounded w-full animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Materials Used ({materialsWithDetails.length})
            </CardTitle>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2"
              onClick={() => setIsMaterialModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Material
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {materialsWithDetails.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Material</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Installation</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Qty</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Unit Cost</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialsWithDetails.map((material) => {
                      const unitCost = material.resolvedUnitCost || 0;
                      const materialTotalCost = unitCost * material.quantity;
                      
                      return (
                        <tr key={`${material.sourceType}-${material.id}`} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium">{material.resolvedArticleName}</div>
                            {material.sku && (
                              <div className="text-xs text-muted-foreground">SKU: {material.sku}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {material.installationName ? (
                              <a 
                                href={`/dashboard/field/installations/${material.installationId}`}
                                className="text-primary hover:underline"
                              >
                                {material.installationName}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">{material.quantity} {getUnitLabel(material.unit || 'piece')}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(unitCost)}</td>
                          <td className="px-4 py-3 text-sm font-medium">{formatCurrency(materialTotalCost)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewClick(material)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditClick(material)}
                                title="Edit material"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClick(material)}
                                title="Delete material"
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

              {/* Cost Summary */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-end items-center">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(totalCost)}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Package className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="text-sm font-medium text-foreground mb-2">
                No Materials Used Yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Track materials and parts by adding your first entry
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setIsMaterialModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Your First Material
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Material Modal */}
      <AddMaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSubmit={handleMaterialAdd}
        availableMaterials={availableMaterials}
        context="service_order"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{materialToDelete?.resolvedArticleName}"? 
              {materialToDelete?.sourceType === 'dispatch' && (
                <span className="block mt-1 text-warning">
                  This material is from {materialToDelete.dispatchNumber} and will be removed from that dispatch.
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Material Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Material Details
            </DialogTitle>
          </DialogHeader>
          
          {materialToView && (
            <div className="space-y-4">
              {/* Material Name */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium">{materialToView.resolvedArticleName}</h3>
                {materialToView.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {materialToView.sku}</p>
                )}
                <Badge 
                  variant={materialToView.sourceType === 'dispatch' ? 'default' : 'secondary'} 
                  className="mt-2"
                >
                  {materialToView.sourceType === 'dispatch' 
                    ? materialToView.dispatchNumber 
                    : 'Service Order (Direct)'}
                </Badge>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</p>
                  <p className="font-medium">{materialToView.quantity}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Unit Cost</p>
                  <p className="font-medium">{formatCurrency(materialToView.resolvedUnitCost || 0)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Cost</p>
                  <p className="font-medium text-primary">
                    {formatCurrency((materialToView.resolvedUnitCost || 0) * materialToView.quantity)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge variant={materialToView.isApproved ? "default" : "secondary"}>
                    {materialToView.isApproved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              </div>

              {/* Installation Info */}
              {materialToView.installationId && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Installation</p>
                  <a 
                    href={`/dashboard/field/installations/${materialToView.installationId}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {materialToView.installationName || `Installation #${materialToView.installationId}`}
                  </a>
                </div>
              )}

              {/* Added By */}
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <User className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Added By</p>
                  <p className="text-sm font-medium">{materialToView.resolvedUserName}</p>
                </div>
                {(materialToView.createdAt || materialToView.usedAt) && (
                  <>
                    <Calendar className="h-4 w-4 text-muted-foreground ml-4" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date Added</p>
                      <p className="text-sm font-medium">
                        {format(new Date(materialToView.createdAt || materialToView.usedAt!), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Article Details */}
              {materialToView.articleDetails && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Article Information</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {materialToView.articleDetails.category && (
                      <div>
                        <span className="text-muted-foreground">Category:</span>{' '}
                        <span>{materialToView.articleDetails.category}</span>
                      </div>
                    )}
                    {materialToView.articleDetails.stock !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Stock:</span>{' '}
                        <span>{materialToView.articleDetails.stock}</span>
                      </div>
                    )}
                    {materialToView.articleDetails.supplier && (
                      <div>
                        <span className="text-muted-foreground">Supplier:</span>{' '}
                        <span>{materialToView.articleDetails.supplier}</span>
                      </div>
                    )}
                    {materialToView.articleDetails.location && (
                      <div>
                        <span className="text-muted-foreground">Location:</span>{' '}
                        <span>{materialToView.articleDetails.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {(materialToView.notes || materialToView.internalComment || materialToView.externalComment) && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider">
                    <FileText className="h-3 w-3" />
                    Notes
                  </div>
                  <p className="text-sm p-3 bg-muted/30 rounded-lg">
                    {materialToView.notes || materialToView.internalComment || materialToView.externalComment}
                  </p>
                </div>
              )}

              {/* Description */}
              {(materialToView.description || materialToView.articleDetails?.description) && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {materialToView.description || materialToView.articleDetails?.description}
                  </p>
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
              <Pencil className="h-5 w-5 text-primary" />
              Edit Material
            </DialogTitle>
          </DialogHeader>
          
          {materialToEdit && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{materialToEdit.resolvedArticleName}</p>
                <Badge variant={materialToEdit.sourceType === 'dispatch' ? 'default' : 'secondary'} className="mt-1">
                  {materialToEdit.sourceType === 'dispatch' ? materialToEdit.dispatchNumber : 'Service Order'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-qty">Quantity</Label>
                  <Input
                    id="edit-qty"
                    type="number"
                    min={1}
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Unit Price</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    min={0}
                    value={editFormData.unitPrice}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Cost</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(editFormData.quantity * editFormData.unitPrice)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-desc">Notes</Label>
                <Textarea
                  id="edit-desc"
                  placeholder="Add notes..."
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isEditing}>
              Cancel
            </Button>
            <Button onClick={handleConfirmEdit} disabled={isEditing}>
              {isEditing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
