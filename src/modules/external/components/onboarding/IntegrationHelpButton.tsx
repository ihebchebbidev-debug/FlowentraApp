import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntegrationAutopilotDemo } from './IntegrationAutopilotDemo';
import { useIntegrationOnboarding } from '../../hooks/useIntegrationOnboarding';

/**
 * Inline "Watch Demo" button for the Integration Hub header.
 * Replaces the former floating bottom-right help popup.
 */
export function IntegrationHelpButton() {
  const location = useLocation();
  const { t } = useTranslation();

  // Auto-open tour only on the hub index route
  const isIndexRoute = /\/external\/?$/.test(location.pathname);
  const { isOpen, open, close } = useIntegrationOnboarding({ autoOpen: isIndexRoute });

  return (
    <>
      <Button variant="outline" onClick={open} className="gap-2 shrink-0">
        <Play className="h-4 w-4" />
        {t('dispatcher.watchDemo', 'Watch Demo')}
      </Button>

      <IntegrationAutopilotDemo open={isOpen} onClose={close} />
    </>
  );
}
