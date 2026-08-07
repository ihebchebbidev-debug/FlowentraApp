import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Icons removed for clean design
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ArticleInventoryTab({ article, stockPercentage, isLowStock }: { article: any; stockPercentage: number; isLowStock: boolean; }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Stock</span>
              <span className="font-semibold">{article.stock}/{article.maxStock}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isLowStock ? 'bg-warning' : 'bg-success'
                }`}
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: {article.minStock}</span>
              <span>Max: {article.maxStock}</span>
            </div>
          </div>
          
          {isLowStock && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Low Stock Alert</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Stock is below minimum level. Consider reordering.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle>Reorder Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reorder Point:</span>
            <span className="font-semibold">{article.reorderPoint} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Suggested Order:</span>
            <span className="font-semibold">{article.maxStock - article.stock} units</span>
          </div>
          <Button className="w-full mt-4" variant="outline">Create Purchase Order</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Stock</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="add-quantity">Quantity to Add</Label>
                  <Input
                    id="add-quantity"
                    type="number"
                    placeholder="Enter quantity"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-reason">Reason</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">New Purchase</SelectItem>
                      <SelectItem value="return">Customer Return</SelectItem>
                      <SelectItem value="adjustment">Inventory Adjustment</SelectItem>
                      <SelectItem value="transfer">Transfer In</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Add Stock</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                Remove Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Remove Stock</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="remove-quantity">Quantity to Remove</Label>
                  <Input
                    id="remove-quantity"
                    type="number"
                    placeholder="Enter quantity"
                    min="1"
                    max={article.stock}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remove-reason">Reason</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="used">Used in Project</SelectItem>
                      <SelectItem value="damaged">Damaged/Defective</SelectItem>
                      <SelectItem value="lost">Lost/Missing</SelectItem>
                      <SelectItem value="transfer">Transfer Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" variant="destructive">Remove Stock</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="w-full justify-start">
            Edit Details
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
