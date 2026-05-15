import React, { useState, useMemo } from 'react';
import { SiteTheme } from '../../../types';
import { useEcommerceStore } from '../../../hooks/useEcommerceStore';
import { submitFormData } from '../../../utils/formSubmissionHelper';
import { fireWebhook } from '../../../utils/formSubmissions';
import { toast } from 'sonner';
import {
  Loader2, CheckCircle, AlertCircle, CreditCard, MapPin, Package,
  Shield, Lock, ChevronDown, Truck,
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
  const displaySubtotal = useGlobalCart ? `$${cartTotal.toFixed(2)}` : subtotal;
  const displayTotal = useGlobalCart ? `$${cartTotal.toFixed(2)}` : total;

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
  const [coupon, setCoupon] = useState(couponCode);

  const [shippingForm, setShippingForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', apartment: '', city: '', state: '', zip: '', country: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '', cardName: '', expiry: '', cvv: '',
  });

  const updateShipping = (field: string, value: string) =>
    setShippingForm((prev) => ({ ...prev, [field]: value }));

  const updatePayment = (field: string, value: string) =>
    setPaymentForm((prev) => ({ ...prev, [field]: value }));

  /* ---- Submit ---- */
  const handleSubmit = async () => {
    if (isEditing) return;
    if (requireTerms && !termsAccepted) {
      toast.error('Please accept the terms to continue.');
      return;
    }

    setStatus('loading');

    const formData = {
      shippingAddress: shippingForm,
      payment: { method: selectedPayment, ...(selectedPayment === 'Credit Card' ? { last4: paymentForm.cardNumber.slice(-4) } : {}) },
      shippingMethod: shippingMethods[selectedShipping],
      items: displayItems,
      subtotal: displaySubtotal,
      shippingCost: shipping,
      tax,
      total: displayTotal,
      coupon,
      orderNotes,
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

  /* ---- Shared components ---- */
  const inputCls = "w-full px-3 py-2.5 border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/30 outline-none";
  const labelCls = "block text-xs font-medium mb-1 opacity-70";
  const sectionCls = "p-5 rounded-xl border border-border/20";
  const inputS: React.CSSProperties = { borderRadius: theme.borderRadius, color: theme.textColor };

  const ShippingForm = () => (
    <div className={sectionCls} style={{ borderRadius: theme.borderRadius }}>
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
        <MapPin className="h-4 w-4 opacity-50" /> Shipping Address
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
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
        ].map((f) => (
          <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
            <label className={labelCls} style={{ color: theme.textColor }}>{f.label}</label>
            <input
              type={f.type || 'text'}
              placeholder={f.ph}
              value={shippingForm[f.key as keyof typeof shippingForm]}
              onChange={(e) => updateShipping(f.key, e.target.value)}
              disabled={isEditing}
              className={inputCls}
              style={inputS}
            />
          </div>
        ))}
      </div>

      {/* Shipping method */}
      <div className="mt-5">
        <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5 opacity-70" style={{ color: theme.textColor }}>
          <Truck className="h-3.5 w-3.5" /> Shipping Method
        </h4>
        <div className="space-y-2">
          {shippingMethods.map((sm, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedShipping === i ? 'border-primary/50 bg-primary/3' : 'border-border/30 hover:border-border/50'
              }`}
              style={{ borderRadius: theme.borderRadius, borderColor: selectedShipping === i ? theme.primaryColor + '80' : undefined }}
            >
              <input
                type="radio"
                name="shipping"
                checked={selectedShipping === i}
                onChange={() => setSelectedShipping(i)}
                disabled={isEditing}
                className="accent-primary"
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

  const PaymentForm = () => (
    <div className={sectionCls} style={{ borderRadius: theme.borderRadius }}>
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
        <CreditCard className="h-4 w-4 opacity-50" /> Payment Method
      </h3>

      {/* Method selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {paymentMethods.map((pm) => (
          <button
            key={pm}
            onClick={() => setSelectedPayment(pm)}
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

      {/* Credit card fields */}
      {selectedPayment === 'Credit Card' && (
        <div className="space-y-3">
          <div>
            <label className={labelCls} style={{ color: theme.textColor }}>Card Number</label>
            <input
              placeholder="4242 4242 4242 4242"
              value={paymentForm.cardNumber}
              onChange={(e) => updatePayment('cardNumber', e.target.value)}
              disabled={isEditing}
              className={inputCls}
              style={inputS}
            />
          </div>
          <div>
            <label className={labelCls} style={{ color: theme.textColor }}>Cardholder Name</label>
            <input
              placeholder="John Doe"
              value={paymentForm.cardName}
              onChange={(e) => updatePayment('cardName', e.target.value)}
              disabled={isEditing}
              className={inputCls}
              style={inputS}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: theme.textColor }}>Expiry</label>
              <input
                placeholder="MM/YY"
                value={paymentForm.expiry}
                onChange={(e) => updatePayment('expiry', e.target.value)}
                disabled={isEditing}
                className={inputCls}
                style={inputS}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: theme.textColor }}>CVV</label>
              <input
                placeholder="123"
                value={paymentForm.cvv}
                onChange={(e) => updatePayment('cvv', e.target.value)}
                disabled={isEditing}
                className={inputCls}
                style={inputS}
              />
            </div>
          </div>
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

  const OrderSummary = () => (
    <div className={sectionCls} style={{ borderRadius: theme.borderRadius, backgroundColor: theme.primaryColor + '05' }}>
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
        <div className="flex gap-2 mb-4">
          <input
            placeholder="Discount code"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            disabled={isEditing}
            className="flex-1 px-3 py-2 border rounded-lg text-xs bg-background outline-none"
            style={inputS}
          />
          <button
            className="px-3 py-2 text-xs font-medium border rounded-lg hover:bg-muted/20 transition-colors"
            style={{ borderRadius: theme.borderRadius, color: theme.primaryColor }}
          >
            Apply
          </button>
        </div>
      )}

      {/* Totals */}
      <div className="border-t border-border/20 pt-3 space-y-1.5">
        <div className="flex justify-between text-xs" style={{ color: theme.secondaryColor }}>
          <span>Subtotal</span><span>{displaySubtotal}</span>
        </div>
        {discountAmount && (
          <div className="flex justify-between text-xs" style={{ color: '#16a34a' }}>
            <span>Discount</span><span>-{discountAmount}</span>
          </div>
        )}
        <div className="flex justify-between text-xs" style={{ color: theme.secondaryColor }}>
          <span>Shipping</span><span>{shippingMethods[selectedShipping]?.price || shipping}</span>
        </div>
        <div className="flex justify-between text-xs" style={{ color: theme.secondaryColor }}>
          <span>Tax</span><span>{tax}</span>
        </div>
        <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/20" style={{ color: theme.textColor }}>
          <span>Total</span><span>{displayTotal}</span>
        </div>
      </div>

      {/* Order notes */}
      {showOrderNotes && (
        <div className="mt-4">
          <label className={labelCls} style={{ color: theme.textColor }}>Order Notes (optional)</label>
          <textarea
            placeholder="Special instructions for your order..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            disabled={isEditing}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-xs bg-background outline-none resize-none"
            style={inputS}
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
            className="mt-0.5 accent-primary"
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
            <button onClick={handleSubmit} className="ml-auto text-xs font-semibold underline">Retry</button>
          )}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={status === 'loading' || isEditing}
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
              <ShippingForm />
              <PaymentForm />
            </div>
            <div>
              <OrderSummary />
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

          {step === 'shipping' && <ShippingForm />}
          {step === 'payment' && <PaymentForm />}
          {step === 'review' && <OrderSummary />}

          {/* Nav buttons */}
          <div className="flex justify-between mt-6">
            {step !== 'shipping' && (
              <button
                onClick={() => setStep(step === 'review' ? 'payment' : 'shipping')}
                className="px-4 py-2 text-xs font-medium border rounded-lg hover:bg-muted/20 transition-colors"
                style={{ borderRadius: theme.borderRadius, color: theme.secondaryColor }}
              >
                Back
              </button>
            )}
            {step !== 'review' && (
              <button
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
          <ShippingForm />
          <PaymentForm />
          <OrderSummary />
          {editHint}
        </div>
      </section>
    );
  }

  return null;
}
