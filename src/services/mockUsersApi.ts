// Mock users API - frontend only, no real API calls
import usersData from '@/data/mock/users.json';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country?: string;
  industry?: string;
  companyName?: string;
  companyWebsite?: string;
  preferences?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  lastLoginAt?: string;
  role: string;
  isActive?: boolean;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country?: string;
  industry?: string;
  companyName?: string;
  companyWebsite?: string;
  role: string;
  password?: string;
}

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

let mockUsers: User[] = (usersData as any[]).map(user => ({
  ...user,
  isActive: true,
  lastLoginAt: user.lastLoginAt || new Date().toISOString()
}));

export const usersApi = {
  async getAllUsers(): Promise<{ success: boolean; data?: User[]; message?: string }> {
    await delay();
    return { success: true, data: mockUsers };
  },

  async getUsers(): Promise<{ success: boolean; data?: User[]; message?: string }> {
    await delay();
    return { success: true, data: mockUsers };
  },

  async getUserById(id: number): Promise<{ success: boolean; data?: User; message?: string }> {
    await delay();
    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    return { success: true, data: user };
  },

  async createUser(userData: CreateUserRequest): Promise<{ success: boolean; data?: User; message?: string }> {
    await delay();
    const newUser: User = {
      id: Math.max(...mockUsers.map(u => u.id)) + 1,
      ...userData,
      onboardingCompleted: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return { success: true, data: newUser };
  },

  async updateUser(id: number, updates: Partial<User>): Promise<{ success: boolean; data?: User; message?: string }> {
    await delay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      return { success: false, message: 'User not found' };
    }
    
    mockUsers[index] = {
      ...mockUsers[index],
      ...updates,
      lastLoginAt: new Date().toISOString()
    };
    return { success: true, data: mockUsers[index] };
  },

  async deleteUser(id: number): Promise<{ success: boolean; message?: string }> {
    await delay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      return { success: false, message: 'User not found' };
    }
    mockUsers.splice(index, 1);
    return { success: true };
  },

  async setUserRole(userId: number, roleId: number): Promise<{ success: boolean; message?: string }> {
    await delay();
    return { success: true };
  },

  async bulkCreateUsers(users: CreateUserRequest[]): Promise<{ success: boolean; data?: User[]; message?: string }> {
    await delay();
    const newUsers = users.map(userData => ({
      id: Math.max(...mockUsers.map(u => u.id)) + Math.random(),
      ...userData,
      onboardingCompleted: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    }));
    mockUsers.push(...newUsers);
    return { success: true, data: newUsers };
  }
};

export default usersApi;