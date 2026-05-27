import { useState } from 'react';
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

export function WorkflowHelpButton() {
  const { t } = useTranslation('workflow');
  const { isOpen, open, close, reset } = useWorkflowOnboarding();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
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
            <DropdownMenuItem disabled>
              <BookOpen className="h-4 w-4 mr-2" /> {t('onboarding.help.docs')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <WorkflowAutopilotDemo open={isOpen} onClose={close} />
    </>
  );
}
