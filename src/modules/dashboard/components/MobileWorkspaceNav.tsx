import { useState, useMemo, useEffect, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { Menu, ChevronRight, ChevronLeft, Sun, Moon, Monitor, LogOut, Settings as SettingsIcon, User as UserIcon, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useAiAssistantAvailable } from "@/hooks/useAiAssistantAvailable";
import { AiLogoIcon } from "@/components/ai-assistant/AiLogoIcon";
import { AiAssistantSidebar } from "@/components/ai-assistant/AiAssistantSidebar";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { UserAvatar } from "@/components/ui/user-avatar";
import { GlobalSearch } from "@/components/ui/global-search";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogoDots } from "./LogoDots";
import {
  WORKSPACES,
  findWorkspaceForPath,
  type Workspace,
} from "./workspaces.config";

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

export function MobileWorkspaceNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const companyLogo = useCompanyLogo();
  const [open, setOpen] = useState(false);
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);
  const NO_SECONDARY = useMemo(() => new Set(["explore", "settings", "lookups"]), []);
  const { unreadCount } = useNotifications();
  const aiAssistantAvailable = useAiAssistantAvailable();
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);

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

  // Intercept the browser/Android back button while the drawer is open so
  // "back" closes the drawer instead of navigating the underlying page.
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ __wsNav: true }, "");
    const onPop = (e: PopStateEvent) => {
      e.preventDefault?.();
      setOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  const openWorkspace = (ws: Workspace) => {
    // Workspaces without a submenu navigate immediately.
    if (NO_SECONDARY.has(ws.id) || !ws.modules || ws.modules.length === 0) {
      setOpen(false);
      setActiveSubmenuId(null);
      navigate(ws.landingUrl);
      return;
    }
    // Otherwise reveal the submenu inside the drawer.
    setActiveSubmenuId(ws.id);
  };

  const activeSubmenuWs = useMemo(
    () => WORKSPACES.find((w) => w.id === activeSubmenuId) ?? null,
    [activeSubmenuId]
  );

  // Reset submenu view whenever the drawer closes.
  useEffect(() => {
    if (!open) setActiveSubmenuId(null);
  }, [open]);


  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background px-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button data-tour="mobile-menu" variant="ghost" size="icon" aria-label="Open navigation">
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
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              {activeSubmenuWs ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 -ml-1"
                    aria-label="Back to workspaces"
                    onClick={() => setActiveSubmenuId(null)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Icon name={activeSubmenuWs.icon} className="h-4 w-4 text-primary" />
                  <h2 className="truncate text-base font-semibold">{activeSubmenuWs.label}</h2>
                </>
              ) : (
                <h2 className="truncate text-base font-semibold">Workspaces</h2>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-2">
              {activeSubmenuWs ? (
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setActiveSubmenuId(null);
                      navigate(activeSubmenuWs.landingUrl);
                    }}
                    className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <Icon name={activeSubmenuWs.icon} className="h-5 w-5 text-primary" />
                    <span className="flex-1 font-medium">Overview</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {activeSubmenuWs.modules.map((m) => {
                    const active = location.pathname.startsWith(m.url);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          setActiveSubmenuId(null);
                          navigate(m.url);
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent",
                          active && "border-primary/40 bg-primary/5"
                        )}
                      >
                        <Icon name={m.icon} className="h-5 w-5 text-primary" />
                        <span className="flex-1 font-medium">{m.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {WORKSPACES.map((ws) => {
                    const active = currentWs?.id === ws.id;
                    const hasSubmenu = !NO_SECONDARY.has(ws.id) && ws.modules.length > 0;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => openWorkspace(ws)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent",
                          active && "border-primary/40 bg-primary/5"
                        )}
                        aria-haspopup={hasSubmenu ? "menu" : undefined}
                      >
                        <Icon name={ws.icon} className="h-5 w-5 text-primary" />
                        <span className="flex-1 font-medium">{ws.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}
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

      {/* Global search — always visible in mobile header */}
      <div className="min-w-0 flex-1">
        <GlobalSearch />
      </div>

      {/* Right-side controls — pinned to the right corner */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {/* Ask AI */}
        {aiAssistantAvailable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Ask AI"
            onClick={() => setAiSidebarOpen(true)}
          >
            <AiLogoIcon size={18} variant="auto" />
          </Button>
        )}

        {/* Notifications — mirrors desktop header */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          aria-label="Notifications"
          onClick={() => navigate("/dashboard/notifications")}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] leading-none px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>

        {/* User avatar dropdown */}
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full p-0 overflow-hidden ring-1 ring-border"
            aria-label="User menu"
          >
            <UserAvatar
              src={user?.profilePictureUrl}
              name={`${user?.firstName || ""} ${user?.lastName || ""}`}
              seed={user?.id ?? "user"}
              size="md"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-60 p-1.5">
          <div className="px-2.5 py-2.5">
            <div className="flex items-center gap-3">
              <UserAvatar
                src={user?.profilePictureUrl}
                name={`${user?.firstName || ""} ${user?.lastName || ""}`}
                seed={user?.id ?? "user"}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground mt-0.5">{user?.email}</p>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="text-xs gap-2 px-2.5 py-2 rounded-md cursor-pointer">
            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="text-xs gap-2 px-2.5 py-2 rounded-md cursor-pointer">
            <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem onClick={handleSignOut} className="text-xs gap-2 px-2.5 py-2 rounded-md cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {aiAssistantAvailable && (
        <AiAssistantSidebar isOpen={aiSidebarOpen} onClose={() => setAiSidebarOpen(false)} />
      )}
    </header>
  );
}

export default MobileWorkspaceNav;
