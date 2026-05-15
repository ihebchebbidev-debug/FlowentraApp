import React, { useState } from 'react';
import { SiteTheme } from '../../../types';
import { submitFormData } from '../../../utils/formSubmissionHelper';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle, Plus, Trash2, GripVertical } from 'lucide-react';

type FieldType = 'text' | 'email' | 'textarea' | 'select' | 'number' | 'tel' | 'date' | 'file' | 'checkbox' | 'url' | 'password' | 'radio' | 'hidden';

interface FormField {
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  width?: 'full' | 'half';
  defaultValue?: string;
}

interface FormSettings {
  webhookUrl?: string;
  webhookMethod?: 'POST' | 'GET';
  webhookHeaders?: Record<string, string>;
  collectSubmissions?: boolean;
  successMessage?: string;
  successAction?: 'message' | 'redirect' | 'reset';
  redirectUrl?: string;
  emailTo?: string;
  autoReply?: boolean;
}

interface FormBlockProps {
  title?: string;
  subtitle?: string;
  fields: FormField[];
  submitText?: string;
  formSettings?: FormSettings;
  layout?: 'vertical' | 'inline' | 'two-column';
  variant?: 'default' | 'bordered' | 'card' | 'minimal';
  siteId?: string;
  pageTitle?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
  id?: string;
}

