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
      // Mobile-optimized tour — targets the mobile workspace drawer and
      // the compact header actions that are actually rendered on mobile.
      return [
        { target: 'body', title: t('tour.welcome.title'), content: t('tour.welcome.content'), placement: 'center', disableBeacon: true },
        { target: '[data-tour="mobile-menu"]', title: t('tour.mobileMenu.title'), content: t('tour.mobileMenu.content'), placement: 'bottom', disableBeacon: true },
        { target: '[data-tour="global-search"]', title: t('tour.globalSearch.title'), content: t('tour.globalSearch.content'), placement: 'bottom', disableBeacon: true },
        { target: '[data-tour="quick-create"]', title: t('tour.quickCreate.title'), content: t('tour.quickCreate.content'), placement: 'bottom', disableBeacon: true },
        { target: '[data-tour="notifications"]', title: t('tour.notifications.title'), content: t('tour.notifications.content'), placement: 'bottom', disableBeacon: true },
        { target: '[data-tour="mobile-ask-ai"]', title: t('tour.askAi.title'), content: t('tour.askAi.content'), placement: 'bottom', disableBeacon: true },
        { target: '[data-tour="service-section"]', title: t('tour.serviceDesk.title'), content: t('tour.serviceDesk.content'), placement: 'bottom', disableBeacon: true },
        { target: '[data-tour="help-button"]', title: t('tour.helpButton.title'), content: t('tour.helpButton.content'), placement: 'bottom', disableBeacon: true },
        { target: 'body', title: t('tour.dashboardGrid.title'), content: t('tour.dashboardGrid.content'), placement: 'center', disableBeacon: true },
        { target: 'body', title: t('tour.complete.title'), content: t('tour.complete.content'), placement: 'center', disableBeacon: true },
      ];
    }

    // Desktop/Tablet tour — mapped to the new WorkspaceSidebar (icon rail +
    // module panel), the DashboardHeader actions, and the customizable
    // dashboard grid on the landing page.
    return [
      { target: 'body', title: t('tour.welcome.title'), content: t('tour.welcome.content'), placement: 'center', disableBeacon: true },
      { target: '[data-tour="sidebar"]', title: t('tour.sidebar.title'), content: t('tour.sidebar.content'), placement: 'right', disableBeacon: true },
      { target: '[data-tour="workspace-rail"]', title: t('tour.workspaceRail.title'), content: t('tour.workspaceRail.content'), placement: 'right', disableBeacon: true },
      { target: '[data-tour="module-panel"]', title: t('tour.modulePanel.title'), content: t('tour.modulePanel.content'), placement: 'right', disableBeacon: true },
      { target: '[data-tour="sidebar-user"]', title: t('tour.userMenu.title'), content: t('tour.userMenu.content'), placement: 'right-end', disableBeacon: true },
      { target: '[data-tour="dashboard-header"]', title: t('tour.header.title'), content: t('tour.header.content'), placement: 'bottom', disableBeacon: true },
      { target: '[data-tour="global-search"]', title: t('tour.globalSearch.title'), content: t('tour.globalSearch.content'), placement: 'bottom', disableBeacon: true },
      { target: '[data-tour="quick-create"]', title: t('tour.quickCreate.title'), content: t('tour.quickCreate.content'), placement: 'bottom', disableBeacon: true },
      { target: '[data-tour="notifications"]', title: t('tour.notifications.title'), content: t('tour.notifications.content'), placement: 'bottom', disableBeacon: true },
      { target: '[data-tour="ask-ai"]', title: t('tour.askAi.title'), content: t('tour.askAi.content'), placement: 'bottom', disableBeacon: true },
      { target: '[data-tour="service-section"]', title: t('tour.serviceDesk.title'), content: t('tour.serviceDesk.content'), placement: 'right', disableBeacon: true },
      { target: '[data-tour="help-button"]', title: t('tour.helpButton.title'), content: t('tour.helpButton.content'), placement: 'bottom', disableBeacon: true },
      { target: '[data-tour="dashboard-grid"]', title: t('tour.dashboardGrid.title'), content: t('tour.dashboardGrid.content'), placement: 'top', disableBeacon: true },
      { target: 'body', title: t('tour.complete.title'), content: t('tour.complete.content'), placement: 'center', disableBeacon: true },
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
