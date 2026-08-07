import React from 'react';
import { SiteTheme } from '../../../types';

interface SignupFormBlockProps {
  title?: string;
  showLogin?: boolean;
  fields?: Array<'name' | 'email' | 'password' | 'phone' | 'company'>;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

const fieldConfig: Record<string, { label: string; type: string; placeholder: string }> = {
  name: { label: 'Full Name', type: 'text', placeholder: 'John Doe' },
  email: { label: 'Email', type: 'email', placeholder: 'john@example.com' },
  password: { label: 'Password', type: 'password', placeholder: '••••••••' },
  phone: { label: 'Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
  company: { label: 'Company', type: 'text', placeholder: 'Acme Inc.' },
};

export function SignupFormBlock({ title = 'Create Account', showLogin = true, fields = ['name', 'email', 'password'], theme, isEditing, onUpdate, style }: SignupFormBlockProps) {
  return (
    <section className="py-16 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-sm mx-auto">
        {isEditing ? (
          <h2
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
            className="text-2xl font-bold mb-6 text-center outline-none focus:ring-1 focus:ring-primary/50 rounded"
            style={{ color: theme.textColor, fontFamily: theme.headingFont }}
          >{title}</h2>
        ) : (
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h2>
        )}

        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
          {fields.map(f => {
            const cfg = fieldConfig[f];
            if (!cfg) return null;
            return (
              <div key={f} className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: theme.textColor }}>{cfg.label}</label>
                <input
                  type={cfg.type}
                  placeholder={cfg.placeholder}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ borderRadius: theme.borderRadius }}
                />
              </div>
            );
          })}

          <div className="flex items-start gap-2">
            <input type="checkbox" className="w-4 h-4 mt-0.5" />
            <span className="text-xs" style={{ color: theme.secondaryColor }}>
              I agree to the <a href="#" className="underline" style={{ color: theme.primaryColor }}>Terms of Service</a> and <a href="#" className="underline" style={{ color: theme.primaryColor }}>Privacy Policy</a>
            </span>
          </div>

          <button type="submit" className="w-full py-2.5 rounded-lg font-medium text-white text-sm" style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}>Create Account</button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2" style={{ color: theme.secondaryColor }}>or</span></div>
          </div>

          <button type="button" className="w-full py-2.5 rounded-lg font-medium text-sm border hover:bg-gray-50" style={{ borderRadius: theme.borderRadius, color: theme.textColor }}>Continue with Google</button>
        </form>

        {showLogin && (
          <p className="text-center text-sm mt-6" style={{ color: theme.secondaryColor }}>
            Already have an account? <a href="#" className="font-medium hover:underline" style={{ color: theme.primaryColor }}>Sign in</a>
          </p>
        )}
      </div>
    </section>
  );
}
