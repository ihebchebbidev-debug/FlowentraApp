import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useApplicants } from '../../hooks/useRecruitment';
import { useHrPermissionGuard } from '../../hooks/useHrPermissionGuard';
import { translateHrServerError } from '../../utils/hrServerError';
import type { HrApplicant, HrJobOpening } from '../../types/recruitment.types';

const SOURCES = ['linkedin', 'referral', 'website', 'other'];

/** Correct an applicant's details (PUT /api/hr/recruitment/applicants/{id}). */
export function EditApplicantDialog(props: {
  applicant: HrApplicant | null;
  openings: HrJobOpening[];
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const guardHr = useHrPermissionGuard();
  const { updateApplicant } = useApplicants();

  const [openingId, setOpeningId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('linkedin');
  const [resumeUrl, setResumeUrl] = useState('');
  const [expectedSalary, setExpectedSalary] = useState<number | ''>('');
  const [availableFrom, setAvailableFrom] = useState('');

  useEffect(() => {
    const a = props.applicant;
    if (!a) return;
    setOpeningId(String(a.openingId ?? ''));
    setFirstName(a.firstName ?? '');
    setLastName(a.lastName ?? '');
    setEmail(a.email ?? '');
    setPhone(a.phone ?? '');
    setSource(a.source ?? 'linkedin');
    setResumeUrl(a.resumeUrl ?? '');
    setExpectedSalary(a.expectedSalary ?? '');
    setAvailableFrom(a.availableFrom ? String(a.availableFrom).slice(0, 10) : '');
  }, [props.applicant]);

  const submit = async () => {
    if (!props.applicant) return;
    if (!guardHr('update')) return;
    if (!openingId || !firstName.trim() || !lastName.trim()) {
      toast({ title: t('recruitmentPage.applicants.toasts.requiredFields'), variant: 'destructive' });
      return;
    }
    try {
      await updateApplicant.mutateAsync({
        id: props.applicant.id,
        payload: {
          openingId: Number(openingId),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          source,
          resumeUrl: resumeUrl.trim() || undefined,
          expectedSalary: expectedSalary === '' ? undefined : Number(expectedSalary),
          availableFrom: availableFrom || undefined,
        },
      });
      toast({ title: t('recruitmentPage.applicants.toasts.updated') });
      props.onOpenChange(false);
    } catch (e) {
      toast({ title: translateHrServerError(t, e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={!!props.applicant} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('recruitmentPage.applicants.editDialogTitle')}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>{t('recruitmentPage.applicants.fields.opening')}</Label>
            <Select value={openingId} onValueChange={setOpeningId}>
              <SelectTrigger><SelectValue placeholder={t('recruitmentPage.applicants.fields.openingPlaceholder')} /></SelectTrigger>
              <SelectContent>
                {props.openings.map(o => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('recruitmentPage.applicants.fields.firstName')}</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
            <div><Label>{t('recruitmentPage.applicants.fields.lastName')}</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('recruitmentPage.applicants.fields.email')}</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label>{t('recruitmentPage.applicants.fields.phone')}</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('recruitmentPage.applicants.fields.source')}</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => <SelectItem key={s} value={s}>{t(`recruitmentPage.sources.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('recruitmentPage.applicants.fields.availableFrom')}</Label>
              <Input type="date" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('recruitmentPage.applicants.fields.expectedSalary')}</Label>
              <Input type="number" step="0.001" min={0} value={expectedSalary} onChange={e => setExpectedSalary(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <Label>{t('recruitmentPage.applicants.fields.resumeUrl')}</Label>
              <Input value={resumeUrl} onChange={e => setResumeUrl(e.target.value)} placeholder="https://…" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>{t('recruitmentPage.actions.cancel')}</Button>
          <Button onClick={submit} disabled={updateApplicant.isPending}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
