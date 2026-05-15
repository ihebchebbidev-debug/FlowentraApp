/**
 * Form Settings section — extracted from PropertiesPanel.
 */
import React from 'react';
import { BuilderComponent } from '../../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Webhook, Inbox } from 'lucide-react';
import { EditorSection } from './PropertyEditors';

interface FormSettingsEditorProps {
  component: BuilderComponent;
  onPropChange: (key: string, value: any) => void;
}

export function FormSettingsEditor({ component, onPropChange }: FormSettingsEditorProps) {
  const formSettings = component.props.formSettings || {};

  const updateSettings = (updates: Record<string, any>) => {
    onPropChange('formSettings', { ...formSettings, ...updates });
  };

  return (
    <EditorSection title="⚡ Form Settings" defaultOpen={false}>
      <div className="space-y-3">
        {/* Collect submissions */}
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-medium text-foreground/70 flex items-center gap-1">
            <Inbox className="h-3 w-3" /> Collect Submissions
          </Label>
          <Switch
            checked={formSettings.collectSubmissions !== false}
            onCheckedChange={(v) => updateSettings({ collectSubmissions: v })}
          />
        </div>

        {/* Webhook URL */}
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-foreground/70 flex items-center gap-1">
            <Webhook className="h-3 w-3" /> Webhook URL
          </Label>
          <Input
            value={formSettings.webhookUrl || ''}
            onChange={(e) => updateSettings({ webhookUrl: e.target.value })}
            placeholder="https://api.example.com/webhook"
            className="h-7 text-xs"
          />
        </div>

        {/* Webhook Method */}
        {formSettings.webhookUrl && (
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground/70">Method</Label>
            <div className="flex gap-1">
              {['POST', 'GET'].map(m => (
                <button
                  key={m}
                  onClick={() => updateSettings({ webhookMethod: m })}
                  className={`text-[10px] px-3 py-1 rounded-md border transition-colors ${
                    (formSettings.webhookMethod || 'POST') === m
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >{m}</button>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-foreground/70">Success Message</Label>
          <Input
            value={formSettings.successMessage || 'Thank you! Your submission has been received.'}
            onChange={(e) => updateSettings({ successMessage: e.target.value })}
            className="h-7 text-xs"
          />
        </div>

        {/* Success Action */}
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-foreground/70">After Submit</Label>
          <div className="flex gap-1">
            {[
              { label: 'Message', value: 'message' },
              { label: 'Reset', value: 'reset' },
              { label: 'Redirect', value: 'redirect' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => updateSettings({ successAction: opt.value })}
                className={`text-[10px] px-2.5 py-1 rounded-md border transition-colors flex-1 ${
                  (formSettings.successAction || 'message') === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Redirect URL */}
        {formSettings.successAction === 'redirect' && (
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground/70">Redirect URL</Label>
            <Input
              value={formSettings.redirectUrl || ''}
              onChange={(e) => updateSettings({ redirectUrl: e.target.value })}
              placeholder="https://example.com/thank-you"
              className="h-7 text-xs"
            />
          </div>
        )}

        {/* Email To */}
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-foreground/70">Notify Email (optional)</Label>
          <Input
            value={formSettings.emailTo || ''}
            onChange={(e) => updateSettings({ emailTo: e.target.value })}
            placeholder="you@example.com"
            className="h-7 text-xs"
          />
          <p className="text-[9px] text-muted-foreground/50">Requires backend integration</p>
        </div>
      </div>
    </EditorSection>
  );
}
