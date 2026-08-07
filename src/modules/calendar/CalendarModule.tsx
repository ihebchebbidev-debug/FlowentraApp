import { Routes, Route } from "react-router-dom";
import { CalendarPage } from "./components/CalendarPage";
import { PluginGate } from "@/modules/shared/plugins";

export function CalendarModule() {
  return (
    <PluginGate code="PL0010CALENDAR">
      <Routes>
        <Route index element={<CalendarPage />} />
      </Routes>
    </PluginGate>
  );
}

