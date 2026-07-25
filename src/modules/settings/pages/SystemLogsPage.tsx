import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScrollText } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { SystemLogs } from "../components/SystemLogs";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { useToast } from "@/hooks/use-toast";

export default function SystemLogsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation("settings");
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
    <div className="flex flex-col p-4 sm:p-6">
      <AdminPageHeader
        icon={ScrollText}
        title={t("nav.system", { defaultValue: "System logs" })}
        description={t("systemLogs.description", { defaultValue: "Inspect audit and application logs across the platform." })}
      />
      <SystemLogs />
    </div>
  );
}
