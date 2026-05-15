import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';
import type { ApplicantStage, HrApplicant, HrApplicantNote, HrInterview, HrJobOpening } from '../types/recruitment.types';

export function useRecruitmentDashboard() {
  return useQuery({
    queryKey: ['hr', 'recruitment', 'dashboard'],
    queryFn: () => hrApi.getRecruitmentDashboard(),
  });
}

export function useJobOpenings(status?: string) {
  const qc = useQueryClient();
  const openingsQuery = useQuery({
    queryKey: ['hr', 'openings', status ?? 'all'],
    queryFn: () => hrApi.getJobOpenings(status),
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['hr', 'openings'] });
    qc.invalidateQueries({ queryKey: ['hr', 'recruitment', 'dashboard'] });
  };
  const createOpening = useMutation({
    mutationFn: (payload: Partial<HrJobOpening>) => hrApi.createJobOpening(payload),
    onSuccess: invalidate,
  });
  const updateOpening = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<HrJobOpening> }) => hrApi.updateJobOpening(id, payload),
    onSuccess: invalidate,
  });
  const deleteOpening = useMutation({
    mutationFn: (id: number) => hrApi.deleteJobOpening(id),
    onSuccess: invalidate,
  });
  return { openingsQuery, createOpening, updateOpening, deleteOpening };
}

export function useJobOpening(id: number | undefined) {
  return useQuery({
    queryKey: ['hr', 'opening', id],
    queryFn: () => hrApi.getJobOpening(id as number),
    enabled: !!id && id > 0,
  });
}

export function useApplicants(params?: { openingId?: number; stage?: string }) {
  const qc = useQueryClient();
  const applicantsQuery = useQuery({
    queryKey: ['hr', 'applicants', params ?? {}],
    queryFn: () => hrApi.getApplicants(params),
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['hr', 'applicants'] });
    qc.invalidateQueries({ queryKey: ['hr', 'recruitment', 'dashboard'] });
    qc.invalidateQueries({ queryKey: ['hr', 'openings'] });
  };
  const createApplicant = useMutation({
    mutationFn: (payload: Partial<HrApplicant>) => hrApi.createApplicant(payload),
    onSuccess: invalidate,
  });
  const updateApplicant = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<HrApplicant> }) => hrApi.updateApplicant(id, payload),
    onSuccess: invalidate,
  });
  const moveStage = useMutation({
    mutationFn: ({ id, stage, rejectionReason }: { id: number; stage: ApplicantStage; rejectionReason?: string }) =>
      hrApi.moveApplicantStage(id, stage, rejectionReason),
    onSuccess: invalidate,
  });
  const deleteApplicant = useMutation({
    mutationFn: (id: number) => hrApi.deleteApplicant(id),
    onSuccess: invalidate,
  });
  return { applicantsQuery, createApplicant, updateApplicant, moveStage, deleteApplicant };
}

export function useApplicant(id: number | undefined) {
  return useQuery({
    queryKey: ['hr', 'applicant', id],
    queryFn: () => hrApi.getApplicant(id as number),
    enabled: !!id && id > 0,
  });
}

export function useInterviews(params?: { applicantId?: number; from?: string; to?: string }) {
  const qc = useQueryClient();
  const interviewsQuery = useQuery({
    queryKey: ['hr', 'interviews', params ?? {}],
    queryFn: () => hrApi.getInterviews(params),
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['hr', 'interviews'] });
    qc.invalidateQueries({ queryKey: ['hr', 'recruitment', 'dashboard'] });
    qc.invalidateQueries({ queryKey: ['hr', 'applicants'] });
  };
  const createInterview = useMutation({
    mutationFn: (payload: Partial<HrInterview>) => hrApi.createInterview(payload),
    onSuccess: invalidate,
  });
  const updateInterview = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<HrInterview> }) => hrApi.updateInterview(id, payload),
    onSuccess: invalidate,
  });
  const deleteInterview = useMutation({
    mutationFn: (id: number) => hrApi.deleteInterview(id),
    onSuccess: invalidate,
  });
  return { interviewsQuery, createInterview, updateInterview, deleteInterview };
}

export function useApplicantNotes(applicantId: number | undefined) {
  const qc = useQueryClient();
  const notesQuery = useQuery({
    queryKey: ['hr', 'applicant-notes', applicantId],
    queryFn: () => hrApi.getApplicantNotes(applicantId as number),
    enabled: !!applicantId && applicantId > 0,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['hr', 'applicant-notes', applicantId] });
  const addNote = useMutation({
    mutationFn: ({ applicantId: aid, body }: { applicantId: number; body: string }) =>
      hrApi.addApplicantNote(aid, body),
    onSuccess: invalidate,
  });
  const deleteNote = useMutation({
    mutationFn: (id: number) => hrApi.deleteApplicantNote(id),
    onSuccess: invalidate,
  });
  return { notesQuery, addNote, deleteNote };
}

export type { HrApplicantNote };