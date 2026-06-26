import { Routes, Route, Navigate } from 'react-router-dom';
import { HRDashboard } from './components/HRDashboard';
import { EmployeeList } from './components/employees/EmployeeList';
import { EmployeeDetail } from './components/employees/EmployeeDetail';
import { LeavesPage } from './components/leaves/LeavesPage';
import { AttendancePage } from './components/attendance/AttendancePage';
import { PayrollPage } from './components/payroll/PayrollPage';
import { DepartmentsPage } from './components/departments/DepartmentsPage';
import { BonusesPage } from './components/bonuses/BonusesPage';
import { CnssPage } from './components/cnss/CnssPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { HrSettingsPage } from './components/settings/HrSettingsPage';
import { PerformancePage } from './components/performance/PerformancePage';
import { RecruitmentPage } from './components/recruitment/RecruitmentPage';
import { PluginGate } from '@/modules/shared/plugins';
import { PermissionRoute } from '@/components/permissions/PermissionRoute';

export default function HRModule() {
  return (
    <PluginGate code="PL0013HR">
      <PermissionRoute module="hr" action="read">
      <Routes>
        <Route index element={<HRDashboard />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="absences" element={<Navigate to="/dashboard/hr/leaves" replace />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="bonuses" element={<BonusesPage />} />
        <Route path="cnss" element={<CnssPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<HrSettingsPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="recruitment" element={<RecruitmentPage />} />
        <Route path="*" element={<Navigate to="/dashboard/hr" replace />} />
      </Routes>
      </PermissionRoute>
    </PluginGate>
  );
}

