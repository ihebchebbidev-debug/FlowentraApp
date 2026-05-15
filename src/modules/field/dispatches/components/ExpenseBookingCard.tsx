import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, DollarSign, Edit, Trash2, Upload, FileText } from "lucide-react";
import type { ExpenseEntry, CreateExpenseData } from "../types";

interface ExpenseBookingCardProps {
  expenses: ExpenseEntry[];
  dispatchId: string;
  technicianId: string;
  onCreate?: (data: CreateExpenseData) => void;
  onUpdate?: (id: string, data: CreateExpenseData) => void;
}

export function ExpenseBookingCard({ expenses, dispatchId, technicianId, onCreate, onUpdate }: ExpenseBookingCardProps) {
  const { t } = useTranslation("expense-booking");
  const { t: tCommon } = useTranslation("common");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateExpenseData>({
    dispatchId,
    technicianId,
    type: "travel",
    amount: 0,
    currency: "TND",
    description: "",
    date: new Date(),
  });

  const getStatusColor = (status: ExpenseEntry["status"]) => {
    const colors = {
      pending: "bg-warning/10 text-warning",
      approved: "bg-success/10 text-success",
      rejected: "bg-destructive/10 text-destructive"
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const getExpenseTypeColor = (type: ExpenseEntry["type"]) => {
    const colors = {
      travel: "bg-primary/10 text-primary",
      meal: "bg-warning/10 text-warning",
      accommodation: "bg-secondary text-secondary-foreground",
      materials: "bg-success/10 text-success",
      other: "bg-muted text-muted-foreground"
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && typeof onUpdate === "function") {
      onUpdate(editingId, formData);
    } else if (typeof onCreate === "function") {
      onCreate(formData);
    } else {
      console.log("Creating expense:", formData);
    }
    setIsDialogOpen(false);
    setEditingId(null);
    // Reset form
    setFormData({
      dispatchId,
      technicianId,
      type: "travel",
      amount: 0,
      currency: "TND",
      description: "",
      date: new Date(),
    });
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {t("title")}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" onClick={() => { setEditingId(null); setFormData({ dispatchId, technicianId, type: 'travel', amount: 0, currency: 'TND', description: '', date: new Date() }); }}>
                  <Plus className="h-4 w-4" />
                  {t("new_expense")}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? (t("edit_expense") || t("new_expense")) : t("new_expense")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="expenseType">{t("expense_type")}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: ExpenseEntry["type"]) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travel">{t("types.travel")}</SelectItem>
                      <SelectItem value="meal">{t("types.meal")}</SelectItem>
                      <SelectItem value="accommodation">{t("types.accommodation")}</SelectItem>
                      <SelectItem value="materials">{t("types.materials")}</SelectItem>
                      <SelectItem value="other">{t("types.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">{t("amount")}</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">{t("currency")}</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TND">TND</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="date">{t("date")}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={format(formData.date, "yyyy-MM-dd")}
                    onChange={(e) =>
                      setFormData({ ...formData, date: new Date(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">{t("description")}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={t("expense_description_placeholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="receipt">{t("receipt")}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {t("upload_receipt")}
                    </p>
                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ ...formData, receipt: file });
                        }
                      }}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById("receipt")?.click()}
                    >
                      {t("choose_file")}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingId ? (t("save_changes") || t("add_expense")) : t("add_expense")}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t("no_expenses")}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Total: <span className="font-medium text-foreground">
                {totalExpenses.toFixed(2)} TND
              </span>
            </div>
            
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getExpenseTypeColor(expense.type)}>
                        {t(`types.${expense.type}`)}
                      </Badge>
                      <Badge className={getStatusColor(expense.status)}>
                        {t(`statuses.${expense.status}`)}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => {
                        // open edit dialog
                        setEditingId(expense.id);
                        setFormData({
                          dispatchId: expense.dispatchId,
                          technicianId: expense.technicianId,
                          type: expense.type,
                          amount: expense.amount,
                          currency: expense.currency,
                          description: expense.description || "",
                          date: expense.date,
                          receipt: expense.receipt && typeof expense.receipt !== 'string' ? expense.receipt : undefined,
                        });
                        setIsDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t("amount")}:</span>
                      <p className="font-medium text-lg">{expense.amount.toFixed(2)} {expense.currency}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("date")}:</span>
                      <p className="font-medium">{format(expense.date, "dd/MM/yyyy")}</p>
                    </div>
                    {expense.receipt && (
                      <div>
                        <span className="text-muted-foreground">{t("receipt")}:</span>
                        <div className="flex items-center gap-1 mt-1">
                          <FileText className="h-4 w-4 text-primary" />
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            {t("view")} {t("receipt").toLowerCase()}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {expense.description && (
                    <div>
                      <span className="text-muted-foreground text-sm">{t("description")}:</span>
                      <p className="text-sm">{expense.description}</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    By {expense.technicianName} • {format(expense.createdAt, "dd/MM/yyyy HH:mm")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}