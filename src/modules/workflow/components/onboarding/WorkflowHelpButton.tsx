import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, Play, RotateCcw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { WorkflowAutopilotDemo } from './WorkflowAutopilotDemo';
import { useWorkflowOnboarding } from '../../hooks/useWorkflowOnboarding';

const DOCS_URL = 'https://docs.lovable.dev/features/workflow';

/**
 * Floating help button + auto-tour launcher.
 * Auto-opens the tour ONLY on the workflow dashboard index route to avoid
 * surprising users deep inside detail / dispatch board / calendar views.
 */
export function WorkflowHelpButton() {
  const { t } = useTranslation('workflow');
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Index route ends with /workflow or /workflow/
  const isIndexRoute = /\/workflow\/?$/.test(location.pathname);
  const { isOpen, open, close, reset } = useWorkflowOnboarding({ autoOpen: isIndexRoute });

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              aria-label={t('onboarding.help.title')}
              title={t('onboarding.help.title')}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>{t('onboarding.help.title')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setMenuOpen(false); open(); }}>
              <Play className="h-4 w-4 mr-2" /> {t('onboarding.help.watchDemo')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setMenuOpen(false); reset(); }}>
              <RotateCcw className="h-4 w-4 mr-2" /> {t('onboarding.help.replayFromScratch')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-4 w-4 mr-2" /> {t('onboarding.help.docs')}
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <WorkflowAutopilotDemo open={isOpen} onClose={close} />
    </>
  );
}
