import { Routes, Route, Navigate } from 'react-router-dom';
import { MyDashboard } from './pages/MyDashboard';
import { SalesDashboard } from './pages/SalesDashboard';
import { ServiceDashboard } from './pages/ServiceDashboard';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { HrDashboard } from './pages/HrDashboard';
import { PurchaseDashboard } from './pages/PurchaseDashboard';
import { ExportReports } from './pages/ExportReports';
import { PermissionRoute } from '@/components/permissions/PermissionRoute';
import { PluginGate } from '@/modules/shared/plugins';

/**
 * Reporting pages surface data owned by other modules, so each dashboard is
 * gated by the plugin that owns that data. Gating is frontend-only: the
 * backend simply reports which modules are activated for the tenant.
 */
export const ReportingModule = () => {
  return (
    <PluginGate code="PL0046REPORTING">
    <Routes>
      {/* MyDashboard is user-scoped, safe for any authenticated user */}
      <Route path="my" element={<MyDashboard />} />
      <Route
        path="sales"
        element={
          <PluginGate code="PL0002SALES">
            <PermissionRoute module="sales" action="read" redirectTo="/dashboard/reporting/my">
              <SalesDashboard />
            </PermissionRoute>
          </PluginGate>
        }
      />
      <Route
        path="service"
        element={
          <PluginGate code="PL0015FIELD">
            <PermissionRoute module="service_orders" action="read" redirectTo="/dashboard/reporting/my">
              <ServiceDashboard />
            </PermissionRoute>
          </PluginGate>
        }
      />
      <Route
        path="finance"
        element={
          <PluginGate code="PL0004INVOICES">
            <PermissionRoute module="reporting_finance" action="read" redirectTo="/dashboard/reporting/my">
              <FinanceDashboard />
            </PermissionRoute>
          </PluginGate>
        }
      />
      <Route
        path="hr"
        element={
          <PluginGate code="PL0013HR">
            <PermissionRoute module="reporting_hr" action="read" redirectTo="/dashboard/reporting/my">
              <HrDashboard />
            </PermissionRoute>
          </PluginGate>
        }
      />
      <Route
        path="purchase"
        element={
          <PluginGate code="PL0025PURCHASES">
            <PermissionRoute module="purchases" action="read" redirectTo="/dashboard/reporting/my">
              <PurchaseDashboard />
            </PermissionRoute>
          </PluginGate>
        }
      />
      <Route path="export" element={<ExportReports />} />
      <Route index element={<Navigate to="my" replace />} />
    </Routes>
    </PluginGate>
  );
};
