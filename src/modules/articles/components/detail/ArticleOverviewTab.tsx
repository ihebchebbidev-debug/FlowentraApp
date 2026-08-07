import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Icons removed for clean design

export function ArticleOverviewTab({ article, margin, marginPercentage }: { article: any; margin: number; marginPercentage: string; }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Article Details */}
      <Card className="lg:col-span-2 shadow-card border-0">
        <CardHeader>
          <CardTitle>Article Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">Description</h4>
            <p className="text-muted-foreground">{article.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-1">Category</h4>
              <p className="text-muted-foreground">{article.category}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Supplier</h4>
              <p className="text-muted-foreground">{article.supplier}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-1">Weight</h4>
              <p className="text-muted-foreground">{article.weight}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Dimensions</h4>
              <p className="text-muted-foreground">{article.dimensions}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">Notes</h4>
            <p className="text-muted-foreground">{article.notes}</p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Quick Stats */}
      <div className="space-y-6">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle>
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost Price:</span>
              <span className="font-semibold">{article.price} TND</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sell Price:</span>
              <span className="font-semibold">{article.sellPrice} TND</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Margin:</span>
              <div className="text-right">
                <span className="font-semibold text-success">{margin.toFixed(2)} TND</span>
                <span className="text-xs text-muted-foreground ml-1">({marginPercentage}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle>
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Location:</span>
                <span className="font-semibold">{article.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-semibold">{article.updatedAt instanceof Date ? article.updatedAt.toLocaleDateString() : (article.updatedAt || '-')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
