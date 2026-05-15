import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff, Server, Mail, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { type CustomEmailConfig, type SmtpSecurity, type ImapSecurity, EMAIL_PROVIDER_PRESETS } from '../types';

interface CustomEmailConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (config: CustomEmailConfig) => Promise<void>;
}

const presetOptions = [
  { value: 'ovh', label: 'OVH' },
  { value: 'ionos', label: 'IONOS / 1&1' },
  { value: 'godaddy-workspace', label: 'GoDaddy' },
  { value: 'zoho', label: 'Zoho Mail' },
  { value: 'yahoo', label: 'Yahoo Mail' },
  { value: 'cpanel', label: 'cPanel / Webhost' },
  { value: 'custom', label: 'Custom / Other' },
];

export function CustomEmailConfigDialog({ open, onOpenChange, onConnect }: CustomEmailConfigDialogProps) {
  const { t } = useTranslation('email-calendar');
  const [connecting, setConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('ovh');
  const [error, setError] = useState<string | null>(null);

  const defaultPreset = EMAIL_PROVIDER_PRESETS['ovh'];
  const [config, setConfig] = useState<CustomEmailConfig>({
    email: '',
    password: '',
    displayName: '',
    imapServer: defaultPreset.imapServer || '',
    imapPort: defaultPreset.imapPort || 993,
    imapSecurity: defaultPreset.imapSecurity || 'ssl',
    incomingProtocol: 'imap',
    pop3Port: 995,
    pop3Security: 'ssl',
    smtpServer: defaultPreset.smtpServer || '',
    smtpPort: defaultPreset.smtpPort || 465,
    smtpSecurity: defaultPreset.smtpSecurity || 'ssl',
  });

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const presetConfig = EMAIL_PROVIDER_PRESETS[preset];
    if (presetConfig) {
      setConfig(prev => ({
        ...prev,
        imapServer: presetConfig.imapServer || prev.imapServer,
        imapPort: presetConfig.imapPort || prev.imapPort,
        imapSecurity: presetConfig.imapSecurity || prev.imapSecurity,
        smtpServer: presetConfig.smtpServer || prev.smtpServer,
        smtpPort: presetConfig.smtpPort || prev.smtpPort,
        smtpSecurity: presetConfig.smtpSecurity || prev.smtpSecurity,
      }));
    }
    if (preset === 'custom') setShowAdvanced(true);
  };

  const handleConnect = async () => {
    setError(null);
    if (!config.email || !config.password) {
      setError(t('customEmail.validation.required'));
      return;
    }
    if (!config.imapServer || !config.smtpServer) {
      setError(t('customEmail.validation.serversRequired'));
      return;
    }
    setConnecting(true);
    try {
      await onConnect(config);
      onOpenChange(false);
      // Reset form
      setConfig({
        email: '',
        password: '',
        displayName: '',
        imapServer: defaultPreset.imapServer || '',
        imapPort: defaultPreset.imapPort || 993,
        imapSecurity: 'ssl',
        smtpServer: defaultPreset.smtpServer || '',
        smtpPort: defaultPreset.smtpPort || 465,
        smtpSecurity: 'ssl',
      });
      setSelectedPreset('ovh');
    } catch (err: any) {
      setError(err?.message || t('customEmail.validation.connectionFailed'));
    } finally {
      setConnecting(false);
    }
  };

  const updateField = <K extends keyof CustomEmailConfig>(key: K, value: CustomEmailConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            {t('customEmail.title')}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t('customEmail.description')}
          </DialogDescription>
          <p className="text-xs text-muted-foreground mt-2">POP3 is not supported by this connector; please use IMAP (port 993 with SSL) for incoming mail.</p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Incoming protocol selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('customEmail.incomingProtocol', 'Incoming Protocol')}</Label>
            <Select value={config.incomingProtocol || 'imap'} onValueChange={(v) => updateField('incomingProtocol', v as any)}>
              <SelectTrigger className="h-9 bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imap">IMAP</SelectItem>
                <SelectItem value="pop3">POP3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Provider Preset */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('customEmail.preset')}</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="h-9 bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presetOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email & Password */}
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('customEmail.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="example@yourdomain.com"
                  value={config.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="h-9 pl-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('customEmail.password')}</Label>
              <div className="relative">
                <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={config.password}
                  onChange={e => updateField('password', e.target.value)}
                  className="h-9 pl-8 pr-9 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('customEmail.displayName')}</Label>
              <Input
                placeholder="John Doe"
                value={config.displayName || ''}
                onChange={e => updateField('displayName', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Server settings (collapsible for presets, always open for custom) */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/30 transition-colors"
            >
              <span>{t('customEmail.serverSettings')}</span>
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showAdvanced && (
              <div className="px-3 pb-3 space-y-4 border-t border-border pt-3">
                {/* IMAP */}
                <div>
                  <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {t('customEmail.imap.title')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">{t('customEmail.imap.server')}</Label>
                          <Input
                            placeholder={config.incomingProtocol === 'pop3' ? 'pop.yourhost.com' : 'imap.mail.ovh.net'}
                            value={config.imapServer}
                            onChange={e => updateField('imapServer', e.target.value)}
                            className="h-8 text-xs"
                          />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">{t('customEmail.imap.port')}</Label>
                      <Input
                            type="number"
                            value={config.incomingProtocol === 'pop3' ? (config.pop3Port || 995) : config.imapPort}
                            onChange={e => updateField(config.incomingProtocol === 'pop3' ? 'pop3Port' : 'imapPort', parseInt(e.target.value) || (config.incomingProtocol === 'pop3' ? 995 : 993))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">{t('customEmail.imap.security')}</Label>
                      <Select value={config.imapSecurity} onValueChange={v => updateField('imapSecurity', v as ImapSecurity)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="tls">TLS / STARTTLS</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* SMTP */}
                <div>
                  <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {t('customEmail.smtp.title')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">{t('customEmail.smtp.server')}</Label>
                      <Input
                        placeholder="smtp.mail.ovh.net"
                        value={config.smtpServer}
                        onChange={e => updateField('smtpServer', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">{t('customEmail.smtp.port')}</Label>
                      <Input
                        type="number"
                        value={config.smtpPort}
                        onChange={e => updateField('smtpPort', parseInt(e.target.value) || 465)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">{t('customEmail.smtp.security')}</Label>
                      <Select value={config.smtpSecurity} onValueChange={v => updateField('smtpSecurity', v as SmtpSecurity)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="tls">TLS / STARTTLS</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-sm">
              {t('accounts.cancel')}
            </Button>
            <Button
              onClick={handleConnect}
              disabled={connecting || !config.email || !config.password}
              className="h-9 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {connecting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />{t('customEmail.connecting')}</>
              ) : (
                t('customEmail.connect')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}