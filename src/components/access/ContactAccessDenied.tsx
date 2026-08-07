import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldOff, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Blocking screen shown when the current user tries to open a record that
 * belongs to a contact restricted to user groups they are not a member of.
 */
export function ContactAccessDenied({ entityLabel }: { entityLabel?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation('visibility');

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md border-destructive/30">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <ShieldOff className="h-8 w-8 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold">{t('denied.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {entityLabel
              ? t('denied.descriptionEntity', { entity: entityLabel })
              : t('denied.description')}
          </p>
          <p className="text-xs text-muted-foreground">{t('denied.hint')}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('denied.back')}
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('denied.dashboard')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ContactAccessDenied;
