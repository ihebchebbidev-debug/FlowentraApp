import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

type Props = {
  title?: string;
  message?: string;
  imageSrc?: string; // optional image URL (public path ok)
  onReload?: () => void;
};

export default function ErrorScreen({
  title = 'Oops — something went wrong',
  message = 'An unexpected error occurred while loading this page. Try reloading or come back later.',
  imageSrc,
  onReload,
}: Props) {
  const { t } = useTranslation();

  const handleReload = () => {
    if (onReload) return onReload();
    // default: full page reload
    window.location.reload();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center bg-popover/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-md">
        <div className="flex flex-col items-center gap-4">
          {imageSrc ? (
            <img src={imageSrc} alt="error" className="w-40 h-40 object-contain" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertOctagon className="w-12 h-12 text-destructive" />
            </div>
          )}

          <h2 className="text-2xl font-semibold mt-2">{t(title)}</h2>
          <p className="text-muted-foreground mt-1">{t(message)}</p>

          <div className="mt-4 flex items-center gap-2">
            <Button onClick={handleReload} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {t('Reload')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
