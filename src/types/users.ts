// Users, Roles & Skills Module Types

// =====================================================
// User Types
// =====================================================

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country: string;
  role?: string; // Deprecated: use roles array
  roles?: Role[]; // Multiple roles
  isActive: boolean;
  profilePictureUrl?: string;
  createdUser: string;
  modifyUser?: string;
  createdDate: string;
  modifyDate?: string;
  lastLoginAt?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country: string;
  role?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  country?: string;
  role?: string;
  isActive?: boolean;
  profilePictureUrl?: string;
}

export interface UserListResponse {
  users: User[];
  totalCount: number;
}

export interface ChangePasswordRequest {
  newPassword: string;
}

// =====================================================
// Role Types
// =====================================================

export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  userCount: number;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

// =====================================================
// Skill Types
// =====================================================

export interface Skill {
  id: number;
  name: string;
  description?: string;
  category: string;
  level?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  userCount: number;
}

export interface CreateSkillRequest {
  name: string;
  description?: string;
  category: string;
  level?: string;
}

export interface UpdateSkillRequest {
  name: string;
  description?: string;
  category: string;
  level?: string;
  isActive?: boolean;
}

export interface UserSkill {
  id: number;
  userId: number;
  skillId: number;
  skillName: string;
  skillCategory?: string;
  proficiencyLevel?: string;
  yearsOfExperience?: number;
  certifications?: string[];
  notes?: string;
  assignedAt: string;
}

export interface AssignSkillToUserRequest {
  proficiencyLevel?: string;
  yearsOfExperience?: number;
  certifications?: string[];
  notes?: string;
}

export interface AssignSkillToRoleRequest {
  notes?: string;
}
