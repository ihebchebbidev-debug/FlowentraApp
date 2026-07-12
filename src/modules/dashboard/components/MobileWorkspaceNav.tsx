import { useState, useMemo, useEffect, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { Menu, ChevronLeft, PackageOpen, Sun, Moon, Monitor, LogOut, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LogoDots } from "./LogoDots";
import {
  WORKSPACES,
  findWorkspaceForPath,
  type Workspace,
  type WorkspaceModule,
} from "./workspaces.config";
import { usePlugins } from "@/modules/shared/plugins";

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Comp className={className} />;
}

function ThemePickerMobile() {
  const { theme, setTheme } = useTheme();
  const opts: { value: Theme; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "light", label: "Light", Icon: Sun },
    { value: "dark", label: "Dark", Icon: Moon },
    { value: "system", label: "Auto", Icon: Monitor },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 rounded-md bg-muted/50 p-1">
      {opts.map((o) => {
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setTheme(o.value)}
            aria-pressed={active}
            aria-label={`${o.label} theme`}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded px-1 py-1.5 text-[10px] font-medium transition-colors",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <o.Icon className="h-4 w-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

type MobileView =
  | { level: "workspaces" }
  | { level: "modules"; workspace: Workspace };

function visibleModules(
  modules: WorkspaceModule[],
  isEnabled: (code: string | undefined | null) => boolean
) {
  return modules.filter((m) => !m.pluginCode || isEnabled(m.pluginCode));
}

export function MobileWorkspaceNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isEnabled } = usePlugins();
  const { user, logout } = useAuth();
  const companyLogo = useCompanyLogo();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      setOpen(false);
      navigate("/login");
    }
  };


  const currentWs = useMemo(
    () => findWorkspaceForPath(location.pathname),
    [location.pathname]
  );

  // View stack — start on the workspace grid every time the drawer opens.
  const [view, setView] = useState<MobileView>({ level: "workspaces" });

  useEffect(() => {
    if (open) {
      // When opening, if we're already inside a workspace, jump straight to its modules.
      setView(currentWs ? { level: "modules", workspace: currentWs } : { level: "workspaces" });
    }
  }, [open, currentWs]);

  const goBack = useCallback(() => {
    setView((v) => (v.level === "modules" ? { level: "workspaces" } : v));
  }, []);

  // Intercept the browser/Android back button while the drawer is open so
  // "back" collapses one level (module list → workspace list → close drawer)
  // instead of navigating the underlying page.
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ __wsNav: true }, "");
    const onPop = (e: PopStateEvent) => {
      e.preventDefault?.();
      if (view.level === "modules") {
        setView({ level: "workspaces" });
        window.history.pushState({ __wsNav: true }, "");
      } else {
        setOpen(false);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, view.level]);

  const openWorkspace = (ws: Workspace) => {
    setView({ level: "modules", workspace: ws });
  };

  const openModule = (m: WorkspaceModule) => {
    setOpen(false);
    setView({ level: "workspaces" });
    navigate(m.url);
  };

  const headerLabel = view.level === "workspaces" ? "Workspaces" : view.workspace.label;
  const headerIcon = view.level === "workspaces" ? null : view.workspace.icon;

  const modulesForView =
    view.level === "modules" ? visibleModules(view.workspace.modules, isEnabled) : [];

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background px-3">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="relative flex h-20 shrink-0 items-center justify-center overflow-hidden border-b border-border px-3">
              <LogoDots />
              {companyLogo ? (
                <img src={companyLogo} alt="Company Logo" className="relative z-10 max-h-14 max-w-full object-contain" />
              ) : (
                <Icons.LayoutGrid className="relative z-10 h-8 w-8 text-primary" aria-hidden="true" />
              )}
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border px-2 py-3">
              {view.level === "modules" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goBack}
                  aria-label="Back to workspaces"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              ) : (
                <div className="w-10" aria-hidden />
              )}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {headerIcon && <Icon name={headerIcon} className="h-5 w-5 text-primary" />}
                <h2 className="truncate text-base font-semibold">{headerLabel}</h2>
              </div>
            </div>


            {/* Breadcrumb */}
            {view.level === "modules" && (
              <div className="flex items-center gap-1 border-b border-border/60 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
                <button
                  type="button"
                  onClick={goBack}
                  className="hover:text-foreground hover:underline"
                >
                  Workspaces
                </button>
                <span>/</span>
                <span className="text-foreground">{view.workspace.label}</span>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3">
              {view.level === "workspaces" ? (
                <div className="grid grid-cols-2 gap-2">
                  {WORKSPACES.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => openWorkspace(ws)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:bg-accent",
                        currentWs?.id === ws.id && "border-primary/40 bg-primary/5"
                      )}
                    >
                      <Icon name={ws.icon} className="h-6 w-6 text-primary" />
                      <span className="text-xs font-medium">{ws.label}</span>
                    </button>
                  ))}
                </div>
              ) : modulesForView.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {modulesForView.map((m) => {
                    const base = m.url.split("?")[0];
                    const active =
                      location.pathname === base || location.pathname.startsWith(base + "/");
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => openModule(m)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent",
                          active && "border-primary/40 bg-primary/5"
                        )}
                      >
                        <Icon name={m.icon} className="h-5 w-5 text-primary" />
                        <span className="font-medium">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                  <PackageOpen className="h-10 w-10 text-muted-foreground/60" />
                  <p className="text-sm font-medium">No modules available</p>
                  <p className="text-xs text-muted-foreground">
                    All modules in this workspace are currently disabled.
                  </p>
                  <NavLink
                    to="/dashboard/settings?tab=plugins"
                    onClick={() => setOpen(false)}
                    className="mt-1 text-xs font-medium text-primary hover:underline"
                  >
                    Manage plugins
                  </NavLink>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={goBack}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back to workspaces
                  </Button>
                </div>
              )}
            </div>

            {/* Footer — user + theme */}
            <div className="mt-auto shrink-0 border-t border-border bg-background/60 p-3 space-y-3">
              <ThemePickerMobile />
              <div className="flex items-center gap-2">
                <UserAvatar
                  src={user?.profilePictureUrl}
                  name={`${user?.firstName || ""} ${user?.lastName || ""}`}
                  seed={user?.id ?? "user"}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {user?.firstName || "User"} {user?.lastName || ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setOpen(false);
                    navigate("/dashboard/settings");
                  }}
                  aria-label="Settings"
                >
                  <SettingsIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 items-center gap-2">
        {currentWs && (
          <>
            <Icon name={currentWs.icon} className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-sm font-semibold">{currentWs.label}</span>
          </>
        )}
      </div>
    </header>
  );
}

export default MobileWorkspaceNav;
