import { Routes, Route } from 'react-router-dom';
import { PermissionRoute } from '@/components/permissions/PermissionRoute';
import DynamicFormsPage from './pages/DynamicFormsPage';
import CreateFormPage from './pages/CreateFormPage';
import EditFormPage from './pages/EditFormPage';
import FormPreviewPage from './pages/FormPreviewPage';
import FormResponsesPage from './pages/FormResponsesPage';
import { PluginGate } from "@/modules/shared/plugins";

export function DynamicFormsModule() {
  return (
    <PluginGate code="PL0032DYNAMICFORMS">
      <Routes>
        <Route index element={<PermissionRoute module="dynamic_forms" action="read"><DynamicFormsPage /></PermissionRoute>} />
        <Route path="create" element={<PermissionRoute module="dynamic_forms" action="create"><CreateFormPage /></PermissionRoute>} />
        <Route path=":id/edit" element={<PermissionRoute module="dynamic_forms" action="update"><EditFormPage /></PermissionRoute>} />
        <Route path=":id/preview" element={<PermissionRoute module="dynamic_forms" action="read"><FormPreviewPage /></PermissionRoute>} />
        <Route path=":id/responses" element={<PermissionRoute module="dynamic_forms" action="read"><FormResponsesPage /></PermissionRoute>} />
      </Routes>
      </PluginGate>
  );
}

export default DynamicFormsModule;

