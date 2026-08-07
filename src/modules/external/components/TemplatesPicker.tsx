import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { ENDPOINT_TEMPLATES, type EndpointTemplate } from '../utils/endpointTemplates';
import { toast } from 'sonner';

interface Props {
  /** Called with the chosen template's preset values. */
  onApply: (preset: EndpointTemplate['preset']) => void;
}

/**
 * One-click template picker. Renders a row of cards; clicking one fills
 * the parent form with that template's preset (name, methods, origins,
 * ExpectedSchema, ResponseTemplate, description).
 */
export function TemplatesPicker({ onApply }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Quick start templates
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Click a template to pre-fill the form. You can edit anything after.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ENDPOINT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                onApply(tpl.preset);
                toast.success(`Template applied: ${tpl.label}`, {
                  description: 'Review the fields below and adjust as needed.',
                });
              }}
              className="group text-left rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-colors p-3 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="flex items-start gap-2">
                <span className="text-xl leading-none">{tpl.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-foreground group-hover:text-accent-foreground">
                    {tpl.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {tpl.summary}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
