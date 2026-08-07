import { useTranslation } from "react-i18next";
import { Shield, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminPageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * Shared header used across pages reached from the Administration workspace
 * (Users, Roles, Documentation, System logs, Background services, …).
 * Keeps every admin page visually consistent while staying subtle.
 */
export function AdminPageHeader({ icon: Icon, title, description, actions }: AdminPageHeaderProps) {
  const { t } = useTranslation("shared");
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-4 sm:p-5 mb-4">
      <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <Badge
              variant="outline"
              className="mb-1.5 gap-1 border-primary/25 bg-primary/5 text-[10px] font-medium uppercase tracking-wide text-primary"
            >
              <Shield className="h-3 w-3" />
              {t("workspace.workspaces.administration", { defaultValue: "Administration" })}
            </Badge>
            <h1 className="text-lg font-semibold leading-tight text-foreground truncate">{title}</h1>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
