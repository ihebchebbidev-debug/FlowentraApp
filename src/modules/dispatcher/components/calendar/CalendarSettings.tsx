import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import type { CalendarSettings } from "./types";

interface CalendarSettingsProps {
  settings: CalendarSettings;
  onSettingsChange: (settings: CalendarSettings) => void;
}

// Settings here are read-only previews of the active Planning Profile.
// To change them, the user opens the Planning Profiles modal via "Manage Planning".
export function CalendarSettingsPanel({ settings }: CalendarSettingsProps) {
  const { t } = useTranslation();

  return (
    <div className="p-2 border-b bg-muted/20">
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        {t('dispatcher.profile_controls_board', {
          defaultValue: 'Display options are managed by the active planning profile.',
        })}
      </span>
    </div>
  );
}
