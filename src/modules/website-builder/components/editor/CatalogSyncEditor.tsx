/**
 * CatalogSyncEditor — pulls real products/services from the Inventory (Articles)
 * module into a product/service block. The fetched items are written into the
 * block's props as an editable snapshot, so the published (anonymous) site
 * renders real catalog data without needing a public read endpoint.
 *
 * Tenant-scoped: articlesApi goes through the shared apiFetch which attaches the
 * X-Tenant / X-Target-Tenant headers, so only the active company's catalog is pulled.
 */
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { articlesApi } from '@/services/api/articlesApi';
import { EditorSection } from './property-editors';

/** Block types that consume a `services` array vs a `products` array. */
const SERVICE_BLOCKS = new Set(['service-card']);

/** Block types this editor supports. */
export const CATALOG_SYNC_BLOCKS = new Set(['product-card', 'product-carousel', 'service-card']);

interface CatalogSyncEditorProps {
  componentType: string;
  onApply: (props: Record<string, any>) => void;
}

function formatPrice(value?: number): string {
  if (value == null || Number.isNaN(value)) return '';
  return `${value.toLocaleString('fr-TN')} TND`;
}

export function CatalogSyncEditor({ componentType, onApply }: CatalogSyncEditorProps) {
  const isService = SERVICE_BLOCKS.has(componentType);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(8);
  const [loading, setLoading] = useState(false);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await articlesApi.getAll({
        type: isService ? 'service' : 'material',
        search: search.trim() || undefined,
        limit,
        status: 'active',
      });
      const items = (res.data || []).slice(0, limit);
      if (items.length === 0) {
        toast.error('No matching catalog items found');
        setSyncedCount(0);
        return;
      }

      if (isService) {
        const services = items.map((a) => ({
          icon: 'Sparkles',
          title: a.name,
          description: a.description || '',
          price: formatPrice(a.sellPrice ?? a.basePrice),
        }));
        onApply({ services });
      } else {
        const products = items.map((a) => ({
          name: a.name,
          price: formatPrice(a.sellPrice ?? a.basePrice),
          description: a.description || '',
          badge: a.category || undefined,
          imageUrl: '',
        }));
        onApply({ products });
      }

      setSyncedCount(items.length);
      toast.success(`Synced ${items.length} ${isService ? 'service(s)' : 'product(s)'} from your catalog`);
    } catch {
      toast.error('Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EditorSection title="Catalog">
      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
        Pull real {isService ? 'services' : 'products'} from your inventory. Items are saved as an
        editable snapshot — re-sync any time to refresh prices.
      </p>
      <div className="space-y-2 mt-1">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-foreground/70">Search / category (optional)</Label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isService ? 'e.g. Installation' : 'e.g. Solar panels'}
            className="h-8 text-xs border-border/40 bg-background"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSync(); }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-foreground/70">Max items</Label>
          <Input
            type="number"
            min={1}
            max={24}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
            className="h-8 text-xs border-border/40 bg-background"
          />
        </div>
        <Button size="sm" className="w-full h-8 text-xs gap-1.5" onClick={handleSync} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {loading ? 'Syncing…' : 'Sync from catalog'}
        </Button>
        {syncedCount != null && syncedCount > 0 && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <PackageCheck className="h-3 w-3" /> {syncedCount} item(s) synced — edit them below.
          </p>
        )}
      </div>
    </EditorSection>
  );
}
