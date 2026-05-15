import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, Database, Mail, Building2, Save, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function ApplicationSettings() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    companyName: user?.companyName || "",
    companyWebsite: user?.companyWebsite || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phoneNumber: user?.phoneNumber || "",
    country: user?.country || "",
    industry: user?.industry || ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    if (!password) {
      toast({
        title: t('application.passwordRequiredTitle'),
        description: t('application.passwordRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const success = await updateUser({
        companyName: formData.companyName,
        companyWebsite: formData.companyWebsite,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        country: formData.country,
        industry: formData.industry
      });

      if (success) {
        toast({
          title: t('application.profileUpdatedTitle'),
          description: t('application.profileUpdatedDesc'),
        });
        setIsConfirmOpen(false);
        setPassword("");
      } else {
        toast({
          title: t('application.updateFailedTitle'),
          description: t('application.updateFailedDesc'),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('application.errorTitle'),
        description: t('application.errorDesc'),
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Company Information */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            {t('application.companyInfoTitle')}
          </CardTitle>
          <CardDescription>{t('application.companyInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium">{t('application.companyName')}</Label>
              <Input 
                id="companyName" 
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                placeholder={t('application.companyNamePlaceholder')} 
                className="h-9 sm:h-10" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyWebsite" className="text-sm font-medium">{t('application.companyWebsite')}</Label>
              <Input 
                id="companyWebsite" 
                value={formData.companyWebsite}
                onChange={(e) => handleInputChange("companyWebsite", e.target.value)}
                placeholder={t('application.companyWebsitePlaceholder')} 
                className="h-9 sm:h-10" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">{t('application.firstName')}</Label>
              <Input 
                id="firstName" 
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="h-9 sm:h-10" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">{t('application.lastName')}</Label>
              <Input 
                id="lastName" 
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="h-9 sm:h-10" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">{t('application.phoneNumber')}</Label>
              <Input 
                id="phoneNumber" 
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                placeholder={t('application.phoneNumber')}
                className="h-9 sm:h-10" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">{t('application.country')}</Label>
              <Input 
                id="country" 
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                className="h-9 sm:h-10" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="text-sm font-medium">{t('application.industry')}</Label>
            <Input 
              id="industry" 
              value={formData.industry}
              onChange={(e) => handleInputChange("industry", e.target.value)}
              placeholder={t('application.industryPlaceholder')} 
              className="h-9 sm:h-10" 
            />
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} className="w-full sm:w-auto shadow-medium hover-lift">
              <Save className="h-4 w-4 mr-2" />
              {t('application.saveChanges')}
            </Button>
          </div>
        </CardContent>
      </Card>



      {/* Database Settings */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Database className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
            </div>
              {t('application.dangerZoneTitle')}
          </CardTitle>
          <CardDescription>{t('application.dangerZoneDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="pt-4">
            <Button variant="destructive" className="w-full shadow-medium hover-lift">
              {t('application.resetAllData')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
                {t('application.confirmChangesTitle')}
            </DialogTitle>
            <DialogDescription>
                {t('application.confirmChangesDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">{t('application.confirm.password', { defaultValue: t('account.currentPassword') })}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('application.passwordRequiredDesc')}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmOpen(false);
                setPassword("");
              }}
              disabled={isUpdating}
            >
              {t('application.confirm.cancel')}
            </Button>
            <Button 
              onClick={handleConfirmUpdate}
              disabled={isUpdating || !password}
              className="shadow-medium"
            >
              {isUpdating ? t('application.confirm.updating') : t('application.confirm.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
