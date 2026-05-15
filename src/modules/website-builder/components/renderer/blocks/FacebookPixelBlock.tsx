import React, { useEffect } from 'react';
import { SiteTheme } from '../../../types';

interface FacebookPixelBlockProps {
  pixelId: string;
  enablePageView: boolean;
  enablePurchase: boolean;
  enableLead: boolean;
  enableAddToCart: boolean;
  customEvents: string[]; // event names to track
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function FacebookPixelBlock({
  pixelId = '',
  enablePageView = true,
  enablePurchase = false,
  enableLead = true,
  enableAddToCart = false,
  customEvents = [],
  theme,
  isEditing,
  onUpdate,
  style,
}: FacebookPixelBlockProps) {
  // Inject Facebook Pixel script in production (non-editing mode)
  useEffect(() => {
    if (isEditing || !pixelId) return;

    // Don't inject twice
    if (document.getElementById('fb-pixel-script')) return;

    const script = document.createElement('script');
    script.id = 'fb-pixel-script';
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      ${enablePageView ? "fbq('track', 'PageView');" : ''}
    `;
    document.head.appendChild(script);

    // Noscript fallback
    const noscript = document.createElement('noscript');
    noscript.id = 'fb-pixel-noscript';
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
    document.body.appendChild(noscript);

    return () => {
      document.getElementById('fb-pixel-script')?.remove();
      document.getElementById('fb-pixel-noscript')?.remove();
    };
  }, [pixelId, enablePageView, isEditing]);

  // Editor-only display
  if (!isEditing) return null;

  const events = [
    enablePageView && 'PageView',
    enablePurchase && 'Purchase',
    enableLead && 'Lead',
    enableAddToCart && 'AddToCart',
    ...customEvents,
  ].filter(Boolean);

  return (
    <div className="mx-4 my-3" style={style}>
      <div
        className="border border-dashed rounded-xl p-4"
        style={{ borderColor: '#1877F2' + '40', backgroundColor: '#1877F2' + '08' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1877F2' }}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: theme.textColor }}>Meta Pixel</p>
            <p className="text-[10px]" style={{ color: theme.secondaryColor }}>
              {pixelId ? `ID: ${pixelId}` : 'No Pixel ID configured'}
            </p>
          </div>
        </div>
        {events.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {events.map((evt, i) => (
              <span
                key={i}
                className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#1877F2' + '15', color: '#1877F2' }}
              >
                {evt}
              </span>
            ))}
          </div>
        )}
        <p className="text-[9px] mt-2 opacity-50" style={{ color: theme.textColor }}>
          ⚡ Script injected in published site only
        </p>
      </div>
    </div>
  );
}
