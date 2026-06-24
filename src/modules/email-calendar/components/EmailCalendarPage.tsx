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
      <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <HeaderIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{headerTitle}</h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">{t('description')}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 lg:p-6">
        <Outlet />
      </div>
    </main>
  );
}
