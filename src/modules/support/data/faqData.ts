import type { FAQ } from '../types';

// FAQ data structure - now primarily used for search/filtering
// Actual content is stored in locale files (en.json, fr.json)
export const faqData: FAQ[] = [
  // Getting Started
  { id: 1, question: "whatIsWorkflow", answer: "", tags: ['workflow', 'basics', 'overview'], updatedAt: '2025-01-15', category: 'gettingStarted' },
  { id: 2, question: "howToNavigate", answer: "", tags: ['navigation', 'modules', 'sidebar'], updatedAt: '2025-01-15', category: 'gettingStarted' },
  { id: 3, question: "whatAreDailyTasks", answer: "", tags: ['daily', 'tasks', 'dispatches'], updatedAt: '2025-01-15', category: 'gettingStarted' },
  
  // Offers and Sales
  { id: 10, question: "howToCreateOffer", answer: "", tags: ['offer', 'create', 'new'], updatedAt: '2025-01-20', category: 'offersAndSales' },
  { id: 11, question: "howToAddArticles", answer: "", tags: ['offer', 'articles', 'items'], updatedAt: '2025-01-20', category: 'offersAndSales' },
  { id: 12, question: "howToConvertToSale", answer: "", tags: ['offer', 'sale', 'convert'], updatedAt: '2025-01-20', category: 'offersAndSales' },
  { id: 13, question: "whatHappensAfterConversion", answer: "", tags: ['offer', 'sale', 'service order'], updatedAt: '2025-01-20', category: 'offersAndSales' },
  { id: 14, question: "howToSetDiscount", answer: "", tags: ['offer', 'discount', 'pricing'], updatedAt: '2025-01-20', category: 'offersAndSales' },
  
  // Service Orders
  { id: 20, question: "whatIsServiceOrder", answer: "", tags: ['service order', 'definition'], updatedAt: '2025-01-22', category: 'serviceOrders' },
  { id: 21, question: "howToViewJobs", answer: "", tags: ['service order', 'jobs', 'view'], updatedAt: '2025-01-22', category: 'serviceOrders' },
  { id: 22, question: "howToUpdateJobStatus", answer: "", tags: ['job', 'status', 'update'], updatedAt: '2025-01-22', category: 'serviceOrders' },
  { id: 23, question: "howToLinkEquipment", answer: "", tags: ['job', 'equipment', 'installation'], updatedAt: '2025-01-22', category: 'serviceOrders' },
  
  // Planning and Dispatches
  { id: 30, question: "howToScheduleJob", answer: "", tags: ['planning', 'schedule', 'job'], updatedAt: '2025-01-25', category: 'planningAndDispatches' },
  { id: 31, question: "whatIsDispatch", answer: "", tags: ['dispatch', 'definition'], updatedAt: '2025-01-25', category: 'planningAndDispatches' },
  { id: 32, question: "howToReschedule", answer: "", tags: ['dispatch', 'reschedule', 'planning'], updatedAt: '2025-01-25', category: 'planningAndDispatches' },
  { id: 33, question: "howToViewTechSchedule", answer: "", tags: ['technician', 'schedule', 'view'], updatedAt: '2025-01-25', category: 'planningAndDispatches' },
  
  // Time and Expenses
  { id: 40, question: "howToLogTime", answer: "", tags: ['time', 'log', 'dispatch'], updatedAt: '2025-01-26', category: 'timeAndExpenses' },
  { id: 41, question: "howToAddExpense", answer: "", tags: ['expense', 'add', 'receipt'], updatedAt: '2025-01-26', category: 'timeAndExpenses' },
  { id: 42, question: "howToLogMaterials", answer: "", tags: ['materials', 'inventory', 'usage'], updatedAt: '2025-01-26', category: 'timeAndExpenses' },
  { id: 43, question: "whereToSeeTimesheet", answer: "", tags: ['timesheet', 'hours', 'report'], updatedAt: '2025-01-26', category: 'timeAndExpenses' },
  
  // Inventory and Articles
  { id: 50, question: "howToCreateArticle", answer: "", tags: ['article', 'create', 'new'], updatedAt: '2025-01-27', category: 'inventoryAndArticles' },
  { id: 51, question: "differenceMaterialService", answer: "", tags: ['material', 'service', 'difference'], updatedAt: '2025-01-27', category: 'inventoryAndArticles' },
  { id: 52, question: "howToCheckStock", answer: "", tags: ['stock', 'inventory', 'levels'], updatedAt: '2025-01-27', category: 'inventoryAndArticles' },
  { id: 53, question: "howToAdjustInventory", answer: "", tags: ['inventory', 'adjust', 'correction'], updatedAt: '2025-01-27', category: 'inventoryAndArticles' },
  
  // Installations and Equipment
  { id: 60, question: "whatIsInstallation", answer: "", tags: ['installation', 'equipment', 'definition'], updatedAt: '2025-01-28', category: 'installationsAndEquipment' },
  { id: 61, question: "howToCreateInstallation", answer: "", tags: ['installation', 'create', 'equipment'], updatedAt: '2025-01-28', category: 'installationsAndEquipment' },
  { id: 62, question: "howToViewServiceHistory", answer: "", tags: ['installation', 'history', 'service'], updatedAt: '2025-01-28', category: 'installationsAndEquipment' },
  { id: 63, question: "howToScheduleMaintenance", answer: "", tags: ['maintenance', 'preventive', 'schedule'], updatedAt: '2025-01-28', category: 'installationsAndEquipment' },
  
  // Account and Settings
  { id: 70, question: "howToChangePassword", answer: "", tags: ['password', 'change', 'security'], updatedAt: '2025-01-29', category: 'accountAndSettings' },
  { id: 71, question: "howToUpdateProfile", answer: "", tags: ['profile', 'update', 'account'], updatedAt: '2025-01-29', category: 'accountAndSettings' },
  { id: 72, question: "howToSetNotifications", answer: "", tags: ['notifications', 'settings', 'alerts'], updatedAt: '2025-01-29', category: 'accountAndSettings' },
  { id: 73, question: "howToSwitchLanguage", answer: "", tags: ['language', 'french', 'english'], updatedAt: '2025-01-29', category: 'accountAndSettings' },
];
