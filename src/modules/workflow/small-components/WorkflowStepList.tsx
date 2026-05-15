import { Badge } from "@/components/ui/badge";
import { Check, Clock, Circle, User } from "lucide-react";
import { WorkflowStep } from "../types";
import { useTranslation } from 'react-i18next';

interface WorkflowStepListProps {
  steps: WorkflowStep[];
  className?: string;
}

export function WorkflowStepList({ steps, className }: WorkflowStepListProps) {
  const { t } = useTranslation();
  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-gray-400" />;
      case 'skipped':
        return <Circle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-4">
          {/* Step Icon and Line */}
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step.status === 'completed' 
                ? 'bg-green-100 border-green-300' 
                : step.status === 'in_progress'
                ? 'bg-blue-100 border-blue-300'
                : 'bg-gray-100 border-gray-300'
            }`}>
              {getStatusIcon(step.status)}
            </div>
            
            {/* Connecting line to next step */}
            {index < steps.length - 1 && (
              <div className={`w-0.5 h-8 mt-2 ${
                step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
              }`} />
            )}
          </div>

          {/* Step Content */}
          <div className="flex-1 min-w-0 pb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{step.title}</h4>
              <Badge variant="outline" className={`text-xs ${getStatusColor(step.status)}`}>
                {step.status === 'completed' && t('nodeUi.finished')}
                {step.status === 'in_progress' && 'En cours'}
                {step.status === 'pending' && 'En attente'}
                {step.status === 'skipped' && 'Ignoré'}
              </Badge>
            </div>

            {step.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {step.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {step.timestamp && (
                <span>{formatTimestamp(step.timestamp)}</span>
              )}
              {step.actor && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{step.actor}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}