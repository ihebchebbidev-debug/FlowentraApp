import { Routes, Route } from 'react-router-dom';
import { ExternalEndpointsList } from './pages/ExternalEndpointsList';
import { CreateEndpoint } from './pages/CreateEndpoint';
import { EditEndpoint } from './pages/EditEndpoint';
import { EndpointDetail } from './pages/EndpointDetail';
import { PluginGate } from "@/modules/shared/plugins";

export function ExternalModule() {
  return (
    <PluginGate code="PL0030EXTERNAL">
      <Routes>
        <Route index element={<ExternalEndpointsList />} />
        <Route path="create" element={<CreateEndpoint />} />
        <Route path=":id" element={<EndpointDetail />} />
        <Route path=":id/edit" element={<EditEndpoint />} />
      </Routes>
      </PluginGate>
  );
}

export default ExternalModule;
