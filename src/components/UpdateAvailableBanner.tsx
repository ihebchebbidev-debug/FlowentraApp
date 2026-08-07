import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface UpdateAvailableBannerProps {
  isVisible: boolean;
  onRefresh: () => void;
  isDismissible?: boolean;
}

/**
 * Persistent banner that appears when a new version is deployed.
 * Stays at the top of the page and is hard to miss.
 */
export function UpdateAvailableBanner({
  isVisible,
  onRefresh,
  isDismissible = true,
}: UpdateAvailableBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state if the banner becomes visible again
  useEffect(() => {
    if (isVisible) {
      setDismissed(false);
    }
  }, [isVisible]);

  if (!isVisible || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-b border-blue-200 dark:border-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            {t('deployment.updateAvailable') || 'New Version Available'}
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            {t('deployment.updateDescription') || 'A new version of the app has been deployed. Please refresh to get the latest features and fixes.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={onRefresh}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('deployment.refresh') || 'Refresh Now'}
          </Button>
          
          {isDismissible && (
            <Button
              onClick={() => setDismissed(true)}
              variant="ghost"
              size="sm"
              className="text-blue-700 hover:text-blue-900 dark:text-blue-300"
            >
              {t('common.dismiss') || 'Dismiss'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
