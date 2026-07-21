import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Article } from "@/modules/inventory-services/types";
import FileUploader from "@/modules/support/components/FileUploader";
import { getUnitLabel, isDecimalUnit } from "@/constants/units";

interface MaterialUsage {
  articleId: string;
  articleName: string;
  sku?: string;
  quantity: number;
  estimatedQuantity?: number;
  unitPrice: number;
  unit?: string;
  jobId?: string; // Optional job ID for service order context
  internalComment?: string;
  externalComment?: string;
  replacing: boolean;
  oldArticleModel?: string;
  oldArticleStatus?: 'broken' | 'not_broken' | 'unknown';
  photos: File[];
}

interface Job {
  id: string;
  title: string;
  description?: string;
}

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MaterialUsage) => void | Promise<void>;
  availableMaterials?: Article[];
  availableJobs?: Job[]; // Jobs available for selection (only for service orders)
  context?: 'service_order' | 'dispatch'; // Context to determine if job selection is needed
}

export function AddMaterialModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  availableMaterials = [],
  availableJobs = [],
  context = 'dispatch'
}: AddMaterialModalProps) {
  const { t } = useTranslation('service_orders');
  const { t: tCommon } = useTranslation("common");

  const materialArticles = availableMaterials.filter(article => article.type === 'material');

  // Helper to get price from various backend naming conventions
  const getMaterialPrice = (article: Article | undefined): number => {
    if (!article) return 0;
    return article.sellPrice || 
           (article as any).salesPrice || 
           article.costPrice || 
           (article as any).purchasePrice ||
           article.basePrice || 
           0;
  };

  const [selectedUnit, setSelectedUnit] = useState<string>('piece');
  const [materialPickerOpen, setMaterialPickerOpen] = useState(false);


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MaterialUsage>({
    articleId: materialArticles[0]?.id || "",
    articleName: materialArticles[0]?.name || "",
    sku: materialArticles[0]?.sku || "",
    quantity: 1,
    estimatedQuantity: 1,
    unitPrice: getMaterialPrice(materialArticles[0]),
    unit: materialArticles[0]?.unit || 'piece',
    jobId: availableJobs[0]?.id || "",
    internalComment: "",
    externalComment: "",
    replacing: false,
    oldArticleModel: "",
    oldArticleStatus: "unknown",
    photos: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    
      // Reset form
      setFormData({
        articleId: materialArticles[0]?.id || "",
        articleName: materialArticles[0]?.name || "",
        sku: materialArticles[0]?.sku || "",
        quantity: 1,
        estimatedQuantity: 1,
        unitPrice: getMaterialPrice(materialArticles[0]),
        unit: materialArticles[0]?.unit || 'piece',
        jobId: availableJobs[0]?.id || "",
        internalComment: "",
        externalComment: "",
        replacing: false,
        oldArticleModel: "",
        oldArticleStatus: "unknown",
        photos: [],
      });
      setSelectedUnit(materialArticles[0]?.unit || 'piece');
      onClose();
    } catch (error) {
      console.error('Failed to submit material:', error);
      toast.error(
        (error as any)?.message
          ? `${t('add_material')}: ${(error as any).message}`
          : t('material_form.save_failed', 'Failed to save material. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaterialChange = (articleId: string) => {
    const selected = materialArticles.find(article => article.id === articleId);
    if (selected) {
      // Get price from sellPrice, salesPrice (backend naming), costPrice, purchasePrice, or basePrice
      const price = selected.sellPrice || 
                    (selected as any).salesPrice || 
                    selected.costPrice || 
                    (selected as any).purchasePrice ||
                    selected.basePrice || 
                    0;
      const unit = selected.unit || 'piece';
      setSelectedUnit(unit);
      setFormData({
        ...formData,
        articleId,
        articleName: selected.name,
        sku: selected.sku || "",
        unitPrice: price,
        unit,
        quantity: 1,
        estimatedQuantity: 1,
      });
    }
  };

  const handlePhotosChange = (files: File[]) => {
    setFormData({ ...formData, photos: files });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t('add_material')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Material Selection */}
          <div className="space-y-2">
            <Label htmlFor="material" className="text-sm font-medium">
              {t('materials')} <span className="text-destructive">*</span>
            </Label>
            <Popover open={materialPickerOpen} onOpenChange={setMaterialPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={materialPickerOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {formData.articleId
                      ? (() => {
                          const a = materialArticles.find(m => m.id === formData.articleId);
                          return a
                            ? `${a.name}${a.sku ? ` (${a.sku})` : ''} — ${getUnitLabel(a.unit || 'piece', t)}`
                            : formData.articleName;
                        })()
                      : t('material_form.select_material')}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover border border-border shadow-lg z-50" align="start">
                <Command
                  filter={(value, search) => {
                    const a = materialArticles.find(m => m.id === value);
                    if (!a) return 0;
                    const hay = `${a.name} ${a.sku ?? ''}`.toLowerCase();
                    return hay.includes(search.toLowerCase()) ? 1 : 0;
                  }}
                >
                  <CommandInput placeholder={t('material_form.select_material')} />
                  <CommandList>
                    <CommandEmpty>{tCommon('no_results') || 'No results'}</CommandEmpty>
                    <CommandGroup>
                      {materialArticles.map((article) => (
                        <CommandItem
                          key={article.id}
                          value={article.id}
                          onSelect={(val) => {
                            handleMaterialChange(val);
                            setMaterialPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              formData.articleId === article.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span className="truncate">
                            {article.name} {article.sku ? `(${article.sku})` : ''} — {getUnitLabel(article.unit || 'piece', t)}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

          </div>

          {/* Job Selection - Only show for service orders */}
          {context === 'service_order' && availableJobs.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="job" className="text-sm font-medium">
                {t('material_form.assign_to_job')} <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.jobId} 
                onValueChange={(value) => setFormData({ ...formData, jobId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('material_form.select_job')} />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {availableJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity and Estimated Quantity (both contexts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                {t('quantity')} ({getUnitLabel(selectedUnit, t)}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0.01 })}
                required
              />
              {typeof formData.estimatedQuantity === 'number' &&
                formData.estimatedQuantity > 0 &&
                formData.quantity > formData.estimatedQuantity && (
                  <p className="text-xs text-destructive">
                    Exceeds estimated by {(formData.quantity - formData.estimatedQuantity).toFixed(2)} {getUnitLabel(selectedUnit, t)}
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedQuantity" className="text-sm font-medium">
                Estimated Qty ({getUnitLabel(selectedUnit, t)})
              </Label>
              <Input
                id="estimatedQuantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimatedQuantity ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedQuantity: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Planned amount"
              />
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="internalComment" className="text-sm font-medium">
                {t('material_form.internal_comment')}
              </Label>
              <Textarea
                id="internalComment"
                placeholder={t('material_form.internal_comment_placeholder')}
                value={formData.internalComment}
                onChange={(e) => setFormData({ ...formData, internalComment: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalComment" className="text-sm font-medium">
                {t('material_form.external_comment')}
              </Label>
              <Textarea
                id="externalComment"
                placeholder={t('material_form.external_comment_placeholder')}
                value={formData.externalComment}
                onChange={(e) => setFormData({ ...formData, externalComment: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Replacing Article Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="replacing"
                checked={formData.replacing}
                onCheckedChange={(checked) => setFormData({ ...formData, replacing: checked as boolean })}
              />
              <Label htmlFor="replacing" className="text-sm font-medium cursor-pointer">
                {t('material_form.replacing_existing')}
              </Label>
            </div>

            {formData.replacing && (
              <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
                <h4 className="font-medium text-sm">{t('material_form.replacement_details')}</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="oldArticleModel" className="text-sm font-medium">
                    {t('material_form.old_article_model')}
                  </Label>
                  <Input
                    id="oldArticleModel"
                    placeholder={t('material_form.old_article_model_placeholder')}
                    value={formData.oldArticleModel}
                    onChange={(e) => setFormData({ ...formData, oldArticleModel: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oldStatus" className="text-sm font-medium">
                    {t('material_form.old_article_status')}
                  </Label>
                  <Select
                    value={formData.oldArticleStatus}
                    onValueChange={(value: 'broken' | 'not_broken' | 'unknown') => 
                      setFormData({ ...formData, oldArticleStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      <SelectItem value="unknown">{t('material_form.status_unknown')}</SelectItem>
                      <SelectItem value="broken">{t('material_form.status_broken')}</SelectItem>
                      <SelectItem value="not_broken">{t('material_form.status_not_broken')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('material_form.old_article_photos')}
                  </Label>
                  <FileUploader
                    files={formData.photos}
                    setFiles={handlePhotosChange}
                    maxFiles={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>{tCommon("saving") || "Saving..."}</>
              ) : (
                t('add_material')
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              {tCommon("cancel") || "Cancel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}