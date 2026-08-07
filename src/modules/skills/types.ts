
// Database Tables/Entities for Skills Module
export interface Skill {
  id: number;  // Changed from string to number to match API
  name: string;
  description?: string;
  category: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isActive: boolean;
  createdAt: string | Date;  // Support both string and Date formats
  updatedAt?: string | Date;
  userCount?: number;  // Added to match API response
}

export interface UserSkill {
  id: number;  // Changed from string to number to match API
  userId: number;  // Changed from string to number to match API
  skillId: number;  // Changed from string to number to match API
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  certifications?: string[];
  notes?: string;
  assignedAt: Date;
  updatedAt: Date;
}

export interface SkillCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
}
