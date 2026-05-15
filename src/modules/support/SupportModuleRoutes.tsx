import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SupportHome from './components/SupportHome';
import FaqList from './components/FaqList';
import TicketList from './components/TicketList';
import TicketDetails from './components/TicketDetails';
import NewTicketForm from './components/NewTicketForm';
import GPTChat from './components/GPTChat';

export default function SupportModuleRoutes() {
  return (
    <Routes>
      <Route path="" element={<SupportHome />} />
      <Route path="faq" element={<FaqList />} />
      <Route path="tickets" element={<TicketList />} />
      <Route path="tickets/new" element={<NewTicketForm />} />
      <Route path="tickets/:ticketId" element={<TicketDetails />} />
      <Route path="chat" element={<GPTChat />} />
      <Route path="*" element={<Navigate to="." />} />
    </Routes>
  );
}
