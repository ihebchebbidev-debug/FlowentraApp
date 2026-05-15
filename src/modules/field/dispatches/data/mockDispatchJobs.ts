import type { DispatchJob } from "../types";

// Mock dispatch jobs that correspond to dispatcher job IDs
export const mockDispatchJobs: Record<string, DispatchJob> = {
  'job-1': {
    id: "job-1",
    jobNumber: "DJ-2024-001",
    serviceOrderId: "so-1",
    serviceOrderNumber: "SO-2024-001",
    title: "Engine Repair",
    description: "Replace faulty engine components and perform diagnostics",
    status: "assigned",
    priority: "high",
    customer: {
      id: "customer-001",
      company: "Smith Automotive",
      contactPerson: "John Smith",
      phone: "+216 72 285 123",
      email: "john.smith@smithauto.com",
      address: {
        street: "Avenue Habib Bourguiba",
        city: "Nabeul",
        state: "Nabeul",
        zipCode: "8000",
        country: "Tunisia",
        longitude: 10.737222,
        latitude: 36.456389,
        hasLocation: 1
      }
    },
    assignedTechnicians: [{
      id: "tech-001",
      name: "Mike Rodriguez",
      email: "mike.rodriguez@company.com",
      skills: ["engine_repair", "diagnostics", "electrical"],
      status: "available"
    }],
    requiredSkills: ["engine_repair", "diagnostics"],
    scheduledDate: new Date("2024-01-20T09:00:00"),
    scheduledStartTime: "09:00",
    scheduledEndTime: "12:00",
    estimatedDuration: 180,
    workLocation: {
      address: "Avenue Habib Bourguiba, Nabeul 8000",
      lat: 36.456389,
      lng: 10.737222,
      longitude: 10.737222,
      latitude: 36.456389,
      hasLocation: 1
    },
    timeEntries: [
      {
        id: "time-001",
        dispatchId: "job-1",
        technicianId: "tech-001",
        technicianName: "Mike Rodriguez",
        workType: "work",
        startTime: new Date("2024-01-20T09:00:00"),
        endTime: new Date("2024-01-20T11:30:00"),
        duration: 150,
        description: "Engine diagnostics and component replacement",
        billable: true,
        status: "approved",
        createdAt: new Date("2024-01-20T09:00:00")
      }
    ],
    expenses: [
      {
        id: "exp-001",
        dispatchId: "job-1",
        technicianId: "tech-001",
        technicianName: "Mike Rodriguez",
        type: "materials",
        amount: 45.80,
        currency: "USD",
        description: "Engine parts and consumables",
        date: new Date("2024-01-20T09:00:00"),
        status: "pending",
        createdAt: new Date("2024-01-20T18:00:00")
      }
    ],
    articlesUsed: [],
    attachments: [],
    notes: [
      {
        id: "note-001",
        dispatchId: "job-1",
        content: "Engine diagnostics completed successfully. Found faulty spark plugs and air filter.",
        createdBy: "tech-001",
        createdByName: "Mike Rodriguez",
        createdAt: new Date("2024-01-20T10:30:00"),
        category: "work_performed"
      }
    ],
    dispatchedBy: "supervisor-001",
    dispatchedAt: new Date("2024-01-19T14:00:00"),
    createdAt: new Date("2024-01-19T14:00:00"),
    updatedAt: new Date("2024-01-20T11:30:00"),
    actualStartTime: new Date("2024-01-20T09:00:00"),
    actualEndTime: new Date("2024-01-20T11:30:00"),
    actualDuration: 150,
    completionPercentage: 85
  },
  
  'job-2': {
    id: "job-2",
    jobNumber: "DJ-2024-002",
    serviceOrderId: "so-1",
    serviceOrderNumber: "SO-2024-001",
    title: "Body Paint Touch-up",
    description: "Minor scratches and paint restoration",
    status: "pending",
    priority: "medium",
    customer: {
      id: "customer-001",
      company: "Smith Automotive",
      contactPerson: "John Smith",
      phone: "+216 72 285 123",
      email: "john.smith@smithauto.com",
      address: {
        street: "Avenue Habib Bourguiba",
        city: "Nabeul",
        state: "Nabeul",
        zipCode: "8000",
        country: "Tunisia",
        longitude: 10.737222,
        latitude: 36.456389,
        hasLocation: 1
      }
    },
    assignedTechnicians: [],
    requiredSkills: ["painting", "body_work"],
    scheduledDate: new Date("2024-01-21T10:00:00"),
    scheduledStartTime: "10:00",
    scheduledEndTime: "12:00",
    estimatedDuration: 120,
    workLocation: {
      address: "Avenue Habib Bourguiba, Nabeul 8000",
      lat: 36.456389,
      lng: 10.737222,
      longitude: 10.737222,
      latitude: 36.456389,
      hasLocation: 1
    },
    timeEntries: [],
    expenses: [],
    articlesUsed: [],
    attachments: [],
    notes: [],
    dispatchedBy: "supervisor-001",
    dispatchedAt: new Date("2024-01-19T14:00:00"),
    createdAt: new Date("2024-01-19T14:00:00"),
    updatedAt: new Date("2024-01-20T11:30:00"),
    completionPercentage: 0
  },

  'job-3': {
    id: "job-3",
    jobNumber: "DJ-2024-003",
    serviceOrderId: "so-2",
    serviceOrderNumber: "SO-2024-002",
    title: "Air Conditioning Service",
    description: "AC system inspection and repair",
    status: "pending",
    priority: "urgent",
    customer: {
      id: "customer-002",
      company: "Johnson Services",
      contactPerson: "Sarah Johnson",
      phone: "+216 72 298 456",
      email: "sarah.johnson@johnsonservices.com",
      address: {
        street: "Route de Hammamet",
        city: "Nabeul",
        state: "Nabeul",
        zipCode: "8001",
        country: "Tunisia",
        longitude: 10.745892,
        latitude: 36.451203,
        hasLocation: 1
      }
    },
    assignedTechnicians: [],
    requiredSkills: ["hvac", "electrical"],
    scheduledDate: new Date("2024-01-20T14:00:00"),
    scheduledStartTime: "14:00",
    scheduledEndTime: "15:30",
    estimatedDuration: 90,
    workLocation: {
      address: "Route de Hammamet, Nabeul 8001",
      lat: 36.451203,
      lng: 10.745892,
      longitude: 10.745892,
      latitude: 36.451203,
      hasLocation: 1
    },
    timeEntries: [],
    expenses: [],
    articlesUsed: [],
    attachments: [],
    notes: [],
    dispatchedBy: "supervisor-001",
    dispatchedAt: new Date("2024-01-19T15:00:00"),
    createdAt: new Date("2024-01-19T15:00:00"),
    updatedAt: new Date("2024-01-20T12:00:00"),
    completionPercentage: 0
  }
};

export const getDispatchJobById = (id: string): DispatchJob | null => {
  return mockDispatchJobs[id] || null;
};