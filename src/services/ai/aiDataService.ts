import { isMainAdminAccount } from '@/utils/authClaims';
// AI Data Service - Fetches real-time data for AI responses
// This service queries the actual APIs to answer data-related questions
import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';
import { API_URL } from '@/config/api';
import { getGlobalCurrencyCode } from '@/lib/currencies';
import { articlesApi } from '@/services/api/articlesApi';
import { offersApi } from '@/services/api/offersApi';
import { salesApi } from '@/services/api/salesApi';
import { usersApi } from '@/services/api/usersApi';
import { contactsApi } from '@/services/api/contactsApi';
import { serviceOrdersApi } from '@/services/api/serviceOrdersApi';
import { schedulesApi } from '@/services/api/schedulesApi';
import { tasksApi } from '@/services/api/tasksApi';
import { projectsApi } from '@/services/api/projectsApi';
import { dealsApi } from '@/services/api/dealsApi';
import { installationsApi } from '@/services/api/installationsApi';
import { dispatchesApi } from '@/services/api/dispatchesApi';
import { dynamicFormsService } from '@/modules/dynamic-forms/services/dynamicFormsService';
import { notificationsApi } from '@/services/api/notificationsApi';
import { rolesApi } from '@/services/api/rolesApi';
import lookupsApi, { currenciesApi, prioritiesApi, leaveTypesApi, skillsApi as skillsLookupApi, locationsApi } from '@/services/api/lookupsApi';
import { permissionsApi } from '@/services/api/permissionsApi';
import type { PermissionModule, PermissionAction } from '@/types/permissions';
import { offerStatusConfig, saleStatusConfig, normalizeStatus, type EntityStatusConfig } from '@/config/entity-statuses';



// Group items by canonical status (collapses aliases like created→draft, won→accepted)
function groupByCanonicalStatus<T extends { status?: string }>(
  items: T[],
  config: EntityStatusConfig,
): Record<string, number> {
  return items.reduce((acc: Record<string, number>, item) => {
    const raw = (item.status || 'unknown').toString().toLowerCase();
    const canonical = normalizeStatus(config, raw);
    acc[canonical] = (acc[canonical] || 0) + 1;
    return acc;
  }, {});
}

export interface DataQueryResult {
  success: boolean;
  data: string;
  error?: string;
}

// Get current user ID from storage
const getCurrentUserId = (): number | null => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id ? Number(user.id) : null;
    }
    return null;
  } catch {
    return null;
  }
};

// Check if current user is MainAdmin (JWT claims are authoritative)
const isMainAdmin = (): boolean => isMainAdminAccount();

// Check if user has a specific permission
const checkUserPermission = async (module: PermissionModule, action: PermissionAction): Promise<boolean> => {
  // MainAdmin always has permission
  if (isMainAdmin()) return true;

  const userId = getCurrentUserId();
  if (!userId) return false;

  try {
    const permissions = await permissionsApi.getMyPermissions(userId);
    return permissions.includes(`${module}:${action}`);
  } catch {
    return false;
  }
};

// Format date for display
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

