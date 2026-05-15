import React, { useState } from 'react';
import { SiteTheme } from '../../../types';
import { submitFormData } from '../../../utils/formSubmissionHelper';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import {
  getHeadingStyle,
  getScaledFontSize,
  getSectionPaddingStyle,
  getButtonStyle,
  getButtonBorderRadius,
  getThemeShadow,
  getCardStyle,
} from '../../../utils/themeUtils';

interface ContactFormSettings {
  webhookUrl?: string;
  webhookMethod?: 'POST' | 'GET';
  collectSubmissions?: boolean;
  successMessage?: string;
  successAction?: 'message' | 'redirect' | 'reset';
  redirectUrl?: string;
  emailTo?: string;
}

interface ContactFormBlockProps {
  title: string;
  subtitle?: string;
  fields?: string[];
  submitText?: string;
  bgColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  formSettings?: ContactFormSettings;
  layout?: 'vertical' | 'horizontal';
  variant?: 'default' | 'split' | 'minimal' | 'card';
  showIcon?: boolean;
  siteId?: string;
  pageTitle?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
  id?: string;
}

export function ContactFormBlock({
  title, subtitle, fields = ['name', 'email', 'message'], submitText = 'Send Message',
  bgColor, buttonColor, buttonTextColor,
  formSettings = {},
  layout = 'vertical', variant = 'default', showIcon = true,
  siteId = '', pageTitle = '',
  theme, isEditing, onUpdate, style, id = '',
}: ContactFormBlockProps) {
  const dir = theme.direction || 'ltr';
  const btnBg = buttonColor || theme.primaryColor;
  const btnFg = buttonTextColor || '#ffffff';

  // Theme-derived styles
  const sectionPadding = getSectionPaddingStyle(theme);
  const headingStyles = getHeadingStyle(theme, { color: theme.textColor });
  const buttonStyles = getButtonStyle('primary', theme, btnBg, btnFg);
  const cardStyles = getCardStyle(theme);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const {
    webhookUrl,
    webhookMethod = 'POST',
    collectSubmissions = true,
    successMessage = 'Thank you! We\'ll get back to you soon.',
    successAction = 'message',
    redirectUrl,
  } = formSettings;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) return;

    setStatus('loading');

    const result = await submitFormData({
      siteId,
      formComponentId: id,
      formLabel: title || 'Contact Form',
      pageTitle,
      data: formData,
      source: isEditing ? 'preview' : 'website',
      webhookUrl,
      webhookMethod,
      collectSubmissions,
    });

    if (!result.success) {
      setStatus('error');
    } else {
      setStatus('success');
      toast.success(successMessage);
      if (successAction === 'redirect' && redirectUrl) {
        window.location.href = redirectUrl;
      } else if (successAction === 'reset') {
        setFormData({});
        setTimeout(() => setStatus('idle'), 2000);
      }
    }
  };

  if (status === 'success' && successAction === 'message') {
    return (
      <section 
        dir={dir} 
        style={{ 
          ...sectionPadding, 
          fontFamily: theme.bodyFont, 
          backgroundColor: bgColor || 'transparent', 
          ...style 
        }}
      >
        <div className="max-w-lg mx-auto text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4" style={{ color: theme.primaryColor }} />
          <h3 
            className="font-bold mb-2" 
            style={{ ...headingStyles, fontSize: getScaledFontSize(20, theme) }}
          >
            {successMessage}
          </h3>
          <button
            onClick={() => { setStatus('idle'); setFormData({}); }}
            className="mt-4 underline opacity-70"
            style={{ color: theme.primaryColor, fontSize: getScaledFontSize(14, theme) }}
          >Send another message</button>
        </div>
      </section>
    );
  }

  const variantClasses = {
    default: '',
    split: 'md:grid md:grid-cols-2 md:gap-8 md:items-start',
    minimal: '',
    card: '',
  };

  const cardVariantStyle: React.CSSProperties = variant === 'card' 
    ? { ...cardStyles, backgroundColor: theme.backgroundColor, padding: '32px', boxShadow: getThemeShadow(theme) }
    : {};

  return (
    <section 
      dir={dir} 
      style={{ 
        ...sectionPadding, 
        fontFamily: theme.bodyFont, 
        backgroundColor: bgColor || 'transparent', 
        ...style 
      }}
    >
      <div 
        className={`max-w-lg mx-auto ${variantClasses[variant]}`} 
        style={cardVariantStyle}
      >
        {/* Header */}
        <div className={variant === 'split' ? '' : 'mb-6'}>
          {isEditing ? (
            <h2
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
              className="font-bold text-center mb-2 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ ...headingStyles, fontSize: getScaledFontSize(30, theme) }}
            >{title}</h2>
          ) : (
            <h2 
              className={`font-bold ${variant === 'split' ? '' : 'text-center'} mb-2`} 
              style={{ ...headingStyles, fontSize: getScaledFontSize(30, theme) }}
            >
              {showIcon && <Send className="h-5 w-5 inline-block mr-2 mb-1" style={{ color: theme.primaryColor }} />}
              {title}
            </h2>
          )}
          {(subtitle || isEditing) && (
            isEditing ? (
              <p
                contentEditable suppressContentEditableWarning
                onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
                className="text-center mb-4 opacity-70 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                style={{ color: theme.secondaryColor, fontSize: getScaledFontSize(16, theme) }}
              >{subtitle || 'Add subtitle...'}</p>
            ) : subtitle ? (
              <p 
                className={`${variant === 'split' ? '' : 'text-center'} opacity-70 mb-4`} 
                style={{ color: theme.secondaryColor, fontSize: getScaledFontSize(16, theme) }}
              >{subtitle}</p>
            ) : null
          )}
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field}>
              <label 
                className="block font-medium mb-1 capitalize" 
                style={{ color: theme.textColor, fontSize: getScaledFontSize(14, theme) }}
              >{field}</label>
              {field === 'message' ? (
                <textarea
                  className="w-full border p-3 bg-background focus:ring-2 focus:ring-primary/30 outline-none"
                  rows={4}
                  placeholder={`Your ${field}`}
                  disabled={isEditing}
                  value={formData[field] ?? ''}
                  onChange={e => handleChange(field, e.target.value)}
                  style={{ borderRadius: `${theme.borderRadius}px`, fontSize: getScaledFontSize(14, theme) }}
                />
              ) : (
                <input
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  className="w-full border p-3 bg-background focus:ring-2 focus:ring-primary/30 outline-none"
                  placeholder={`Your ${field}`}
                  disabled={isEditing}
                  value={formData[field] ?? ''}
                  onChange={e => handleChange(field, e.target.value)}
                  style={{ borderRadius: `${theme.borderRadius}px`, fontSize: getScaledFontSize(14, theme) }}
                />
              )}
            </div>
          ))}

          {status === 'error' && (
            <div 
              className="flex items-center gap-2 p-3 bg-destructive/5 text-destructive"
              style={{ borderRadius: `${theme.borderRadius}px`, fontSize: getScaledFontSize(14, theme) }}
            >
              <AlertCircle className="h-4 w-4" />
              <span>Failed to submit. Please try again.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || isEditing}
            className="w-full py-3 font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ 
              ...buttonStyles, 
              borderRadius: getButtonBorderRadius(theme),
              boxShadow: theme.shadowStyle !== 'none' ? getThemeShadow(theme) : undefined,
              fontSize: getScaledFontSize(16, theme),
            }}
          >
            {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitText}
          </button>
        </form>

        {/* Edit hint */}
        {isEditing && (
          <p 
            className="text-center text-muted-foreground mt-3 opacity-60"
            style={{ fontSize: getScaledFontSize(10, theme) }}
          >
            💡 Set webhook URL & form actions in Properties → Form Settings
          </p>
        )}
      </div>
    </section>
  );
}
