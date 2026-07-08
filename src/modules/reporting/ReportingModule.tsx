import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SalesDashboard } from './pages/SalesDashboard';
import { ServiceDashboard } from './pages/ServiceDashboard';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { HrDashboard } from './pages/HrDashboard';
import { PurchaseDashboard } from './pages/PurchaseDashboard';

export const ReportingModule = () => {
  return (
    <Routes>
      <Route path="sales" element={<SalesDashboard />} />
      <Route path="service" element={<ServiceDashboard />} />
      <Route path="finance" element={<FinanceDashboard />} />
      <Route path="hr" element={<HrDashboard />} />
      <Route path="purchase" element={<PurchaseDashboard />} />
      <Route index element={<Navigate to="sales" replace />} />
    </Routes>
  );
};
