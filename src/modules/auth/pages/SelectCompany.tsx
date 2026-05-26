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
import { Building2, Loader2, Globe2, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantMap } from "@/contexts/TenantMapContext";
import {
  setTenantOverrideWithoutReload,
  VIEW_ALL_SENTINEL,
} from "@/utils/tenant";
import { useUserType } from "@/hooks/useUserType";

export default function SelectCompany() {
  const navigate = useNavigate();
  const { logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { tenants, loaded } = useTenantMap();
  const { isMainAdminUser } = useUserType();
  const [busy, setBusy] = useState<string | null>(null);

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

  const pick = (slug: string, label: string) => {
    setBusy(label);
    setTenantOverrideWithoutReload(slug);
    // Hard reload so every cached query rehydrates against the new tenant header.
    window.location.replace("/dashboard");
  };

  const pickViewAll = () => {
    setBusy("__all__");
    setTenantOverrideWithoutReload(VIEW_ALL_SENTINEL);
    window.location.replace("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Choose the company you're working in
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Everything you create — offers, sales, service orders, dispatches —
            will be tagged to this company until you switch.
          </p>
        </div>

        {!loaded ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading your companies…
          </div>
        ) : activeTenants.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No company is available for your account. Contact your administrator.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeTenants.map((t) => {
              const label = t.companyName || t.slug;
              const isBusy = busy === label;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!!busy}
                  onClick={() => pick(t.slug, label)}
                  className="group text-left"
                >
                  <Card className="transition-all border-border hover:border-primary/60 hover:shadow-lg disabled:opacity-50">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {isBusy ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">
                          {label}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {t.slug}
                          {t.isDefault ? " · default" : ""}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {isMainAdminUser && activeTenants.length > 1 && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={pickViewAll}
              disabled={!!busy}
              className="gap-2"
            >
              {busy === "__all__" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe2 className="h-4 w-4" />
              )}
              View all companies (admin)
            </Button>
          </div>
        )}

        <div className="mt-10 flex justify-center">
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
        </div>
      </div>
    </div>
  );
}
