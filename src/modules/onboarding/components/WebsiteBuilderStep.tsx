import { Button } from "@/components/ui/button";
import { OnboardingData } from "../pages/Onboarding";
import { Globe, ArrowLeft, ArrowRight, Layers, Paintbrush, Smartphone, Rocket, CheckCircle2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface WebsiteBuilderStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  isFirst: boolean;
}

const features = [
  {
    icon: Layers,
    titleKey: 'onboarding.steps.websiteBuilder.features.dragDrop',
    descKey: 'onboarding.steps.websiteBuilder.features.dragDropDesc',
  },
  {
    icon: Paintbrush,
    titleKey: 'onboarding.steps.websiteBuilder.features.templates',
    descKey: 'onboarding.steps.websiteBuilder.features.templatesDesc',
  },
  {
    icon: Smartphone,
    titleKey: 'onboarding.steps.websiteBuilder.features.responsive',
    descKey: 'onboarding.steps.websiteBuilder.features.responsiveDesc',
  },
  {
    icon: Rocket,
    titleKey: 'onboarding.steps.websiteBuilder.features.publish',
    descKey: 'onboarding.steps.websiteBuilder.features.publishDesc',
  },
];

export function WebsiteBuilderStep({ data, onNext, onBack }: WebsiteBuilderStepProps) {
  const { t } = useTranslation();

  const handleNext = () => {
    onNext({});
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Feature intro */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('onboarding.steps.websiteBuilder.intro')}
        </p>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t(feature.titleKey)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Setup later note */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50 border border-border mb-8">
        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('onboarding.steps.websiteBuilder.setupLater')}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
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
          className="h-9 px-8 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg"
        >
          {t('onboarding.continue')}
          <ArrowRight className="h-3.5 w-3.5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
