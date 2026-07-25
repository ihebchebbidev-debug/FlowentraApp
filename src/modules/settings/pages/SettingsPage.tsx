import { useState, useMemo, useCallback, useEffect } from "react";
import { NumberingSettings } from "@/modules/settings/components/NumberingSettings";
import { JobConversionModeSettings } from "@/modules/settings/components/JobConversionModeSettings";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Shield, Settings2, Palette, Filter, ChevronDown, Activity, Database, Monitor, Link2, User, Building2, Lock, ChevronRight, CreditCard, Layers, RefreshCw, WifiOff, Play } from "lucide-react";
import { SettingsAutopilotDemo } from "@/modules/settings/components/onboarding/SettingsAutopilotDemo";
import { useLayoutModeContext } from "@/hooks/useLayoutMode";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/services/api/usersApi";
import { rolesApi } from "@/services/api/rolesApi";
import { User as UserType, Role } from "@/types/users";
import { UsersTable } from "@/modules/users/components/UsersTable";
import { CreateUserModal } from "@/modules/users/components/CreateUserModal";
import { EditUserModal } from "@/modules/users/components/EditUserModal";
import { RoleAssignmentModal } from "@/modules/users/components/RoleAssignmentModal";
import { RolesTable } from "@/modules/settings/components/RolesTable";
import { CreateRoleModal } from "@/modules/settings/components/CreateRoleModal";
import { EditRoleModal } from "@/modules/settings/components/EditRoleModal";
import { UserGroupManagement } from "@/modules/settings/components/UserGroupManagement";
import { AccountSettings } from "@/modules/settings/components/AccountSettings";
import { IntegrationsTabContent } from "@/modules/settings/components/IntegrationsTabContent";
import { SubscriptionSettings } from "@/modules/settings/components/SubscriptionSettings";
import { TenantManagement } from "@/modules/settings/components/TenantManagement";
import { UserPreferencesTab } from "@/modules/settings/components/UserPreferencesTab";
import { OfflineHydrationSettings } from "@/modules/settings/components/OfflineHydrationSettings";

import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  section?: string;
  visible: boolean;
}

interface SettingsPageProps {
  /** When set, the page renders in standalone mode: no sidebar, section is locked, URL is not synced. */
  standaloneSection?: string;
}

