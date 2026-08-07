import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Article, CreateArticleRequest, ArticleType, ArticleStatus } from '@/types/articles';
import { useCategories, useLocations, useGroups } from '@/modules/articles/hooks/useArticles';

interface ArticleFormProps {
  article?: Article;
  onSubmit: (data: CreateArticleRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ArticleForm({ article, onSubmit, onCancel, isSubmitting }: ArticleFormProps) {
  const { t } = useTranslation('articles');
  const { categories } = useCategories();
  const { locations } = useLocations();
  const { groups } = useGroups();

  // Normalize status to one valid for the article type to prevent Radix Select
  // throwing when the bound value doesn't match any rendered <SelectItem>.
  const normalizeStatus = (type: ArticleType, status?: string): ArticleStatus => {
    const materialStatuses: ArticleStatus[] = ['available', 'low_stock', 'out_of_stock', 'discontinued'];
    const serviceStatuses: ArticleStatus[] = ['active', 'inactive'];
    const allowed = type === 'service' ? serviceStatuses : materialStatuses;
    if (status && (allowed as string[]).includes(status)) return status as ArticleStatus;
    return type === 'service' ? 'active' : 'available';
  };

  const initialType: ArticleType = article?.type || 'material';

  const [formData, setFormData] = useState<CreateArticleRequest & { categoryId?: number; locationId?: number; groupId?: number }>({
    type: initialType,
    name: article?.name || '',
    sku: article?.sku || '',
    description: article?.description || '',
    category: article?.category || '',
    categoryId: (article as any)?.categoryId,
    status: normalizeStatus(initialType, article?.status as string),
    stock: article?.stock,
    minStock: article?.minStock,
    costPrice: article?.costPrice,
    sellPrice: article?.sellPrice,
    supplier: article?.supplier || '',
    location: article?.location || '',
    locationId: (article as any)?.locationId,
    group: article?.group || '',
    groupId: (article as any)?.groupId,
    subLocation: article?.subLocation || '',
    basePrice: article?.basePrice,
    duration: article?.duration,
    skillsRequired: article?.skillsRequired || [],
    materialsNeeded: article?.materialsNeeded || [],
    preferredUsers: article?.preferredUsers || [],
    tags: article?.tags || [],
    notes: article?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.name.trim()) {
      return;
    }
    // Submit with categoryId and locationId for backend
    const dataToSubmit = {
      ...formData,
      category: formData.category || 'General',
      categoryId: formData.categoryId,
      locationId: formData.locationId,
      groupId: formData.groupId,
    };
    
    onSubmit(dataToSubmit as any);
  };

  const handleTypeChange = (type: ArticleType) => {
    setFormData({ ...formData, type, status: normalizeStatus(type, formData.status as string) });
  };

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeLocations = Array.isArray(locations) ? locations : [];
  const safeGroups = Array.isArray(groups) ? groups : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Selection */}
      <div className="space-y-2">
        <Label>{t('add.article_type')}</Label>
        <Tabs value={formData.type} onValueChange={(value) => handleTypeChange(value as ArticleType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="material">{t('cards.material')}</TabsTrigger>
            <TabsTrigger value="service">{t('cards.service')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('add.article_name')} *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('add.article_name_placeholder')}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">{t('fields.reference')}</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder={formData.type === 'service' ? t('add.sku_placeholder_service') : t('add.sku_placeholder_material')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">{t('add.category')} *</Label>
          <Select
            value={formData.categoryId ? formData.categoryId.toString() : ''}
            onValueChange={(value) => {
              const selectedCategory = safeCategories.find(c => c.id.toString() === value);
              setFormData({ 
                ...formData, 
                category: selectedCategory?.name || '',
                categoryId: selectedCategory ? Number(selectedCategory.id) : undefined
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('add.select_category')} />
            </SelectTrigger>
            <SelectContent>
              {safeCategories
                .filter(c => c.type === formData.type)
                .map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t('table.status')} *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as ArticleStatus })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('add.select_status')} />
            </SelectTrigger>
            <SelectContent>
              {formData.type === 'material' ? (
                <>
                  <SelectItem value="available">{t('statuses.available')}</SelectItem>
                  <SelectItem value="low_stock">{t('statuses.low_stock')}</SelectItem>
                  <SelectItem value="out_of_stock">{t('statuses.out_of_stock')}</SelectItem>
                  <SelectItem value="discontinued">{t('statuses.discontinued')}</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="active">{t('statuses.active')}</SelectItem>
                  <SelectItem value="inactive">{t('statuses.inactive')}</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('add.description')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('add.description_placeholder')}
          rows={3}
        />
      </div>

      {/* Material-specific fields */}
      {formData.type === 'material' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('add.inventory_details')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">{t('add.current_stock')}</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock || ''}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">{t('add.minimum_stock_level')}</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock || ''}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice">{t('add.cost_price')}</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice || ''}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellPrice">{t('add.sell_price')}</Label>
              <Input
                id="sellPrice"
                type="number"
                step="0.01"
                value={formData.sellPrice || ''}
                onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">{t('add.supplier')}</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder={t('add.supplier_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t('fields.location')}</Label>
              <Select
                value={formData.locationId ? formData.locationId.toString() : ''}
                onValueChange={(value) => {
                  const selectedLocation = safeLocations.find(l => l.id.toString() === value);
                  setFormData({ 
                    ...formData, 
                    location: selectedLocation?.name || '',
                    locationId: selectedLocation ? Number(selectedLocation.id) : undefined
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('add.select_location')} />
                </SelectTrigger>
                <SelectContent>
                  {safeLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">              <Label htmlFor="group">{t('fields.group')}</Label>
              <Select
                value={formData.groupId ? formData.groupId.toString() : ''}
                onValueChange={(value) => {
                  const selectedGroup = safeGroups.find(g => g.id.toString() === value);
                  setFormData({ 
                    ...formData, 
                    group: selectedGroup?.name || '',
                    groupId: selectedGroup ? Number(selectedGroup.id) : undefined
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('add.select_group')} />
                </SelectTrigger>
                <SelectContent>
                  {safeGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">              <Label htmlFor="subLocation">{t('add.sub_location')}</Label>
              <Input
                id="subLocation"
                value={formData.subLocation}
                onChange={(e) => setFormData({ ...formData, subLocation: e.target.value })}
                placeholder={t('add.sub_location_placeholder')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Service-specific fields */}
      {formData.type === 'service' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('add.service_details')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">{t('add.base_price')}</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                value={formData.basePrice || ''}
                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">{t('add.duration_minutes')}</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellPrice">{t('add.sell_price')}</Label>
              <Input
                id="sellPrice"
                type="number"
                step="0.01"
                value={formData.sellPrice || ''}
                onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">{t('add.notes')}</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder={t('add.notes_placeholder')}
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('add.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('add.saving') : article ? t('add.update_article') : t('add.create_article')}
        </Button>
      </div>
    </form>
  );
}
