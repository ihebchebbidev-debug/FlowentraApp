import { useLocation } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { WorkflowAutopilotDemo } from './WorkflowAutopilotDemo';
import { useWorkflowOnboarding } from '../../hooks/useWorkflowOnboarding';

/**
 * Inline "Watch Demo" button for the Workflow builder toolbar.
 * Replaces the former floating bottom-right help popup.
 * Auto-opens the tour ONLY on the workflow dashboard index route.
 */
export function WorkflowHelpButton() {
  const { t } = useTranslation('workflow');
  const location = useLocation();

  // Index route ends with /workflow or /workflow/
  const isIndexRoute = /\/workflow\/?$/.test(location.pathname);
  const { isOpen, open, close } = useWorkflowOnboarding({ autoOpen: isIndexRoute });

  return (
    <>
      <Button variant="outline" size="sm" onClick={open} className="h-8 gap-1.5">
        <Play className="h-3.5 w-3.5" />
        {t('onboarding.help.watchDemo')}
      </Button>

      <WorkflowAutopilotDemo open={isOpen} onClose={close} />
    </>
  );
}
