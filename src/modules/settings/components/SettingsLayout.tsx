import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Settings, User, Users, Shield, Cog, Heart, FileText, Activity, Menu, Wrench, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { AccountSettings } from "./AccountSettings";
import { UserManagement } from "@/modules/users";
import { RoleManagement } from "./RoleManagement";
import { SkillsManagement } from "@/modules/skills";
import { ApplicationSettings } from "./ApplicationSettings";
import { Preferences } from "./Preferences";
import { ApiDocumentation } from "./ApiDocumentation";
import { SystemLogs } from "./SystemLogs";
import { DatabaseVisualization } from "./DatabaseVisualization";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";

type SettingsSection = 'account' | 'users' | 'roles' | 'skills' | 'application' | 'preferences' | 'api' | 'database' | 'logs';

export function SettingsLayout() {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMainAdmin, hasPermission, isLoading } = usePermissions();
  
  // Check if user has permission to access system settings
  const canAccessSystemSettings = isMainAdmin || hasPermission('settings', 'read');

  useEffect(() => {
    if (isLoading) return;
    
    if (!canAccessSystemSettings) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access system settings.",
        variant: "destructive"
      });
      navigate('/dashboard/settings', { replace: true });
    }
  }, [canAccessSystemSettings, isLoading, navigate, toast]);

  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const settingsButtons = [
    {
      id: 'account' as SettingsSection,
      label: 'account',
      icon: User,
      description: 'account'
    },
    {
      id: 'users' as SettingsSection,
      label: 'users',
      icon: Users,
      description: 'users'
    },
    {
      id: 'roles' as SettingsSection,
      label: 'roles',
      icon: Shield,
      description: 'roles'
    },
    {
      id: 'skills' as SettingsSection,
      label: 'skills',
      icon: Wrench,
      description: 'skills'
    },
    {
      id: 'application' as SettingsSection,
      label: 'application',
      icon: Cog,
      description: 'application'
    },
    {
      id: 'preferences' as SettingsSection,
      label: 'preferences',
      icon: Heart,
      description: 'preferences'
    },
    {
      id: 'api' as SettingsSection,
      label: 'api',
      icon: FileText,
      description: 'api'
    },
    {
      id: 'database' as SettingsSection,
      label: 'database',
      icon: Database,
      description: 'database',
      onClick: () => navigate('/dashboard/settings/database-full-view')
    },
    {
      id: 'logs' as SettingsSection,
      label: 'logs',
      icon: Activity,
      description: 'logs'
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSettings />;
      case 'users':
        return <UserManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'skills':
        return <SkillsManagement />;
      case 'application':
        return <ApplicationSettings />;
      case 'preferences':
        return <Preferences />;
      case 'api':
        return <ApiDocumentation />;
      case 'database':
        return <DatabaseVisualization />;
      case 'logs':
        return <SystemLogs />;
      default:
        return <AccountSettings />;
    }
  };

  const handleSectionChange = (section: SettingsSection) => {
    // Check if button has custom onClick
    const button = settingsButtons.find(btn => btn.id === section);
    if (button && (button as any).onClick) {
      (button as any).onClick();
      return;
    }
    
    setActiveSection(section);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const SidebarContent = () => {
    // Separate buttons into sections
    const mainButtons = settingsButtons.slice(0, 4); // account, users, roles, skills
    const systemButtons = settingsButtons.slice(4); // application, preferences, api, logs

    return (
      <div className="space-y-4 p-4 bg-white dark:bg-transparent">
        {/* Main Settings Section */}
        <div className="space-y-2">
          {mainButtons.map((button) => {
            const Icon = button.icon;
            const isActive = activeSection === button.id;
            
                return (
              <Button
                key={button.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 h-auto p-3 ${
                  isActive 
                    ? "bg-primary text-white shadow-glow border-0" 
                    : "hover:bg-primary/10 hover:text-primary transition-all duration-300"
                }`}
                onClick={() => handleSectionChange(button.id)}
              >
                <div className={`p-1.5 rounded-lg ${
                  isActive 
                    ? "bg-white/20" 
                    : "bg-primary/10"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                      <div className={`font-medium text-sm ${isActive ? "text-accent-foreground" : ""}`}>{t(`sidebar.${button.label}.label`)}</div>
                      <div className={`text-xs ${
                        isActive ? "text-accent-foreground" : "text-muted-foreground"
                      }`}>
                        {t(`sidebar.${button.description}.desc`)}
                      </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* System Section */}
        <div className="space-y-2">
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</h3>
          </div>
          {systemButtons.map((button) => {
            const Icon = button.icon;
            const isActive = activeSection === button.id;
            
            return (
              <Button
                key={button.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 h-auto p-3 ${
                  isActive 
                    ? "bg-primary text-white shadow-glow border-0" 
                    : "hover:bg-primary/10 hover:text-primary transition-all duration-300"
                }`}
                onClick={() => handleSectionChange(button.id)}
              >
                <div className={`p-1.5 rounded-lg ${
                  isActive 
                    ? "bg-white/20" 
                    : "bg-primary/10"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className={`font-medium text-sm ${isActive ? "text-accent-foreground" : ""}`}>{button.label}</div>
                  <div className={`text-xs ${
                    isActive ? "text-accent-foreground" : "text-muted-foreground"
                  }`}>
                    {button.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  // Show nothing while loading or if no permission
  if (isLoading || !canAccessSystemSettings) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 border-b border-border bg-background/95 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="p-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">Settings Menu</h2>
                  </div>
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            )}
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground truncate">{t('settings')}</h1>
              <p className="text-[11px] text-muted-foreground truncate">Manage your account and application preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        {!isMobile && (
          <div className="w-64 border-r border-border bg-card/50 overflow-y-auto">
            <SidebarContent />
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6">
              <Card className="min-h-full border-0 shadow-elegant bg-card">
              <div className="p-4 sm:p-6">
                {renderContent()}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
