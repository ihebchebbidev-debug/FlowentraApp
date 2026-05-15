import React, { useState, useEffect } from 'react';
import { SiteTheme } from '../../../types';

interface WhatsAppButtonBlockProps {
  phoneNumber: string;
  defaultMessage: string;
  displayMode: 'floating' | 'sticky-bar' | 'inline-button';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  stickyPosition: 'top' | 'bottom';
  buttonColor: string;
  iconColor: string;
  iconSize: number;
  pulseAnimation: boolean;
  showGreeting: boolean;
  greetingText: string;
  greetingDelay: number;
  avatarUrl: string;
  agentName: string;
  businessHoursEnabled: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDays: string[];
  offlineMessage: string;
  tooltipText: string;
  stickyText: string;
  offsetX: number;
  offsetY: number;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

const WhatsAppIcon = ({ className, color, style }: { className?: string; color?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill={color || 'currentColor'}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export function WhatsAppButtonBlock({
  phoneNumber = '+1234567890',
  defaultMessage = 'Hello! I have a question.',
  displayMode = 'floating',
  position = 'bottom-right',
  stickyPosition = 'bottom',
  buttonColor = '#25D366',
  iconColor = '#ffffff',
  iconSize = 56,
  pulseAnimation = true,
  showGreeting = true,
  greetingText = 'Hi there! 👋 How can we help you today?',
  greetingDelay = 3,
  avatarUrl = '',
  agentName = 'Support',
  businessHoursEnabled = false,
  businessHoursStart = '09:00',
  businessHoursEnd = '18:00',
  businessDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  offlineMessage = "We're currently offline. Leave us a message!",
  tooltipText = 'Chat with us',
  stickyText = 'Chat with us on WhatsApp',
  offsetX = 24,
  offsetY = 24,
  theme,
  isEditing,
  onUpdate,
  style,
}: WhatsAppButtonBlockProps) {
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isOnline = () => {
    if (!businessHoursEnabled) return true;
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = dayNames[now.getDay()];
    if (!businessDays.includes(currentDay)) return false;
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return currentTime >= businessHoursStart && currentTime <= businessHoursEnd;
  };

  const online = isOnline();

  useEffect(() => {
    if (!showGreeting || dismissed || isEditing || displayMode !== 'floating') return;
    const timer = setTimeout(() => setGreetingVisible(true), greetingDelay * 1000);
    return () => clearTimeout(timer);
  }, [showGreeting, greetingDelay, dismissed, isEditing, displayMode]);

  const handleClick = () => {
    if (isEditing) return;
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const encodedMsg = encodeURIComponent(defaultMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank', 'noopener,noreferrer');
  };

  const getPositionStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'fixed', zIndex: 95 };
    if (position.includes('right')) base.right = offsetX;
    else base.left = offsetX;
    if (position.includes('bottom')) base.bottom = offsetY;
    else base.top = offsetY;
    return base;
  };

  const getGreetingPositionStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'fixed', zIndex: 90 };
    if (position.includes('right')) base.right = offsetX;
    else base.left = offsetX;
    if (position.includes('bottom')) base.bottom = offsetY + iconSize + 16;
    else base.top = offsetY + iconSize + 16;
    return base;
  };

  const whatsAppIconSize = Math.round(iconSize * 0.5);

