/**
 * SelectCompany — mandatory company picker shown right after login when no
 * tenant is pinned yet. Replaces the previous "boot in view-all" default so
 * Add buttons, list filters and KPIs all have a concrete company to scope to.
 *
 * Main admins also see a "View all companies" option at the bottom for audit
 * mode; regular users only get the cards.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Loader2,
  Globe2,
  LogOut,
  ChevronRight,
  MapPin,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantMap } from "@/contexts/TenantMapContext";
import { setActiveCompany } from "@/utils/targetTenant";
import { useUserType } from "@/hooks/useUserType";
import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export default function SelectCompany() {
  const navigate = useNavigate();
  const { logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { tenants, loaded } = useTenantMap();
  const { isMainAdminUser } = useUserType();
  const [busy, setBusy] = useState<string | null>(null);
  const [brokenLogos, setBrokenLogos] = useState<Record<number, boolean>>({});

  useEffect(() => {
    document.title = "Select Company — Flowentra";
  }, []);

  // If user is not authenticated, kick to login.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login", { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  const activeTenants = useMemo(
    () => (tenants || []).filter((t) => t.isActive !== false),
    [tenants]
  );

  const pick = (tenantId: number, label: string) => {
    setBusy(label);
    // Row-level switch: keep X-Tenant (subdomain/DB) untouched, set X-Target-Tenant.
    setActiveCompany({ id: tenantId, reload: true });
  };

  const pickViewAll = () => {
    setBusy("__all__");
    setActiveCompany({ viewAll: true, reload: true });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-background">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background to-muted/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[680px] rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative w-full max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Workspace
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Select your company
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Everything you create — offers, sales, service orders, dispatches —
            stays scoped to the company you choose here.
          </p>
        </div>

        {/* Body */}
        {!loaded ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading your companies…
          </div>
        ) : activeTenants.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-medium text-foreground">No company available</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Contact your administrator to be assigned to a workspace.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeTenants.map((t) => {
              const label = t.companyName || t.slug;
              const isBusy = busy === label;
              const logoUrl = (t as any).companyLogoUrl as string | null | undefined;
              const showLogo = !!logoUrl && !brokenLogos[t.id];
              const meta = [
                (t as any).industry,
                (t as any).companyCountry,
              ].filter(Boolean) as string[];

              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!!busy}
                  onClick={() => pick(t.id, label)}
                  className="group relative text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
                  aria-label={`Open workspace ${label}`}
                >
                  <Card
                    className={cn(
                      "h-full overflow-hidden border-border/70 bg-card/80 backdrop-blur transition-all duration-200",
                      "hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5",
                      "disabled:opacity-50",
                      isBusy && "border-primary/60 shadow-lg"
                    )}
                  >
                    {/* Logo banner */}
                    <div className="relative h-24 bg-gradient-to-br from-muted/60 via-muted/30 to-background border-b border-border/60 flex items-center justify-center">
                      {showLogo ? (
                        <img
                          src={logoUrl!}
                          alt={`${label} logo`}
                          className="max-h-16 max-w-[70%] object-contain"
                          onError={() =>
                            setBrokenLogos((s) => ({ ...s, [t.id]: true }))
                          }
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-semibold text-lg tracking-wide">
                          {initialsOf(label)}
                        </div>
                      )}
                      {t.isDefault && (
                        <Badge
                          variant="secondary"
                          className="absolute top-2 right-2 gap-1 text-[10px] font-medium"
                        >
                          <Check className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground truncate">
                            {label}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground truncate font-mono">
                            {t.slug}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "shrink-0 rounded-full p-1.5 transition-all",
                            "text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 group-hover:translate-x-0.5"
                          )}
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {meta.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {(t as any).industry && (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {(t as any).industry}
                            </span>
                          )}
                          {(t as any).companyCountry && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {(t as any).companyCountry}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {/* Admin "view all" */}
        {isMainAdminUser && activeTenants.length > 1 && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={pickViewAll}
              disabled={!!busy}
              className="gap-2 bg-card/60 backdrop-blur"
            >
              {busy === "__all__" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe2 className="h-4 w-4" />
              )}
              View all companies
              <span className="text-xs text-muted-foreground font-normal">
                (admin)
              </span>
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="text-muted-foreground gap-2"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
          <p className="text-[11px] text-muted-foreground/70">
            You can switch companies anytime from the top navigation.
          </p>
        </div>
      </div>
    </div>
  );
}
