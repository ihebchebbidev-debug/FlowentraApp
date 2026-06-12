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
import { IntegrationAutopilotDemo } from './IntegrationAutopilotDemo';
import { useIntegrationOnboarding } from '../../hooks/useIntegrationOnboarding';

export function IntegrationHelpButton() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Auto-open tour only on the hub index route
  const isIndexRoute = /\/external\/?$/.test(location.pathname);
  const { isOpen, open, close, reset } = useIntegrationOnboarding({ autoOpen: isIndexRoute });

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              aria-label="Integration Hub Help"
              title="Integration Hub Help"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>Integration Hub</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setMenuOpen(false); open(); }}>
              <Play className="h-4 w-4 mr-2" /> Watch Demo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setMenuOpen(false); reset(); }}>
              <RotateCcw className="h-4 w-4 mr-2" /> Replay from Scratch
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="https://docs.flowentra.com/integrations" target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-4 w-4 mr-2" /> Documentation
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <IntegrationAutopilotDemo open={isOpen} onClose={close} />
    </>
  );
}
