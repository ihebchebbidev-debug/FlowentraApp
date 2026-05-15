/*
TABLE STRUCTURE: dispatch_jobs (detailed single job with full relationships)
- Linked to service_orders, contacts, technicians, articles, time_entries, expenses
- All IDs reference proper entities in the system
*/
import type { DispatchJob } from "../types";

// Mock dispatch job data with complete relationships
export const mockDispatchJob: DispatchJob = {
  id: "dispatch-001",
  jobNumber: "DJ-2024-001",
  serviceOrderId: "so-001",
  serviceOrderNumber: "SO-2024-001",
  title: "Maintenance serveur principal",
  description: "Maintenance et optimisation des performances du serveur principal",
  status: "assigned",
  priority: "medium",
  
  // Customer Information from parent Service Order
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

  // Assignment & Scheduling
  assignedTechnicians: [
    {
      id: "tech-001",
      name: "Jean Dupont",
      email: "jean.dupont@company.com",
      phone: "+216 20 123 456",
      skills: ["server-maintenance", "diagnostics", "networking"],
      status: "available"
    }
  ],
  requiredSkills: ["server-maintenance", "diagnostics"],
  scheduledDate: new Date("2024-01-20T09:00:00"),
  scheduledStartTime: "09:00",
  scheduledEndTime: "13:00",
  estimatedDuration: 240, // minutes
  workLocation: {
    address: "Avenue Habib Bourguiba, Server Room A, Nabeul 8000",
    lat: 36.456389,
    lng: 10.737222,
    longitude: 10.737222,
    latitude: 36.456389,
    hasLocation: 1
  },

  // Time Tracking
  timeEntries: [
    {
      id: "time-001",
      dispatchId: "dispatch-001",
      technicianId: "tech-001",
      technicianName: "Jean Dupont",
      workType: "travel",
      startTime: new Date("2024-01-20T08:30:00"),
      endTime: new Date("2024-01-20T09:00:00"),
      duration: 30,
      description: "Trajet vers le site client",
      billable: true,
      status: "approved",
      createdAt: new Date("2024-01-20T08:30:00")
    },
    {
      id: "time-002",
      dispatchId: "dispatch-001",
      technicianId: "tech-001",
      technicianName: "Jean Dupont",
      workType: "work",
      startTime: new Date("2024-01-20T09:00:00"),
      endTime: new Date("2024-01-20T11:30:00"),
      duration: 150,
      description: "Diagnostic initial et évaluation",
      billable: true,
      status: "approved",
      createdAt: new Date("2024-01-20T09:00:00")
    }
  ],

  // Expenses
  expenses: [
    {
      id: "exp-001",
      dispatchId: "dispatch-001",
      technicianId: "tech-001",
      technicianName: "Jean Dupont",
      type: "travel",
      amount: 15.50,
      currency: "TND",
      description: "Frais de déplacement - essence",
      receipt: "receipt-001.jpg",
      date: new Date("2024-01-20T08:30:00"),
      status: "pending",
      createdAt: new Date("2024-01-20T18:00:00")
    }
  ],

  // Articles/Materials Used
  articlesUsed: [
    {
      id: "article-001",
      dispatchId: "dispatch-001",
      articleId: "art-001",
      articleName: "Module mémoire serveur 32GB",
      sku: "SMM-32GB",
      quantity: 2,
      unitPrice: 150,
      totalPrice: 300,
      usedBy: "tech-001",
      usedAt: new Date("2024-01-20T10:30:00")
    }
  ],

  // Attachments & Photos
  attachments: [
    {
      id: "att-001",
      dispatchId: "dispatch-001",
      fileName: "diagnostic_initial.jpg",
      fileType: "image/jpeg",
      fileSize: 2.4, // MB
      uploadedBy: "tech-001",
      uploadedAt: new Date("2024-01-20T10:00:00"),
      category: "diagnostic",
      description: "État initial du serveur"
    },
    {
      id: "att-002",
      dispatchId: "dispatch-001",
      fileName: "config_serveur.pdf",
      fileType: "application/pdf",
      fileSize: 1.2,
      uploadedBy: "tech-001",
      uploadedAt: new Date("2024-01-20T11:00:00"),
      category: "document",
      description: "Configuration serveur après optimisation"
    }
  ],

  // Notes & Issues
  notes: [
    {
      id: "note-001",
      dispatchId: "dispatch-001",
      content: "Système opérationnel, problèmes de performance mineurs identifiés",
      createdBy: "tech-001",
      createdByName: "Jean Dupont",
      createdAt: new Date("2024-01-20T10:30:00"),
      category: "general"
    },
    {
      id: "note-002",
      dispatchId: "dispatch-001",
      content: "Remplacement de 2 modules mémoire défectueux",
      createdBy: "tech-001",
      createdByName: "Jean Dupont",
      createdAt: new Date("2024-01-20T11:00:00"),
      category: "work_performed",
      attachments: ["att-001"]
    }
  ],

  // Metadata
  dispatchedBy: "supervisor-001",
  dispatchedAt: new Date("2024-01-19T14:00:00"),
  createdAt: new Date("2024-01-19T14:00:00"),
  updatedAt: new Date("2024-01-20T11:30:00"),
  
  // Completion details
  actualStartTime: new Date("2024-01-20T09:00:00"),
  actualEndTime: new Date("2024-01-20T11:30:00"),
  actualDuration: 150,
  completionPercentage: 65
};