// Query functions for different data types
export const aiDataQueries = {
  // =============== STOCK MODIFICATION ===============

  // Modify article stock (add or remove)
  async modifyArticleStock(articleName: string, quantity: number, action: 'add' | 'remove'): Promise<DataQueryResult> {
    try {
      // Check permission based on action
      const requiredAction = action === 'add' ? 'add_stock' : 'remove_stock';
      const hasPermission = await checkUserPermission('stock_management', requiredAction as PermissionAction);

      if (!hasPermission) {
        const actionLabel = action === 'add' ? 'add stock / ajouter du stock' : 'remove stock / retirer du stock';
        return {
          success: true,
          data: `🔒 **Permission Denied / Accès Refusé**\n\nYou don't have permission to ${actionLabel}.\n\nVous n'avez pas la permission de ${actionLabel}.\n\nPlease contact your administrator to request access. / Veuillez contacter votre administrateur pour demander l'accès.`
        };
      }

      // Search for the article by name
      const response = await articlesApi.getAll({ limit: 1000, search: articleName });
      const articles = (response.data || response) as any[];

      // Find the best matching article
      const normalizedSearch = articleName.toLowerCase().trim();
      const matchingArticles = articles.filter((a: any) => {
        const name = (a.name || '').toLowerCase();
        const sku = (a.sku || '').toLowerCase();
        return name.includes(normalizedSearch) || normalizedSearch.includes(name) || sku === normalizedSearch;
      });

      if (matchingArticles.length === 0) {
        return {
          success: true,
          data: `❓ **Article not found**\n\nCould not find an article matching "**${articleName}**".\n\nPlease check the article name and try again. You can ask "list articles" to see available articles.`
        };
      }

      // If multiple matches, pick the closest one
      let article = matchingArticles[0];
      if (matchingArticles.length > 1) {
        // Prefer exact match
        const exactMatch = matchingArticles.find((a: any) =>
          (a.name || '').toLowerCase() === normalizedSearch
        );
        if (exactMatch) {
          article = exactMatch;
        }
      }

      // Check if it's a material (only materials have stock)
      if (article.type === 'service') {
        return {
          success: true,
          data: `⚠️ **Cannot modify stock**\n\n"**${article.name}**" is a service, not a material. Only material articles have stock levels.`
        };
      }

      const currentStock = article.stock || article.stockQuantity || 0;
      let newStock: number;

      if (action === 'add') {
        newStock = currentStock + quantity;
      } else {
        newStock = Math.max(0, currentStock - quantity);
        if (currentStock < quantity) {
          return {
            success: true,
            data: `⚠️ **Insufficient stock**\n\nCannot remove **${quantity}** units from "**${article.name}**".\n\nCurrent stock: **${currentStock}** units.\n\nWould you like to remove all ${currentStock} units instead?`
          };
        }
      }

      // Update the article stock
      await articlesApi.update(article.id, { stock: newStock });

      const actionEmoji = action === 'add' ? '📦➕' : '📦➖';
      const actionVerb = action === 'add' ? 'added to' : 'removed from';
      const actionVerbFr = action === 'add' ? 'ajoutées à' : 'retirées de';

      return {
        success: true,
        data: `${actionEmoji} **Stock Updated Successfully!**\n\n**Article:** ${article.name}\n**SKU:** ${article.sku || 'N/A'}\n\n📊 **Stock Change:**\n- Previous: **${currentStock}** units\n- ${action === 'add' ? 'Added' : 'Removed'}: **${quantity}** units\n- New Stock: **${newStock}** units\n\n✅ ${quantity} units ${actionVerb} "${article.name}" / ${quantity} unités ${actionVerbFr} "${article.name}"`
      };
    } catch (error) {
      console.error('Stock modification error:', error);
      return {
        success: false,
        data: '',
        error: `Could not update stock. Please try again or use the Stock Management page.`
      };
    }
  },

  // Articles / Inventory
  async getArticlesCount(): Promise<DataQueryResult> {
    try {
      const response = await articlesApi.getAll({ limit: 1 });
      const articles = response.data || response;
      const total = (articles as any)?.totalCount || (Array.isArray(articles) ? articles.length : 0);

      // Get breakdown by type
      const allResponse = await articlesApi.getAll({ limit: 1000 });
      const allArticles = (allResponse.data || allResponse) as any[];
      const materials = allArticles.filter((a: any) => a.type === 'material').length;
      const services = allArticles.filter((a: any) => a.type === 'service').length;

      return {
        success: true,
        data: `You have **${allArticles.length} articles** in total:\n- 📦 **${materials} materials** (products)\n- 🔧 **${services} services**`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch articles data' };
    }
  },

  // Offers
  async getOffersStats(): Promise<DataQueryResult> {
    try {
      const response = await offersApi.getAll({ limit: 1000 });
      const offers = response.data?.offers || [];

      const byStatus = groupByCanonicalStatus(offers, offerStatusConfig);

      let statusBreakdown = Object.entries(byStatus)
        .map(([status, count]) => `  - ${status}: ${count}`)
        .join('\n');

      const totalValue = offers.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

      return {
        success: true,
        data: `📋 **Offers Overview**:\n- Total: **${offers.length} offers**\n- Total value: **${totalValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n\n**By Status:**\n${statusBreakdown}`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch offers data' };
    }
  },

  // Sales
  async getSalesStats(): Promise<DataQueryResult> {
    try {
      const response = await salesApi.getAll({ limit: 1000 });
      const sales = response.data?.sales || [];

      const byStatus = groupByCanonicalStatus(sales, saleStatusConfig);

      let statusBreakdown = Object.entries(byStatus)
        .map(([status, count]) => `  - ${status}: ${count}`)
        .join('\n');

      const totalValue = sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

      return {
        success: true,
        data: `💰 **Sales Overview**:\n- Total: **${sales.length} sales**\n- Total value: **${totalValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n\n**By Status:**\n${statusBreakdown}`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch sales data' };
    }
  },

  // Contacts
  async getContactsCount(): Promise<DataQueryResult> {
    try {
      const response = await contactsApi.getAll({ pageSize: 1 });
      const total = response.totalCount || 0;

      return {
        success: true,
        data: `👥 You have **${total} contacts** in the system.`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch contacts data' };
    }
  },

  // Users / Technicians
  async getUsersStats(): Promise<DataQueryResult> {
    try {
      const response = await usersApi.getAll();
      const users = response.users || [];

      const technicians = users.filter((u: any) =>
        u.roles?.some((r: any) => r.name?.toLowerCase().includes('technician'))
      );

      return {
        success: true,
        data: `👨‍💼 **Team Overview**:\n- Total users: **${users.length}**\n- Technicians: **${technicians.length}**`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch users data' };
    }
  },

  // Service Orders
  async getServiceOrdersStats(): Promise<DataQueryResult> {
    try {
      const response = await serviceOrdersApi.getAll({ pageSize: 1000 });
      const orders = response.data?.serviceOrders || [];

      const byStatus = orders.reduce((acc: Record<string, number>, o: any) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {});

      let statusBreakdown = Object.entries(byStatus)
        .map(([status, count]) => `  - ${status.replace(/_/g, ' ')}: ${count}`)
        .join('\n');

      const inProgress = orders.filter((o: any) =>
        o.status === 'in_progress' || o.status === 'planned'
      ).length;

      return {
        success: true,
        data: `🛠️ **Service Orders Overview**:\n- Total: **${orders.length}**\n- Active (in progress/planned): **${inProgress}**\n\n**By Status:**\n${statusBreakdown}`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch service orders data' };
    }
  },

  // Today's tasks - detailed list for AI to summarize
  async getTodaysTasks(): Promise<DataQueryResult> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, data: '', error: 'User not logged in' };
      }

      const tasks = await tasksApi.getUserDailyTasks(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTasks = tasks.filter((t: any) => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      });

      const pending = todayTasks.filter((t: any) => t.status !== 'done');
      const completed = todayTasks.filter((t: any) => t.status === 'done');
      const inProgress = todayTasks.filter((t: any) => t.status === 'in-progress');

      if (todayTasks.length === 0) {
        return {
          success: true,
          data: `📅 **Today's Tasks (${formatDate(today)})**:\n\n✨ No tasks scheduled for today! Your day is clear.\n\nYou can ask me to help you plan your day or create new tasks.`
        };
      }

      let result = `📅 **Today's Tasks (${formatDate(today)})**:\n\n`;
      result += `**Summary:**\n`;
      result += `- Total: **${todayTasks.length} tasks**\n`;
      result += `- ⏳ Pending: **${pending.length - inProgress.length}**\n`;
      result += `- 🔄 In Progress: **${inProgress.length}**\n`;
      result += `- ✅ Completed: **${completed.length}**\n\n`;

      // Group by priority
      const urgentTasks = pending.filter((t: any) => t.priority === 'urgent');
      const highTasks = pending.filter((t: any) => t.priority === 'high');
      const mediumTasks = pending.filter((t: any) => t.priority === 'medium');
      const lowTasks = pending.filter((t: any) => t.priority === 'low');

      const formatTaskItem = (t: any) => {
        const statusIcon = t.status === 'done' ? '✅' : t.status === 'in-progress' ? '🔄' : '⏳';
        const priorityLabel = t.priority ? ` [${t.priority}]` : '';
        return `  - ${statusIcon} **${t.title}**${priorityLabel}${t.description ? `\n    _${t.description.slice(0, 80)}${t.description.length > 80 ? '...' : ''}_` : ''}`;
      };

      if (urgentTasks.length > 0) {
        result += `🚨 **Urgent (${urgentTasks.length}):**\n`;
        result += urgentTasks.map(formatTaskItem).join('\n') + '\n\n';
      }

      if (highTasks.length > 0) {
        result += `🔴 **High Priority (${highTasks.length}):**\n`;
        result += highTasks.map(formatTaskItem).join('\n') + '\n\n';
      }

      if (mediumTasks.length > 0) {
        result += `🟡 **Medium Priority (${mediumTasks.length}):**\n`;
        result += mediumTasks.map(formatTaskItem).join('\n') + '\n\n';
      }

      if (lowTasks.length > 0) {
        result += `🟢 **Low Priority (${lowTasks.length}):**\n`;
        result += lowTasks.map(formatTaskItem).join('\n') + '\n\n';
      }

      if (completed.length > 0) {
        result += `✅ **Completed (${completed.length}):**\n`;
        result += completed.slice(0, 5).map(formatTaskItem).join('\n');
        if (completed.length > 5) {
          result += `\n  _... and ${completed.length - 5} more completed_`;
        }
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch tasks data' };
    }
  },

  // Get all daily tasks (not just today) for broader queries
  async getAllDailyTasks(): Promise<DataQueryResult> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, data: '', error: 'User not logged in' };
      }

      const tasks = await tasksApi.getUserDailyTasks(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pending = tasks.filter((t: any) => t.status !== 'done');
      const completed = tasks.filter((t: any) => t.status === 'done');

      // Group by date
      const tasksByDate: Record<string, any[]> = {};
      pending.forEach((t: any) => {
        const dateKey = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date';
        if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
        tasksByDate[dateKey].push(t);
      });

      let result = `📋 **All Your Daily Tasks**:\n\n`;
      result += `**Overview:**\n`;
      result += `- Total pending: **${pending.length} tasks**\n`;
      result += `- Completed: **${completed.length} tasks**\n\n`;

      // Show tasks grouped by date
      const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
        if (a === 'No date') return 1;
        if (b === 'No date') return -1;
        return new Date(a).getTime() - new Date(b).getTime();
      });

      for (const dateKey of sortedDates.slice(0, 7)) {
        const dateTasks = tasksByDate[dateKey];
        const isToday = dateKey === today.toLocaleDateString();
        const dateLabel = isToday ? `Today (${dateKey})` : dateKey;

        result += `**${dateLabel}** - ${dateTasks.length} task(s):\n`;
        dateTasks.slice(0, 5).forEach((t: any) => {
          const priorityIcon = t.priority === 'urgent' ? '🚨' : t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
          result += `  ${priorityIcon} ${t.title}\n`;
        });
        if (dateTasks.length > 5) {
          result += `  _... and ${dateTasks.length - 5} more_\n`;
        }
        result += '\n';
      }

      if (sortedDates.length > 7) {
        result += `_... and tasks on ${sortedDates.length - 7} more dates_\n`;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch tasks data' };
    }
  },

  // Technicians not working today
  async getTechniciansNotWorkingToday(): Promise<DataQueryResult> {
    try {
      const response = await usersApi.getAll();
      const users = response.users || [];
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

      const notWorking: string[] = [];
      const onLeave: string[] = [];
      const working: string[] = [];

      for (const user of users) {
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        let isWorking = true;

        try {
          const schedule = await schedulesApi.getSchedule(user.id);

          // Check if user has a day off today
          const daySchedule = schedule.daySchedules?.[dayOfWeek];
          if (daySchedule && (!daySchedule.enabled || daySchedule.fullDayOff)) {
            notWorking.push(userName);
            isWorking = false;
            continue;
          }

          // Check if user is on leave
          const todayStr = today.toISOString().split('T')[0];
          const hasLeave = schedule.leaves?.some((leave: any) => {
            const start = new Date(leave.startDate).toISOString().split('T')[0];
            const end = new Date(leave.endDate).toISOString().split('T')[0];
            return todayStr >= start && todayStr <= end && leave.status !== 'rejected';
          });

          if (hasLeave) {
            onLeave.push(userName);
            isWorking = false;
          }
        } catch {
          // Assume working if no schedule defined
        }

        if (isWorking) {
          working.push(userName);
        }
      }

      let result = `📊 **Team Availability Today (${formatDate(today)})**:\n\n`;

      result += `✅ **Working Today (${working.length}):**\n${working.length > 0 ? working.map(n => `  - ${n}`).join('\n') : '  - None'}\n\n`;

      if (onLeave.length > 0) {
        result += `🏖️ **On Leave (${onLeave.length}):**\n${onLeave.map(n => `  - ${n}`).join('\n')}\n\n`;
      }

      if (notWorking.length > 0) {
        result += `🚫 **Day Off (${notWorking.length}):**\n${notWorking.map(n => `  - ${n}`).join('\n')}\n\n`;
      }

      if (onLeave.length === 0 && notWorking.length === 0) {
        result += `✅ All team members are scheduled to work today!`;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch schedule data' };
    }
  },

  // Check if a specific user is working today (by name search)
  async checkUserWorkingToday(searchName: string): Promise<DataQueryResult> {
    try {
      const response = await usersApi.getAll();
      const users = response.users || [];
      const today = new Date();
      const dayOfWeek = today.getDay();

      // Find user by name (partial match)
      const searchLower = searchName.toLowerCase();
      const matchedUsers = users.filter((u: any) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const roles = (u.roles || []).map((r: any) => r.name?.toLowerCase() || '');

        return fullName.includes(searchLower) ||
          email.includes(searchLower) ||
          roles.some((r: string) => r.includes(searchLower));
      });

      if (matchedUsers.length === 0) {
        return {
          success: true,
          data: `❓ Could not find any user matching "**${searchName}**". Please check the spelling or try a different name.`
        };
      }

      let result = `👤 **User Availability Check (${formatDate(today)})**:\n\n`;

      for (const user of matchedUsers) {
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        const userRoles = (user.roles || []).map((r: any) => r.name).join(', ') || 'No role assigned';
        let status = '✅ Working today';
        let reason = '';

        try {
          const schedule = await schedulesApi.getSchedule(user.id);

          // Check day schedule
          const daySchedule = schedule.daySchedules?.[dayOfWeek];
          if (daySchedule && (!daySchedule.enabled || daySchedule.fullDayOff)) {
            status = '🚫 Day off';
            reason = 'Scheduled day off';
          } else {
            // Check leave
            const todayStr = today.toISOString().split('T')[0];
            const activeLeave = schedule.leaves?.find((leave: any) => {
              const start = new Date(leave.startDate).toISOString().split('T')[0];
              const end = new Date(leave.endDate).toISOString().split('T')[0];
              return todayStr >= start && todayStr <= end && leave.status !== 'rejected';
            });

            if (activeLeave) {
              status = '🏖️ On leave';
              reason = activeLeave.reason || 'Leave approved';
            } else if (daySchedule) {
              // Show working hours if available
              const startTime = daySchedule.startTime || '09:00';
              const endTime = daySchedule.endTime || '17:00';
              reason = `Working hours: ${startTime} - ${endTime}`;
            }
          }
        } catch {
          reason = 'No schedule configured (assumed available)';
        }

        result += `**${userName}**\n`;
        result += `- Role: ${userRoles}\n`;
        result += `- Status: ${status}\n`;
        if (reason) {
          result += `- ${reason}\n`;
        }
        result += '\n';
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not check user availability' };
    }
  },

  // Urgent/High priority items
  async getUrgentItems(): Promise<DataQueryResult> {
    try {
      const [offersRes, serviceOrdersRes] = await Promise.all([
        offersApi.getAll({ limit: 100 }),
        serviceOrdersApi.getAll({ priority: 'urgent', pageSize: 100 })
      ]);

      const pendingOffers = (offersRes.data?.offers || [])
        .filter((o: any) => o.status === 'sent' || o.status === 'negotiation');

      const urgentOrders = (serviceOrdersRes.data?.serviceOrders || [])
        .filter((o: any) => o.priority === 'urgent' || o.priority === 'high');

      let result = `🚨 **Urgent Items Overview**:\n\n`;

      result += `📋 **Pending Offers**: ${pendingOffers.length}\n`;
      if (pendingOffers.length > 0) {
        result += pendingOffers.slice(0, 3).map((o: any) =>
          `  - ${o.title || o.offerNumber} (${o.status})`
        ).join('\n') + '\n';
      }

      result += `\n🔧 **Urgent Service Orders**: ${urgentOrders.length}\n`;
      if (urgentOrders.length > 0) {
        result += urgentOrders.slice(0, 3).map((o: any) =>
          `  - ${o.title || o.orderNumber} (${o.priority})`
        ).join('\n');
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch urgent items' };
    }
  },

  // Projects stats
  async getProjectsStats(): Promise<DataQueryResult> {
    try {
      const response = await projectsApi.getAll({ pageSize: 1000 });
      const projects = response.projects || [];

      const byStatus = projects.reduce((acc: Record<string, number>, p: any) => {
        const status = p.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const byPriority = projects.reduce((acc: Record<string, number>, p: any) => {
        const priority = p.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {});

      let statusBreakdown = Object.entries(byStatus)
        .map(([status, count]) => `  - ${status}: ${count}`)
        .join('\n');

      let priorityBreakdown = Object.entries(byPriority)
        .map(([priority, count]) => `  - ${priority}: ${count}`)
        .join('\n');

      const activeProjects = projects.filter((p: any) =>
        p.status === 'active' || p.status === 'in_progress'
      ).length;

      return {
        success: true,
        data: `📁 **Projects Overview**:\n- Total: **${projects.length} projects**\n- Active: **${activeProjects}**\n\n**By Status:**\n${statusBreakdown}\n\n**By Priority:**\n${priorityBreakdown}`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch projects data' };
    }
  },

  // Deals (pipeline / opportunities) stats
  async getDealsStats(): Promise<DataQueryResult> {
    try {
      const response = await dealsApi.getAll({ limit: 1000 });
      const deals = response.deals || [];

      const byStage = deals.reduce((acc: Record<string, number>, d: any) => {
        const stage = d.stage || 'lead';
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {});

      const stageOrder = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
      const stageBreakdown = stageOrder
        .filter(s => byStage[s])
        .map(s => `  - ${s}: ${byStage[s]}`)
        .join('\n');

      const open = deals.filter((d: any) => d.stage !== 'won' && d.stage !== 'lost');
      const won = deals.filter((d: any) => d.stage === 'won');
      const lost = deals.filter((d: any) => d.stage === 'lost');
      const sum = (arr: any[]) => arr.reduce((t, d) => t + (Number(d.estimatedValue) || 0), 0);
      const openValue = sum(open);
      const wonValue = sum(won);
      const totalValue = sum(deals);
      const closed = won.length + lost.length;
      const winRate = closed > 0 ? Math.round((won.length / closed) * 100) : 0;
      const currency = deals.find((d: any) => d.currency)?.currency || 'TND';

      return {
        success: true,
        data: `🤝 **Deals / Pipeline Overview**:\n- Total: **${deals.length} deals**\n- Open: **${open.length}** (${openValue.toLocaleString()} ${currency})\n- Won: **${won.length}** (${wonValue.toLocaleString()} ${currency})\n- Lost: **${lost.length}**\n- Win rate: **${winRate}%**\n- Total pipeline value: **${totalValue.toLocaleString()} ${currency}**\n\n**By Stage:**\n${stageBreakdown || '  - No deals yet'}`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch deals data' };
    }
  },

  // Installations stats
  async getInstallationsStats(): Promise<DataQueryResult> {
    try {
      const response = await installationsApi.getAll({});
      const installations = response.installations || [];

      const byStatus = installations.reduce((acc: Record<string, number>, i: any) => {
        const status = i.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const byCategory = installations.reduce((acc: Record<string, number>, i: any) => {
        const category = i.category || 'general';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      let statusBreakdown = Object.entries(byStatus)
        .map(([status, count]) => `  - ${status}: ${count}`)
        .join('\n');

      let categoryBreakdown = Object.entries(byCategory)
        .map(([category, count]) => `  - ${category}: ${count}`)
        .join('\n');

      // Count warranty status
      const withWarranty = installations.filter((i: any) =>
        i.warranty?.hasWarranty || i.warrantyExpiry
      ).length;

      return {
        success: true,
        data: `🏭 **Installations Overview**:\n- Total: **${installations.length} installations**\n- With warranty: **${withWarranty}**\n\n**By Status:**\n${statusBreakdown}\n\n**By Category:**\n${categoryBreakdown}`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch installations data' };
    }
  },

  // Dispatches stats
  async getDispatchesStats(): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageSize: 1000 });
      const dispatches = response.data || [];

      const byStatus = dispatches.reduce((acc: Record<string, number>, d: any) => {
        const status = d.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const byPriority = dispatches.reduce((acc: Record<string, number>, d: any) => {
        const priority = d.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {});

      let statusBreakdown = Object.entries(byStatus)
        .map(([status, count]) => `  - ${status.replace(/_/g, ' ')}: ${count}`)
        .join('\n');

      let priorityBreakdown = Object.entries(byPriority)
        .map(([priority, count]) => `  - ${priority}: ${count}`)
        .join('\n');

      const today = new Date().toISOString().split('T')[0];
      const todaysDispatches = dispatches.filter((d: any) =>
        d.scheduledDate?.startsWith(today)
      ).length;

      return {
        success: true,
        data: `🚚 **Dispatches Overview**:\n- Total: **${dispatches.length} dispatches**\n- Scheduled today: **${todaysDispatches}**\n\n**By Status:**\n${statusBreakdown}\n\n**By Priority:**\n${priorityBreakdown}`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch dispatches data' };
    }
  },

  // Today's dispatches
  async getTodaysDispatches(): Promise<DataQueryResult> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await dispatchesApi.getAll({
        dateFrom: today,
        dateTo: today,
        pageSize: 100
      });
      const dispatches = response.data || [];

      if (dispatches.length === 0) {
        return {
          success: true,
          data: `📅 **Today's Dispatches**: No dispatches scheduled for today!`
        };
      }

      const pending = dispatches.filter((d: any) => d.status === 'pending' || d.status === 'assigned').length;
      const inProgress = dispatches.filter((d: any) => d.status === 'in_progress').length;
      const completed = dispatches.filter((d: any) => d.status === 'completed').length;

      const dispatchList = dispatches
        .slice(0, 5)
        .map((d: any) => {
          const statusIcon = d.status === 'completed' ? '✅' : d.status === 'in_progress' ? '🔄' : '⏳';
          return `  - ${statusIcon} ${d.dispatchNumber} - ${d.contactName || 'Unknown'} (${d.status})`;
        })
        .join('\n');

      return {
        success: true,
        data: `📅 **Today's Dispatches (${formatDate(new Date())})**:\n- Total: **${dispatches.length}**\n- Pending/Assigned: **${pending}**\n- In Progress: **${inProgress}**\n- Completed: **${completed}**\n\n${dispatchList}${dispatches.length > 5 ? '\n  ... and more' : ''}`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch today\'s dispatches' };
    }
  },

  // Overall summary
  async getDashboardSummary(): Promise<DataQueryResult> {
    try {
      const [articles, offers, sales, deals, contacts, serviceOrders, projects, installations, dispatches] = await Promise.all([
        aiDataQueries.getArticlesCount(),
        aiDataQueries.getOffersStats(),
        aiDataQueries.getSalesStats(),
        aiDataQueries.getDealsStats(),
        aiDataQueries.getContactsCount(),
        aiDataQueries.getServiceOrdersStats(),
        aiDataQueries.getProjectsStats(),
        aiDataQueries.getInstallationsStats(),
        aiDataQueries.getDispatchesStats()
      ]);

      return {
        success: true,
        data: `📊 **Flowentra Dashboard Summary**\n\n${contacts.data}\n\n${articles.data}\n\n${offers.data}\n\n${sales.data}\n\n${deals.data}\n\n${serviceOrders.data}\n\n${projects.data}\n\n${installations.data}\n\n${dispatches.data}`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch summary data' };
    }
  },

  // Overdue tasks
  async getOverdueTasks(): Promise<DataQueryResult> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, data: '', error: 'User not logged in' };
      }

      const tasks = await tasksApi.getUserDailyTasks(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueTasks = tasks.filter((t: any) => {
        if (!t.dueDate || t.status === 'done' || t.status === 'completed') return false;
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() < today.getTime();
      });

      if (overdueTasks.length === 0) {
        return {
          success: true,
          data: `✅ **Overdue Tasks**: Great news! No overdue tasks found.`
        };
      }

      // Group by how overdue
      const criticallyOverdue = overdueTasks.filter((t: any) => {
        const dueDate = new Date(t.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysOverdue > 7;
      });

      const recentlyOverdue = overdueTasks.filter((t: any) => {
        const dueDate = new Date(t.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysOverdue <= 7;
      });

      const taskList = overdueTasks
        .slice(0, 8)
        .map((t: any) => {
          const dueDate = new Date(t.dueDate);
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const urgency = daysOverdue > 7 ? '🔴' : daysOverdue > 3 ? '🟠' : '🟡';
          return `  - ${urgency} **${t.title}** (${daysOverdue} days overdue)`;
        })
        .join('\n');

      return {
        success: true,
        data: `⚠️ **Overdue Tasks**:\n- Total overdue: **${overdueTasks.length}**\n- Critical (>7 days): **${criticallyOverdue.length}**\n- Recent (≤7 days): **${recentlyOverdue.length}**\n\n${taskList}${overdueTasks.length > 8 ? '\n  ... and more' : ''}`
      };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch overdue tasks' };
    }
  },

  // Expiring warranties
  async getExpiringWarranties(): Promise<DataQueryResult> {
    try {
      const response = await installationsApi.getAll({});
      const installations = response.installations || [];
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
      const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

      // Filter installations with warranties
      const withWarranty = installations.filter((i: any) =>
        i.warrantyExpiry || i.warranty?.warrantyTo
      );

      const expired: any[] = [];
      const expiringSoon: any[] = []; // within 30 days
      const expiringMedium: any[] = []; // 30-60 days
      const expiringLater: any[] = []; // 60-90 days

      withWarranty.forEach((i: any) => {
        const expiryDate = new Date(i.warrantyExpiry || i.warranty?.warrantyTo);
        if (expiryDate < today) {
          expired.push({ ...i, expiryDate });
        } else if (expiryDate <= thirtyDaysFromNow) {
          expiringSoon.push({ ...i, expiryDate });
        } else if (expiryDate <= sixtyDaysFromNow) {
          expiringMedium.push({ ...i, expiryDate });
        } else if (expiryDate <= ninetyDaysFromNow) {
          expiringLater.push({ ...i, expiryDate });
        }
      });

      let result = `🛡️ **Warranty Status Overview**:\n`;
      result += `- Total with warranty: **${withWarranty.length}**\n\n`;

      if (expired.length > 0) {
        result += `🔴 **Expired (${expired.length}):**\n`;
        result += expired.slice(0, 3).map((i: any) =>
          `  - ${i.name || i.installationNumber} (expired ${formatDate(i.expiryDate)})`
        ).join('\n') + '\n\n';
      }

      if (expiringSoon.length > 0) {
        result += `🟠 **Expiring within 30 days (${expiringSoon.length}):**\n`;
        result += expiringSoon.slice(0, 3).map((i: any) =>
          `  - ${i.name || i.installationNumber} (expires ${formatDate(i.expiryDate)})`
        ).join('\n') + '\n\n';
      }

      if (expiringMedium.length > 0) {
        result += `🟡 **Expiring in 30-60 days (${expiringMedium.length}):**\n`;
        result += expiringMedium.slice(0, 3).map((i: any) =>
          `  - ${i.name || i.installationNumber} (expires ${formatDate(i.expiryDate)})`
        ).join('\n') + '\n\n';
      }

      if (expiringLater.length > 0) {
        result += `🟢 **Expiring in 60-90 days (${expiringLater.length}):**\n`;
        result += expiringLater.slice(0, 2).map((i: any) =>
          `  - ${i.name || i.installationNumber} (expires ${formatDate(i.expiryDate)})`
        ).join('\n') + '\n';
      }

      if (expired.length === 0 && expiringSoon.length === 0 && expiringMedium.length === 0 && expiringLater.length === 0) {
        result += `✅ No warranties expiring in the next 90 days!`;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch warranty data' };
    }
  },

  // Monthly revenue trends
  async getMonthlyRevenueTrends(): Promise<DataQueryResult> {
    try {
      const [salesRes, offersRes] = await Promise.all([
        salesApi.getAll({ limit: 1000 }),
        offersApi.getAll({ limit: 1000 })
      ]);

      const sales = salesRes.data?.sales || [];
      const offers = offersRes.data?.offers || [];

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Calculate monthly data for the last 6 months
      const monthlyData: { month: string; salesValue: number; salesCount: number; offersValue: number; offersCount: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentYear, currentMonth - i, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        // Filter sales for this month
        const monthlySales = sales.filter((s: any) => {
          if (!s.createdAt && !s.date) return false;
          const saleDate = new Date(s.createdAt || s.date);
          return saleDate >= monthStart && saleDate <= monthEnd;
        });

        const salesValue = monthlySales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

        // Filter offers for this month
        const monthlyOffers = offers.filter((o: any) => {
          if (!o.createdAt && !o.date) return false;
          const offerDate = new Date(o.createdAt || o.date);
          return offerDate >= monthStart && offerDate <= monthEnd;
        });

        const offersValue = monthlyOffers.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

        monthlyData.push({
          month: monthName,
          salesValue,
          salesCount: monthlySales.length,
          offersValue,
          offersCount: monthlyOffers.length
        });
      }

      // Calculate trends
      const currentMonthData = monthlyData[monthlyData.length - 1];
      const previousMonthData = monthlyData[monthlyData.length - 2];

      let salesTrend = 'stable';
      let salesChange = 0;
      if (previousMonthData && previousMonthData.salesValue > 0) {
        salesChange = ((currentMonthData.salesValue - previousMonthData.salesValue) / previousMonthData.salesValue) * 100;
        salesTrend = salesChange > 5 ? '📈 up' : salesChange < -5 ? '📉 down' : '➡️ stable';
      }

      // Calculate totals
      const totalSalesValue = monthlyData.reduce((sum, m) => sum + m.salesValue, 0);
      const avgMonthlySales = totalSalesValue / 6;

      let result = `📊 **Revenue Trends (Last 6 Months)**:\n\n`;
      result += `**Monthly Breakdown:**\n`;

      monthlyData.forEach(m => {
        const bar = '█'.repeat(Math.min(10, Math.floor(m.salesValue / (avgMonthlySales / 5) || 1)));
        result += `  ${m.month}: ${bar} **${m.salesValue.toLocaleString()} ${getGlobalCurrencyCode()}** (${m.salesCount} sales)\n`;
      });

      result += `\n**Summary:**\n`;
      result += `- Total (6 months): **${totalSalesValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n`;
      result += `- Monthly average: **${Math.round(avgMonthlySales).toLocaleString()} ${getGlobalCurrencyCode()}**\n`;
      result += `- Current trend: ${salesTrend} (${salesChange > 0 ? '+' : ''}${salesChange.toFixed(1)}%)\n`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch revenue data' };
    }
  },

  // Top performing technicians
  async getTopTechnicians(): Promise<DataQueryResult> {
    try {
      const [usersRes, dispatchesRes] = await Promise.all([
        usersApi.getAll(),
        dispatchesApi.getAll({ pageSize: 1000 })
      ]);

      const users = usersRes.users || [];
      const dispatches = dispatchesRes.data || [];

      // Filter technicians
      const technicians = users.filter((u: any) =>
        u.roles?.some((r: any) => r.name?.toLowerCase().includes('technician'))
      );

      if (technicians.length === 0) {
        return {
          success: true,
          data: `👨‍🔧 **Technician Performance**: No technicians found in the system.`
        };
      }

      // Calculate performance metrics for each technician
      const technicianStats = technicians.map((tech: any) => {
        const techId = String(tech.id);
        const techName = `${tech.firstName || ''} ${tech.lastName || ''}`.trim() || tech.email;

        // Get dispatches assigned to this technician
        const techDispatches = dispatches.filter((d: any) =>
          d.assignedTechnicianIds?.includes(techId) ||
          d.technicianId === techId ||
          d.assignedTechnicians?.some((t: any) => String(t.id) === techId)
        );

        const completedDispatches = techDispatches.filter((d: any) => d.status === 'completed');
        const inProgressDispatches = techDispatches.filter((d: any) => d.status === 'in_progress');

        // Calculate completion rate
        const completionRate = techDispatches.length > 0
          ? (completedDispatches.length / techDispatches.length) * 100
          : 0;

        // Get time entries from completed dispatches
        let totalHours = 0;
        completedDispatches.forEach((d: any) => {
          if (d.timeEntries) {
            d.timeEntries.forEach((te: any) => {
              totalHours += te.duration || 0;
            });
          }
        });

        return {
          id: techId,
          name: techName,
          totalDispatches: techDispatches.length,
          completed: completedDispatches.length,
          inProgress: inProgressDispatches.length,
          completionRate,
          totalHours: Math.round(totalHours * 10) / 10
        };
      });

      // Sort by completed dispatches (top performers)
      technicianStats.sort((a, b) => b.completed - a.completed);

      // Get top 5
      const topTechnicians = technicianStats.slice(0, 5);

      let result = `🏆 **Top Performing Technicians**:\n\n`;

      if (topTechnicians.every(t => t.totalDispatches === 0)) {
        result += `No dispatch data available for technicians yet.\n`;
        result += `\n**Team Members (${technicians.length} technicians):**\n`;
        technicians.slice(0, 5).forEach((t: any) => {
          result += `  - ${t.firstName} ${t.lastName}\n`;
        });
      } else {
        topTechnicians.forEach((tech, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
          const rateBar = '█'.repeat(Math.min(10, Math.floor(tech.completionRate / 10)));
          result += `${medal} **${tech.name}**\n`;
          result += `   Completed: **${tech.completed}** | In Progress: ${tech.inProgress} | Total: ${tech.totalDispatches}\n`;
          result += `   Completion Rate: ${rateBar} **${tech.completionRate.toFixed(0)}%**\n\n`;
        });

        // Summary stats
        const totalCompleted = technicianStats.reduce((sum, t) => sum + t.completed, 0);
        const avgCompletionRate = technicianStats.reduce((sum, t) => sum + t.completionRate, 0) / technicianStats.length;

        result += `**Team Summary:**\n`;
        result += `- Total technicians: **${technicians.length}**\n`;
        result += `- Total completed dispatches: **${totalCompleted}**\n`;
        result += `- Average completion rate: **${avgCompletionRate.toFixed(0)}%**\n`;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch technician performance data' };
    }
  },

  // Mark a task as complete by searching for it by name
  async markTaskComplete(taskName: string): Promise<DataQueryResult> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, data: '', error: 'User not logged in' };
      }

      const tasks = await tasksApi.getUserDailyTasks(userId);
      const searchLower = taskName.toLowerCase().trim();

      // Find task by title (partial match)
      const matchedTask = tasks.find((t: any) => {
        const titleLower = (t.title || '').toLowerCase();
        // Exact match or contains
        return titleLower === searchLower ||
          titleLower.includes(searchLower) ||
          searchLower.includes(titleLower);
      });

      if (!matchedTask) {
        // Try fuzzy matching - find best match
        const scoredTasks = tasks
          .filter((t: any) => t.status !== 'done')
          .map((t: any) => {
            const titleLower = (t.title || '').toLowerCase();
            const words = searchLower.split(/\s+/);
            const matchedWords = words.filter(w => titleLower.includes(w));
            return { task: t, score: matchedWords.length / words.length };
          })
          .filter(item => item.score > 0.3)
          .sort((a, b) => b.score - a.score);

        if (scoredTasks.length === 0) {
          // List available tasks to help user
          const pendingTasks = tasks.filter((t: any) => t.status !== 'done').slice(0, 5);
          const taskList = pendingTasks.map((t: any) => `  - ${t.title}`).join('\n');

          return {
            success: true,
            data: `❓ Could not find a task matching "**${taskName}**".\n\n**Your pending tasks:**\n${taskList || '  No pending tasks'}\n\n_Try saying "mark [task name] as done" with the exact name._`
          };
        }

        // Use best fuzzy match
        const bestMatch = scoredTasks[0].task;
        const taskId = Number(bestMatch.id);
        await tasksApi.completeDailyTask(taskId);

        return {
          success: true,
          data: `✅ **Task completed!**\n\n"**${bestMatch.title}**" has been marked as done.\n\n_Great work! Keep it up! 🎉_`
        };
      }

      // Check if already completed
      if (matchedTask.status === 'done') {
        return {
          success: true,
          data: `ℹ️ "**${matchedTask.title}**" is already marked as done! ✅`
        };
      }

      // Mark as complete
      const taskId = Number(matchedTask.id);
      await tasksApi.completeDailyTask(taskId);

      return {
        success: true,
        data: `✅ **Task completed!**\n\n"**${matchedTask.title}**" has been marked as done.\n\n_Great work! Keep it up! 🎉_`
      };
    } catch (error) {
      console.error('Error completing task:', error);
      return { success: false, data: '', error: 'Could not complete the task. Please try again.' };
    }
  },

  // Offer to Sale Conversion Rate
  async getConversionRate(): Promise<DataQueryResult> {
    try {
      const [offersRes, salesRes] = await Promise.all([
        offersApi.getAll({ limit: 1000 }),
        salesApi.getAll({ limit: 1000 })
      ]);

      const offers = offersRes.data?.offers || [];
      const sales = salesRes.data?.sales || [];

      const totalOffers = offers.length;
      const acceptedOffers = offers.filter((o: any) => o.status === 'accepted').length;
      const rejectedOffers = offers.filter((o: any) => o.status === 'rejected').length;
      const pendingOffers = offers.filter((o: any) =>
        o.status === 'sent' || o.status === 'negotiation' || o.status === 'draft'
      ).length;

      const conversionRate = totalOffers > 0 ? (acceptedOffers / totalOffers) * 100 : 0;
      const rejectionRate = totalOffers > 0 ? (rejectedOffers / totalOffers) * 100 : 0;

      // Calculate average offer value
      const avgOfferValue = offers.length > 0
        ? offers.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0) / offers.length
        : 0;

      // Calculate average time to conversion (for accepted offers)
      const acceptedWithDates = offers.filter((o: any) =>
        o.status === 'accepted' && o.createdAt && o.updatedAt
      );
      let avgDaysToConvert = 0;
      if (acceptedWithDates.length > 0) {
        const totalDays = acceptedWithDates.reduce((sum: number, o: any) => {
          const created = new Date(o.createdAt);
          const accepted = new Date(o.updatedAt);
          return sum + Math.floor((accepted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        avgDaysToConvert = Math.round(totalDays / acceptedWithDates.length);
      }

      let result = `📊 **Offer to Sale Conversion Analysis**:\n\n`;
      result += `**Pipeline Overview:**\n`;
      result += `- Total offers: **${totalOffers}**\n`;
      result += `- Accepted (converted): **${acceptedOffers}** (${conversionRate.toFixed(1)}%)\n`;
      result += `- Rejected: **${rejectedOffers}** (${rejectionRate.toFixed(1)}%)\n`;
      result += `- Pending/Active: **${pendingOffers}**\n\n`;

      result += `**Performance Metrics:**\n`;
      result += `- 🎯 Conversion Rate: **${conversionRate.toFixed(1)}%**\n`;
      result += `- 💰 Average Offer Value: **${avgOfferValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n`;
      result += `- ⏱️ Average Days to Convert: **${avgDaysToConvert} days**\n\n`;

      // Recommendations
      if (conversionRate < 30) {
        result += `💡 **Tip**: Your conversion rate is below industry average. Consider following up on pending offers more frequently.`;
      } else if (conversionRate > 60) {
        result += `🌟 **Excellent!** Your conversion rate is above average. Keep up the great work!`;
      } else {
        result += `💡 **Tip**: Good conversion rate. Focus on reducing time to close for even better results.`;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch conversion data' };
    }
  },

  // Pipeline value analysis
  async getPipelineValue(): Promise<DataQueryResult> {
    try {
      const response = await offersApi.getAll({ limit: 1000 });
      const offers = response.data?.offers || [];

      // Group by status and calculate values
      const pipeline = {
        draft: { count: 0, value: 0 },
        sent: { count: 0, value: 0 },
        negotiation: { count: 0, value: 0 },
        accepted: { count: 0, value: 0 },
        rejected: { count: 0, value: 0 },
        expired: { count: 0, value: 0 }
      };

      offers.forEach((o: any) => {
        const status = o.status?.toLowerCase() as keyof typeof pipeline;
        if (pipeline[status]) {
          pipeline[status].count++;
          pipeline[status].value += o.totalAmount || 0;
        }
      });

      // Active pipeline = sent + negotiation
      const activePipelineValue = pipeline.sent.value + pipeline.negotiation.value;
      const activePipelineCount = pipeline.sent.count + pipeline.negotiation.count;

      // Weighted pipeline (probability-based)
      const weightedValue =
        (pipeline.sent.value * 0.3) +
        (pipeline.negotiation.value * 0.6);

      let result = `💰 **Sales Pipeline Analysis**:\n\n`;
      result += `**Active Pipeline:**\n`;
      result += `- Total value: **${activePipelineValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n`;
      result += `- Number of offers: **${activePipelineCount}**\n`;
      result += `- Weighted forecast: **${weightedValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n\n`;

      result += `**By Stage:**\n`;
      result += `  📝 Created: ${pipeline.draft.count} offers (${pipeline.draft.value.toLocaleString()} ${getGlobalCurrencyCode()})\n`;
      result += `  📤 Sent: ${pipeline.sent.count} offers (${pipeline.sent.value.toLocaleString()} ${getGlobalCurrencyCode()})\n`;
      result += `  🤝 Negotiation: ${pipeline.negotiation.count} offers (${pipeline.negotiation.value.toLocaleString()} ${getGlobalCurrencyCode()})\n`;
      result += `  ✅ Accepted: ${pipeline.accepted.count} offers (${pipeline.accepted.value.toLocaleString()} ${getGlobalCurrencyCode()})\n`;
      result += `  ❌ Rejected: ${pipeline.rejected.count} offers (${pipeline.rejected.value.toLocaleString()} ${getGlobalCurrencyCode()})\n`;
      result += `  ⏰ Expired: ${pipeline.expired.count} offers (${pipeline.expired.value.toLocaleString()} ${getGlobalCurrencyCode()})\n`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch pipeline data' };
    }
  },

  // Upcoming maintenance due
  async getUpcomingMaintenance(): Promise<DataQueryResult> {
    try {
      const response = await installationsApi.getAll({});
      const installations = response.installations || [];
      const today = new Date();
      const sevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Filter installations with maintenance schedules
      const withMaintenance = installations.filter((i: any) =>
        i.nextServiceDate || i.nextMaintenanceDate
      );

      const overdue: any[] = [];
      const dueThisWeek: any[] = [];
      const dueThisMonth: any[] = [];

      withMaintenance.forEach((i: any) => {
        const nextDate = new Date(i.nextServiceDate || i.nextMaintenanceDate);
        if (nextDate < today) {
          overdue.push({ ...i, nextDate });
        } else if (nextDate <= sevenDays) {
          dueThisWeek.push({ ...i, nextDate });
        } else if (nextDate <= thirtyDays) {
          dueThisMonth.push({ ...i, nextDate });
        }
      });

      let result = `🔧 **Upcoming Maintenance Schedule**:\n\n`;

      if (overdue.length > 0) {
        result += `🔴 **Overdue Maintenance (${overdue.length}):**\n`;
        overdue.slice(0, 5).forEach((i: any) => {
          const daysOverdue = Math.floor((today.getTime() - i.nextDate.getTime()) / (1000 * 60 * 60 * 24));
          result += `  - ${i.name || i.installationNumber} (${daysOverdue} days overdue)\n`;
        });
        result += '\n';
      }

      if (dueThisWeek.length > 0) {
        result += `🟠 **Due This Week (${dueThisWeek.length}):**\n`;
        dueThisWeek.slice(0, 5).forEach((i: any) => {
          result += `  - ${i.name || i.installationNumber} (${formatDate(i.nextDate)})\n`;
        });
        result += '\n';
      }

      if (dueThisMonth.length > 0) {
        result += `🟡 **Due This Month (${dueThisMonth.length}):**\n`;
        dueThisMonth.slice(0, 5).forEach((i: any) => {
          result += `  - ${i.name || i.installationNumber} (${formatDate(i.nextDate)})\n`;
        });
        result += '\n';
      }

      if (overdue.length === 0 && dueThisWeek.length === 0 && dueThisMonth.length === 0) {
        result += `✅ No maintenance due in the next 30 days!\n`;
      }

      result += `\n📊 **Summary:** ${withMaintenance.length} installations with maintenance schedules`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch maintenance data' };
    }
  },

  // Recent activity feed
  async getRecentActivity(): Promise<DataQueryResult> {
    try {
      const [offersRes, salesRes, serviceOrdersRes, dispatchesRes] = await Promise.all([
        offersApi.getAll({ limit: 10 }),
        salesApi.getAll({ limit: 10 }),
        serviceOrdersApi.getAll({ pageSize: 10 }),
        dispatchesApi.getAll({ pageSize: 10 })
      ]);

      const activities: { type: string; title: string; date: Date; icon: string }[] = [];

      // Add recent offers
      (offersRes.data?.offers || []).forEach((o: any) => {
        if (o.createdAt) {
          activities.push({
            type: 'offer',
            title: `Offer ${o.offerNumber || o.title || 'created'}`,
            date: new Date(o.createdAt),
            icon: '📋'
          });
        }
      });

      // Add recent sales
      (salesRes.data?.sales || []).forEach((s: any) => {
        if (s.createdAt) {
          activities.push({
            type: 'sale',
            title: `Sale ${s.saleNumber || s.title || 'created'}`,
            date: new Date(s.createdAt),
            icon: '💰'
          });
        }
      });

      // Add recent service orders
      (serviceOrdersRes.data?.serviceOrders || []).forEach((so: any) => {
        if (so.createdAt) {
          activities.push({
            type: 'serviceOrder',
            title: `Service Order ${so.orderNumber || 'created'}`,
            date: new Date(so.createdAt),
            icon: '🛠️'
          });
        }
      });

      // Add recent dispatches
      (dispatchesRes.data || []).forEach((d: any) => {
        if (d.createdAt) {
          activities.push({
            type: 'dispatch',
            title: `Dispatch ${d.dispatchNumber || 'scheduled'}`,
            date: new Date(d.createdAt),
            icon: '🚚'
          });
        }
      });

      // Sort by date descending and take top 15
      activities.sort((a, b) => b.date.getTime() - a.date.getTime());
      const recentActivities = activities.slice(0, 15);

      let result = `📰 **Recent Activity Feed**:\n\n`;

      if (recentActivities.length === 0) {
        result += `No recent activity found.\n`;
      } else {
        const now = new Date();
        recentActivities.forEach((a) => {
          const diff = now.getTime() - a.date.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));

          let timeAgo = '';
          if (hours < 1) {
            timeAgo = 'just now';
          } else if (hours < 24) {
            timeAgo = `${hours}h ago`;
          } else if (days < 7) {
            timeAgo = `${days}d ago`;
          } else {
            timeAgo = formatDate(a.date);
          }

          result += `${a.icon} ${a.title} - _${timeAgo}_\n`;
        });
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch recent activity' };
    }
  },

  // Workload analysis by technician
  async getTechnicianWorkload(): Promise<DataQueryResult> {
    try {
      const [usersRes, dispatchesRes] = await Promise.all([
        usersApi.getAll(),
        dispatchesApi.getAll({ pageSize: 1000 })
      ]);

      const users = usersRes.users || [];
      const dispatches = dispatchesRes.data || [];

      // Get technicians
      const technicians = users.filter((u: any) =>
        u.roles?.some((r: any) => r.name?.toLowerCase().includes('technician'))
      );

      if (technicians.length === 0) {
        return { success: true, data: '👨‍🔧 No technicians found in the system.' };
      }

      // Get this week's date range
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const techWorkload = technicians.map((tech: any) => {
        const techId = String(tech.id);
        const techName = `${tech.firstName || ''} ${tech.lastName || ''}`.trim() || tech.email;

        // Get dispatches for this technician this week
        const techDispatches = dispatches.filter((d: any) => {
          const isAssigned = d.assignedTechnicianIds?.includes(techId) ||
            d.technicianId === techId ||
            d.assignedTechnicians?.some((t: any) => String(t.id) === techId);
          if (!isAssigned) return false;

          const dispatchDate = new Date(d.scheduledDate || d.createdAt);
          return dispatchDate >= weekStart && dispatchDate <= weekEnd;
        });

        const pending = techDispatches.filter((d: any) =>
          d.status === 'pending' || d.status === 'assigned' || d.status === 'planned'
        ).length;
        const inProgress = techDispatches.filter((d: any) =>
          d.status === 'in_progress' || d.status === 'on_site' || d.status === 'en_route'
        ).length;
        const completed = techDispatches.filter((d: any) => d.status === 'completed').length;

        // Calculate estimated hours
        const estimatedHours = techDispatches.reduce((sum: number, d: any) =>
          sum + (d.estimatedDuration || d.workloadHours || 2), 0
        );

        return {
          name: techName,
          total: techDispatches.length,
          pending,
          inProgress,
          completed,
          estimatedHours
        };
      });

      // Sort by total workload
      techWorkload.sort((a, b) => b.total - a.total);

      let result = `📊 **Technician Workload This Week**:\n\n`;

      techWorkload.forEach((tw) => {
        const loadIndicator = tw.total > 10 ? '🔴 Heavy' : tw.total > 5 ? '🟡 Moderate' : '🟢 Light';
        result += `**${tw.name}**\n`;
        result += `  ${loadIndicator} | ${tw.total} dispatches | ~${tw.estimatedHours}h estimated\n`;
        result += `  ⏳ Pending: ${tw.pending} | 🔄 Active: ${tw.inProgress} | ✅ Done: ${tw.completed}\n\n`;
      });

      // Team summary
      const totalDispatches = techWorkload.reduce((sum, t) => sum + t.total, 0);
      const avgWorkload = technicians.length > 0 ? Math.round(totalDispatches / technicians.length) : 0;

      result += `**Team Summary:**\n`;
      result += `- Total technicians: ${technicians.length}\n`;
      result += `- Total dispatches this week: ${totalDispatches}\n`;
      result += `- Average per technician: ${avgWorkload}\n`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch workload data' };
    }
  },

  // Customer statistics
  async getCustomerStats(): Promise<DataQueryResult> {
    try {
      const [contactsRes, offersRes, salesRes] = await Promise.all([
        contactsApi.getAll({ pageSize: 1000 }),
        offersApi.getAll({ limit: 1000 }),
        salesApi.getAll({ limit: 1000 })
      ]);

      const contacts = contactsRes.contacts || [];
      const offers = offersRes.data?.offers || [];
      const sales = salesRes.data?.sales || [];

      // Count by type
      const byType = contacts.reduce((acc: Record<string, number>, c: any) => {
        const type = c.type || c.contactType || 'individual';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Count active customers (have at least one sale)
      const customerWithSales = new Set(sales.map((s: any) => s.contactId));
      const activeCustomers = customerWithSales.size;

      // Top customers by revenue
      const customerRevenue: Record<string, { name: string; total: number; count: number }> = {};
      sales.forEach((s: any) => {
        const id = s.contactId || 'unknown';
        const name = s.contactName || `Contact #${id}`;
        if (!customerRevenue[id]) {
          customerRevenue[id] = { name, total: 0, count: 0 };
        }
        customerRevenue[id].total += s.totalAmount || 0;
        customerRevenue[id].count++;
      });

      const topCustomers = Object.values(customerRevenue)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      let result = `👥 **Customer Statistics**:\n\n`;
      result += `**Overview:**\n`;
      result += `- Total contacts: **${contacts.length}**\n`;
      result += `- Active customers (with sales): **${activeCustomers}**\n\n`;

      result += `**By Type:**\n`;
      Object.entries(byType).forEach(([type, count]) => {
        result += `  - ${type}: ${count}\n`;
      });

      if (topCustomers.length > 0) {
        result += `\n🏆 **Top Customers by Revenue:**\n`;
        topCustomers.forEach((c, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
          result += `${medal} **${c.name}**: ${c.total.toLocaleString()} ${getGlobalCurrencyCode()} (${c.count} orders)\n`;
        });
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch customer statistics' };
    }
  },

  // Low stock alerts
  async getLowStockAlerts(): Promise<DataQueryResult> {
    try {
      const response = await articlesApi.getAll({ limit: 1000 });
      const articles = response.data || response;
      const allArticles = Array.isArray(articles) ? articles : [];

      // Filter materials with stock tracking
      const materials = allArticles.filter((a: any) =>
        a.type === 'material' && (a.stockLevel !== undefined || a.quantity !== undefined)
      );

      const outOfStock: any[] = [];
      const lowStock: any[] = [];
      const wellStocked: any[] = [];

      materials.forEach((m: any) => {
        const stock = m.stockLevel ?? m.quantity ?? 0;
        const reorderPoint = m.reorderPoint ?? m.minStock ?? 5;

        if (stock === 0) {
          outOfStock.push({ ...m, stock, reorderPoint });
        } else if (stock <= reorderPoint) {
          lowStock.push({ ...m, stock, reorderPoint });
        } else {
          wellStocked.push({ ...m, stock, reorderPoint });
        }
      });

      let result = `📦 **Inventory Stock Status**:\n\n`;

      if (outOfStock.length > 0) {
        result += `🔴 **Out of Stock (${outOfStock.length}):**\n`;
        outOfStock.slice(0, 5).forEach((m: any) => {
          result += `  - ${m.name || m.sku} (Ref: ${m.sku || 'N/A'})\n`;
        });
        if (outOfStock.length > 5) {
          result += `  ... and ${outOfStock.length - 5} more\n`;
        }
        result += '\n';
      }

      if (lowStock.length > 0) {
        result += `🟠 **Low Stock (${lowStock.length}):**\n`;
        lowStock.slice(0, 5).forEach((m: any) => {
          result += `  - ${m.name || m.sku}: ${m.stock} (min: ${m.reorderPoint})\n`;
        });
        if (lowStock.length > 5) {
          result += `  ... and ${lowStock.length - 5} more\n`;
        }
        result += '\n';
      }

      result += `**Summary:**\n`;
      result += `- Total materials tracked: ${materials.length}\n`;
      result += `- Out of stock: ${outOfStock.length}\n`;
      result += `- Low stock: ${lowStock.length}\n`;
      result += `- Well stocked: ${wellStocked.length}\n`;

      if (outOfStock.length > 0 || lowStock.length > 0) {
        result += `\n💡 **Action needed**: Review and reorder items that are out of stock or low.`;
      } else {
        result += `\n✅ All items are well stocked!`;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch stock data' };
    }
  },

  // Weekly performance summary
  async getWeeklyPerformance(): Promise<DataQueryResult> {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const [offersRes, salesRes, dispatchesRes] = await Promise.all([
        offersApi.getAll({ limit: 1000 }),
        salesApi.getAll({ limit: 1000 }),
        dispatchesApi.getAll({ pageSize: 1000 })
      ]);

      const offers = offersRes.data?.offers || [];
      const sales = salesRes.data?.sales || [];
      const dispatches = dispatchesRes.data || [];

      // Filter this week's data
      const weekOffers = offers.filter((o: any) => {
        const date = new Date(o.createdAt);
        return date >= weekStart;
      });

      const weekSales = sales.filter((s: any) => {
        const date = new Date(s.createdAt);
        return date >= weekStart;
      });

      const weekDispatches = dispatches.filter((d: any) => {
        const date = new Date(d.scheduledDate || d.createdAt);
        return date >= weekStart;
      });

      // Calculate metrics
      const newOffers = weekOffers.length;
      const offersValue = weekOffers.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

      const newSales = weekSales.length;
      const salesValue = weekSales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

      const completedDispatches = weekDispatches.filter((d: any) => d.status === 'completed').length;
      const totalWeekDispatches = weekDispatches.length;
      const completionRate = totalWeekDispatches > 0
        ? (completedDispatches / totalWeekDispatches) * 100
        : 0;

      let result = `📅 **This Week's Performance Summary**:\n`;
      result += `_Week of ${formatDate(weekStart)}_\n\n`;

      result += `**📋 Offers:**\n`;
      result += `- New offers created: **${newOffers}**\n`;
      result += `- Total value: **${offersValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n\n`;

      result += `**💰 Sales:**\n`;
      result += `- New sales: **${newSales}**\n`;
      result += `- Revenue: **${salesValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n\n`;

      result += `**🚚 Field Operations:**\n`;
      result += `- Dispatches scheduled: **${totalWeekDispatches}**\n`;
      result += `- Completed: **${completedDispatches}**\n`;
      result += `- Completion rate: **${completionRate.toFixed(0)}%**\n\n`;

      // Performance indicators
      const performanceEmoji = completionRate >= 80 ? '🌟' : completionRate >= 60 ? '👍' : '📈';
      result += `${performanceEmoji} **Overall**: `;
      if (completionRate >= 80) {
        result += `Excellent week! Great job keeping up with field operations.`;
      } else if (completionRate >= 60) {
        result += `Good progress this week. Keep pushing to complete pending dispatches.`;
      } else {
        result += `There's room for improvement. Focus on clearing the pending dispatch queue.`;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch weekly performance data' };
    }
  },

  // Dynamic Forms queries
  async getDynamicFormsStats(): Promise<DataQueryResult> {
    try {
      const forms = await dynamicFormsService.getAll();

      const byStatus = forms.reduce((acc: Record<string, number>, f: any) => {
        acc[f.status] = (acc[f.status] || 0) + 1;
        return acc;
      }, {});

      const statusBreakdown = Object.entries(byStatus)
        .map(([status, count]) => `  - ${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`)
        .join('\n');

      const activeForms = forms.filter((f: any) => f.status === 'active');

      let result = `📋 **Dynamic Forms Overview**:\n- Total forms: **${forms.length}**\n- Active forms: **${activeForms.length}**\n\n**By Status:**\n${statusBreakdown}\n\n`;

      if (activeForms.length > 0) {
        result += `**Active Forms:**\n`;
        activeForms.slice(0, 5).forEach((form: any) => {
          result += `  - 📝 **${form.name_en}** (ID: ${form.id})\n    [View Form](/dashboard/settings/dynamic-forms/${form.id}/preview)\n`;
        });
        if (activeForms.length > 5) {
          result += `\n  _... and ${activeForms.length - 5} more active forms_`;
        }
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch dynamic forms data' };
    }
  },

  async getDynamicFormsList(): Promise<DataQueryResult> {
    try {
      const forms = await dynamicFormsService.getAll();

      if (forms.length === 0) {
        return {
          success: true,
          data: `📋 **Dynamic Forms**:\n\n_No forms available yet._\n\nYou can create a new form at [Dynamic Forms Settings](/dashboard/settings/dynamic-forms).`
        };
      }

      let result = `📋 **Available Dynamic Forms (${forms.length} total)**:\n\n`;

      forms.forEach((form: any) => {
        const statusIcon = form.status === 'active' ? '✅' : form.status === 'draft' ? '📝' : '📦';
        result += `${statusIcon} **${form.name_en}** | _${form.name_fr}_\n`;
        result += `   Status: ${form.status} | ID: ${form.id}\n`;
        if (form.description_en) {
          result += `   _${form.description_en.slice(0, 100)}${form.description_en.length > 100 ? '...' : ''}_\n`;
        }
        result += `   🔗 [Preview](/dashboard/settings/dynamic-forms/${form.id}/preview) | [Edit](/dashboard/settings/dynamic-forms/${form.id})\n\n`;
      });

      result += `\n📥 _To download a form, open its preview and click the download button._`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch dynamic forms list' };
    }
  },

  async searchDynamicForm(searchTerm: string): Promise<DataQueryResult> {
    try {
      const forms = await dynamicFormsService.getAll({ search: searchTerm });

      if (forms.length === 0) {
        // Try searching with the full name match
        const allForms = await dynamicFormsService.getAll();
        const searchLower = searchTerm.toLowerCase();
        const matchedForms = allForms.filter((f: any) =>
          f.name_en?.toLowerCase().includes(searchLower) ||
          f.name_fr?.toLowerCase().includes(searchLower) ||
          f.description_en?.toLowerCase().includes(searchLower) ||
          f.description_fr?.toLowerCase().includes(searchLower) ||
          f.category?.toLowerCase().includes(searchLower)
        );

        if (matchedForms.length === 0) {
          return {
            success: true,
            data: `🔍 **Form Search Results for "${searchTerm}"**:\n\n_No forms found matching your search._\n\nTry different keywords or [browse all forms](/dashboard/settings/dynamic-forms).`
          };
        }

        // Format results inline
        let result = `🔍 **Form Search Results for "${searchTerm}" (${matchedForms.length} found)**:\n\n`;
        matchedForms.forEach((form: any) => {
          const statusIcon = form.status === 'active' ? '✅' : form.status === 'draft' ? '📝' : '📦';
          result += `${statusIcon} **${form.name_en}**\n`;
          if (form.description_en) {
            result += `   _${form.description_en.slice(0, 100)}${form.description_en.length > 100 ? '...' : ''}_\n`;
          }
          result += `   🔗 [Preview](/dashboard/settings/dynamic-forms/${form.id}/preview) | [Edit](/dashboard/settings/dynamic-forms/${form.id})\n\n`;
        });
        return { success: true, data: result };
      }

      // Format results inline
      let result = `🔍 **Form Search Results for "${searchTerm}" (${forms.length} found)**:\n\n`;
      forms.forEach((form: any) => {
        const statusIcon = form.status === 'active' ? '✅' : form.status === 'draft' ? '📝' : '📦';
        result += `${statusIcon} **${form.name_en}**\n`;
        if (form.description_en) {
          result += `   _${form.description_en.slice(0, 100)}${form.description_en.length > 100 ? '...' : ''}_\n`;
        }
        result += `   🔗 [Preview](/dashboard/settings/dynamic-forms/${form.id}/preview) | [Edit](/dashboard/settings/dynamic-forms/${form.id})\n\n`;
      });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not search dynamic forms' };
    }
  },

  async getActiveFormsForUse(): Promise<DataQueryResult> {
    try {
      // Fetch all forms and filter by active status (avoid type issue)
      const allForms = await dynamicFormsService.getAll();
      const forms = allForms.filter((f: any) => f.status === 'active');
      if (forms.length === 0) {
        return {
          success: true,
          data: `📋 **Active Forms Ready to Use**:\n\n_No active forms available._\n\nGo to [Dynamic Forms Settings](/dashboard/settings/dynamic-forms) to create and publish forms.`
        };
      }

      let result = `📋 **Active Forms Ready to Use (${forms.length})**:\n\n`;

      forms.forEach((form: any, index: number) => {
        result += `**${index + 1}. ${form.name_en}**\n`;
        if (form.name_fr && form.name_fr !== form.name_en) {
          result += `   _FR: ${form.name_fr}_\n`;
        }
        if (form.description_en) {
          result += `   ${form.description_en.slice(0, 120)}${form.description_en.length > 120 ? '...' : ''}\n`;
        }
        result += `   📄 [Open Form](/dashboard/settings/dynamic-forms/${form.id}/preview) | 📥 [Download PDF](/dashboard/settings/dynamic-forms/${form.id}/preview)\n\n`;
      });

      result += `\n💡 _Click "Open Form" to preview, fill, or download any form._`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch active forms' };
    }
  },

  // Get notifications summary
  async getNotificationsSummary(): Promise<DataQueryResult> {
    try {
      const notifications = await notificationsApi.fetchAll();
      const unreadCount = notifications.filter(n => !n.read).length;
      const totalCount = notifications.length;

      // Group by category
      const byCategory = notifications.reduce((acc: Record<string, number>, n) => {
        acc[n.category] = (acc[n.category] || 0) + 1;
        return acc;
      }, {});

      // Group by type
      const byType = notifications.reduce((acc: Record<string, number>, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {});

      let result = `🔔 **Notifications Summary**:\n\n`;
      result += `**Overview:**\n`;
      result += `- Total notifications: **${totalCount}**\n`;
      result += `- Unread: **${unreadCount}**\n\n`;

      if (Object.keys(byCategory).length > 0) {
        result += `**By Category:**\n`;
        Object.entries(byCategory).forEach(([cat, count]) => {
          const icon = cat === 'sale' ? '💰' : cat === 'offer' ? '📋' : cat === 'service_order' ? '🛠️' : cat === 'task' ? '📝' : '📢';
          result += `  ${icon} ${cat.replace('_', ' ')}: ${count}\n`;
        });
        result += '\n';
      }

      if (Object.keys(byType).length > 0) {
        result += `**By Type:**\n`;
        Object.entries(byType).forEach(([type, count]) => {
          const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'message' ? '💬' : 'ℹ️';
          result += `  ${icon} ${type}: ${count}\n`;
        });
      }

      // Show recent unread
      const recentUnread = notifications.filter(n => !n.read).slice(0, 5);
      if (recentUnread.length > 0) {
        result += `\n**Recent Unread:**\n`;
        recentUnread.forEach(n => {
          result += `  - ${n.title} (${n.time})\n`;
        });
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch notifications' };
    }
  },

  // Search contacts by name
  async searchContacts(searchTerm: string): Promise<DataQueryResult> {
    try {
      const response = await contactsApi.getAll({ pageSize: 1000 });
      const contacts = response.contacts || [];
      const searchLower = searchTerm.toLowerCase();

      const matched = contacts.filter((c: any) => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        const company = (c.companyName || c.company || '').toLowerCase();
        const phone = (c.phone || c.phoneNumber || '').toLowerCase();
        return fullName.includes(searchLower) ||
          email.includes(searchLower) ||
          company.includes(searchLower) ||
          phone.includes(searchLower);
      });

      if (matched.length === 0) {
        return {
          success: true,
          data: `🔍 **Contact Search for "${searchTerm}"**:\n\n_No contacts found matching your search._\n\n[View all contacts](/dashboard/contacts)`
        };
      }

      let result = `🔍 **Contact Search Results for "${searchTerm}" (${matched.length} found)**:\n\n`;

      matched.slice(0, 10).forEach((c: any) => {
        const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed';
        const typeIcon = c.type === 'company' ? '🏢' : '👤';
        result += `${typeIcon} **${name}**\n`;
        if (c.email) result += `   📧 ${c.email}\n`;
        if (c.phone || c.phoneNumber) result += `   📱 ${c.phone || c.phoneNumber}\n`;
        if (c.companyName || c.company) result += `   🏢 ${c.companyName || c.company}\n`;
        result += `   🔗 [View Contact](/dashboard/contacts/${c.id})\n\n`;
      });

      if (matched.length > 10) {
        result += `_... and ${matched.length - 10} more results_\n`;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not search contacts' };
    }
  },

  // Search articles by name/SKU
  async searchArticles(searchTerm: string): Promise<DataQueryResult> {
    try {
      const response = await articlesApi.getAll({ search: searchTerm, limit: 100 });
      const articles = response.data || [];

      if (articles.length === 0) {
        // Try broader search
        const allResponse = await articlesApi.getAll({ limit: 1000 });
        const allArticles = allResponse.data || [];
        const searchLower = searchTerm.toLowerCase();

        const matched = allArticles.filter((a: any) =>
          (a.name || '').toLowerCase().includes(searchLower) ||
          (a.sku || '').toLowerCase().includes(searchLower) ||
          (a.description || '').toLowerCase().includes(searchLower)
        );

        if (matched.length === 0) {
          return {
            success: true,
            data: `🔍 **Article Search for "${searchTerm}"**:\n\n_No articles found matching your search._\n\n[View all articles](/dashboard/articles)`
          };
        }

        return formatArticleResults(matched, searchTerm);
      }

      return formatArticleResults(articles, searchTerm);
    } catch (error) {
      return { success: false, data: '', error: 'Could not search articles' };
    }
  },

  // Get roles and permissions overview
  async getRolesOverview(): Promise<DataQueryResult> {
    try {
      const roles = await rolesApi.getAll();

      if (roles.length === 0) {
        return {
          success: true,
          data: `👔 **Roles & Permissions**:\n\n_No roles defined yet._\n\n[Manage Roles](/dashboard/settings/users)`
        };
      }

      let result = `👔 **Roles & Permissions Overview**:\n\n`;
      result += `**Total roles: ${roles.length}**\n\n`;

      roles.forEach((role: any) => {
        const permCount = role.permissions?.length || 0;
        result += `**${role.name}**\n`;
        if (role.description) result += `  _${role.description}_\n`;
        result += `  Permissions: ${permCount}\n\n`;
      });

      result += `[Manage Roles](/dashboard/settings/users)`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch roles' };
    }
  },

  // Get currencies list
  async getCurrencies(): Promise<DataQueryResult> {
    try {
      const response = await currenciesApi.getAll();
      const currencies = response.currencies || [];

      if (currencies.length === 0) {
        return {
          success: true,
          data: `💱 **Currencies**:\n\n_No currencies configured._\n\n[Manage Currencies](/dashboard/settings/lookups)`
        };
      }

      let result = `💱 **Available Currencies (${currencies.length})**:\n\n`;

      currencies.forEach((c: any) => {
        const defaultBadge = c.isDefault ? ' ⭐ (Default)' : '';
        const activeStatus = c.isActive ? '✅' : '❌';
        result += `${activeStatus} **${c.code}** - ${c.name} (${c.symbol})${defaultBadge}\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch currencies' };
    }
  },

  // Get priorities list
  async getPrioritiesList(): Promise<DataQueryResult> {
    try {
      const response = await prioritiesApi.getAll();
      const priorities = response.items || [];

      if (priorities.length === 0) {
        return {
          success: true,
          data: `🎯 **Priorities**:\n\n_No priorities configured. Using default priorities._`
        };
      }

      let result = `🎯 **Priority Levels (${priorities.length})**:\n\n`;

      priorities.forEach((p: any) => {
        const color = p.color ? `🔸` : '⚪';
        result += `${color} **${p.name}**${p.description ? ` - ${p.description}` : ''}\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch priorities' };
    }
  },

  // Get leave types
  async getLeaveTypes(): Promise<DataQueryResult> {
    try {
      const response = await leaveTypesApi.getAll();
      const leaveTypes = response.items || [];

      if (leaveTypes.length === 0) {
        return {
          success: true,
          data: `🏖️ **Leave Types**:\n\n_No leave types configured._\n\n[Manage Leave Types](/dashboard/settings/lookups)`
        };
      }

      let result = `🏖️ **Leave Types (${leaveTypes.length})**:\n\n`;

      leaveTypes.forEach((lt: any) => {
        const paidStatus = lt.isPaid ? '💰 Paid' : '📋 Unpaid';
        const maxDays = lt.maxDays ? ` (Max: ${lt.maxDays} days)` : '';
        result += `- **${lt.name}** - ${paidStatus}${maxDays}\n`;
        if (lt.description) result += `  _${lt.description}_\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch leave types' };
    }
  },

  // Get skills list
  async getSkillsList(): Promise<DataQueryResult> {
    try {
      const response = await skillsLookupApi.getAll();
      const skills = response.items || [];

      if (skills.length === 0) {
        return {
          success: true,
          data: `🔧 **Skills**:\n\n_No skills defined yet._\n\n[Manage Skills](/dashboard/settings/lookups)`
        };
      }

      let result = `🔧 **Available Skills (${skills.length})**:\n\n`;

      // Group by category if available
      const byCategory: Record<string, any[]> = {};
      skills.forEach((s: any) => {
        const cat = s.category || 'General';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(s);
      });

      Object.entries(byCategory).forEach(([cat, catSkills]) => {
        result += `**${cat}:**\n`;
        catSkills.forEach((s: any) => {
          result += `  - ${s.name}\n`;
        });
        result += '\n';
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch skills' };
    }
  },

  // Get locations list
  async getLocationsList(): Promise<DataQueryResult> {
    try {
      const response = await locationsApi.getAll();
      const locations = response.items || [];

      if (locations.length === 0) {
        return {
          success: true,
          data: `📍 **Locations**:\n\n_No locations defined yet._\n\n[Manage Locations](/dashboard/settings/lookups)`
        };
      }

      let result = `📍 **Locations (${locations.length})**:\n\n`;

      locations.forEach((l: any) => {
        const activeStatus = l.isActive !== false ? '✅' : '❌';
        result += `${activeStatus} **${l.name}**\n`;
        if (l.description) result += `   _${l.description}_\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch locations' };
    }
  },

  // Get user details by name
  async getUserDetails(searchName: string): Promise<DataQueryResult> {
    try {
      const response = await usersApi.getAll();
      const users = response.users || [];
      const searchLower = searchName.toLowerCase();

      const matched = users.filter((u: any) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower);
      });

      if (matched.length === 0) {
        return {
          success: true,
          data: `👤 **User Search for "${searchName}"**:\n\n_No users found._`
        };
      }

      let result = `👤 **User Details for "${searchName}" (${matched.length} found)**:\n\n`;

      for (const user of matched.slice(0, 5)) {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        result += `**${fullName}**\n`;
        result += `  📧 ${user.email}\n`;
        if (user.phoneNumber) result += `  📱 ${user.phoneNumber}\n`;

        // Get roles
        const roleNames = (user.roles || []).map((r: any) => r.name).join(', ');
        if (roleNames) result += `  👔 Roles: ${roleNames}\n`;

        // Get schedule if available
        try {
          const schedule = await schedulesApi.getSchedule(user.id);
          if (schedule.status) {
            result += `  📊 Status: ${schedule.status}\n`;
          }
        } catch { }

        result += '\n';
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch user details' };
    }
  },

  // Get offer details by number
  async getOfferDetails(offerNumber: string): Promise<DataQueryResult> {
    try {
      const response = await offersApi.getAll({ limit: 1000 });
      const offers = response.data?.offers || [];
      const searchLower = offerNumber.toLowerCase();

      const matched = offers.filter((o: any) =>
        (o.offerNumber || '').toLowerCase().includes(searchLower) ||
        (o.title || '').toLowerCase().includes(searchLower)
      );

      if (matched.length === 0) {
        return {
          success: true,
          data: `📋 **Offer Search for "${offerNumber}"**:\n\n_No offers found._\n\n[View all offers](/dashboard/offers)`
        };
      }

      let result = `📋 **Offer Details for "${offerNumber}" (${matched.length} found)**:\n\n`;

      matched.slice(0, 5).forEach((o: any) => {
        const statusIcon = o.status === 'accepted' ? '✅' : o.status === 'rejected' ? '❌' : o.status === 'sent' ? '📤' : '📝';
        result += `${statusIcon} **${o.offerNumber || o.title}**\n`;
        result += `   Status: ${o.status} | Amount: ${(o.totalAmount || 0).toLocaleString()} ${getGlobalCurrencyCode()}\n`;
        if (o.contactName) result += `   Customer: ${o.contactName}\n`;
        if (o.createdAt) result += `   Created: ${formatDate(new Date(o.createdAt))}\n`;
        result += `   🔗 [View Offer](/dashboard/offers/${o.id})\n\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch offer details' };
    }
  },

  // Get sale details by number
  async getSaleDetails(saleNumber: string): Promise<DataQueryResult> {
    try {
      const response = await salesApi.getAll({ limit: 1000 });
      const sales = response.data?.sales || [];
      const searchLower = saleNumber.toLowerCase();

      const matched = sales.filter((s: any) =>
        (s.saleNumber || '').toLowerCase().includes(searchLower) ||
        (s.title || '').toLowerCase().includes(searchLower)
      );

      if (matched.length === 0) {
        return {
          success: true,
          data: `💰 **Sale Search for "${saleNumber}"**:\n\n_No sales found._\n\n[View all sales](/dashboard/sales)`
        };
      }

      let result = `💰 **Sale Details for "${saleNumber}" (${matched.length} found)**:\n\n`;

      matched.slice(0, 5).forEach((s: any) => {
        const statusIcon = s.status === 'completed' ? '✅' : s.status === 'cancelled' ? '❌' : '🔄';
        result += `${statusIcon} **${s.saleNumber || s.title}**\n`;
        result += `   Status: ${s.status} | Amount: ${(s.totalAmount || 0).toLocaleString()} ${getGlobalCurrencyCode()}\n`;
        if (s.contactName) result += `   Customer: ${s.contactName}\n`;
        if (s.createdAt) result += `   Created: ${formatDate(new Date(s.createdAt))}\n`;
        result += `   🔗 [View Sale](/dashboard/sales/${s.id})\n\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch sale details' };
    }
  },

  // Get project details
  async searchProjects(searchTerm: string): Promise<DataQueryResult> {
    try {
      const response = await projectsApi.getAll({ searchTerm });
      const projects = response.projects || [];

      if (projects.length === 0) {
        return {
          success: true,
          data: `📊 **Project Search for "${searchTerm}"**:\n\n_No projects found._\n\n[View all projects](/dashboard/tasks/projects)`
        };
      }

      let result = `📊 **Project Search Results for "${searchTerm}" (${projects.length} found)**:\n\n`;

      projects.slice(0, 5).forEach((p: any) => {
        const statusIcon = p.status === 'completed' ? '✅' : p.status === 'active' ? '🔄' : p.status === 'on_hold' ? '⏸️' : '📝';
        result += `${statusIcon} **${p.name}**\n`;
        result += `   Status: ${p.status} | Progress: ${p.progress || 0}%\n`;
        if (p.ownerName) result += `   Owner: ${p.ownerName}\n`;
        if (p.stats) {
          result += `   Tasks: ${p.stats.completedTasks}/${p.stats.totalTasks} completed\n`;
        }
        result += `   🔗 [View Project](/dashboard/tasks/projects/${p.id})\n\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not search projects' };
    }
  },

  // Get deal details
  async searchDeals(searchTerm: string): Promise<DataQueryResult> {
    try {
      const response = await dealsApi.getAll({ search: searchTerm });
      const deals = response.deals || [];

      if (deals.length === 0) {
        return {
          success: true,
          data: `🤝 **Deal Search for "${searchTerm}"**:\n\n_No deals found._\n\n[View all deals](/dashboard/deals)`
        };
      }

      let result = `🤝 **Deal Search Results for "${searchTerm}" (${deals.length} found)**:\n\n`;

      deals.slice(0, 5).forEach((d: any) => {
        const stageIcon = d.stage === 'won' ? '✅' : d.stage === 'lost' ? '❌' : d.stage === 'negotiation' ? '🤝' : d.stage === 'proposal' ? '📄' : '🔍';
        const currency = d.currency || 'TND';
        result += `${stageIcon} **${d.title}**${d.dealNumber ? ` (${d.dealNumber})` : ''}\n`;
        result += `   Stage: ${d.stage} | Value: ${(Number(d.estimatedValue) || 0).toLocaleString()} ${currency} | Probability: ${d.probability ?? 0}%\n`;
        if (d.contactName) result += `   Contact: ${d.contactName}\n`;
        if (d.expectedCloseDate) result += `   Expected close: ${new Date(d.expectedCloseDate).toLocaleDateString()}\n`;
        result += `   🔗 [View Deal](/dashboard/deals/${d.id})\n\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not search deals' };
    }
  },

  // Get installation details
  async searchInstallations(searchTerm: string): Promise<DataQueryResult> {
    try {
      const response = await installationsApi.getAll({ search: searchTerm });
      const installations = response.installations || [];

      if (installations.length === 0) {
        return {
          success: true,
          data: `🔧 **Installation Search for "${searchTerm}"**:\n\n_No installations found._\n\n[View all installations](/dashboard/service/installations)`
        };
      }

      let result = `🔧 **Installation Search Results for "${searchTerm}" (${installations.length} found)**:\n\n`;

      installations.slice(0, 5).forEach((i: any) => {
        const statusIcon = i.status === 'operational' ? '✅' : i.status === 'maintenance' ? '🔧' : '⚠️';
        result += `${statusIcon} **${i.name || i.installationNumber}**\n`;
        if (i.type) result += `   Type: ${i.type}\n`;
        if (i.location || i.address) result += `   Location: ${i.location || i.address}\n`;
        if (i.warrantyEndDate) {
          const warranty = new Date(i.warrantyEndDate);
          const isExpired = warranty < new Date();
          result += `   Warranty: ${formatDate(warranty)} ${isExpired ? '(Expired)' : ''}\n`;
        }
        result += `   🔗 [View Installation](/dashboard/service/installations/${i.id})\n\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not search installations' };
    }
  },

  // Get service order details
  async searchServiceOrders(searchTerm: string): Promise<DataQueryResult> {
    try {
      const response = await serviceOrdersApi.getAll({ pageSize: 1000 });
      const orders = response.data?.serviceOrders || [];
      const searchLower = searchTerm.toLowerCase();

      const matched = orders.filter((o: any) =>
        (o.orderNumber || '').toLowerCase().includes(searchLower) ||
        (o.title || '').toLowerCase().includes(searchLower) ||
        (o.description || '').toLowerCase().includes(searchLower)
      );

      if (matched.length === 0) {
        return {
          success: true,
          data: `🛠️ **Service Order Search for "${searchTerm}"**:\n\n_No service orders found._\n\n[View all service orders](/dashboard/service/orders)`
        };
      }

      let result = `🛠️ **Service Order Search Results for "${searchTerm}" (${matched.length} found)**:\n\n`;

      matched.slice(0, 5).forEach((o: any) => {
        const statusIcon = o.status === 'completed' ? '✅' : o.status === 'in_progress' ? '🔄' : o.status === 'planned' ? '📅' : '📝';
        result += `${statusIcon} **${o.orderNumber || o.title}**\n`;
        result += `   Status: ${o.status?.replace('_', ' ')}\n`;
        if (o.contactName) result += `   Customer: ${o.contactName}\n`;
        if (o.priority) result += `   Priority: ${o.priority}\n`;
        result += `   🔗 [View Order](/dashboard/service/orders/${o.id})\n\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not search service orders' };
    }
  },

  // Today's summary - comprehensive overview
  async getTodaySummary(): Promise<DataQueryResult> {
    try {
      const userId = getCurrentUserId();
      const today = new Date();

      // Parallel fetch all data
      const [tasksData, dispatchesRes, offersRes, salesRes, notificationsData] = await Promise.all([
        userId ? tasksApi.getUserDailyTasks(userId) : Promise.resolve([]),
        dispatchesApi.getAll({ pageSize: 1000 }),
        offersApi.getAll({ limit: 100 }),
        salesApi.getAll({ limit: 100 }),
        notificationsApi.fetchAll()
      ]);

      // Today's tasks
      today.setHours(0, 0, 0, 0);
      const todayTasks = (tasksData as any[]).filter((t: any) => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      });
      const pendingTasks = todayTasks.filter((t: any) => t.status !== 'done').length;

      // Today's dispatches
      const todayDispatches = (dispatchesRes.data || []).filter((d: any) => {
        if (!d.scheduledDate) return false;
        const dispDate = new Date(d.scheduledDate);
        dispDate.setHours(0, 0, 0, 0);
        return dispDate.getTime() === today.getTime();
      });

      // Unread notifications
      const unreadNotifications = notificationsData.filter(n => !n.read).length;

      // Recent offers/sales
      const recentOffers = (offersRes.data?.offers || []).slice(0, 5);
      const recentSales = (salesRes.data?.sales || []).slice(0, 5);

      let result = `☀️ **Good ${getTimeOfDay()}! Here's your summary for ${formatDate(today)}**:\n\n`;

      result += `📋 **Today's Focus:**\n`;
      result += `  - Tasks: **${pendingTasks} pending** of ${todayTasks.length} scheduled\n`;
      result += `  - Dispatches: **${todayDispatches.length}** scheduled\n`;
      result += `  - Unread notifications: **${unreadNotifications}**\n\n`;

      if (pendingTasks > 0) {
        result += `🎯 **Pending Tasks:**\n`;
        todayTasks.filter((t: any) => t.status !== 'done').slice(0, 3).forEach((t: any) => {
          const priority = t.priority === 'urgent' ? '🚨' : t.priority === 'high' ? '🔴' : '🟡';
          result += `  ${priority} ${t.title}\n`;
        });
        result += '\n';
      }

      if (todayDispatches.length > 0) {
        result += `🚚 **Today's Dispatches:**\n`;
        todayDispatches.slice(0, 3).forEach((d: any) => {
          result += `  - ${d.dispatchNumber || 'Dispatch'} (${d.status})\n`;
        });
        result += '\n';
      }

      result += `💡 _Need more details? Ask me about specific areas like "show my tasks" or "today's dispatches"._`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch today\'s summary' };
    }
  },

  // Business metrics overview
  async getBusinessMetrics(): Promise<DataQueryResult> {
    try {
      const [offersRes, salesRes, contactsRes, dispatchesRes] = await Promise.all([
        offersApi.getAll({ limit: 1000 }),
        salesApi.getAll({ limit: 1000 }),
        contactsApi.getAll({ pageSize: 1 }),
        dispatchesApi.getAll({ pageSize: 1000 })
      ]);

      const offers = offersRes.data?.offers || [];
      const sales = salesRes.data?.sales || [];
      const totalContacts = contactsRes.totalCount || 0;
      const dispatches = dispatchesRes.data || [];

      // Calculate metrics
      const totalOfferValue = offers.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      const totalSalesValue = sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
      const avgOfferValue = offers.length > 0 ? totalOfferValue / offers.length : 0;
      const avgSaleValue = sales.length > 0 ? totalSalesValue / sales.length : 0;

      const completedDispatches = dispatches.filter((d: any) => d.status === 'completed').length;
      const dispatchCompletionRate = dispatches.length > 0 ? (completedDispatches / dispatches.length) * 100 : 0;

      // This month's data
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisMonthSales = sales.filter((s: any) => new Date(s.createdAt) >= monthStart);
      const thisMonthRevenue = thisMonthSales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

      let result = `📈 **Business Metrics Overview**:\n\n`;

      result += `**Sales Performance:**\n`;
      result += `  - Total sales: **${sales.length}** (${totalSalesValue.toLocaleString()} ${getGlobalCurrencyCode()})\n`;
      result += `  - This month: **${thisMonthSales.length}** (${thisMonthRevenue.toLocaleString()} ${getGlobalCurrencyCode()})\n`;
      result += `  - Average sale value: **${avgSaleValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n\n`;

      result += `**Offers Pipeline:**\n`;
      result += `  - Total offers: **${offers.length}** (${totalOfferValue.toLocaleString()} ${getGlobalCurrencyCode()})\n`;
      result += `  - Average offer value: **${avgOfferValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n\n`;

      result += `**Operations:**\n`;
      result += `  - Total contacts: **${totalContacts}**\n`;
      result += `  - Dispatch completion rate: **${dispatchCompletionRate.toFixed(1)}%**\n`;
      result += `  - Completed dispatches: **${completedDispatches}** of ${dispatches.length}\n`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch business metrics' };
    }
  },

  // FIELD SERVICE QUERIES

  // Get today's dispatches
  async getTodayDispatches(): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageSize: 1000 });
      const dispatches = response.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayDispatches = dispatches.filter((d: any) => {
        if (!d.scheduledDate) return false;
        const scheduled = new Date(d.scheduledDate);
        scheduled.setHours(0, 0, 0, 0);
        return scheduled.getTime() === today.getTime();
      });

      if (todayDispatches.length === 0) {
        return {
          success: true,
          data: `📅 **Today's Dispatches**:\n\n✨ No dispatches scheduled for today.\n\n[View dispatch calendar](/dashboard/service/dispatches)`
        };
      }

      const byStatus = todayDispatches.reduce((acc: Record<string, any[]>, d: any) => {
        const status = d.status || 'pending';
        if (!acc[status]) acc[status] = [];
        acc[status].push(d);
        return acc;
      }, {});

      let result = `📅 **Today's Dispatches (${todayDispatches.length} total)**:\n\n`;

      const statusIcons: Record<string, string> = {
        pending: '⏳', assigned: '👤', in_progress: '🔄', completed: '✅', cancelled: '❌'
      };

      Object.entries(byStatus).forEach(([status, items]) => {
        result += `${statusIcons[status] || '📋'} **${status.replace('_', ' ')} (${(items as any[]).length}):**\n`;
        (items as any[]).slice(0, 3).forEach((d: any) => {
          result += `  - ${d.title || d.serviceOrderTitle || 'Dispatch'} ${d.technicianName ? `→ ${d.technicianName}` : ''}\n`;
        });
        if ((items as any[]).length > 3) result += `  _... and ${(items as any[]).length - 3} more_\n`;
        result += '\n';
      });

      result += `🔗 [View all dispatches](/dashboard/service/dispatches)`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch today\'s dispatches' };
    }
  },

  // Get pending/unassigned dispatches
  async getPendingDispatches(): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageSize: 1000 });
      const dispatches = response.data || [];

      const pending = dispatches.filter((d: any) =>
        d.status === 'pending' || d.status === 'draft' || !d.technicianId
      );

      if (pending.length === 0) {
        return {
          success: true,
          data: `✅ **Pending Dispatches**:\n\nNo pending or unassigned dispatches! All work is assigned.`
        };
      }

      let result = `⏳ **Pending/Unassigned Dispatches (${pending.length})**:\n\n`;

      pending.slice(0, 8).forEach((d: any) => {
        const priority = d.priority ? ` [${d.priority}]` : '';
        result += `- **${d.title || d.serviceOrderTitle || 'Dispatch #' + d.id}**${priority}\n`;
        if (d.scheduledDate) result += `  📅 Scheduled: ${formatDate(new Date(d.scheduledDate))}\n`;
        if (d.contactName) result += `  👤 Customer: ${d.contactName}\n`;
      });

      if (pending.length > 8) {
        result += `\n_... and ${pending.length - 8} more pending_`;
      }

      result += `\n\n🔗 [Assign dispatches](/dashboard/service/dispatches)`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch pending dispatches' };
    }
  },

  // Get overdue dispatches
  async getOverdueDispatches(): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageSize: 1000 });
      const dispatches = response.data || [];
      const now = new Date();

      const overdue = dispatches.filter((d: any) => {
        if (d.status === 'completed' || d.status === 'cancelled') return false;
        if (!d.scheduledDate) return false;
        const scheduled = new Date(d.scheduledDate);
        return scheduled < now;
      });

      if (overdue.length === 0) {
        return {
          success: true,
          data: `✅ **Overdue Dispatches**:\n\nNo overdue dispatches! All work is on schedule.`
        };
      }

      let result = `🚨 **Overdue Dispatches (${overdue.length})**:\n\n`;

      overdue.slice(0, 8).forEach((d: any) => {
        const daysOverdue = Math.floor((now.getTime() - new Date(d.scheduledDate).getTime()) / (1000 * 60 * 60 * 24));
        result += `- **${d.title || 'Dispatch #' + d.id}** - ${daysOverdue} day(s) overdue\n`;
        if (d.technicianName) result += `  👤 Assigned: ${d.technicianName}\n`;
        if (d.contactName) result += `  🏢 Customer: ${d.contactName}\n`;
      });

      if (overdue.length > 8) {
        result += `\n_... and ${overdue.length - 8} more overdue_`;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch overdue dispatches' };
    }
  },

  // Get dispatch statistics
  async getDispatchStats(): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageSize: 1000 });
      const dispatches = response.data || [];

      const byStatus = dispatches.reduce((acc: Record<string, number>, d: any) => {
        acc[d.status || 'pending'] = (acc[d.status || 'pending'] || 0) + 1;
        return acc;
      }, {});

      // This week's dispatches
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const thisWeek = dispatches.filter((d: any) => {
        if (!d.scheduledDate) return false;
        return new Date(d.scheduledDate) >= weekStart;
      });

      const completedThisWeek = thisWeek.filter((d: any) => d.status === 'completed').length;
      const completionRate = thisWeek.length > 0 ? (completedThisWeek / thisWeek.length * 100) : 0;

      let result = `📊 **Dispatch Statistics**:\n\n`;
      result += `**Overall:**\n`;
      result += `- Total dispatches: **${dispatches.length}**\n\n`;

      result += `**By Status:**\n`;
      Object.entries(byStatus).forEach(([status, count]) => {
        const icon = status === 'completed' ? '✅' : status === 'in_progress' ? '🔄' : status === 'pending' ? '⏳' : '📋';
        result += `- ${icon} ${status.replace('_', ' ')}: **${count}**\n`;
      });

      result += `\n**This Week:**\n`;
      result += `- Scheduled: **${thisWeek.length}**\n`;
      result += `- Completed: **${completedThisWeek}**\n`;
      result += `- Completion rate: **${completionRate.toFixed(1)}%**\n`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch dispatch statistics' };
    }
  },

  // Get technician schedule for today
  async getTechnicianScheduleToday(): Promise<DataQueryResult> {
    try {
      const [dispatchRes, usersRes] = await Promise.all([
        dispatchesApi.getAll({ pageSize: 1000 }),
        usersApi.getAll()
      ]);

      const dispatches = dispatchRes.data || [];
      const users = usersRes.users || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayDispatches = dispatches.filter((d: any) => {
        if (!d.scheduledDate) return false;
        const scheduled = new Date(d.scheduledDate);
        scheduled.setHours(0, 0, 0, 0);
        return scheduled.getTime() === today.getTime();
      });

      // Group by technician
      const byTechnician = todayDispatches.reduce((acc: Record<string, any[]>, d: any) => {
        const techId = d.technicianId || 'unassigned';
        if (!acc[techId]) acc[techId] = [];
        acc[techId].push(d);
        return acc;
      }, {});

      let result = `👨‍🔧 **Technician Schedule Today**:\n\n`;

      const assignedTechs = Object.keys(byTechnician).filter(k => k !== 'unassigned');

      if (assignedTechs.length === 0 && !byTechnician['unassigned']) {
        result += `No dispatches scheduled for today.\n`;
      } else {
        assignedTechs.forEach(techId => {
          const tech = users.find((u: any) => u.id.toString() === techId);
          const techName = tech ? `${tech.firstName} ${tech.lastName}` : `Technician #${techId}`;
          const jobs = byTechnician[techId];
          result += `**${techName}** - ${jobs.length} job(s):\n`;
          jobs.forEach((j: any) => {
            const statusIcon = j.status === 'completed' ? '✅' : j.status === 'in_progress' ? '🔄' : '⏳';
            result += `  ${statusIcon} ${j.title || 'Job'}\n`;
          });
          result += '\n';
        });

        if (byTechnician['unassigned']?.length > 0) {
          result += `⚠️ **Unassigned** - ${byTechnician['unassigned'].length} job(s) need assignment\n`;
        }
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch technician schedule' };
    }
  },

  // Get service order backlog
  async getServiceOrderBacklog(): Promise<DataQueryResult> {
    try {
      const response = await serviceOrdersApi.getAll({ pageSize: 1000 });
      const orders = response.data?.serviceOrders || [];

      const backlog = orders.filter((o: any) =>
        o.status === 'pending' || o.status === 'planned' || o.status === 'draft'
      );

      const byPriority = backlog.reduce((acc: Record<string, any[]>, o: any) => {
        const priority = o.priority || 'medium';
        if (!acc[priority]) acc[priority] = [];
        acc[priority].push(o);
        return acc;
      }, {});

      let result = `📋 **Service Order Backlog (${backlog.length} orders)**:\n\n`;

      const priorityOrder = ['urgent', 'high', 'medium', 'low'];
      const priorityIcons: Record<string, string> = { urgent: '🚨', high: '🔴', medium: '🟡', low: '🟢' };

      priorityOrder.forEach(priority => {
        if (byPriority[priority]?.length > 0) {
          result += `${priorityIcons[priority]} **${priority.charAt(0).toUpperCase() + priority.slice(1)} (${byPriority[priority].length}):**\n`;
          byPriority[priority].slice(0, 3).forEach((o: any) => {
            result += `  - ${o.orderNumber || o.title || 'Order'}\n`;
          });
          if (byPriority[priority].length > 3) {
            result += `  _... and ${byPriority[priority].length - 3} more_\n`;
          }
          result += '\n';
        }
      });

      result += `🔗 [View all service orders](/dashboard/service/orders)`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch service order backlog' };
    }
  },

  // Get urgent service orders
  async getUrgentServiceOrders(): Promise<DataQueryResult> {
    try {
      const response = await serviceOrdersApi.getAll({ pageSize: 1000 });
      const orders = response.data?.serviceOrders || [];

      const urgent = orders.filter((o: any) =>
        (o.priority === 'urgent' || o.priority === 'high') &&
        o.status !== 'completed' && o.status !== 'cancelled'
      );

      if (urgent.length === 0) {
        return {
          success: true,
          data: `✅ **Urgent Service Orders**:\n\nNo urgent or high priority orders pending!`
        };
      }

      let result = `🚨 **Urgent/High Priority Service Orders (${urgent.length})**:\n\n`;

      urgent.slice(0, 8).forEach((o: any) => {
        const icon = o.priority === 'urgent' ? '🚨' : '🔴';
        result += `${icon} **${o.orderNumber || o.title}**\n`;
        result += `   Status: ${o.status?.replace('_', ' ')} | Priority: ${o.priority}\n`;
        if (o.contactName) result += `   Customer: ${o.contactName}\n`;
        result += `   🔗 [View](/dashboard/service/orders/${o.id})\n\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch urgent service orders' };
    }
  },

  // Get completed dispatches today
  async getCompletedToday(): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageSize: 1000 });
      const dispatches = response.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completedToday = dispatches.filter((d: any) => {
        if (d.status !== 'completed') return false;
        if (!d.completedAt && !d.updatedAt) return false;
        const completed = new Date(d.completedAt || d.updatedAt);
        completed.setHours(0, 0, 0, 0);
        return completed.getTime() === today.getTime();
      });

      let result = `✅ **Completed Today (${completedToday.length} jobs)**:\n\n`;

      if (completedToday.length === 0) {
        result += `No jobs completed yet today.\n`;
      } else {
        completedToday.slice(0, 8).forEach((d: any) => {
          result += `- **${d.title || 'Job'}**`;
          if (d.technicianName) result += ` - ${d.technicianName}`;
          result += '\n';
        });
        if (completedToday.length > 8) {
          result += `\n_... and ${completedToday.length - 8} more_`;
        }
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch completed jobs' };
    }
  },

  // Get first time fix rate
  async getFirstTimeFixRate(): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageSize: 1000 });
      const dispatches = response.data || [];

      const completed = dispatches.filter((d: any) => d.status === 'completed');

      // Group by service order to find revisits
      const byServiceOrder = completed.reduce((acc: Record<string, number>, d: any) => {
        if (d.serviceOrderId) {
          acc[d.serviceOrderId] = (acc[d.serviceOrderId] || 0) + 1;
        }
        return acc;
      }, {});

      const totalOrders = Object.keys(byServiceOrder).length;
      const firstTimeFixes = Object.values(byServiceOrder).filter(count => count === 1).length;
      const ftfRate = totalOrders > 0 ? (firstTimeFixes / totalOrders * 100) : 0;

      let result = `📊 **First Time Fix Rate**:\n\n`;
      result += `- Rate: **${ftfRate.toFixed(1)}%**\n`;
      result += `- Fixed on first visit: **${firstTimeFixes}** orders\n`;
      result += `- Required revisits: **${totalOrders - firstTimeFixes}** orders\n`;
      result += `- Total completed orders: **${totalOrders}**\n`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not calculate first time fix rate' };
    }
  },

  // Get average job duration
  async getAverageJobDuration(): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageSize: 1000 });
      const dispatches = response.data || [];

      const withDuration = dispatches.filter((d: any) => d.actualDuration || d.estimatedDuration);

      const avgActual = withDuration.reduce((sum: number, d: any) => sum + (d.actualDuration || 0), 0) / (withDuration.length || 1);
      const avgEstimated = withDuration.reduce((sum: number, d: any) => sum + (d.estimatedDuration || 0), 0) / (withDuration.length || 1);

      let result = `⏱️ **Job Duration Analysis**:\n\n`;
      result += `- Average actual duration: **${avgActual.toFixed(1)} hours**\n`;
      result += `- Average estimated duration: **${avgEstimated.toFixed(1)} hours**\n`;
      result += `- Accuracy: **${avgEstimated > 0 ? ((avgActual / avgEstimated) * 100).toFixed(0) : 'N/A'}%**\n`;
      result += `- Jobs analyzed: **${withDuration.length}**\n`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not calculate job duration' };
    }
  },

  // Get installations by status
  async getInstallationsByStatus(): Promise<DataQueryResult> {
    try {
      const response = await installationsApi.getAll({});
      const installations = response.installations || [];

      const byStatus = installations.reduce((acc: Record<string, number>, i: any) => {
        acc[i.status || 'active'] = (acc[i.status || 'active'] || 0) + 1;
        return acc;
      }, {});

      const byType = installations.reduce((acc: Record<string, number>, i: any) => {
        acc[i.type || 'other'] = (acc[i.type || 'other'] || 0) + 1;
        return acc;
      }, {});

      let result = `🔧 **Installations Overview (${installations.length} total)**:\n\n`;

      result += `**By Status:**\n`;
      Object.entries(byStatus).forEach(([status, count]) => {
        const icon = status === 'active' || status === 'operational' ? '✅' : status === 'maintenance' ? '🔧' : '⚠️';
        result += `- ${icon} ${status}: **${count}**\n`;
      });

      result += `\n**By Type:**\n`;
      Object.entries(byType).forEach(([type, count]) => {
        result += `- ${type}: **${count}**\n`;
      });

      result += `\n🔗 [View all installations](/dashboard/service/installations)`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch installations' };
    }
  },

  // Get warranties expiring soon
  async getWarrantiesExpiringSoon(): Promise<DataQueryResult> {
    try {
      const response = await installationsApi.getAll({});
      const installations = response.installations || [];

      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expiringSoon = installations.filter((i: any) => {
        if (!i.warrantyEndDate) return false;
        const warranty = new Date(i.warrantyEndDate);
        return warranty >= now && warranty <= thirtyDaysLater;
      });

      if (expiringSoon.length === 0) {
        return {
          success: true,
          data: `✅ **Warranty Status**:\n\nNo warranties expiring in the next 30 days.`
        };
      }

      let result = `⚠️ **Warranties Expiring Soon (${expiringSoon.length})**:\n\n`;

      expiringSoon.slice(0, 8).forEach((i: any) => {
        const daysLeft = Math.ceil((new Date(i.warrantyEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        result += `- **${i.name}** - expires in ${daysLeft} days\n`;
        if (i.contactName) result += `  Customer: ${i.contactName}\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch warranty information' };
    }
  },

  // Get available technicians
  async getAvailableTechnicians(): Promise<DataQueryResult> {
    try {
      const [usersRes, dispatchRes] = await Promise.all([
        usersApi.getAll(),
        dispatchesApi.getAll({ pageSize: 1000 })
      ]);

      const users = usersRes.users || [];
      const dispatches = dispatchRes.data || [];

      // Find technicians
      const technicians = users.filter((u: any) =>
        u.roles?.some((r: any) => r.name?.toLowerCase().includes('technician'))
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check who has dispatches today
      const busyTechIds = new Set(
        dispatches
          .filter((d: any) => {
            if (!d.scheduledDate || d.status === 'completed') return false;
            const scheduled = new Date(d.scheduledDate);
            scheduled.setHours(0, 0, 0, 0);
            return scheduled.getTime() === today.getTime();
          })
          .map((d: any) => d.technicianId?.toString())
      );

      const available = technicians.filter((t: any) => !busyTechIds.has(t.id?.toString()));
      const busy = technicians.filter((t: any) => busyTechIds.has(t.id?.toString()));

      let result = `👨‍🔧 **Technician Availability Today**:\n\n`;

      result += `**Available (${available.length}):**\n`;
      if (available.length === 0) {
        result += `  _All technicians are assigned_\n`;
      } else {
        available.forEach((t: any) => {
          result += `  ✅ ${t.firstName} ${t.lastName}\n`;
        });
      }

      result += `\n**Busy (${busy.length}):**\n`;
      busy.forEach((t: any) => {
        const jobCount = dispatches.filter((d: any) => d.technicianId?.toString() === t.id?.toString()).length;
        result += `  🔄 ${t.firstName} ${t.lastName} (${jobCount} jobs)\n`;
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch technician availability' };
    }
  },

  // Get field service revenue
  async getFieldServiceRevenue(): Promise<DataQueryResult> {
    try {
      const [salesRes, dispatchRes] = await Promise.all([
        salesApi.getAll({ limit: 1000 }),
        dispatchesApi.getAll({ pageSize: 1000 })
      ]);

      const sales = salesRes.data?.sales || [];
      const dispatches = dispatchRes.data || [];

      // Filter service-related sales
      const serviceSales = sales.filter((s: any) =>
        s.type === 'service' || s.serviceOrderId
      );

      const totalRevenue = serviceSales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
      const completedJobs = dispatches.filter((d: any) => d.status === 'completed').length;
      const avgRevenuePerJob = completedJobs > 0 ? totalRevenue / completedJobs : 0;

      // This month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthSales = serviceSales.filter((s: any) => new Date(s.createdAt) >= monthStart);
      const thisMonthRevenue = thisMonthSales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

      let result = `💰 **Field Service Revenue**:\n\n`;
      result += `**Overall:**\n`;
      result += `- Total service revenue: **${totalRevenue.toLocaleString()} ${getGlobalCurrencyCode()}**\n`;
      result += `- Completed jobs: **${completedJobs}**\n`;
      result += `- Avg revenue per job: **${avgRevenuePerJob.toLocaleString()} ${getGlobalCurrencyCode()}**\n\n`;
      result += `**This Month:**\n`;
      result += `- Revenue: **${thisMonthRevenue.toLocaleString()} ${getGlobalCurrencyCode()}**\n`;
      result += `- Jobs: **${thisMonthSales.length}**\n`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not calculate field service revenue' };
    }
  },

  // Get customer site visits
  async getCustomerSiteVisits(): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageSize: 1000 });
      const dispatches = response.data || [];

      // This week's visits
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const thisWeek = dispatches.filter((d: any) => {
        if (!d.scheduledDate) return false;
        return new Date(d.scheduledDate) >= weekStart;
      });

      // Group by customer
      const byCustomer = thisWeek.reduce((acc: Record<string, any[]>, d: any) => {
        const customer = d.contactName || d.customerName || 'Unknown';
        if (!acc[customer]) acc[customer] = [];
        acc[customer].push(d);
        return acc;
      }, {});

      let result = `🏢 **Customer Site Visits This Week**:\n\n`;
      result += `Total visits: **${thisWeek.length}**\n`;
      result += `Unique customers: **${Object.keys(byCustomer).length}**\n\n`;

      const topCustomers = Object.entries(byCustomer)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5);

      if (topCustomers.length > 0) {
        result += `**Top customers by visits:**\n`;
        topCustomers.forEach(([customer, visits]) => {
          result += `- ${customer}: **${visits.length}** visits\n`;
        });
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch customer visits' };
    }
  },

  // Get materials used today
  async getMaterialsUsedToday(): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageSize: 1000 });
      const dispatches = response.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayCompleted = dispatches.filter((d: any) => {
        if (d.status !== 'completed') return false;
        const completed = new Date(d.completedAt || d.updatedAt || d.scheduledDate);
        completed.setHours(0, 0, 0, 0);
        return completed.getTime() === today.getTime();
      });

      // Aggregate materials from completed jobs
      const materialsUsed: Record<string, number> = {};
      todayCompleted.forEach((d: any) => {
        if (d.materials && Array.isArray(d.materials)) {
          d.materials.forEach((m: any) => {
            const name = m.name || m.articleName || 'Unknown';
            materialsUsed[name] = (materialsUsed[name] || 0) + (m.quantity || 1);
          });
        }
      });

      let result = `📦 **Materials Used Today**:\n\n`;
      result += `Jobs completed: **${todayCompleted.length}**\n\n`;

      if (Object.keys(materialsUsed).length === 0) {
        result += `_No material usage recorded yet today._\n`;
      } else {
        result += `**Items consumed:**\n`;
        Object.entries(materialsUsed).forEach(([name, qty]) => {
          result += `- ${name}: **${qty}** units\n`;
        });
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch materials used' };
    }
  },

  // =============== PLANNING & DISPATCH ACTIONS ===============

  // Get dispatch details by number
  async getDispatchDetails(dispatchNumber: string): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageNumber: 1, pageSize: 1000 });
      const dispatches = response.data || [];

      // Search by dispatch number (partial or exact match)
      const searchTerm = dispatchNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const dispatch = dispatches.find((d: any) => {
        const num = (d.dispatchNumber || '').toUpperCase();
        return num === searchTerm || num.includes(searchTerm);
      });

      if (!dispatch) {
        return {
          success: true,
          data: `❓ Could not find dispatch **${dispatchNumber}**. Please check the dispatch number.`
        };
      }

      const statusIcons: Record<string, string> = {
        pending: '⏳', assigned: '👤', in_progress: '🔄', completed: '✅', cancelled: '❌'
      };
      const priorityIcons: Record<string, string> = {
        low: '🔵', medium: '🟡', high: '🟠', urgent: '🔴'
      };

      let result = `📋 **Dispatch Details: ${dispatch.dispatchNumber}**\n\n`;
      result += `**Status:** ${statusIcons[dispatch.status] || '⏳'} ${dispatch.status?.replace(/_/g, ' ')}\n`;
      result += `**Priority:** ${priorityIcons[dispatch.priority] || '🟡'} ${dispatch.priority || 'medium'}\n`;
      result += `**Customer:** ${dispatch.contactName || 'Not specified'}\n`;

      if (dispatch.scheduledDate) {
        result += `**Scheduled:** ${formatDate(new Date(dispatch.scheduledDate))}`;
        if (dispatch.scheduledStartTime) {
          result += ` at ${dispatch.scheduledStartTime}`;
        }
        result += '\n';
      }

      if (dispatch.siteAddress) {
        result += `**Location:** ${dispatch.siteAddress}\n`;
      }

      // Get assigned technicians
      if (dispatch.assignedTechnicianIds && dispatch.assignedTechnicianIds.length > 0) {
        try {
          const usersResponse = await usersApi.getAll();
          const users = usersResponse.users || [];
          const assignedNames = dispatch.assignedTechnicianIds
            .map((id: string) => {
              const user = users.find((u: any) => String(u.id) === String(id));
              return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : id;
            })
            .join(', ');
          result += `**Assigned to:** ${assignedNames}\n`;
        } catch {
          result += `**Assigned to:** ${dispatch.assignedTechnicianIds.length} technician(s)\n`;
        }
      } else {
        result += `**Assigned to:** _Not assigned yet_\n`;
      }

      if (dispatch.notes) {
        result += `\n**Notes:** ${dispatch.notes}\n`;
      }

      result += `\n🔗 [View Dispatch](/dashboard/field/dispatches/${dispatch.id})`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch dispatch details' };
    }
  },

  // Get service order details with jobs and dispatches
  async getServiceOrderDetails(orderNumber: string): Promise<DataQueryResult> {
    try {
      const response = await serviceOrdersApi.getAll({ page: 1, pageSize: 1000 });
      const orders = response.data?.serviceOrders || [];

      // Search by order number (partial or exact match)
      const searchTerm = orderNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const order = orders.find((o: any) => {
        const num = (o.orderNumber || '').toUpperCase();
        return num === searchTerm || num.includes(searchTerm);
      });

      if (!order) {
        return {
          success: true,
          data: `❓ Could not find service order **${orderNumber}**. Please check the order number.`
        };
      }

      // Get full details with jobs
      const fullOrder = await serviceOrdersApi.getById(order.id, true);
      const dispatches = await serviceOrdersApi.getDispatches(order.id);

      const statusIcons: Record<string, string> = {
        draft: '📝', ready_for_planning: '📋', scheduled: '📅', in_progress: '🔄',
        completed: '✅', invoiced: '💰', closed: '🔒', cancelled: '❌', on_hold: '⏸️'
      };
      const priorityIcons: Record<string, string> = {
        low: '🔵', medium: '🟡', high: '🟠', urgent: '🔴'
      };

      let result = `📋 **Service Order: ${fullOrder.orderNumber}**\n\n`;
      result += `**Status:** ${statusIcons[fullOrder.status] || '📋'} ${fullOrder.status?.replace(/_/g, ' ')}\n`;
      result += `**Priority:** ${priorityIcons[fullOrder.priority] || '🟡'} ${fullOrder.priority || 'medium'}\n`;
      result += `**Customer:** ${fullOrder.contactName || 'Not specified'}\n`;

      if (fullOrder.title) {
        result += `**Title:** ${fullOrder.title}\n`;
      }

      // Jobs section
      const jobs = fullOrder.jobs || [];
      result += `\n**Jobs (${jobs.length}):**\n`;
      if (jobs.length === 0) {
        result += `_No jobs defined yet_\n`;
      } else {
        jobs.forEach((job: any) => {
          const jobStatusIcon = job.status === 'completed' ? '✅' : job.status === 'in_progress' ? '🔄' : '⏳';
          result += `${jobStatusIcon} ${job.title} (${job.status})\n`;
        });
      }

      // Dispatches section
      result += `\n**Dispatches (${dispatches.length}):**\n`;
      if (dispatches.length === 0) {
        result += `_No dispatches created yet_\n`;
      } else {
        dispatches.forEach((d: any) => {
          const dispStatusIcon = d.status === 'completed' ? '✅' : d.status === 'in_progress' ? '🔄' : '⏳';
          result += `${dispStatusIcon} ${d.dispatchNumber} - ${d.status}`;
          if (d.scheduledDate) {
            result += ` (${formatDate(new Date(d.scheduledDate))})`;
          }
          result += '\n';
        });
      }

      result += `\n🔗 [View Service Order](/dashboard/field/service-orders/${fullOrder.id})`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch service order details' };
    }
  },

  // Get who is working on a specific dispatch
  async getDispatchAssignees(dispatchNumber: string): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageNumber: 1, pageSize: 1000 });
      const dispatches = response.data || [];

      const searchTerm = dispatchNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const dispatch = dispatches.find((d: any) => {
        const num = (d.dispatchNumber || '').toUpperCase();
        return num === searchTerm || num.includes(searchTerm);
      });

      if (!dispatch) {
        return {
          success: true,
          data: `❓ Could not find dispatch **${dispatchNumber}**.`
        };
      }

      if (!dispatch.assignedTechnicianIds || dispatch.assignedTechnicianIds.length === 0) {
        return {
          success: true,
          data: `📋 **Dispatch ${dispatch.dispatchNumber}**\n\n⚠️ No technicians assigned to this dispatch yet.`
        };
      }

      const usersResponse = await usersApi.getAll();
      const users = usersResponse.users || [];

      let result = `👥 **Technicians on Dispatch ${dispatch.dispatchNumber}**:\n\n`;

      for (const techId of dispatch.assignedTechnicianIds) {
        const user = users.find((u: any) => String(u.id) === String(techId));
        if (user) {
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
          const roles = (user.roles || []).map((r: any) => r.name).join(', ') || 'No role';
          result += `👤 **${name}**\n`;
          result += `   Role: ${roles}\n`;
          if ((user as any).phone) result += `   📞 ${(user as any).phone}\n`;
          if (user.email) result += `   ✉️ ${user.email}\n`;
          result += '\n';
        } else {
          result += `👤 Technician ID: ${techId}\n\n`;
        }
      }

      result += `**Dispatch Status:** ${dispatch.status?.replace(/_/g, ' ')}\n`;
      if (dispatch.scheduledDate) {
        result += `**Scheduled:** ${formatDate(new Date(dispatch.scheduledDate))}\n`;
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch dispatch assignees' };
    }
  },

  // Get who is working on a service order
  async getServiceOrderAssignees(orderNumber: string): Promise<DataQueryResult> {
    try {
      const response = await serviceOrdersApi.getAll({ page: 1, pageSize: 1000 });
      const orders = response.data?.serviceOrders || [];

      const searchTerm = orderNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const order = orders.find((o: any) => {
        const num = (o.orderNumber || '').toUpperCase();
        return num === searchTerm || num.includes(searchTerm);
      });

      if (!order) {
        return {
          success: true,
          data: `❓ Could not find service order **${orderNumber}**.`
        };
      }

      // Get dispatches for this order
      const dispatches = await serviceOrdersApi.getDispatches(order.id);

      if (dispatches.length === 0) {
        return {
          success: true,
          data: `📋 **Service Order ${order.orderNumber}**\n\n⚠️ No dispatches created yet. No technicians assigned.`
        };
      }

      const usersResponse = await usersApi.getAll();
      const users = usersResponse.users || [];

      // Collect all unique technicians across dispatches
      const technicianMap = new Map<string, { user: any; dispatches: string[] }>();

      for (const dispatch of dispatches) {
        const techIds = dispatch.assignedTechnicianIds || [];
        for (const techId of techIds) {
          const existing = technicianMap.get(techId);
          if (existing) {
            existing.dispatches.push(dispatch.dispatchNumber);
          } else {
            const user = users.find((u: any) => String(u.id) === String(techId));
            technicianMap.set(techId, {
              user,
              dispatches: [dispatch.dispatchNumber]
            });
          }
        }
      }

      let result = `👥 **Team Working on Service Order ${order.orderNumber}**:\n\n`;

      if (technicianMap.size === 0) {
        result += `⚠️ No technicians assigned to any dispatch yet.\n`;
      } else {
        for (const [techId, info] of technicianMap) {
          const name = info.user
            ? `${info.user.firstName || ''} ${info.user.lastName || ''}`.trim() || info.user.email
            : `Technician ID: ${techId}`;
          result += `👤 **${name}**\n`;
          result += `   Working on: ${info.dispatches.join(', ')}\n\n`;
        }
      }

      result += `**Service Order Status:** ${order.status?.replace(/_/g, ' ')}\n`;
      result += `**Total Dispatches:** ${dispatches.length}\n`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch service order assignees' };
    }
  },

  // Get unassigned jobs that need planning
  async getUnassignedJobs(): Promise<DataQueryResult> {
    try {
      const response = await serviceOrdersApi.getAll({ page: 1, pageSize: 1000 });
      const orders = response.data?.serviceOrders || [];

      // Collect jobs that are pending or need assignment
      const unassignedJobs: any[] = [];

      for (const order of orders) {
        // Skip completed/cancelled orders
        if (['completed', 'invoiced', 'closed', 'cancelled'].includes(order.status)) continue;

        const fullOrder = await serviceOrdersApi.getById(order.id, true);
        const jobs = fullOrder.jobs || [];
        const dispatches = await serviceOrdersApi.getDispatches(order.id);

        // Check which jobs don't have dispatches
        const dispatchedJobIds = new Set(dispatches.map((d: any) => d.jobId));

        for (const job of jobs) {
          if (job.status !== 'completed' && job.status !== 'cancelled' && !dispatchedJobIds.has(job.id)) {
            unassignedJobs.push({
              ...job,
              orderNumber: order.orderNumber,
              orderId: order.id,
              contactName: order.contactName
            });
          }
        }
      }

      if (unassignedJobs.length === 0) {
        return {
          success: true,
          data: `✅ **All Jobs Planned!**\n\nNo unassigned jobs found. All jobs either have dispatches or are completed.`
        };
      }

      let result = `📋 **Unassigned Jobs Needing Planning (${unassignedJobs.length})**:\n\n`;

      const priorityOrder = ['urgent', 'high', 'medium', 'low'];
      unassignedJobs.sort((a, b) => {
        const aIdx = priorityOrder.indexOf(a.priority || 'medium');
        const bIdx = priorityOrder.indexOf(b.priority || 'medium');
        return aIdx - bIdx;
      });

      unassignedJobs.slice(0, 10).forEach(job => {
        const priorityIcons: Record<string, string> = {
          low: '🔵', medium: '🟡', high: '🟠', urgent: '🔴'
        };
        result += `${priorityIcons[job.priority] || '🟡'} **${job.title}**\n`;
        result += `   Order: ${job.orderNumber} | Customer: ${job.contactName || 'N/A'}\n`;
        if (job.estimatedDuration) {
          result += `   Est. Duration: ${job.estimatedDuration} min\n`;
        }
        result += '\n';
      });

      if (unassignedJobs.length > 10) {
        result += `_... and ${unassignedJobs.length - 10} more unassigned jobs_\n`;
      }

      result += `\n💡 Use the **Dispatcher** to plan these jobs.\n`;
      result += `🔗 [Open Dispatcher](/dashboard/field/dispatcher/interface)`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch unassigned jobs' };
    }
  },

  // Get technician's schedule for today or a specific date
  async getTechnicianSchedule(technicianName: string, date?: Date): Promise<DataQueryResult> {
    try {
      const usersResponse = await usersApi.getAll();
      const users = usersResponse.users || [];

      // Find technician
      const searchLower = technicianName.toLowerCase().replace('@', '');
      const technician = users.find((u: any) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        return fullName.includes(searchLower);
      });

      if (!technician) {
        return {
          success: true,
          data: `❓ Could not find technician **${technicianName}**.`
        };
      }

      const targetDate = date || new Date();
      const dateStr = targetDate.toISOString().split('T')[0];

      // Get dispatches for this technician on the target date
      const response = await dispatchesApi.getAll({
        technicianId: String(technician.id),
        dateFrom: dateStr,
        dateTo: dateStr,
        pageNumber: 1,
        pageSize: 100
      });
      // Filter dispatches to match exact date (in case backend doesn't filter perfectly)
      const allDispatches = response.data || [];
      const dispatches = allDispatches.filter((d: any) => {
        if (!d.scheduledDate) return false;
        const dispDate = new Date(d.scheduledDate).toISOString().split('T')[0];
        return dispDate === dateStr;
      });

      const name = `${technician.firstName || ''} ${technician.lastName || ''}`.trim();

      let result = `📅 **${name}'s Schedule for ${formatDate(targetDate)}**:\n\n`;

      if (dispatches.length === 0) {
        result += `_No dispatches scheduled._\n\n`;

        // Check if they're on leave
        try {
          const schedule = await schedulesApi.getSchedule(technician.id);
          const todayStr = targetDate.toISOString().split('T')[0];
          const activeLeave = schedule.leaves?.find((leave: any) => {
            const start = new Date(leave.startDate).toISOString().split('T')[0];
            const end = new Date(leave.endDate).toISOString().split('T')[0];
            return todayStr >= start && todayStr <= end && leave.status !== 'rejected';
          });
          if (activeLeave) {
            result += `🏖️ **On Leave**: ${activeLeave.leaveType || 'Vacation'}\n`;
          }
        } catch { }
      } else {
        // Sort by scheduled time
        dispatches.sort((a: any, b: any) => {
          const timeA = a.scheduledStartTime || '00:00';
          const timeB = b.scheduledStartTime || '00:00';
          return timeA.localeCompare(timeB);
        });

        result += `**${dispatches.length} dispatch(es) scheduled:**\n\n`;

        dispatches.forEach((d: any) => {
          const statusIcon = d.status === 'completed' ? '✅' : d.status === 'in_progress' ? '🔄' : '⏳';
          result += `${statusIcon} **${d.dispatchNumber}**\n`;
          if (d.scheduledStartTime) {
            result += `   ⏰ ${d.scheduledStartTime}`;
            if (d.scheduledEndTime) result += ` - ${d.scheduledEndTime}`;
            result += '\n';
          }
          result += `   📍 ${d.siteAddress || d.contactName || 'No location'}\n`;
          result += `   Status: ${d.status?.replace(/_/g, ' ')}\n\n`;
        });

        // Calculate total workload
        const totalMinutes = dispatches.reduce((sum: number, d: any) => {
          if (d.scheduledStartTime && d.scheduledEndTime) {
            const [sh, sm] = d.scheduledStartTime.split(':').map(Number);
            const [eh, em] = d.scheduledEndTime.split(':').map(Number);
            return sum + ((eh * 60 + em) - (sh * 60 + sm));
          }
          return sum;
        }, 0);

        if (totalMinutes > 0) {
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          result += `**Total workload:** ${hours}h ${mins}m\n`;
        }
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch technician schedule' };
    }
  },

  // Get dispatches by status
  async getDispatchesByStatus(status: string): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ status, pageNumber: 1, pageSize: 100 });
      const dispatches = response.data || [];

      const statusLabels: Record<string, string> = {
        pending: '⏳ Pending',
        assigned: '👤 Assigned',
        in_progress: '🔄 In Progress',
        completed: '✅ Completed',
        cancelled: '❌ Cancelled'
      };

      let result = `📋 **${statusLabels[status] || status} Dispatches (${dispatches.length})**:\n\n`;

      if (dispatches.length === 0) {
        result += `_No dispatches with status "${status}"._`;
      } else {
        dispatches.slice(0, 10).forEach((d: any) => {
          result += `• **${d.dispatchNumber}** - ${d.contactName || 'No customer'}\n`;
          if (d.scheduledDate) {
            result += `  Scheduled: ${formatDate(new Date(d.scheduledDate))}\n`;
          }
        });

        if (dispatches.length > 10) {
          result += `\n_... and ${dispatches.length - 10} more_`;
        }
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch dispatches' };
    }
  },

  // Get offer status by number
  async getOfferStatus(offerNumber: string): Promise<DataQueryResult> {
    try {
      const response = await offersApi.getAll({ page: 1, limit: 1000 });
      const offers = response.data?.offers || [];

      const searchTerm = offerNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const offer = offers.find((o: any) => {
        const num = (o.offerNumber || '').toUpperCase();
        return num === searchTerm || num.includes(searchTerm);
      });

      if (!offer) {
        return {
          success: true,
          data: `❓ Could not find offer **${offerNumber}**.`
        };
      }

      const statusIcons: Record<string, string> = {
        draft: '📝', sent: '📤', negotiation: '🤝', accepted: '✅',
        rejected: '❌', expired: '⏰', converted: '💰'
      };

      let result = `📋 **Offer: ${offer.offerNumber}**\n\n`;
      result += `**Status:** ${statusIcons[offer.status] || '📋'} ${offer.status}\n`;
      result += `**Customer:** ${offer.contactName || 'Not specified'}\n`;
      if (offer.title) result += `**Title:** ${offer.title}\n`;
      if (offer.totalAmount) result += `**Amount:** ${offer.totalAmount.toLocaleString()} ${getGlobalCurrencyCode()}\n`;
      if (offer.validUntil) result += `**Valid Until:** ${formatDate(new Date(offer.validUntil))}\n`;

      result += `\n🔗 [View Offer](/dashboard/crm/offers/${offer.id})`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch offer status' };
    }
  },

  // Get sale status by number
  async getSaleStatus(saleNumber: string): Promise<DataQueryResult> {
    try {
      const response = await salesApi.getAll({ page: 1, limit: 1000 });
      const sales = response.data?.sales || [];

      const searchTerm = saleNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const sale = sales.find((s: any) => {
        const num = (s.saleNumber || '').toUpperCase();
        return num === searchTerm || num.includes(searchTerm);
      });

      if (!sale) {
        return {
          success: true,
          data: `❓ Could not find sale **${saleNumber}**.`
        };
      }

      const statusIcons: Record<string, string> = {
        draft: '📝', confirmed: '✅', shipped: '📦', delivered: '🚚',
        invoiced: '💰', paid: '💵', cancelled: '❌'
      };

      let result = `💰 **Sale: ${sale.saleNumber}**\n\n`;
      result += `**Status:** ${statusIcons[sale.status] || '📋'} ${sale.status}\n`;
      result += `**Customer:** ${sale.contactName || 'Not specified'}\n`;
      if (sale.title) result += `**Title:** ${sale.title}\n`;
      if (sale.totalAmount) result += `**Amount:** ${sale.totalAmount.toLocaleString()} ${getGlobalCurrencyCode()}\n`;

      result += `\n🔗 [View Sale](/dashboard/crm/sales/${sale.id})`;

      return { success: true, data: result };
    } catch (error) {
      return { success: false, data: '', error: 'Could not fetch sale status' };
    }
  },

  // =============== DISPATCH ASSIGNMENT ACTIONS ===============

  // Assign dispatch to a technician with intelligent scheduling
  async assignDispatchToTechnician(dispatchNumber: string, technicianName: string, preferredDate?: string, preferredTime?: string): Promise<DataQueryResult> {
    try {
      // 1. Find the dispatch
      const dispatchResponse = await dispatchesApi.getAll({ pageNumber: 1, pageSize: 1000 });
      const dispatches = dispatchResponse.data || [];

      const searchTerm = dispatchNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const dispatch = dispatches.find((d: any) => {
        const num = (d.dispatchNumber || '').toUpperCase();
        return num === searchTerm || num.includes(searchTerm);
      });

      if (!dispatch) {
        return {
          success: true,
          data: `❓ Could not find dispatch **${dispatchNumber}**. Please check the dispatch number.`
        };
      }

      // 2. Find the technician
      const usersResponse = await usersApi.getAll();
      const users = usersResponse.users || [];

      const searchLower = technicianName.toLowerCase().replace('@', '');
      const technician = users.find((u: any) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        return fullName.includes(searchLower);
      });

      if (!technician) {
        return {
          success: true,
          data: `❓ Could not find technician **${technicianName}**. Available technicians:\n${users.slice(0, 5).map((u: any) => `  - ${u.firstName} ${u.lastName}`).join('\n')}`
        };
      }

      const techName = `${technician.firstName || ''} ${technician.lastName || ''}`.trim();
      const techId = String(technician.id);

      // 3. Check technician availability and find best slot
      const targetDate = preferredDate ? new Date(preferredDate) : new Date();
      const dateStr = targetDate.toISOString().split('T')[0];

      // Get technician's schedule
      let schedule: any = null;
      try {
        schedule = await schedulesApi.getSchedule(technician.id);
      } catch { }

      // Check if on leave
      if (schedule?.leaves) {
        const todayStr = targetDate.toISOString().split('T')[0];
        const activeLeave = schedule.leaves.find((leave: any) => {
          const start = new Date(leave.startDate).toISOString().split('T')[0];
          const end = new Date(leave.endDate).toISOString().split('T')[0];
          return todayStr >= start && todayStr <= end && leave.status !== 'rejected';
        });
        if (activeLeave) {
          // Find next available day
          let nextAvailable = new Date(activeLeave.endDate);
          nextAvailable.setDate(nextAvailable.getDate() + 1);
          return {
            success: true,
            data: `⚠️ **${techName}** is on leave until ${formatDate(new Date(activeLeave.endDate))}.\n\n🗓️ **Suggested:** Assign for **${formatDate(nextAvailable)}** instead.\n\n💡 Say "assign dispatch ${dispatch.dispatchNumber} to ${techName} on ${nextAvailable.toISOString().split('T')[0]}" to schedule for that date.`
          };
        }
      }

      // Get existing dispatches for this technician on target date
      const techDispatches = dispatches.filter((d: any) => {
        if (!d.scheduledDate) return false;
        const dispDate = new Date(d.scheduledDate).toISOString().split('T')[0];
        const isAssigned = d.assignedTechnicianIds?.includes(techId);
        return dispDate === dateStr && isAssigned && d.status !== 'completed' && d.status !== 'cancelled';
      });

      // Sort by time
      techDispatches.sort((a: any, b: any) => {
        const timeA = a.scheduledStartTime || '00:00';
        const timeB = b.scheduledStartTime || '00:00';
        return timeA.localeCompare(timeB);
      });

      // Find available time slot
      const daySchedule = schedule?.daySchedules?.[targetDate.getDay()];
      const workStart = daySchedule?.startTime || '08:00';
      const workEnd = daySchedule?.endTime || '17:00';
      const lunchStart = daySchedule?.lunchStart || '12:00';
      const lunchEnd = daySchedule?.lunchEnd || '13:00';

      // Calculate workload
      const totalMinutes = techDispatches.reduce((sum: number, d: any) => {
        if (d.scheduledStartTime && d.scheduledEndTime) {
          const [sh, sm] = d.scheduledStartTime.split(':').map(Number);
          const [eh, em] = d.scheduledEndTime.split(':').map(Number);
          return sum + ((eh * 60 + em) - (sh * 60 + sm));
        }
        return sum + 60; // Default 1 hour per dispatch
      }, 0);

      const workloadHours = Math.round(totalMinutes / 60 * 10) / 10;
      const maxHours = 8;
      const isOverloaded = workloadHours >= maxHours - 1;

      // Find first available slot
      let suggestedTime = preferredTime || workStart;
      if (techDispatches.length > 0 && !preferredTime) {
        const lastDispatch = techDispatches[techDispatches.length - 1];
        if (lastDispatch.scheduledEndTime) {
          suggestedTime = lastDispatch.scheduledEndTime;
          // If after lunch start and before lunch end, push to lunch end
          if (suggestedTime >= lunchStart && suggestedTime < lunchEnd) {
            suggestedTime = lunchEnd;
          }
        }
      }

      // Build response with assignment preview
      let result = `📋 **Assignment Preview**\n\n`;
      result += `**Dispatch:** ${dispatch.dispatchNumber}\n`;
      result += `**Technician:** ${techName}\n`;
      result += `**Date:** ${formatDate(targetDate)}\n`;
      result += `**Suggested Time:** ${suggestedTime}\n\n`;

      // Show current workload
      result += `📊 **${techName}'s Current Workload (${formatDate(targetDate)})**:\n`;
      if (techDispatches.length === 0) {
        result += `✅ No dispatches scheduled - fully available!\n\n`;
      } else {
        result += `- ${techDispatches.length} dispatch(es) | ~${workloadHours}h scheduled\n`;
        techDispatches.forEach((d: any) => {
          const time = d.scheduledStartTime ? `${d.scheduledStartTime}` : 'TBD';
          result += `  ⏰ ${time} - ${d.dispatchNumber}\n`;
        });
        result += '\n';
        if (isOverloaded) {
          result += `⚠️ **Warning:** ${techName} is nearing full capacity.\n\n`;
        }
      }

      // Check if already assigned
      if (dispatch.assignedTechnicianIds?.includes(techId)) {
        result += `ℹ️ **Note:** ${techName} is already assigned to this dispatch.\n`;
        return { success: true, data: result };
      }

      // Provide confirmation instruction
      result += `---\n`;
      result += `💡 **To confirm this assignment**, say:\n`;
      result += `"**confirm assign ${dispatch.dispatchNumber} to ${techName} at ${suggestedTime}**"\n\n`;
      result += `Or choose a different time: "assign ${dispatch.dispatchNumber} to ${techName} at 14:00"`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in assignDispatchToTechnician:', error);
      return { success: false, data: '', error: 'Could not process assignment request' };
    }
  },

  // Execute dispatch assignment (after confirmation)
  async executeDispatchAssignment(dispatchNumber: string, technicianName: string, scheduledTime?: string): Promise<DataQueryResult> {
    try {
      // API_URL imported from @/config/api
      const token = localStorage.getItem('access_token');

      // 1. Find the dispatch
      const dispatchResponse = await dispatchesApi.getAll({ pageNumber: 1, pageSize: 1000 });
      const dispatches = dispatchResponse.data || [];

      const searchTerm = dispatchNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const dispatch = dispatches.find((d: any) => {
        const num = (d.dispatchNumber || '').toUpperCase();
        return num === searchTerm || num.includes(searchTerm);
      });

      if (!dispatch) {
        return { success: true, data: `❓ Could not find dispatch **${dispatchNumber}**.` };
      }

      // 2. Find the technician
      const usersResponse = await usersApi.getAll();
      const users = usersResponse.users || [];

      const searchLower = technicianName.toLowerCase().replace('@', '');
      const technician = users.find((u: any) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        return fullName.includes(searchLower);
      });

      if (!technician) {
        return { success: true, data: `❓ Could not find technician **${technicianName}**.` };
      }

      const techName = `${technician.firstName || ''} ${technician.lastName || ''}`.trim();
      const techId = String(technician.id);

      // 3. Execute assignment via API
      const assignResponse = await fetch(`${API_URL}/api/dispatches/${dispatch.id}/technicians`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(() => { const t = getCurrentTenant(); return t ? { [TENANT_HEADER]: t } : {}; })(),
        },
        body: JSON.stringify({
          technicianId: techId,
          scheduledStartTime: scheduledTime
        }),
      });

      if (!assignResponse.ok) {
        // Try alternative: update dispatch directly
        const updateResponse = await fetch(`${API_URL}/api/dispatches/${dispatch.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(() => { const t = getCurrentTenant(); return t ? { [TENANT_HEADER]: t } : {}; })(),
          },
          body: JSON.stringify({
            assignedTechnicianIds: [...(dispatch.assignedTechnicianIds || []), techId],
            status: 'assigned',
            ...(scheduledTime && { scheduledStartTime: scheduledTime })
          }),
        });

        if (!updateResponse.ok) {
          return {
            success: true,
            data: `⚠️ Could not assign automatically. Please use the Dispatcher interface:\n🔗 [Open Dispatcher](/dashboard/field/dispatcher/interface)\n\nDrag dispatch **${dispatch.dispatchNumber}** to **${techName}**.`
          };
        }
      }

      let result = `✅ **Assignment Complete!**\n\n`;
      result += `📋 Dispatch **${dispatch.dispatchNumber}** has been assigned to **${techName}**`;
      if (scheduledTime) {
        result += ` at **${scheduledTime}**`;
      }
      result += `.\n\n`;
      result += `🔗 [View Dispatch](/dashboard/field/dispatches/${dispatch.id})`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in executeDispatchAssignment:', error);
      return { success: false, data: '', error: 'Could not execute assignment' };
    }
  },

  // Find best technician for a dispatch based on skills and availability
  async suggestTechnicianForDispatch(dispatchNumber: string): Promise<DataQueryResult> {
    try {
      // 1. Find the dispatch
      const dispatchResponse = await dispatchesApi.getAll({ pageNumber: 1, pageSize: 1000 });
      const dispatches = dispatchResponse.data || [];

      const searchTerm = dispatchNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const dispatch = dispatches.find((d: any) => {
        const num = (d.dispatchNumber || '').toUpperCase();
        return num === searchTerm || num.includes(searchTerm);
      });

      if (!dispatch) {
        return { success: true, data: `❓ Could not find dispatch **${dispatchNumber}**.` };
      }

      // 2. Get all users and their schedules
      const usersResponse = await usersApi.getAll();
      const users = usersResponse.users || [];
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      // 3. Calculate availability score for each technician
      const technicianScores: { user: any; score: number; workload: number; available: boolean; reason?: string }[] = [];

      for (const user of users) {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const techId = String(user.id);
        let score = 100;
        let available = true;
        let reason = '';

        // Check schedule
        try {
          const schedule = await schedulesApi.getSchedule(user.id);

          // Check leave
          const activeLeave = schedule.leaves?.find((leave: any) => {
            const start = new Date(leave.startDate).toISOString().split('T')[0];
            const end = new Date(leave.endDate).toISOString().split('T')[0];
            return dateStr >= start && dateStr <= end && leave.status !== 'rejected';
          });

          if (activeLeave) {
            available = false;
            reason = 'On leave';
            score = 0;
          }

          // Check day off
          const daySchedule = schedule.daySchedules?.[today.getDay()];
          if (daySchedule && (!daySchedule.enabled || daySchedule.fullDayOff)) {
            available = false;
            reason = 'Day off';
            score = 0;
          }
        } catch { }

        // Count existing workload
        const techDispatches = dispatches.filter((d: any) => {
          if (!d.scheduledDate) return false;
          const dispDate = new Date(d.scheduledDate).toISOString().split('T')[0];
          return dispDate === dateStr && d.assignedTechnicianIds?.includes(techId) && d.status !== 'completed';
        });

        const workload = techDispatches.length;

        // Reduce score based on workload
        if (available) {
          score -= workload * 15; // -15 points per existing dispatch
          if (workload >= 5) {
            reason = 'Heavy workload';
          }
        }

        technicianScores.push({ user, score, workload, available, reason });
      }

      // Sort by score
      technicianScores.sort((a, b) => b.score - a.score);

      let result = `🔍 **Best Technicians for Dispatch ${dispatch.dispatchNumber}**\n\n`;
      result += `📅 Date: ${formatDate(today)}\n\n`;

      const available = technicianScores.filter(t => t.available);
      const unavailable = technicianScores.filter(t => !t.available);

      if (available.length > 0) {
        result += `✅ **Available (${available.length})**:\n`;
        available.slice(0, 5).forEach((t, i) => {
          const name = `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim();
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
          const load = t.workload === 0 ? '(free)' : `(${t.workload} jobs)`;
          result += `${medal} **${name}** ${load}\n`;
        });
        result += '\n';

        const best = available[0];
        const bestName = `${best.user.firstName || ''} ${best.user.lastName || ''}`.trim();
        result += `💡 **Recommended:** ${bestName}\n`;
        result += `Say: "assign dispatch ${dispatch.dispatchNumber} to ${bestName}"\n`;
      }

      if (unavailable.length > 0) {
        result += `\n🚫 **Unavailable (${unavailable.length})**:\n`;
        unavailable.slice(0, 3).forEach(t => {
          const name = `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim();
          result += `  - ${name}: ${t.reason}\n`;
        });
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in suggestTechnicianForDispatch:', error);
      return { success: false, data: '', error: 'Could not suggest technicians' };
    }
  },

  // =================== REPORT GENERATION QUERIES ===================

  // Generate offers report with filters
  async generateOffersReport(searchTerm?: string, status?: string, dateRange?: string): Promise<DataQueryResult> {
    try {
      const response = await offersApi.getAll({ limit: 1000 });
      let offers = response.data?.offers || [];

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        offers = offers.filter((o: any) =>
          (o.offerNumber || '').toLowerCase().includes(term) ||
          (o.contactName || o.contact?.name || '').toLowerCase().includes(term) ||
          (o.subject || o.title || '').toLowerCase().includes(term)
        );
      }

      // Apply status filter
      if (status) {
        offers = offers.filter((o: any) => o.status?.toLowerCase() === status.toLowerCase());
      }

      // Apply date range filter (today, week, month)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateRange === 'today') {
        offers = offers.filter((o: any) => {
          const oDate = new Date(o.createdAt || o.date);
          oDate.setHours(0, 0, 0, 0);
          return oDate.getTime() === today.getTime();
        });
      } else if (dateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        offers = offers.filter((o: any) => new Date(o.createdAt || o.date) >= weekAgo);
      } else if (dateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        offers = offers.filter((o: any) => new Date(o.createdAt || o.date) >= monthAgo);
      }

      // Calculate stats
      const byStatus = offers.reduce((acc: Record<string, { count: number; value: number }>, o: any) => {
        const s = o.status || 'unknown';
        if (!acc[s]) acc[s] = { count: 0, value: 0 };
        acc[s].count++;
        acc[s].value += o.totalAmount || 0;
        return acc;
      }, {});

      const totalValue = offers.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

      let result = `📋 **Offers Report**\n`;
      result += `${searchTerm ? `🔍 Search: "${searchTerm}"\n` : ''}`;
      result += `${status ? `📊 Status: ${status}\n` : ''}`;
      result += `${dateRange ? `📅 Period: ${dateRange}\n` : ''}\n`;

      result += `**Summary:**\n`;
      result += `- Total offers: **${offers.length}**\n`;
      result += `- Total value: **${totalValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n\n`;

      result += `**By Status:**\n`;
      Object.entries(byStatus).forEach(([s, data]) => {
        const statusIcon = s === 'accepted' ? '✅' : s === 'sent' ? '📨' : s === 'draft' ? '📝' : s === 'rejected' ? '❌' : '📋';
        result += `${statusIcon} ${s}: ${data.count} (${data.value.toLocaleString()} ${getGlobalCurrencyCode()})\n`;
      });

      result += `\n**Latest Offers (top 10):**\n`;
      const sorted = offers.sort((a: any, b: any) =>
        new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
      );

      sorted.slice(0, 10).forEach((o: any) => {
        const date = new Date(o.createdAt || o.date).toLocaleDateString();
        result += `- **${o.offerNumber || 'N/A'}** | ${o.contactName || o.contact?.name || 'Unknown'} | ${(o.totalAmount || 0).toLocaleString()} ${getGlobalCurrencyCode()} | ${o.status} | ${date}\n`;
      });

      if (offers.length > 10) {
        result += `_... and ${offers.length - 10} more_\n`;
      }

      result += `\n📥 [View full report in Offers](/dashboard/offers)`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error generating offers report:', error);
      return { success: false, data: '', error: 'Could not generate offers report' };
    }
  },

  // Generate sales report with filters
  async generateSalesReport(searchTerm?: string, status?: string, dateRange?: string): Promise<DataQueryResult> {
    try {
      const response = await salesApi.getAll({ limit: 1000 });
      let sales = response.data?.sales || [];

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        sales = sales.filter((s: any) =>
          (s.saleNumber || s.orderNumber || '').toLowerCase().includes(term) ||
          (s.contactName || s.contact?.name || '').toLowerCase().includes(term)
        );
      }

      // Apply status filter
      if (status) {
        sales = sales.filter((s: any) => s.status?.toLowerCase() === status.toLowerCase());
      }

      // Apply date range filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateRange === 'today') {
        sales = sales.filter((s: any) => {
          const sDate = new Date(s.createdAt || s.date);
          sDate.setHours(0, 0, 0, 0);
          return sDate.getTime() === today.getTime();
        });
      } else if (dateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        sales = sales.filter((s: any) => new Date(s.createdAt || s.date) >= weekAgo);
      } else if (dateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        sales = sales.filter((s: any) => new Date(s.createdAt || s.date) >= monthAgo);
      }

      // Calculate stats
      const byStatus = sales.reduce((acc: Record<string, { count: number; value: number }>, s: any) => {
        const st = s.status || 'unknown';
        if (!acc[st]) acc[st] = { count: 0, value: 0 };
        acc[st].count++;
        acc[st].value += s.totalAmount || 0;
        return acc;
      }, {});

      const totalValue = sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

      let result = `💰 **Sales Report**\n`;
      result += `${searchTerm ? `🔍 Search: "${searchTerm}"\n` : ''}`;
      result += `${status ? `📊 Status: ${status}\n` : ''}`;
      result += `${dateRange ? `📅 Period: ${dateRange}\n` : ''}\n`;

      result += `**Summary:**\n`;
      result += `- Total sales: **${sales.length}**\n`;
      result += `- Total revenue: **${totalValue.toLocaleString()} ${getGlobalCurrencyCode()}**\n\n`;

      result += `**By Status:**\n`;
      Object.entries(byStatus).forEach(([st, data]) => {
        const statusIcon = st === 'completed' ? '✅' : st === 'pending' ? '⏳' : st === 'in_progress' ? '🔄' : '📋';
        result += `${statusIcon} ${st}: ${data.count} (${data.value.toLocaleString()} ${getGlobalCurrencyCode()})\n`;
      });

      result += `\n**Latest Sales (top 10):**\n`;
      const sorted = sales.sort((a: any, b: any) =>
        new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
      );

      sorted.slice(0, 10).forEach((s: any) => {
        const date = new Date(s.createdAt || s.date).toLocaleDateString();
        result += `- **${s.saleNumber || s.orderNumber || 'N/A'}** | ${s.contactName || s.contact?.name || 'Unknown'} | ${(s.totalAmount || 0).toLocaleString()} ${getGlobalCurrencyCode()} | ${s.status} | ${date}\n`;
      });

      if (sales.length > 10) {
        result += `_... and ${sales.length - 10} more_\n`;
      }

      result += `\n📥 [View full report in Sales](/dashboard/sales)`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error generating sales report:', error);
      return { success: false, data: '', error: 'Could not generate sales report' };
    }
  },

  // Generate service orders report with filters
  async generateServiceOrdersReport(searchTerm?: string, status?: string, dateRange?: string): Promise<DataQueryResult> {
    try {
      const response = await serviceOrdersApi.getAll({ pageSize: 1000 });
      let orders = response.data?.serviceOrders || [];

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        orders = orders.filter((o: any) =>
          (o.orderNumber || o.serviceOrderNumber || '').toLowerCase().includes(term) ||
          (o.contactName || o.contact?.name || '').toLowerCase().includes(term) ||
          (o.installationName || o.installation?.name || '').toLowerCase().includes(term)
        );
      }

      // Apply status filter  
      if (status) {
        orders = orders.filter((o: any) => o.status?.toLowerCase() === status.toLowerCase());
      }

      // Apply date range filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateRange === 'today') {
        orders = orders.filter((o: any) => {
          const oDate = new Date(o.createdAt || o.date);
          oDate.setHours(0, 0, 0, 0);
          return oDate.getTime() === today.getTime();
        });
      } else if (dateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        orders = orders.filter((o: any) => new Date(o.createdAt || o.date) >= weekAgo);
      } else if (dateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        orders = orders.filter((o: any) => new Date(o.createdAt || o.date) >= monthAgo);
      }

      // Calculate stats
      const byStatus = orders.reduce((acc: Record<string, number>, o: any) => {
        const s = o.status || 'unknown';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

      const byPriority = orders.reduce((acc: Record<string, number>, o: any) => {
        const p = o.priority || 'normal';
        acc[p] = (acc[p] || 0) + 1;
        return acc;
      }, {});

      let result = `🛠️ **Service Orders Report**\n`;
      result += `${searchTerm ? `🔍 Search: "${searchTerm}"\n` : ''}`;
      result += `${status ? `📊 Status: ${status}\n` : ''}`;
      result += `${dateRange ? `📅 Period: ${dateRange}\n` : ''}\n`;

      result += `**Summary:**\n`;
      result += `- Total orders: **${orders.length}**\n\n`;

      result += `**By Status:**\n`;
      Object.entries(byStatus).forEach(([s, count]) => {
        const statusIcon = s === 'completed' ? '✅' : s === 'in_progress' ? '🔄' : s === 'planned' ? '📅' : s === 'open' ? '📂' : '📋';
        result += `${statusIcon} ${s.replace(/_/g, ' ')}: ${count}\n`;
      });

      result += `\n**By Priority:**\n`;
      Object.entries(byPriority).forEach(([p, count]) => {
        const prioIcon = p === 'urgent' ? '🚨' : p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢';
        result += `${prioIcon} ${p}: ${count}\n`;
      });

      result += `\n**Latest Orders (top 10):**\n`;
      const sorted = orders.sort((a: any, b: any) =>
        new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
      );

      sorted.slice(0, 10).forEach((o: any) => {
        const date = new Date(o.createdAt || o.date).toLocaleDateString();
        const prioIcon = o.priority === 'urgent' ? '🚨' : o.priority === 'high' ? '🔴' : '';
        result += `- ${prioIcon}**${o.orderNumber || o.serviceOrderNumber || 'N/A'}** | ${o.contactName || o.contact?.name || 'Unknown'} | ${o.status} | ${date}\n`;
      });

      if (orders.length > 10) {
        result += `_... and ${orders.length - 10} more_\n`;
      }

      result += `\n📥 [View full report in Service Orders](/field/service-orders)`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error generating service orders report:', error);
      return { success: false, data: '', error: 'Could not generate service orders report' };
    }
  },

  // Generate invoice from offer or sale
  async generateInvoiceFromEntity(entityType: 'offer' | 'sale', entityNumber: string): Promise<DataQueryResult> {
    try {
      let entity: any = null;
      let entityData: any = null;

      if (entityType === 'offer') {
        const response = await offersApi.getAll({ limit: 1000 });
        const offers = response.data?.offers || [];
        entity = offers.find((o: any) =>
          (o.offerNumber || '').toLowerCase() === entityNumber.toLowerCase() ||
          (o.offerNumber || '').toLowerCase().includes(entityNumber.toLowerCase())
        );
        if (entity) {
          entityData = {
            number: entity.offerNumber,
            contact: entity.contactName || entity.contact?.name,
            items: entity.items || [],
            subtotal: entity.subTotal || entity.subtotal || 0,
            tax: entity.taxAmount || entity.vat || 0,
            discount: entity.discountAmount || entity.discount || 0,
            total: entity.totalAmount || entity.total || 0,
            date: entity.createdAt || entity.date,
            validUntil: entity.validUntil || entity.expiryDate,
            status: entity.status
          };
        }
      } else if (entityType === 'sale') {
        const response = await salesApi.getAll({ limit: 1000 });
        const sales = response.data?.sales || [];
        entity = sales.find((s: any) =>
          (s.saleNumber || s.orderNumber || '').toLowerCase() === entityNumber.toLowerCase() ||
          (s.saleNumber || s.orderNumber || '').toLowerCase().includes(entityNumber.toLowerCase())
        );
        if (entity) {
          entityData = {
            number: entity.saleNumber || entity.orderNumber,
            contact: entity.contactName || entity.contact?.name,
            items: entity.items || [],
            subtotal: entity.subTotal || entity.subtotal || 0,
            tax: entity.taxAmount || entity.vat || 0,
            discount: entity.discountAmount || entity.discount || 0,
            total: entity.totalAmount || entity.total || 0,
            date: entity.createdAt || entity.date,
            status: entity.status
          };
        }
      }

      if (!entity || !entityData) {
        return {
          success: false,
          data: '',
          error: `Could not find ${entityType} with number: ${entityNumber}. Please check the number and try again.`
        };
      }

      // Generate invoice preview
      let result = `📄 **Invoice Preview**\n`;
      result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `**From ${entityType.toUpperCase()}:** ${entityData.number}\n`;
      result += `**Customer:** ${entityData.contact || 'Unknown'}\n`;
      result += `**Date:** ${new Date(entityData.date).toLocaleDateString()}\n`;
      result += `**Status:** ${entityData.status}\n\n`;

      result += `**Line Items:**\n`;
      if (entityData.items && entityData.items.length > 0) {
        entityData.items.slice(0, 10).forEach((item: any, i: number) => {
          const qty = item.quantity || 1;
          const price = item.unitPrice || item.price || 0;
          const lineTotal = item.lineTotal || item.total || (qty * price);
          result += `${i + 1}. ${item.articleName || item.name || item.description || 'Item'}\n`;
          result += `   Qty: ${qty} × ${price.toLocaleString()} ${getGlobalCurrencyCode()} = ${lineTotal.toLocaleString()} ${getGlobalCurrencyCode()}\n`;
        });
        if (entityData.items.length > 10) {
          result += `   _... and ${entityData.items.length - 10} more items_\n`;
        }
      } else {
        result += `   _No line items found_\n`;
      }

      result += `\n**━━━━━━━━━━━━━━━━━━━━━━**\n`;
      result += `   Subtotal: ${entityData.subtotal.toLocaleString()} ${getGlobalCurrencyCode()}\n`;
      if (entityData.discount > 0) {
        result += `   Discount: -${entityData.discount.toLocaleString()} ${getGlobalCurrencyCode()}\n`;
      }
      result += `   Tax (TVA): ${entityData.tax.toLocaleString()} ${getGlobalCurrencyCode()}\n`;
      result += `   **TOTAL: ${entityData.total.toLocaleString()} ${getGlobalCurrencyCode()}**\n`;
      result += `**━━━━━━━━━━━━━━━━━━━━━━**\n\n`;

      // Add action links
      const viewUrl = entityType === 'offer' ? `/dashboard/offers/${entity.id}` : `/dashboard/sales/${entity.id}`;
      result += `📥 [View ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}](${viewUrl})\n`;
      result += `🖨️ To download PDF, open the ${entityType} and click the PDF button.\n`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error generating invoice preview:', error);
      return { success: false, data: '', error: 'Could not generate invoice preview' };
    }
  },

  // Search and list invoiceable items
  async searchInvoiceableItems(searchTerm: string): Promise<DataQueryResult> {
    try {
      const [offersRes, salesRes] = await Promise.all([
        offersApi.getAll({ limit: 500 }),
        salesApi.getAll({ limit: 500 })
      ]);

      const offers = offersRes.data?.offers || [];
      const sales = salesRes.data?.sales || [];
      const term = searchTerm.toLowerCase();

      // Search in offers (only accepted or sent)
      const matchingOffers = offers.filter((o: any) => {
        const matchesSearch =
          (o.offerNumber || '').toLowerCase().includes(term) ||
          (o.contactName || o.contact?.name || '').toLowerCase().includes(term);
        const invoiceable = ['accepted', 'sent'].includes(o.status?.toLowerCase());
        return matchesSearch && invoiceable;
      });

      // Search in sales (pending or in_progress)
      const matchingSales = sales.filter((s: any) => {
        const matchesSearch =
          (s.saleNumber || s.orderNumber || '').toLowerCase().includes(term) ||
          (s.contactName || s.contact?.name || '').toLowerCase().includes(term);
        const invoiceable = ['pending', 'in_progress', 'completed'].includes(s.status?.toLowerCase());
        return matchesSearch && invoiceable;
      });

      let result = `🔍 **Invoiceable Items for "${searchTerm}"**\n\n`;

      if (matchingOffers.length === 0 && matchingSales.length === 0) {
        result += `No invoiceable offers or sales found matching "${searchTerm}".\n`;
        result += `\nTry searching by:\n- Customer name\n- Offer/Sale number\n- Company name`;
        return { success: true, data: result };
      }

      if (matchingOffers.length > 0) {
        result += `**📋 Offers (${matchingOffers.length}):**\n`;
        matchingOffers.slice(0, 5).forEach((o: any) => {
          result += `- **${o.offerNumber}** | ${o.contactName || o.contact?.name || 'Unknown'} | ${(o.totalAmount || 0).toLocaleString()} ${getGlobalCurrencyCode()} | ${o.status}\n`;
          result += `  Say: "generate invoice from offer ${o.offerNumber}"\n`;
        });
        result += '\n';
      }

      if (matchingSales.length > 0) {
        result += `**💰 Sales (${matchingSales.length}):**\n`;
        matchingSales.slice(0, 5).forEach((s: any) => {
          const num = s.saleNumber || s.orderNumber;
          result += `- **${num}** | ${s.contactName || s.contact?.name || 'Unknown'} | ${(s.totalAmount || 0).toLocaleString()} ${getGlobalCurrencyCode()} | ${s.status}\n`;
          result += `  Say: "generate invoice from sale ${num}"\n`;
        });
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error searching invoiceable items:', error);
      return { success: false, data: '', error: 'Could not search for invoiceable items' };
    }
  },

  // =============== ADVANCED ANALYTICS & FORECASTING ===============

  // Revenue Forecast - Predict next month's revenue based on trends
  async getRevenueForecast(): Promise<DataQueryResult> {
    try {
      const response = await salesApi.getAll({ limit: 1000 });
      const sales = response.data?.sales || [];

      // Group sales by month (last 6 months)
      const monthlyData: Record<string, { revenue: number; count: number }> = {};
      const now = new Date();

      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = { revenue: 0, count: 0 };
      }

      sales.forEach((s: any) => {
        const saleDate = new Date(s.createdAt || s.date);
        const key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          monthlyData[key].revenue += s.totalAmount || 0;
          monthlyData[key].count += 1;
        }
      });

      // Calculate trend (simple linear regression)
      const sortedMonths = Object.keys(monthlyData).sort();
      const revenueValues = sortedMonths.map(m => monthlyData[m].revenue);

      // Simple trend calculation
      const n = revenueValues.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += revenueValues[i];
        sumXY += i * revenueValues[i];
        sumX2 += i * i;
      }

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      const predictedRevenue = Math.max(0, slope * n + intercept);

      // Calculate average and trend percentage
      const avgRevenue = sumY / n;
      const trendPercent = avgRevenue > 0 ? ((predictedRevenue - avgRevenue) / avgRevenue * 100).toFixed(1) : '0';
      const trendIcon = parseFloat(trendPercent) > 0 ? '📈' : parseFloat(trendPercent) < 0 ? '📉' : '➡️';

      // Calculate confidence based on data consistency
      const variance = revenueValues.reduce((sum, v) => sum + Math.pow(v - avgRevenue, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      const coeffOfVariation = avgRevenue > 0 ? (stdDev / avgRevenue * 100) : 100;
      const confidence = coeffOfVariation < 20 ? 'High' : coeffOfVariation < 40 ? 'Medium' : 'Low';

      let result = `🔮 **Revenue Forecast**\n\n`;
      result += `**Next Month Prediction:** ${predictedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${getGlobalCurrencyCode()}\n`;
      result += `${trendIcon} **Trend:** ${trendPercent}% compared to average\n`;
      result += `📊 **Confidence:** ${confidence}\n\n`;

      result += `**Historical Data (Last 6 Months):**\n`;
      sortedMonths.forEach(month => {
        const data = monthlyData[month];
        const monthName = new Date(month + '-01').toLocaleString('en', { month: 'short', year: 'numeric' });
        result += `- ${monthName}: ${data.revenue.toLocaleString()} ${getGlobalCurrencyCode()} (${data.count} sales)\n`;
      });

      result += `\n💡 **Insight:** Based on your ${n}-month trend, ${parseFloat(trendPercent) > 10 ? 'revenue is growing steadily. Keep up the momentum!' :
          parseFloat(trendPercent) < -10 ? 'revenue is declining. Consider reviewing your sales strategy.' :
            'revenue is stable. Look for new opportunities to accelerate growth.'
        }`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting revenue forecast:', error);
      return { success: false, data: '', error: 'Could not generate revenue forecast' };
    }
  },

  // Compare periods (this month vs last month, this week vs last week)
  async getComparativeAnalytics(period: 'week' | 'month' = 'month'): Promise<DataQueryResult> {
    try {
      const [salesRes, offersRes, dispatchesRes] = await Promise.all([
        salesApi.getAll({ limit: 1000 }),
        offersApi.getAll({ limit: 1000 }),
        dispatchesApi.getAll({ pageSize: 1000 })
      ]);

      const sales = salesRes.data?.sales || [];
      const offers = offersRes.data?.offers || [];
      const dispatches = dispatchesRes.data || [];

      const now = new Date();
      const currentStart = new Date(now);
      const previousStart = new Date(now);
      const previousEnd = new Date(now);

      if (period === 'week') {
        currentStart.setDate(now.getDate() - 7);
        previousStart.setDate(now.getDate() - 14);
        previousEnd.setDate(now.getDate() - 7);
      } else {
        currentStart.setMonth(now.getMonth() - 1);
        previousStart.setMonth(now.getMonth() - 2);
        previousEnd.setMonth(now.getMonth() - 1);
      }

      const inRange = (date: Date, start: Date, end: Date) => date >= start && date <= end;

      // Current period stats
      const currentSales = sales.filter((s: any) => {
        const d = new Date(s.createdAt || s.date);
        return inRange(d, currentStart, now);
      });
      const currentOffers = offers.filter((o: any) => {
        const d = new Date(o.createdAt || o.date);
        return inRange(d, currentStart, now);
      });
      const currentDispatches = dispatches.filter((d: any) => {
        const dt = new Date(d.scheduledDate || d.createdAt);
        return inRange(dt, currentStart, now);
      });

      // Previous period stats
      const prevSales = sales.filter((s: any) => {
        const d = new Date(s.createdAt || s.date);
        return inRange(d, previousStart, previousEnd);
      });
      const prevOffers = offers.filter((o: any) => {
        const d = new Date(o.createdAt || o.date);
        return inRange(d, previousStart, previousEnd);
      });
      const prevDispatches = dispatches.filter((d: any) => {
        const dt = new Date(d.scheduledDate || d.createdAt);
        return inRange(dt, previousStart, previousEnd);
      });

      const calcChange = (current: number, previous: number): string => {
        if (previous === 0) return current > 0 ? '+∞' : '0';
        const change = ((current - previous) / previous * 100).toFixed(1);
        return parseFloat(change) >= 0 ? `+${change}` : change;
      };

      const getIcon = (current: number, previous: number): string => {
        if (current > previous) return '📈';
        if (current < previous) return '📉';
        return '➡️';
      };

      const currentRevenue = currentSales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
      const prevRevenue = prevSales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

      const periodLabel = period === 'week' ? 'Week' : 'Month';

      let result = `📊 **Comparative Analytics: This ${periodLabel} vs Last ${periodLabel}**\n\n`;

      result += `**💰 Revenue:**\n`;
      result += `  ${getIcon(currentRevenue, prevRevenue)} Current: ${currentRevenue.toLocaleString()} ${getGlobalCurrencyCode()}\n`;
      result += `  ⏮️ Previous: ${prevRevenue.toLocaleString()} ${getGlobalCurrencyCode()}\n`;
      result += `  📈 Change: ${calcChange(currentRevenue, prevRevenue)}%\n\n`;

      result += `**🛒 Sales:**\n`;
      result += `  ${getIcon(currentSales.length, prevSales.length)} Current: ${currentSales.length}\n`;
      result += `  ⏮️ Previous: ${prevSales.length}\n`;
      result += `  📈 Change: ${calcChange(currentSales.length, prevSales.length)}%\n\n`;

      result += `**📋 Offers:**\n`;
      result += `  ${getIcon(currentOffers.length, prevOffers.length)} Current: ${currentOffers.length}\n`;
      result += `  ⏮️ Previous: ${prevOffers.length}\n`;
      result += `  📈 Change: ${calcChange(currentOffers.length, prevOffers.length)}%\n\n`;

      result += `**🔧 Dispatches:**\n`;
      result += `  ${getIcon(currentDispatches.length, prevDispatches.length)} Current: ${currentDispatches.length}\n`;
      result += `  ⏮️ Previous: ${prevDispatches.length}\n`;
      result += `  📈 Change: ${calcChange(currentDispatches.length, prevDispatches.length)}%\n`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting comparative analytics:', error);
      return { success: false, data: '', error: 'Could not generate comparative analytics' };
    }
  },

  // Scheduling Optimization Recommendations
  async getSchedulingRecommendations(): Promise<DataQueryResult> {
    try {
      const [dispatchesRes, usersRes] = await Promise.all([
        dispatchesApi.getAll({ pageSize: 1000 }),
        usersApi.getAll()
      ]);

      const dispatches = dispatchesRes.data || [];
      const users = usersRes.users || [];

      // Find technicians
      const technicians = users.filter((u: any) =>
        u.roles?.some((r: any) => r.name?.toLowerCase().includes('technician'))
      );

      // Calculate workload per technician (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      const workload: Record<string, { name: string; count: number; hours: number }> = {};

      technicians.forEach((t: any) => {
        workload[t.id] = { name: t.fullName || t.name || t.email, count: 0, hours: 0 };
      });

      const upcomingDispatches = dispatches.filter((d: any) => {
        const date = new Date(d.scheduledDate);
        return date >= now && date <= nextWeek && d.status !== 'cancelled' && d.status !== 'completed';
      });

      upcomingDispatches.forEach((d: any) => {
        if (d.technicianId && workload[d.technicianId]) {
          workload[d.technicianId].count += 1;
          workload[d.technicianId].hours += d.estimatedDuration || d.duration || 2;
        }
      });

      // Find unassigned jobs
      const unassigned = dispatches.filter((d: any) =>
        !d.technicianId && d.status !== 'cancelled' && d.status !== 'completed'
      );

      // Identify bottlenecks and recommendations
      const overloaded = Object.values(workload).filter(w => w.count > 8 || w.hours > 40);
      const underutilized = Object.values(workload).filter(w => w.count < 3 && w.hours < 15);

      let result = `🗓️ **Scheduling Optimization Recommendations**\n\n`;

      result += `**📊 Workload Overview (Next 7 Days):**\n`;
      Object.values(workload)
        .sort((a, b) => b.hours - a.hours)
        .forEach(w => {
          const loadIcon = w.hours > 40 ? '🔴' : w.hours > 25 ? '🟡' : '🟢';
          result += `${loadIcon} **${w.name}**: ${w.count} jobs, ${w.hours}h scheduled\n`;
        });

      result += `\n**⚠️ Recommendations:**\n`;

      if (unassigned.length > 0) {
        result += `\n🔸 **${unassigned.length} Unassigned Jobs** need scheduling:\n`;
        unassigned.slice(0, 5).forEach((d: any) => {
          result += `  - ${d.dispatchNumber || d.id}: ${d.title || d.description?.slice(0, 40) || 'No title'}\n`;
        });
        if (unassigned.length > 5) {
          result += `  _... and ${unassigned.length - 5} more_\n`;
        }
      }

      if (overloaded.length > 0) {
        result += `\n🔸 **Overloaded Technicians** (consider redistributing):\n`;
        overloaded.forEach(t => {
          result += `  - ${t.name}: ${t.count} jobs (${t.hours}h)\n`;
        });
      }

      if (underutilized.length > 0 && unassigned.length > 0) {
        result += `\n🔸 **Available Capacity** (can take more work):\n`;
        underutilized.forEach(t => {
          result += `  - ${t.name}: Only ${t.count} jobs (${t.hours}h) - can handle ${Math.floor((40 - t.hours) / 2)} more jobs\n`;
        });
      }

      if (unassigned.length === 0 && overloaded.length === 0) {
        result += `\n✅ Great job! Your schedule is well-balanced with no major issues.`;
      }

      result += `\n\n💡 **Pro Tip:** Use the [Dispatcher](/field/dispatcher) to drag-and-drop jobs for visual scheduling.`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting scheduling recommendations:', error);
      return { success: false, data: '', error: 'Could not generate scheduling recommendations' };
    }
  },

  // Demand Forecast - Predict busy periods
  async getDemandForecast(): Promise<DataQueryResult> {
    try {
      const response = await dispatchesApi.getAll({ pageSize: 2000 });
      const dispatches = response.data || [];

      // Analyze dispatch patterns by day of week and time
      const byDayOfWeek: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      const byHour: Record<number, number> = {};

      for (let h = 6; h <= 20; h++) {
        byHour[h] = 0;
      }

      dispatches.forEach((d: any) => {
        const date = new Date(d.scheduledDate || d.createdAt);
        byDayOfWeek[date.getDay()] += 1;
        const hour = date.getHours();
        if (byHour[hour] !== undefined) {
          byHour[hour] += 1;
        }
      });

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const totalDispatches = dispatches.length || 1;

      // Find busiest and slowest days
      const sortedDays = Object.entries(byDayOfWeek)
        .map(([day, count]) => ({ day: parseInt(day), count, name: dayNames[parseInt(day)] }))
        .sort((a, b) => b.count - a.count);

      const busiestDays = sortedDays.slice(0, 3);
      const slowestDays = sortedDays.slice(-2).reverse();

      // Find peak hours
      const sortedHours = Object.entries(byHour)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count);

      const peakHours = sortedHours.slice(0, 3);

      let result = `📅 **Demand Forecast & Patterns**\n\n`;

      result += `**🔥 Busiest Days:**\n`;
      busiestDays.forEach((d, i) => {
        const pct = ((d.count / totalDispatches) * 100).toFixed(1);
        result += `${i + 1}. ${d.name}: ${d.count} dispatches (${pct}%)\n`;
      });

      result += `\n**🌙 Slowest Days:**\n`;
      slowestDays.forEach((d, i) => {
        const pct = ((d.count / totalDispatches) * 100).toFixed(1);
        result += `${i + 1}. ${d.name}: ${d.count} dispatches (${pct}%)\n`;
      });

      result += `\n**⏰ Peak Hours:**\n`;
      peakHours.forEach((h, i) => {
        const timeStr = `${h.hour}:00 - ${h.hour + 1}:00`;
        result += `${i + 1}. ${timeStr}: ${h.count} dispatches\n`;
      });

      result += `\n**💡 Recommendations:**\n`;
      result += `- Staff more technicians on ${busiestDays[0].name}s\n`;
      result += `- Schedule complex jobs during ${slowestDays[0].name}s for fewer interruptions\n`;
      result += `- Avoid scheduling training during peak hours (${peakHours[0].hour}:00)\n`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting demand forecast:', error);
      return { success: false, data: '', error: 'Could not generate demand forecast' };
    }
  },

  // Anomaly Detection - Find unusual patterns
  async getAnomalyDetection(): Promise<DataQueryResult> {
    try {
      const [salesRes, offersRes, articlesRes] = await Promise.all([
        salesApi.getAll({ limit: 1000 }),
        offersApi.getAll({ limit: 1000 }),
        articlesApi.getAll({ limit: 1000 })
      ]);

      const sales = salesRes.data?.sales || [];
      const offers = offersRes.data?.offers || [];
      const articles = (articlesRes.data || articlesRes) as any[];

      const anomalies: { type: string; severity: 'low' | 'medium' | 'high'; message: string }[] = [];

      // Check for unusually large sales
      const saleAmounts = sales.map((s: any) => s.totalAmount || 0).filter((a: number) => a > 0);
      if (saleAmounts.length > 5) {
        const avgSale = saleAmounts.reduce((a: number, b: number) => a + b, 0) / saleAmounts.length;
        const stdDev = Math.sqrt(saleAmounts.reduce((sum: number, a: number) => sum + Math.pow(a - avgSale, 2), 0) / saleAmounts.length);

        const unusualSales = sales.filter((s: any) =>
          (s.totalAmount || 0) > avgSale + 2 * stdDev
        );

        unusualSales.slice(0, 3).forEach((s: any) => {
          anomalies.push({
            type: 'Unusual Sale',
            severity: 'medium',
            message: `Sale ${s.saleNumber || s.id} (${(s.totalAmount || 0).toLocaleString()} ${getGlobalCurrencyCode()}) is ${((s.totalAmount - avgSale) / avgSale * 100).toFixed(0)}% above average`
          });
        });
      }

      // Check for high rejection rate
      const rejectedOffers = offers.filter((o: any) => o.status === 'rejected').length;
      const totalOffers = offers.length || 1;
      const rejectionRate = (rejectedOffers / totalOffers) * 100;

      if (rejectionRate > 40) {
        anomalies.push({
          type: 'High Rejection Rate',
          severity: 'high',
          message: `${rejectionRate.toFixed(1)}% of offers are rejected - review pricing or targeting`
        });
      }

      // Check for low stock anomalies
      const lowStockItems = articles.filter((a: any) => {
        const stock = a.stock || a.stockQuantity || a.stockLevel || 0;
        const reorderPoint = a.reorderPoint || a.minStock || 5;
        return a.type !== 'service' && stock < reorderPoint && stock >= 0;
      });

      if (lowStockItems.length > 5) {
        anomalies.push({
          type: 'Critical Stock Levels',
          severity: 'high',
          message: `${lowStockItems.length} items are below reorder point - immediate attention needed`
        });
      }

      // Check for stale offers
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const staleOffers = offers.filter((o: any) => {
        const date = new Date(o.createdAt || o.date);
        return date < thirtyDaysAgo && (o.status === 'sent' || o.status === 'draft');
      });

      if (staleOffers.length > 3) {
        anomalies.push({
          type: 'Stale Offers',
          severity: 'low',
          message: `${staleOffers.length} offers are over 30 days old without response - consider follow-up`
        });
      }

      let result = `🔍 **Anomaly Detection Report**\n\n`;

      if (anomalies.length === 0) {
        result += `✅ **No significant anomalies detected!**\n\n`;
        result += `Your business metrics are within normal ranges. Keep up the good work!`;
      } else {
        result += `Found **${anomalies.length} potential issues** to review:\n\n`;

        const highSev = anomalies.filter(a => a.severity === 'high');
        const medSev = anomalies.filter(a => a.severity === 'medium');
        const lowSev = anomalies.filter(a => a.severity === 'low');

        if (highSev.length > 0) {
          result += `**🔴 High Priority:**\n`;
          highSev.forEach(a => result += `- ${a.type}: ${a.message}\n`);
          result += '\n';
        }

        if (medSev.length > 0) {
          result += `**🟡 Medium Priority:**\n`;
          medSev.forEach(a => result += `- ${a.type}: ${a.message}\n`);
          result += '\n';
        }

        if (lowSev.length > 0) {
          result += `**🟢 Low Priority:**\n`;
          lowSev.forEach(a => result += `- ${a.type}: ${a.message}\n`);
        }
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error running anomaly detection:', error);
      return { success: false, data: '', error: 'Could not run anomaly detection' };
    }
  },

  // Customer Churn Risk Analysis
  async getChurnRiskAnalysis(): Promise<DataQueryResult> {
    try {
      const [contactsRes, salesRes, offersRes] = await Promise.all([
        contactsApi.getAll({ pageSize: 1000 }),
        salesApi.getAll({ limit: 1000 }),
        offersApi.getAll({ limit: 1000 })
      ]);

      const contacts = contactsRes.contacts || [];
      const sales = salesRes.data?.sales || [];
      const offers = offersRes.data?.offers || [];

      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);

      // Build customer activity map
      const customerActivity: Record<string, {
        name: string;
        lastActivity: Date | null;
        totalSpent: number;
        activityCount: number;
      }> = {};

      contacts.forEach((c: any) => {
        customerActivity[c.id] = {
          name: c.displayName || c.name || c.email || 'Unknown',
          lastActivity: null,
          totalSpent: 0,
          activityCount: 0
        };
      });

      sales.forEach((s: any) => {
        const contactId = s.contactId || s.contact?.id;
        if (contactId && customerActivity[contactId]) {
          const saleDate = new Date(s.createdAt || s.date);
          if (!customerActivity[contactId].lastActivity || saleDate > customerActivity[contactId].lastActivity!) {
            customerActivity[contactId].lastActivity = saleDate;
          }
          customerActivity[contactId].totalSpent += s.totalAmount || 0;
          customerActivity[contactId].activityCount += 1;
        }
      });

      offers.forEach((o: any) => {
        const contactId = o.contactId || o.contact?.id;
        if (contactId && customerActivity[contactId]) {
          const offerDate = new Date(o.createdAt || o.date);
          if (!customerActivity[contactId].lastActivity || offerDate > customerActivity[contactId].lastActivity!) {
            customerActivity[contactId].lastActivity = offerDate;
          }
          customerActivity[contactId].activityCount += 1;
        }
      });

      // Identify at-risk customers
      const atRisk = Object.values(customerActivity)
        .filter(c => c.lastActivity && c.lastActivity < threeMonthsAgo && c.totalSpent > 1000)
        .sort((a, b) => b.totalSpent - a.totalSpent);

      const dormant = Object.values(customerActivity)
        .filter(c => c.lastActivity && c.lastActivity < sixMonthsAgo)
        .sort((a, b) => b.totalSpent - a.totalSpent);

      let result = `⚠️ **Customer Churn Risk Analysis**\n\n`;

      result += `**🔴 At-Risk Customers (No activity in 3+ months, high value):**\n`;
      if (atRisk.length === 0) {
        result += `✅ No high-value customers at risk!\n\n`;
      } else {
        atRisk.slice(0, 5).forEach(c => {
          const daysSince = c.lastActivity ? Math.floor((now.getTime() - c.lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          result += `- **${c.name}**: ${c.totalSpent.toLocaleString()} ${getGlobalCurrencyCode()} spent, ${daysSince} days since last activity\n`;
        });
        if (atRisk.length > 5) {
          result += `_... and ${atRisk.length - 5} more_\n`;
        }
        result += '\n';
      }

      result += `**💤 Dormant Customers (No activity in 6+ months):**\n`;
      if (dormant.length === 0) {
        result += `All customers have recent activity!\n`;
      } else {
        result += `${dormant.length} customers haven't been active in 6+ months.\n`;
        result += `Total potential revenue at risk: ${dormant.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()} ${getGlobalCurrencyCode()}\n\n`;
      }

      result += `**💡 Recommendations:**\n`;
      if (atRisk.length > 0) {
        result += `- Send personalized re-engagement emails to top ${Math.min(5, atRisk.length)} at-risk customers\n`;
        result += `- Offer special discounts or service upgrades\n`;
      }
      if (dormant.length > 0) {
        result += `- Consider a win-back campaign for dormant customers\n`;
      }
      result += `- Set up automated alerts for customer inactivity\n`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error analyzing churn risk:', error);
      return { success: false, data: '', error: 'Could not analyze churn risk' };
    }
  },

  // Profitability Analysis
  async getProfitabilityAnalysis(): Promise<DataQueryResult> {
    try {
      const [salesRes, articlesRes] = await Promise.all([
        salesApi.getAll({ limit: 1000 }),
        articlesApi.getAll({ limit: 1000 })
      ]);

      const sales = salesRes.data?.sales || [];
      const articles = (articlesRes.data || articlesRes) as any[];

      // Build article cost map
      const articleCosts: Record<string, { name: string; price: number; cost: number }> = {};
      articles.forEach((a: any) => {
        articleCosts[a.id] = {
          name: a.name,
          price: a.price || a.unitPrice || 0,
          cost: a.costPrice || a.cost || (a.price || a.unitPrice || 0) * 0.6 // Assume 40% margin if no cost
        };
      });

      // Calculate profitability by article
      const articleProfit: Record<string, { name: string; revenue: number; cost: number; quantity: number }> = {};

      sales.forEach((s: any) => {
        (s.items || []).forEach((item: any) => {
          const articleId = item.articleId || item.id;
          const articleInfo = articleCosts[articleId];
          if (!articleProfit[articleId]) {
            articleProfit[articleId] = {
              name: item.name || articleInfo?.name || 'Unknown',
              revenue: 0,
              cost: 0,
              quantity: 0
            };
          }
          const qty = item.quantity || 1;
          const itemRevenue = (item.price || item.unitPrice || articleInfo?.price || 0) * qty;
          const itemCost = (articleInfo?.cost || itemRevenue * 0.6) * qty;

          articleProfit[articleId].revenue += itemRevenue;
          articleProfit[articleId].cost += itemCost;
          articleProfit[articleId].quantity += qty;
        });
      });

      // Calculate margins and sort
      const profitData = Object.values(articleProfit)
        .map(a => ({
          ...a,
          profit: a.revenue - a.cost,
          margin: a.revenue > 0 ? ((a.revenue - a.cost) / a.revenue * 100) : 0
        }))
        .sort((a, b) => b.profit - a.profit);

      const totalRevenue = profitData.reduce((sum, a) => sum + a.revenue, 0);
      const totalCost = profitData.reduce((sum, a) => sum + a.cost, 0);
      const totalProfit = totalRevenue - totalCost;
      const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

      let result = `💹 **Profitability Analysis**\n\n`;

      result += `**📊 Overall Performance:**\n`;
      result += `- Total Revenue: ${totalRevenue.toLocaleString()} ${getGlobalCurrencyCode()}\n`;
      result += `- Total Cost: ${totalCost.toLocaleString()} ${getGlobalCurrencyCode()}\n`;
      result += `- **Gross Profit: ${totalProfit.toLocaleString()} ${getGlobalCurrencyCode()}**\n`;
      result += `- **Margin: ${overallMargin.toFixed(1)}%**\n\n`;

      result += `**🏆 Top Profit Generators:**\n`;
      profitData.slice(0, 5).forEach((a, i) => {
        result += `${i + 1}. **${a.name}**: ${a.profit.toLocaleString()} ${getGlobalCurrencyCode()} profit (${a.margin.toFixed(1)}% margin, ${a.quantity} sold)\n`;
      });

      const lowMargin = profitData.filter(a => a.margin < 20 && a.quantity > 0);
      if (lowMargin.length > 0) {
        result += `\n**⚠️ Low Margin Products (<20%):**\n`;
        lowMargin.slice(0, 3).forEach(a => {
          result += `- ${a.name}: ${a.margin.toFixed(1)}% margin\n`;
        });
      }

      result += `\n**💡 Recommendations:**\n`;
      if (overallMargin < 30) {
        result += `- Overall margin is low - review pricing strategy\n`;
      }
      if (lowMargin.length > 3) {
        result += `- Consider discontinuing or repricing ${lowMargin.length} low-margin products\n`;
      }
      result += `- Focus sales efforts on top profit generators\n`;

      return { success: true, data: result };
    } catch (error) {
      console.error('Error analyzing profitability:', error);
      return { success: false, data: '', error: 'Could not analyze profitability' };
    }
  },

  // Technician Efficiency Scoring
  async getTechnicianEfficiency(): Promise<DataQueryResult> {
    try {
      const [dispatchesRes, usersRes] = await Promise.all([
        dispatchesApi.getAll({ pageSize: 2000 }),
        usersApi.getAll()
      ]);

      const dispatches = dispatchesRes.data || [];
      const users = usersRes.users || [];

      const technicians = users.filter((u: any) =>
        u.roles?.some((r: any) => r.name?.toLowerCase().includes('technician'))
      );

      const techStats: Record<string, {
        name: string;
        completed: number;
        total: number;
        avgDuration: number;
        onTime: number;
        firstTimeFix: number;
      }> = {};

      technicians.forEach((t: any) => {
        techStats[t.id] = {
          name: t.fullName || t.name || t.email,
          completed: 0,
          total: 0,
          avgDuration: 0,
          onTime: 0,
          firstTimeFix: 0
        };
      });

      // Last 30 days only
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentDispatches = dispatches.filter((d: any) => {
        const date = new Date(d.scheduledDate || d.createdAt);
        return date >= thirtyDaysAgo;
      });

      recentDispatches.forEach((d: any) => {
        if (d.technicianId && techStats[d.technicianId]) {
          techStats[d.technicianId].total += 1;
          if (d.status === 'completed') {
            techStats[d.technicianId].completed += 1;
            // Check if completed on time
            if (d.completedAt && d.scheduledDate) {
              const scheduled = new Date(d.scheduledDate);
              const completed = new Date(d.completedAt);
              scheduled.setHours(scheduled.getHours() + (d.estimatedDuration || 2));
              if (completed <= scheduled) {
                techStats[d.technicianId].onTime += 1;
              }
            }
            // First time fix (no follow-up required)
            if (!d.requiresFollowUp) {
              techStats[d.technicianId].firstTimeFix += 1;
            }
          }
        }
      });

      // Calculate efficiency scores
      const efficiency = Object.values(techStats)
        .filter(t => t.total > 0)
        .map(t => ({
          ...t,
          completionRate: (t.completed / t.total * 100),
          onTimeRate: t.completed > 0 ? (t.onTime / t.completed * 100) : 0,
          ftfRate: t.completed > 0 ? (t.firstTimeFix / t.completed * 100) : 0,
          score: (
            (t.completed / t.total * 40) + // Completion 40%
            (t.completed > 0 ? t.onTime / t.completed * 30 : 0) + // On-time 30%
            (t.completed > 0 ? t.firstTimeFix / t.completed * 30 : 0) // FTF 30%
          )
        }))
        .sort((a, b) => b.score - a.score);

      let result = `⚡ **Technician Efficiency Scores (Last 30 Days)**\n\n`;

      if (efficiency.length === 0) {
        result += `No technician dispatch data found for the last 30 days.`;
        return { success: true, data: result };
      }

      efficiency.forEach((t, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
        const scoreIcon = t.score >= 80 ? '🟢' : t.score >= 60 ? '🟡' : '🔴';
        result += `${medal} **${t.name}**\n`;
        result += `   ${scoreIcon} Score: ${t.score.toFixed(0)}/100\n`;
        result += `   📊 Completion: ${t.completionRate.toFixed(0)}% (${t.completed}/${t.total})\n`;
        result += `   ⏱️ On-Time: ${t.onTimeRate.toFixed(0)}%\n`;
        result += `   ✅ First-Time Fix: ${t.ftfRate.toFixed(0)}%\n\n`;
      });

      const teamAvg = efficiency.reduce((sum, t) => sum + t.score, 0) / efficiency.length;
      result += `**📈 Team Average Score: ${teamAvg.toFixed(0)}/100**\n`;

      if (teamAvg < 70) {
        result += `\n⚠️ Team efficiency is below target. Consider additional training or process improvements.`;
      } else if (teamAvg >= 85) {
        result += `\n🎉 Excellent team performance! Keep up the great work!`;
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error calculating technician efficiency:', error);
      return { success: false, data: '', error: 'Could not calculate technician efficiency' };
    }
  }
};

// Helper function for article search results
const formatArticleResults = (articles: any[], searchTerm: string): DataQueryResult => {
  let result = `🔍 **Article Search Results for "${searchTerm}" (${articles.length} found)**:\n\n`;

  articles.slice(0, 10).forEach((a: any) => {
    const typeIcon = a.type === 'service' ? '🔧' : '📦';
    const stock = a.stockLevel ?? a.quantity;
    result += `${typeIcon} **${a.name}**\n`;
    if (a.sku) result += `   Reference: ${a.sku}\n`;
    if (stock !== undefined) result += `   Stock: ${stock}\n`;
    if (a.price) result += `   Price: ${a.price.toLocaleString()} ${getGlobalCurrencyCode()}\n`;
    result += `   🔗 [View Article](/dashboard/articles/${a.id})\n\n`;
  });

  if (articles.length > 10) {
    result += `_... and ${articles.length - 10} more results_\n`;
  }

  return { success: true, data: result };
};

// Helper for time of day greeting
const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

// Keywords to detect data queries
const DATA_QUERY_PATTERNS = [
  { patterns: ['how many articles', 'combien d\'articles', 'articles count', 'number of articles', 'total articles', 'articles stats'], query: 'getArticlesCount' },
  { patterns: ['how many offers', 'how many open offers', 'combien de devis', 'offers count', 'number of offers', 'total offers', 'offers stats', 'offers overview', 'open offers', 'my offers', 'mes devis', 'devis ouverts'], query: 'getOffersStats' },
  { patterns: ['how many sales', 'combien de ventes', 'sales count', 'number of sales', 'total sales', 'sales stats', 'sales overview'], query: 'getSalesStats' },
  { patterns: ['how many contacts', 'combien de contacts', 'contacts count', 'number of contacts', 'total contacts', 'customers count'], query: 'getContactsCount' },
  { patterns: ['how many users', 'combien d\'utilisateurs', 'users count', 'technicians count', 'team size', 'employees'], query: 'getUsersStats' },
  { patterns: ['service orders', 'ordres de service', 'how many service', 'service order stats', 'work orders'], query: 'getServiceOrdersStats' },
  { patterns: ['today tasks', 'tasks for today', 'tâches aujourd\'hui', 'my tasks today', 'today\'s tasks', 'what do i have to do today', 'what do i need to do today', 'what should i do today', 'quoi faire aujourd\'hui', 'que dois-je faire', 'mes tâches', 'show my tasks', 'list my tasks', 'what are my tasks', 'plan for today', 'today\'s plan', 'what\'s on my plate'], query: 'getTodaysTasks' },
  { patterns: ['all my tasks', 'all daily tasks', 'toutes mes tâches', 'upcoming tasks', 'show all tasks', 'my task list', 'what tasks do i have', 'pending tasks'], query: 'getAllDailyTasks' },
  { patterns: ['not working today', 'absent today', 'on leave today', 'who is off', 'technicians off', 'pas travail', 'congé aujourd\'hui', 'absent', 'disponibilité', 'who is working', 'qui travaille', 'team availability', 'available today'], query: 'getTechniciansNotWorkingToday' },
  { patterns: ['urgent', 'priority items', 'important items', 'pending items', 'priorité', 'en attente', 'critical items'], query: 'getUrgentItems' },
  { patterns: ['how many projects', 'combien de projets', 'projects count', 'project stats', 'projects overview', 'active projects'], query: 'getProjectsStats' },
  { patterns: ['how many deals', 'combien de deals', 'deals count', 'deal stats', 'deals overview', 'deals pipeline', 'open deals', 'won deals', 'lost deals', 'mes deals', 'opportunities', 'opportunités'], query: 'getDealsStats' },
  { patterns: ['how many installations', 'combien d\'installations', 'installations count', 'installation stats', 'equipment', 'machines'], query: 'getInstallationsStats' },
  { patterns: ['how many dispatches', 'combien de dispatches', 'dispatches count', 'dispatch stats', 'field service', 'interventions'], query: 'getDispatchesStats' },
  { patterns: ['today dispatches', 'dispatches today', 'interventions aujourd\'hui', 'field work today', 'scheduled today'], query: 'getTodaysDispatches' },
  { patterns: ['overdue', 'late tasks', 'tâches en retard', 'missed deadline', 'past due', 'behind schedule'], query: 'getOverdueTasks' },
  { patterns: ['warranty', 'garantie', 'expiring warranty', 'warranty expiring', 'warranty status', 'garanties expirantes'], query: 'getExpiringWarranties' },
  { patterns: ['revenue', 'monthly revenue', 'revenue trends', 'sales trends', 'income', 'chiffre d\'affaires', 'tendances', 'monthly sales', 'revenue report'], query: 'getMonthlyRevenueTrends' },
  { patterns: ['top technician', 'best technician', 'technician performance', 'meilleur technicien', 'performance technicien', 'top performer', 'best performer', 'technician ranking', 'who is best'], query: 'getTopTechnicians' },
  { patterns: ['summary', 'overview', 'dashboard summary', 'résumé', 'aperçu', 'give me stats', 'show me stats', 'all data', 'full report', 'everything'], query: 'getDashboardSummary' },
  // New dynamic queries
  { patterns: ['conversion rate', 'taux de conversion', 'offer to sale', 'win rate', 'close rate', 'how many accepted', 'acceptance rate'], query: 'getConversionRate' },
  { patterns: ['pipeline', 'sales pipeline', 'offer pipeline', 'pipeline value', 'weighted pipeline', 'forecast', 'prévisions'], query: 'getPipelineValue' },
  { patterns: ['maintenance', 'upcoming maintenance', 'preventive maintenance', 'maintenance due', 'service due', 'entretien préventif', 'prochain entretien'], query: 'getUpcomingMaintenance' },
  { patterns: ['recent activity', 'activity feed', 'what happened', 'recent changes', 'activité récente', 'dernières activités', 'latest updates'], query: 'getRecentActivity' },
  { patterns: ['workload', 'technician workload', 'charge de travail', 'who is busy', 'work distribution', 'team workload'], query: 'getTechnicianWorkload' },
  { patterns: ['customer stats', 'customer statistics', 'top customers', 'best customers', 'meilleurs clients', 'statistiques clients', 'customer revenue'], query: 'getCustomerStats' },
  { patterns: ['low stock', 'stock alert', 'out of stock', 'inventory alert', 'rupture de stock', 'stock faible', 'need to reorder'], query: 'getLowStockAlerts' },
  { patterns: ['weekly performance', 'this week', 'week summary', 'performance cette semaine', 'résumé semaine', 'how did we do this week', 'weekly report'], query: 'getWeeklyPerformance' },
  // Dynamic Forms queries
  { patterns: ['dynamic forms', 'formulaires dynamiques', 'forms stats', 'how many forms', 'form count', 'combien de formulaires'], query: 'getDynamicFormsStats' },
  { patterns: ['list forms', 'show forms', 'all forms', 'available forms', 'formulaires disponibles', 'voir les formulaires', 'my forms', 'mes formulaires'], query: 'getDynamicFormsList' },
  { patterns: ['active forms', 'published forms', 'forms to use', 'formulaires actifs', 'use form', 'fill form', 'remplir formulaire'], query: 'getActiveFormsForUse' },
  // NEW QUERIES
  { patterns: ['notifications', 'my notifications', 'unread notifications', 'alertes', 'mes notifications', 'check notifications'], query: 'getNotificationsSummary' },
  { patterns: ['roles', 'permissions', 'user roles', 'rôles', 'droits', 'access rights', 'who can'], query: 'getRolesOverview' },
  { patterns: ['currencies', 'devises', 'exchange', 'money', 'available currencies'], query: 'getCurrencies' },
  { patterns: ['priority list', 'priority levels', 'niveaux de priorité', 'what priorities'], query: 'getPrioritiesList' },
  { patterns: ['leave types', 'vacation types', 'types de congé', 'absence types', 'time off types'], query: 'getLeaveTypes' },
  { patterns: ['skills list', 'available skills', 'compétences', 'what skills', 'technician skills'], query: 'getSkillsList' },
  { patterns: ['locations list', 'available locations', 'sites', 'emplacements', 'where', 'warehouses'], query: 'getLocationsList' },
  { patterns: ['today summary', 'my day', 'day summary', 'morning summary', 'what\'s today', 'good morning', 'bonjour', 'ma journée'], query: 'getTodaySummary' },
  { patterns: ['business metrics', 'kpi', 'key metrics', 'indicateurs', 'métriques', 'business overview', 'performance metrics'], query: 'getBusinessMetrics' },
  // FIELD SERVICE QUERIES
  { patterns: ['today dispatches', 'dispatches today', 'today\'s dispatches', 'interventions aujourd\'hui', 'planned jobs', 'scheduled jobs today'], query: 'getTodayDispatches' },
  { patterns: ['pending dispatches', 'unassigned dispatches', 'dispatches en attente', 'jobs waiting', 'unscheduled work', 'awaiting assignment'], query: 'getPendingDispatches' },
  { patterns: ['overdue dispatches', 'late dispatches', 'delayed jobs', 'interventions en retard', 'missed deadlines', 'behind schedule'], query: 'getOverdueDispatches' },
  { patterns: ['dispatch stats', 'dispatch statistics', 'job statistics', 'statistiques interventions', 'dispatch overview', 'field stats'], query: 'getDispatchStats' },
  { patterns: ['technician schedule', 'who is working', 'field team today', 'équipe terrain', 'technicians on duty', 'who is dispatched'], query: 'getTechnicianScheduleToday' },
  { patterns: ['service order backlog', 'pending orders', 'orders backlog', 'carnet de commandes', 'waiting service orders', 'order queue'], query: 'getServiceOrderBacklog' },
  { patterns: ['urgent service orders', 'priority orders', 'ordres urgents', 'critical jobs', 'high priority work', 'urgent interventions'], query: 'getUrgentServiceOrders' },
  { patterns: ['completed today', 'finished today', 'jobs done today', 'travaux terminés', 'completed dispatches', 'work completed'], query: 'getCompletedToday' },
  { patterns: ['first time fix', 'fix rate', 'taux de résolution', 'resolution rate', 'ftf rate', 'first visit fix'], query: 'getFirstTimeFixRate' },
  { patterns: ['average job time', 'job duration', 'temps moyen', 'average completion time', 'how long jobs take'], query: 'getAverageJobDuration' },
  { patterns: ['installations by status', 'installation breakdown', 'equipment status', 'état des installations', 'active installations'], query: 'getInstallationsByStatus' },
  { patterns: ['warranty expiring soon', 'warranties ending', 'garanties expirant', 'upcoming warranty end', 'warranty renewals needed'], query: 'getWarrantiesExpiringSoon' },
  { patterns: ['field revenue', 'service revenue', 'revenus terrain', 'field income', 'service income', 'job revenue'], query: 'getFieldServiceRevenue' },
  { patterns: ['customer site visits', 'visits this week', 'visites clients', 'site visits', 'customer visits'], query: 'getCustomerSiteVisits' },
  { patterns: ['technician availability', 'who is free', 'available technicians', 'techniciens disponibles', 'free technicians'], query: 'getAvailableTechnicians' },
  { patterns: ['materials used', 'parts consumed', 'matériaux utilisés', 'inventory consumed', 'parts used today'], query: 'getMaterialsUsedToday' },
  // PLANNING & DISPATCH ACTION QUERIES - Enhanced with more variations
  { patterns: ['unassigned jobs', 'jobs to plan', 'jobs needing planning', 'jobs not assigned', 'travaux non assignés', 'jobs à planifier', 'what needs planning', 'plan jobs', 'jobs without dispatch', 'pending work', 'jobs waiting', 'unplanned jobs', 'need to plan', 'jobs to schedule', 'work to assign', 'unscheduled jobs', 'jobs need dispatch', 'backlog', 'job backlog'], query: 'getUnassignedJobs' },
  { patterns: ['pending jobs', 'awaiting dispatch', 'jobs en attente', 'waiting jobs', 'jobs queue', 'open jobs'], query: 'getUnassignedJobs' },
  // REPORT GENERATION QUERIES
  { patterns: ['offers report', 'rapport des devis', 'generate offers report', 'export offers', 'list all offers', 'all offers report', 'offres rapport'], query: 'generateOffersReport' },
  { patterns: ['sales report', 'rapport des ventes', 'generate sales report', 'export sales', 'list all sales', 'all sales report', 'ventes rapport', 'revenue report'], query: 'generateSalesReport' },
  { patterns: ['service orders report', 'rapport ordres de service', 'work orders report', 'generate service report', 'field report', 'interventions report', 'service report'], query: 'generateServiceOrdersReport' },
  // ADVANCED ANALYTICS & FORECASTING QUERIES
  { patterns: ['revenue forecast', 'predict revenue', 'forecast sales', 'prévision chiffre', 'prédire ventes', 'next month revenue', 'revenue prediction', 'sales forecast', 'what will we make'], query: 'getRevenueForecast' },
  { patterns: ['compare months', 'compare weeks', 'this month vs last', 'this week vs last', 'period comparison', 'comparison analytique', 'comparaison période', 'month over month', 'week over week', 'vs last month', 'vs last week'], query: 'getComparativeAnalytics' },
  { patterns: ['scheduling recommendations', 'optimize schedule', 'schedule optimization', 'recommandations planning', 'optimiser planning', 'workload balance', 'balance workload', 'who is overloaded', 'redistribute work'], query: 'getSchedulingRecommendations' },
  { patterns: ['demand forecast', 'busy periods', 'predict demand', 'prévision demande', 'périodes chargées', 'when are we busiest', 'busiest days', 'peak hours', 'demand patterns'], query: 'getDemandForecast' },
  { patterns: ['anomaly detection', 'detect anomalies', 'unusual patterns', 'détection anomalies', 'patterns inhabituels', 'find issues', 'potential problems', 'what is wrong', 'health check'], query: 'getAnomalyDetection' },
  { patterns: ['churn risk', 'customer churn', 'at risk customers', 'risque attrition', 'clients à risque', 'losing customers', 'inactive customers', 'dormant customers', 'customer retention'], query: 'getChurnRiskAnalysis' },
  { patterns: ['profitability analysis', 'profit margins', 'analyse rentabilité', 'marges bénéficiaires', 'most profitable', 'profit report', 'margin analysis', 'what is profitable', 'profit breakdown'], query: 'getProfitabilityAnalysis' },
  { patterns: ['technician efficiency', 'tech efficiency', 'efficacité technicien', 'efficiency score', 'tech performance', 'technician scores', 'who is most efficient', 'best technician score', 'tech ranking'], query: 'getTechnicianEfficiency' },
];

// =============== STOCK MODIFICATION PATTERNS ===============

// Patterns to detect stock add/remove commands in EN and FR
const STOCK_MODIFICATION_PATTERNS = [
  // English patterns - add
  /(?:add|increase|replenish|put|stock\s+up)\s+(\d+)\s+(?:units?\s+)?(?:to|for|of|in|into)\s+(?:article|product|material|item|stock)?\s*["']?([^"']+?)["']?$/i,
  /(?:add|increase|replenish|put|stock\s+up)\s+(\d+)\s+(?:more\s+)?(?:to|for|of|in|into)\s*["']?([^"']+?)["']?$/i,
  /(?:add|increase|replenish)\s+(\d+)\s+(?:units?\s+)?(?:of\s+)?["']?([^"']+?)["']?$/i,
  /["']?([^"']+?)["']?\s*:\s*(?:add|increase|\+)\s*(\d+)/i,
  // English patterns - remove
  /(?:remove|decrease|subtract|take|use|deduct|reduce)\s+(\d+)\s+(?:units?\s+)?(?:from|of|in)\s+(?:article|product|material|item|stock)?\s*["']?([^"']+?)["']?$/i,
  /(?:remove|decrease|subtract|take|use|deduct|reduce)\s+(\d+)\s+(?:from|of)\s*["']?([^"']+?)["']?$/i,
  /["']?([^"']+?)["']?\s*:\s*(?:remove|decrease|-)\s*(\d+)/i,
  // French patterns - add
  /(?:ajouter?|augmenter?|rajouter?|mettre)\s+(\d+)\s+(?:unités?\s+)?(?:à|au?x?|pour|dans|sur)\s+(?:article|produit|matériau|matériel)?\s*["']?([^"']+?)["']?$/i,
  /(?:ajouter?|augmenter?)\s+(\d+)\s+(?:de\s+)?["']?([^"']+?)["']?$/i,
  // French patterns - remove
  /(?:retirer|enlever|diminuer|soustraire|utiliser|déduire|réduire)\s+(\d+)\s+(?:unités?\s+)?(?:de|du|des|sur)\s+(?:article|produit|matériau|matériel)?\s*["']?([^"']+?)["']?$/i,
  /(?:retirer|enlever|diminuer)\s+(\d+)\s+(?:de\s+)?["']?([^"']+?)["']?$/i,
  // Natural language patterns - add
  /(\d+)\s+(?:more\s+)?(?:units?\s+)?(?:to|for)\s+["']?([^"']+?)["']?\s*(?:stock|inventory)?/i,
  /(?:i\s+)?(?:need\s+to\s+)?add\s+(\d+)\s+(?:to\s+)?["']?([^"']+?)["']?/i,
  // Natural language patterns - remove
  /(\d+)\s+(?:units?\s+)?(?:used|taken|removed)\s+(?:from|of)\s+["']?([^"']+?)["']?/i,
  /(?:i\s+)?(?:need\s+to\s+)?(?:remove|take)\s+(\d+)\s+(?:from\s+)?["']?([^"']+?)["']?/i,
];

// =============== INTELLIGENT PATTERN MATCHING ===============

// Helper: Normalize text for fuzzy matching (remove accents, lowercase, trim)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper: Check if message contains any of the keywords (fuzzy)
const containsAnyKeyword = (message: string, keywords: string[]): boolean => {
  const normalized = normalizeText(message);
  return keywords.some(kw => normalized.includes(normalizeText(kw)));
};

// Flexible patterns for dispatch number lookups - handles many variations
const DISPATCH_LOOKUP_PATTERNS = [
  // Direct dispatch references
  /(?:dispatch|intervention|disp|int)\s*(?:#|n[°o]\.?|number|num|:)?\s*["']?([A-Z0-9]+-?[A-Z0-9]+)["']?/i,
  // Action + dispatch
  /(?:show|get|find|check|look\s*up|what\s*is|status\s*of|details?\s*(?:for|of|on)?|info\s*(?:on|about)?|tell\s*me\s*about|open|view)\s*(?:the\s+)?(?:dispatch|intervention|disp)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  // DISP- prefix pattern (most reliable)
  /["']?(DISP-[A-Z0-9-]+)["']?/i,
  // Intervention with number
  /intervention\s*["']?([A-Z0-9]+-?[A-Z0-9]+)["']?/i,
  // "the dispatch X" or "dispatch called X"
  /(?:the|a)\s+dispatch\s+(?:called\s+)?["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
];

// Flexible patterns for service order lookups
const SERVICE_ORDER_LOOKUP_PATTERNS = [
  // Direct references with various formats
  /(?:service\s*order|work\s*order|ordre\s*(?:de\s+)?service|s\.?o\.?|wo)\s*(?:#|n[°o]\.?|number|num|:)?\s*["']?([A-Z0-9]+-?[A-Z0-9]+)["']?/i,
  // Action + service order
  /(?:show|get|find|check|look\s*up|what\s*is|status\s*of|details?\s*(?:for|of|on)?|info\s*(?:on|about)?|tell\s*me\s*about|open|view)\s*(?:the\s+)?(?:service\s*order|work\s*order|s\.?o\.?)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  // SO- prefix pattern
  /["']?(SO-[A-Z0-9-]+)["']?/i,
  // Ordre de service (French)
  /ordre\s*(?:de\s+)?service\s*["']?([A-Z0-9]+-?[A-Z0-9]+)["']?/i,
  // "the order X" or "order called X"
  /(?:the|a)\s+(?:service\s+)?order\s+(?:called\s+)?["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
];

// Flexible patterns for "who is working on" queries - dispatch
const WHO_WORKING_DISPATCH_PATTERNS = [
  // English variations
  /who(?:'s|\s+is|\s+are)?\s*(?:working|assigned|on|handling|doing|responsible)\s*(?:on|to|for)?\s*(?:the\s+)?(?:dispatch|intervention|disp)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  /(?:technician|tech|person|team|guy|worker|employee)s?\s*(?:on|for|assigned\s*to|working\s*on|handling)\s*(?:dispatch|intervention)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  // "who handles dispatch X", "who has dispatch X"
  /who\s*(?:handles?|has|got|took|is\s+on)\s*(?:the\s+)?(?:dispatch|intervention)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  // French variations
  /qui\s*(?:travaille|est|s'occupe|gere)\s*(?:sur|de|pour)?\s*(?:le?a?\s+)?(?:dispatch|intervention)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  // "assigned to DISP-X", "on DISP-X"
  /(?:assigned|working)\s+(?:to|on)\s+["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
];

// Flexible patterns for "who is working on" queries - service order
const WHO_WORKING_SERVICE_ORDER_PATTERNS = [
  // English variations
  /who(?:'s|\s+is|\s+are)?\s*(?:working|assigned|on|handling|doing|responsible)\s*(?:on|to|for)?\s*(?:the\s+)?(?:service\s*order|work\s*order|s\.?o\.?|order)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  /(?:technician|tech|person|team|guy|worker|employee)s?\s*(?:on|for|assigned\s*to|working\s*on|handling)\s*(?:service\s*order|work\s*order|order)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  // "who handles order X", "who has order X"
  /who\s*(?:handles?|has|got|took|is\s+on)\s*(?:the\s+)?(?:service\s*)?order\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  // French variations
  /qui\s*(?:travaille|est|s'occupe|gere)\s*(?:sur|de|pour)?\s*(?:le?a?\s+)?(?:ordre\s*(?:de\s+)?service|commande)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  // "team on SO-X"
  /(?:team|assigned)\s+(?:to|on|for)\s+["']?(SO-[A-Z0-9-]+)["']?/i,
];

// Flexible patterns for technician schedule lookup - handles @mentions and natural language
const TECHNICIAN_SCHEDULE_PATTERNS = [
  // @mention patterns
  /@([A-Za-z][A-Za-z\s]{1,25}?)(?:\s+(?:schedule|today|dispatches|jobs|work|planning|travail|agenda|calendar|timetable)|\s*$)/i,
  // "schedule for/of @Name" or "Name's schedule"
  /(?:schedule|dispatches|jobs|planning|work|agenda)\s*(?:for|of|de)\s*@?([A-Za-z][A-Za-z\s]{1,25})/i,
  /(?:what(?:'s|\s+is)?|show|get|check)\s*@?([A-Za-z][A-Za-z\s]{1,25}?)['']?s?\s*(?:schedule|planning|dispatches|work|agenda|jobs)/i,
  // "plan jobs to @Name", "planning for Name"
  /(?:plan|planning|assign)\s*(?:jobs?|work|to)?\s*(?:to|for|pour)\s*@?([A-Za-z][A-Za-z\s]{1,25})/i,
  // French variations
  /(?:planning|agenda|travail|emploi\s*du\s*temps)\s*(?:pour|de)\s*@?([A-Za-z][A-Za-z\s]{1,25})/i,
  // "what is Name doing today"
  /(?:what(?:'s|\s+is)?)\s+@?([A-Za-z][A-Za-z\s]{1,25}?)\s+(?:doing|working\s*on)\s*(?:today|now)?/i,
  // "is Name free", "is Name available", "Name availability"
  /(?:is\s+)?@?([A-Za-z][A-Za-z\s]{1,25}?)\s*(?:free|available|busy|working)/i,
  /(?:availability|workload|charge)\s*(?:for|of|de)\s*@?([A-Za-z][A-Za-z\s]{1,25})/i,
  // Just "@Name" followed by end or punctuation (treat as schedule lookup)
  /@([A-Za-z][A-Za-z]{2,20})(?:\s*[?.,!]?\s*$)/i,
];

// Flexible patterns for offer status lookup
const OFFER_STATUS_PATTERNS = [
  // Status queries
  /(?:status|état|etat|state|progress)\s*(?:of|for|de)?\s*(?:the\s+)?(?:offer|quote|devis|proposal|prop)?\s*["']?([A-Z0-9]+-?[A-Z0-9]+)["']?/i,
  /(?:offer|quote|devis|proposal)\s*(?:#|n[°o]\.?|number|:)?\s*["']?([A-Z0-9]+-?[A-Z0-9]+)["']?\s*(?:status|état)?/i,
  // OFF- prefix pattern
  /["']?(OFF-[A-Z0-9-]+)["']?/i,
  // "how is offer X", "check offer X"
  /(?:how\s*is|check|show|get|find)\s*(?:the\s+)?(?:offer|quote|devis)\s*["']?([A-Z0-9]+-?[A-Z0-9]+)["']?/i,
  // "the offer X", "offer called X"
  /(?:the|a)\s+(?:offer|quote)\s+(?:called\s+)?["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
];

// Flexible patterns for sale status lookup
const SALE_STATUS_PATTERNS = [
  // Status queries
  /(?:status|état|etat|state|progress)\s*(?:of|for|de)?\s*(?:the\s+)?(?:sale|vente|order|deal)?\s*["']?([A-Z0-9]+-?[A-Z0-9]+)["']?/i,
  /(?:sale|vente|deal)\s*(?:#|n[°o]\.?|number|:)?\s*["']?([A-Z0-9]+-?[A-Z0-9]+)["']?\s*(?:status|état)?/i,
  // SAL- prefix pattern
  /["']?(SAL-[A-Z0-9-]+)["']?/i,
  // "how is sale X", "check sale X"
  /(?:how\s*is|check|show|get|find)\s*(?:the\s+)?(?:sale|vente|deal)\s*["']?([A-Z0-9]+-?[A-Z0-9]+)["']?/i,
  // "the sale X", "sale called X"
  /(?:the|a)\s+(?:sale|deal)\s+(?:called\s+)?["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
];

// =============== INTELLIGENT EXTRACTORS ===============

// Extract dispatch number from message - with smart validation
const extractDispatchNumber = (message: string): string | null => {
  const normalized = normalizeText(message);

  // Skip if this looks like a "who is working on" question (handled separately)
  if (/who|qui/.test(normalized) && /working|travaille|assigned|assigned/.test(normalized)) {
    return null;
  }

  for (const pattern of DISPATCH_LOOKUP_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const num = match[1].trim().toUpperCase();
      // Validate it looks like a dispatch number
      if (num.length >= 3 && /^[A-Z0-9-]+$/.test(num)) {
        // Add DISP- prefix if not present and looks like a number
        if (!num.startsWith('DISP-') && /^\d+$/.test(num)) {
          return `DISP-${num}`;
        }
        return num;
      }
    }
  }
  return null;
};

// Extract service order number from message - with smart validation
const extractServiceOrderNumber = (message: string): string | null => {
  const normalized = normalizeText(message);

  // Skip if this looks like a "who is working on" question (handled separately)
  if (/who|qui/.test(normalized) && /working|travaille|assigned/.test(normalized)) {
    return null;
  }

  for (const pattern of SERVICE_ORDER_LOOKUP_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const num = match[1].trim().toUpperCase();
      // Validate it looks like a service order number
      if (num.length >= 3 && /^[A-Z0-9-]+$/.test(num)) {
        // Add SO- prefix if not present and looks like a number
        if (!num.startsWith('SO-') && /^\d+$/.test(num)) {
          return `SO-${num}`;
        }
        return num;
      }
    }
  }
  return null;
};

// Extract dispatch number for "who is working on" queries
const extractWhoWorkingDispatch = (message: string): string | null => {
  const normalized = normalizeText(message);

  // Must be a "who/team" type question about dispatch
  const isWhoQuestion = /who|qui|team|technician|tech|assigned/.test(normalized);
  const isAboutDispatch = /dispatch|intervention|disp/.test(normalized) || /DISP-/i.test(message);

  if (!isWhoQuestion) return null;

  for (const pattern of WHO_WORKING_DISPATCH_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const num = match[1].trim().toUpperCase();
      if (num.length >= 3 && /^[A-Z0-9-]+$/.test(num)) {
        if (!num.startsWith('DISP-') && /^\d+$/.test(num)) {
          return `DISP-${num}`;
        }
        return num;
      }
    }
  }

  // Fallback: if it's a who question and contains DISP-XXX, extract it
  if (isWhoQuestion) {
    const fallbackMatch = message.match(/DISP-([A-Z0-9-]+)/i);
    if (fallbackMatch) return fallbackMatch[0].toUpperCase();
  }

  return null;
};

// Extract service order number for "who is working on" queries
const extractWhoWorkingServiceOrder = (message: string): string | null => {
  const normalized = normalizeText(message);

  // Must be a "who/team" type question
  const isWhoQuestion = /who|qui|team|technician|tech|assigned/.test(normalized);

  if (!isWhoQuestion) return null;

  for (const pattern of WHO_WORKING_SERVICE_ORDER_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const num = match[1].trim().toUpperCase();
      if (num.length >= 3 && /^[A-Z0-9-]+$/.test(num)) {
        if (!num.startsWith('SO-') && /^\d+$/.test(num)) {
          return `SO-${num}`;
        }
        return num;
      }
    }
  }

  // Fallback: if it's a who question and contains SO-XXX, extract it
  if (isWhoQuestion) {
    const fallbackMatch = message.match(/SO-([A-Z0-9-]+)/i);
    if (fallbackMatch) return fallbackMatch[0].toUpperCase();
  }

  return null;
};

// Extract technician name for schedule lookup - more flexible
const extractTechnicianForSchedule = (message: string): string | null => {
  const normalized = normalizeText(message);

  // Keywords that suggest a schedule/planning query
  const scheduleKeywords = ['schedule', 'planning', 'agenda', 'work', 'dispatch', 'job', 'today', 'free', 'available', 'busy', 'availability', 'workload', 'doing', 'travail', 'emploi'];
  const hasScheduleContext = scheduleKeywords.some(kw => normalized.includes(kw)) || message.includes('@');

  if (!hasScheduleContext) return null;

  for (const pattern of TECHNICIAN_SCHEDULE_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let name = match[1].trim().replace(/^@/, '');
      // Clean up the name - remove trailing punctuation and common words
      name = name.replace(/[?.,!]+$/, '').replace(/\s+(today|now|please|svp)$/i, '').trim();
      // Validate it looks like a name (not too short, not too long, has letters)
      if (name.length >= 2 && name.length <= 30 && /^[A-Za-z\s]+$/.test(name)) {
        return name;
      }
    }
  }
  return null;
};

// Extract offer number for status lookup
const extractOfferForStatus = (message: string): string | null => {
  const normalized = normalizeText(message);

  // Should have offer-related context
  const hasOfferContext = /offer|quote|devis|proposal|off-/i.test(message) ||
    (normalized.includes('status') && /[A-Z0-9]+-[A-Z0-9]+/i.test(message));

  if (!hasOfferContext) return null;

  for (const pattern of OFFER_STATUS_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const num = match[1].trim().toUpperCase();
      if (num.length >= 3 && /^[A-Z0-9-]+$/.test(num)) {
        if (!num.startsWith('OFF-') && /^\d+$/.test(num)) {
          return `OFF-${num}`;
        }
        return num;
      }
    }
  }
  return null;
};

// Extract sale number for status lookup - more flexible
const extractSaleForStatus = (message: string): string | null => {
  const normalized = normalizeText(message);

  // Should have sale-related context
  const hasSaleContext = /sale|vente|deal|sal-/i.test(message) ||
    (normalized.includes('status') && /[A-Z0-9]+-[A-Z0-9]+/i.test(message));

  if (!hasSaleContext) return null;

  for (const pattern of SALE_STATUS_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const num = match[1].trim().toUpperCase();
      if (num.length >= 3 && /^[A-Z0-9-]+$/.test(num)) {
        if (!num.startsWith('SAL-') && /^\d+$/.test(num)) {
          return `SAL-${num}`;
        }
        return num;
      }
    }
  }
  return null;
};

// Patterns for specific user availability checks
const USER_AVAILABILITY_PATTERNS = [
  // @mention patterns (highest priority)
  /does\s+@([^\s][\w\s]+?)\s+work/i,
  /is\s+@([^\s][\w\s]+?)\s+working/i,
  /is\s+@([^\s][\w\s]+?)\s+available/i,
  /@([^\s][\w\s]+?)\s+(?:works?|working|available)\s+today/i,
  /check\s+@([^\s][\w\s]+)/i,
  // Regular patterns
  /is\s+(.+?)\s+working\s+today/i,
  /does\s+(.+?)\s+work\s+today/i,
  /can\s+you\s+tell\s+me\s+if\s+(?:my\s+)?(.+?)\s+(?:is\s+)?work(?:s|ing)?\s+(?:today|or\s+not)/i,
  /is\s+(.+?)\s+available\s+today/i,
  /check\s+if\s+(.+?)\s+(?:is\s+)?(?:working|available)/i,
  /(.+?)\s+travaille\s+aujourd'hui/i,
  /est-ce\s+que\s+(.+?)\s+travaille/i,
  /(.+?)\s+disponible\s+aujourd'hui/i,
  /availability\s+of\s+(.+)/i,
  /(.+?)\s+work\s+today/i,
  /tell\s+me\s+(?:about\s+)?(.+?)\s+(?:schedule|availability)/i,
];

// Extract @mentions from message
const extractMentionedName = (message: string): string | null => {
  // First try to find @mention pattern
  const mentionMatch = message.match(/@([A-Za-z][A-Za-z\s]+?)(?:\s+(?:works?|working|available|today|is|does)|[?!.,]|$)/i);
  if (mentionMatch && mentionMatch[1]) {
    return mentionMatch[1].trim();
  }
  return null;
};

// Extract user name from message for specific user queries
const extractUserName = (message: string): string | null => {
  // First check for @mentions
  const mentionedName = extractMentionedName(message);
  if (mentionedName) {
    return mentionedName;
  }

  // Then try regular patterns
  for (const pattern of USER_AVAILABILITY_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted name
      let name = match[1].trim();
      // Remove @ symbol if present
      name = name.replace(/^@/, '');
      // Remove common words that aren't names
      name = name.replace(/^(the|my|our)\s+/i, '');
      name = name.replace(/\s+(user|technician|employee|worker|admin|administrator)$/i, '');
      // If only role word remains, use it as the search term
      if (!name || name.length < 2) {
        const roleMatch = message.match(/(admin|administrator|technician|manager|supervisor)/i);
        if (roleMatch) {
          return roleMatch[1];
        }
      }
      return name;
    }
  }
  return null;
};

// Patterns for task completion actions
const TASK_COMPLETION_PATTERNS = [
  // English patterns
  /mark\s+(?:the\s+)?(?:task\s+)?["']?(.+?)["']?\s+(?:as\s+)?(?:done|complete|completed|finished)/i,
  /complete\s+(?:the\s+)?(?:task\s+)?["']?(.+?)["']?/i,
  /finish\s+(?:the\s+)?(?:task\s+)?["']?(.+?)["']?/i,
  /(?:i\s+)?(?:have\s+)?(?:done|completed|finished)\s+(?:the\s+)?(?:task\s+)?["']?(.+?)["']?/i,
  /set\s+["']?(.+?)["']?\s+(?:to\s+)?(?:done|complete|completed)/i,
  /["'](.+?)["']\s+(?:is\s+)?(?:done|complete|completed|finished)/i,
  // French patterns
  /marque(?:r|z)?\s+(?:la\s+)?(?:tâche\s+)?["']?(.+?)["']?\s+(?:comme\s+)?(?:fait|faite|terminé|terminée|complété|complétée)/i,
  /terminer\s+(?:la\s+)?(?:tâche\s+)?["']?(.+?)["']?/i,
  /(?:j'ai\s+)?(?:fini|terminé|complété)\s+(?:la\s+)?(?:tâche\s+)?["']?(.+?)["']?/i,
];

// Extract task name from completion request
const extractTaskNameForCompletion = (message: string): string | null => {
  for (const pattern of TASK_COMPLETION_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let taskName = match[1].trim();
      // Clean up common suffixes/prefixes
      taskName = taskName.replace(/^(the|my|a|la|ma|une)\s+/i, '');
      taskName = taskName.replace(/\s+(task|tâche)$/i, '');
      if (taskName.length >= 2) {
        return taskName;
      }
    }
  }
  return null;
};

// Patterns for form search queries
const FORM_SEARCH_PATTERNS = [
  // English patterns
  /(?:find|search|get|show|open|give me|where is|i need|looking for)\s+(?:the\s+)?(?:form|formulaire)\s+(?:called\s+|named\s+)?["']?(.+?)["']?(?:\s+form)?$/i,
  /(?:form|formulaire)\s+["'](.+?)["']/i,
  /(?:find|search)\s+["'](.+?)["']\s+(?:form|formulaire)/i,
  // French patterns
  /(?:trouve|cherche|montre|ouvre|donne-moi|où est|je cherche)\s+(?:le\s+)?(?:formulaire)\s+(?:appelé\s+|nommé\s+)?["']?(.+?)["']?/i,
];

// Extract form name from search request
const extractFormSearchTerm = (message: string): string | null => {
  for (const pattern of FORM_SEARCH_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let formName = match[1].trim();
      // Clean up common suffixes/prefixes
      formName = formName.replace(/^(the|a|le|la|un|une)\s+/i, '');
      formName = formName.replace(/\s+(form|formulaire)$/i, '');
      if (formName.length >= 2) {
        return formName;
      }
    }
  }
  return null;
};

// Patterns for entity search queries
const CONTACT_SEARCH_PATTERNS = [
  /(?:find|search|look up|get|show me)\s+(?:the\s+)?(?:contact|customer|client)\s+["']?(.+?)["']?/i,
  /(?:who is|tell me about|info on|details for)\s+(?:the\s+)?(?:contact|customer|client)?\s*["']?(.+?)["']?/i,
  /(?:cherche|trouve|montre)\s+(?:le\s+)?(?:contact|client)\s+["']?(.+?)["']?/i,
];

const ARTICLE_SEARCH_PATTERNS = [
  /(?:find|search|look up|get|show me)\s+(?:the\s+)?(?:article|product|item)\s+["']?(.+?)["']?/i,
  /(?:stock|inventory)\s+(?:for|of)\s+["']?(.+?)["']?/i,
  /(?:cherche|trouve|montre)\s+(?:l'|le\s+)?(?:article|produit)\s+["']?(.+?)["']?/i,
];

const OFFER_SEARCH_PATTERNS = [
  /(?:find|search|get|show me|look up)\s+(?:the\s+)?(?:offer|quote|devis)\s+(?:number\s+)?["']?(.+?)["']?/i,
  /(?:offer|devis)\s+(?:#|number)?\s*["']?(\w+[-\w]*)["']?/i,
  /(?:cherche|trouve|montre)\s+(?:le\s+)?(?:devis|offre)\s+["']?(.+?)["']?/i,
];

const SALE_SEARCH_PATTERNS = [
  /(?:find|search|get|show me|look up)\s+(?:the\s+)?(?:sale|order|vente)\s+(?:number\s+)?["']?(.+?)["']?/i,
  /(?:sale|vente)\s+(?:#|number)?\s*["']?(\w+[-\w]*)["']?/i,
  /(?:cherche|trouve|montre)\s+(?:la\s+)?(?:vente|commande)\s+["']?(.+?)["']?/i,
];

const PROJECT_SEARCH_PATTERNS = [
  /(?:find|search|get|show me|look up)\s+(?:the\s+)?(?:project|projet)\s+["']?(.+?)["']?/i,
  /(?:project|projet)\s+(?:called\s+|named\s+)?["'](.+?)["']/i,
  /(?:cherche|trouve|montre)\s+(?:le\s+)?(?:projet)\s+["']?(.+?)["']?/i,
];

const DEAL_SEARCH_PATTERNS = [
  /(?:find|search|get|show me|look up)\s+(?:the\s+)?(?:deal|opportunity)\s+["']?(.+?)["']?/i,
  /(?:deal|opportunity)\s+(?:#|number|called\s+|named\s+)?\s*["']?([\w-]+)["']?/i,
  /(?:cherche|trouve|montre)\s+(?:le\s+|la\s+|l'\s*)?(?:deal|opportunité|affaire)\s+["']?(.+?)["']?/i,
];

const INSTALLATION_SEARCH_PATTERNS = [
  /(?:find|search|get|show me|look up)\s+(?:the\s+)?(?:installation|equipment|machine)\s+["']?(.+?)["']?/i,
  /(?:installation|équipement)\s+(?:called\s+|named\s+)?["'](.+?)["']/i,
  /(?:cherche|trouve|montre)\s+(?:l'|le\s+)?(?:installation|équipement)\s+["']?(.+?)["']?/i,
];

const SERVICE_ORDER_SEARCH_PATTERNS = [
  /(?:find|search|get|show me|look up)\s+(?:the\s+)?(?:service order|work order|intervention)\s+["']?(.+?)["']?/i,
  /(?:service order|ordre de service)\s+(?:#|number)?\s*["']?(\w+[-\w]*)["']?/i,
  /(?:cherche|trouve|montre)\s+(?:l'|le\s+)?(?:ordre de service|intervention)\s+["']?(.+?)["']?/i,
];

const USER_SEARCH_PATTERNS = [
  /(?:find|search|get|show me|look up|info on|details for)\s+(?:the\s+)?(?:user|employee|team member)\s+["']?(.+?)["']?/i,
  /(?:who is|tell me about)\s+(?:user|employee)?\s*["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)["']?/i,
  /(?:cherche|trouve|montre)\s+(?:l'|le\s+)?(?:utilisateur|employé)\s+["']?(.+?)["']?/i,
];

// Extract search term from patterns
const extractSearchTerm = (message: string, patterns: RegExp[]): string | null => {
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let term = match[1].trim();
      term = term.replace(/^(the|a|le|la|l'|un|une)\s+/i, '');
      if (term.length >= 2) {
        return term;
      }
    }
  }
  return null;
};

// =============== DISPATCH ASSIGNMENT PATTERNS ===============

// Patterns for assigning dispatch to technician
const DISPATCH_ASSIGNMENT_PATTERNS = [
  // English: "assign dispatch DISP-001 to Ahmed"
  /(?:assign|schedule|plan|give|send)\s+(?:dispatch|intervention)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?\s+(?:to|for|à)\s+@?([A-Za-z][A-Za-z\s]{1,25})/i,
  // English: "assign DISP-001 to Ahmed at 9am" / "assign DISP-001 to Ahmed on Monday"
  /(?:assign|schedule|plan)\s+["']?([A-Z0-9]+-[A-Z0-9]+)["']?\s+(?:to|for)\s+@?([A-Za-z][A-Za-z\s]{1,25}?)(?:\s+(?:at|on|for)\s+(.+?))?$/i,
  // "dispatch DISP-001 to Ahmed"
  /(?:dispatch|send|plan)\s+["']?([A-Z0-9]+-[A-Z0-9]+)["']?\s+(?:to|for)\s+@?([A-Za-z][A-Za-z\s]{1,25})/i,
  // French: "assigne dispatch DISP-001 à Ahmed"
  /(?:assigne|planifie|envoie)\s+(?:dispatch|intervention)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?\s+(?:à|a|pour)\s+@?([A-Za-z][A-Za-z\s]{1,25})/i,
  // "put DISP-001 on Ahmed's schedule"
  /(?:put|add|place)\s+["']?([A-Z0-9]+-[A-Z0-9]+)["']?\s+(?:on|to|in)\s+@?([A-Za-z][A-Za-z\s]{1,25}?)(?:'s)?\s+(?:schedule|planning|calendar)/i,
  // "give dispatch DISP-001 to Ahmed"
  /(?:give|hand)\s+(?:dispatch|intervention)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?\s+(?:to|over to)\s+@?([A-Za-z][A-Za-z\s]{1,25})/i,
];

// Patterns for confirming dispatch assignment
const DISPATCH_CONFIRM_PATTERNS = [
  // "confirm assign DISP-001 to Ahmed at 9:00"
  /(?:confirm|yes|ok|do it|go ahead|execute)\s*(?:assign(?:ment)?|schedule|plan)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?\s+(?:to|for)\s+@?([A-Za-z][A-Za-z\s]{1,25}?)(?:\s+(?:at|@)\s+(\d{1,2}[:.]\d{2}|\d{1,2}(?:am|pm)))?/i,
  // "confirm the assignment" (simple confirm after preview)
  /^(?:confirm|yes|ok|do it|go ahead|execute|proceed)(?:\s+(?:the\s+)?assignment)?$/i,
];

// Patterns for suggesting technician for dispatch
const SUGGEST_TECHNICIAN_PATTERNS = [
  // "who should I assign DISP-001 to"
  /(?:who|which tech)\s+(?:should|can|to)\s+(?:I\s+)?(?:assign|give|send|schedule)\s+["']?([A-Z0-9]+-[A-Z0-9]+)["']?\s+(?:to)?/i,
  // "suggest technician for DISP-001"
  /(?:suggest|recommend|find|best)\s+(?:a\s+)?(?:technician|tech|person|worker)\s+(?:for|to handle)\s+["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  // "who is available for DISP-001"
  /(?:who\s+is\s+)?(?:available|free)\s+(?:for|to take)\s+["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  // "best technician for dispatch DISP-001"
  /(?:best|available)\s+(?:technician|tech)\s+(?:for\s+)?(?:dispatch)?\s*["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
  // French: "qui peut prendre DISP-001"
  /(?:qui\s+)?(?:peut|devrait)\s+(?:prendre|faire|gérer)\s+["']?([A-Z0-9]+-[A-Z0-9]+)["']?/i,
];

// Extract dispatch assignment info from message
const extractDispatchAssignment = (message: string): { dispatchNumber: string; technicianName: string; time?: string } | null => {
  for (const pattern of DISPATCH_ASSIGNMENT_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1] && match[2]) {
      const dispatchNumber = match[1].trim().toUpperCase();
      let technicianName = match[2].trim().replace(/^@/, '');
      // Clean up name
      technicianName = technicianName.replace(/\s+(at|on|for|today|tomorrow|please|svp)$/i, '').trim();
      const time = match[3]?.trim();

      if (dispatchNumber.length >= 3 && technicianName.length >= 2) {
        return { dispatchNumber, technicianName, time };
      }
    }
  }
  return null;
};

// Extract confirmed dispatch assignment
const extractConfirmedAssignment = (message: string): { dispatchNumber: string; technicianName: string; time?: string } | null => {
  for (const pattern of DISPATCH_CONFIRM_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1] && match[2]) {
      return {
        dispatchNumber: match[1].trim().toUpperCase(),
        technicianName: match[2].trim().replace(/^@/, ''),
        time: match[3]?.trim()
      };
    }
  }
  return null;
};

// Extract dispatch for technician suggestion
const extractDispatchForSuggestion = (message: string): string | null => {
  for (const pattern of SUGGEST_TECHNICIAN_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const num = match[1].trim().toUpperCase();
      if (num.length >= 3) {
        return num.startsWith('DISP-') ? num : `DISP-${num}`;
      }
    }
  }
  return null;
};

// Extract stock modification command from message
const extractStockModification = (message: string): { action: 'add' | 'remove'; quantity: number; articleName: string } | null => {
  const lowerMessage = message.toLowerCase();

  // Determine action type
  const addKeywords = ['add', 'ajouter', 'augmenter', 'rajouter', 'increase', 'replenish', 'put', 'stock up', 'mettre'];
  const removeKeywords = ['remove', 'retirer', 'enlever', 'diminuer', 'soustraire', 'decrease', 'subtract', 'take', 'use', 'deduct', 'reduce', 'utiliser'];

  const isAddAction = addKeywords.some(k => lowerMessage.includes(k));
  const isRemoveAction = removeKeywords.some(k => lowerMessage.includes(k));

  if (!isAddAction && !isRemoveAction) return null;

  const action: 'add' | 'remove' = isAddAction && !isRemoveAction ? 'add' : 'remove';

  // Try each pattern
  for (const pattern of STOCK_MODIFICATION_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      // Patterns can have quantity in different positions
      let quantity: number;
      let articleName: string;

      // Check if first capture group is a number
      if (/^\d+$/.test(match[1])) {
        quantity = parseInt(match[1], 10);
        articleName = match[2]?.trim();
      } else {
        // Article name is first, quantity second
        articleName = match[1]?.trim();
        quantity = parseInt(match[2], 10);
      }

      if (quantity > 0 && articleName && articleName.length >= 2) {
        // Clean up article name
        articleName = articleName
          .replace(/^(article|product|material|item|stock|produit|matériau|matériel)\s*/i, '')
          .replace(/\s*(stock|inventory|inventaire)$/i, '')
          .trim();

        if (articleName.length >= 2) {
          return { action, quantity, articleName };
        }
      }
    }
  }

  return null;
};

// Detect if message is a data query and execute it
export const detectAndExecuteDataQuery = async (message: string): Promise<DataQueryResult | null> => {
  const lowerMessage = message.toLowerCase();

  // =============== STOCK MODIFICATION ACTIONS (highest priority) ===============

  const stockModification = extractStockModification(message);
  if (stockModification) {
    return await aiDataQueries.modifyArticleStock(
      stockModification.articleName,
      stockModification.quantity,
      stockModification.action
    );
  }

  // =============== DISPATCH ASSIGNMENT ACTIONS ===============

  // Check for confirmed dispatch assignment (execute immediately)
  const confirmedAssignment = extractConfirmedAssignment(message);
  if (confirmedAssignment) {
    return await aiDataQueries.executeDispatchAssignment(
      confirmedAssignment.dispatchNumber,
      confirmedAssignment.technicianName,
      confirmedAssignment.time
    );
  }

  // Check for dispatch assignment request (preview/suggest)
  const assignmentRequest = extractDispatchAssignment(message);
  if (assignmentRequest) {
    return await aiDataQueries.assignDispatchToTechnician(
      assignmentRequest.dispatchNumber,
      assignmentRequest.technicianName,
      undefined, // preferredDate
      assignmentRequest.time
    );
  }

  // Check for technician suggestion for dispatch
  const dispatchForSuggestion = extractDispatchForSuggestion(message);
  if (dispatchForSuggestion) {
    return await aiDataQueries.suggestTechnicianForDispatch(dispatchForSuggestion);
  }

  // =============== END DISPATCH ASSIGNMENT ACTIONS ===============

  // First, check for task completion actions (highest priority for action-based queries)
  const taskNameToComplete = extractTaskNameForCompletion(message);
  if (taskNameToComplete) {
    return await aiDataQueries.markTaskComplete(taskNameToComplete);
  }

  // === NEW PLANNING & DISPATCH ACTIONS ===

  // Check for "who is working on dispatch" queries
  const whoWorkingDispatch = extractWhoWorkingDispatch(message);
  if (whoWorkingDispatch) {
    return await aiDataQueries.getDispatchAssignees(whoWorkingDispatch);
  }

  // Check for "who is working on service order" queries
  const whoWorkingServiceOrder = extractWhoWorkingServiceOrder(message);
  if (whoWorkingServiceOrder) {
    return await aiDataQueries.getServiceOrderAssignees(whoWorkingServiceOrder);
  }

  // Check for technician schedule lookup (@user schedule, planning for user)
  const technicianForSchedule = extractTechnicianForSchedule(message);
  if (technicianForSchedule) {
    return await aiDataQueries.getTechnicianSchedule(technicianForSchedule);
  }

  // Check for dispatch details lookup (dispatch #DISP-XXX)
  const dispatchNumber = extractDispatchNumber(message);
  if (dispatchNumber && !lowerMessage.includes('who')) {
    return await aiDataQueries.getDispatchDetails(dispatchNumber);
  }

  // Check for service order details lookup (service order #SO-XXX)
  const serviceOrderNumber = extractServiceOrderNumber(message);
  if (serviceOrderNumber && !lowerMessage.includes('who')) {
    return await aiDataQueries.getServiceOrderDetails(serviceOrderNumber);
  }

  // Check for offer status lookup
  const offerForStatus = extractOfferForStatus(message);
  if (offerForStatus && lowerMessage.includes('status')) {
    return await aiDataQueries.getOfferStatus(offerForStatus);
  }

  // Check for sale status lookup
  const saleForStatus = extractSaleForStatus(message);
  if (saleForStatus && lowerMessage.includes('status')) {
    return await aiDataQueries.getSaleStatus(saleForStatus);
  }

  // === END NEW PLANNING & DISPATCH ACTIONS ===

  // Second, check for specific user availability queries
  const userName = extractUserName(message);
  if (userName) {
    return await aiDataQueries.checkUserWorkingToday(userName);
  }

  // Third, check for dynamic form search queries
  const formSearchTerm = extractFormSearchTerm(message);
  if (formSearchTerm) {
    return await aiDataQueries.searchDynamicForm(formSearchTerm);
  }

  // Check for entity-specific search queries
  const contactSearch = extractSearchTerm(message, CONTACT_SEARCH_PATTERNS);
  if (contactSearch) {
    return await aiDataQueries.searchContacts(contactSearch);
  }

  const articleSearch = extractSearchTerm(message, ARTICLE_SEARCH_PATTERNS);
  if (articleSearch) {
    return await aiDataQueries.searchArticles(articleSearch);
  }

  const offerSearch = extractSearchTerm(message, OFFER_SEARCH_PATTERNS);
  if (offerSearch) {
    return await aiDataQueries.getOfferDetails(offerSearch);
  }

  const saleSearch = extractSearchTerm(message, SALE_SEARCH_PATTERNS);
  if (saleSearch) {
    return await aiDataQueries.getSaleDetails(saleSearch);
  }

  const projectSearch = extractSearchTerm(message, PROJECT_SEARCH_PATTERNS);
  if (projectSearch) {
    return await aiDataQueries.searchProjects(projectSearch);
  }

  const dealSearch = extractSearchTerm(message, DEAL_SEARCH_PATTERNS);
  if (dealSearch) {
    return await aiDataQueries.searchDeals(dealSearch);
  }

  const installationSearch = extractSearchTerm(message, INSTALLATION_SEARCH_PATTERNS);
  if (installationSearch) {
    return await aiDataQueries.searchInstallations(installationSearch);
  }

  const serviceOrderSearch = extractSearchTerm(message, SERVICE_ORDER_SEARCH_PATTERNS);
  if (serviceOrderSearch) {
    return await aiDataQueries.searchServiceOrders(serviceOrderSearch);
  }

  const userSearch = extractSearchTerm(message, USER_SEARCH_PATTERNS);
  if (userSearch) {
    return await aiDataQueries.getUserDetails(userSearch);
  }

  // =============== REPORT & INVOICE GENERATION ===============

  // Check for invoice generation from offer/sale
  const invoiceMatch = message.match(/(?:generate|create|make|créer|générer)\s+(?:an?\s+)?invoice\s+(?:from|for|pour|de)\s+(?:offer|sale|vente|devis)\s+["']?([A-Z0-9]+-?[A-Z0-9]+)["']?/i);
  if (invoiceMatch && invoiceMatch[1]) {
    const entityNum = invoiceMatch[1].trim();
    const isOffer = lowerMessage.includes('offer') || lowerMessage.includes('devis');
    return await aiDataQueries.generateInvoiceFromEntity(isOffer ? 'offer' : 'sale', entityNum);
  }

  // Check for invoice search
  const invoiceSearchMatch = message.match(/(?:invoice|facture)\s+(?:for|pour|from|de)\s+(?:customer|client|contact)?\s*["']?([A-Za-z0-9\s]+)["']?/i);
  if (invoiceSearchMatch && invoiceSearchMatch[1] && (lowerMessage.includes('invoice') || lowerMessage.includes('facture'))) {
    const searchTerm = invoiceSearchMatch[1].trim();
    if (searchTerm.length >= 2) {
      return await aiDataQueries.searchInvoiceableItems(searchTerm);
    }
  }

  // Check for "invoiceable items" or "what can I invoice"
  if (lowerMessage.includes('invoiceable') || lowerMessage.includes('what can i invoice') || lowerMessage.includes('que puis-je facturer')) {
    // Extract any search term
    const searchTermMatch = message.match(/(?:invoiceable|invoice|facture).*?(?:for|from|pour|de)?\s*["']?([A-Za-z0-9\s]{2,})["']?$/i);
    const searchTerm = searchTermMatch?.[1]?.trim() || '';
    if (searchTerm.length >= 2) {
      return await aiDataQueries.searchInvoiceableItems(searchTerm);
    }
  }

  // Check for report generation with filters
  const reportMatch = message.match(/(?:generate|create|show|give me|get|export|rapport)\s+(?:a\s+)?(?:offers?|sales?|service\s*orders?|ventes?|devis|ordres?\s*(?:de\s+)?service)\s+report/i);
  if (reportMatch) {
    // Extract optional filters
    let searchTerm: string | undefined;
    let status: string | undefined;
    let dateRange: string | undefined;

    // Extract search term: "for [customer]" or "search [term]"
    const searchMatch = message.match(/(?:for|search|find|customer|client)\s+["']?([A-Za-z0-9\s]+?)["']?(?:\s+|$)/i);
    if (searchMatch && searchMatch[1]) {
      searchTerm = searchMatch[1].trim();
    }

    // Extract status filter
    const statusMatch = message.match(/(?:status|état)\s*[=:]?\s*["']?(\w+)["']?/i);
    if (statusMatch && statusMatch[1]) {
      status = statusMatch[1].trim();
    }

    // Extract date range
    if (lowerMessage.includes('today') || lowerMessage.includes("aujourd'hui")) {
      dateRange = 'today';
    } else if (lowerMessage.includes('this week') || lowerMessage.includes('cette semaine')) {
      dateRange = 'week';
    } else if (lowerMessage.includes('this month') || lowerMessage.includes('ce mois')) {
      dateRange = 'month';
    }

    // Determine report type
    if (lowerMessage.includes('offer') || lowerMessage.includes('devis')) {
      return await aiDataQueries.generateOffersReport(searchTerm, status, dateRange);
    } else if (lowerMessage.includes('sale') || lowerMessage.includes('vente')) {
      return await aiDataQueries.generateSalesReport(searchTerm, status, dateRange);
    } else if (lowerMessage.includes('service') || lowerMessage.includes('ordre')) {
      return await aiDataQueries.generateServiceOrdersReport(searchTerm, status, dateRange);
    }
  }

  // =============== END REPORT & INVOICE GENERATION ===============

  // Then check for general data queries
  for (const { patterns, query } of DATA_QUERY_PATTERNS) {
    if (patterns.some(p => lowerMessage.includes(p))) {
      const queryFn = (aiDataQueries as any)[query];
      if (queryFn) {
        return await queryFn();
      }
    }
  }

  return null;
};

export default aiDataQueries;
