import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { AnimatedBackground } from '@/components/ui/animated-background';

interface AuthLayoutProps {
  children: ReactNode;
}
export function AuthLayout({
  children
}: AuthLayoutProps) {
  const {
    t
  } = useTranslation();
  return <div className="min-h-screen flex relative">
      <AnimatedBackground />
      
      {/* Overlay for better contrast */}
      <div className="fixed inset-0 bg-background/40 backdrop-blur-sm -z-5"></div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
      <header className="flex justify-end items-center p-3 sm:p-4 gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-2">
          <div className="w-full max-w-lg">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground/80 mb-2">
            <a href="#" className="hover:text-foreground transition-colors">{t('footer.terms')}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t('footer.faq')}</a>
          </div>
          <p className="text-xs text-muted-foreground/60">&copy; {new Date().getFullYear()} Flowentra. {t('footer.all_rights_reserved')}</p>
        </footer>
      </div>
    </div>;
}