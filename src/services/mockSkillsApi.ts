// Mock skills API - frontend only, no real API calls
import skillsData from '@/data/mock/skills.json';

export interface Skill {
  id: number;
  name: string;
  category: string;
  description: string;
  level: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

export interface CreateSkillRequest {
  name: string;
  category: string;
  description: string;
  level: string;
  isActive?: boolean;
}

export interface UpdateSkillRequest {
  name?: string;
  category?: string;
  description?: string;
  level?: string;
  isActive?: boolean;
}

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

let mockSkills: Skill[] = (skillsData as any[]).map(skill => ({
  ...skill,
  id: parseInt(skill.id.replace('skill-', '')) || Math.floor(Math.random() * 1000)
}));

export const skillsApi = {
  async getAllSkills(): Promise<{ success: boolean; data?: Skill[]; message?: string }> {
    await delay();
    const skillsWithUserCount = mockSkills.map(skill => ({
      ...skill,
      userCount: Math.floor(Math.random() * 15) + 1
    }));
    return { success: true, data: skillsWithUserCount };
  },

  async getSkillById(id: number): Promise<{ success: boolean; data?: Skill; message?: string }> {
    await delay();
    const skill = mockSkills.find(s => s.id === id);
    if (!skill) {
      return { success: false, message: 'Skill not found' };
    }
    return { success: true, data: skill };
  },

  async createSkill(skillData: CreateSkillRequest): Promise<{ success: boolean; data?: Skill; message?: string }> {
    await delay();
    const newSkill: Skill = {
      id: Math.max(...mockSkills.map(s => s.id)) + 1,
      ...skillData,
      isActive: skillData.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockSkills.push(newSkill);
    return { success: true, data: newSkill };
  },

  async updateSkill(id: number, updates: Partial<Skill>): Promise<{ success: boolean; data?: Skill; message?: string }> {
    await delay();
    const index = mockSkills.findIndex(s => s.id === id);
    if (index === -1) {
      return { success: false, message: 'Skill not found' };
    }
    
    mockSkills[index] = {
      ...mockSkills[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return { success: true, data: mockSkills[index] };
  },

  async deleteSkill(id: number): Promise<{ success: boolean; message?: string }> {
    await delay();
    const index = mockSkills.findIndex(s => s.id === id);
    if (index === -1) return { success: false, message: 'Skill not found' };
    mockSkills.splice(index, 1);
    return { success: true };
  },

  async getRoleSkills(roleId: number): Promise<Skill[]> {
    await delay();
    // Return random skills for the role
    const roleSkills = mockSkills.slice(0, Math.floor(Math.random() * 4) + 1);
    return roleSkills;
  },

  async assignSkillToRole(roleId: number, skillId: number): Promise<{ success: boolean }> {
    await delay();
    return { success: true };
  },

  async removeSkillFromRole(roleId: number, skillId: number): Promise<{ success: boolean }> {
    await delay();
    return { success: true };
  }
};

export default skillsApi;