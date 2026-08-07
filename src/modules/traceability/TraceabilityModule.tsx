import { Routes, Route } from 'react-router-dom';
import TraceabilityPage from './pages/TraceabilityPage';

export function TraceabilityModule() {
  return (
    <Routes>
      <Route index element={<TraceabilityPage />} />
    </Routes>
  );
}

export default TraceabilityModule;
