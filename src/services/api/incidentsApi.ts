import type { AutoIncidentResult, IncidentReportPayload } from '@/services/incident/incidentTypes';
import { reportIncident as sendIncident } from '@/services/incident/incidentService';

export type { AutoIncidentResult, IncidentReportPayload };

export const incidentsApi = {
  async reportAuto(payload: IncidentReportPayload): Promise<AutoIncidentResult | null> {
    return sendIncident(payload);
  },
};
