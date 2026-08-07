// (auto-open removed) — demo now only starts when the user clicks "Watch Demo"
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
  const { t } = useTranslation();

  // Manual trigger only — never auto-open the demo.
  const { isOpen, open, close } = useIntegrationOnboarding({ autoOpen: false });


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
