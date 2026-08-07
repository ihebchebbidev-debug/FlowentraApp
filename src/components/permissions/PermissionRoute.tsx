import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionModule, PermissionAction } from "@/types/permissions";
import { useToast } from "@/hooks/use-toast";

interface PermissionRouteProps {
  children: React.ReactNode;
  module: PermissionModule;
  action?: PermissionAction;
  redirectTo?: string;
  showToast?: boolean;
}

/**
 * A wrapper component that protects routes based on user permissions.
 * Redirects users without the required permission back to a safe location.
 */
export function PermissionRoute({
  children,
  module,
  action = 'read',
  redirectTo = '/dashboard',
  showToast = true,
}: PermissionRouteProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMainAdmin, hasPermission, isLoading } = usePermissions();

  const hasAccess = isMainAdmin || hasPermission(module, action);
  

  useEffect(() => {
    // MainAdmin always has full access - skip loading check
    if (isMainAdmin) return;
    if (isLoading) return;

    if (!hasAccess) {
      if (showToast) {
        toast({
          title: "Access Denied",
          description: `You don't have permission to access this page.`,
          variant: "destructive",
        });
      }
      navigate(redirectTo, { replace: true });
    }
  }, [hasAccess, isLoading, isMainAdmin, navigate, toast, redirectTo, showToast, module, action]);

  // MainAdmin always renders immediately
  if (isMainAdmin) {
    return <>{children}</>;
  }

  // Show nothing while loading or if no permission
  if (isLoading || !hasAccess) {
    return null;
  }

  return <>{children}</>;
}

export default PermissionRoute;
