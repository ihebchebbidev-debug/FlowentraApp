import { SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceSidebar } from "@/modules/dashboard/components/WorkspaceSidebar";
import { MobileWorkspaceNav } from "@/modules/dashboard/components/MobileWorkspaceNav";
import { DashboardHeader } from "@/modules/dashboard/components/DashboardHeader";
import { DashboardContent } from "@/modules/dashboard/components/DashboardContent";
import { TopNavigation } from "@/components/navigation/TopNavigation";
import { LayoutModeProvider } from "@/components/providers/LayoutModeProvider";
import { useLayoutModeContext } from "@/hooks/useLayoutMode";
import { useLocation, Navigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { ProductTourProvider } from "@/contexts/ProductTourContext";
import { ProductTour } from "@/components/onboarding/ProductTour";
import { useProductTourContext } from "@/contexts/ProductTourContext";
import { CommandPalette } from "@/components/ui/command-palette";


function DashboardLayout() {
  const { layoutMode, isMobile } = useLayoutModeContext();
  const { isRunning, endTour } = useProductTourContext();
  const location = useLocation();
  const _isOnDashboardHome = location.pathname === "/dashboard";
  
  // Check if user has completed onboarding from server data
  const userData = authService.getCurrentUserFromStorage();
  const hasCompletedOnboarding = userData?.onboardingCompleted || localStorage.getItem('onboarding-completed');
  
  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // Mobile view - always render content (dashboard home is empty for now)
  if (isMobile) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
        <ProductTour isRunning={isRunning} onEnd={endTour} />
        <CommandPalette />
        <MobileWorkspaceNav />
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <DashboardContent />
        </main>
      </div>
    );
  }

  // Desktop/Tablet view - respect layout mode preference
  if (layoutMode === 'topbar') {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
        <ProductTour isRunning={isRunning} onEnd={endTour} />
        <CommandPalette />
        <DashboardHeader />
        <TopNavigation />
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <DashboardContent />
        </main>
      </div>
    );
  }

  function SidebarWrapper() {
    return (
      <>
        <WorkspaceSidebar />
        <div className="min-w-0 min-h-0 h-screen flex-1 flex flex-col relative overflow-hidden">
          <DashboardHeader />
          <main className="min-w-0 min-h-0 flex-1 overflow-auto overflow-x-hidden">
            <DashboardContent />
          </main>
        </div>
      </>
    );
  }

  // Default sidebar layout
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full max-w-full overflow-hidden bg-background">
        <ProductTour isRunning={isRunning} onEnd={endTour} />
        <CommandPalette />
        <SidebarWrapper />
      </div>
    </SidebarProvider>
  );
}

const Dashboard = () => {
  return (
    <ProductTourProvider>
      <LayoutModeProvider>
        <DashboardLayout />
      </LayoutModeProvider>
    </ProductTourProvider>
  );
};

export default Dashboard;