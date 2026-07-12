import { useMemo, useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { PackageOpen, Settings as SettingsIcon, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  WORKSPACES,
  findWorkspaceForPath,
  type Workspace,
  type WorkspaceModule,
  type SidebarModuleItemProps,
} from "./workspaces.config";
import { usePlugins } from "@/modules/shared/plugins";
import { LogoDots } from "./LogoDots";

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Comp className={className} />;
}

/**
 * Accepts the shared SidebarModuleItemProps shape — `pluginCode` is optional
 * so callers can spread a full WorkspaceModule without TS complaints. Plugin
 * gating is applied upstream in `visibleModules`, so this component just renders.
 */
function ModuleItem({
  url,
  icon,
  label,
  active = false,
  linkRef,
}: SidebarModuleItemProps & { linkRef?: React.Ref<HTMLAnchorElement> }) {
  return (
    <NavLink
      ref={linkRef}
      to={url}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-base transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-foreground/80 hover:bg-accent/50 hover:text-foreground"
      )}
    >
      <Icon name={icon} className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

/** Filter modules by plugin activation (empty pluginCode = always visible). */
function visibleModules(
  modules: WorkspaceModule[],
  isEnabled: (code: string | undefined | null) => boolean
) {
  return modules.filter((m) => !m.pluginCode || isEnabled(m.pluginCode));
}

