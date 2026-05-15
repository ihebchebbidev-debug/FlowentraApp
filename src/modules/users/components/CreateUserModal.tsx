import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usersApi, CreateUserRequest } from "@/services/usersApi";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEmailValidation } from "../hooks/useEmailValidation";
import { useTranslation } from "react-i18next";
import { ProfilePictureUpload } from "@/components/ui/profile-picture-upload";

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export function CreateUserModal({ open, onOpenChange, onUserCreated }: CreateUserModalProps) {
  const { t } = useTranslation('users');
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    country: "TN",
    role: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const { toast } = useToast();
  
  // Use debounced email validation hook
  const { isChecking, emailError, validateEmail } = useEmailValidation();

  // Reset form and validation when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        country: "TN",
        role: ""
      });
      setProfilePictureUrl('');
    }
  }, [open]);

  // Validate email on change
  useEffect(() => {
    validateEmail(formData.email);
  }, [formData.email, validateEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.country) {
      toast({
        title: t('common.error'),
        description: t('createUser.errors.fillRequired'),
        variant: "destructive"
      });
      return;
    }

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
      const created = await usersApi.create(formData);

      // If a profile picture was uploaded, update via dedicated endpoint
      if (profilePictureUrl && created?.id) {
        try {
          const { profilePictureApi } = await import('@/services/api/profilePictureApi');
          await profilePictureApi.updateUserProfilePicture(created.id, profilePictureUrl);
          console.log('[CreateUserModal] Profile picture saved for user', created.id);
        } catch (ppError) {
          console.error('[CreateUserModal] Failed to save profile picture:', ppError);
          // Don't fail the whole creation, user was created successfully
        }
      }
      
      toast({
        title: t('createUser.success.title'),
        description: t('createUser.success.message')
      });
      
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        country: "TN",
        role: ""
      });
      setProfilePictureUrl('');
      onUserCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('common.failedToCreate'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('createUser.title')}</DialogTitle>
          <DialogDescription>
            {t('createUser.description')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <ProfilePictureUpload
              currentUrl={profilePictureUrl}
              onUploaded={setProfilePictureUrl}
              onRemoved={() => setProfilePictureUrl('')}
              size="md"
              label=""
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('createUser.firstName')} {t('createUser.required')}</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder={t('createUser.placeholders.firstName')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('createUser.lastName')} {t('createUser.required')}</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder={t('createUser.placeholders.lastName')}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">{t('createUser.email')} {t('createUser.required')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder={t('createUser.placeholders.email')}
              required
              className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {isChecking && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('createUser.checkingEmail')}
              </p>
            )}
            {!isChecking && emailError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {emailError}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">{t('createUser.password')} {t('createUser.required')}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={t('createUser.placeholders.password')}
              required
              minLength={8}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t('createUser.phoneNumber')}</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder={t('createUser.placeholders.phone')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">{t('createUser.countryCode')} {t('createUser.required')}</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                placeholder={t('createUser.placeholders.country')}
                required
                maxLength={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('createUser.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isChecking || !!emailError}
              className="gradient-primary text-primary-foreground"
            >
              {isLoading ? t('createUser.creating') : t('createUser.createUser')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
