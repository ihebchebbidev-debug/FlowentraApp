import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScrollText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/usePermissions";
import { SystemLogs } from "../components/SystemLogs";
import { useToast } from "@/hooks/use-toast";

export default function SystemLogsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation("settings");
  const { isMainAdmin, hasPermission, isLoading } = usePermissions();

  const canViewLogs = isMainAdmin || hasPermission('audit_logs', 'read');

  useEffect(() => {
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

  if (isLoading || !canViewLogs) {
    return null;
  }

  return (
    <div className="flex flex-col p-4 sm:p-6">
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" />
            {t("nav.system", { defaultValue: "System logs" })}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("systemLogs.description", { defaultValue: "Inspect audit and application logs across the platform." })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <SystemLogs />
        </CardContent>
      </Card>
    </div>
  );
}
