import { useTranslation } from 'react-i18next';
import { Mail, Calendar } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';

export function EmailCalendarPage() {
  const { t } = useTranslation('email-calendar');
  const location = useLocation();

  // Determine header icon and title based on active route
  const isCalendarActive = location.pathname.startsWith('/dashboard/email-calendar/calendar');
  const HeaderIcon = isCalendarActive ? Calendar : Mail;
  const headerTitle = isCalendarActive ? t('tabs.calendar') : t('tabs.emails');

  return (
    <main className="flex-1 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <HeaderIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{headerTitle}</h1>
            <p className="text-[11px] text-muted-foreground">{t('description')}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Outlet />
      </div>
    </main>
  );
}
