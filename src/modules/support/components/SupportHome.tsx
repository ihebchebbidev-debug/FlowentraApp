import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlayCircle } from 'lucide-react';
import { useProductTourContext } from '@/contexts/ProductTourContext';

const categoryKeys = [
  { key: 'gettingStarted', icon: '🚀', articles: 12 },
  { key: 'offersAndSales', icon: '💼', articles: 18 },
  { key: 'serviceOrders', icon: '🔧', articles: 15 },
  { key: 'planningAndDispatches', icon: '📅', articles: 14 },
  { key: 'timeAndExpenses', icon: '⏱️', articles: 10 },
  { key: 'inventoryAndArticles', icon: '📦', articles: 12 },
  { key: 'installationsAndEquipment', icon: '🏭', articles: 8 },
  { key: 'accountAndSettings', icon: '⚙️', articles: 9 },
];

export default function SupportHome() {
  const navigate = useNavigate();
  const { t } = useTranslation('support');
  const { startTour } = useProductTourContext();

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="w-full bg-gradient-to-br from-primary/90 to-secondary/80 py-8 px-4 md:px-0 flex flex-col items-center border-b border-border">
        <div className="w-full max-w-5xl flex flex-col md:flex-row md:items-center md:justify-center gap-4 md:gap-12">
          <div className="md:ml-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-1">{t('support.title')}</h1>
            <nav className="text-xs text-muted-foreground flex gap-2 items-center">
              <span className="cursor-pointer hover:underline" onClick={() => navigate('/dashboard')}>{t('support.dashboard')}</span>
              <span>/</span>
              <span className="font-semibold">{t('support.title')}</span>
            </nav>
          </div>
          <Button variant="outline" className="md:mr-auto" onClick={() => navigate('/dashboard/help/tickets')}>{t('support.contactSupport')}</Button>
        </div>
        <div className="w-full max-w-2xl mt-8 flex flex-col items-center">
          {/* AI Prompt Style Search */}
          <form className="w-full flex items-end gap-2 bg-background/80 border border-border rounded-xl shadow-sm px-4 py-3" onSubmit={e => { e.preventDefault(); navigate('/dashboard/help/chat'); }}>
            <div className="flex-1 flex items-center">
              <span className="mr-2 text-xl">💬</span>
              <input
                className="flex-1 bg-transparent outline-none border-none text-base placeholder:text-muted-foreground"
                placeholder={t('support.searchPlaceholder')}
                style={{ minHeight: '2.5rem' }}
                autoFocus
              />
            </div>
            <Button type="submit" className="rounded-full h-10 w-10 p-0 flex items-center justify-center" variant="default" title={t('chat.send')}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>
            </Button>
          </form>
          <div className="w-full mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground justify-start">
            <span className="bg-muted px-3 py-1 rounded-full cursor-pointer hover:bg-accent transition" onClick={() => navigate('/dashboard/help/faq')}>{t('support.quickTags.createOffer')}</span>
            <span className="bg-muted px-3 py-1 rounded-full cursor-pointer hover:bg-accent transition" onClick={() => navigate('/dashboard/help/faq')}>{t('support.quickTags.convertToSale')}</span>
            <span className="bg-muted px-3 py-1 rounded-full cursor-pointer hover:bg-accent transition" onClick={() => navigate('/dashboard/help/faq')}>{t('support.quickTags.planJob')}</span>
            <span className="bg-muted px-3 py-1 rounded-full cursor-pointer hover:bg-accent transition" onClick={() => navigate('/dashboard/help/faq')}>{t('support.quickTags.logTime')}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto py-10 px-6">
        {/* Quick Links */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-center mb-12 w-full">
          <Card
            className="flex flex-col items-center justify-center min-h-[110px] h-full w-full cursor-pointer hover:shadow-lg transition text-center py-4"
            onClick={() => navigate('/dashboard/help/faq')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
              <span className="text-2xl">📖</span>
            </div>
            <div className="font-semibold text-base">{t('support.quickLinks.faq')}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('support.quickLinks.faqDesc')}</div>
          </Card>
          <Card
            className="flex flex-col items-center justify-center min-h-[110px] h-full w-full cursor-pointer hover:shadow-lg transition text-center py-4"
            onClick={() => navigate('/dashboard/help/tickets')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
              <span className="text-2xl">🎫</span>
            </div>
            <div className="font-semibold text-base">{t('support.quickLinks.tickets')}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('support.quickLinks.ticketsDesc')}</div>
          </Card>
          <Card
            className="flex flex-col items-center justify-center min-h-[110px] h-full w-full cursor-pointer hover:shadow-lg transition text-center py-4"
            onClick={() => navigate('/dashboard/help/chat')}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="font-semibold text-base">{t('support.quickLinks.assistant')}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('support.quickLinks.assistantDesc')}</div>
          </Card>
        </section>

        {/* Start Tour Section */}
        <section className="mb-12">
          <Card
            className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 cursor-pointer hover:shadow-lg transition"
            onClick={startTour}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                <PlayCircle className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center sm:text-left">
                <div className="font-semibold text-lg">{t('support.tour.title')}</div>
                <div className="text-sm text-muted-foreground">{t('support.tour.description')}</div>
              </div>
            </div>
            <Button className="gap-2" onClick={(e) => { e.stopPropagation(); startTour(); }}>
              <PlayCircle className="w-4 h-4" />
              {t('support.tour.button')}
            </Button>
          </Card>
        </section>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('support.categories')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryKeys.map(cat => (
              <Card key={cat.key} className="p-4 flex flex-col gap-2 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/dashboard/help/faq')}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="font-semibold text-sm">{t(`categories.${cat.key}.title`)}</span>
                </div>
                <div className="text-xs text-muted-foreground">{t(`categories.${cat.key}.description`)}</div>
                <div className="text-xs text-muted-foreground mt-1">{cat.articles} {t('support.articles')}</div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
