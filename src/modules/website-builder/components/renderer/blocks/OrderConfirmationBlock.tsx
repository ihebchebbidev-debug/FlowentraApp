import React, { useEffect, useState } from 'react';
import { SiteTheme } from '../../../types';
import { readLastOrder, LastOrderSnapshot } from '../../../utils/lastOrder';
import {
  CheckCircle2, Package, MapPin, CreditCard, Printer,
  ArrowRight, Truck, Mail, Calendar, Tag, ShoppingBag,
} from 'lucide-react';

type Variant = 'centered' | 'split' | 'minimal';

interface NextStep { icon?: string; title: string; description?: string }

interface OrderConfirmationBlockProps {
  variant?: Variant;
  title?: string;
  subtitle?: string;
  supportEmail?: string;
  continueShoppingLabel?: string;
  continueShoppingUrl?: string;
  showPrintButton?: boolean;
  showNextSteps?: boolean;
  nextSteps?: NextStep[];
  /** Fallback data used in the editor / when no order snapshot exists. */
  sample?: Partial<LastOrderSnapshot>;
  bgColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  style?: React.CSSProperties;
  id?: string;
}

const SAMPLE: LastOrderSnapshot = {
  orderId: 'WB-8H4K-Q2M9',
  placedAt: new Date().toISOString(),
  items: [
    { name: 'Premium Headphones', price: '$199', quantity: 1, variant: 'Black' },
    { name: 'Phone Case', price: '$25', quantity: 2, variant: 'Clear' },
  ],
  totals: null,
  displaySubtotal: '$249.00',
  displayShipping: 'Free',
  displayTax: '$19.92',
  displayTotal: '$268.92',
  shippingAddress: {
    firstName: 'Alex', lastName: 'Doe', address: '123 Main Street',
    city: 'New York', state: 'NY', zip: '10001', country: 'United States',
    email: 'alex@example.com',
  },
  shippingMethod: { label: 'Standard Shipping', price: 'Free', estimate: '5–7 business days' },
  payment: { method: 'Credit Card', last4: '4242' },
  couponCode: null,
};

const DEFAULT_NEXT_STEPS: NextStep[] = [
  { icon: 'mail', title: 'Confirmation email', description: 'Sent to your inbox with all the details.' },
  { icon: 'package', title: 'Packing your order', description: 'We\'ll notify you when it ships.' },
  { icon: 'truck', title: 'On the way', description: 'Track your delivery in real time.' },
];

const ICON_MAP: Record<string, React.FC<any>> = {
  mail: Mail, package: Package, truck: Truck, calendar: Calendar, tag: Tag, shopping: ShoppingBag,
};

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

