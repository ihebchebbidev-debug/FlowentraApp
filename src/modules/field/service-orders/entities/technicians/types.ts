export interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  certifications: string[];
  status: 'active' | 'inactive' | 'on_leave';
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TechnicianAssignment {
  id: string;
  technicianId: string;
  serviceOrderId: string;
  assignedAt: Date;
  assignedBy: string;
  role: 'primary' | 'assistant' | 'supervisor';
  estimatedHours: number;
  actualHours?: number;
  status: 'assigned' | 'acknowledged' | 'in_progress' | 'completed';
}

export interface TechnicianSkill {
  id: string;
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  certificationRequired: boolean;
}