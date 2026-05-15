import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Edit, Trash2, Camera } from "lucide-react";
import type { ArticleUsage } from "../types";

interface ArticlesCardProps {
  articlesUsed: ArticleUsage[];
  dispatchId: string;
  availableArticles?: { id: string; name: string; sku?: string; unitPrice?: number }[];
  onCreate?: (data: Omit<ArticleUsage, "id" | "usedAt" | "totalPrice"> & { photo?: File | null }) => void;
  onUpdate?: (id: string, data: Partial<ArticleUsage> & { photo?: File | null }) => void;
}

export function ArticlesCard({ articlesUsed, dispatchId, availableArticles = [], onCreate, onUpdate }: ArticlesCardProps) {
  const { t } = useTranslation("job-detail");
  const { t: tCommon } = useTranslation("common");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    articleId: availableArticles[0]?.id || "",
    articleName: availableArticles[0]?.name || "",
    sku: availableArticles[0]?.sku || "",
    quantity: 1,
    unitPrice: availableArticles[0]?.unitPrice || 0,
    replacing: false,
    photo: null as File | null,
    oldArticleModel: "",
    oldArticleStatus: "unknown",
  });
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const totalArticles = articlesUsed.reduce((sum, a) => sum + a.totalPrice, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalPrice = formData.quantity * formData.unitPrice;
    if (editingId && typeof onUpdate === "function") {
      onUpdate(editingId, {
        articleName: formData.articleName,
        sku: formData.sku,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        totalPrice,
        replacing: formData.replacing,
        oldArticleModel: formData.oldArticleModel,
        oldArticleStatus: formData.oldArticleStatus as any,
        photo: formData.photo,
      });
    } else if (typeof onCreate === "function") {
      onCreate({
        dispatchId,
        usedBy: "technician",
        articleId: formData.articleId,
        articleName: formData.articleName,
        sku: formData.sku,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        replacing: formData.replacing,
        oldArticleModel: formData.oldArticleModel,
        oldArticleStatus: formData.oldArticleStatus as any,
        photo: formData.photo,
      });
    } else {
      console.log("Article add:", formData);
    }
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      articleId: availableArticles[0]?.id || "",
      articleName: availableArticles[0]?.name || "",
      sku: availableArticles[0]?.sku || "",
      quantity: 1,
      unitPrice: availableArticles[0]?.unitPrice || 0,
      replacing: false,
      photo: null,
      oldArticleModel: "",
      oldArticleStatus: "unknown",
    });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  useEffect(() => {
    if (formData.photo) {
      const url = URL.createObjectURL(formData.photo);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [formData.photo]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {t("tabs.articles")}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {t("add_article", "Add Article")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("add_article", "Add Article")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>{t("articles_card.article")}</Label>
                  <Select
                    value={formData.articleId}
                    onValueChange={(val) => {
                      const found = availableArticles.find(a => a.id === val);
                      setFormData({
                        ...formData,
                        articleId: val,
                        articleName: found?.name || formData.articleName,
                        sku: found?.sku || formData.sku,
                        unitPrice: found?.unitPrice || formData.unitPrice,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableArticles.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name} {a.sku ? `(${a.sku})` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t("articles_card.quantity")}</Label>
                  <Input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value || "1") })} />
                </div>

                <div>
                  <Label>{t("articles_card.unit_price")}</Label>
                  <Input type="number" step="0.01" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value || "0") })} />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox checked={formData.replacing} onCheckedChange={(c) => setFormData({ ...formData, replacing: c as boolean })} />
                  <Label>{t("articles_card.replacing_existing")}</Label>
                </div>

                {formData.replacing && (
                  <div>
                    <Label>{t("articles_card.old_article_photo")}</Label>
                    <div className="flex gap-2">
                      <Input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })} className="hidden" />
                      <Button variant="outline" onClick={() => cameraRef.current?.click()} className="gap-2">
                        <Camera className="h-4 w-4" />
                        {t("take_photo")}
                      </Button>
                      <Button variant="outline" onClick={() => document.createElement('input').click()} className="gap-2">
                        {tCommon("choose_file")}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">{t("save") || "Save"}</Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{tCommon("cancel")}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {articlesUsed.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t("no_articles", "No articles used")}</p>
        ) : (
          <div className="space-y-3">
            {articlesUsed.map(a => (
              <div key={a.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.articleName} {a.sku ? `(${a.sku})` : ""}</div>
                  <div className="text-sm text-muted-foreground">{a.quantity} x {a.unitPrice.toFixed(2)} = {a.totalPrice.toFixed(2)}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditingId(a.id);
                    setFormData({
                      articleId: a.articleId || "",
                      articleName: a.articleName,
                      sku: a.sku || "",
                      quantity: a.quantity,
                      unitPrice: a.unitPrice,
                      replacing: !!a.replacing,
                      photo: null,
                      oldArticleModel: a.oldArticleModel || "",
                      oldArticleStatus: a.oldArticleStatus || "unknown",
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
