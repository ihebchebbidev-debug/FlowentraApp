import { Routes, Route } from "react-router-dom";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";
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
      <Route path="users" element={
        <PermissionRoute module="users" action="read"><UsersAdminPage /></PermissionRoute>
      } />
      <Route path="roles" element={
        <PermissionRoute module="roles" action="read"><RolesAdminPage /></PermissionRoute>
      } />
      <Route path="user-groups" element={
        <PermissionRoute module="users" action="read"><UserGroupsAdminPage /></PermissionRoute>
      } />
      <Route path="advanced" element={<SettingsLayoutNew />} />
      <Route path="system-config" element={
        <PermissionRoute module="settings" action="update"><SystemAdminPage /></PermissionRoute>
      } />
      <Route path="system" element={<SettingsLayout />} />
      <Route path="processes" element={
        <PermissionRoute module="processes" action="read"><ProcessesPage /></PermissionRoute>
      } />
      <Route path="logs" element={
        <PermissionRoute module="audit_logs" action="read"><SystemLogsPage /></PermissionRoute>
      } />
      <Route path="database-full-view" element={
        <PermissionRoute module="settings" action="update"><DatabaseFullView /></PermissionRoute>
      } />
      <Route path="documentation" element={<DocumentationPage />} />
      <Route path="documentation/module/:moduleKey" element={<ModuleDocumentationPage />} />
      <Route path="documentation/settings" element={<SettingsDocumentationPage />} />
      <Route path="documentation/backend" element={<BackendDocumentationPage />} />
      <Route path="documentation/database" element={<DatabaseSchemaPage />} />
      <Route path="db-console" element={
        <PermissionRoute module="settings" action="update"><DbConsolePage /></PermissionRoute>
      } />
      <Route path="sync" element={
        <PermissionRoute module="settings" action="update"><SyncDashboardPage /></PermissionRoute>
      } />
      <Route path="plugins" element={
        <PermissionRoute module="settings" action="update"><PluginsPage /></PermissionRoute>
      } />
      <Route path="dynamic-forms/*" element={
        <PermissionRoute module="dynamic_forms" action="read"><DynamicFormsModule /></PermissionRoute>
      } />
    </Routes>
  );
}
