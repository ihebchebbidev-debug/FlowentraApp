import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectsService } from "../../services/projects.service";

type ProjectSettings = {
  autoLinkConvertedEntities: boolean;
  requireProjectBeforeConvertingOffer: boolean;
  defaultTaskStatus: string;
  allowCrossProjectDispatch: boolean;
  showFinancialDataInProjectTabs: boolean;
  defaultLinkedEntityType: string;
};

const defaultSettings: ProjectSettings = {
  autoLinkConvertedEntities: true,
  requireProjectBeforeConvertingOffer: false,
  defaultTaskStatus: "todo",
  allowCrossProjectDispatch: true,
  showFinancialDataInProjectTabs: true,
  defaultLinkedEntityType: "service_order",
};

export function ProjectSettingsTab() {
  const [settings, setSettings] = useState<ProjectSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState<string>("");

  const load = async () => {
    setIsLoading(true);
    setLoadFailed(false);
    setMessage("");
    try {
      const data = await ProjectsService.getSettings();
      setSettings({ ...defaultSettings, ...data });
    } catch {
      // Keep the form disabled: saving here would overwrite the stored settings
      // with the hardcoded defaults the user never actually chose.
      setLoadFailed(true);
      setMessage("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setLoadFailed(false);
      try {
        const data = await ProjectsService.getSettings();
        if (cancelled) return;
        setSettings({ ...defaultSettings, ...data });
      } catch {
        if (cancelled) return;
        setLoadFailed(true);
        setMessage("Failed to load settings");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    if (loadFailed) return;
    setIsSaving(true);
    setMessage("");
    try {
      const updated = await ProjectsService.updateSettings(settings);
      setSettings({ ...defaultSettings, ...updated });
      setMessage("Settings saved");
    } catch {
      setMessage("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading settings...</div>;

  if (loadFailed) {
    return (
      <div className="space-y-3 max-w-2xl">
        <p className="text-sm text-destructive">
          Failed to load project settings. Saving is disabled to avoid overwriting your configuration.
        </p>
        <Button variant="outline" onClick={load}>Retry</Button>
      </div>
    );
  }


  return (
    <div className="space-y-4 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="defaultTaskStatus">Default task status</Label>
        <Input
          id="defaultTaskStatus"
          value={settings.defaultTaskStatus}
          onChange={(e) => setSettings((p) => ({ ...p, defaultTaskStatus: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultLinkedEntityType">Default linked entity type</Label>
        <Input
          id="defaultLinkedEntityType"
          value={settings.defaultLinkedEntityType}
          onChange={(e) => setSettings((p) => ({ ...p, defaultLinkedEntityType: e.target.value }))}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.autoLinkConvertedEntities}
          onChange={(e) => setSettings((p) => ({ ...p, autoLinkConvertedEntities: e.target.checked }))}
        />
        Auto-link converted entities to projects
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.requireProjectBeforeConvertingOffer}
          onChange={(e) => setSettings((p) => ({ ...p, requireProjectBeforeConvertingOffer: e.target.checked }))}
        />
        Require project before converting offers
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.allowCrossProjectDispatch}
          onChange={(e) => setSettings((p) => ({ ...p, allowCrossProjectDispatch: e.target.checked }))}
        />
        Allow cross-project dispatch
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.showFinancialDataInProjectTabs}
          onChange={(e) => setSettings((p) => ({ ...p, showFinancialDataInProjectTabs: e.target.checked }))}
        />
        Show financial data in project tabs
      </label>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save settings"}
        </Button>
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
      </div>
    </div>
  );
}
