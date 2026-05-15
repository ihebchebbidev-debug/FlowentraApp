import { useState, useEffect, useMemo } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';

interface AiFeatureTourProps {
  run: boolean;
  onFinish: () => void;
}

// Helper to get computed CSS variable value
const getCSSVariable = (variable: string): string => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `hsl(${value})` : '';
};

export function AiFeatureTour({ run, onFinish }: AiFeatureTourProps) {
  const { t } = useTranslation('aiAssistant');
  const { theme, resolvedTheme } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);

  const isDark = resolvedTheme === 'dark';

  const steps: Step[] = useMemo(() => [
    {
      target: '[data-tour="ai-input"]',
      content: t('tour.inputDesc'),
      title: t('tour.inputTitle'),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '[data-tour="ai-image"]',
      content: t('tour.imageDesc'),
      title: t('tour.imageTitle'),
      placement: 'top',
    },
    {
      target: '[data-tour="ai-voice"]',
      content: t('tour.voiceDesc'),
      title: t('tour.voiceTitle'),
      placement: 'top',
    },
    {
      target: '[data-tour="ai-mention"]',
      content: t('tour.mentionDesc'),
      title: t('tour.mentionTitle'),
      placement: 'top',
    },
    {
      target: '[data-tour="ai-slash"]',
      content: t('tour.slashDesc'),
      title: t('tour.slashTitle'),
      placement: 'top',
    },
    {
      target: '[data-tour="ai-suggestions"]',
      content: t('tour.suggestionsDesc'),
      title: t('tour.suggestionsTitle'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="ai-help"]',
      content: t('tour.issueDesc'),
      title: t('tour.issueTitle'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="ai-help"]',
      content: t('tour.dataDesc'),
      title: t('tour.dataTitle'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="ai-help"]',
      content: t('tour.availabilityDesc'),
      title: t('tour.availabilityTitle'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="ai-help"]',
      content: t('tour.tasksDesc'),
      title: t('tour.tasksTitle'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="ai-header"]',
      content: t('tour.featuresDesc'),
      title: t('tour.featuresTitle'),
      placement: 'bottom',
    },
  ], [t]);

  // Reset step index when tour starts
  useEffect(() => {
    if (run) {
      setStepIndex(0);
    }
  }, [run]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;

    if (type === 'step:after') {
      setStepIndex(index + 1);
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onFinish();
    }
  };

  // Get theme colors from CSS variables
  const primaryColor = getCSSVariable('--primary') || (isDark ? 'hsl(4, 90%, 58%)' : 'hsl(4, 90%, 58%)');
  const bgColor = getCSSVariable('--background') || (isDark ? 'hsl(224, 71%, 4%)' : 'hsl(0, 0%, 100%)');
  const textColor = getCSSVariable('--foreground') || (isDark ? 'hsl(210, 20%, 98%)' : 'hsl(224, 71%, 4%)');
  const mutedColor = getCSSVariable('--muted-foreground') || (isDark ? 'hsl(215, 20.2%, 65.1%)' : 'hsl(215.4, 16.3%, 46.9%)');

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      spotlightClicks
      callback={handleJoyrideCallback}
      locale={{
        back: t('tour.back'),
        close: t('tour.close'),
        last: t('tour.finish'),
        next: t('tour.next'),
        skip: t('tour.skip'),
        open: t('tour.open'),
      }}
      styles={{
        options: {
          primaryColor,
          backgroundColor: bgColor,
          textColor,
          arrowColor: bgColor,
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
        tooltipTitle: {
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
        },
        tooltipContent: {
          fontSize: '14px',
          lineHeight: 1.5,
        },
        buttonNext: {
          backgroundColor: primaryColor,
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 500,
        },
        buttonBack: {
          color: mutedColor,
          marginRight: '8px',
        },
        buttonSkip: {
          color: mutedColor,
        },
        spotlight: {
          borderRadius: '12px',
        },
      }}
      floaterProps={{
        styles: {
          floater: {
            filter: 'none',
          },
        },
      }}
    />
  );
}
