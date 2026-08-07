import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmailHtmlPreviewProps {
  html: string;
}

export function EmailHtmlPreview({ html }: EmailHtmlPreviewProps) {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith('en');
  const [visible, setVisible] = useState(false);
  const [mobile, setMobile] = useState(false);

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="flex items-center gap-2 w-full p-2.5 rounded-lg border border-dashed border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-sm text-muted-foreground"
      >
        <Eye className="h-4 w-4" />
        {en ? 'Preview email as recipient will see it' : 'Aperçu de l\'e-mail tel que le destinataire le verra'}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {en ? 'Email Preview' : 'Aperçu de l\'e-mail'}
          </span>
          <div className="flex items-center gap-0.5 border border-border/60 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setMobile(false)}
              className={cn('p-1 rounded transition-colors', !mobile ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              <Monitor className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setMobile(true)}
              className={cn('p-1 rounded transition-colors', mobile ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              <Smartphone className="h-3 w-3" />
            </button>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setVisible(false)}>
          <EyeOff className="h-3 w-3 mr-1" />
          {en ? 'Hide' : 'Masquer'}
        </Button>
      </div>
      <div className={cn(
        'rounded-lg border border-border/60 bg-muted/20 overflow-hidden transition-all mx-auto',
        mobile ? 'max-w-[375px]' : 'w-full'
      )}>
        <iframe
          srcDoc={html}
          title="Email preview"
          className="w-full border-0"
          style={{ height: mobile ? '500px' : '420px', pointerEvents: 'none' }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
