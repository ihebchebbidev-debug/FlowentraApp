import { Routes, Route, Navigate } from 'react-router-dom';
import { MyDashboard } from './pages/MyDashboard';
import { SalesDashboard } from './pages/SalesDashboard';
import { ServiceDashboard } from './pages/ServiceDashboard';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { HrDashboard } from './pages/HrDashboard';
import { PurchaseDashboard } from './pages/PurchaseDashboard';
import { ExportReports } from './pages/ExportReports';
import { PermissionRoute } from '@/components/permissions/PermissionRoute';

export const ReportingModule = () => {
  return (
    <Routes>
      <Route path="my" element={<MyDashboard />} />
      <Route path="sales" element={<SalesDashboard />} />
      <Route path="service" element={<ServiceDashboard />} />
      <Route
        path="finance"
        element={
          <PermissionRoute module="reporting_finance" action="read" redirectTo="/dashboard/reporting/my">
            <FinanceDashboard />
          </PermissionRoute>
        }
      />
      <Route
        path="hr"
        element={
          <PermissionRoute module="reporting_hr" action="read" redirectTo="/dashboard/reporting/my">
            <HrDashboard />
          </PermissionRoute>
        }
      />
      <Route path="purchase" element={<PurchaseDashboard />} />
      <Route path="export" element={<ExportReports />} />
      <Route index element={<Navigate to="my" replace />} />
    </Routes>
  );
};
