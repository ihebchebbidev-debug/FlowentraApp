import { UserManagement } from "./components/UserManagement";
import { PluginGate } from "@/modules/shared/plugins";

export function UsersModule() {
  return (
    <PluginGate code="PL0043USERS">
      <UserManagement />
    </PluginGate>
  );
}
