import { PluginGate } from "@/modules/shared/plugins";

export function AnalyticsModule() {
  return (
    <PluginGate code="PL0040ANALYTICS">
      <div className="p-6" />
    </PluginGate>
  );
}
