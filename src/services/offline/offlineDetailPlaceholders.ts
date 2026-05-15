/**
 * Minimal JSON bodies for GET detail requests when offline cache misses.
 * Prevents unwrap()/screens from throwing; UIs should treat missing fields as "unavailable offline".
 */
import { API_URL } from "@/config/api";

const NUM = /^\d+$/;
const ISO = "1970-01-01T00:00:00.000Z";

function segments(endpoint: string): string[] {
  try {
    const raw = endpoint.startsWith("http")
      ? endpoint
      : `${API_URL.replace(/\/$/, "")}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const u = new URL(raw);
    return u.pathname
      .toLowerCase()
      .split("/")
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * @returns A JSON-shaped object to return as successful GET `data`, or `null` to keep 503 error.
 */
export function getOfflineDetailPlaceholder(endpoint: string): unknown | null {
  const s = segments(endpoint);
  if (s[0] !== "api") return null;
  const p = s.slice(1);
  if (p.length < 2) return null;

  const head = p[0];

  if (head === "auth" && p.length === 3 && p[1] === "user" && NUM.test(p[2])) {
    const id = parseInt(p[2], 10);
    return { id, email: "", firstName: "", lastName: "", fullName: "" };
  }

  if (head === "contacts" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      id,
      name: "",
      email: "",
      status: "active",
      type: "individual",
      favorite: false,
      tags: [],
      notes: [],
      createdAt: ISO,
      updatedAt: ISO,
    };
  }

  if (head === "offers" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      data: {
        id,
        offerNumber: "",
        title: "",
        contactId: 0,
        status: "draft",
        currency: "TND",
        items: [],
      },
    };
  }

  if (head === "sales" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      data: {
        id,
        saleNumber: "",
        title: "",
        contactId: 0,
        status: "draft",
        currency: "TND",
        items: [],
      },
    };
  }

  if (head === "service-orders" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      data: {
        id,
        orderNumber: "",
        contactId: 0,
        status: "draft",
        priority: "medium",
        jobs: [],
      },
    };
  }

  if (head === "dispatches" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      data: {
        id,
        dispatchNumber: "",
        jobId: 0,
        contactId: 0,
        status: "pending",
        priority: "medium",
      },
    };
  }

  if (head === "installations" && p.length === 2) {
    return {
      Id: p[1],
      id: p[1],
      name: "",
      installationNumber: "",
      status: "active",
    };
  }

  if (head === "supporttickets" && p.length === 2 && NUM.test(p[1])) {
    return {
      id: parseInt(p[1], 10),
      title: "",
      description: "",
      status: "open",
      tenant: "",
      userEmail: "",
      createdAt: ISO,
      attachments: [],
    };
  }

  if (head === "projects" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      id,
      name: "",
      ownerId: 0,
      ownerName: "",
      teamMembers: [],
      teamMemberNames: [],
      status: "active",
      type: "development",
      priority: "medium",
      progress: 0,
      tags: [],
      isArchived: false,
      columns: [],
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        activeMembers: 0,
        completionPercentage: 0,
      },
      createdAt: ISO,
      updatedAt: ISO,
    };
  }

  if (head === "workflows" && p.length === 2 && NUM.test(p[1])) {
    return {
      id: parseInt(p[1], 10),
      name: "",
      nodes: [],
      edges: [],
      isActive: false,
      version: 1,
      isDeleted: false,
      createdAt: ISO,
    };
  }

  if (head === "articles" && p.length === 2) {
    return {
      id: p[1],
      name: "",
      type: "material",
      stockQuantity: 0,
      isActive: true,
    };
  }

  if (head === "articles" && p.length === 3 && p[1] === "groups") {
    return {
      id: p[2],
      name: "",
      description: "",
      isActive: true,
      isDefault: false,
    };
  }

  if (head === "tasks" && p.length === 3 && p[1] === "project-task" && NUM.test(p[2])) {
    const id = parseInt(p[2], 10);
    return {
      id,
      title: "",
      projectId: 0,
      projectName: "",
      columnId: 0,
      commentsCount: 0,
      attachmentsCount: 0,
    };
  }

  if (head === "tasks" && p.length === 3 && p[1] === "daily-task" && NUM.test(p[2])) {
    const id = parseInt(p[2], 10);
    return {
      id,
      title: "",
      dueDate: ISO,
      status: "todo",
      isCompleted: false,
      createdDate: ISO,
      createdBy: "",
    };
  }

  if (head === "subscriptions" && p.length === 2 && p[1] === "current") {
    return {
      id: 0,
      tenantId: 0,
      planKey: "free",
      status: "active",
      interval: "monthly",
      pricePerSeat: 0,
      currency: "TND",
      seats: 1,
      currentPeriodStart: ISO,
      currentPeriodEnd: ISO,
      trialEnd: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      createdAt: ISO,
      updatedAt: ISO,
    };
  }

  if (head === "tasktimeentries" && p.length === 2 && NUM.test(p[1])) {
    return {
      id: parseInt(p[1], 10),
      userId: 0,
      startTime: ISO,
      duration: 0,
      isBillable: true,
      workType: "work",
      approvalStatus: "pending",
      createdDate: ISO,
      createdBy: "",
    };
  }

  if (head === "workflow-executions" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      id,
      workflowId: 0,
      triggerEntityType: "",
      triggerEntityId: 0,
      status: "completed",
      context: "{}",
      startedAt: ISO,
      logs: [],
    };
  }

  if (head === "workflow-approvals" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      id,
      executionId: 0,
      nodeId: "",
      title: "",
      approverRole: "",
      status: "pending",
      timeoutHours: 24,
      createdAt: ISO,
    };
  }

  if (head === "dynamicforms" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      id,
      title: "",
      description: "",
      status: "draft",
      fields: [],
      createdAt: ISO,
      updatedAt: ISO,
    };
  }

  if (head === "entityformdocuments" && p.length === 2) {
    const rawId = p[1];
    const idNum = parseInt(rawId, 10);
    return {
      id: Number.isFinite(idNum) ? idNum : 0,
      entityType: "",
      entityId: 0,
      documents: [],
    };
  }

  if (head === "tenants" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      id,
      slug: "",
      companyName: "",
      isActive: true,
      isDefault: false,
      createdAt: ISO,
    };
  }

  if (head === "users" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      id,
      email: "",
      firstName: "",
      lastName: "",
      country: "",
      isActive: true,
      createdUser: "",
      createdDate: ISO,
      roles: [],
    };
  }

  if (head === "roles" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      id,
      name: "",
      description: "",
      createdAt: ISO,
      isActive: true,
      userCount: 0,
    };
  }

  if (head === "email-accounts" && p.length === 2 && p[1] !== "custom") {
    return {
      id: p[1],
      userId: 0,
      handle: "",
      provider: "google",
      syncStatus: "not_synced",
      emailVisibility: "private",
      calendarVisibility: "private",
      contactAutoCreationPolicy: "none",
      isEmailSyncEnabled: false,
      isCalendarSyncEnabled: false,
      excludeGroupEmails: false,
      excludeNonProfessionalEmails: false,
      isCalendarContactAutoCreationEnabled: false,
      createdAt: ISO,
      blocklistItems: [],
    };
  }

  if (head === "public" && p.length === 3 && p[1] === "forms") {
    return {
      slug: p[2],
      title: "",
      description: "",
      status: "published",
      fields: [],
    };
  }

  if (head === "calendar" && p.length === 3 && p[1] === "events" && p[2] !== "date-range") {
    return {
      id: p[2],
      title: "",
      start: ISO,
      end: ISO,
      allDay: false,
      type: "",
      status: "scheduled",
      priority: "normal",
      isPrivate: false,
      createdAt: ISO,
      updatedAt: ISO,
      createdBy: "",
      eventAttendees: [],
      eventReminders: [],
    };
  }

  if (head === "dashboards" && p.length === 2 && NUM.test(p[1])) {
    const id = parseInt(p[1], 10);
    return {
      id,
      name: "",
      isDefault: false,
      isShared: false,
      createdBy: 0,
      widgets: [],
      createdAt: ISO,
      updatedAt: ISO,
    };
  }

  if (head === "calendar" && p.length === 3 && p[1] === "event-types") {
    return {
      id: p[2],
      name: "",
      description: "",
      color: "#64748b",
      isDefault: false,
      isActive: true,
      createdAt: ISO,
    };
  }

  return null;
}
