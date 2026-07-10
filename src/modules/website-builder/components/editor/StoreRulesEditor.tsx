/**
 * StoreRulesEditor — friendly accordion UI for the store rules engine.
 *
 * Applied to cart / mini-cart / checkout / order-confirmation blocks.
 * The value it edits is the `rules` prop, of shape `StoreRules`.
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Percent, Truck, Tag, TrendingUp, Layers, Shield } from 'lucide-react';
import type {
  StoreRules, CouponRule, TaxRule, SpendTier, QuantityTier,
} from '../../utils/storeRules';
import { BuilderComponent } from '../../types';
import { EditorSection } from './PropertyEditors';

/** Blocks that get the rules editor. */
export const RULES_ENABLED_BLOCKS = new Set([
  'cart', 'mini-cart', 'checkout', 'order-confirmation',
]);

interface Props {
  component: BuilderComponent;
  onPropChange: (key: string, value: any) => void;
}

const inputCls = 'h-7 text-xs';
const rowCls = 'flex items-center justify-between py-1';
const smallLabel = 'text-[11px] font-medium text-foreground/70';

export function StoreRulesEditor({ component, onPropChange }: Props) {
  const rules: StoreRules = component.props.rules || {};

  const patch = (updates: Partial<StoreRules>) =>
    onPropChange('rules', { ...rules, ...updates });

  /* ── Shipping ── */
  const setNumber = (k: keyof StoreRules) => (v: string) => {
    const n = v === '' ? undefined : Number(v);
    patch({ [k]: n as any });
  };

  /* ── Coupons ── */
  const coupons = rules.coupons ?? [];
  const setCoupon = (i: number, next: Partial<CouponRule>) => {
    const list = coupons.slice();
    list[i] = { ...list[i], ...next };
    patch({ coupons: list });
  };
  const addCoupon = () =>
    patch({ coupons: [...coupons, { code: 'SAVE10', kind: 'percent', value: 10, label: '10% off' }] });
  const removeCoupon = (i: number) => patch({ coupons: coupons.filter((_, idx) => idx !== i) });

  /* ── Tax regions ── */
  const taxes = rules.taxes ?? [];
  const setTax = (i: number, next: Partial<TaxRule>) => {
    const list = taxes.slice();
    list[i] = { ...list[i], ...next };
    patch({ taxes: list });
  };
  const addTax = () =>
    patch({ taxes: [...taxes, { region: 'US-CA', rate: 0.0725, label: 'California Sales Tax' }] });
  const removeTax = (i: number) => patch({ taxes: taxes.filter((_, idx) => idx !== i) });

  /* ── Spend tiers ── */
  const spendTiers = rules.spendTiers ?? [];
  const setSpend = (i: number, next: Partial<SpendTier>) => {
    const list = spendTiers.slice();
    list[i] = { ...list[i], ...next };
    patch({ spendTiers: list });
  };
  const addSpend = () => patch({ spendTiers: [...spendTiers, { minSubtotal: 100, discountPercent: 10, label: 'Save 10% over $100' }] });
  const removeSpend = (i: number) => patch({ spendTiers: spendTiers.filter((_, idx) => idx !== i) });

  /* ── Quantity tiers ── */
  const qtyTiers = rules.quantityTiers ?? [];
  const setQty = (i: number, next: Partial<QuantityTier>) => {
    const list = qtyTiers.slice();
    list[i] = { ...list[i], ...next };
    patch({ quantityTiers: list });
  };
  const addQty = () => patch({ quantityTiers: [...qtyTiers, { minQty: 3, discountPercent: 5 }] });
  const removeQty = (i: number) => patch({ quantityTiers: qtyTiers.filter((_, idx) => idx !== i) });

  return (
    <EditorSection title="🛒 Store Rules" defaultOpen={false}>
      <div className="space-y-4">
        <p className="text-[10px] text-muted-foreground/60 leading-snug">
          Shared business logic for coupons, discounts, shipping, and tax. Cart, checkout, and
          order confirmation all use these rules.
        </p>

        {/* ── Shipping ── */}
        <div className="rounded-md border border-border/40 p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
            <Truck className="h-3.5 w-3.5" /> Shipping
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className={smallLabel}>Flat rate</Label>
              <Input
                type="number" step="0.01" min="0" placeholder="0"
                value={rules.flatShipping ?? ''}
                onChange={(e) => setNumber('flatShipping')(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <Label className={smallLabel}>Free over</Label>
              <Input
                type="number" step="0.01" min="0" placeholder="50"
                value={rules.freeShippingOver ?? ''}
                onChange={(e) => setNumber('freeShippingOver')(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className={rowCls}>
            <Label className={smallLabel}>Charge tax on shipping</Label>
            <Switch checked={!!rules.taxOnShipping} onCheckedChange={(v) => patch({ taxOnShipping: v })} />
          </div>
        </div>

        {/* ── Tax ── */}
        <div className="rounded-md border border-border/40 p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
            <Percent className="h-3.5 w-3.5" /> Tax
          </div>
          <div className="space-y-1">
            <Label className={smallLabel}>Flat tax rate (fallback)</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number" step="0.001" min="0" max="1" placeholder="0.08"
                value={rules.taxRate ?? ''}
                onChange={(e) => setNumber('taxRate')(e.target.value)}
                className={inputCls}
              />
              <span className="text-[10px] text-muted-foreground/60">= {((rules.taxRate ?? 0) * 100).toFixed(2)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className={smallLabel}>Active region key</Label>
            <Input
              placeholder="US-CA"
              value={rules.activeRegion ?? ''}
              onChange={(e) => patch({ activeRegion: e.target.value || undefined })}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={smallLabel}>Regions</Label>
            {taxes.map((t, i) => (
              <div key={i} className="rounded border border-border/30 p-2 space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <Input placeholder="Region" value={t.region} onChange={(e) => setTax(i, { region: e.target.value })} className={inputCls} />
                  <Input type="number" step="0.001" min="0" max="1" placeholder="0.20" value={t.rate}
                    onChange={(e) => setTax(i, { rate: Number(e.target.value) })} className={inputCls} />
                </div>
                <Input placeholder="Label (e.g. VAT)" value={t.label ?? ''}
                  onChange={(e) => setTax(i, { label: e.target.value })} className={inputCls} />
                <div className={rowCls}>
                  <Label className={smallLabel}>Included in price (VAT)</Label>
                  <Switch checked={!!t.includedInPrice} onCheckedChange={(v) => setTax(i, { includedInPrice: v })} />
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] w-full" onClick={() => removeTax(i)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-7 text-[11px] w-full" onClick={addTax}>
              <Plus className="h-3 w-3 mr-1" /> Add region
            </Button>
          </div>
        </div>

        {/* ── Coupons ── */}
        <div className="rounded-md border border-border/40 p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
            <Tag className="h-3.5 w-3.5" /> Coupons
          </div>
          {coupons.map((c, i) => (
            <div key={i} className="rounded border border-border/30 p-2 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <Input placeholder="CODE" value={c.code}
                  onChange={(e) => setCoupon(i, { code: e.target.value.toUpperCase() })}
                  className={`${inputCls} uppercase`} />
                <select
                  value={c.kind}
                  onChange={(e) => setCoupon(i, { kind: e.target.value as CouponRule['kind'] })}
                  className="h-7 text-xs rounded border border-input bg-background px-2"
                >
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="shipping">Free shipping</option>
                  <option value="bogo">Buy N, get 1 free</option>
                </select>
              </div>
              {c.kind !== 'shipping' && (
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <Label className={smallLabel}>
                      {c.kind === 'percent' ? '% off' : c.kind === 'bogo' ? 'Buy N' : 'Amount off'}
                    </Label>
                    <Input type="number" step="0.01" min="0" value={c.value}
                      onChange={(e) => setCoupon(i, { value: Number(e.target.value) })} className={inputCls} />
                  </div>
                  <div className="space-y-0.5">
                    <Label className={smallLabel}>Min. subtotal</Label>
                    <Input type="number" step="0.01" min="0" placeholder="0" value={c.minSubtotal ?? ''}
                      onChange={(e) => setCoupon(i, { minSubtotal: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className={inputCls} />
                  </div>
                </div>
              )}
              <Input placeholder="Label shown to buyer" value={c.label ?? ''}
                onChange={(e) => setCoupon(i, { label: e.target.value })} className={inputCls} />
              <Button variant="ghost" size="sm" className="h-6 text-[10px] w-full" onClick={() => removeCoupon(i)}>
                <Trash2 className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="h-7 text-[11px] w-full" onClick={addCoupon}>
            <Plus className="h-3 w-3 mr-1" /> Add coupon
          </Button>
          <div className="space-y-1 pt-1">
            <Label className={smallLabel}>Auto-apply code (optional)</Label>
            <Input placeholder="AUTOAPPLIED" value={rules.activeCoupon ?? ''}
              onChange={(e) => patch({ activeCoupon: e.target.value || null })}
              className={`${inputCls} uppercase`} />
          </div>
        </div>

        {/* ── Spend tiers ── */}
        <div className="rounded-md border border-border/40 p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
            <TrendingUp className="h-3.5 w-3.5" /> Spend tiers
          </div>
          {spendTiers.map((t, i) => (
            <div key={i} className="rounded border border-border/30 p-2 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <Label className={smallLabel}>Spend at least</Label>
                  <Input type="number" step="0.01" min="0" value={t.minSubtotal}
                    onChange={(e) => setSpend(i, { minSubtotal: Number(e.target.value) })} className={inputCls} />
                </div>
                <div className="space-y-0.5">
                  <Label className={smallLabel}>Save %</Label>
                  <Input type="number" step="0.5" min="0" max="100" value={t.discountPercent}
                    onChange={(e) => setSpend(i, { discountPercent: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>
              <Input placeholder="Label" value={t.label ?? ''}
                onChange={(e) => setSpend(i, { label: e.target.value })} className={inputCls} />
              <Button variant="ghost" size="sm" className="h-6 text-[10px] w-full" onClick={() => removeSpend(i)}>
                <Trash2 className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="h-7 text-[11px] w-full" onClick={addSpend}>
            <Plus className="h-3 w-3 mr-1" /> Add tier
          </Button>
        </div>

        {/* ── Quantity tiers ── */}
        <div className="rounded-md border border-border/40 p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
            <Layers className="h-3.5 w-3.5" /> Quantity tiers (per item)
          </div>
          {qtyTiers.map((t, i) => (
            <div key={i} className="rounded border border-border/30 p-2 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <Label className={smallLabel}>Buy at least</Label>
                  <Input type="number" step="1" min="1" value={t.minQty}
                    onChange={(e) => setQty(i, { minQty: Number(e.target.value) })} className={inputCls} />
                </div>
                <div className="space-y-0.5">
                  <Label className={smallLabel}>Save %</Label>
                  <Input type="number" step="0.5" min="0" max="100" value={t.discountPercent}
                    onChange={(e) => setQty(i, { discountPercent: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] w-full" onClick={() => removeQty(i)}>
                <Trash2 className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="h-7 text-[11px] w-full" onClick={addQty}>
            <Plus className="h-3 w-3 mr-1" /> Add tier
          </Button>
        </div>

        {/* ── Safety cap ── */}
        <div className="rounded-md border border-border/40 p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
            <Shield className="h-3.5 w-3.5" /> Safety cap
          </div>
          <div className="space-y-1">
            <Label className={smallLabel}>Max discount fraction (0–1)</Label>
            <div className="flex items-center gap-2">
              <Input type="number" step="0.05" min="0" max="1" placeholder="0.9"
                value={rules.maxDiscountFraction ?? ''}
                onChange={(e) => setNumber('maxDiscountFraction')(e.target.value)}
                className={inputCls} />
              <span className="text-[10px] text-muted-foreground/60">
                {((rules.maxDiscountFraction ?? 0.9) * 100).toFixed(0)}% cap
              </span>
            </div>
          </div>
        </div>
      </div>
    </EditorSection>
  );
}