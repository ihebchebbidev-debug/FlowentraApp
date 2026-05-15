import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Users, FileText, ShoppingCart, Wrench, Building2, 
  Calendar, Truck, Settings, Shield, Save, RotateCcw, 
  CheckCircle2, X, Package, FileArchive, Clock, DollarSign, Activity
} from "lucide-react";
import { toast } from "sonner";
import { Role } from "@/types/users";
import { 
  RolePermission, 
  PermissionModule, 
  PermissionAction,
  PERMISSION_MODULES,
  ACTION_LABELS,
  getModulesByCategory
} from "@/types/permissions";
import { permissionsApi } from "@/services/api/permissionsApi";
import { broadcastPermissionChange } from "@/utils/permissionBroadcast";

interface RolePermissionsEditorProps {
  role: Role;
  onClose?: () => void;
}

// Icon mapping for modules
const MODULE_ICONS: Record<PermissionModule, React.ReactNode> = {
  // CRM
  contacts: <Users className="h-4 w-4" />,
  articles: <Package className="h-4 w-4" />,
  offers: <FileText className="h-4 w-4" />,
  sales: <ShoppingCart className="h-4 w-4" />,
  // Field Service
  installations: <Building2 className="h-4 w-4" />,
  service_orders: <Wrench className="h-4 w-4" />,
  dispatches: <Truck className="h-4 w-4" />,
  dispatcher: <Calendar className="h-4 w-4" />,
  // Time & Expenses
  time_tracking: <Clock className="h-4 w-4" />,
  expenses: <DollarSign className="h-4 w-4" />,
  // Inventory
  stock_management: <Package className="h-4 w-4" />,
  // Administration
  users: <Users className="h-4 w-4" />,
  roles: <Shield className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  audit_logs: <Activity className="h-4 w-4" />,
  documents: <FileArchive className="h-4 w-4" />,
  dynamic_forms: <FileText className="h-4 w-4" />,
  ai_assistant: <Activity className="h-4 w-4" />,
  hr: <Users className="h-4 w-4" />,
  purchases: <ShoppingCart className="h-4 w-4" />,
  external_endpoints: <Activity className="h-4 w-4" />,
};

