import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingData } from "../pages/Onboarding";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface WorkAreaStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  isFirst: boolean;
}

const industries = [
  { id: 'technology', emoji: '💻' },
  { id: 'healthcare', emoji: '🏥' },
  { id: 'finance', emoji: '🏦' },
  { id: 'education', emoji: '🎓' },
  { id: 'retail', emoji: '🛒' },
  { id: 'manufacturing', emoji: '🏭' },
  { id: 'construction', emoji: '🏗️' },
  { id: 'consulting', emoji: '📊' },
  { id: 'real-estate', emoji: '🏠' },
  { id: 'transportation', emoji: '🚚' },
  { id: 'hospitality', emoji: '🏨' },
  { id: 'media', emoji: '🎬' },
  { id: 'nonprofit', emoji: '🤝' },
  { id: 'government', emoji: '🏛️' },
  { id: 'other', emoji: '📁' },
];

const industryNames: Record<string, { name: string; description: string }> = {
  'technology': { name: 'Technology & Software', description: 'Software, IT services, SaaS' },
  'healthcare': { name: 'Healthcare & Medical', description: 'Hospitals, clinics, pharma' },
  'finance': { name: 'Finance & Banking', description: 'Banking, insurance, fintech' },
  'education': { name: 'Education & Training', description: 'Schools, e-learning, coaching' },
  'retail': { name: 'Retail & E-commerce', description: 'Online stores, marketplace' },
  'manufacturing': { name: 'Manufacturing', description: 'Production, industrial' },
  'construction': { name: 'Construction', description: 'Infrastructure, engineering' },
  'consulting': { name: 'Consulting & Services', description: 'Strategy, advisory' },
  'real-estate': { name: 'Real Estate', description: 'Property, development' },
  'transportation': { name: 'Transportation & Logistics', description: 'Shipping, supply chain' },
  'hospitality': { name: 'Hospitality & Tourism', description: 'Hotels, restaurants, travel' },
  'media': { name: 'Media & Entertainment', description: 'Publishing, content, broadcast' },
  'nonprofit': { name: 'Non-profit & NGO', description: 'Charities, social orgs' },
  'government': { name: 'Government & Public', description: 'Public sector, agencies' },
  'other': { name: 'Other', description: 'Other industries' },
};

export function WorkAreaStep({ data, onNext, onBack, isFirst }: WorkAreaStepProps) {
  const { t } = useTranslation();
  const [selectedIndustry, setSelectedIndustry] = useState(data.workArea || '');

  const handleNext = () => {
    if (selectedIndustry) {
      onNext({ workArea: selectedIndustry });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {industries.map((industry) => {
          const isSelected = selectedIndustry === industry.id;
          const info = industryNames[industry.id];
          return (
            <button
              key={industry.id}
              type="button"
              onClick={() => setSelectedIndustry(industry.id)}
              className={`group relative flex flex-col items-center text-center gap-2.5 px-4 py-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                isSelected
                  ? 'border-primary bg-primary/[0.06] shadow-md shadow-primary/10'
                  : 'border-border/40 hover:border-primary/30 hover:bg-muted/40 hover:shadow-sm'
              }`}
            >
              {/* Check badge */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                </div>
              )}

              {/* Emoji */}
              <span className={`text-3xl transition-transform duration-200 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
                {industry.emoji}
              </span>

              {/* Text */}
              <div className="space-y-0.5">
                <span className={`font-semibold text-sm block leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {t(`onboarding.industries.${industry.id}`, info.name)}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight block">
                  {info.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-10">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-9 px-6 text-sm border border-border hover:bg-muted/50 transition-colors rounded-lg"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-2" />
          {t('onboarding.back')}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!selectedIndustry}
          className="h-9 px-8 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('onboarding.steps.workArea.button')}
          <ArrowRight className="h-3.5 w-3.5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
