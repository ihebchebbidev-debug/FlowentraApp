// Notification content translation utility
// Maps backend notification content to translation keys

import i18n from '@/lib/i18n';

// Normalize string for case-insensitive matching
const normalize = (str: string) => str.toLowerCase().trim();

// Notification title mappings (lowercase backend text -> translation key)
const titleMappings: Record<string, string> = {
  // Job/Dispatch notifications
  'new job assigned': 'notificationContent.titles.newJobAssigned',
  'job completed': 'notificationContent.titles.jobCompleted',
  'job cancelled': 'notificationContent.titles.jobCancelled',
  'job updated': 'notificationContent.titles.jobUpdated',
  'dispatch assigned': 'notificationContent.titles.dispatchAssigned',
  'dispatch updated': 'notificationContent.titles.dispatchUpdated',
  
  // Sale notifications
  'new sale created': 'notificationContent.titles.newSaleCreated',
  'sale closed': 'notificationContent.titles.saleClosed',
  'sale updated': 'notificationContent.titles.saleUpdated',
  'sale cancelled': 'notificationContent.titles.saleCancelled',
  
  // Offer notifications
  'new offer received': 'notificationContent.titles.newOfferReceived',
  'offer accepted': 'notificationContent.titles.offerAccepted',
  'offer rejected': 'notificationContent.titles.offerRejected',
  'offer updated': 'notificationContent.titles.offerUpdated',
  'offer expired': 'notificationContent.titles.offerExpired',
  
  // Service order notifications
  'new service order': 'notificationContent.titles.newServiceOrder',
  'service order completed': 'notificationContent.titles.serviceOrderCompleted',
  'service order updated': 'notificationContent.titles.serviceOrderUpdated',
  
  // Task notifications
  'new task assigned': 'notificationContent.titles.newTaskAssigned',
  'task completed': 'notificationContent.titles.taskCompleted',
  'task due soon': 'notificationContent.titles.taskDueSoon',
  'task overdue': 'notificationContent.titles.taskOverdue',
  
  // Project notifications
  'added to project': 'notificationContent.titles.addedToProject',
  
  // System notifications
  'system maintenance': 'notificationContent.titles.systemMaintenance',
  'welcome': 'notificationContent.titles.welcome',
  
  // Form notifications
  'new form response': 'notificationContent.titles.newFormResponse',
  'form submitted': 'notificationContent.titles.formSubmitted',
  
  // Low stock notifications
  'low stock alert': 'notificationContent.titles.lowStockAlert',
  'out of stock alert': 'notificationContent.titles.outOfStockAlert',
  'stock replenished': 'notificationContent.titles.stockReplenished',
};

