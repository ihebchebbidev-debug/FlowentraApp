import React, { useEffect } from 'react';
import { SiteTheme } from '../../../types';

interface GoogleAnalyticsBlockProps {
  measurementId: string; // G-XXXXXXXX or AW-XXXXXXXX
  enablePageView: boolean;
  enableConversions: boolean;
  conversionLabel: string;
  conversionValue: string;
  enableRemarketing: boolean;
  customDimensions: Array<{ name: string; value: string }>;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function GoogleAnalyticsBlock({
  measurementId = '',
  enablePageView = true,
  enableConversions = false,
  conversionLabel = '',
  conversionValue = '',
  enableRemarketing = false,
  customDimensions = [],
  theme,
  isEditing,
  onUpdate,
  style,
}: GoogleAnalyticsBlockProps) {
  // Inject GA4/Ads script in production
  useEffect(() => {
    if (isEditing || !measurementId) return;

    if (document.getElementById('ga-script')) return;

    // gtag.js loader
    const loader = document.createElement('script');
    loader.id = 'ga-script';
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(loader);

    // Config script
    const config = document.createElement('script');
    config.id = 'ga-config';
    const dimensionsStr = customDimensions.length > 0
      ? `, { ${customDimensions.map(d => `'${d.name}': '${d.value}'`).join(', ')} }`
      : '';
    config.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}'${dimensionsStr});
      ${enableConversions && conversionLabel ? `gtag('event', 'conversion', { 'send_to': '${measurementId}/${conversionLabel}'${conversionValue ? `, 'value': ${conversionValue}` : ''} });` : ''}
      ${enableRemarketing ? `gtag('event', 'page_view', { 'send_to': '${measurementId}' });` : ''}
    `;
    document.head.appendChild(config);

    return () => {
      document.getElementById('ga-script')?.remove();
      document.getElementById('ga-config')?.remove();
    };
  }, [measurementId, enablePageView, enableConversions, conversionLabel, enableRemarketing, isEditing]);

  if (!isEditing) return null;

  const isAds = measurementId.startsWith('AW-');
  const features = [
    enablePageView && 'Page Views',
    enableConversions && 'Conversions',
    enableRemarketing && 'Remarketing',
    customDimensions.length > 0 && `${customDimensions.length} Custom Dims`,
  ].filter(Boolean);

  return (
    <div className="mx-4 my-3" style={style}>
      <div
        className="border border-dashed rounded-xl p-4"
        style={{ borderColor: '#4285F4' + '40', backgroundColor: '#4285F4' + '08' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: isAds ? '#FBBC04' : '#4285F4' }}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white">
              {isAds ? (
                <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04M18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12m-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
              ) : (
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              )}
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
              {isAds ? 'Google Ads' : 'Google Analytics 4'}
            </p>
            <p className="text-[10px]" style={{ color: theme.secondaryColor }}>
              {measurementId ? `ID: ${measurementId}` : 'No ID configured'}
            </p>
          </div>
        </div>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {features.map((feat, i) => (
              <span
                key={i}
                className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#4285F4' + '15', color: '#4285F4' }}
              >
                {feat}
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
