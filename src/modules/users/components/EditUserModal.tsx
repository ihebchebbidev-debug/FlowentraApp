import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usersApi, User, UpdateUserRequest } from "@/services/usersApi";
import { User as UserIcon, KeyRound, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { ProfilePictureUpload } from "@/components/ui/profile-picture-upload";
import { useEmailValidation } from "../hooks/useEmailValidation";
import { useTranslation } from "react-i18next";

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserUpdated: () => void;
}

export function EditUserModal({ open, onOpenChange, user, onUserUpdated }: EditUserModalProps) {
  const { t } = useTranslation('users');
  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    country: "",
    isActive: true,
    profilePictureUrl: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  const { toast } = useToast();
  
  // Use debounced email validation hook with excludeUserId
  const { isChecking, emailError, validateEmail, clearError } = useEmailValidation(user?.id);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || "",
        country: user.country,
        isActive: user.isActive,
        profilePictureUrl: user.profilePictureUrl || ""
      });
      // Reset password fields and validation when modal opens
      setNewPassword("");
      setConfirmPassword("");
      setActiveTab("details");
      clearError();
    }
  }, [user, clearError]);

  // Validate email on change (skip if same as original)
  useEffect(() => {
    if (formData.email && formData.email.toLowerCase().trim() !== user?.email?.toLowerCase().trim()) {
      validateEmail(formData.email);
    } else {
      // Email matches the original — clear any stale errors
      clearError();
    }
  }, [formData.email, user?.email, validateEmail, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Check if email is already in use
    if (emailError) {
      toast({
        title: t('common.error'),
        description: emailError,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await usersApi.update(user.id, formData);
      
      toast({
        title: t('editUser.success.title'),
        description: t('editUser.success.message')
      });
      
      onUserUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('common.failedToUpdate'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: t('common.error'),
        description: t('editUser.password.minLength'),
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('editUser.password.mismatch'),
        variant: "destructive"
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      await usersApi.changePassword(user.id, { newPassword });
      
      toast({
        title: t('common.success'),
        description: t('editUser.password.success')
      });
      
      setNewPassword("");
      setConfirmPassword("");
      onUserUpdated();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('common.failedToResetPassword'),
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t('editUser.title')}</DialogTitle>
          <DialogDescription>
            {t('editUser.description', { firstName: user?.firstName, lastName: user?.lastName })}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              {t('editUser.tabs.details')}
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              {t('editUser.tabs.password')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Picture */}
              <ProfilePictureUpload
                currentUrl={formData.profilePictureUrl}
                onUploaded={async (url) => {
                  setFormData(prev => ({ ...prev, profilePictureUrl: url }));
                  // Also immediately save via dedicated endpoint
                  if (user?.id) {
                    try {
                      const { profilePictureApi } = await import('@/services/api/profilePictureApi');
                      await profilePictureApi.updateUserProfilePicture(user.id, url);
                      console.log('[EditUserModal] Profile picture saved for user', user.id);
                    } catch (e) {
                      console.error('[EditUserModal] Failed to save profile picture immediately:', e);
                    }
                  }
                }}
                onRemoved={async () => {
                  setFormData(prev => ({ ...prev, profilePictureUrl: '' }));
                  if (user?.id) {
                    try {
                      const { profilePictureApi } = await import('@/services/api/profilePictureApi');
                      await profilePictureApi.removeUserProfilePicture(user.id);
                    } catch (e) {
                      console.error('[EditUserModal] Failed to remove profile picture:', e);
                    }
                  }
                }}
                size="sm"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('editUser.firstName')}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder={t('editUser.placeholders.firstName')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('editUser.lastName')}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder={t('editUser.placeholders.lastName')}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('editUser.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('editUser.placeholders.email')}
                  className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {isChecking && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('editUser.checkingEmail')}
                  </p>
                )}
                {!isChecking && emailError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">{t('editUser.phoneNumber')}</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder={t('editUser.placeholders.phone')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">{t('editUser.countryCode')}</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                    placeholder={t('editUser.placeholders.country')}
                    maxLength={2}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="isActive" className="font-medium">{t('editUser.activeUser')}</Label>
                  <p className="text-sm text-muted-foreground">{t('editUser.activeUserDesc')}</p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  {t('editUser.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || isChecking || !!emailError}
                  className="gradient-primary text-primary-foreground"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('editUser.updating')}
                    </>
                  ) : (
                    t('editUser.updateUser')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="password" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Note:</strong> {t('editUser.password.warning')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('editUser.password.newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('editUser.password.newPasswordPlaceholder')}
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('editUser.password.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('editUser.password.confirmPlaceholder')}
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive">{t('editUser.password.mismatch')}</p>
                )}
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isResettingPassword}
                >
                  {t('editUser.cancel')}
                </Button>
                <Button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword || !newPassword || newPassword !== confirmPassword}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('editUser.password.resetting')}
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      {t('editUser.password.resetButton')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
