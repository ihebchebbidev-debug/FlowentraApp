import { useState, useEffect } from 'react';
import '../../styles/workflow.css';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GitBranch, Menu, RotateCcw, Split, Shield } from "lucide-react";

interface ConditionalConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData?: any;
  onSave: (config: any) => void;
}

export function ConditionalConfigModal({ isOpen, onClose, nodeData, onSave }: ConditionalConfigModalProps) {
  const [config, setConfig] = useState<any>({});
  const { t } = useTranslation();

  useEffect(() => {
    if (nodeData) {
      setConfig(nodeData.config || getDefaultConfig(nodeData.type));
    }
  }, [nodeData]);

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'if-else':
        return {
          condition: {
            field: '',
            operator: 'equals',
            value: ''
          }
        };
      case 'switch':
        return {
          field: '',
          cases: [
            { value: '', label: t('case') + ' 1' }
          ]
        };
      case 'loop':
        return {
          loopType: 'for',
          iterations: 1,
          condition: ''
        };
      case 'parallel':
        return {
          branches: 2,
          waitForAll: true
        };
      case 'try-catch':
        return {
          retryCount: 3,
          retryDelay: 1,
          logErrors: true
        };
      default:
        return {};
    }
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const updateConfig = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...config };
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  const renderIfElseConfig = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            {t('conditionConfiguration')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="field">{t('fieldToTest')}</Label>
            <Input
              id="field"
              placeholder="ex: email, age, status..."
              value={config.condition?.field || ''}
              onChange={(e) => updateConfig('condition.field', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="operator">{t('operator')}</Label>
            <Select
              value={config.condition?.operator || 'equals'}
              onValueChange={(value) => updateConfig('condition.operator', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">{t('operator.equals')}</SelectItem>
                <SelectItem value="not_equals">{t('operator.not_equals')}</SelectItem>
                <SelectItem value="contains">{t('operator.contains')}</SelectItem>
                <SelectItem value="not_contains">{t('operator.not_contains')}</SelectItem>
                <SelectItem value="greater_than">{t('operator.greater_than')}</SelectItem>
                <SelectItem value="less_than">{t('operator.less_than')}</SelectItem>
                <SelectItem value="is_empty">{t('operator.is_empty')}</SelectItem>
                <SelectItem value="is_not_empty">{t('operator.is_not_empty')}</SelectItem>
                <SelectItem value="all_match">{t('operator.all_match', 'All items match')}</SelectItem>
                <SelectItem value="any_match">{t('operator.any_match', 'Any item matches')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(config.condition?.operator === 'all_match' || config.condition?.operator === 'any_match') && (
            <div>
              <Label htmlFor="checkField">{t('checkField', 'Field to check')}</Label>
              <Input
                id="checkField"
                placeholder="ex: status"
                value={config.condition?.checkField || 'status'}
                onChange={(e) => updateConfig('condition.checkField', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('checkFieldDescription', 'The field in each item to compare against the value')}
              </p>
            </div>
          )}
          
          <div>
            <Label htmlFor="value">{t('comparisonValue')}</Label>
            <Input
              id="value"
              placeholder="Valeur à comparer..."
              value={config.condition?.value || ''}
              onChange={(e) => updateConfig('condition.value', e.target.value)}
            />
          </div>
          
            <div className="bg-muted/50 p-3 rounded text-sm">
            <strong>{t('preview')}:</strong> {t('previewCondition', { field: config.condition?.field || t('field'), operator: config.condition?.operator || 'equals', value: config.condition?.value || t('value') })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSwitchConfig = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
            <Menu className="h-4 w-4" />
            {t('switchConfiguration')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="switchField">{t('baseField') || 'Base field'}</Label>
            <Input
              id="switchField"
              placeholder="ex: status, category, type..."
              value={config.field || ''}
              onChange={(e) => updateConfig('field', e.target.value)}
            />
          </div>
          
          <div>
            <Label>{t('cases') || 'Cases'}</Label>
            <div className="space-y-2 mt-2">
              {(config.cases || []).map((caseItem: any, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder={t('value')}
                    value={caseItem.value || ''}
                    onChange={(e) => {
                      const newCases = [...(config.cases || [])];
                      newCases[index] = { ...newCases[index], value: e.target.value };
                      updateConfig('cases', newCases);
                    }}
                  />
                  <Input
                    placeholder={t('label') || 'Label'}
                    value={caseItem.label || ''}
                    onChange={(e) => {
                      const newCases = [...(config.cases || [])];
                      newCases[index] = { ...newCases[index], label: e.target.value };
                      updateConfig('cases', newCases);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newCases = (config.cases || []).filter((_: any, i: number) => i !== index);
                      updateConfig('cases', newCases);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
                <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newCases = [...(config.cases || []), { value: '', label: `${t('case')} ${(config.cases?.length || 0) + 1}` }];
                  updateConfig('cases', newCases);
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('addCase')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLoopConfig = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Configuration de la boucle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="loopType">{t('loopType') || 'Loop type'}</Label>
            <Select
              value={config.loopType || 'for'}
              onValueChange={(value) => updateConfig('loopType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="for">{t('loop.for') || 'FOR loop (fixed count)'}</SelectItem>
                <SelectItem value="while">{t('loop.while') || 'WHILE loop (condition)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {config.loopType === 'for' ? (
            <div>
              <Label htmlFor="iterations">{t('iterations') || 'Iterations'}</Label>
              <Input
                id="iterations"
                type="number"
                min="1"
                value={config.iterations || 1}
                onChange={(e) => updateConfig('iterations', parseInt(e.target.value) || 1)}
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="condition">{t('continuationCondition') || 'Continuation condition'}</Label>
              <Input
                id="condition"
                placeholder="ex: counter < 10, status != 'complete'..."
                value={config.condition || ''}
                onChange={(e) => updateConfig('condition', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderParallelConfig = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Split className="h-4 w-4" />
            Configuration de l'exécution parallèle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="branches">{t('branches') || 'Branches count'}</Label>
            <Input
              id="branches"
              type="number"
              min="2"
              max="10"
              value={config.branches || 2}
              onChange={(e) => updateConfig('branches', parseInt(e.target.value) || 2)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="waitForAll"
              checked={config.waitForAll !== false}
              onCheckedChange={(checked) => updateConfig('waitForAll', checked)}
            />
            <Label htmlFor="waitForAll">{t('waitForAll') || 'Wait for all branches to finish'}</Label>
          </div>
          
          {!config.waitForAll && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
              ⚡ {t('firstCompletedModeDescription')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTryCatchConfig = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Configuration de la gestion d'erreur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="retryCount">{t('retryCount') || 'Retry count'}</Label>
            <Input
              id="retryCount"
              type="number"
              min="0"
              max="10"
              value={config.retryCount || 3}
              onChange={(e) => updateConfig('retryCount', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label htmlFor="retryDelay">{t('retryDelay') || 'Retry delay (seconds)'}</Label>
            <Input
              id="retryDelay"
              type="number"
              min="0"
              step="0.5"
              value={config.retryDelay || 1}
              onChange={(e) => updateConfig('retryDelay', parseFloat(e.target.value) || 1)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="logErrors"
              checked={config.logErrors !== false}
              onCheckedChange={(checked) => updateConfig('logErrors', checked)}
            />
            <Label htmlFor="logErrors">{t('logErrors') || 'Log errors'}</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderConfigContent = () => {
    if (!nodeData) return null;

    switch (nodeData.type) {
      case 'if-else':
        return renderIfElseConfig();
      case 'switch':
        return renderSwitchConfig();
      case 'loop':
        return renderLoopConfig();
      case 'parallel':
        return renderParallelConfig();
      case 'try-catch':
        return renderTryCatchConfig();
    default:
      return <div>{t('configurationUnavailable') || 'Configuration not available for this node type.'}</div>;
    }
  };

  if (!nodeData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="workflow-module max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('configure')}: {nodeData.label}
          </DialogTitle>
          <DialogDescription>
            {t('configureDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderConfigContent()}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}