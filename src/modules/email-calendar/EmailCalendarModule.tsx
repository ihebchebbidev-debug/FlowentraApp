import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { EmailCalendarPage } from './components/EmailCalendarPage';
import { EmailSettingsTab } from './components/EmailSettingsTab';
import { CalendarSettingsTab } from './components/CalendarSettingsTab';
import { useConnectedAccounts } from './hooks/useConnectedAccounts';
import { PluginGate } from "@/modules/shared/plugins";

function EmailsRoute() {
  const {
    accounts,
    emails,
    emailsTotalCount,
    emailsLoading,
    syncing,
    syncEmails,
    fetchSyncedEmails,
    startAutoSync,
    stopAutoSync,
    sendEmail,
    sendingEmail,
    toggleStarEmail,
    toggleReadEmail,
    deleteEmail,
  } = useConnectedAccounts();

  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);

  return (
    <PluginGate code="PL0028EMAILCALENDAR">
      <EmailSettingsTab
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelectAccount={setSelectedAccountId}
        emails={emails}
        emailsTotalCount={emailsTotalCount}
        emailsLoading={emailsLoading}
        syncing={syncing}
        onSyncEmails={syncEmails}
        onFetchEmails={fetchSyncedEmails}
        onStartAutoSync={startAutoSync}
        onStopAutoSync={stopAutoSync}
        onSendEmail={sendEmail}
        sendingEmail={sendingEmail}
        onToggleStar={toggleStarEmail}
        onToggleRead={toggleReadEmail}
        onDeleteEmail={deleteEmail}
      />
      </PluginGate>
  );
}

function CalendarRoute() {
  const {
    accounts,
    calendarEvents,
    calendarEventsTotalCount,
    calendarEventsLoading,
    calendarSyncing,
    syncCalendar,
    fetchCalendarEvents,
    startCalendarAutoSync,
    stopCalendarAutoSync,
  } = useConnectedAccounts();

  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);

  return (
    <CalendarSettingsTab
      accounts={accounts}
      selectedAccountId={selectedAccountId}
      onSelectAccount={setSelectedAccountId}
      calendarEvents={calendarEvents}
      calendarEventsTotalCount={calendarEventsTotalCount}
      calendarEventsLoading={calendarEventsLoading}
      calendarSyncing={calendarSyncing}
      onSyncCalendar={syncCalendar}
      onFetchCalendarEvents={fetchCalendarEvents}
      onStartCalendarAutoSync={startCalendarAutoSync}
      onStopCalendarAutoSync={stopCalendarAutoSync}
    />
  );
}

export function EmailCalendarModule() {
  return (
    <Routes>
      <Route element={<EmailCalendarPage />}>
        <Route index element={<EmailsRoute />} />
        <Route path="emails" element={<EmailsRoute />} />
        <Route path="calendar" element={<CalendarRoute />} />
      </Route>
    </Routes>
  );
}