export default function SettingsPage({ standaloneSection }: SettingsPageProps = {}) {
  const { toast } = useToast();
  const { t } = useTranslation('settings');
  const { isMainAdmin, hasPermission } = usePermissions();
  const { isMobile } = useLayoutModeContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const isStandalone = !!standaloneSection;
  const [activeSection, setActiveSectionState] = useState(
    () => standaloneSection || searchParams.get('section') || 'profile'
  );
  const setActiveSection = useCallback(
    (id: string) => {
      if (isStandalone) return;
      setActiveSectionState(id);
      const next = new URLSearchParams(searchParams);
      next.set('section', id);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, isStandalone]
  );
  useEffect(() => {
    if (isStandalone) {
      if (standaloneSection && standaloneSection !== activeSection) {
        setActiveSectionState(standaloneSection);
      }
      return;
    }
    const q = searchParams.get('section');
    if (q && q !== activeSection) setActiveSectionState(q);
  }, [searchParams, activeSection, isStandalone, standaloneSection]);
  const [demoOpen, setDemoOpen] = useState(false);
  
  // Permission-based tab visibility
  const canViewUsers = isMainAdmin || hasPermission('users', 'read');
  const canViewRoles = isMainAdmin || hasPermission('roles', 'read');
  const canViewSystem = isMainAdmin || hasPermission('settings', 'read');
  const canViewPreferences = isMainAdmin;
  
  // Permission-based action visibility
  const canCreateUsers = isMainAdmin || hasPermission('users', 'create');
  const canUpdateUsers = isMainAdmin || hasPermission('users', 'update');
  const canDeleteUsers = isMainAdmin || hasPermission('users', 'delete');
  const canCreateRoles = isMainAdmin || hasPermission('roles', 'create');
  const canUpdateRoles = isMainAdmin || hasPermission('roles', 'update');
  const canDeleteRoles = isMainAdmin || hasPermission('roles', 'delete');
  
  const navigate = useNavigate();
  
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [roleAssignmentOpen, setRoleAssignmentOpen] = useState(false);
  
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [deleteRoleOpen, setDeleteRoleOpen] = useState(false);

  // Search states
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [roleSearchTerm, setRoleSearchTerm] = useState("");

  // Filter states
  const [showUserFilters, setShowUserFilters] = useState(false);
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userCountryFilter, setUserCountryFilter] = useState<string>("all");

  // Get MainAdminUser info from localStorage
  const mainAdminInfo = useMemo(() => {
    try {
      const userData = localStorage.getItem('user_data');
      if (!userData) return null;
      const user = JSON.parse(userData);
      // Only return if this is the main admin (id=1 or login_type=admin)
      const loginType = localStorage.getItem('login_type');
      const userId = user.id || user.userId;
      if (userId === 1 || loginType === 'admin') {
        return {
          firstName: user.firstName || user.first_name || '',
          lastName: user.lastName || user.last_name || '',
          email: user.email || '',
          profilePictureUrl: user.profilePictureUrl || user.profile_picture_url || undefined,
          createdAt: user.createdAt || user.created_at || undefined,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Fetch users
  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  // Fetch roles
  const { data: rolesData, refetch: refetchRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
  });

  // Get unique countries and roles for filters
  const uniqueCountries = useMemo(() => {
    const users = usersData?.users || [];
    const countries = [...new Set(users.map((u: UserType) => u.country).filter(Boolean))];
    return countries.sort();
  }, [usersData?.users]);

  const uniqueRoleNames = useMemo(() => {
    const roles = rolesData || [];
    return roles.map((r: Role) => r.name).sort();
  }, [rolesData]);

  // Count active filters
  const activeUserFilterCount = [userStatusFilter, userRoleFilter, userCountryFilter].filter(f => f !== "all").length;

  // Filtered data
  const filteredUsers = useMemo(() => {
    let users = usersData?.users || [];
    
    if (userSearchTerm) {
      const search = userSearchTerm.toLowerCase();
      users = users.filter((user: UserType) => 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.country?.toLowerCase().includes(search) ||
        user.roles?.some((r: Role) => r.name.toLowerCase().includes(search))
      );
    }
    
    if (userStatusFilter !== "all") {
      const isActive = userStatusFilter === "active";
      users = users.filter((user: UserType) => user.isActive === isActive);
    }
    
    if (userRoleFilter !== "all") {
      users = users.filter((user: UserType) => 
        user.roles?.some((r: Role) => r.name === userRoleFilter) || 
        user.role === userRoleFilter
      );
    }
    
    if (userCountryFilter !== "all") {
      users = users.filter((user: UserType) => user.country === userCountryFilter);
    }
    
    return users;
  }, [usersData?.users, userSearchTerm, userStatusFilter, userRoleFilter, userCountryFilter]);

  const filteredRoles = useMemo(() => {
    const roles = rolesData || [];
    if (!roleSearchTerm) return roles;
    const search = roleSearchTerm.toLowerCase();
    return roles.filter((role: Role) => 
      role.name?.toLowerCase().includes(search) ||
      role.description?.toLowerCase().includes(search)
    );
  }, [rolesData, roleSearchTerm]);

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    setEditUserOpen(true);
  };

  const handleDeleteUser = (user: UserType) => {
    setSelectedUser(user);
    setDeleteUserOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await usersApi.delete(selectedUser.id);
      toast({
        title: t('users.deleteSuccessTitle'),
        description: t('users.deleteSuccess')
      });
      refetchUsers();
    } catch (error: any) {
      toast({
        title: t('users.deleteErrorTitle'),
        description: error.message || t('users.deleteFailed'),
        variant: "destructive"
      });
    } finally {
      setDeleteUserOpen(false);
      setSelectedUser(null);
    }
  };

  const handleManageRoles = (user: UserType) => {
    setSelectedUser(user);
    setRoleAssignmentOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditRoleOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role);
    setDeleteRoleOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!selectedRole) return;
    
    try {
      await rolesApi.delete(selectedRole.id);
      toast({
        title: t('roles.deleteSuccessTitle'),
        description: t('roles.deleteSuccess')
      });
      refetchRoles();
    } catch (error: any) {
      toast({
        title: t('roles.deleteErrorTitle'),
        description: error.message || t('roles.deleteFailed'),
        variant: "destructive"
      });
    } finally {
      setDeleteRoleOpen(false);
      setSelectedRole(null);
    }
  };

  // Navigation items grouped by section
  // Personal: Profile, Security
  // General: Company (incl. preferences), Tenants subscription, Offline sync, System configuration
  // Other admin items (users, roles, integrations, syncHistory, companies) are reachable
  // from the Administration workspace sidebar via ?section= URLs and remain functional here.
  const navItems: NavItem[] = [
    { id: 'profile', labelKey: 'nav.profile', icon: User, section: 'personal', visible: true },
    { id: 'security', labelKey: 'nav.security', icon: Lock, section: 'personal', visible: true },
    { id: 'company', labelKey: 'nav.company', icon: Building2, section: 'general', visible: true },
    // Preferences merged into the Company section; kept hidden here for direct-URL back-compat.
    { id: 'preferences', labelKey: 'nav.preferences', icon: Palette, section: 'general', visible: false },
    { id: 'subscription', labelKey: 'nav.subscription', icon: CreditCard, section: 'general', visible: isMainAdmin },
    { id: 'offline', labelKey: 'nav.offline', icon: WifiOff, section: 'general', visible: true },
    { id: 'system', labelKey: 'nav.system', icon: Monitor, section: 'general', visible: canViewSystem },
    // Reachable via direct URL from the Administration workspace sidebar:
    { id: 'companies', labelKey: 'nav.companies', icon: Layers, section: 'admin', visible: false },
    { id: 'users', labelKey: 'nav.users', icon: Users, section: 'admin', visible: false },
    { id: 'roles', labelKey: 'nav.roles', icon: Shield, section: 'admin', visible: false },
    { id: 'userGroups', labelKey: 'nav.userGroups', icon: Users, section: 'admin', visible: false },
    { id: 'integrations', labelKey: 'nav.integrations', icon: Link2, section: 'admin', visible: false },
    { id: 'syncHistory', labelKey: 'nav.syncHistory', icon: RefreshCw, section: 'admin', visible: false },
  ];

  const personalItems = navItems.filter(i => i.section === 'personal' && i.visible);
  const adminItems = navItems.filter(i => i.section === 'general' && i.visible);

  const activeItem = navItems.find(i => i.id === activeSection);

  // Standalone mode: dedicated route page for a single admin section — no settings sidebar.
  if (isStandalone) {
    return (
      <div className="flex flex-col h-full" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-background">
          <div className="w-full">
            {renderContent()}
          </div>
        </main>
        {renderModals()}
      </div>
    );
  }

  // Mobile: use a select dropdown for navigation
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="border-b border-border bg-background px-4 py-3">
          <div className="flex items-center mb-3">
            <h1 className="text-lg font-semibold text-foreground">{t('header.title')}</h1>
          </div>
          <Select value={activeSection} onValueChange={setActiveSection}>
            <SelectTrigger className="w-full h-11 rounded-xl border-primary/20 bg-primary/5 text-foreground font-medium shadow-sm focus:ring-primary/30">
              <SelectValue>
                {activeItem && (
                  <span className="flex items-center gap-2">
                    <activeItem.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{t(activeItem.labelKey)}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-card rounded-xl shadow-lg border-border/60">
              {personalItems.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-px-11 font-semibold uppercase tracking-wide text-muted-foreground">{t('nav.sectionPersonal')}</div>
                  {personalItems.map(item => (
                    <SelectItem key={item.id} value={item.id} className="rounded-lg cursor-pointer py-2.5">
                      <span className="flex items-center gap-2.5">
                        <span className={`p-1 rounded-md ${activeSection === item.id ? 'bg-primary/10' : 'bg-muted'}`}>
                          <item.icon className={`h-3.5 w-3.5 ${activeSection === item.id ? 'text-primary' : 'text-muted-foreground'}`} />
                        </span>
                        <span className={activeSection === item.id ? 'text-primary font-medium' : ''}>{t(item.labelKey)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
              {adminItems.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-px-11 font-semibold uppercase tracking-wide text-muted-foreground mt-1">{t('nav.sectionGeneral')}</div>
                  {adminItems.map(item => (
                    <SelectItem key={item.id} value={item.id} className="rounded-lg cursor-pointer py-2.5">
                      <span className="flex items-center gap-2.5">
                        <span className={`p-1 rounded-md ${activeSection === item.id ? 'bg-primary/10' : 'bg-muted'}`}>
                          <item.icon className={`h-3.5 w-3.5 ${activeSection === item.id ? 'text-primary' : 'text-muted-foreground'}`} />
                        </span>
                        <span className={activeSection === item.id ? 'text-primary font-medium' : ''}>{t(item.labelKey)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 p-4">
          {renderContent()}
        </div>
        {renderModals()}
        <SettingsAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
      </div>
    );
  }

  function renderContent() {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'company':
        return <CompanySection />;
      case 'security':
        return <SecuritySection />;
      case 'preferences':
        return <CompanySection />;
      case 'offline':
        return <OfflineHydrationSettings />;
      case 'companies':
        return isMainAdmin ? <TenantManagement /> : null;
      case 'integrations':
        return <IntegrationsTabContent />;
      case 'subscription':
        return isMainAdmin ? <SubscriptionSettings /> : null;
      case 'users':
        return canViewUsers ? renderUsersContent() : null;
      case 'roles':
        return canViewRoles ? renderRolesContent() : null;
      case 'system':
        return canViewSystem ? renderSystemContent() : null;
      case 'syncHistory':
        return canViewSystem ? renderSyncHistoryShortcut() : null;
      case 'userGroups':
        return <UserGroupManagement />;
      default:
        return <ProfileSection />;
    }
  }


  // User Groups now rendered via UserGroupManagement component.

  function ProfileSection() {
    return (
      <div className="space-y-1">
        <AccountSettings section="profile" />
      </div>
    );
  }

  function CompanySection() {
    return (
      <div className="space-y-6">
        <AccountSettings section="company" />
        {canViewPreferences && <UserPreferencesTab />}
      </div>
    );
  }

  function SecuritySection() {
    return (
      <div className="space-y-1">
        <AccountSettings section="security" />
      </div>
    );
  }

  function renderUsersContent() {
    return (
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {t('users.managementTitle')}
          </CardTitle>
          <CardDescription className="text-xs">{t('users.managementDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex gap-2 sm:gap-3 flex-1">
              <CollapsibleSearch
                placeholder={t('users.searchUsers')}
                value={userSearchTerm}
                onChange={setUserSearchTerm}
              />
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 sm:gap-2 px-2 sm:px-3" 
                  onClick={() => setShowUserFilters(v => !v)}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('users.filters')}</span>
                  {activeUserFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">{activeUserFilterCount}</Badge>
                  )}
                </Button>

                {showUserFilters && (
                  <div className="flex gap-2 items-end">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('users.filterLabels.status')}</label>
                      <div className="relative">
                        <select 
                          value={userStatusFilter} 
                          onChange={(e) => setUserStatusFilter(e.target.value)} 
                          className="border border-border/50 rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground text-sm"
                        >
                          <option value="all">{t('users.status.all')}</option>
                          <option value="active">{t('users.status.active')}</option>
                          <option value="inactive">{t('users.status.inactive')}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('users.filterLabels.role')}</label>
                      <div className="relative">
                        <select 
                          value={userRoleFilter} 
                          onChange={(e) => setUserRoleFilter(e.target.value)} 
                          className="border border-border/50 rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground text-sm"
                        >
                          <option value="all">{t('users.roles.all')}</option>
                          {uniqueRoleNames.map((role: string) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('users.filterLabels.country')}</label>
                      <div className="relative">
                        <select 
                          value={userCountryFilter} 
                          onChange={(e) => setUserCountryFilter(e.target.value)} 
                          className="border border-border/50 rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground text-sm"
                        >
                          <option value="all">{t('users.country.all')}</option>
                          {uniqueCountries.map((country: string) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {canCreateUsers && (
              <Button 
                onClick={() => setCreateUserOpen(true)}
                size="sm"
                className="gradient-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('users.addUser')}
              </Button>
            )}
          </div>
          <UsersTable
            users={filteredUsers}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onManageRoles={handleManageRoles}
            canUpdate={canUpdateUsers}
            canDelete={canDeleteUsers}
            mainAdmin={mainAdminInfo}
          />
        </CardContent>
      </Card>
    );
  }

  function renderRolesContent() {
    return (
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {t('roles.managementTitle')}
          </CardTitle>
          <CardDescription className="text-xs">{t('roles.managementDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <CollapsibleSearch
              placeholder={t('roles.searchPlaceholder')}
              value={roleSearchTerm}
              onChange={setRoleSearchTerm}
            />
            {canCreateRoles && (
              <Button 
                onClick={() => setCreateRoleOpen(true)}
                size="sm"
                className="gradient-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('roles.addRole')}
              </Button>
            )}
          </div>
          <RolesTable
            roles={filteredRoles}
            onEdit={handleEditRole}
            onDelete={handleDeleteRole}
            canUpdate={canUpdateRoles}
            canDelete={canDeleteRoles}
          />
        </CardContent>
      </Card>
    );
  }

  function renderSystemContent() {
    return (
      <div className="space-y-4">
        <Card className="shadow-card border-0 bg-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              {t('system.title')}
            </CardTitle>
            <CardDescription className="text-xs">{t('system.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button 
                className="rounded-lg border border-border/50 bg-muted/30 p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group"
                onClick={() => navigate('/dashboard/settings/logs')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-foreground">{t('system.logsTitle')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('system.logsDesc')}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                </div>
              </button>
              <button 
                className="rounded-lg border border-border/50 bg-muted/30 p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group"
                onClick={() => navigate('/dashboard/settings/documentation')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Settings2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-foreground">{t('system.documentationTitle')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('system.documentationDesc')}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                </div>
              </button>
              <button
                className="rounded-lg border border-border/50 bg-muted/30 p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group"
                onClick={() => navigate('/dashboard/settings/sync')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-foreground">{t('system.syncTitle')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('system.syncDesc')}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Job Conversion Mode Setting */}
        <JobConversionModeSettings />

        {/* Numbering Templates Section */}
        <NumberingSettings />
      </div>
    );
  }

  function renderSyncHistoryShortcut() {
    return (
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            {t('syncDashboard.title')}
          </CardTitle>
          <CardDescription className="text-xs">{t('syncDashboard.desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <Button onClick={() => navigate('/dashboard/settings/sync')}>{t('syncDashboard.openDashboard')}</Button>
        </CardContent>
      </Card>
    );
  }

  function renderModals() {
    return (
      <>
        <CreateUserModal
          open={createUserOpen}
          onOpenChange={setCreateUserOpen}
          onUserCreated={refetchUsers}
        />
        <EditUserModal
          open={editUserOpen}
          onOpenChange={setEditUserOpen}
          user={selectedUser}
          onUserUpdated={refetchUsers}
        />
        <RoleAssignmentModal
          open={roleAssignmentOpen}
          onOpenChange={setRoleAssignmentOpen}
          user={selectedUser}
          onRoleAssigned={refetchUsers}
        />
        <CreateRoleModal
          open={createRoleOpen}
          onOpenChange={setCreateRoleOpen}
          onRoleCreated={refetchRoles}
        />
        <EditRoleModal
          open={editRoleOpen}
          onOpenChange={setEditRoleOpen}
          role={selectedRole}
          onRoleUpdated={refetchRoles}
        />

        <AlertDialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('confirm.deleteUser.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('confirm.deleteUser.desc', { firstName: selectedUser?.firstName || '', lastName: selectedUser?.lastName || '' })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteRoleOpen} onOpenChange={setDeleteRoleOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('confirm.deleteRole.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('confirm.deleteRole.desc', { roleName: selectedRole?.name || '', count: selectedRole?.userCount ?? 0 })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 'calc(100vh - 56px)' }}>
      {/* Header - consistent with Articles/Contacts pattern */}
      <header className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Settings2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{t('header.title')}</h1>
            <p className="text-px-10 sm:text-px-11 text-muted-foreground truncate">
              {t('header.descAdmin')}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex gap-1.5 shrink-0">
          <Play className="h-3.5 w-3.5" /> {t('watchDemo', 'Watch Demo')}
        </Button>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Navigation — horizontal scroll tabs on mobile, fixed sidebar on md+ */}
        <nav className="shrink-0 border-b md:border-b-0 md:border-r border-border bg-card md:w-60 md:py-5 md:overflow-y-auto overflow-x-auto">
          {/* Mobile: single horizontal row of icon+label buttons */}
          <div className="flex md:hidden gap-1 p-2">
            {[...personalItems, ...adminItems].map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-150 shrink-0",
                    isActive
                      ? "bg-sidebar-accent text-foreground font-medium shadow-sm"
                      : "text-sidebar-foreground/70 hover:text-foreground hover:bg-sidebar-foreground/[0.06]"
                  )}
                >
                  <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive && "text-primary")} />
                  {t(item.labelKey)}
                </button>
              );
            })}
          </div>

          {/* Desktop: grouped sidebar */}
          <div className="hidden md:block">
            {/* Personal section */}
            <div className="px-5 mb-2">
              <span className="text-px-11 font-semibold uppercase tracking-widest text-muted-foreground/70">
                {t('nav.sectionPersonal')}
              </span>
            </div>
            <div className="space-y-0.5 px-3 mb-5">
              {personalItems.map(item => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg h-8 text-sm transition-all duration-150",
                      isActive
                        ? "bg-sidebar-accent text-foreground font-medium shadow-sm"
                        : "text-sidebar-foreground/70 hover:text-foreground hover:bg-sidebar-foreground/[0.06]"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                    {t(item.labelKey)}
                  </button>
                );
              })}
            </div>

            {adminItems.length > 0 && (
              <div className="mx-5 mb-4 border-t border-border" />
            )}

            {adminItems.length > 0 && (
              <>
                <div className="px-5 mb-2">
                  <span className="text-px-11 font-semibold uppercase tracking-widest text-muted-foreground/70">
                    {t('nav.sectionGeneral')}
                  </span>
                </div>
                <div className="space-y-0.5 px-3">
                  {adminItems.map(item => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg h-8 text-sm transition-all duration-150",
                          isActive
                            ? "bg-sidebar-accent text-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground/70 hover:text-foreground hover:bg-sidebar-foreground/[0.06]"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                        {t(item.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-background">
          <div className="w-full">
            {renderContent()}
          </div>
        </main>
      </div>

      {renderModals()}
      <SettingsAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