// Description pattern mappings (for dynamic content with placeholders)
const descriptionPatterns: Array<{ pattern: RegExp; key: string; extractParams: (match: RegExpMatchArray) => Record<string, string> }> = [
  // Match: "You have been assigned a new job (Dispatch #DISP-xxx) scheduled for X at Y. Priority: Z."
  {
    pattern: /You have been assigned a new job \(Dispatch #([^\)]+)\) scheduled for ([^\.]+)\. Priority: (\w+)/i,
    key: 'notificationContent.descriptions.newJobAssigned',
    extractParams: (match) => ({ dispatchId: match[1], schedule: match[2], priority: match[3] }),
  },
  // Match: "You have been assigned to job X"
  {
    pattern: /You have been assigned to job (.+)/i,
    key: 'notificationContent.descriptions.assignedToJob',
    extractParams: (match) => ({ jobName: match[1] }),
  },
  {
    pattern: /Job (.+) has been completed/i,
    key: 'notificationContent.descriptions.jobCompleted',
    extractParams: (match) => ({ jobName: match[1] }),
  },
  {
    pattern: /A new sale (.+) has been created/i,
    key: 'notificationContent.descriptions.saleCreated',
    extractParams: (match) => ({ saleName: match[1] }),
  },
  {
    pattern: /Sale (.+) has been closed/i,
    key: 'notificationContent.descriptions.saleClosed',
    extractParams: (match) => ({ saleName: match[1] }),
  },
  {
    pattern: /New offer from (.+)/i,
    key: 'notificationContent.descriptions.newOfferFrom',
    extractParams: (match) => ({ contactName: match[1] }),
  },
  {
    pattern: /Offer (.+) has been accepted/i,
    key: 'notificationContent.descriptions.offerAccepted',
    extractParams: (match) => ({ offerName: match[1] }),
  },
  {
    pattern: /Task (.+) is due in (.+)/i,
    key: 'notificationContent.descriptions.taskDueSoon',
    extractParams: (match) => ({ taskName: match[1], timeLeft: match[2] }),
  },
  {
    pattern: /You have been assigned to task (.+)/i,
    key: 'notificationContent.descriptions.assignedToTask',
    extractParams: (match) => ({ taskName: match[1] }),
  },
  // Backend format: "email assigned you the task "taskName""
  {
    pattern: /(.+) assigned you the task [""]?([^""]+)[""]?\.?/i,
    key: 'notificationContent.descriptions.taskAssignedBy',
    extractParams: (match) => ({ assignerName: match[1], taskName: match[2] }),
  },
  {
    pattern: /Service order (.+) has been created/i,
    key: 'notificationContent.descriptions.serviceOrderCreated',
    extractParams: (match) => ({ orderNumber: match[1] }),
  },
  {
    pattern: /Dispatch (.+) assigned to you/i,
    key: 'notificationContent.descriptions.dispatchAssigned',
    extractParams: (match) => ({ dispatchId: match[1] }),
  },
  {
    pattern: /You have been added to project (.+)/i,
    key: 'notificationContent.descriptions.addedToProject',
    extractParams: (match) => ({ projectName: match[1] }),
  },
  {
    pattern: /New response received for ['']?([^'']+)['']? from (.+)/i,
    key: 'notificationContent.descriptions.newFormResponse',
    extractParams: (match) => ({ formName: match[1], submitter: match[2] }),
  },
  {
    pattern: /Form ['']?([^'']+)['']? was submitted by (.+)/i,
    key: 'notificationContent.descriptions.formSubmitted',
    extractParams: (match) => ({ formName: match[1], submitter: match[2] }),
  },
  // Low stock notifications
  {
    pattern: /Material ['']?([^'']+)['']? is running low\. Current stock: (\d+) \(minimum: (\d+)\)/i,
    key: 'notificationContent.descriptions.lowStockAlert',
    extractParams: (match) => ({ articleName: match[1], stock: match[2], minStock: match[3] }),
  },
  {
    pattern: /Material ['']?([^'']+)['']? is out of stock/i,
    key: 'notificationContent.descriptions.outOfStockAlert',
    extractParams: (match) => ({ articleName: match[1] }),
  },
  {
    pattern: /Stock for ['']?([^'']+)['']? has been replenished\. New stock level: (\d+)/i,
    key: 'notificationContent.descriptions.stockReplenished',
    extractParams: (match) => ({ articleName: match[1], stock: match[2] }),
  },
];

// Static description mappings (lowercase)
const descriptionMappings: Record<string, string> = {
  'welcome to the platform!': 'notificationContent.descriptions.welcomeMessage',
  'system will be under maintenance': 'notificationContent.descriptions.maintenanceMessage',
};

/**
 * Translate notification title (case-insensitive)
 */
export function translateNotificationTitle(title: string): string {
  const key = titleMappings[normalize(title)];
  if (key) {
    const translated = i18n.t(key, { ns: 'dashboard' });
    // If translation key returns the key itself, return original
    return translated !== key ? translated : title;
  }
  return title;
}

/**
 * Translate notification description
 */
export function translateNotificationDescription(description: string): string {
  // First check static mappings (case-insensitive)
  const staticKey = descriptionMappings[normalize(description)];
  if (staticKey) {
    const translated = i18n.t(staticKey, { ns: 'dashboard' });
    return translated !== staticKey ? translated : description;
  }
  
  // Then check pattern-based translations
  for (const { pattern, key, extractParams } of descriptionPatterns) {
    const match = description.match(pattern);
    if (match) {
      const params = extractParams(match);
      const translated = i18n.t(key, { ns: 'dashboard', ...params });
      return translated !== key ? translated : description;
    }
  }
  
  return description;
}

/**
 * Translate full notification content
 */
export function translateNotification<T extends { title: string; description: string }>(
  notification: T
): T {
  return {
    ...notification,
    title: translateNotificationTitle(notification.title),
    description: translateNotificationDescription(notification.description),
  };
}
