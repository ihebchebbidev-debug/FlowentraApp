import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';

// Highlight matching text in search results
const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-warning/20 text-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};

const faqCategories = [
  { key: 'gettingStarted', icon: '🚀', questions: ['whatIsWorkflow', 'howToNavigate', 'whatAreDailyTasks'] },
  { key: 'offersAndSales', icon: '💼', questions: ['howToCreateOffer', 'howToAddArticles', 'howToConvertToSale', 'whatHappensAfterConversion', 'howToSetDiscount'] },
  { key: 'serviceOrders', icon: '🔧', questions: ['whatIsServiceOrder', 'howToViewJobs', 'howToUpdateJobStatus', 'howToLinkEquipment'] },
  { key: 'planningAndDispatches', icon: '📅', questions: ['howToScheduleJob', 'whatIsDispatch', 'howToReschedule', 'howToViewTechSchedule'] },
  { key: 'timeAndExpenses', icon: '⏱️', questions: ['howToLogTime', 'howToAddExpense', 'howToLogMaterials', 'whereToSeeTimesheet'] },
  { key: 'inventoryAndArticles', icon: '📦', questions: ['howToCreateArticle', 'differenceMaterialService', 'howToCheckStock', 'howToAdjustInventory'] },
  { key: 'installationsAndEquipment', icon: '🏭', questions: ['whatIsInstallation', 'howToCreateInstallation', 'howToViewServiceHistory', 'howToScheduleMaintenance'] },
  { key: 'accountAndSettings', icon: '⚙️', questions: ['howToChangePassword', 'howToUpdateProfile', 'howToSetNotifications', 'howToSwitchLanguage'] },
];

export default function FaqList() {
  const { t } = useTranslation('support');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('gettingStarted');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Filter categories and questions based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqCategories;
    }

    const query = searchQuery.toLowerCase();
    
    return faqCategories
      .map(category => {
        const filteredQuestions = category.questions.filter(questionKey => {
          const questionText = t(`faq.questions.${category.key}.${questionKey}.q`).toLowerCase();
          const answerText = t(`faq.questions.${category.key}.${questionKey}.a`).toLowerCase();
          const categoryTitle = t(`categories.${category.key}.title`).toLowerCase();
          
          return (
            questionText.includes(query) ||
            answerText.includes(query) ||
            categoryTitle.includes(query)
          );
        });

        return {
          ...category,
          questions: filteredQuestions,
        };
      })
      .filter(category => category.questions.length > 0);
  }, [searchQuery, t]);

  const totalResults = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.questions.length, 0);
  }, [filteredCategories]);

  const toggleCategory = (key: string) => {
    setExpandedCategory(expandedCategory === key ? null : key);
    setExpandedQuestion(null);
  };

  const toggleQuestion = (questionKey: string) => {
    setExpandedQuestion(expandedQuestion === questionKey ? null : questionKey);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Auto-expand all categories when searching
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6">{t('faq.title')}</h2>
      
      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Summary */}
      {isSearching && (
        <div className="mb-4 text-sm text-muted-foreground">
          {totalResults > 0 ? (
            <span>
              {t('search.resultsFound', { count: totalResults, query: searchQuery })}
            </span>
          ) : (
            <span>{t('search.noResults', { query: searchQuery })}</span>
          )}
        </div>
      )}

      {/* FAQ Categories */}
      <div className="flex flex-col gap-4">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <Card key={category.key} className="overflow-hidden">
              {/* Category Header */}
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                onClick={() => toggleCategory(category.key)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="font-semibold text-lg">{t(`categories.${category.key}.title`)}</span>
                  {isSearching && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {category.questions.length}
                    </span>
                  )}
                </div>
                {(isSearching || expandedCategory === category.key) ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Questions - auto-expand when searching */}
              {(isSearching || expandedCategory === category.key) && (
                <div className="border-t border-border">
                  {category.questions.map((questionKey) => {
                    const fullKey = `${category.key}.${questionKey}`;
                    const isExpanded = expandedQuestion === fullKey || isSearching;
                    
                    return (
                      <div key={questionKey} className="border-b border-border last:border-b-0">
                        <button
                          className="w-full p-4 pl-12 text-left flex items-center justify-between hover:bg-muted/30 transition-colors"
                          onClick={() => toggleQuestion(fullKey)}
                        >
                          <span className="font-medium text-sm pr-4">
                            <HighlightText 
                              text={t(`faq.questions.${category.key}.${questionKey}.q`)} 
                              query={searchQuery} 
                            />
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="px-12 pb-4 text-sm text-muted-foreground">
                            <HighlightText 
                              text={t(`faq.questions.${category.key}.${questionKey}.a`)} 
                              query={searchQuery} 
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <div className="text-muted-foreground">
              {t('search.emptyState')}
            </div>
            <Button variant="link" onClick={clearSearch} className="mt-2">
              {t('search.clearSearch')}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
