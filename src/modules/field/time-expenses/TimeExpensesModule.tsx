import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TimeExpensesPage from './pages/TimeExpensesPage';

const TimeExpensesModule: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<TimeExpensesPage />} />
    </Routes>
  );
};

export default TimeExpensesModule;