import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Icons removed for clean design

const getActionIcon = (action: string) => {
  return null;
};

const getActionColor = (action: string) => {
  switch (action) {
    case "Used":
      return "text-destructive";
    case "Returned":
    case "Restocked":
      return "text-success";
    default:
      return "text-muted-foreground";
  }
};

export function ArticleHistoryTab({ logs }: { logs: any[] }) {
  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle>
          Stock Movement History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => {
            return (
              <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-lg ${log.action === 'Used' ? 'bg-destructive/10' : 'bg-success/10'}`}>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{log.user}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {log.date} at {log.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.project}</p>
                  <p className="text-sm text-muted-foreground">{log.location}</p>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground italic">{log.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${log.action === 'Used' ? 'text-destructive' : 'text-success'}`}>
                    {log.action === 'Used' ? '-' : '+'}{log.quantity}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Balance: {log.remainingStock}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