function AddressLines({ addr, theme }: { addr: Record<string, string>; theme: SiteTheme }) {
  const name = [addr.firstName, addr.lastName].filter(Boolean).join(' ');
  const line2 = [addr.address, addr.apartment].filter(Boolean).join(', ');
  const line3 = [addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
  return (
    <div className="text-xs leading-relaxed" style={{ color: theme.textColor }}>
      {name && <p className="font-medium">{name}</p>}
      {line2 && <p className="opacity-70">{line2}</p>}
      {line3 && <p className="opacity-70">{line3}</p>}
      {addr.country && <p className="opacity-70">{addr.country}</p>}
      {addr.email && <p className="opacity-50 mt-1">{addr.email}</p>}
    </div>
  );
}

export function OrderConfirmationBlock({
  variant = 'centered',
  title = 'Thank you for your order!',
  subtitle = 'Your order has been placed and is being processed.',
  supportEmail,
  continueShoppingLabel = 'Continue Shopping',
  continueShoppingUrl = '/',
  showPrintButton = true,
  showNextSteps = true,
  nextSteps = DEFAULT_NEXT_STEPS,
  sample,
  bgColor,
  buttonColor,
  buttonTextColor,
  theme,
  isEditing,
  style,
}: OrderConfirmationBlockProps) {
  const dir = theme.direction || 'ltr';
  const btnBg = buttonColor || theme.primaryColor;
  const btnFg = buttonTextColor || '#ffffff';

  const [order, setOrder] = useState<LastOrderSnapshot | null>(null);
  useEffect(() => {
    if (isEditing) { setOrder({ ...SAMPLE, ...sample } as LastOrderSnapshot); return; }
    setOrder(readLastOrder() ?? ({ ...SAMPLE, ...sample } as LastOrderSnapshot));
  }, [isEditing, sample]);

  if (!order) return null;

  const handlePrint = () => { try { window.print(); } catch { /* noop */ } };

  const Header = (
    <div className="text-center">
      <div
        className="inline-flex h-14 w-14 items-center justify-center rounded-full mb-4"
        style={{ backgroundColor: theme.primaryColor + '15' }}
      >
        <CheckCircle2 className="h-8 w-8" style={{ color: theme.primaryColor }} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
        {title}
      </h1>
      <p className="text-sm opacity-70 mb-2" style={{ color: theme.secondaryColor }}>
        {subtitle}
      </p>
      <div className="flex items-center justify-center gap-3 text-[11px] opacity-60 flex-wrap" style={{ color: theme.secondaryColor }}>
        <span className="font-mono font-semibold" style={{ color: theme.primaryColor }}>{order.orderId}</span>
        <span>·</span>
        <span>{formatDate(order.placedAt)}</span>
      </div>
    </div>
  );

  const Items = (
    <div className="p-5 rounded-xl border border-border/20" style={{ borderRadius: theme.borderRadius }}>
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
        <Package className="h-4 w-4 opacity-50" /> Order Items ({order.items.length})
      </h3>
      <div className="space-y-3">
        {order.items.map((it, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden shrink-0" style={{ borderRadius: theme.borderRadius }}>
              {it.imageUrl ? <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" /> : <span className="text-lg opacity-20">📦</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: theme.textColor }}>{it.name}</p>
              {it.variant && <p className="text-[10px] opacity-50" style={{ color: theme.secondaryColor }}>{it.variant}</p>}
              <p className="text-[10px] opacity-40" style={{ color: theme.secondaryColor }}>Qty: {it.quantity}</p>
            </div>
            <span className="text-xs font-semibold shrink-0" style={{ color: theme.textColor }}>{it.price}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const Totals = (
    <div className="p-5 rounded-xl border border-border/20" style={{ borderRadius: theme.borderRadius, backgroundColor: theme.primaryColor + '05' }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>Payment Summary</h3>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs" style={{ color: theme.secondaryColor }}>
          <span>Subtotal</span><span>{order.displaySubtotal}</span>
        </div>
        {order.totals && order.totals.discount > 0 && (
          <div className="flex justify-between text-xs" style={{ color: '#16a34a' }}>
            <span>
              Discount{order.couponCode ? ` · ${order.couponCode}` : ''}
            </span>
            <span>−{order.totals ? `${order.totals.discount.toFixed(2)}` : ''}</span>
          </div>
        )}
        <div className="flex justify-between text-xs" style={{ color: theme.secondaryColor }}>
          <span>Shipping{order.shippingMethod ? ` · ${order.shippingMethod.label}` : ''}</span>
          <span>{order.displayShipping}</span>
        </div>
        {order.totals && order.totals.tax > 0 && (
          <div className="flex justify-between text-xs" style={{ color: theme.secondaryColor }}>
            <span>{order.totals.taxIncluded ? 'Tax (included)' : 'Tax'}</span>
            <span>{order.displayTax}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold pt-2 mt-2 border-t border-border/20" style={{ color: theme.textColor }}>
          <span>Total</span><span>{order.displayTotal}</span>
        </div>
        <div className="pt-3 mt-2 border-t border-border/20 flex items-center gap-2 text-[11px]" style={{ color: theme.secondaryColor }}>
          <CreditCard className="h-3.5 w-3.5 opacity-60" />
          <span>Paid with {order.payment.method}</span>
          {order.payment.last4 && <span className="font-mono opacity-70">•••• {order.payment.last4}</span>}
        </div>
      </div>
    </div>
  );

  const Shipping = (
    <div className="p-5 rounded-xl border border-border/20" style={{ borderRadius: theme.borderRadius }}>
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
        <MapPin className="h-4 w-4 opacity-50" /> Shipping To
      </h3>
      <AddressLines addr={order.shippingAddress || {}} theme={theme} />
      {order.shippingMethod && (
        <div className="mt-3 pt-3 border-t border-border/20 flex items-center gap-2 text-[11px]" style={{ color: theme.secondaryColor }}>
          <Truck className="h-3.5 w-3.5 opacity-60" />
          <span className="font-medium" style={{ color: theme.textColor }}>{order.shippingMethod.label}</span>
          <span className="opacity-60">· {order.shippingMethod.estimate}</span>
        </div>
      )}
    </div>
  );

  const NextSteps = showNextSteps && nextSteps.length > 0 ? (
    <div className="p-5 rounded-xl border border-border/20" style={{ borderRadius: theme.borderRadius }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>What happens next</h3>
      <ol className="space-y-3">
        {nextSteps.map((s, i) => {
          const Icon = ICON_MAP[s.icon || ''] || CheckCircle2;
          return (
            <li key={i} className="flex gap-3">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: theme.primaryColor + '15' }}>
                <Icon className="h-4 w-4" style={{ color: theme.primaryColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold" style={{ color: theme.textColor }}>{s.title}</p>
                {s.description && <p className="text-[11px] opacity-60 mt-0.5" style={{ color: theme.secondaryColor }}>{s.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  ) : null;

  const Actions = (
    <div className="flex flex-wrap items-center gap-3 justify-center print:hidden">
      <a
        href={continueShoppingUrl}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
        style={{ backgroundColor: btnBg, color: btnFg, borderRadius: theme.borderRadius }}
        onClick={(e) => { if (isEditing) e.preventDefault(); }}
      >
        {continueShoppingLabel}
        <ArrowRight className="h-4 w-4" />
      </a>
      {showPrintButton && (
        <button
          type="button"
          onClick={handlePrint}
          disabled={isEditing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-muted/40"
          style={{ borderRadius: theme.borderRadius, color: theme.textColor, borderColor: theme.secondaryColor + '40' }}
        >
          <Printer className="h-4 w-4" /> Print Receipt
        </button>
      )}
    </div>
  );

  const Support = supportEmail ? (
    <p className="text-center text-[11px] opacity-60 mt-2" style={{ color: theme.secondaryColor }}>
      Need help? <a href={`mailto:${supportEmail}`} className="underline" style={{ color: theme.primaryColor }}>{supportEmail}</a>
    </p>
  ) : null;

  /* ---- VARIANTS ---- */
  if (variant === 'minimal') {
    return (
      <section dir={dir} className="py-14 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-md mx-auto space-y-6">
          {Header}
          {Totals}
          {Actions}
          {Support}
        </div>
      </section>
    );
  }

  if (variant === 'split') {
    return (
      <section dir={dir} className="py-12 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-5xl mx-auto space-y-8">
          {Header}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              {Items}
              {Shipping}
              {NextSteps}
            </div>
            <div className="space-y-5">
              {Totals}
              <div className="space-y-3">{Actions}</div>
              {Support}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // centered (default)
  return (
    <section dir={dir} className="py-14 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-2xl mx-auto space-y-6">
        {Header}
        {Totals}
        {Items}
        {Shipping}
        {NextSteps}
        {Actions}
        {Support}
      </div>
    </section>
  );
}