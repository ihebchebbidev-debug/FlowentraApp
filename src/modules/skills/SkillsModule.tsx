import { SkillsManagement } from "./components/SkillsManagement";
import { PluginGate } from "@/modules/shared/plugins";

export function SkillsModule() {
  return (
    <PluginGate code="PL0014SKILLS">
      <SkillsManagement />
    </PluginGate>
  );
}
