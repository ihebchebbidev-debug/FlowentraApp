import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Building2, List, Loader2, CheckCircle2 } from 'lucide-react';
import { appSettingsApi } from '@/services/api/appSettingsApi';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const SETTING_KEY = 'JobConversionMode';

export function JobConversionModeSettings() {
  const { toast } = useToast();
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();

  const { data: currentMode, isLoading } = useQuery({
    queryKey: ['appSetting', SETTING_KEY],
    queryFn: async () => {
      const value = await appSettingsApi.getSetting(SETTING_KEY);
      return value || 'installation';
    },
    staleTime: 30000,
  });

  const mutation = useMutation({
    mutationFn: (value: string) => appSettingsApi.setSetting(SETTING_KEY, value),
    onSuccess: (_, value) => {
      queryClient.setQueryData(['appSetting', SETTING_KEY], value);
      toast({
        title: t('system.jobConversionMode.saved', 'Job conversion mode saved'),
        description: value === 'installation'
          ? t('system.jobConversionMode.installation', 'Installation-based')
          : t('system.jobConversionMode.service', 'Service-based'),
      });
    },
    onError: () => {
      toast({
        title: t('system.jobConversionMode.error', 'Failed to save job conversion mode'),
        variant: 'destructive',
      });
    },
  });

  const selectedMode = currentMode || 'installation';

  const handleSelect = (mode: string) => {
    if (mode !== selectedMode) {
      mutation.mutate(mode);
    }
  };

  const modes = [
    {
      value: 'installation',
      icon: Building2,
      titleKey: 'system.jobConversionMode.installation',
      titleFallback: 'Installation-based',
      descKey: 'system.jobConversionMode.installationDesc',
      descFallback: 'Group all services under one job per installation. When dispatched, each installation becomes one dispatch with all its services.',
    },
    {
      value: 'service',
      icon: List,
      titleKey: 'system.jobConversionMode.service',
      titleFallback: 'Service-based',
      descKey: 'system.jobConversionMode.serviceDesc',
      descFallback: 'Each service item becomes its own individual job. When dispatched, each service is dispatched separately.',
    },
  ];

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          {t('system.jobConversionMode.title', 'Service Order Job Mode')}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('system.jobConversionMode.desc', 'Choose how service items are converted into jobs when creating a Service Order from a Sale')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modes.map((mode) => {
              const isSelected = selectedMode === mode.value;
              const Icon = mode.icon;
              return (
                <button
                  key={mode.value}
                  onClick={() => handleSelect(mode.value)}
                  disabled={mutation.isPending}
                  className={cn(
                    'relative rounded-lg border p-4 text-left transition-all group',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border/50 bg-muted/30 hover:border-primary/50 hover:bg-primary/5'
                  )}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-2 rounded-lg shrink-0',
                      isSelected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm text-foreground">
                          {t(mode.titleKey, mode.titleFallback)}
                        </h3>
                        {mode.value === 'installation' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {t(mode.descKey, mode.descFallback)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {mutation.isPending && (
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
