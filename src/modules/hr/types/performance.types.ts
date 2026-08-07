export type GoalCategory = 'smart' | 'okr' | 'kpi' | 'other';
export type GoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'partially' | 'missed' | 'cancelled';

export interface HrGoal {
  id: number;
  userId: number;
  userName?: string;
  cycleId?: number | null;
  cycleName?: string | null;
  title: string;
  description?: string;
  category: GoalCategory;
  weight: number;
  targetValue?: string;
  progress: number;
  status: GoalStatus;
  dueDate?: string;
  score?: number | null;
  createdAt: string;
}

export type ReviewCycleFrequency = 'annual' | 'semi_annual' | 'quarterly' | 'custom';
export type ReviewCycleStatus = 'draft' | 'open' | 'closed';

export interface HrReviewCycle {
  id: number;
  name: string;
  description?: string;
  frequency: ReviewCycleFrequency;
  periodStart: string;
  periodEnd: string;
  status: ReviewCycleStatus;
  selfAssessmentRequired: boolean;
  reviewsCount: number;
  completedReviewsCount: number;
}

export type ReviewStatus = 'pending' | 'self_assessment' | 'manager_review' | 'completed' | 'acknowledged';
export type ReviewRating = 'exceeds' | 'meets' | 'partially_meets' | 'below' | 'new_to_role';

export interface HrPerformanceReview {
  id: number;
  userId: number;
  userName?: string;
  cycleId: number;
  cycleName?: string;
  reviewerUserId?: number;
  reviewerName?: string;
  status: ReviewStatus;
  selfAssessment?: string;
  selfAssessmentSubmittedAt?: string;
  managerComments?: string;
  overallScore?: number | null;
  rating?: ReviewRating | null;
  strengths?: string;
  improvements?: string;
  developmentPlan?: string;
  completedAt?: string;
  acknowledgedAt?: string;
  goals: HrGoal[];
}