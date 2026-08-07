import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TicketDetails from './components/TicketDetails';
import TicketsDashboardPage from './tickets/pages/TicketsDashboardPage';
import MyTicketsPage from './tickets/pages/MyTicketsPage';
import NewTicketPage from './tickets/pages/NewTicketPage';

export default function SupportModuleRoutes() {
  return (
    <Routes>
      <Route path="" element={<Navigate to="tickets/dashboard" replace />} />
      <Route path="tickets/dashboard" element={<TicketsDashboardPage scope="user" />} />
      <Route path="tickets/new" element={<NewTicketPage />} />
      <Route path="tickets" element={<MyTicketsPage />} />
      <Route path="tickets/:ticketId" element={<TicketDetails />} />
      <Route path="*" element={<Navigate to="tickets/dashboard" replace />} />
    </Routes>
  );
}
