import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usersApi, User, UpdateUserRequest } from "@/services/api/usersApi";
import { skillsApi, type Skill, type UserSkill } from "@/services/api/skillsApi";
import { User as UserIcon, KeyRound, Eye, EyeOff, Loader2, AlertCircle, Wrench, Plus, X, GraduationCap } from "lucide-react";
import { ProfilePictureUpload } from "@/components/ui/profile-picture-upload";
import { useEmailValidation } from "../hooks/useEmailValidation";
import { useTranslation } from "react-i18next";

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserUpdated: () => void;
}

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
type ProficiencyLevel = typeof PROFICIENCY_LEVELS[number];

const proficiencyBadgeClass: Record<ProficiencyLevel, string> = {
  beginner:     'bg-slate-100 text-slate-700 border-slate-200',
  intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
  advanced:     'bg-purple-100 text-purple-700 border-purple-200',
  expert:       'bg-amber-100 text-amber-700 border-amber-200',
};

export function EditUserModal({ open, onOpenChange, user, onUserUpdated }: EditUserModalProps) {
  const { t } = useTranslation('users');
  const { toast } = useToast();

  // ── Details tab ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: "", firstName: "", lastName: "",
    phoneNumber: "", country: "", isActive: true, profilePictureUrl: "",
    emailVerified: false, twoFactorEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // ── Password tab ─────────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // ── Skills tab ───────────────────────────────────────────────────────────
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [newSkillId, setNewSkillId] = useState<string>('');
  const [newProficiency, setNewProficiency] = useState<ProficiencyLevel>('intermediate');
  const [newYearsExp, setNewYearsExp] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingSkillId, setRemovingSkillId] = useState<number | null>(null);

  const { isChecking, emailError, validateEmail, clearError } = useEmailValidation(user?.id);

  // Reset state when user/modal changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email, firstName: user.firstName, lastName: user.lastName,
        phoneNumber: user.phoneNumber || "", country: user.country,
        isActive: user.isActive, profilePictureUrl: user.profilePictureUrl || "",
        emailVerified: !!user.emailVerified,
        twoFactorEnabled: !!user.twoFactorEnabled,
      });
      setNewPassword(""); setConfirmPassword("");
      setActiveTab("details");
      clearError();
    }
  }, [user, clearError]);

  // Load skills catalog once on open
  useEffect(() => {
    if (!open) return;
    skillsApi.getAll().then(setAllSkills).catch(() => setAllSkills([]));
  }, [open]);

  const loadUserSkills = useCallback(async () => {
    if (!user) return;
    setIsLoadingSkills(true);
    try {
      const skills = await skillsApi.getUserSkills(user.id);
      setUserSkills(skills);
    } catch {
      setUserSkills([]);
    } finally {
      setIsLoadingSkills(false);
    }
  }, [user]);

  // Load user skills when switching to skills tab
  useEffect(() => {
    if (activeTab === 'skills') loadUserSkills();
  }, [activeTab, loadUserSkills]);

  // Email validation
  useEffect(() => {
    if (formData.email && formData.email.toLowerCase().trim() !== user?.email?.toLowerCase().trim()) {
      validateEmail(formData.email);
    } else {
      clearError();
    }
  }, [formData.email, user?.email, validateEmail, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || emailError) return;
    setIsLoading(true);
    try {
      await usersApi.update(user.id, formData);
      toast({ title: t('editUser.success.title'), description: t('editUser.success.message') });
      onUserUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message || t('common.failedToUpdate'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    if (!newPassword || newPassword.length < 8) {
      toast({ title: t('common.error'), description: t('editUser.password.minLength'), variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('common.error'), description: t('editUser.password.mismatch'), variant: "destructive" });
      return;
    }
    setIsResettingPassword(true);
    try {
      await usersApi.changePassword(user.id, { newPassword });
      toast({ title: t('common.success'), description: t('editUser.password.success') });
      setNewPassword(""); setConfirmPassword("");
      onUserUpdated();
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message || t('common.failedToResetPassword'), variant: "destructive" });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleAssignSkill = async () => {
    if (!user || !newSkillId) return;
    setIsAssigning(true);
    try {
      await skillsApi.assignToUser(Number(newSkillId), user.id, {
        proficiencyLevel: newProficiency,
        yearsOfExperience: newYearsExp ? Number(newYearsExp) : undefined,
      });

      // Optimistic update: push the new skill into state immediately so the
      // list updates without waiting for a server round-trip.  The server
      // re-fetch below reconciles IDs if the backend stored a different one.
      const addedSkill = allSkills.find(s => s.id === Number(newSkillId));
      if (addedSkill) {
        const optimistic: UserSkill = {
          id: Date.now(),                             // temporary local id
          skillId: addedSkill.id,
          userId: user.id,
          skillName: addedSkill.name,
          skillCategory: addedSkill.category ?? '',
          proficiencyLevel: newProficiency,
          yearsOfExperience: newYearsExp ? Number(newYearsExp) : undefined,
          assignedAt: new Date().toISOString(),
        };
        setUserSkills(prev => [...prev, optimistic]);
      }

      toast({ title: t('editUser.skills.toast.assigned'), description: t('editUser.skills.toast.assignedDesc') });
      setNewSkillId(''); setNewYearsExp(''); setNewProficiency('intermediate');

      // Background refresh to replace optimistic entry with the real server record
      loadUserSkills();
    } catch {
      toast({ title: t('editUser.skills.toast.assignFailed'), description: t('editUser.skills.toast.tryAgain'), variant: 'destructive' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    if (!user) return;
    setRemovingSkillId(skillId);
    try {
      await skillsApi.removeFromUser(skillId, user.id);
      toast({ title: t('editUser.skills.toast.removed') });
      setUserSkills(prev => prev.filter(s => s.skillId !== skillId));
    } catch {
      toast({ title: t('editUser.skills.toast.removeFailed'), variant: 'destructive' });
    } finally {
      setRemovingSkillId(null);
    }
  };

  // Skills not yet assigned to this user
  const assignedSkillIds = new Set(userSkills.map(s => s.skillId));
  const availableSkills = allSkills.filter(s => !assignedSkillIds.has(s.id) && s.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>{t('editUser.title')}</DialogTitle>
          <DialogDescription>
            {t('editUser.description', { firstName: user?.firstName, lastName: user?.lastName })}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              {t('editUser.tabs.details')}
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              {t('editUser.tabs.skills')}
              {userSkills.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">{userSkills.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              {t('editUser.tabs.password')}
            </TabsTrigger>
          </TabsList>

          {/* ── Details Tab ── */}
          <TabsContent value="details" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <ProfilePictureUpload
                currentUrl={formData.profilePictureUrl}
                onUploaded={async (url) => {
                  setFormData(prev => ({ ...prev, profilePictureUrl: url }));
                  if (user?.id) {
                    try {
                      const { profilePictureApi } = await import('@/services/api/profilePictureApi');
                      await profilePictureApi.updateUserProfilePicture(user.id, url);
                    } catch (e) {
                      console.error('[EditUserModal] Failed to save profile picture:', e);
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
                    id="firstName" value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder={t('editUser.placeholders.firstName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('editUser.lastName')}</Label>
                  <Input
                    id="lastName" value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder={t('editUser.placeholders.lastName')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('editUser.email')}</Label>
                <Input
                  id="email" type="email" value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('editUser.placeholders.email')}
                  className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {isChecking && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> {t('editUser.checkingEmail')}
                  </p>
                )}
                {!isChecking && emailError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {emailError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">{t('editUser.phoneNumber')}</Label>
                  <Input
                    id="phoneNumber" value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder={t('editUser.placeholders.phone')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t('editUser.countryCode')}</Label>
                  <Input
                    id="country" value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                    placeholder={t('editUser.placeholders.country')} maxLength={2}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="isActive" className="font-medium">{t('editUser.activeUser')}</Label>
                  <p className="text-sm text-muted-foreground">{t('editUser.activeUserDesc')}</p>
                </div>
                <Switch
                  id="isActive" checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="emailVerified" className="font-medium">{t('editUser.emailVerified', { defaultValue: 'Email verified' })}</Label>
                  <p className="text-sm text-muted-foreground">{t('editUser.emailVerifiedDesc', { defaultValue: 'Mark the user as email-verified (skips verification flow).' })}</p>
                </div>
                <Switch
                  id="emailVerified" checked={!!formData.emailVerified}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailVerified: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="twoFactorEnabled" className="font-medium">{t('editUser.twoFactorEnabled', { defaultValue: 'Two-factor authentication' })}</Label>
                  <p className="text-sm text-muted-foreground">{t('editUser.twoFactorEnabledDesc', { defaultValue: 'Require an emailed OTP code on every sign-in.' })}</p>
                </div>
                <Switch
                  id="twoFactorEnabled" checked={!!formData.twoFactorEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, twoFactorEnabled: checked }))}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  {t('editUser.cancel')}
                </Button>
                <Button type="submit" disabled={isLoading || isChecking || !!emailError} className="gradient-primary text-primary-foreground">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('editUser.updating')}</>
                  ) : t('editUser.updateUser')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* ── Skills Tab ── */}
          <TabsContent value="skills" className="mt-4 space-y-4">

            {/* Assigned skills list */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">{t('editUser.skills.assignedTitle')}</h4>

              {isLoadingSkills ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('editUser.skills.loading')}
                </div>
              ) : userSkills.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t('editUser.skills.emptyTitle')}</p>
                  <p className="text-xs mt-0.5">{t('editUser.skills.emptyHint')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userSkills.map((us) => {
                    const profLevel = (us.proficiencyLevel?.toLowerCase() ?? 'beginner') as ProficiencyLevel;
                    return (
                      <div
                        key={us.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 border border-border/60 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{us.skillName}</p>
                            {us.skillCategory && (
                              <p className="text-[11px] text-muted-foreground">{us.skillCategory}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${proficiencyBadgeClass[profLevel] ?? proficiencyBadgeClass.beginner}`}>
                            {t(`editUser.skills.proficiencyLabels.${profLevel}`, us.proficiencyLevel ?? 'beginner')}
                          </span>
                          {us.yearsOfExperience && (
                            <span className="text-[11px] text-muted-foreground">{us.yearsOfExperience} {t('editUser.skills.yearsExpSuffix')}</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={removingSkillId === us.skillId}
                            onClick={() => handleRemoveSkill(us.skillId)}
                          >
                            {removingSkillId === us.skillId
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <X className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add skill form */}
            <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/5">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('editUser.skills.addTitle')}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {/* Skill selector */}
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('editUser.skills.skillLabel')}</Label>
                  <Select value={newSkillId} onValueChange={setNewSkillId}>
                    <SelectTrigger className="h-9 bg-background">
                      <SelectValue placeholder={t('editUser.skills.selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-md z-50">
                      {availableSkills.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                          {allSkills.length === 0 ? t('editUser.skills.noCatalog') : t('editUser.skills.allAssigned')}
                        </div>
                      ) : (
                        availableSkills.map(skill => (
                          <SelectItem key={skill.id} value={String(skill.id)}>
                            <div className="flex items-center gap-2">
                              <span>{skill.name}</span>
                              {skill.category && (
                                <span className="text-[10px] text-muted-foreground">· {skill.category}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Proficiency */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('editUser.skills.proficiencyLabel')}</Label>
                  <Select value={newProficiency} onValueChange={(v) => setNewProficiency(v as ProficiencyLevel)}>
                    <SelectTrigger className="h-9 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-md z-50">
                      {PROFICIENCY_LEVELS.map(level => (
                        <SelectItem key={level} value={level}>
                          <span className={`capitalize px-1.5 py-0.5 rounded text-[11px] font-medium ${proficiencyBadgeClass[level]}`}>
                            {t(`editUser.skills.proficiencyLabels.${level}`, level)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Years of experience */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('editUser.skills.yearsExpLabel')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    placeholder={t('editUser.skills.yearsExpPlaceholder')}
                    value={newYearsExp}
                    onChange={(e) => setNewYearsExp(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleAssignSkill}
                disabled={!newSkillId || isAssigning}
              >
                {isAssigning ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t('editUser.skills.adding')}</>
                ) : (
                  <><Plus className="h-4 w-4" />{t('editUser.skills.addButton')}</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* ── Password Tab ── */}
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
                    id="newPassword" type={showPassword ? "text" : "password"}
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('editUser.password.newPasswordPlaceholder')} minLength={8}
                  />
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('editUser.password.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('editUser.password.confirmPlaceholder')} minLength={8}
                  />
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive">{t('editUser.password.mismatch')}</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isResettingPassword}>
                  {t('editUser.cancel')}
                </Button>
                <Button
                  type="button" onClick={handleResetPassword}
                  disabled={isResettingPassword || !newPassword || newPassword !== confirmPassword}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isResettingPassword ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('editUser.password.resetting')}</>
                  ) : (
                    <><KeyRound className="mr-2 h-4 w-4" />{t('editUser.password.resetButton')}</>
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
