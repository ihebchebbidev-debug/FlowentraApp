import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export interface LogEntry {
  id: string;
  type: string; // attachment, note, time, expense, technician
  action: string; // added, removed, updated
  actor: string;
  when: string; // ISO date
  details?: string;
}

interface LogsCardProps {
  logs: LogEntry[];
}

export const LogsCard: React.FC<LogsCardProps> = ({ logs }) => {
  const { t } = useTranslation("logs");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground">{t("no_logs")}</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">{t(`types.${log.type}`, { defaultValue: log.type })} • {t(`actions.${log.action}`, { defaultValue: log.action })}</div>
                    {log.details ? <div className="text-muted-foreground text-sm">{log.details}</div> : null}
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>{log.actor}</div>
                    <div>{format(new Date(log.when), "dd/MM/yyyy HH:mm")}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LogsCard;
