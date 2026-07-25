import { Routes, Route } from "react-router-dom";
import { SettingsLayoutNew } from "./components/SettingsLayoutNew";
import DatabaseFullView from "./pages/DatabaseFullView";
import SettingsPage from "./pages/SettingsPage";
import { SettingsLayout } from "./components/SettingsLayout";
import SystemLogsPage from "./pages/SystemLogsPage";
import DocumentationPage from "./pages/DocumentationPage";
import SettingsDocumentationPage from "./pages/SettingsDocumentationPage";
import ModuleDocumentationPage from "./pages/ModuleDocumentationPage";
import BackendDocumentationPage from "./pages/BackendDocumentationPage";
import DatabaseSchemaPage from "./pages/DatabaseSchemaPage";
import DbConsolePage from "./pages/DbConsolePage";
import { DynamicFormsModule } from "@/modules/dynamic-forms";
import SyncDashboardPage from "./pages/SyncDashboardPage";
import PluginsPage from "./pages/PluginsPage";
import UsersAdminPage from "./pages/UsersAdminPage";
import RolesAdminPage from "./pages/RolesAdminPage";
import UserGroupsAdminPage from "./pages/UserGroupsAdminPage";
import SystemAdminPage from "./pages/SystemAdminPage";
import ProcessesPage from "@/modules/system/pages/ProcessesPage";

export function SettingsModule() {
  return (
    <Routes>
      <Route index element={<SettingsPage />} />
      <Route path="users" element={<UsersAdminPage />} />
      <Route path="roles" element={<RolesAdminPage />} />
      <Route path="user-groups" element={<UserGroupsAdminPage />} />
      <Route path="advanced" element={<SettingsLayoutNew />} />
      <Route path="system-config" element={<SystemAdminPage />} />
      <Route path="system" element={<SettingsLayout />} />
      <Route path="processes" element={<ProcessesPage />} />
      <Route path="logs" element={<SystemLogsPage />} />
      <Route path="database-full-view" element={<DatabaseFullView />} />
      <Route path="documentation" element={<DocumentationPage />} />
      <Route path="documentation/module/:moduleKey" element={<ModuleDocumentationPage />} />
      <Route path="documentation/settings" element={<SettingsDocumentationPage />} />
      <Route path="documentation/backend" element={<BackendDocumentationPage />} />
      <Route path="documentation/database" element={<DatabaseSchemaPage />} />
      <Route path="db-console" element={<DbConsolePage />} />
      <Route path="sync" element={<SyncDashboardPage />} />
      <Route path="plugins" element={<PluginsPage />} />
      <Route path="dynamic-forms/*" element={<DynamicFormsModule />} />
    </Routes>
  );
}

