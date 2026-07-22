import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLookups } from '@/shared/contexts/LookupsContext';
import { PlannedEntriesEditor } from '@/shared/components/planning/PlannedEntriesEditor';
import { serviceOrdersApi, type ServiceOrderJob } from '@/services/api/serviceOrdersApi';
import { installationsApi } from '@/services/api/installationsApi';
import type { InstallationDto } from '@/modules/field/installations/types';

type JobFormState = {
  title: string;
  jobDescription: string;
  priority: string;
  workType: string;
  estimatedDuration: number;
  installationId?: number;
  notes: string;
};

const DEFAULT_FORM: JobFormState = {
  title: "",
  jobDescription: "",
  priority: "medium",
  workType: "maintenance",
  estimatedDuration: 60,
  installationId: undefined,
  notes: "",
};

export default function JobDetail() {
  const { serviceOrderId, jobId } = useParams<{ serviceOrderId: string; jobId?: string }>();
  const navigate = useNavigate();
  const isEdit = !!jobId && !isNaN(Number(jobId));
  const jobIdNum = isEdit ? Number(jobId) : null;
  const soIdNum = serviceOrderId ? Number(serviceOrderId) : null;

  const { priorities: lookupPriorities, getDefaultPriority } = useLookups();

  const [formData, setFormData] = useState<JobFormState>(DEFAULT_FORM);
  const [installations, setInstallations] = useState<InstallationDto[]>([]);
  const [loadingJob, setLoadingJob] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('pending');

  // Load installations
  useEffect(() => {
    installationsApi.getAll({ pageSize: 200 })
      .then(res => setInstallations(res.installations || []))
      .catch(err => {
        console.error('Failed to load installations:', err);
        toast.error('Could not load installations list.');
      });
  }, []);

  // Load existing job on edit
  useEffect(() => {
    if (!isEdit || !soIdNum || !jobIdNum) return;
    let cancelled = false;
    setLoadingJob(true);
    serviceOrdersApi.getJobById(soIdNum, jobIdNum)
      .then(job => {
        if (cancelled || !job) return;
        setCurrentStatus(job.status || 'pending');
        setFormData({
          title: job.title || '',
          jobDescription: job.jobDescription || '',
          priority: job.priority || 'medium',
          workType: job.workType || 'maintenance',
          estimatedDuration: job.estimatedDuration || 60,
          installationId: job.installationId,
          notes: job.notes || '',
        });
      })
      .catch(err => console.error('Failed to load job:', err))
      .finally(() => { if (!cancelled) setLoadingJob(false); });
    return () => { cancelled = true; };
  }, [isEdit, soIdNum, jobIdNum]);

  // Auto-select priority default when creating
  useEffect(() => {
    if (isEdit) return;
    if (lookupPriorities.length > 0 && formData.priority === 'medium') {
      const dp = getDefaultPriority();
      if (dp) {
        setFormData(prev => ({ ...prev, priority: dp.id }));
      } else if (lookupPriorities.length === 1) {
        setFormData(prev => ({ ...prev, priority: lookupPriorities[0].id }));
      }
    }
  }, [lookupPriorities, getDefaultPriority, isEdit, formData.priority]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soIdNum) {
      toast.error("Missing service order reference");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<ServiceOrderJob> & { title: string } = {
        title: formData.title.trim(),
        jobDescription: formData.jobDescription,
        priority: formData.priority,
        workType: formData.workType,
        estimatedDuration: formData.estimatedDuration,
        installationId: formData.installationId,
        notes: formData.notes,
      };
      if (isEdit && jobIdNum) {
        await serviceOrdersApi.updateJob(soIdNum, jobIdNum, payload);
        toast.success("Job updated");
      } else {
        const created = await serviceOrdersApi.createJob(soIdNum, payload);
        toast.success("Job created");
        // Navigate to edit route so planned entries editor becomes available
        if (created?.id) {
          navigate(`/dashboard/field/service-orders/${soIdNum}/jobs/${created.id}`, { replace: true });
          return;
        }
      }
      navigate(`/dashboard/field/service-orders/${soIdNum}`);
    } catch (err: any) {
      console.error('Failed to save job:', err);
      toast.error(err?.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const selectedInstallation = installations.find(i => Number(i.id) === Number(formData.installationId));

  if (loadingJob) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading job…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate(`/dashboard/field/service-orders/${serviceOrderId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'ordre de service
        </Button>
        {isEdit && (
          <Badge variant="outline">Statut: {currentStatus}</Badge>
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          {isEdit ? `Modifier le job #${jobId}` : "Créer un nouveau job"}
        </h1>
        <p className="text-muted-foreground">
          Ordre de service: {serviceOrderId}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre du job *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Réparation moteur BMW"
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority">Priorité *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="workType">Type de travail *</Label>
                <Select
                  value={formData.workType}
                  onValueChange={(v) => setFormData({ ...formData, workType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="repair">Réparation</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="upgrade">Mise à niveau</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estimatedDuration">Durée estimée (minutes) *</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: Math.max(1, parseInt(e.target.value) || 60) })}
                  min={1}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Décrivez le travail à effectuer..."
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="installation">Installation concernée</Label>
              <Select
                value={formData.installationId ? String(formData.installationId) : "__none__"}
                onValueChange={(v) => setFormData({
                  ...formData,
                  installationId: v === "__none__" ? undefined : Number(v),
                })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune</SelectItem>
                  {installations.map((installation) => (
                    <SelectItem key={installation.id} value={String(installation.id)}>
                      {installation.name}{installation.model ? ` — ${installation.model}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedInstallation && (
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                {selectedInstallation.manufacturer && (
                  <p><strong>Fabricant:</strong> {selectedInstallation.manufacturer}</p>
                )}
                {selectedInstallation.serialNumber && (
                  <p><strong>N° série:</strong> {selectedInstallation.serialNumber}</p>
                )}
                {selectedInstallation.siteAddress && (
                  <p><strong>Adresse:</strong> {selectedInstallation.siteAddress}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isEdit && jobIdNum && (
          <Card>
            <CardHeader>
              <CardTitle>Planification (temps &amp; frais prévus)</CardTitle>
            </CardHeader>
            <CardContent>
              <PlannedEntriesEditor
                parentType="service_order_job"
                parentId={jobIdNum}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes additionnelles..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/dashboard/field/service-orders/${serviceOrderId}`)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Enregistrer les modifications" : "Créer le job"}
          </Button>
        </div>
      </form>
    </div>
  );
}
