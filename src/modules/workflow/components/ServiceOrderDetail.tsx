import { useParams, useNavigate } from "react-router-dom";
import { DetailPageSkeleton } from "@/components/ui/page-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { serviceOrdersApi, ServiceOrder } from "@/services/api/serviceOrdersApi";
import { useTranslation } from "react-i18next";
import { workflowExecutionsApi } from "@/services/api/workflowApi";
import { toast } from "sonner";
import { getStatusColorClass } from "@/config/entity-statuses";

const getStatusColor = (status: string): string => {
  return getStatusColorClass('service_order', status);
};

export function ServiceOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('service_orders');
  const [serviceOrder, setServiceOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringWorkflow, setTriggeringWorkflow] = useState(false);

  useEffect(() => {
    const fetchServiceOrder = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await serviceOrdersApi.getById(parseInt(id), true);
        setServiceOrder(data);
      } catch (error) {
        console.error('Failed to fetch service order:', error);
        toast.error('Failed to load service order');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceOrder();
  }, [id]);

  const handleTriggerWorkflow = async () => {
    if (!id) return;
    try {
      setTriggeringWorkflow(true);
      await workflowExecutionsApi.triggerManual(0, 'ServiceOrder', parseInt(id));
      toast.success('Workflow triggered successfully');
      const data = await serviceOrdersApi.getById(parseInt(id), true);
      setServiceOrder(data);
    } catch (error) {
      console.error('Failed to trigger workflow:', error);
      toast.error('Failed to trigger workflow');
    } finally {
      setTriggeringWorkflow(false);
    }
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!serviceOrder) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-sm text-muted-foreground">Service order not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Retour aux services
            </Button>
            <span className="text-sm font-medium text-foreground">
              {serviceOrder.orderNumber || `Service Order ${id}`}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleTriggerWorkflow}
              disabled={triggeringWorkflow}
            >
              {triggeringWorkflow ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Re-trigger Workflow
            </Button>
            <Button variant="outline" size="sm">
              Planifier
            </Button>
            <Button size="sm" onClick={() => window.location.href = `/dashboard/field/service-orders/${id}/jobs/create`}>
              Ajouter job
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Badge className={getStatusColor(serviceOrder.status)}>
            {t(`statuses.${serviceOrder.status}`, { defaultValue: serviceOrder.status })}
          </Badge>
          <span className="text-sm text-muted-foreground">Gestion des interventions</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Affected Company</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-sm text-foreground">{serviceOrder.contactName || 'Unknown Contact'}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Priority:</span>
            <Badge variant="outline">{serviceOrder.priority}</Badge>
          </div>
          {serviceOrder.serviceType && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type:</span>
              <span className="text-foreground">{serviceOrder.serviceType}</span>
            </div>
          )}
          {serviceOrder.saleNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sale:</span>
              <span className="text-foreground">{serviceOrder.saleNumber}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Progression du service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="text-foreground">{serviceOrder.completedDispatchCount || 0} / {serviceOrder.serviceCount || 0} dispatches</span>
            </div>
            <Progress 
              value={serviceOrder.serviceCount ? ((serviceOrder.completedDispatchCount || 0) / serviceOrder.serviceCount) * 100 : 0} 
              className="h-2" 
            />
          </div>
          
          {serviceOrder.notes && (
            <p className="text-sm text-muted-foreground">
              {serviceOrder.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {serviceOrder.jobs && serviceOrder.jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Jobs ({serviceOrder.jobs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {serviceOrder.jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <span className="text-sm text-foreground">{job.title}</span>
                    {job.jobDescription && (
                      <p className="text-sm text-muted-foreground mt-0.5">{job.jobDescription}</p>
                    )}
                  </div>
                  <Badge variant="outline">{job.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
