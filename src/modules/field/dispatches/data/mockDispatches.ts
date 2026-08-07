/*
TABLE STRUCTURE: dispatch_jobs (linked to service_orders, contacts, technicians)
- References service_orders.id via serviceOrderId
- References contacts.id via customer.id
- References technicians.id via assignedTechnicians array
- Has many time_entries, expenses, articles_used, attachments, notes
*/
import type { DispatchJob } from "../types";

// Mock data for dispatches list with proper relationships
export const mockDispatches: DispatchJob[] = [
  {
    id: "dispatch-001",
    jobNumber: "DJ-2024-001",
    serviceOrderId: "so-001",
    serviceOrderNumber: "SO-2024-001",
    title: "Maintenance serveur principal",
    description: "Maintenance et optimisation des performances du serveur principal",
    status: "assigned",
    priority: "medium",
    customer: {
      id: "customer-001",
      company: "Acme Corporation",
      contactPerson: "John Doe",
      phone: "+216 72 285 123",
      email: "john.doe@acme.com",
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
      name: "Jean Dupont",
      email: "jean.dupont@company.com",
      skills: ["server-maintenance", "diagnostics"],
      status: "available"
    }],
    requiredSkills: ["server-maintenance", "diagnostics"],
    scheduledDate: new Date("2024-01-20T09:00:00"),
    scheduledStartTime: "09:00",
    scheduledEndTime: "13:00",
    estimatedDuration: 240,
    workLocation: {
      address: "Avenue Habib Bourguiba, Server Room A, Nabeul 8000",
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
  {
    id: "dispatch-002",
    jobNumber: "DJ-2024-002",
    serviceOrderId: "so-002",
    serviceOrderNumber: "SO-2024-002",
    title: "Installation nouveau réseau",
    description: "Installation et configuration d\"un nouveau réseau informatique",
    status: "in_progress",
    priority: "high",
    customer: {
      id: "customer-002",
      company: "Tech Solutions Inc",
      contactPerson: "Marie Martin",
      phone: "+216 72 298 456",
      email: "marie.martin@techsolutions.com",
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
    assignedTechnicians: [{
      id: "tech-002",
      name: "Ahmed Ben Ali",
      email: "ahmed.benali@company.com",
      skills: ["networking", "installation"],
      status: "busy"
    }],
    requiredSkills: ["networking", "installation"],
    scheduledDate: new Date("2024-01-21T08:00:00"),
    scheduledStartTime: "08:00",
    scheduledEndTime: "17:00",
    estimatedDuration: 540,
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
    dispatchedAt: new Date("2024-01-20T10:00:00"),
    createdAt: new Date("2024-01-20T10:00:00"),
    updatedAt: new Date("2024-01-21T09:30:00"),
    completionPercentage: 45
  }
];