/** Inline theme picker rendered inside the user account dropdown. */
function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const opts: { value: Theme; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "light", label: "Light", Icon: Sun },
    { value: "dark", label: "Dark", Icon: Moon },
    { value: "system", label: "Auto", Icon: Monitor },
  ];
  return (
    <div className="px-2 py-1.5">
      <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Theme
      </p>
      <div className="grid grid-cols-3 gap-1 rounded-md bg-muted/50 p-1">
        {opts.map((o) => {
          const active = theme === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTheme(o.value);
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded px-1 py-1.5 text-[10px] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={active}
              aria-label={`${o.label} theme`}
            >
              <o.Icon className="h-4 w-4" />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WorkspaceSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isEnabled } = usePlugins();
  const companyLogo = useCompanyLogo();
  const { user, logout } = useAuth();

  const detected = useMemo(
    () => findWorkspaceForPath(location.pathname),
    [location.pathname]
  );

  // Which workspace's module sidebar is shown. Seed from the current route so
  // route navigation/remounts keep the module sidebar visible after selection.
  const NO_SECONDARY = new Set(["settings", "lookups"]);
  const [openId, setOpenId] = useState<string | null>(() =>
    detected && location.pathname !== "/dashboard" && !NO_SECONDARY.has(detected.id)
      ? detected.id
      : null
  );

  // Refs so we can restore focus to the trigger button when the panel closes
  // (Esc / X), and move focus into the panel when it opens.
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const panelRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const firstModuleRef = useRef<HTMLAnchorElement | null>(null);
  // Remembers which trigger to return focus to when the panel closes.
  const lastTriggerId = useRef<string | null>(null);
  // Whether the most recent open was keyboard-initiated (moves focus into the
  // panel). Mouse clicks should not steal focus from the pointer flow.
  const openedViaKeyboard = useRef(false);

  // When the route TRANSITIONS into a different workspace (e.g. via a link
  // outside the sidebar), keep the panel in sync — but only on an actual
  // change of `detected`.
  const prevDetectedId = useRef<string | undefined>(detected?.id);
  useEffect(() => {
    const nextId = detected?.id;
    if (nextId && nextId !== prevDetectedId.current && openId && openId !== nextId) {
      setOpenId(NO_SECONDARY.has(nextId) ? null : nextId);
    }
    prevDetectedId.current = nextId;
  }, [detected, openId]);

  const activeWs: Workspace | null =
    openId ? WORKSPACES.find((w) => w.id === openId) ?? null : null;

  const isPathActive = (url: string) => {
    const base = url.split("?")[0];
    return location.pathname === base || location.pathname.startsWith(base + "/");
  };

  const activeModules = useMemo(
    () => (activeWs ? visibleModules(activeWs.modules, isEnabled) : []),
    [activeWs, isEnabled]
  );

  const openWorkspace = (ws: Workspace, viaKeyboard: boolean) => {
    openedViaKeyboard.current = viaKeyboard;
    lastTriggerId.current = ws.id;
    setOpenId(ws.id);
    const visible = visibleModules(ws.modules, isEnabled);
    const landingModule = ws.modules.find((m) => m.url === ws.landingUrl);
    const landingVisible = !landingModule || visible.includes(landingModule);
    if (landingVisible) navigate(ws.landingUrl);
    else if (visible[0]) navigate(visible[0].url);
  };

  const closePanel = (opts?: { restoreFocus?: boolean }) => {
    const restoreId = lastTriggerId.current;
    setOpenId(null);
    if (opts?.restoreFocus && restoreId) {
      // Defer so React unmounts the panel first.
      requestAnimationFrame(() => {
        triggerRefs.current[restoreId]?.focus();
      });
    }
  };

  const handleWorkspaceClick = (ws: Workspace, viaKeyboard = false) => {
    if (NO_SECONDARY.has(ws.id)) {
      closePanel({ restoreFocus: false });
      navigate(ws.landingUrl);
      return;
    }
    if (openId === ws.id) {
      closePanel({ restoreFocus: viaKeyboard });
      return;
    }
    openWorkspace(ws, viaKeyboard);
  };

  // Roving arrow-key navigation across primary workspace triggers.
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const total = WORKSPACES.length;
    let nextIndex: number | null = null;
    if (e.key === "ArrowDown") nextIndex = (index + 1) % total;
    else if (e.key === "ArrowUp") nextIndex = (index - 1 + total) % total;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = total - 1;
    if (nextIndex !== null) {
      e.preventDefault();
      const target = WORKSPACES[nextIndex];
      triggerRefs.current[target.id]?.focus();
    }
  };

  // Global Esc closes the panel and returns focus to its trigger.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePanel({ restoreFocus: true });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId]);

  // When the panel opens via keyboard, move focus into it (first module link,
  // or the close button if the panel is empty).
  useEffect(() => {
    if (!activeWs) return;
    if (!openedViaKeyboard.current) return;
    openedViaKeyboard.current = false;
    requestAnimationFrame(() => {
      (firstModuleRef.current ?? closeBtnRef.current)?.focus();
    });
  }, [activeWs]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      /* noop */
    }
  };

  const panelId = "workspace-secondary-panel";

  if (activeWs) {
    return (
      <aside className="relative z-40 flex h-screen w-[240px] shrink-0 border-r border-border bg-background">
        <nav
          key={activeWs.id}
          ref={panelRef}
          id={panelId}
          role="region"
          aria-label={`${activeWs.label} modules`}
          tabIndex={-1}
          className="flex h-screen w-[240px] flex-col bg-background animate-in fade-in slide-in-from-right-2 duration-150"
        >
          {/* Logo pinned at top */}
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="relative flex h-20 shrink-0 items-center justify-center overflow-hidden border-b border-border px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            title="Home"
            aria-label="Go to dashboard home"
          >
            <LogoDots />
            {companyLogo ? (
              <img src={companyLogo} alt="Company Logo" className="relative z-10 max-h-16 max-w-full object-contain" />
            ) : (
              <Icons.LayoutGrid className="relative z-10 h-8 w-8 text-primary" aria-hidden="true" />
            )}
          </button>


          <div className="flex h-20 shrink-0 items-center justify-between border-b border-border px-3">
            <div className="flex min-w-0 items-center gap-2">
              <Icon name={activeWs.icon} className="h-5 w-5 shrink-0 text-primary" />
              <h2 className="truncate text-base font-semibold">{activeWs.label}</h2>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={(e) => closePanel({ restoreFocus: e.detail === 0 })}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Back to workspaces`}
              title="Back to workspaces"
            >
              <Icons.ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {activeModules.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {activeModules.map((m, idx) => (
                  <ModuleItem
                    key={m.key}
                    url={m.url}
                    icon={m.icon}
                    label={m.label}
                    active={isPathActive(m.url)}
                    linkRef={idx === 0 ? firstModuleRef : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 px-3 py-10 text-center">
                <PackageOpen aria-hidden="true" className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground">No modules available</p>
                <p className="text-xs leading-snug text-muted-foreground">
                  All modules in this workspace are disabled.
                </p>
                <NavLink
                  to="/dashboard/settings?tab=plugins"
                  className="mt-1 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Manage plugins
                </NavLink>
              </div>
            )}
          </div>

          {/* User pinned at bottom */}
          <div className="mt-auto shrink-0 border-t border-border px-3 py-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Open account menu"
                  className="flex w-full min-w-0 items-center gap-2 rounded-md px-1 py-1 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <UserAvatar
                    src={user?.profilePictureUrl}
                    name={`${user?.firstName || ""} ${user?.lastName || ""}`}
                    seed={user?.id ?? "user"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-base font-semibold leading-tight">
                      {user?.firstName || "User"} {user?.lastName || ""}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Icons.ChevronUp aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 p-1">
                <ThemePicker />
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard/settings")}
                  className="gap-2 rounded-md px-2.5 py-1.5 text-sm"
                >
                  <SettingsIcon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="gap-2 rounded-md px-2.5 py-1.5 text-sm"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="relative z-40 flex h-screen shrink-0 border-r border-border bg-background">
      {/* Primary sidebar — list of workspaces */}
      <nav className="flex h-screen w-[240px] flex-col bg-background" aria-label="Workspaces">
        {/* Logo on top — larger */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="relative flex h-20 shrink-0 items-center justify-center overflow-hidden border-b border-border px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title="Home"
          aria-label="Go to dashboard home"
        >
          <LogoDots />
          {companyLogo ? (
            <img src={companyLogo} alt="Company Logo" className="relative z-10 max-h-16 max-w-full object-contain" />
          ) : (
            <Icons.LayoutGrid className="relative z-10 h-8 w-8 text-primary" aria-hidden="true" />
          )}
        </button>


        {/* Workspaces list */}
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <p
            id="workspaces-heading"
            className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Workspaces
          </p>
          <div
            role="list"
            aria-labelledby="workspaces-heading"
            className="flex flex-col gap-0.5"
          >
            {WORKSPACES.map((ws, index) => {
              const isOpen = openId === ws.id;
              const isCurrent = detected?.id === ws.id;
              return (
                <button
                  key={ws.id}
                  ref={(el) => {
                    triggerRefs.current[ws.id] = el;
                  }}
                  type="button"
                  role="listitem"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? panelId : undefined}
                  aria-current={isCurrent ? "page" : undefined}
                  onClick={(e) => {
                    // detail === 0 → activated via keyboard (Enter/Space).
                    handleWorkspaceClick(ws, e.detail === 0);
                  }}
                  onKeyDown={(e) => handleTriggerKeyDown(e, index)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-base transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isOpen
                      ? "bg-accent text-accent-foreground font-medium"
                      : isCurrent
                      ? "text-primary hover:bg-accent/50"
                      : "text-foreground/80 hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon name={ws.icon} className="h-5 w-5 shrink-0" />
                  <span className="flex-1 truncate text-left">{ws.label}</span>
                  <Icons.ChevronRight
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isOpen && "rotate-90"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* User pinned at the bottom */}
        <div className="mt-auto shrink-0 border-t border-border px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open account menu"
                className="flex w-full min-w-0 items-center gap-2 rounded-md px-1 py-1 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserAvatar
                  src={user?.profilePictureUrl}
                  name={`${user?.firstName || ""} ${user?.lastName || ""}`}
                  seed={user?.id ?? "user"}
                  size="sm"
                />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-base font-semibold leading-tight">
                    {user?.firstName || "User"} {user?.lastName || ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Icons.ChevronUp aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 p-1">
              <ThemePicker />
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => navigate("/dashboard/settings")}
                className="gap-2 rounded-md px-2.5 py-1.5 text-sm"
              >
                <SettingsIcon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="gap-2 rounded-md px-2.5 py-1.5 text-sm"
              >
                <LogOut aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

    </aside>
  );
}

export default WorkspaceSidebar;


