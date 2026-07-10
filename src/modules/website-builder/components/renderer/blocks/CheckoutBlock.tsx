import React, { useState, useMemo, useCallback } from 'react';
import { SiteTheme } from '../../../types';
import { useEcommerceStore } from '../../../hooks/useEcommerceStore';
import { formatStorePrice } from '../../../utils/storeCurrency';
import { submitFormData } from '../../../utils/formSubmissionHelper';
import { fireWebhook } from '../../../utils/formSubmissions';
import { computeCartTotals, StoreRules, parsePrice } from '../../../utils/storeRules';
import { generateOrderId, saveLastOrder } from '../../../utils/lastOrder';
import { toast } from 'sonner';
import {
  Loader2, CheckCircle, AlertCircle, CreditCard, MapPin, Package,
  Shield, Lock, Truck, Tag, CheckCircle2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CheckoutSettings {
  webhookUrl?: string;
  webhookMethod?: 'POST' | 'GET';
  collectSubmissions?: boolean;
  successMessage?: string;
  successAction?: 'message' | 'redirect' | 'reset';
  redirectUrl?: string;
  onErrorAction?: 'show_message' | 'retry' | 'redirect';
  errorRedirectUrl?: string;
  errorMessage?: string;
  maxRetries?: number;
  requireTerms?: boolean;
  termsText?: string;
  termsUrl?: string;
  showOrderNotes?: boolean;
  showCouponField?: boolean;
}

interface OrderItem {
  name: string;
  price: string;
  quantity: number;
  imageUrl?: string;
  variant?: string;
}

type CheckoutVariant = 'single-page' | 'split' | 'minimal' | 'card';
type CheckoutStep = 'shipping' | 'payment' | 'review';

interface CheckoutBlockProps {
  title?: string;
  variant?: CheckoutVariant;
  items?: OrderItem[];
  subtotal?: string;
  shipping?: string;
  tax?: string;
  total?: string;
  couponCode?: string;
  discountAmount?: string;
  paymentMethods?: string[];
  shippingMethods?: Array<{ label: string; price: string; estimate: string }>;
  checkoutSettings?: CheckoutSettings;
  /**
   * Store rules — when provided, subtotal/discount/shipping/tax/total are all
   * computed live from the cart via `computeCartTotals` and the static
   * `subtotal`/`shipping`/`tax`/`total` props are ignored.
   */
  rules?: StoreRules;
  buttonText?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  bgColor?: string;
  showTrustBadges?: boolean;
  siteId?: string;
  pageTitle?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
  id?: string;
}

/* ------------------------------------------------------------------ */
/*  Sub-components (hoisted so typing doesn't lose input focus)        */
/* ------------------------------------------------------------------ */

const SHIPPING_FIELDS = [
  { key: 'firstName', label: 'First Name', ph: 'John', span: 1 },
  { key: 'lastName', label: 'Last Name', ph: 'Doe', span: 1 },
  { key: 'email', label: 'Email', ph: 'john@example.com', span: 2, type: 'email' },
  { key: 'phone', label: 'Phone', ph: '+1 (555) 000-0000', span: 2, type: 'tel' },
  { key: 'address', label: 'Address', ph: '123 Main Street', span: 2 },
  { key: 'apartment', label: 'Apt / Suite', ph: 'Apt 4B', span: 1 },
  { key: 'city', label: 'City', ph: 'New York', span: 1 },
  { key: 'state', label: 'State', ph: 'NY', span: 1 },
  { key: 'zip', label: 'ZIP Code', ph: '10001', span: 1 },
  { key: 'country', label: 'Country', ph: 'United States', span: 2 },
] as const;

const INPUT_CLS = 'w-full px-3 py-2.5 border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/30 outline-none';
const LABEL_CLS = 'block text-xs font-medium mb-1 opacity-70';
const SECTION_CLS = 'p-5 rounded-xl border border-border/20';

type ShippingFormState = Record<(typeof SHIPPING_FIELDS)[number]['key'], string>;
type PaymentFormState = { cardNumber: string; cardName: string; expiry: string; cvv: string };

interface FormSectionProps {
  theme: SiteTheme;
  isEditing?: boolean;
  inputStyle: React.CSSProperties;
}

interface ShippingSectionProps extends FormSectionProps {
  form: ShippingFormState;
  onChange: (field: keyof ShippingFormState, value: string) => void;
  shippingMethods: Array<{ label: string; price: string; estimate: string }>;
  selectedShipping: number;
  onSelectShipping: (i: number) => void;
}

const ShippingSection = React.memo(function ShippingSection({
  theme, isEditing, inputStyle, form, onChange,
  shippingMethods, selectedShipping, onSelectShipping,
}: ShippingSectionProps) {
  return (
    <div className={SECTION_CLS} style={{ borderRadius: theme.borderRadius }}>
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
        <MapPin className="h-4 w-4 opacity-50" /> Shipping Address
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {SHIPPING_FIELDS.map((f) => (
          <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
            <label className={LABEL_CLS} style={{ color: theme.textColor }}>{f.label}</label>
            <input
              type={(f as any).type || 'text'}
              placeholder={f.ph}
              autoComplete={f.key}
              value={form[f.key]}
              onChange={(e) => onChange(f.key, e.target.value)}
              disabled={isEditing}
              className={INPUT_CLS}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      <div className="mt-5">
        <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5 opacity-70" style={{ color: theme.textColor }}>
          <Truck className="h-3.5 w-3.5" /> Shipping Method
        </h4>
        <div className="space-y-2">
          {shippingMethods.map((sm, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedShipping === i ? 'border-primary/50 bg-primary/5' : 'border-border/30 hover:border-border/50'
              }`}
              style={{ borderRadius: theme.borderRadius, borderColor: selectedShipping === i ? theme.primaryColor + '80' : undefined }}
            >
              <input
                type="radio"
                name="shipping"
                checked={selectedShipping === i}
                onChange={() => onSelectShipping(i)}
                disabled={isEditing}
                style={{ accentColor: theme.primaryColor }}
              />
              <div className="flex-1">
                <span className="text-xs font-medium" style={{ color: theme.textColor }}>{sm.label}</span>
                <span className="text-[10px] opacity-50 block" style={{ color: theme.secondaryColor }}>{sm.estimate}</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: theme.primaryColor }}>{sm.price}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
});

interface PaymentSectionProps extends FormSectionProps {
  paymentMethods: string[];
  selectedPayment: string;
  onSelectPayment: (m: string) => void;
  form: PaymentFormState;
  onChange: (field: keyof PaymentFormState, value: string) => void;
}

/** Format helpers keep the raw values numeric while showing spaced groups. */
const formatCardNumber = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v: string) => {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

const PaymentSection = React.memo(function PaymentSection({
  theme, isEditing, inputStyle,
  paymentMethods, selectedPayment, onSelectPayment, form, onChange,
}: PaymentSectionProps) {
  return (
    <div className={SECTION_CLS} style={{ borderRadius: theme.borderRadius }}>
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
        <CreditCard className="h-4 w-4 opacity-50" /> Payment Method
      </h3>
      <div className="flex gap-2 mb-4 flex-wrap">
        {paymentMethods.map((pm) => (
          <button
            key={pm}
            type="button"
            onClick={() => onSelectPayment(pm)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              selectedPayment === pm ? 'text-white border-transparent' : 'border-border/40'
            }`}
            style={{
              backgroundColor: selectedPayment === pm ? theme.primaryColor : 'transparent',
              color: selectedPayment === pm ? '#fff' : theme.textColor,
              borderRadius: theme.borderRadius,
            }}
          >
            {pm}
          </button>
        ))}
      </div>

      {selectedPayment === 'Credit Card' && (
        <div className="space-y-3">
          <div>
            <label className={LABEL_CLS} style={{ color: theme.textColor }}>Card Number</label>
            <input
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={form.cardNumber}
              onChange={(e) => onChange('cardNumber', formatCardNumber(e.target.value))}
              disabled={isEditing}
              className={INPUT_CLS}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={LABEL_CLS} style={{ color: theme.textColor }}>Cardholder Name</label>
            <input
              autoComplete="cc-name"
              placeholder="John Doe"
              value={form.cardName}
              onChange={(e) => onChange('cardName', e.target.value)}
              disabled={isEditing}
              className={INPUT_CLS}
              style={inputStyle}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS} style={{ color: theme.textColor }}>Expiry</label>
              <input
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={form.expiry}
                onChange={(e) => onChange('expiry', formatExpiry(e.target.value))}
                disabled={isEditing}
                className={INPUT_CLS}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={LABEL_CLS} style={{ color: theme.textColor }}>CVV</label>
              <input
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                maxLength={4}
                value={form.cvv}
                onChange={(e) => onChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                disabled={isEditing}
                className={INPUT_CLS}
                style={inputStyle}
              />
            </div>
          </div>
          <p className="text-[10px] opacity-50 flex items-center gap-1" style={{ color: theme.secondaryColor }}>
            <Lock className="h-3 w-3" /> Card data is masked on submit — only the last 4 digits are retained.
          </p>
        </div>
      )}

      {selectedPayment !== 'Credit Card' && (
        <div className="p-6 rounded-lg border border-dashed border-border/30 text-center" style={{ borderRadius: theme.borderRadius }}>
          <p className="text-xs opacity-50" style={{ color: theme.secondaryColor }}>
            You'll be redirected to {selectedPayment} to complete payment
          </p>
        </div>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CheckoutBlock({
  title = 'Checkout',
  variant = 'single-page',
  items = [
    { name: 'Premium Headphones', price: '$199', quantity: 1, variant: 'Black' },
    { name: 'Phone Case', price: '$25', quantity: 2, variant: 'Clear' },
  ],
  subtotal = '$249',
  shipping = 'Free',
  tax = '$19.92',
  total = '$268.92',
  couponCode = '',
  discountAmount = '',
  paymentMethods = ['Credit Card', 'PayPal', 'Apple Pay'],
  shippingMethods = [
    { label: 'Standard Shipping', price: 'Free', estimate: '5–7 business days' },
    { label: 'Express Shipping', price: '$9.99', estimate: '2–3 business days' },
    { label: 'Next Day', price: '$19.99', estimate: '1 business day' },
  ],
  checkoutSettings = {},
  rules,
  buttonText = 'Place Order',
  buttonColor,
  buttonTextColor,
  bgColor,
  showTrustBadges = true,
  siteId = '',
  pageTitle = '',
  theme,
  isEditing,
  onUpdate,
  style,
  id = '',
}: CheckoutBlockProps) {
  const dir = theme.direction || 'ltr';
  const btnBg = buttonColor || theme.primaryColor;
  const btnFg = buttonTextColor || '#ffffff';

  // Pull from global cart when available
  const { cart, cartTotal, clearCart } = useEcommerceStore();
  const useGlobalCart = cart.length > 0 || !isEditing;
  const displayItems = useMemo(() =>
    useGlobalCart
      ? cart.map(c => ({ name: c.name, price: c.price, quantity: c.quantity, imageUrl: c.imageUrl, variant: c.variant }))
      : items,
    [useGlobalCart, cart, items]
  );

  const {
    webhookUrl,
    webhookMethod = 'POST',
    collectSubmissions = true,
    successMessage = 'Order placed successfully! 🎉',
    successAction = 'message',
    redirectUrl,
    onErrorAction = 'show_message',
    errorMessage = 'Failed to place order. Please try again.',
    errorRedirectUrl,
    maxRetries = 2,
    requireTerms = false,
    termsText = 'I agree to the Terms of Service and Privacy Policy',
    termsUrl,
    showOrderNotes = false,
    showCouponField = false,
  } = checkoutSettings;

  // Form state
  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0] || 'Credit Card');
  const [selectedShipping, setSelectedShipping] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [couponInput, setCouponInput] = useState(couponCode);
  const [activeCoupon, setActiveCoupon] = useState<string | null>(
    rules?.activeCoupon ?? (couponCode ? couponCode : null),
  );

  const [shippingForm, setShippingForm] = useState<ShippingFormState>({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', apartment: '', city: '', state: '', zip: '', country: '',
  });

  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    cardNumber: '', cardName: '', expiry: '', cvv: '',
  });

  const updateShipping = useCallback((field: keyof ShippingFormState, value: string) =>
    setShippingForm((prev) => ({ ...prev, [field]: value })), []);

  const updatePayment = useCallback((field: keyof PaymentFormState, value: string) =>
    setPaymentForm((prev) => ({ ...prev, [field]: value })), []);

  /* ---- Totals (live via rules engine when rules provided) ---- */
  const rulesActive = !!rules;
  const activeShippingMethod = shippingMethods[selectedShipping];
  const methodShippingCost = parsePrice(activeShippingMethod?.price);
  const effectiveRules: StoreRules | undefined = rulesActive
    ? {
        ...rules,
        activeCoupon,
        // If the buyer picked a paid method, override the flat shipping.
        flatShipping: methodShippingCost > 0 ? methodShippingCost : rules?.flatShipping,
      }
    : undefined;
  const totals = useMemo(
    () => (effectiveRules ? computeCartTotals(
      useGlobalCart ? cart : displayItems.map((it, i) => ({
        productId: `static-${i}`, name: it.name, price: it.price, quantity: it.quantity, imageUrl: it.imageUrl, variant: it.variant,
      })),
      effectiveRules,
    ) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveRules, cart, displayItems, useGlobalCart],
  );

  const displaySubtotal = totals
    ? formatStorePrice(totals.subtotal, theme)
    : useGlobalCart ? formatStorePrice(cartTotal, theme) : subtotal;
  const displayShipping = totals
    ? totals.shippingWaived ? 'Free' : formatStorePrice(totals.shipping, theme)
    : (activeShippingMethod?.price ?? shipping);
  const displayTax = totals ? formatStorePrice(totals.tax, theme) : tax;
  const displayTotal = totals
    ? formatStorePrice(totals.total, theme)
    : useGlobalCart ? formatStorePrice(cartTotal, theme) : total;
  const displayDiscount = totals && totals.discount > 0
    ? formatStorePrice(totals.discount, theme)
    : discountAmount;

  const inputStyle: React.CSSProperties = useMemo(
    () => ({ borderRadius: theme.borderRadius, color: theme.textColor }),
    [theme.borderRadius, theme.textColor],
  );

  const handleApplyCoupon = () => {
    const code = couponInput.trim();
    if (!code) return;
    setActiveCoupon(code);
  };
  const handleRemoveCoupon = () => {
    setActiveCoupon(null);
    setCouponInput('');
  };

  /* ---- Submit ---- */
  const handleSubmit = async () => {
    if (isEditing) return;
    if (requireTerms && !termsAccepted) {
      toast.error('Please accept the terms to continue.');
      return;
    }

    setStatus('loading');

    const last4 = selectedPayment === 'Credit Card'
      ? paymentForm.cardNumber.replace(/\D/g, '').slice(-4)
      : undefined;

    // Never send PAN, CVV, or expiry to webhooks or storage.
    const formData = {
      shippingAddress: shippingForm,
      payment: { method: selectedPayment, ...(last4 ? { last4 } : {}) },
      shippingMethod: activeShippingMethod,
      items: displayItems,
      subtotal: displaySubtotal,
      shippingCost: displayShipping,
      tax: displayTax,
      discount: displayDiscount || undefined,
      total: displayTotal,
      coupon: activeCoupon || undefined,
      orderNotes: orderNotes || undefined,
    };

    let success = true;

    if (webhookUrl) {
      const result = await fireWebhook(webhookUrl, formData, webhookMethod);
      success = result.success;

      // Retry logic
      if (!success && maxRetries > 0 && retryCount < maxRetries) {
        setRetryCount((c) => c + 1);
        const retryResult = await fireWebhook(webhookUrl, formData, webhookMethod);
        success = retryResult.success;
      }
    }

    if (collectSubmissions) {
      await submitFormData({
        siteId,
        formComponentId: id,
        formLabel: title || 'Checkout',
        pageTitle,
        data: formData,
        source: isEditing ? 'preview' : 'website',
        collectSubmissions: true,
      });
    }

    if (!success) {
      setStatus('error');
      if (onErrorAction === 'redirect' && errorRedirectUrl) {
        toast.error(errorMessage);
        setTimeout(() => { window.location.href = errorRedirectUrl; }, 1500);
      } else {
        toast.error(errorMessage);
      }
    } else {
      // Snapshot the order for any downstream confirmation page.
      const orderId = generateOrderId();
      saveLastOrder({
        orderId,
        placedAt: new Date().toISOString(),
        items: displayItems,
        totals,
        displaySubtotal,
        displayShipping,
        displayTax,
        displayTotal,
        shippingAddress: shippingForm,
        shippingMethod: activeShippingMethod,
        payment: { method: selectedPayment, last4 },
        couponCode: activeCoupon,
        orderNotes,
      });
      setStatus('success');
      if (useGlobalCart) clearCart();
      toast.success(successMessage);
      if (successAction === 'redirect' && redirectUrl) {
        setTimeout(() => { window.location.href = redirectUrl; }, 1500);
      }
    }
  };

  /* ---- Success screen ---- */
  if (status === 'success' && successAction === 'message') {
    return (
      <section dir={dir} className="py-16 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-md mx-auto text-center">
          <CheckCircle className="h-14 w-14 mx-auto mb-4" style={{ color: theme.primaryColor }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{successMessage}</h2>
          <p className="text-sm opacity-60 mb-6" style={{ color: theme.secondaryColor }}>
            A confirmation email will be sent to {shippingForm.email || 'your email'}.
          </p>
          <button
            onClick={() => { setStatus('idle'); setStep('shipping'); }}
            className="text-sm underline opacity-60 hover:opacity-100"
            style={{ color: theme.primaryColor }}
          >Place another order</button>
        </div>
      </section>
    );
  }

  /* ---- Order summary (kept local since it depends on a lot of state) ---- */
  const OrderSummary = (
    <div className={SECTION_CLS} style={{ borderRadius: theme.borderRadius, backgroundColor: theme.primaryColor + '05' }}>
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
        <Package className="h-4 w-4 opacity-50" /> Order Summary
      </h3>

      {/* Items */}
      <div className="space-y-3 mb-4">
        {displayItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden shrink-0" style={{ borderRadius: theme.borderRadius }}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg opacity-20">📦</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: theme.textColor }}>{item.name}</p>
              {item.variant && <p className="text-[10px] opacity-50" style={{ color: theme.secondaryColor }}>{item.variant}</p>}
              <p className="text-[10px] opacity-40" style={{ color: theme.secondaryColor }}>Qty: {item.quantity}</p>
            </div>
            <span className="text-xs font-semibold shrink-0" style={{ color: theme.textColor }}>{item.price}</span>
          </div>
        ))}
      </div>

      {/* Coupon */}
      {showCouponField && (
        <div className="mb-4">
          {totals?.appliedCoupon ? (
            <div className="flex items-center gap-2 p-2.5 border rounded-lg" style={{ borderRadius: theme.borderRadius, borderColor: theme.primaryColor + '40' }}>
              <Tag className="h-3.5 w-3.5 shrink-0" style={{ color: theme.primaryColor }} />
              <span className="text-xs font-semibold flex-1 flex items-center gap-1.5" style={{ color: theme.textColor }}>
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {totals.appliedCoupon.code}
              </span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                disabled={isEditing}
                className="text-[10px] px-2 py-1 rounded hover:bg-muted/40"
                style={{ color: theme.secondaryColor }}
              >Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                placeholder="Discount code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                disabled={isEditing}
                className="flex-1 px-3 py-2 border rounded-lg text-xs bg-background outline-none uppercase"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isEditing || !couponInput.trim()}
                className="px-3 py-2 text-xs font-medium border rounded-lg hover:bg-muted/20 transition-colors disabled:opacity-50"
                style={{ borderRadius: theme.borderRadius, color: theme.primaryColor }}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {/* Rule notes (progress, unlocks) & errors */}
      {totals && totals.notes.length > 0 && (
        <div className="space-y-1 mb-3">
          {totals.notes.map((note, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded" style={{ backgroundColor: theme.primaryColor + '0D', color: theme.primaryColor }}>
              <CheckCircle2 className="h-3 w-3" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}
      {totals && totals.errors.length > 0 && (
        <div className="space-y-1 mb-3">
          {totals.errors.map((err, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded bg-red-50 text-red-700">
              <AlertCircle className="h-3 w-3" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div className="border-t border-border/20 pt-3 space-y-1.5">
        <div className="flex justify-between text-xs" style={{ color: theme.secondaryColor }}>
          <span>Subtotal</span><span>{displaySubtotal}</span>
        </div>
        {displayDiscount && (
          <div className="flex justify-between text-xs" style={{ color: '#16a34a' }}>
            <span>Discount</span><span>−{displayDiscount}</span>
          </div>
        )}
        <div className="flex justify-between text-xs" style={{ color: theme.secondaryColor }}>
          <span>Shipping</span><span>{displayShipping}</span>
        </div>
        {(totals ? totals.tax > 0 : !!tax) && (
          <div className="flex justify-between text-xs" style={{ color: theme.secondaryColor }}>
            <span>{totals?.taxIncluded ? 'Tax (included)' : 'Tax'}</span><span>{displayTax}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/20" style={{ color: theme.textColor }}>
          <span>Total</span><span>{displayTotal}</span>
        </div>
      </div>

      {/* Order notes */}
      {showOrderNotes && (
        <div className="mt-4">
          <label className={LABEL_CLS} style={{ color: theme.textColor }}>Order Notes (optional)</label>
          <textarea
            placeholder="Special instructions for your order..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            disabled={isEditing}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-xs bg-background outline-none resize-none"
            style={inputStyle}
          />
        </div>
      )}

      {/* Terms */}
      {requireTerms && (
        <label className="flex items-start gap-2 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            disabled={isEditing}
            className="mt-0.5"
            style={{ accentColor: theme.primaryColor }}
          />
          <span className="text-[10px] opacity-60" style={{ color: theme.secondaryColor }}>
            {termsText}
            {termsUrl && (
              <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="underline ml-1" style={{ color: theme.primaryColor }}>Read more</a>
            )}
          </span>
        </label>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex items-center gap-2 p-3 rounded-lg mt-3 text-xs" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: theme.borderRadius }}>
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
          {onErrorAction === 'retry' && retryCount < maxRetries && (
            <button type="button" onClick={handleSubmit} className="ml-auto text-xs font-semibold underline">Retry</button>
          )}
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === 'loading' || isEditing || displayItems.length === 0 || (totals?.errors.length ?? 0) > 0}
        className="w-full py-3 mt-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: btnBg, color: btnFg, borderRadius: theme.borderRadius }}
      >
        {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
        <Lock className="h-3.5 w-3.5" />
        {buttonText}
      </button>

      {/* Trust badges */}
      {showTrustBadges && (
        <div className="flex items-center justify-center gap-4 mt-4 opacity-40">
          <div className="flex items-center gap-1 text-[10px]" style={{ color: theme.secondaryColor }}>
            <Shield className="h-3 w-3" /> Secure Checkout
          </div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: theme.secondaryColor }}>
            <Lock className="h-3 w-3" /> SSL Encrypted
          </div>
        </div>
      )}
    </div>
  );

  const shippingSection = (
    <ShippingSection
      theme={theme} isEditing={isEditing} inputStyle={inputStyle}
      form={shippingForm} onChange={updateShipping}
      shippingMethods={shippingMethods}
      selectedShipping={selectedShipping} onSelectShipping={setSelectedShipping}
    />
  );
  const paymentSection = (
    <PaymentSection
      theme={theme} isEditing={isEditing} inputStyle={inputStyle}
      paymentMethods={paymentMethods}
      selectedPayment={selectedPayment} onSelectPayment={setSelectedPayment}
      form={paymentForm} onChange={updatePayment}
    />
  );

  /* ---- Edit hint ---- */
  const editHint = isEditing ? (
    <p className="text-[10px] text-center text-muted-foreground mt-3 opacity-60">
      💡 Configure webhook, actions & error handling in Properties → Checkout Settings
    </p>
  ) : null;

  /* ---- SINGLE-PAGE variant ---- */
  if (variant === 'single-page' || variant === 'card') {
    return (
      <section dir={dir} className="py-12 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
            <Lock className="h-5 w-5 opacity-40" /> {title}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {shippingSection}
              {paymentSection}
            </div>
            <div>
              {OrderSummary}
            </div>
          </div>
          {editHint}
        </div>
      </section>
    );
  }

  /* ---- SPLIT variant — steps ---- */
  if (variant === 'split') {
    const steps: { key: CheckoutStep; label: string; icon: React.FC<any> }[] = [
      { key: 'shipping', label: 'Shipping', icon: MapPin },
      { key: 'payment', label: 'Payment', icon: CreditCard },
      { key: 'review', label: 'Review', icon: Package },
    ];

    return (
      <section dir={dir} className="py-12 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h2>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto">
            {steps.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = step === s.key;
              const isPast = steps.findIndex((x) => x.key === step) > i;
              return (
                <React.Fragment key={s.key}>
                  <button
                    type="button"
                    onClick={() => setStep(s.key)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      isActive ? 'text-white' : isPast ? 'border' : 'border opacity-40'
                    }`}
                    style={{
                      backgroundColor: isActive ? theme.primaryColor : 'transparent',
                      color: isActive ? '#fff' : isPast ? theme.primaryColor : theme.secondaryColor,
                      borderColor: isPast ? theme.primaryColor + '40' : undefined,
                      borderRadius: '9999px',
                    }}
                  >
                    {isPast ? <CheckCircle className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                    {s.label}
                  </button>
                  {i < steps.length - 1 && <div className="flex-1 h-px bg-border/30" />}
                </React.Fragment>
              );
            })}
          </div>

          {step === 'shipping' && shippingSection}
          {step === 'payment' && paymentSection}
          {step === 'review' && OrderSummary}

          {/* Nav buttons */}
          <div className="flex justify-between mt-6">
            {step !== 'shipping' && (
              <button
                type="button"
                onClick={() => setStep(step === 'review' ? 'payment' : 'shipping')}
                className="px-4 py-2 text-xs font-medium border rounded-lg hover:bg-muted/20 transition-colors"
                style={{ borderRadius: theme.borderRadius, color: theme.secondaryColor }}
              >
                Back
              </button>
            )}
            {step !== 'review' && (
              <button
                type="button"
                onClick={() => setStep(step === 'shipping' ? 'payment' : 'review')}
                className="px-6 py-2 rounded-lg text-xs font-medium text-white ml-auto transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}
              >
                Continue
              </button>
            )}
          </div>
          {editHint}
        </div>
      </section>
    );
  }

  /* ---- MINIMAL variant ---- */
  if (variant === 'minimal') {
    return (
      <section dir={dir} className="py-12 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-lg mx-auto space-y-5">
          <h2 className="text-xl font-bold" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h2>
          {shippingSection}
          {paymentSection}
          {OrderSummary}
          {editHint}
        </div>
      </section>
    );
  }

  return null;
}