  // ── Editor placeholder ──
  if (isEditing) {
    const modeLabel = displayMode === 'sticky-bar' ? 'Sticky Bar' : displayMode === 'inline-button' ? 'Inline Button' : 'Floating Button';
    return (
      <div className="mx-4 my-3" style={style}>
        <div
          className="border border-dashed rounded-xl p-4 text-center"
          style={{ borderColor: buttonColor + '40', backgroundColor: buttonColor + '08' }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: theme.textColor }}>
            WhatsApp — {modeLabel}
          </p>

          {displayMode === 'sticky-bar' ? (
            <div
              className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg text-sm font-medium"
              style={{ backgroundColor: buttonColor, color: iconColor }}
            >
              <WhatsAppIcon style={{ width: 18, height: 18 }} color={iconColor} />
              <span>{stickyText}</span>
            </div>
          ) : displayMode === 'inline-button' ? (
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold shadow-md"
              style={{ backgroundColor: buttonColor, color: iconColor, cursor: 'default' }}
            >
              <WhatsAppIcon style={{ width: 16, height: 16 }} color={iconColor} />
              {stickyText}
            </button>
          ) : (
            <div className="inline-flex items-center gap-3">
              <button
                className={`rounded-full shadow-lg flex items-center justify-center ${pulseAnimation ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
                style={{ width: iconSize, height: iconSize, backgroundColor: buttonColor, cursor: 'default' }}
              >
                <WhatsAppIcon style={{ width: whatsAppIconSize, height: whatsAppIconSize }} color={iconColor} />
              </button>
              <div className="text-left">
                <p className="text-[10px] font-medium" style={{ color: theme.textColor }}>
                  {agentName} • {online ? '🟢 Online' : '⚫ Offline'}
                </p>
                <p className="text-[9px] opacity-50" style={{ color: theme.textColor }}>{phoneNumber}</p>
              </div>
            </div>
          )}

          <p className="text-[9px] mt-2 opacity-40" style={{ color: theme.textColor }}>
            Mode: {modeLabel} • Position: {displayMode === 'sticky-bar' ? stickyPosition : position} • Greeting: {showGreeting ? 'On' : 'Off'}
          </p>
        </div>
      </div>
    );
  }

  // ── Sticky Bar mode ──
  if (displayMode === 'sticky-bar') {
    return (
      <div
        className={`sticky z-40 ${stickyPosition === 'top' ? 'top-0' : 'bottom-0'}`}
        style={style}
      >
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-3 py-3 px-6 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: buttonColor, color: iconColor, fontFamily: theme.bodyFont }}
        >
          <WhatsAppIcon style={{ width: 18, height: 18 }} color={iconColor} />
          <span>{online ? stickyText : offlineMessage}</span>
          {online && <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />}
        </button>
      </div>
    );
  }

  // ── Inline Button mode ──
  if (displayMode === 'inline-button') {
    return (
      <div className="flex justify-center py-4" style={style}>
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: buttonColor, color: iconColor, fontFamily: theme.bodyFont }}
        >
          <WhatsAppIcon style={{ width: 18, height: 18 }} color={iconColor} />
          {stickyText}
          {online && <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />}
        </button>
      </div>
    );
  }

  // ── Floating mode (original) ──
  if (dismissed) return null;

  return (
    <div>
      {greetingVisible && !dismissed && (
        <div className="animate-fade-in" style={getGreetingPositionStyle()}>
          <div
            className="rounded-2xl shadow-xl p-4 max-w-[260px] border"
            style={{ backgroundColor: theme.backgroundColor, borderColor: theme.textColor + '15', fontFamily: theme.bodyFont }}
          >
            <div className="flex items-start gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={agentName} className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm" style={{ backgroundColor: buttonColor }}>
                  {agentName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: theme.textColor }}>{agentName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-[10px]" style={{ color: theme.secondaryColor }}>{online ? 'Online' : 'Offline'}</span>
                </div>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: theme.textColor + 'cc' }}>
                  {online ? greetingText : offlineMessage}
                </p>
              </div>
            </div>
            <button
              onClick={handleClick}
              className="w-full mt-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: buttonColor, color: iconColor }}
            >
              <WhatsAppIcon style={{ width: 14, height: 14 }} color={iconColor} />
              Start Chat
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); setGreetingVisible(false); }}
              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-40 hover:opacity-100 transition-opacity"
              style={{ color: theme.textColor }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div style={getPositionStyle()}>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-1 rounded-md opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
          {tooltipText}
        </div>
        <button
          onClick={handleClick}
          className={`rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 ${pulseAnimation ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
          style={{ width: iconSize, height: iconSize, backgroundColor: buttonColor }}
        >
          <WhatsAppIcon style={{ width: whatsAppIconSize, height: whatsAppIconSize }} color={iconColor} />
        </button>
        <span className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>
    </div>
  );
}
