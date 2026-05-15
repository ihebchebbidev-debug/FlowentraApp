import React, { useCallback, useMemo } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductTourProps {
  isRunning: boolean;
  onEnd: () => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({ isRunning, onEnd }) => {
  const { t } = useTranslation('onboarding');
  const isMobile = useIsMobile();

  // Define comprehensive tour steps covering all major features
  // Mobile uses simplified steps that target centered modals or mobile-specific elements
  const steps: Step[] = useMemo(() => {
    if (isMobile) {
      // Mobile-optimized tour with fewer, more focused steps
      return [
        // Welcome
        {
          target: 'body',
          content: t('tour.welcome.content'),
          title: t('tour.welcome.title'),
          placement: 'center',
          disableBeacon: true,
        },
        // Mobile Menu Button
        {
          target: '[data-tour="mobile-menu"]',
          content: t('tour.mobileMenu.content'),
          title: t('tour.mobileMenu.title'),
          placement: 'bottom',
          disableBeacon: true,
        },
        // Mobile Notifications
        {
          target: '[data-tour="mobile-notifications"]',
          content: t('tour.notifications.content'),
          title: t('tour.notifications.title'),
          placement: 'bottom',
          disableBeacon: true,
        },
        // Mobile Ask AI
        {
          target: '[data-tour="mobile-ask-ai"]',
          content: t('tour.askAi.content'),
          title: t('tour.askAi.title'),
          placement: 'bottom',
          disableBeacon: true,
        },
        // Mobile User Menu
        {
          target: '[data-tour="mobile-user-menu"]',
          content: t('tour.userMenu.content'),
          title: t('tour.userMenu.title'),
          placement: 'bottom-end',
          disableBeacon: true,
        },
        // CRM Module Overview
        {
          target: 'body',
          content: t('tour.crmSection.content'),
          title: t('tour.crmSection.title'),
          placement: 'center',
          disableBeacon: true,
        },
        // Offers Overview
        {
          target: 'body',
          content: t('tour.offersModule.content'),
          title: t('tour.offersModule.title'),
          placement: 'center',
          disableBeacon: true,
        },
        // Sales Overview
        {
          target: 'body',
          content: t('tour.salesModule.content'),
          title: t('tour.salesModule.title'),
          placement: 'center',
          disableBeacon: true,
        },
        // Service Module Overview
        {
          target: 'body',
          content: t('tour.serviceSection.content'),
          title: t('tour.serviceSection.title'),
          placement: 'center',
          disableBeacon: true,
        },
        // Service Orders Overview
        {
          target: 'body',
          content: t('tour.serviceOrdersModule.content'),
          title: t('tour.serviceOrdersModule.title'),
          placement: 'center',
          disableBeacon: true,
        },
        // Dispatch Overview
        {
          target: 'body',
          content: t('tour.dispatchModule.content'),
          title: t('tour.dispatchModule.title'),
          placement: 'center',
          disableBeacon: true,
        },
        // Help/Support
        {
          target: '[data-tour="mobile-help"]',
          content: t('tour.helpButton.content'),
          title: t('tour.helpButton.title'),
          placement: 'bottom',
          disableBeacon: true,
        },
        // Completion
        {
          target: 'body',
          content: t('tour.complete.content'),
          title: t('tour.complete.title'),
          placement: 'center',
          disableBeacon: true,
        },
      ];
    }

    // Desktop/Tablet full tour
    return [
      // Welcome
      {
        target: 'body',
        content: t('tour.welcome.content'),
        title: t('tour.welcome.title'),
        placement: 'center',
        disableBeacon: true,
      },
      // Navigation - Sidebar
      {
        target: '[data-tour="sidebar"]',
        content: t('tour.sidebar.content'),
        title: t('tour.sidebar.title'),
        placement: 'right',
        disableBeacon: true,
      },
      // Header
      {
        target: '[data-tour="dashboard-header"]',
        content: t('tour.header.content'),
        title: t('tour.header.title'),
        placement: 'bottom',
        disableBeacon: true,
      },
      // Global Search
      {
        target: '[data-tour="global-search"]',
        content: t('tour.globalSearch.content'),
        title: t('tour.globalSearch.title'),
        placement: 'bottom',
        disableBeacon: true,
      },
      // Quick Create - Detailed
      {
        target: '[data-tour="quick-create"]',
        content: t('tour.quickCreate.content'),
        title: t('tour.quickCreate.title'),
        placement: 'bottom',
        disableBeacon: true,
      },
      // Notifications - Detailed
      {
        target: '[data-tour="notifications"]',
        content: t('tour.notifications.content'),
        title: t('tour.notifications.title'),
        placement: 'bottom',
        disableBeacon: true,
      },
      // Ask AI Assistant
      {
        target: '[data-tour="ask-ai"]',
        content: t('tour.askAi.content'),
        title: t('tour.askAi.title'),
        placement: 'bottom',
        disableBeacon: true,
      },
      // User Menu - Detailed
      {
        target: '[data-tour="user-menu"]',
        content: t('tour.userMenu.content'),
        title: t('tour.userMenu.title'),
        placement: 'bottom-end',
        disableBeacon: true,
      },
      // KPI Cards - Detailed
      {
        target: '[data-tour="kpi-cards"]',
        content: t('tour.kpiCards.content'),
        title: t('tour.kpiCards.title'),
        placement: 'bottom',
        disableBeacon: true,
      },
      // Sales Chart - Detailed (centered modal to avoid scrolling)
      {
        target: 'body',
        content: t('tour.salesChart.content'),
        title: t('tour.salesChart.title'),
        placement: 'center',
        disableBeacon: true,
      },
      // Offers Chart - Detailed (centered modal to avoid scrolling)
      {
        target: 'body',
        content: t('tour.offersChart.content'),
        title: t('tour.offersChart.title'),
        placement: 'center',
        disableBeacon: true,
      },
      // CRM Section - Detailed with module info
      {
        target: '[data-tour="crm-section"]',
        content: t('tour.crmSection.content'),
        title: t('tour.crmSection.title'),
        placement: 'right-start',
        disableBeacon: true,
      },
      // Offers Module Info (shown at CRM section)
      {
        target: '[data-tour="crm-section"]',
        content: t('tour.offersModule.content'),
        title: t('tour.offersModule.title'),
        placement: 'right-start',
        disableBeacon: true,
      },
      // Offers Actions Info
      {
        target: '[data-tour="crm-section"]',
        content: t('tour.offersStatusChange.content'),
        title: t('tour.offersStatusChange.title'),
        placement: 'right-start',
        disableBeacon: true,
      },
      // Sales Module Info
      {
        target: '[data-tour="crm-section"]',
        content: t('tour.salesModule.content'),
        title: t('tour.salesModule.title'),
        placement: 'right-start',
        disableBeacon: true,
      },
      // Sales Status Info
      {
        target: '[data-tour="crm-section"]',
        content: t('tour.salesStatusChange.content'),
        title: t('tour.salesStatusChange.title'),
        placement: 'right-start',
        disableBeacon: true,
      },
      // Service Section - Detailed
      {
        target: '[data-tour="service-section"]',
        content: t('tour.serviceSection.content'),
        title: t('tour.serviceSection.title'),
        placement: 'right-start',
        disableBeacon: true,
      },
      // Service Orders Info
      {
        target: '[data-tour="service-section"]',
        content: t('tour.serviceOrdersModule.content'),
        title: t('tour.serviceOrdersModule.title'),
        placement: 'right-start',
        disableBeacon: true,
      },
      // Service Orders Status
      {
        target: '[data-tour="service-section"]',
        content: t('tour.serviceOrdersStatusChange.content'),
        title: t('tour.serviceOrdersStatusChange.title'),
        placement: 'right-start',
        disableBeacon: true,
      },
      // Dispatch Module Info
      {
        target: '[data-tour="service-section"]',
        content: t('tour.dispatchModule.content'),
        title: t('tour.dispatchModule.title'),
        placement: 'right-start',
        disableBeacon: true,
      },
      // Dispatch Status Info
      {
        target: '[data-tour="service-section"]',
        content: t('tour.dispatchStatusChange.content'),
        title: t('tour.dispatchStatusChange.title'),
        placement: 'right-start',
        disableBeacon: true,
      },
      // Time Logging Info
      {
        target: '[data-tour="service-section"]',
        content: t('tour.dispatchTimeLogging.content'),
        title: t('tour.dispatchTimeLogging.title'),
        placement: 'right-start',
        disableBeacon: true,
      },
      // System Section - Detailed (compact style for bottom elements)
      {
        target: '[data-tour="system-section"]',
        content: t('tour.systemSection.content'),
        title: t('tour.systemSection.title'),
        placement: 'top',
        disableBeacon: true,
        styles: {
          tooltip: {
            maxWidth: '380px',
            padding: '16px',
          },
          tooltipContent: {
            fontSize: '13px',
            lineHeight: '1.5',
          },
        },
        floaterProps: {
          disableAnimation: true,
        },
      },
      // Dynamic Forms Module (compact)
      {
        target: '[data-tour="system-section"]',
        content: t('tour.dynamicFormsModule.content'),
        title: t('tour.dynamicFormsModule.title'),
        placement: 'top',
        disableBeacon: true,
        styles: {
          tooltip: {
            maxWidth: '380px',
            padding: '16px',
          },
          tooltipContent: {
            fontSize: '13px',
            lineHeight: '1.5',
          },
        },
      },
      // Dynamic Forms Builder (compact)
      {
        target: '[data-tour="system-section"]',
        content: t('tour.dynamicFormsBuilder.content'),
        title: t('tour.dynamicFormsBuilder.title'),
        placement: 'top',
        disableBeacon: true,
        styles: {
          tooltip: {
            maxWidth: '380px',
            padding: '16px',
          },
          tooltipContent: {
            fontSize: '13px',
            lineHeight: '1.5',
          },
        },
      },
      // Dynamic Forms Features (compact)
      {
        target: '[data-tour="system-section"]',
        content: t('tour.dynamicFormsFeatures.content'),
        title: t('tour.dynamicFormsFeatures.title'),
        placement: 'top',
        disableBeacon: true,
        styles: {
          tooltip: {
            maxWidth: '380px',
            padding: '16px',
          },
          tooltipContent: {
            fontSize: '13px',
            lineHeight: '1.5',
          },
        },
      },
      // Help/Support
      {
        target: '[data-tour="help-button"]',
        content: t('tour.helpButton.content'),
        title: t('tour.helpButton.title'),
        placement: 'bottom',
        disableBeacon: true,
      },
      // Completion
      {
        target: 'body',
        content: t('tour.complete.content'),
        title: t('tour.complete.title'),
        placement: 'center',
        disableBeacon: true,
      },
    ];
  }, [isMobile, t]);

  const handleCallback = useCallback((data: CallBackProps) => {
    const { status, action, type } = data;
    
    // End tour when finished or skipped
    if (
      status === STATUS.FINISHED ||
      status === STATUS.SKIPPED ||
      (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER)
    ) {
      onEnd();
    }
  }, [onEnd]);

  return (
    <Joyride
      steps={steps}
      run={isRunning}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      scrollOffset={150}
      spotlightClicks
      disableOverlayClose
      disableScrolling={false}
      callback={handleCallback}
      locale={{
        back: t('tour.buttons.back'),
        close: t('tour.buttons.close'),
        last: t('tour.buttons.finish'),
        next: t('tour.buttons.next'),
        // When showProgress=true, Joyride uses this label instead of `next`
        // and interpolates {step} and {steps} placeholders.
        nextLabelWithProgress: t('tour.buttons.nextWithProgress'),
        skip: t('tour.buttons.skip'),
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--card))',
          arrowColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0, 0, 0, 0.75)',
        },
        tooltip: {
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: isMobile ? '300px' : '450px',
          margin: isMobile ? '8px' : undefined,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '12px',
          color: 'hsl(var(--foreground))',
        },
        tooltipContent: {
          fontSize: '14px',
          lineHeight: '1.7',
          color: 'hsl(var(--muted-foreground))',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '10px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 500,
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: '10px',
          fontSize: '14px',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '13px',
        },
        spotlight: {
          borderRadius: '12px',
        },
        beacon: {
          display: 'none',
        },
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
};
