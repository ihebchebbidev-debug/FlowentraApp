/**
 * SelectCompany — multi-company picker for main admins with 2+ workspaces.
 *
 * NOT shown when the user has only one company: those accounts are auto-pinned
 * in RequireCompany and redirected away immediately if they land here.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  Building2,
  Loader2,
  Globe2,
  LogOut,
  ChevronRight,
  MapPin,
  Check,
  ImageOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantMap } from "@/contexts/TenantMapContext";
import { setActiveCompany } from "@/utils/targetTenant";
import {
  ensureActiveCompanyPinned,
  filterActiveTenants,
  hasActiveCompanySelection,
  isMainAdminFromStorage,
  pinActiveCompanyFromList,
  shouldShowCompanyPicker,
} from "@/utils/bootstrapCompany";
import { buildAssetUrl } from "@/config/api";
import { setCompanyLogo, setCompanyLogoExplicitNone } from "@/hooks/useCompanyLogo";
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
  const location = useLocation();
  const { logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { tenants, loaded, refetch } = useTenantMap();
  const { isMainAdminUser } = useUserType();
  const [busy, setBusy] = useState<string | null>(null);
  const [brokenLogos, setBrokenLogos] = useState<Record<number, boolean>>({});
  const emptyRetryRef = useRef(false);

  const returnTo =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const effectiveMainAdmin = isMainAdminUser || isMainAdminFromStorage();
  const activeTenants = useMemo(() => filterActiveTenants(tenants || []), [tenants]);

  useEffect(() => {
    document.title = "Select Company — Flowentra";
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login", { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  // Stale empty cache — refetch once (e.g. right after onboarding).
  useEffect(() => {
    if (!loaded || emptyRetryRef.current || activeTenants.length > 0) return;
    emptyRetryRef.current = true;
    void refetch({ bustCache: true }).then((fresh) => {
      void ensureActiveCompanyPinned(effectiveMainAdmin, fresh);
    });
  }, [loaded, activeTenants.length, refetch, effectiveMainAdmin]);

  const pick = useCallback((tenantId: number, label: string) => {
    setBusy(label);
    const tenant = activeTenants.find((t) => t.id === tenantId);
    const defaultTenant = activeTenants.find(t => t.isDefault) ?? activeTenants[0];
    const logoUrl = (tenant as any)?.companyLogoUrl as string | null | undefined;
    const fallback = (defaultTenant as any)?.companyLogoUrl as string | null | undefined;
    const resolved = logoUrl ?? fallback;
    if (resolved) setCompanyLogo(resolved);
    else setCompanyLogoExplicitNone();
    setActiveCompany({ id: tenantId, reload: true });
  }, [activeTenants]);

  const pickViewAll = () => {
    setBusy("__all__");
    const defaultTenant = activeTenants.find(t => t.isDefault) ?? activeTenants[0];
    const defaultLogo = (defaultTenant as any)?.companyLogoUrl as string | null | undefined;
    if (defaultLogo) setCompanyLogo(defaultLogo);
    else setCompanyLogoExplicitNone();
    setActiveCompany({ viewAll: true, reload: true });
  };

  if (authLoading || !loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading…
        </div>
      </div>
    );
  }

  // One company (or already pinned) — skip this page entirely.
  if (hasActiveCompanySelection() || activeTenants.length === 1) {
    if (activeTenants.length === 1 && !hasActiveCompanySelection()) {
      pinActiveCompanyFromList(activeTenants, effectiveMainAdmin);
    }
    return <Navigate to={returnTo} replace />;
  }

  // Not a multi-company admin — send to dashboard; RequireCompany handles pinning.
  if (!shouldShowCompanyPicker(tenants, effectiveMainAdmin)) {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background to-muted/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[680px] rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative w-full max-w-5xl">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Workspace
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Select your company
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            You have multiple companies — choose which workspace to open.
          </p>
        </div>

        {activeTenants.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-medium text-foreground">No company available</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Finish onboarding to create your first workspace, or retry loading companies.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="default"
                  onClick={() => navigate("/onboarding", { replace: true })}
                >
                  Continue setup
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    emptyRetryRef.current = false;
                    void refetch({ bustCache: true }).then((fresh) =>
                      ensureActiveCompanyPinned(true, fresh),
                    );
                  }}
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {activeTenants.map((t) => {
              const label = t.companyName || t.slug;
              const isBusy = busy === label;
              const rawLogoUrl = (t as any).companyLogoUrl as string | null | undefined;
              const logoSrc = rawLogoUrl ? buildAssetUrl(rawLogoUrl) : null;
              const showLogo = !!logoSrc && !brokenLogos[t.id];
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
                  className="group relative text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] max-w-sm"
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
                    <div className="relative h-28 bg-gradient-to-br from-muted/60 via-muted/30 to-background border-b border-border/60 flex items-center justify-center overflow-hidden">
                      {!showLogo && (
                        <div
                          aria-hidden
                          className="absolute inset-0 opacity-[0.5]"
                          style={{
                            backgroundImage:
                              "radial-gradient(hsl(var(--muted-foreground) / 0.18) 1px, transparent 1px)",
                            backgroundSize: "14px 14px",
                          }}
                        />
                      )}
                      {showLogo ? (
                        <img
                          src={logoSrc!}
                          alt={`${label} logo`}
                          className="max-h-16 max-w-[70%] object-contain"
                          onError={() =>
                            setBrokenLogos((s) => ({ ...s, [t.id]: true }))
                          }
                          loading="lazy"
                        />
                      ) : (
                        <div className="relative flex flex-col items-center gap-1.5">
                          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-border bg-card/80 shadow-sm">
                            <span className="text-base font-semibold text-foreground/80 tracking-wide">
                              {initialsOf(label)}
                            </span>
                            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm">
                              <ImageOff className="h-3 w-3" />
                            </span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                            No logo uploaded
                          </span>
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

                    <CardContent className="p-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="font-semibold text-foreground truncate max-w-full">
                          {label}
                        </div>
                        <div className="text-xs text-muted-foreground truncate font-mono max-w-full">
                          {t.slug}
                        </div>
                      </div>

                      {meta.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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

                      <div
                        className={cn(
                          "mt-3 inline-flex items-center justify-center gap-1 text-xs font-medium transition-all",
                          "text-muted-foreground group-hover:text-primary"
                        )}
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            Opening…
                          </>
                        ) : (
                          <>
                            Open workspace
                            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {activeTenants.length > 1 && (
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
