import { AlertCircle, Wifi, WifiOff, RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ConnectionStatusBannerProps {
  isOnline: boolean;
  isBackendHealthy: boolean;
  message: string;
  onDismiss: () => void;
  onRetry: () => Promise<boolean>;
}

/**
 * Professional banner for connection issues (offline or backend down).
 */
export function ConnectionStatusBanner({
  isOnline,
  isBackendHealthy,
  message,
  onDismiss,
  onRetry,
}: ConnectionStatusBannerProps) {
  const { t } = useTranslation("shared");
  const [retrying, setRetrying] = useState(false);

  if (isOnline && isBackendHealthy) {
    return null;
  }

  const isOffline = !isOnline;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9998] w-[340px]">
      <div
        className={`rounded-lg border shadow-lg overflow-hidden ${
          isOffline
            ? "border-destructive/30 bg-card"
            : "border-warning/30 bg-card"
        }`}
      >
        {/* Colored top accent bar */}
        <div className={`h-1 ${isOffline ? "bg-destructive" : "bg-warning"}`} />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isOffline ? "bg-destructive/10" : "bg-warning/10"
              }`}
            >
              {isOffline ? (
                <WifiOff className="h-4 w-4 text-destructive" />
              ) : (
                <AlertCircle className="h-4 w-4 text-warning" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground leading-none">
                {isOffline
                  ? t("connection.offline", "No Connection")
                  : t("connection.backendIssue", "Service Disruption")}
              </h4>
              {message && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {message}
                </p>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 -mt-0.5 -mr-0.5"
              aria-label={t("common.close", "Close")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action */}
          <div className="mt-3 flex justify-end">
            <Button
              onClick={handleRetry}
              disabled={retrying}
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${retrying ? "animate-spin" : ""}`} />
              {retrying
                ? t("common.retrying", "Retrying…")
                : t("common.retry", "Retry")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
