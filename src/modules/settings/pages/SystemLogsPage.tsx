import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { SystemLogs } from "../components/SystemLogs";
import { useToast } from "@/hooks/use-toast";

export default function SystemLogsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMainAdmin, hasPermission, isLoading } = usePermissions();
  
  // Check if user has permission to view logs (audit_logs:read)
  const canViewLogs = isMainAdmin || hasPermission('audit_logs', 'read');

  useEffect(() => {
    // Wait for permissions to load before checking
    if (isLoading) return;
    
    if (!canViewLogs) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view system logs.",
        variant: "destructive"
      });
      navigate('/dashboard/settings', { replace: true });
    }
  }, [canViewLogs, isLoading, navigate, toast]);

  // Show nothing while loading or if no permission
  if (isLoading || !canViewLogs) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <SystemLogs />
    </div>
  );
}