export function FormBlock({
  title,
  subtitle,
  fields,
  submitText = 'Submit',
  formSettings = {},
  layout = 'vertical',
  variant = 'default',
  siteId = '',
  pageTitle = '',
  theme,
  isEditing,
  onUpdate,
  style,
  id = '',
}: FormBlockProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    webhookUrl,
    webhookMethod = 'POST',
    collectSubmissions = true,
    successMessage = 'Thank you! Your submission has been received.',
    successAction = 'message',
    redirectUrl,
  } = formSettings;

  const handleFieldChange = (label: string, value: any) => {
    setFormData(prev => ({ ...prev, [label]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) return;

    setStatus('loading');
    setErrorMsg('');

    // Collect submission data
    const submissionData: Record<string, any> = {};
    fields.forEach(f => {
      submissionData[f.label] = formData[f.label] ?? f.defaultValue ?? '';
    });

    const result = await submitFormData({
      siteId,
      formComponentId: id,
      formLabel: title || 'Form',
      pageTitle,
      data: submissionData,
      source: isEditing ? 'preview' : 'website',
      webhookUrl,
      webhookMethod,
      collectSubmissions,
    });

    if (!result.success && webhookUrl) {
      setStatus('error');
      setErrorMsg(result.webhookResponse || 'Webhook failed');
    } else {
      setStatus('success');
      if (successAction === 'redirect' && redirectUrl) {
        window.location.href = redirectUrl;
      } else if (successAction === 'reset') {
        setFormData({});
        setTimeout(() => setStatus('idle'), 2000);
      }
      toast.success(successMessage);
    }
  };

  // Edit mode: field type options
  const fieldTypeOptions: { label: string; value: FieldType }[] = [
    { label: 'Text', value: 'text' }, { label: 'Email', value: 'email' },
    { label: 'Textarea', value: 'textarea' }, { label: 'Number', value: 'number' },
    { label: 'Phone', value: 'tel' }, { label: 'Date', value: 'date' },
    { label: 'URL', value: 'url' }, { label: 'Select', value: 'select' },
    { label: 'Checkbox', value: 'checkbox' }, { label: 'Radio', value: 'radio' },
    { label: 'File', value: 'file' }, { label: 'Hidden', value: 'hidden' },
  ];

  const updateField = (idx: number, key: string, value: any) => {
    const updated = fields.map((f, i) => i === idx ? { ...f, [key]: value } : f);
    onUpdate?.({ fields: updated });
  };

  const addField = () => {
    onUpdate?.({ fields: [...fields, { label: 'New Field', type: 'text', placeholder: '', required: false, width: 'full' }] });
  };

  const removeField = (idx: number) => {
    onUpdate?.({ fields: fields.filter((_, i) => i !== idx) });
  };

  // Variant styles
  const containerClasses = {
    default: '',
    bordered: 'border rounded-xl p-6',
    card: 'bg-white shadow-lg rounded-2xl p-8',
    minimal: '',
  };

  const gridClass = layout === 'two-column' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' :
    layout === 'inline' ? 'flex flex-wrap gap-3 items-end' : 'space-y-4';

  // Success state
  if (status === 'success' && successAction === 'message') {
    return (
      <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
        <div className={`max-w-lg mx-auto text-center ${containerClasses[variant]}`} style={{ borderRadius: theme.borderRadius }}>
          <CheckCircle className="h-12 w-12 mx-auto mb-4" style={{ color: theme.primaryColor }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
            {successMessage}
          </h3>
          <button
            onClick={() => { setStatus('idle'); setFormData({}); }}
            className="mt-4 text-sm underline opacity-70 hover:opacity-100"
            style={{ color: theme.primaryColor }}
          >
            Submit another response
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className={`max-w-lg mx-auto ${containerClasses[variant]}`} style={{ borderRadius: theme.borderRadius }}>
        {/* Title */}
        {title && (
          <h3 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-center mb-6 opacity-70" style={{ color: theme.secondaryColor }}>
            {subtitle}
          </p>
        )}

        {/* Form */}
        <form className={gridClass} onSubmit={handleSubmit}>
          {fields.map((field, i) => {
            if (field.type === 'hidden') return null;
            const widthClass = field.width === 'half' && layout === 'two-column' ? '' : layout === 'two-column' ? 'sm:col-span-2' : '';

            return (
              <div key={i} className={`space-y-1.5 ${widthClass} ${layout === 'inline' ? 'flex-1 min-w-[180px]' : ''}`}>
                {field.type !== 'checkbox' && (
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: theme.textColor }}>
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                )}

                {field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formData[field.label] ?? ''}
                    onChange={e => handleFieldChange(field.label, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    style={{ borderRadius: theme.borderRadius }}
                    disabled={isEditing}
                  />
                ) : field.type === 'select' ? (
                  <select
                    required={field.required}
                    value={formData[field.label] ?? ''}
                    onChange={e => handleFieldChange(field.label, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    style={{ borderRadius: theme.borderRadius }}
                    disabled={isEditing}
                  >
                    <option value="">{field.placeholder || 'Select...'}</option>
                    {field.options?.map((opt, j) => <option key={j} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="flex flex-wrap gap-3">
                    {field.options?.map((opt, j) => (
                      <label key={j} className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: theme.textColor }}>
                        <input
                          type="radio"
                          name={field.label}
                          value={opt}
                          checked={formData[field.label] === opt}
                          onChange={() => handleFieldChange(field.label, opt)}
                          disabled={isEditing}
                          className="w-4 h-4"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!formData[field.label]}
                      onChange={e => handleFieldChange(field.label, e.target.checked)}
                      className="w-4 h-4"
                      disabled={isEditing}
                    />
                    <span className="text-sm" style={{ color: theme.textColor }}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </span>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formData[field.label] ?? ''}
                    onChange={e => handleFieldChange(field.label, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    style={{ borderRadius: theme.borderRadius }}
                    disabled={isEditing}
                  />
                )}

                {/* Editing: field config */}
                {isEditing && (
                  <div className="flex gap-1 items-center mt-1">
                    <select
                      value={field.type}
                      onChange={e => updateField(i, 'type', e.target.value)}
                      className="text-[10px] px-1 py-0.5 border rounded bg-background"
                    >
                      {fieldTypeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <label className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={field.required ?? false}
                        onChange={e => updateField(i, 'required', e.target.checked)}
                        className="w-3 h-3"
                      />
                      Required
                    </label>
                    <select
                      value={field.width || 'full'}
                      onChange={e => updateField(i, 'width', e.target.value)}
                      className="text-[10px] px-1 py-0.5 border rounded bg-background"
                    >
                      <option value="full">Full width</option>
                      <option value="half">Half width</option>
                    </select>
                    <button onClick={() => removeField(i)} className="p-0.5 text-destructive hover:bg-destructive/10 rounded">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 text-destructive text-sm" style={{ borderRadius: theme.borderRadius }}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg || 'Something went wrong. Please try again.'}</span>
            </div>
          )}

          {/* Submit */}
          <div className={layout === 'two-column' ? 'sm:col-span-2' : ''}>
            <button
              type="submit"
              disabled={status === 'loading' || isEditing}
              className="w-full py-2.5 rounded-lg font-medium text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}
            >
              {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitText}
            </button>
          </div>
        </form>

        {/* Edit mode: add field + form settings hint */}
        {isEditing && (
          <div className="mt-4 space-y-2">
            <button
              onClick={addField}
              className="w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 border border-dashed hover:bg-muted/30 transition-colors"
              style={{ borderRadius: theme.borderRadius, color: theme.primaryColor }}
            >
              <Plus className="h-3 w-3" /> Add Field
            </button>
            <div className="text-[10px] text-center text-muted-foreground opacity-60">
              💡 Configure webhook URL, success message & actions in the Properties panel → Form Settings
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
