import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Icons removed for clean design

export function ArticleStatusCards({
  article,
  StatusIcon,
  getStatusColor,
  isLowStock,
}: {
  article: any;
  StatusIcon: any;
  getStatusColor: (s: string) => string;
  isLowStock: boolean;
}) {
  return (
    <div className="p-4 sm:p-6 border-b border-border">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="text-xl font-bold">{article.stock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isLowStock ? 'bg-warning/10' : 'bg-success/10'}`}>
                <StatusIcon className={`h-5 w-5 ${isLowStock ? 'text-warning' : 'text-success'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(article.status)}>
                  {article.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Value</p>
                <p className="text-xl font-bold">{(article.stock * article.sellPrice).toFixed(2)} TND</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-4/10">
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold">{article.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
