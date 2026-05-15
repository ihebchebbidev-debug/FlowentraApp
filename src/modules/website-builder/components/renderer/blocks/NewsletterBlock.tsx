import React, { useState } from 'react';
import { SiteTheme } from '../../../types';
import { submitFormData } from '../../../utils/formSubmissionHelper';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle, Mail, Bell, Sparkles, Send, Inbox } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NewsletterFormSettings {
  webhookUrl?: string;
  webhookMethod?: 'POST' | 'GET';
  collectSubmissions?: boolean;
  successMessage?: string;
  successAction?: 'message' | 'redirect' | 'reset';
  redirectUrl?: string;
  emailTo?: string;
}

type NewsletterVariant = 'inline' | 'stacked' | 'card' | 'split' | 'minimal' | 'banner';

interface NewsletterBlockProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  bgColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  placeholder?: string;
  compact?: boolean;
  variant?: NewsletterVariant;
  showIcon?: boolean;
  showName?: boolean;
  showPrivacy?: boolean;
  privacyText?: string;
  iconType?: 'mail' | 'bell' | 'sparkles' | 'send' | 'inbox';
  formSettings?: NewsletterFormSettings;
  siteId?: string;
  pageTitle?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
  id?: string;
}

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */

const ICON_MAP = { mail: Mail, bell: Bell, sparkles: Sparkles, send: Send, inbox: Inbox };

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function NewsletterBlock({
  title,
  subtitle,
  buttonText = 'Subscribe',
  bgColor,
  buttonColor,
  buttonTextColor,
  placeholder = 'Enter your email',
  compact = false,
  variant = 'inline',
  showIcon = false,
  showName = false,
  showPrivacy = false,
  privacyText = 'We respect your privacy. Unsubscribe at any time.',
  iconType = 'mail',
  formSettings = {},
  siteId = '',
  pageTitle = '',
  theme,
  isEditing,
  onUpdate,
  style,
  id = '',
}: NewsletterBlockProps) {
  const dir = theme.direction || 'ltr';
  const btnBg = buttonColor || theme.primaryColor;
  const btnFg = buttonTextColor || '#ffffff';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const {
    webhookUrl,
    webhookMethod = 'POST',
    collectSubmissions = true,
    successMessage = 'Thanks for subscribing! 🎉',
    successAction = 'message',
    redirectUrl,
  } = formSettings;

  const IconComp = ICON_MAP[iconType] || Mail;

  /* ---- Submit handler ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing || !email.trim()) return;

    setStatus('loading');

    const formData: Record<string, string> = { email };
    if (showName && name.trim()) formData.name = name;

    const result = await submitFormData({
      siteId,
      formComponentId: id,
      formLabel: title || 'Newsletter',
      pageTitle,
      data: formData,
      source: isEditing ? 'preview' : 'website',
      webhookUrl,
      webhookMethod,
      collectSubmissions,
    });

    if (!result.success) {
      setStatus('error');
      toast.error('Subscription failed. Please try again.');
    } else {
      setStatus('success');
      toast.success(successMessage);
      if (successAction === 'redirect' && redirectUrl) {
        window.location.href = redirectUrl;
      } else if (successAction === 'reset') {
        setEmail('');
        setName('');
        setTimeout(() => setStatus('idle'), 2500);
      }
    }
  };

  /* ---- Success state ---- */
  if (status === 'success' && successAction === 'message') {
    return (
      <section dir={dir} className={`${compact ? 'py-8' : 'py-16'} px-6`} style={{ backgroundColor: bgColor || theme.primaryColor + '08', fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-xl mx-auto text-center">
          <CheckCircle className="h-10 w-10 mx-auto mb-3" style={{ color: theme.primaryColor }} />
          <h3 className="text-lg font-bold mb-1" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
            {successMessage}
          </h3>
          <button
            onClick={() => { setStatus('idle'); setEmail(''); setName(''); }}
            className="mt-3 text-xs underline opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: theme.primaryColor }}
          >Subscribe another email</button>
        </div>
      </section>
    );
  }

  /* ---- Shared pieces ---- */
  const inputStyle: React.CSSProperties = { borderRadius: theme.borderRadius };
  const btnStyle: React.CSSProperties = { backgroundColor: btnBg, color: btnFg, borderRadius: theme.borderRadius };

  const renderTitle = () =>
    isEditing ? (
      <h2
        contentEditable suppressContentEditableWarning
        onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
        className="text-2xl font-bold mb-2 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
        style={{ color: theme.textColor, fontFamily: theme.headingFont }}
      >{title}</h2>
    ) : (
      <h2 className="text-2xl font-bold mb-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
        {showIcon && <IconComp className="h-5 w-5 inline-block mr-2 mb-0.5" style={{ color: theme.primaryColor }} />}
        {title}
      </h2>
    );

  const renderSubtitle = () =>
    (subtitle || isEditing) ? (
      isEditing ? (
        <p
          contentEditable suppressContentEditableWarning
          onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
          className="text-sm opacity-70 mb-5 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
          style={{ color: theme.secondaryColor }}
        >{subtitle || 'Add subtitle...'}</p>
      ) : subtitle ? (
        <p className="text-sm opacity-70 mb-5" style={{ color: theme.secondaryColor }}>{subtitle}</p>
      ) : null
    ) : null;

  const renderNameInput = () =>
    showName ? (
      <input
        type="text"
        placeholder="Your name"
        className="px-4 py-3 border rounded-lg text-sm bg-background w-full focus:ring-2 focus:ring-primary/30 outline-none"
        style={inputStyle}
        disabled={isEditing}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    ) : null;

  const renderEmailInput = (className = 'flex-1') => (
    <input
      type="email"
      placeholder={placeholder}
      className={`px-4 py-3 border rounded-lg text-sm bg-background ${className} focus:ring-2 focus:ring-primary/30 outline-none`}
      style={inputStyle}
      disabled={isEditing}
      required
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
  );

  const renderButton = (fullWidth = false) =>
    isEditing ? (
      <span
        contentEditable suppressContentEditableWarning
        onBlur={(e) => onUpdate?.({ buttonText: e.currentTarget.textContent || '' })}
        className={`px-6 py-3 rounded-lg font-medium text-sm shrink-0 outline-none focus:ring-2 focus:ring-primary/50 inline-flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''}`}
        style={btnStyle}
      >{buttonText}</span>
    ) : (
      <button
        type="submit"
        disabled={status === 'loading'}
        className={`px-6 py-3 rounded-lg font-medium text-sm shrink-0 inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60 ${fullWidth ? 'w-full' : ''}`}
        style={btnStyle}
      >
        {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
        {buttonText}
      </button>
    );

  const renderError = () =>
    status === 'error' ? (
      <div className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Failed to subscribe. Please try again.</span>
      </div>
    ) : null;

  const renderPrivacy = () =>
    showPrivacy ? (
      <p className="text-[11px] opacity-50 mt-2" style={{ color: theme.secondaryColor }}>
        {privacyText}
      </p>
    ) : null;

  const renderEditHint = () =>
    isEditing ? (
      <p className="text-[10px] text-center text-muted-foreground mt-3 opacity-60">
        💡 Set webhook URL & form actions in Properties → Form Settings
      </p>
    ) : null;

  /* ---- Variant renderers ---- */
  const sectionBg = bgColor || theme.primaryColor + '08';

  /* INLINE — horizontal input + button (default) */
  if (variant === 'inline' || variant === 'minimal') {
    return (
      <section dir={dir} className={`${compact ? 'py-8' : 'py-16'} px-6`} style={{ backgroundColor: variant === 'minimal' ? 'transparent' : sectionBg, fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-xl mx-auto text-center">
          {variant !== 'minimal' && renderTitle()}
          {variant !== 'minimal' && renderSubtitle()}
          <form className="space-y-3 max-w-md mx-auto" onSubmit={handleSubmit}>
            {renderNameInput()}
            <div className="flex gap-3">
              {renderEmailInput()}
              {renderButton()}
            </div>
            {renderError()}
            {renderPrivacy()}
          </form>
          {renderEditHint()}
        </div>
      </section>
    );
  }

  /* STACKED — vertical layout */
  if (variant === 'stacked') {
    return (
      <section dir={dir} className={`${compact ? 'py-8' : 'py-16'} px-6`} style={{ backgroundColor: sectionBg, fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-md mx-auto text-center">
          {showIcon && <IconComp className="h-8 w-8 mx-auto mb-3" style={{ color: theme.primaryColor }} />}
          {renderTitle()}
          {renderSubtitle()}
          <form className="space-y-3" onSubmit={handleSubmit}>
            {renderNameInput()}
            {renderEmailInput('w-full')}
            {renderButton(true)}
            {renderError()}
            {renderPrivacy()}
          </form>
          {renderEditHint()}
        </div>
      </section>
    );
  }

  /* CARD — elevated card container */
  if (variant === 'card') {
    return (
      <section dir={dir} className={`${compact ? 'py-8' : 'py-16'} px-6`} style={{ backgroundColor: 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div
          className="max-w-lg mx-auto rounded-2xl shadow-lg border border-border/20 p-8 text-center"
          style={{ backgroundColor: sectionBg, borderRadius: theme.borderRadius }}
        >
          {showIcon && (
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.primaryColor + '15' }}>
              <IconComp className="h-6 w-6" style={{ color: theme.primaryColor }} />
            </div>
          )}
          {renderTitle()}
          {renderSubtitle()}
          <form className="space-y-3" onSubmit={handleSubmit}>
            {renderNameInput()}
            <div className="flex gap-3">
              {renderEmailInput()}
              {renderButton()}
            </div>
            {renderError()}
            {renderPrivacy()}
          </form>
          {renderEditHint()}
        </div>
      </section>
    );
  }

  /* SPLIT — two-column: text left, form right */
  if (variant === 'split') {
    return (
      <section dir={dir} className={`${compact ? 'py-8' : 'py-16'} px-6`} style={{ backgroundColor: sectionBg, fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            {showIcon && <IconComp className="h-8 w-8 mb-3" style={{ color: theme.primaryColor }} />}
            {isEditing ? (
              <h2
                contentEditable suppressContentEditableWarning
                onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
                className="text-2xl font-bold mb-2 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                style={{ color: theme.textColor, fontFamily: theme.headingFont }}
              >{title}</h2>
            ) : (
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h2>
            )}
            {(subtitle || isEditing) && (
              isEditing ? (
                <p
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
                  className="text-sm opacity-70 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                  style={{ color: theme.secondaryColor }}
                >{subtitle || 'Add subtitle...'}</p>
              ) : subtitle ? (
                <p className="text-sm opacity-70" style={{ color: theme.secondaryColor }}>{subtitle}</p>
              ) : null
            )}
          </div>
          <div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              {renderNameInput()}
              {renderEmailInput('w-full')}
              {renderButton(true)}
              {renderError()}
              {renderPrivacy()}
            </form>
            {renderEditHint()}
          </div>
        </div>
      </section>
    );
  }

  /* BANNER — full-width horizontal bar */
  if (variant === 'banner') {
    return (
      <section dir={dir} className="py-6 px-6" style={{ backgroundColor: theme.primaryColor, fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-4 px-2">
          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <h2
                contentEditable suppressContentEditableWarning
                onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
                className="text-lg font-bold outline-none focus:ring-1 focus:ring-white/30 rounded px-1"
                style={{ color: '#ffffff', fontFamily: theme.headingFont }}
              >{title}</h2>
            ) : (
              <h2 className="text-lg font-bold" style={{ color: '#ffffff', fontFamily: theme.headingFont }}>
                {showIcon && <IconComp className="h-4 w-4 inline-block mr-2 mb-0.5" style={{ color: '#ffffff' }} />}
                {title}
              </h2>
            )}
            {subtitle && !isEditing && <p className="text-sm opacity-80" style={{ color: '#ffffff' }}>{subtitle}</p>}
          </div>
          <form className="flex flex-col sm:flex-row gap-3 w-full md:w-auto" onSubmit={handleSubmit}>
            {renderEmailInput('w-full sm:w-56')}
            {isEditing ? (
              <span
                contentEditable suppressContentEditableWarning
                onBlur={(e) => onUpdate?.({ buttonText: e.currentTarget.textContent || '' })}
                className="px-6 py-3 rounded-lg font-medium text-sm shrink-0 outline-none"
                style={{ backgroundColor: '#ffffff', color: theme.primaryColor, borderRadius: theme.borderRadius }}
              >{buttonText}</span>
            ) : (
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3 rounded-lg font-medium text-sm shrink-0 inline-flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#ffffff', color: theme.primaryColor, borderRadius: theme.borderRadius }}
              >
                {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                {buttonText}
              </button>
            )}
          </form>
        </div>
        {status === 'error' && (
          <div className="max-w-5xl mx-auto mt-2">{renderError()}</div>
        )}
      </section>
    );
  }

  /* Fallback = inline */
  return null;
}
