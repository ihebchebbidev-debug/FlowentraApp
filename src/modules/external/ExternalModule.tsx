import { Routes, Route } from 'react-router-dom';
import { PermissionRoute } from '@/components/permissions/PermissionRoute';
import { IntegrationHub } from './pages/IntegrationHub';
import { CreateEndpoint } from './pages/CreateEndpoint';
import { EditEndpoint } from './pages/EditEndpoint';
import { EndpointDetail } from './pages/EndpointDetail';
import { CreateConnection } from './pages/CreateConnection';
import { PluginGate } from "@/modules/shared/plugins";

export function ExternalModule() {
  return (
    <PluginGate code="PL0030EXTERNAL">
      <Routes>
        {/* Integration Hub — new entry point */}
        <Route index element={
          <PermissionRoute module="external_endpoints" action="read"><IntegrationHub /></PermissionRoute>
        } />

        {/* ERP / connector setup wizard — must be before :id to avoid conflict */}
        <Route path="connect/:connectorId" element={
          <PermissionRoute module="external_endpoints" action="create"><CreateConnection /></PermissionRoute>
        } />

        {/* Custom webhook endpoint CRUD */}
        <Route path="create" element={
          <PermissionRoute module="external_endpoints" action="create"><CreateEndpoint /></PermissionRoute>
        } />
        <Route path=":id" element={
          <PermissionRoute module="external_endpoints" action="read"><EndpointDetail /></PermissionRoute>
        } />
        <Route path=":id/edit" element={
          <PermissionRoute module="external_endpoints" action="update"><EditEndpoint /></PermissionRoute>
        } />
      </Routes>
    </PluginGate>
  );
}

export default ExternalModule;

