import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import {
  HYDRATION_MODULES,
  loadHydrationModulePrefs,
  setHydrationModuleEnabled,
  setAllHydrationModulesEnabled,
  isHydrationModuleEnabled,
  syncHydrationPreferencesFromServer,
} from "@/services/offline/offlineHydrationPreferences";
import { HydrationLastRunPanel } from "@/components/offline/HydrationLastRunPanel";
import { WifiOff, Loader2 } from "lucide-react";

export function OfflineHydrationSettings() {
  const { t } = useTranslation("settings");
  const [, bump] = useState(0);
  const forceUpdate = useCallback(() => bump((x) => x + 1), []);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    syncHydrationPreferencesFromServer()
      .then((ok) => {
        if (!cancelled) setLoadError(!ok);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          forceUpdate();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [forceUpdate]);

  const prefs = loadHydrationModulePrefs();

  const handleToggle = (id: string, checked: boolean) => {
    setHydrationModuleEnabled(id, checked);
    forceUpdate();
  };

  const handleSelectAll = () => {
    setAllHydrationModulesEnabled(true);
    forceUpdate();
  };

  const handleDeselectAll = () => {
    setAllHydrationModulesEnabled(false);
    forceUpdate();
  };

  const handleResetDefaults = () => {
    setAllHydrationModulesEnabled(true);
    forceUpdate();
  };

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WifiOff className="h-5 w-5" />
          {t("offlineHydration.title")}
        </CardTitle>
        <CardDescription>{t("offlineHydration.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("offlineHydration.hint")}</p>

        {loadError && !loading ? (
          <Alert className="border-amber-500/40 bg-amber-500/5 text-foreground">
            <AlertDescription>{t("offlineHydration.loadFailed")}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} disabled={loading}>
            {t("selectAll")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll} disabled={loading}>
            {t("deselectAll")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleResetDefaults} disabled={loading}>
            {t("offlineHydration.resetDefaults")}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("offlineHydration.loading")}
          </div>
        ) : (
          <div className="rounded-lg border divide-y max-h-[min(70vh,520px)] overflow-y-auto">
            {HYDRATION_MODULES.map((m) => {
              const enabled = isHydrationModuleEnabled(m.id);
              const overridden = Object.prototype.hasOwnProperty.call(prefs, m.id);
              return (
                <div key={m.id} className="flex items-start gap-3 p-3 hover:bg-muted/40">
                  <Checkbox
                    id={`hydration-mod-${m.id}`}
                    checked={enabled}
                    onCheckedChange={(v) => handleToggle(m.id, v === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <Label htmlFor={`hydration-mod-${m.id}`} className="text-sm font-medium cursor-pointer">
                      {t(m.labelKey)}
                    </Label>
                    {!overridden && (
                      <p className="text-[11px] text-muted-foreground">{t("offlineHydration.defaultOn")}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
    <HydrationLastRunPanel />
    </div>
  );
}
