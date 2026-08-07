import React from 'react';
import { SiteTheme } from '../../../types';

interface LoginFormBlockProps {
  title?: string;
  showSignup?: boolean;
  showForgot?: boolean;
  theme: SiteTheme;
  style?: React.CSSProperties;
}

export function LoginFormBlock({ title = 'Welcome Back', showSignup = true, showForgot = true, theme, style }: LoginFormBlockProps) {
  return (
    <section className="py-16 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-sm mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h2>
        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: theme.textColor }}>Email</label>
            <input type="email" placeholder="you@example.com" className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" style={{ borderRadius: theme.borderRadius }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: theme.textColor }}>Password</label>
            <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" style={{ borderRadius: theme.borderRadius }} />
          </div>
          {showForgot && (
            <div className="text-right">
              <a href="#" className="text-xs hover:underline" style={{ color: theme.primaryColor }}>Forgot password?</a>
            </div>
          )}
          <button type="submit" className="w-full py-2.5 rounded-lg font-medium text-white text-sm" style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}>Sign In</button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2" style={{ color: theme.secondaryColor }}>or</span></div>
          </div>
          <button type="button" className="w-full py-2.5 rounded-lg font-medium text-sm border hover:bg-gray-50" style={{ borderRadius: theme.borderRadius, color: theme.textColor }}>Continue with Google</button>
        </form>
        {showSignup && (
          <p className="text-center text-sm mt-6" style={{ color: theme.secondaryColor }}>
            Don't have an account? <a href="#" className="font-medium hover:underline" style={{ color: theme.primaryColor }}>Sign up</a>
          </p>
        )}
      </div>
    </section>
  );
}