export function RolePermissionsEditor({ role, onClose }: RolePermissionsEditorProps) {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  
  // Local state for permissions being edited
  const [localPermissions, setLocalPermissions] = useState<Map<string, boolean>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch existing permissions for this role
  const { data: existingPermissions = [], isLoading } = useQuery({
    queryKey: ['rolePermissions', role.id],
    queryFn: () => permissionsApi.getRolePermissions(role.id),
  });

  // Reset initialized when role changes
  useEffect(() => {
    setInitialized(false);
  }, [role.id]);

  // Initialize local state when permissions load (only once per role)
  useEffect(() => {
    // Only initialize once when data is first loaded
    if (initialized || isLoading) return;
    
    const permMap = new Map<string, boolean>();
    existingPermissions.forEach(p => {
      permMap.set(`${p.module}:${p.action}`, p.granted);
    });
    setLocalPermissions(permMap);
    setHasChanges(false);
    setInitialized(true);
  }, [existingPermissions, isLoading, initialized]);

  // Mutation to save permissions
  const saveMutation = useMutation({
    mutationFn: async () => {
      const permissions: { module: PermissionModule; action: PermissionAction; granted: boolean }[] = [];
      
      PERMISSION_MODULES.forEach(mod => {
        mod.actions.forEach(action => {
          const key = `${mod.module}:${action}`;
          const granted = localPermissions.get(key) ?? false;
          permissions.push({ module: mod.module, action, granted });
        });
      });

      return permissionsApi.updateRolePermissions({
        roleId: role.id,
        permissions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', role.id] });
      // Also invalidate user permissions so logged-in users get updates
      queryClient.invalidateQueries({ queryKey: ['myPermissions'] });
      // Broadcast to other tabs/windows that permissions have changed
      broadcastPermissionChange();
      toast.success('Permissions saved successfully');
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save permissions');
    },
  });

  // Toggle a single permission
  const togglePermission = (module: PermissionModule, action: PermissionAction) => {
    const key = `${module}:${action}`;
    const currentValue = localPermissions.get(key) ?? false;
    const newMap = new Map(localPermissions);
    newMap.set(key, !currentValue);
    setLocalPermissions(newMap);
    setHasChanges(true);
  };

  // Toggle all permissions for a module
  const toggleAllForModule = (module: PermissionModule, actions: PermissionAction[], grant: boolean) => {
    const newMap = new Map(localPermissions);
    actions.forEach(action => {
      newMap.set(`${module}:${action}`, grant);
    });
    setLocalPermissions(newMap);
    setHasChanges(true);
  };

  // Check if a permission is granted
  const isGranted = (module: PermissionModule, action: PermissionAction): boolean => {
    return localPermissions.get(`${module}:${action}`) ?? false;
  };

  // Check if all permissions for a module are granted
  const allGrantedForModule = (module: PermissionModule, actions: PermissionAction[]): boolean => {
    return actions.every(action => isGranted(module, action));
  };

  // Check if some permissions for a module are granted
  const someGrantedForModule = (module: PermissionModule, actions: PermissionAction[]): boolean => {
    return actions.some(action => isGranted(module, action));
  };

  // Count granted permissions for a module
  const countGrantedForModule = (module: PermissionModule, actions: PermissionAction[]): number => {
    return actions.filter(action => isGranted(module, action)).length;
  };

  // Reset to original
  const resetPermissions = () => {
    const permMap = new Map<string, boolean>();
    existingPermissions.forEach(p => {
      permMap.set(`${p.module}:${p.action}`, p.granted);
    });
    setLocalPermissions(permMap);
    setHasChanges(false);
  };

  // Grant all permissions
  const grantAll = () => {
    const newMap = new Map<string, boolean>();
    PERMISSION_MODULES.forEach(mod => {
      mod.actions.forEach(action => {
        newMap.set(`${mod.module}:${action}`, true);
      });
    });
    setLocalPermissions(newMap);
    setHasChanges(true);
  };

  // Revoke all permissions
  const revokeAll = () => {
    const newMap = new Map<string, boolean>();
    PERMISSION_MODULES.forEach(mod => {
      mod.actions.forEach(action => {
        newMap.set(`${mod.module}:${action}`, false);
      });
    });
    setLocalPermissions(newMap);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b bg-muted/30 gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Permissions for {role.name}</h3>
            <p className="text-xs text-muted-foreground">
              Configure what users with this role can access
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={grantAll}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Grant All
          </Button>
          <Button variant="outline" size="sm" onClick={revokeAll}>
            <X className="h-4 w-4 mr-1" />
            Revoke All
          </Button>
        </div>
      </div>

      {/* Permissions Grid - Scrollable, Grouped by Category */}
      <div className="flex-1 overflow-auto min-h-0 p-4">
        {Object.entries(getModulesByCategory()).map(([category, modules]) => (
          <div key={category} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t(`permissions.categories.${category}`, category)}
              </h4>
              <Separator className="flex-1" />
            </div>
            
            <Accordion type="multiple" defaultValue={modules.slice(0, 2).map(m => m.module)} className="space-y-2">
              {modules.map(mod => {
                const grantedCount = countGrantedForModule(mod.module, mod.actions);
                const totalCount = mod.actions.length;
                const allGranted = allGrantedForModule(mod.module, mod.actions);
                const someGranted = someGrantedForModule(mod.module, mod.actions);

                return (
                  <AccordionItem 
                    key={mod.module} 
                    value={mod.module}
                    className="border rounded-lg px-4 bg-background"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${someGranted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {MODULE_ICONS[mod.module]}
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {t(`permissions.modules.${mod.module}`, mod.label)}
                            <Badge 
                              variant={allGranted ? "default" : someGranted ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {grantedCount}/{totalCount}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-normal">
                            {t(`permissions.descriptions.${mod.module}`, mod.description)}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="pt-2 pb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => toggleAllForModule(mod.module, mod.actions, true)}
                        >
                          {t('selectAll', 'Select All')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => toggleAllForModule(mod.module, mod.actions, false)}
                        >
                          {t('deselectAll', 'Deselect All')}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {mod.actions.map(action => {
                          const granted = isGranted(mod.module, action);
                          return (
                            <div
                              key={action}
                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                granted 
                                  ? 'bg-primary/10 border-primary/30 hover:bg-primary/20' 
                                  : 'bg-muted/30 border-border hover:bg-muted/50'
                              }`}
                              onClick={() => togglePermission(mod.module, action)}
                            >
                              <Checkbox
                                checked={granted}
                                onCheckedChange={() => togglePermission(mod.module, action)}
                                className="pointer-events-none h-4 w-4"
                              />
                              <span className={`text-xs ${granted ? 'font-medium' : 'text-muted-foreground'}`}>
                                {t(`permissions.actions.${action}`, ACTION_LABELS[action])}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-t bg-muted/30 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">
              Unsaved changes
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            variant="outline"
            onClick={resetPermissions}
            disabled={!hasChanges || saveMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </div>
    </div>
  );
}
