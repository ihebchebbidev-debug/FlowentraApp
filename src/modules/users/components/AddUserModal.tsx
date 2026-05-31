import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usersApi, CreateUserRequest } from "@/services/usersApi";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

const countries = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "UK", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "IN", name: "India" },
];

const roles = [
  { value: "customer", labelKey: "Customer" },
  { value: "technician", labelKey: "Technician" },
  { value: "admin", labelKey: "Admin" },
  { value: "superadmin", labelKey: "Super Admin" },
];

export function AddUserModal({ open, onOpenChange, onUserAdded }: AddUserModalProps) {
  const { t } = useTranslation('users');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    country: "",
    role: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserRequest, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateUserRequest, string>> = {};

    if (!formData.email) {
      newErrors.email = t('createUser.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('createUser.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('createUser.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('createUser.errors.passwordTooShort');
    }

    if (!formData.firstName) {
      newErrors.firstName = t('createUser.errors.firstNameRequired');
    }

    if (!formData.lastName) {
      newErrors.lastName = t('createUser.errors.lastNameRequired');
    }

    if (!formData.country) {
      newErrors.country = t('createUser.errors.countryRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await usersApi.create(formData);
      toast({
        title: t('createUser.success.title'),
        description: t('createUser.success.message'),
      });
      setFormData({ email: "", password: "", firstName: "", lastName: "", phoneNumber: "", country: "", role: "" });
      setErrors({});
      onUserAdded();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.failedToCreate'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{t('createUser.title')}</DialogTitle>
          <DialogDescription>{t('createUser.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('createUser.firstName')} {t('createUser.required')}</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder={t('createUser.placeholders.firstName')}
              />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">{t('createUser.lastName')} {t('createUser.required')}</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder={t('createUser.placeholders.lastName')}
              />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('createUser.email')} {t('createUser.required')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder={t('createUser.placeholders.email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('createUser.password')} {t('createUser.required')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={t('createUser.placeholders.password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">{t('createUser.phoneNumber')}</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              placeholder={t('createUser.placeholders.phone')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">{t('createUser.countryCode')} {t('createUser.required')}</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('createUser.selectCountry')} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t('createUser.role')}</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('createUser.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.labelKey}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {t('createUser.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="gradient-primary">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t('createUser.creating') : t('createUser.createUser')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
