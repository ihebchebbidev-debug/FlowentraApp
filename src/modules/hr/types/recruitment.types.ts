export type JobOpeningStatus = 'draft' | 'open' | 'on_hold' | 'closed' | 'filled';

export interface HrJobOpening {
  id: number;
  title: string;
  departmentId?: number | null;
  departmentName?: string | null;
  location?: string;
  contractType?: 'CDI' | 'CDD' | 'Stage' | 'Freelance' | string;
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | string;
  description?: string;
  requirements?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  openingsCount: number;
  status: JobOpeningStatus;
  hiringManagerUserId?: number | null;
  hiringManagerName?: string | null;
  openedAt?: string | null;
  closedAt?: string | null;
  applicantsCount: number;
  hiredCount: number;
  createdAt: string;
}

export type ApplicantStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';

export interface HrApplicant {
  id: number;
  openingId: number;
  openingTitle?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  stage: ApplicantStage;
  rating?: number | null;
  expectedSalary?: number;
  availableFrom?: string;
  rejectionReason?: string;
  createdAt: string;
  interviewsCount: number;
  notesCount: number;
}

export type InterviewKind = 'phone' | 'technical' | 'hr' | 'onsite' | 'final';
export type InterviewStatus = 'scheduled' | 'done' | 'cancelled' | 'no_show';
export type InterviewRecommendation = 'hire' | 'no_hire' | 'maybe' | 'next_round';

export interface HrInterview {
  id: number;
  applicantId: number;
  applicantName?: string;
  kind: InterviewKind;
  scheduledAt: string;
  durationMinutes: number;
  interviewerUserId?: number | null;
  interviewerName?: string | null;
  location?: string;
  meetingUrl?: string;
  status: InterviewStatus;
  score?: number | null;
  feedback?: string;
  recommendation?: InterviewRecommendation | null;
}

export interface HrApplicantNote {
  id: number;
  applicantId: number;
  authorUserId?: number | null;
  authorName?: string | null;
  body: string;
  createdAt: string;
}

export interface RecruitmentDashboard {
  openPositions: number;
  activeApplicants: number;
  interviewsThisWeek: number;
  offersOut: number;
  byStage: Record<string, number>;
}

export const APPLICANT_STAGES: ApplicantStage[] = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];