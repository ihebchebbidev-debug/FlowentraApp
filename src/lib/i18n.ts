import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Shared locale imports
import sharedEn from '../shared/locale/en.json';
import sharedFr from '../shared/locale/fr.json';

// Module locale imports
import fieldEn from '../modules/field/locale/en.json';
import fieldFr from '../modules/field/locale/fr.json';
import jobDetailEn from '../modules/field/dispatches/locales/job-detail/en.json';
import jobDetailFr from '../modules/field/dispatches/locales/job-detail/fr.json';
import dispatchesEn from '../modules/field/dispatches/locales/en.json';
import dispatchesFr from '../modules/field/dispatches/locales/fr.json';
import attachmentsEn from '../modules/field/dispatches/locales/attachments/en.json';
import attachmentsFr from '../modules/field/dispatches/locales/attachments/fr.json';
import notesEn from '../modules/field/dispatches/locales/notes/en.json';
import notesFr from '../modules/field/dispatches/locales/notes/fr.json';
import timeBookingEn from '../modules/field/dispatches/locales/time-booking/en.json';
import timeBookingFr from '../modules/field/dispatches/locales/time-booking/fr.json';
import technicianEn from '../modules/field/dispatches/locales/technician/en.json';
import technicianFr from '../modules/field/dispatches/locales/technician/fr.json';
import expenseBookingEn from '../modules/field/dispatches/locales/expense-booking/en.json';
import expenseBookingFr from '../modules/field/dispatches/locales/expense-booking/fr.json';
import dispatchCommonEn from '../modules/field/dispatches/locales/common/en.json';
import dispatchCommonFr from '../modules/field/dispatches/locales/common/fr.json';
import timeExpensesEn from '../modules/field/time-expenses/locales/time-expenses/en.json';
import timeExpensesFr from '../modules/field/time-expenses/locales/time-expenses/fr.json';
import serviceOrdersEn from '../modules/field/service-orders/locale/en.json';
import serviceOrdersFr from '../modules/field/service-orders/locale/fr.json';
import installationsEn from '../modules/field/installations/locale/en.json';
import installationsFr from '../modules/field/installations/locale/fr.json';
import fieldCustomersEn from '../modules/field/FieldCustomers/locale/en.json';
import fieldCustomersFr from '../modules/field/FieldCustomers/locale/fr.json';
import contactsEn from '../modules/contacts/locale/en.json';
import contactsFr from '../modules/contacts/locale/fr.json';
import suppliersEn from '../modules/contacts/locale/suppliers.en.json';
import suppliersFr from '../modules/contacts/locale/suppliers.fr.json';
import skillsEn from '../modules/skills/locale/en.json';
import skillsFr from '../modules/skills/locale/fr.json';
import salesEn from '../modules/sales/locale/en.json';
import salesFr from '../modules/sales/locale/fr.json';
import offersEn from '../modules/offers/locale/en.json';
import offersFr from '../modules/offers/locale/fr.json';
import dealsEn from '../modules/deals/locale/en.json';
import dealsFr from '../modules/deals/locale/fr.json';
import invoicesEn from '../modules/invoices/locale/en.json';
import invoicesFr from '../modules/invoices/locale/fr.json';
import processesEn from '../modules/system/locale/processes.en.json';
import processesFr from '../modules/system/locale/processes.fr.json';
import offersListEn from '../modules/offers/locale/list.en.json';
import offersDetailEn from '../modules/offers/locale/detail.en.json';
import offersAddEn from '../modules/offers/locale/add.en.json';
import offersListFr from '../modules/offers/locale/list.fr.json';
import offersDetailFr from '../modules/offers/locale/detail.fr.json';
import offersAddFr from '../modules/offers/locale/add.fr.json';
import reportingEn from '../modules/reporting/locales/en.json';
import reportingFr from '../modules/reporting/locales/fr.json';
import lookupsEn from '../modules/lookups/locale/en.json';
import lookupsFr from '../modules/lookups/locale/fr.json';
import documentsEn from '../modules/documents/locale/en.json';
import documentsFr from '../modules/documents/locale/fr.json';
import documentsListEn from '../modules/documents/locale/list.en.json';
import documentsPreviewEn from '../modules/documents/locale/preview.en.json';
import documentsUploadEn from '../modules/documents/locale/upload.en.json';
import documentsListFr from '../modules/documents/locale/list.fr.json';
import documentsPreviewFr from '../modules/documents/locale/preview.fr.json';
import documentsUploadFr from '../modules/documents/locale/upload.fr.json';
import dashboardEn from '../modules/dashboard/locale/en.json';
import dashboardFr from '../modules/dashboard/locale/fr.json';
import workflowEn from '../modules/workflow/locale/en.json';
import workflowFr from '../modules/workflow/locale/fr.json';
import articlesEn from '../modules/articles/locale/en.json';
import articlesFr from '../modules/articles/locale/fr.json';
import settingsEn from '../modules/settings/locale/en.json';
import settingsFr from '../modules/settings/locale/fr.json';
import inventoryServicesEn from '../modules/inventory-services/locale/en.json';
import inventoryServicesFr from '../modules/inventory-services/locale/fr.json';
import supportEn from '../modules/support/locale/en.json';
import supportFr from '../modules/support/locale/fr.json';
import tasksEn from '../modules/tasks/locale/en.json';
import tasksFr from '../modules/tasks/locale/fr.json';
import dynamicFormsEn from '../modules/dynamic-forms/locale/en.json';
import dynamicFormsFr from '../modules/dynamic-forms/locale/fr.json';
import authEn from '../modules/auth/locale/en.json';
import authFr from '../modules/auth/locale/fr.json';
import testingEn from '../modules/testing/locale/en.json';
import testingFr from '../modules/testing/locale/fr.json';
import unsavedChangesEn from '../locales/unsavedChanges/en.json';
import unsavedChangesFr from '../locales/unsavedChanges/fr.json';
import onboardingEn from '../modules/onboarding/locale/en.json';
import onboardingFr from '../modules/onboarding/locale/fr.json';
import usersEn from '../modules/users/locale/en.json';
import usersFr from '../modules/users/locale/fr.json';
import aiAssistantEn from '../modules/ai-assistant/locale/en.json';
import aiAssistantFr from '../modules/ai-assistant/locale/fr.json';
import notificationsEn from '../modules/notifications/locale/en.json';
import notificationsFr from '../modules/notifications/locale/fr.json';
import stockManagementEn from '../modules/stock-management/locale/en.json';
import stockManagementFr from '../modules/stock-management/locale/fr.json';
import hrEn from '../modules/hr/locale/hr.en.json';
import hrFr from '../modules/hr/locale/hr.fr.json';
import purchasesEn from '../modules/purchases/locale/en.json';
import purchasesFr from '../modules/purchases/locale/fr.json';
import purchasesAr from '../modules/purchases/locale/ar.json';
import externalEn from '../modules/external/locale/en.json';
import externalFr from '../modules/external/locale/fr.json';
import { en as dispatcherEn } from '../modules/dispatcher/locales/en/index';
import { fr as dispatcherFr } from '../modules/dispatcher/locales/fr/index';
import { de as dispatcherDe } from '../modules/dispatcher/locales/de/index';
import schedulingEnDefault from '../modules/scheduling/locales/en';
import schedulingFrDefault from '../modules/scheduling/locales/fr';
import { en as schedulingEnNested } from '../modules/scheduling/locales/en/index';
import { fr as schedulingFrNested } from '../modules/scheduling/locales/fr/index';
const __logs = import.meta.glob('../modules/field/dispatches/locales/logs/*.json', { eager: true }) as Record<string, any>;
const logsEn = __logs['../modules/field/dispatches/locales/logs/en.json']?.default ?? {};
const logsFr = __logs['../modules/field/dispatches/locales/logs/fr.json']?.default ?? {};
// Small helpers to reduce repetition
const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

// Recursively flatten nested object to dotted keys
const flattenToDotted = (obj: any, prefix = ''): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!isObj(obj)) return out;
  Object.keys(obj).forEach(k => {
    const val = obj[k];
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (isObj(val)) {
      Object.assign(out, flattenToDotted(val, newKey));
    } else {
      out[newKey] = val;
    }
  });
  return out;
};

const dottedFromKey = (key: string, mod: any) => {
  const src = (mod && mod[key]) ? mod[key] : {};
  const out: Record<string, any> = {};
  Object.keys(src).forEach(k => { out[`${key}.${k}`] = src[k]; });
  return out;
};
const flattenNonObjects = (sources: any[]) => {
  const out: Record<string, any> = {};
  sources.forEach(src => {
    if (!src || !isObj(src)) return;
    Object.keys(src).forEach(k => { const v = src[k]; if (v !== null && typeof v === 'object') return; out[k] = v; });
  });
  return out;
};
const dottedFromMergedExcludingRoot = (merged: any, rootName: string) => {
  const out: Record<string, any> = {};
  if (!isObj(merged)) return out;
  Object.keys(merged).forEach(k => { if (k === rootName) return; out[`${rootName}.${k}`] = merged[k]; });
  return out;
};
const handleDispatcher = (mod: any) => {
  const nested = mod || {};
  if (nested.dispatcher && typeof nested.dispatcher === 'object') {
    // Deep-flatten so nested keys like dispatcher.profiles.tab_skills resolve correctly.
    // The old shallow approach created "dispatcher.profiles" = object, which i18next
    // couldn't navigate into — so all profiles.* keys were silently falling back to
    // their defaultValue English strings and French was never shown.
    return flattenToDotted(nested.dispatcher, 'dispatcher');
  }
  return { ...nested };
};

// Helper merges: build dotted keys where needed to avoid exposing nested objects
const enTranslation = {
  // Authentication (core)
  auth: {
    welcome: 'Welcome to Flowentra',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign up',
    email: 'Email',
    email_placeholder: 'Enter your email',
    password: 'Password',
    password_placeholder: 'Enter your password',
    confirm_password: 'Confirm password',
    confirm_password_placeholder: 'Confirm your password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    createAccount: 'Create account',
    haveAccount: 'Already have an account?',
    creating_account: 'Creating account...',
    signing_in: 'Signing in...',
    continue_with: 'Or continue with',
    continue_with_google: 'Continue with Google',
    continue_with_microsoft: 'Continue with Microsoft',
    connecting: 'Connecting...',
    google_signin_success: 'Google sign-in successful!',
    google_signin_failed: 'Google sign-in failed. Please try again.',
    oauth_not_ready: 'Authentication service not ready. Please try again.',
    oauth_signin_failed_title: 'Sign in failed',
    oauth_signin_failed_desc: 'Failed to sign in with Google. Please try again.',
    oauth_config_required_title: 'Configuration Required',
    oauth_config_required_desc: 'Google OAuth is not configured. Please set up the integration in Settings.',
    oauth_email_locked: 'Linked via OAuth',
    oauth_prefill_success: 'Profile info loaded. Please set a password to complete signup.',
    oauth_clear_email: 'Clear',
    developer_mode: 'Developer Mode',
    please_fill_all_fields: 'Please fill in all fields',
    invalid_email_or_password: 'Invalid email or password',
    login_error: 'An error occurred during login',
    admin_prompt: 'Admin user?',
    sign_in_here: 'Sign in here',
    error: 'Error',
    popup_blocked: 'Popup blocked. Please allow popups for this site.',
    success: 'Success',
    email_auto_connected: 'Your email account has been connected for syncing.',
    passwords_dont_match_signup: 'Passwords do not match',
    password_too_short_signup: 'Password must be at least 6 characters',
    // Admin setup translations
    checking_status: 'Checking system status...',
    initial_setup: 'Welcome! Create your administrator account to get started.',
    create_admin_account: 'Create your first administrator account to begin.',
    admin_login_only: 'Please sign in with your administrator account.',
    signup_disabled: 'Signup is disabled. An administrator account already exists.',
    forgot_password: {
      title: 'Forgot Password',
      description: 'Enter your email to reset your password',
      email_description: "Enter your email address and we'll send you a verification code",
      submit: 'Send Reset Link',
      back_to_login: 'Back to Login',
      success: 'Password reset email sent',
      error: 'Failed to send reset email',
      send_code: 'Send Code',
      email_required: 'Email is required',
      otp_sent: 'Verification code sent to your email',
      otp_description: "We've sent a 6-digit code to {{email}}",
      verification_code: 'Verification Code',
      otp_required: 'Verification code is required',
      otp_verified: 'Code verified successfully',
      reset_description: 'Enter your new password',
      new_password: 'New Password',
      new_password_placeholder: 'Enter your new password',
      confirm_password: 'Confirm Password',
      confirm_password_placeholder: 'Confirm your new password',
      password_required: 'Password is required',
      passwords_dont_match: "Passwords don't match",
      password_too_short: 'Password must be at least 8 characters',
      password_reset_success: 'Password reset successfully',
      sending: 'Sending...',
      verifying: 'Verifying...',
      resetting: 'Resetting...',
      verify_code: 'Verify Code',
      reset_password: 'Reset Password',
      didnt_receive_code: "Didn't receive the code? ",
      resend: 'Resend'
    },
    captcha: {
      title: "I'm not a robot",
      verified: "You're verified as human",
      verifying: 'Verifying…',
      failed: 'Verification failed',
      privacy: 'Privacy-friendly check',
      please_verify: "Please confirm you're not a robot.",
      reason_automated: 'Automated click detected.',
      reason_webdriver: 'Browser automation detected.',
      reason_dwell: 'Please wait a moment and try again.',
      reason_no_interaction: 'No human interaction detected.',
      reason_generic: 'Verification failed.'
    }
  },

  // Footer / common
  footer: { terms: 'Terms', privacy: 'Privacy', faq: 'FAQ', all_rights_reserved: 'All rights reserved.' },
  loading: 'Loading...', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add',
  searchAction: 'Search', search_placeholder: 'Search...', filter: 'Filter', lightMode: 'Light', darkMode: 'Dark', back: 'Back', filters: 'Filters',
  pleaseWait: 'Please wait a second',
  common: { back: 'Back', edit: 'Edit', save: 'Save', cancel: 'Cancel', delete: 'Delete', rows: 'Rows' },
  
  // Shared component translations
  shared: {
    deleteConfirmation: {
      title: 'Delete {{itemType}}',
      description: 'Are you sure you want to delete {{itemName}}? This action cannot be undone.',
      descriptionGeneric: 'Are you sure you want to delete this {{itemType}}? This action cannot be undone.',
      cancel: 'Cancel',
      confirm: 'Delete'
    },
    noResults: 'No results found',
    noItemsFound: 'No items found',
    tryAdjustingSearch: 'Try adjusting your search or filters',
    allUsersInTeam: 'All users are already in the team'
  },

  // Global search component
  globalSearch: {
    placeholder: 'Search',
    searching: 'Searching...',
    results_found: '{{count}} result',
    results_found_plural: '{{count}} results',
    no_results: 'No results found for "{{query}}"',
    keyboard_hint: 'Use ↑↓ to navigate, Enter to select, Esc to close',
    types: {
      contact: 'Contact',
      sale: 'Sale',
      offer: 'Offer',
      'service-order': 'Service Order',
      material: 'Material',
      service: 'Service',
      project: 'Project',
      installation: 'Installation',
      dispatch: 'Dispatch',
      user: 'User',
      role: 'Role'
    },
    try_suggestion: 'Try searching for contacts, sales, offers, service orders, materials, installations, users, or roles'
  },

  // Search modal translations
  search: {
    title: 'Search Everything',
    placeholder: 'Search contacts, orders, articles...',
    searching: 'Searching...',
    noResults: 'No results found',
    startTyping: 'Start typing to search',
    tryAdjusting: 'Try adjusting your search terms or filters',
    searchHint: 'Search across contacts, service orders, articles, and more',
    filters: {
      all: 'All Results',
      serviceOrders: 'Service Orders',
      contacts: 'Contacts',
      installations: 'Installations',
      offers: 'Offers',
      articles: 'Articles',
      dispatches: 'Dispatches'
    },
    filtersShort: {
      all: 'All',
      service: 'Service',
      contacts: 'Contacts',
      installations: 'Install',
      offers: 'Offers',
      articles: 'Articles',
      dispatches: 'Dispatch'
    },
    types: {
      serviceOrder: 'Service Order',
      contact: 'Contact',
      installation: 'Installation',
      article: 'Article',
      offer: 'Offer',
      dispatch: 'Dispatch'
    }
  },

  // Error boundary
  error_boundary: {
    title: 'Oops! Something went wrong',
    description: 'We encountered an unexpected error while loading the application. Please try reloading the page.',
    reload: 'Reload Page'
  },

  // Core titles
  contacts: 'Contacts', companies: 'Companies', deals: 'Deals', tasks: 'Tasks', articles: 'Articles', dashboard: 'Dashboard', calendar: 'Calendar',
  sync_history: 'Sync History',
  jobs: 'Jobs', technicians: 'Technicians', customers: 'Customers', inventory: 'Inventory', installations: 'Installations',
  settings: 'Settings', profile: 'Profile', preferences: 'Preferences', language: 'Language',
  communication: 'Communication', automation: 'Automation', analytics: 'Analytics',

  // Shared translations (navigation, sidebar items, etc.)
  ...sharedEn,
  
  // QuickCreate modal translations (explicitly flattened for proper resolution)
  'quickCreate.title': sharedEn.quickCreate?.title || 'Create',
  'quickCreate.description': sharedEn.quickCreate?.description || 'Quick actions to create new items.',
  'quickCreate.newContact': sharedEn.quickCreate?.newContact || 'New Contact',
  'quickCreate.newTask': sharedEn.quickCreate?.newTask || 'New Task',
  'quickCreate.newProject': sharedEn.quickCreate?.newProject || 'New Project',
  'quickCreate.newOffer': sharedEn.quickCreate?.newOffer || 'New Offer',
  'quickCreate.newDeal': (sharedEn.quickCreate as any)?.newDeal || 'New Deal',
  'quickCreate.newServiceOrder': (sharedEn.quickCreate as any)?.newServiceOrder || 'New Service Order',
  'quickCreate.newArticle': sharedEn.quickCreate?.newArticle || 'New Article',
  'quickCreate.newInstallation': sharedEn.quickCreate?.newInstallation || 'New Installation',
  'quickCreate.cancel': sharedEn.quickCreate?.cancel || 'Cancel',

  // Projects list view translations (explicitly flattened for proper resolution)
  'projects.listView.searchPlaceholder': (sharedEn as any).projects?.listView?.searchPlaceholder || 'Search tasks...',
  'projects.listView.all': (sharedEn as any).projects?.listView?.all || 'All',
  'projects.listView.pending': (sharedEn as any).projects?.listView?.pending || 'Pending',
  'projects.listView.completed': (sharedEn as any).projects?.listView?.completed || 'Completed',
  'projects.listView.addTask': (sharedEn as any).projects?.listView?.addTask || 'Add Task',
  'projects.listView.tasks': (sharedEn as any).projects?.listView?.tasks || 'Tasks',
  'projects.listView.noTasksMatch': (sharedEn as any).projects?.listView?.noTasksMatch || 'No tasks match your search or filter',
  'projects.listView.noTasks': (sharedEn as any).projects?.listView?.noTasks || 'No tasks yet. Create your first task!',

  ...flattenToDotted(inventoryServicesEn),

  // Support
  ...supportEn,

  // Merge module pieces - flatten dashboard to dotted keys
  ...flattenToDotted(dashboardEn),
  ...dottedFromKey('contacts', contactsEn),
  ...dottedFromKey('suppliers', suppliersEn),
  field: (fieldEn as any).field,
  service_orders: serviceOrdersEn,
  // Add installations translations with dotted notation for detailed translations
  ...installationsEn,
  ...salesEn,

  // Offers: keep scalar keys flattened and also expose dotted offers.* for the rest
  ...flattenNonObjects([offersEn || {}, offersListEn || {}, offersDetailEn || {}, offersAddEn || {}]),
  ...dottedFromMergedExcludingRoot({ ...(offersEn as any || {}), ...(offersListEn as any || {}), ...(offersDetailEn as any || {}), ...(offersAddEn as any || {}) }, 'offers'),

  ...(lookupsEn && (lookupsEn as any).lookups ? (lookupsEn as any).lookups : {}),
  lookups: (lookupsEn && (lookupsEn as any).lookups && (lookupsEn as any).lookups.title) ? (lookupsEn as any).lookups.title : 'Lookups',

  // Documents: merge and expose dotted keys
  ...documentsEn,
  ...documentsListEn,
  ...documentsPreviewEn,
  ...documentsUploadEn,
  ...dottedFromMergedExcludingRoot({ ...(documentsEn as any || {}), ...(documentsListEn as any || {}), ...(documentsPreviewEn as any || {}), ...(documentsUploadEn as any || {}) }, 'documents'),
  documents: (documentsEn && (documentsEn as any).documents) ? (documentsEn as any).documents : 'Documents',

  // Workflow
  ...(workflowEn as any || {}),
  ...dottedFromMergedExcludingRoot({ ...(workflowEn as any || {}) }, 'workflow'),
  workflow: (workflowEn && (workflowEn as any).workflow) ? (workflowEn as any).workflow : 'Workflow',

  // Dispatcher
  ...handleDispatcher(dispatcherEn),

  // Scheduling: combine flat and nested.scheduling under scheduling.*
  ...(() => {
    try {
      const flat = (schedulingEnDefault && typeof schedulingEnDefault === 'object') ? schedulingEnDefault : {};
      const nested = (schedulingEnNested && (schedulingEnNested as any).scheduling) ? (schedulingEnNested as any).scheduling : {};
      const out: Record<string, any> = {};
      Object.keys(flat).forEach(k => { out[`scheduling.${k}`] = (flat as any)[k]; });
      Object.keys(nested).forEach(k => { out[`scheduling.${k}`] = (nested as any)[k]; });
      return out;
    } catch { return {}; }
  })(),

  // Settings: flatten to dotted keys
  ...flattenToDotted(settingsEn),

  // Purchases module
  ...flattenToDotted(purchasesEn, 'purchases'),

  // External APIs module (JSON is already wrapped under "external")
  ...externalEn,
  ...flattenToDotted(externalEn),

  // Retenue à la Source (RS) translations
  rs: {
    title: 'Withholding Tax',
    retenuRecords: 'Withholding Tax Records',
    addRS: 'Add RS',
    addRecord: 'Add Withholding Tax',
    editRecord: 'Edit RS Record',
    modalDescription: 'Calculate and record withholding tax for this document',
    calculationPreview: 'Calculation Preview',
    rsType: 'RS Type',
    rate: 'Rate',
    rsAmount: 'RS Amount',
    netPayment: 'Net Payment',
    invoiceNumber: 'Invoice Number',
    invoiceNo: 'Invoice #',
    invoiceDate: 'Invoice Date',
    invoiceAmount: 'Invoice Amount',
    paymentDate: 'Payment Date',
    amountPaid: 'Amount Paid',
    supplier: 'Beneficiary / Supplier',
    supplierName: 'Name',
    supplierTaxId: 'Tax ID (Matricule Fiscal)',
    supplierAddress: 'Address',
    payer: 'Payer / Declarant',
    payerName: 'Company Name',
    payerTaxId: 'Company Tax ID',
    payerAddress: 'Company Address',
    notes: 'Notes',
    status: 'Status',
    pending: 'Pending',
    exported: 'Exported',
    totalRecords: 'Total Records',
    totalRSAmount: 'Total RS',
    noRecords: 'No withholding tax records yet. Click "Add RS" to calculate and record withholding tax.',
    loadError: 'Failed to load RS records',
    recordCreated: 'RS record created',
    recordUpdated: 'RS record updated',
    recordDeleted: 'RS record deleted',
    exportTEJ: 'Export TEJ XML',
    exportTEJTitle: 'Export TEJ XML File',
    exportTEJDescription: 'Generate a TEJ-compliant XML file for the Tunisian tax authority',
    month: 'Month',
    year: 'Year',
    pendingExport: 'Pending export',
    totalRSForPeriod: 'Total RS for period',
    declarantInfo: 'Declarant Information',
    companyName: 'Company Name',
    companyTaxId: 'Matricule Fiscal',
    companyAddress: 'Address',
    generateXML: 'Generate TEJ XML',
    tejExportSuccess: 'TEJ export successful: {{fileName}}',
    exportComplete: 'TEJ XML file has been generated and saved as a document!',
    documentSaved: 'Document saved (ID: {{id}})',
    exportFailed: 'Export failed',
    create: 'Add RS Record',
    update: 'Update',
    type10: 'Professional Fees / Services (10%)',
    type05: 'Exported Services (0.5%)',
    type03: 'Certain Professional Fees (3%)',
    type20: 'Royalties / Interest (20%)',
    err: {
      invoiceRequired: 'Invoice number is required',
      taxIdRequired: 'Supplier Tax ID (Matricule Fiscal) is required',
      supplierRequired: 'Supplier name is required',
      payerRequired: 'Payer name is required',
      payerTaxIdRequired: 'Payer Tax ID is required',
      invoiceAmountPositive: 'Invoice amount must be positive',
      amountPaidPositive: 'Amount paid must be positive',
    },
  },
};

// Ensure global common.* keys aren't lost by later shallow merges from module locales.
// (Many modules contain a `common` object; spreading them can overwrite `common.back`.)
(enTranslation as any).common = {
  ...((enTranslation as any).common ?? {}),
  back: 'Back',
};

// Ensure shared statusFlow.* UI keys (mobile stepper: back/advance/stepOf/done/updating)
// aren't clobbered by module-level `statusFlow` blocks (sales/offers etc.) that only
// define status IDs. Shallow spread would replace the whole object and drop the shared keys,
// which is what caused literal `statusFlow.stepOf`/`statusFlow.back` to render on mobile.
(enTranslation as any).statusFlow = {
  ...((sharedEn as any).statusFlow ?? {}),
  ...((enTranslation as any).statusFlow ?? {}),
  // Shared UI keys always win — modules must not override these.
  pipelineLabel: (sharedEn as any).statusFlow?.pipelineLabel ?? 'Status pipeline',
  currentStatusLabel: (sharedEn as any).statusFlow?.currentStatusLabel ?? 'Current status',
  stepOf: (sharedEn as any).statusFlow?.stepOf ?? 'Step {{current}} of {{total}}',
  change: (sharedEn as any).statusFlow?.change ?? 'Change',
  changeStatus: (sharedEn as any).statusFlow?.changeStatus ?? 'Change status',
  back: (sharedEn as any).statusFlow?.back ?? 'Back',
  advance: (sharedEn as any).statusFlow?.advance ?? 'Advance',
  done: (sharedEn as any).statusFlow?.done ?? 'Done',
  updating: (sharedEn as any).statusFlow?.updating ?? 'Updating...',
  unknown: (sharedEn as any).statusFlow?.unknown ?? 'Unknown',
};

// French merge
const frTranslation = {
  auth: {
    welcome: 'Bienvenue sur Flowentra',
    signIn: 'Se connecter',
    signOut: 'Se déconnecter',
    signUp: "S'inscrire",
    email: 'Email',
    email_placeholder: 'Entrez votre email',
    password: 'Mot de passe',
    password_placeholder: 'Entrez votre mot de passe',
    confirm_password: 'Confirmer le mot de passe',
    confirm_password_placeholder: 'Confirmez votre mot de passe',
    rememberMe: 'Se souvenir de moi',
    forgotPassword: 'Mot de passe oublié ?',
    noAccount: "Vous n'avez pas de compte ?",
    createAccount: 'Créer un compte',
    haveAccount: 'Vous avez déjà un compte ?',
    creating_account: 'Création du compte...',
    signing_in: 'Connexion en cours...',
    continue_with: 'Ou continuer avec',
    continue_with_google: 'Continuer avec Google',
    continue_with_microsoft: 'Continuer avec Microsoft',
    connecting: 'Connexion...',
    google_signin_success: 'Connexion Google réussie !',
    google_signin_failed: 'La connexion Google a échoué. Veuillez réessayer.',
    oauth_not_ready: "Le service d'authentification n'est pas prêt. Veuillez réessayer.",
    oauth_signin_failed_title: 'Échec de la connexion',
    oauth_signin_failed_desc: 'Impossible de se connecter avec Google. Veuillez réessayer.',
    oauth_config_required_title: 'Configuration requise',
    oauth_config_required_desc: "Google OAuth n'est pas configuré. Veuillez configurer l'intégration dans les Paramètres.",
    oauth_email_locked: 'Lié via OAuth',
    oauth_prefill_success: 'Informations du profil chargées. Veuillez définir un mot de passe pour finaliser l\'inscription.',
    oauth_clear_email: 'Effacer',
    developer_mode: 'Mode développeur',
    please_fill_all_fields: 'Veuillez remplir tous les champs',
    invalid_email_or_password: 'Email ou mot de passe invalide',
    login_error: 'Une erreur est survenue lors de la connexion',
    admin_prompt: 'Utilisateur administrateur ?',
    sign_in_here: 'Se connecter ici',
    error: 'Erreur',
    popup_blocked: 'Popup bloquée. Veuillez autoriser les popups pour ce site.',
    success: 'Succès',
    email_auto_connected: 'Votre compte email a été connecté pour la synchronisation.',
    passwords_dont_match_signup: 'Les mots de passe ne correspondent pas',
    password_too_short_signup: 'Le mot de passe doit contenir au moins 6 caractères',
    // Admin setup translations
    checking_status: 'Vérification du statut du système...',
    initial_setup: 'Bienvenue ! Créez votre compte administrateur pour commencer.',
    create_admin_account: 'Créez votre premier compte administrateur pour commencer.',
    admin_login_only: 'Veuillez vous connecter avec votre compte administrateur.',
    signup_disabled: "L'inscription est désactivée. Un compte administrateur existe déjà.",
    forgot_password: {
      title: 'Mot de passe oublié',
      description: 'Entrez votre email pour réinitialiser votre mot de passe',
      email_description: 'Entrez votre adresse e-mail et nous vous enverrons un code de vérification',
      submit: 'Envoyer le lien',
      back_to_login: 'Retour à la connexion',
      success: 'Email de réinitialisation envoyé',
      error: "Échec de l'envoi de l'e-mail",
      send_code: 'Envoyer le code',
      email_required: "L'e-mail est requis",
      otp_sent: 'Code de vérification envoyé à votre e-mail',
      otp_description: 'Nous avons envoyé un code à 6 chiffres à {{email}}',
      verification_code: 'Code de vérification',
      otp_required: 'Le code de vérification est requis',
      otp_verified: 'Code vérifié avec succès',
      reset_description: 'Entrez votre nouveau mot de passe',
      new_password: 'Nouveau mot de passe',
      new_password_placeholder: 'Entrez votre nouveau mot de passe',
      confirm_password: 'Confirmer le mot de passe',
      confirm_password_placeholder: 'Confirmez votre nouveau mot de passe',
      password_required: 'Le mot de passe est requis',
      passwords_dont_match: 'Les mots de passe ne correspondent pas',
      password_too_short: 'Le mot de passe doit contenir au moins 8 caractères',
      password_reset_success: 'Mot de passe réinitialisé avec succès',
      sending: 'Envoi en cours...',
      verifying: 'Vérification en cours...',
      resetting: 'Réinitialisation en cours...',
      verify_code: 'Vérifier le code',
      reset_password: 'Réinitialiser le mot de passe',
      didnt_receive_code: "Vous n'avez pas reçu le code ? ",
      resend: 'Renvoyer'
    },
    captcha: {
      title: 'Je ne suis pas un robot',
      verified: 'Vous êtes vérifié comme humain',
      verifying: 'Vérification…',
      failed: 'Échec de la vérification',
      privacy: 'Vérification respectueuse de la vie privée',
      please_verify: "Veuillez confirmer que vous n'êtes pas un robot.",
      reason_automated: 'Clic automatisé détecté.',
      reason_webdriver: 'Automatisation du navigateur détectée.',
      reason_dwell: 'Veuillez patienter un instant et réessayer.',
      reason_no_interaction: 'Aucune interaction humaine détectée.',
      reason_generic: 'Échec de la vérification.'
    }
  },
  footer: { terms: 'Conditions', privacy: 'Confidentialité', faq: 'FAQ', all_rights_reserved: 'Tous droits réservés.' },
  loading: 'Chargement...', save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', add: 'Ajouter', searchAction: 'Rechercher', search_placeholder: 'Rechercher...', filter: 'Filtrer', lightMode: 'Clair', darkMode: 'Sombre', back: 'Retour', filters: 'Filtres',
  pleaseWait: 'Veuillez patienter un instant',
  common: { back: 'Retour', edit: 'Modifier', save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', rows: 'Lignes' },
  
  // Shared component translations
  shared: {
    deleteConfirmation: {
      title: 'Supprimer {{itemType}}',
      description: 'Êtes-vous sûr de vouloir supprimer {{itemName}} ? Cette action est irréversible.',
      descriptionGeneric: 'Êtes-vous sûr de vouloir supprimer ce(tte) {{itemType}} ? Cette action est irréversible.',
      cancel: 'Annuler',
      confirm: 'Supprimer'
    },
    noResults: 'Aucun résultat trouvé',
    noItemsFound: 'Aucun élément trouvé',
    tryAdjustingSearch: 'Essayez d\'ajuster votre recherche ou vos filtres',
    allUsersInTeam: 'Tous les utilisateurs sont déjà dans l\'équipe'
  },

  // Global search component
  globalSearch: {
    placeholder: 'Rechercher',
    searching: 'Recherche en cours...',
    results_found: '{{count}} résultat',
    results_found_plural: '{{count}} résultats',
    no_results: 'Aucun résultat pour "{{query}}"',
    keyboard_hint: 'Utilisez ↑↓ pour naviguer, Entrée pour sélectionner, Échap pour fermer',
    types: {
      contact: 'Contact',
      sale: 'Vente',
      offer: 'Offre',
      'service-order': 'Ordre de service',
      material: 'Matériel',
      service: 'Service',
      project: 'Projet',
      installation: 'Installation',
      dispatch: 'Intervention',
      user: 'Utilisateur',
      role: 'Rôle'
    },
    try_suggestion: 'Essayez de rechercher des contacts, ventes, offres, ordres de service, matériels, installations, utilisateurs ou rôles'
  },

  // Search modal translations
  search: {
    title: 'Rechercher Partout',
    placeholder: 'Rechercher contacts, ordres, articles...',
    searching: 'Recherche en cours...',
    noResults: 'Aucun résultat trouvé',
    startTyping: 'Commencez à taper pour rechercher',
    tryAdjusting: 'Essayez d\'ajuster vos termes de recherche ou vos filtres',
    searchHint: 'Recherchez parmi les contacts, ordres de service, articles et plus',
    filters: {
      all: 'Tous les Résultats',
      serviceOrders: 'Ordres de Service',
      contacts: 'Contacts',
      installations: 'Installations',
      offers: 'Offres',
      articles: 'Articles',
      dispatches: 'Interventions'
    },
    filtersShort: {
      all: 'Tous',
      service: 'Service',
      contacts: 'Contacts',
      installations: 'Install',
      offers: 'Offres',
      articles: 'Articles',
      dispatches: 'Interv'
    },
    types: {
      serviceOrder: 'Ordre de Service',
      contact: 'Contact',
      installation: 'Installation',
      article: 'Article',
      offer: 'Offre',
      dispatch: 'Intervention'
    }
  },

  // Error boundary
  error_boundary: {
    title: 'Oups ! Une erreur est survenue',
    description: 'Nous avons rencontré une erreur inattendue lors du chargement de l\'application. Veuillez recharger la page.',
    reload: 'Recharger la Page'
  },

  // Inventory & Services (flatten to dotted keys to avoid collisions with other modules using `detail.*`)
  ...flattenToDotted(inventoryServicesFr),

  // Support
  ...supportFr,

  // Shared translations (navigation, sidebar items, etc.)
  ...sharedFr,
  
  // QuickCreate modal translations (explicitly flattened for proper resolution)
  'quickCreate.title': sharedFr.quickCreate?.title || 'Créer',
  'quickCreate.description': sharedFr.quickCreate?.description || 'Actions rapides pour créer de nouveaux éléments.',
  'quickCreate.newContact': sharedFr.quickCreate?.newContact || 'Nouveau Contact',
  'quickCreate.newTask': sharedFr.quickCreate?.newTask || 'Nouvelle Tâche',
  'quickCreate.newProject': sharedFr.quickCreate?.newProject || 'Nouveau Projet',
  'quickCreate.newOffer': sharedFr.quickCreate?.newOffer || 'Nouvelle Offre',
  'quickCreate.newDeal': (sharedFr.quickCreate as any)?.newDeal || 'Nouveau Deal',
  'quickCreate.newServiceOrder': (sharedFr.quickCreate as any)?.newServiceOrder || 'Nouvel Ordre',
  'quickCreate.newArticle': sharedFr.quickCreate?.newArticle || 'Nouvel Article',
  'quickCreate.newInstallation': sharedFr.quickCreate?.newInstallation || 'Nouvelle Installation',
  'quickCreate.cancel': sharedFr.quickCreate?.cancel || 'Annuler',

  // Projects list view translations (explicitly flattened for proper resolution)
  'projects.listView.searchPlaceholder': (sharedFr as any).projects?.listView?.searchPlaceholder || 'Rechercher des tâches...',
  'projects.listView.all': (sharedFr as any).projects?.listView?.all || 'Tout',
  'projects.listView.pending': (sharedFr as any).projects?.listView?.pending || 'En attente',
  'projects.listView.completed': (sharedFr as any).projects?.listView?.completed || 'Terminées',
  'projects.listView.addTask': (sharedFr as any).projects?.listView?.addTask || 'Ajouter une tâche',
  'projects.listView.tasks': (sharedFr as any).projects?.listView?.tasks || 'Tâches',
  'projects.listView.noTasksMatch': (sharedFr as any).projects?.listView?.noTasksMatch || 'Aucune tâche ne correspond à votre recherche ou filtre',
  'projects.listView.noTasks': (sharedFr as any).projects?.listView?.noTasks || 'Aucune tâche. Créez votre première tâche !',

  contacts: 'Contacts', companies: 'Entreprises', deals: 'Affaires', tasks: 'Tâches', articles: 'Articles', dashboard: 'Tableau de bord', calendar: 'Calendrier',
  sync_history: 'Historique Sync',
  jobs: 'Interventions', technicians: 'Techniciens', customers: 'Clients', inventory: 'Inventaire', installations: 'Installations',
  settings: 'Paramètres', profile: 'Profil', preferences: 'Préférences', language: 'Langue', communication: 'Communication', automation: 'Automation', analytics: 'Analyses',
  ...flattenToDotted(dashboardFr),
  ...dottedFromKey('contacts', contactsFr),
  ...dottedFromKey('suppliers', suppliersFr),
  field: (fieldFr as any).field,
  service_orders: serviceOrdersFr,
  // Add installations translations with dotted notation for detailed translations
  ...installationsFr,
  ...salesFr,
  ...flattenNonObjects([offersFr || {}, offersListFr || {}, offersDetailFr || {}, offersAddFr || {}]),
  ...dottedFromMergedExcludingRoot({ ...(offersFr as any || {}), ...(offersListFr as any || {}), ...(offersDetailFr as any || {}), ...(offersAddFr as any || {}) }, 'offers'),
  ...(lookupsFr && (lookupsFr as any).lookups ? (lookupsFr as any).lookups : {}),
  lookups: (lookupsFr && (lookupsFr as any).lookups && (lookupsFr as any).lookups.title) ? (lookupsFr as any).lookups.title : 'Lookups',
  ...documentsFr,
  ...documentsListFr,
  ...documentsPreviewFr,
  ...documentsUploadFr,
  ...dottedFromMergedExcludingRoot({ ...(documentsFr as any || {}), ...(documentsListFr as any || {}), ...(documentsPreviewFr as any || {}), ...(documentsUploadFr as any || {}) }, 'documents'),
  documents: (documentsFr && (documentsFr as any).documents) ? (documentsFr as any).documents : 'Documents',
  ...(workflowFr as any || {}),
  ...dottedFromMergedExcludingRoot({ ...(workflowFr as any || {}) }, 'workflow'),
  workflow: (workflowFr && (workflowFr as any).workflow) ? (workflowFr as any).workflow : 'Workflow',
  ...handleDispatcher(dispatcherFr),
  // Scheduling French translations
  ...(() => {
    try {
      const flat = (schedulingFrDefault && typeof schedulingFrDefault === 'object') ? schedulingFrDefault : {};
      const nested = (schedulingFrNested && (schedulingFrNested as any).scheduling) ? (schedulingFrNested as any).scheduling : {};
      const out: Record<string, any> = {};
      Object.keys(flat).forEach(k => { out[`scheduling.${k}`] = (flat as any)[k]; });
      Object.keys(nested).forEach(k => { out[`scheduling.${k}`] = (nested as any)[k]; });
      return out;
    } catch { return {}; }
  })(),

  // Settings: flatten to dotted keys
  ...flattenToDotted(settingsFr),

  // Purchases module
  ...flattenToDotted(purchasesFr, 'purchases'),

  // External APIs module (JSON is already wrapped under "external")
  ...externalFr,
  ...flattenToDotted(externalFr),

  // Retenue à la Source (RS) translations
  rs: {
    title: 'Retenue à la Source',
    retenuRecords: 'Enregistrements Retenue à la Source',
    addRS: 'Ajouter RS',
    addRecord: 'Ajouter Retenue à la Source',
    editRecord: 'Modifier l\'enregistrement RS',
    modalDescription: 'Calculer et enregistrer la retenue à la source pour ce document',
    calculationPreview: 'Aperçu du calcul',
    rsType: 'Type RS',
    rate: 'Taux',
    rsAmount: 'Montant RS',
    netPayment: 'Paiement net',
    invoiceNumber: 'N° Facture',
    invoiceNo: 'N° Fact.',
    invoiceDate: 'Date facture',
    invoiceAmount: 'Montant facture',
    paymentDate: 'Date paiement',
    amountPaid: 'Montant payé',
    supplier: 'Bénéficiaire / Fournisseur',
    supplierName: 'Nom',
    supplierTaxId: 'Matricule Fiscal',
    supplierAddress: 'Adresse',
    payer: 'Payeur / Déclarant',
    payerName: 'Raison sociale',
    payerTaxId: 'Matricule Fiscal',
    payerAddress: 'Adresse société',
    notes: 'Notes',
    status: 'Statut',
    pending: 'En attente',
    exported: 'Exporté',
    totalRecords: 'Total enregistrements',
    totalRSAmount: 'Total RS',
    noRecords: 'Aucun enregistrement de Retenue à la Source. Cliquez sur "Ajouter RS" pour calculer et enregistrer la retenue à la source.',
    loadError: 'Erreur lors du chargement des enregistrements RS',
    recordCreated: 'Enregistrement RS créé',
    recordUpdated: 'Enregistrement RS mis à jour',
    recordDeleted: 'Enregistrement RS supprimé',
    exportTEJ: 'Exporter TEJ XML',
    exportTEJTitle: 'Exporter fichier TEJ XML',
    exportTEJDescription: 'Générer un fichier XML conforme TEJ pour l\'administration fiscale tunisienne',
    month: 'Mois',
    year: 'Année',
    pendingExport: 'En attente d\'export',
    totalRSForPeriod: 'Total RS pour la période',
    declarantInfo: 'Informations du déclarant',
    companyName: 'Raison sociale',
    companyTaxId: 'Matricule Fiscal',
    companyAddress: 'Adresse',
    generateXML: 'Générer XML TEJ',
    tejExportSuccess: 'Export TEJ réussi : {{fileName}}',
    exportComplete: 'Le fichier TEJ XML a été généré et enregistré comme document avec succès !',
    documentSaved: 'Document enregistré (ID: {{id}})',
    exportFailed: 'L\'export a échoué',
    create: 'Ajouter RS',
    update: 'Mettre à jour',
    type10: 'Honoraires / Services professionnels (10%)',
    type05: 'Services exportés (0,5%)',
    type03: 'Certains honoraires professionnels (3%)',
    type20: 'Redevances / Intérêts (20%)',
    err: {
      invoiceRequired: 'Le numéro de facture est requis',
      taxIdRequired: 'Le matricule fiscal du fournisseur est requis',
      supplierRequired: 'Le nom du fournisseur est requis',
      payerRequired: 'La raison sociale du payeur est requise',
      payerTaxIdRequired: 'Le matricule fiscal du payeur est requis',
      invoiceAmountPositive: 'Le montant de la facture doit être positif',
      amountPaidPositive: 'Le montant payé doit être positif',
    },
  },
};

// Ensure global common.* keys aren't lost by later shallow merges from module locales.
(frTranslation as any).common = {
  ...((frTranslation as any).common ?? {}),
  back: 'Retour',
};

// Same guard as English: keep shared statusFlow UI keys after module spreads.
(frTranslation as any).statusFlow = {
  ...((sharedFr as any).statusFlow ?? {}),
  ...((frTranslation as any).statusFlow ?? {}),
  pipelineLabel: (sharedFr as any).statusFlow?.pipelineLabel ?? 'Pipeline de statut',
  currentStatusLabel: (sharedFr as any).statusFlow?.currentStatusLabel ?? 'Statut actuel',
  stepOf: (sharedFr as any).statusFlow?.stepOf ?? 'Étape {{current}} sur {{total}}',
  change: (sharedFr as any).statusFlow?.change ?? 'Modifier',
  changeStatus: (sharedFr as any).statusFlow?.changeStatus ?? 'Modifier le statut',
  back: (sharedFr as any).statusFlow?.back ?? 'Retour',
  advance: (sharedFr as any).statusFlow?.advance ?? 'Avancer',
  done: (sharedFr as any).statusFlow?.done ?? 'Terminé',
  updating: (sharedFr as any).statusFlow?.updating ?? 'Mise à jour...',
  unknown: (sharedFr as any).statusFlow?.unknown ?? 'Inconnu',
};

// German translations - start with dispatcher module, fallback to English for others
const deTranslation = {
  ...enTranslation, // Base with English as fallback
  ...handleDispatcher(dispatcherDe), // Override with German dispatcher translations
};

const resources = { 
  en: { translation: enTranslation }, 
  fr: { translation: frTranslation },
  de: { translation: deTranslation }
};

// Check user preferences first, then fallback to 'language' key
const getUserLanguage = () => {
  try {
    const userPrefs = localStorage.getItem('user-preferences');
    if (userPrefs) {
      const prefs = JSON.parse(userPrefs);
      if (prefs.language) return prefs.language;
    }
  } catch (e) {}
  return localStorage.getItem('language') || 'en';
};

const savedLanguage = getUserLanguage();

i18n.use(initReactI18next).init({ resources, lng: savedLanguage, fallbackLng: 'en', interpolation: { escapeValue: false } });

// Register planning keys under the default 'translation' namespace so the
// shared Plan-vs-Actual UI (PlannedInlineList / OverrunBadge) renders in
// both English and French regardless of the caller's namespace.
const planningEn = {
  planning: {
    plannedBadge: 'Planned',
    plannedTimeSection: 'Planned time',
    plannedExpensesSection: 'Planned expenses',
    plannedMaterialsSection: 'Planned materials',
    planTime: 'Plan Time',
    planExpense: 'Plan Expense',
    planMaterial: 'Plan Material',
    noTime: 'No planned time',
    noExpenses: 'No planned expenses',
    noMaterials: 'No planned materials',
    editEntry: 'Edit planned entry',
    jobLabel: 'Job',
    noParent: 'Cannot plan without a linked job',
    savedToast: 'Plan saved',
    confirmDelete: 'Delete this planned entry?',
    technicianCount: 'Technicians',
    durationMinutes: 'Duration (min)',
    duration: 'Duration',
    plannedDate: 'Planned day',
    hoursShort: 'h',
    minutesShort: 'min',
    hourlyRate: 'Hourly rate (optional)',
    expenseType: 'Expense type',
    amount: 'Amount',
    currency: 'Currency',
    materialName: 'Material / article name',
    materialNamePh: 'e.g. Solar panel 450W',
    quantity: 'Quantity',
    unit: 'Unit',
    unitPrice: 'Unit price',
    description: 'Description (optional)',
    searchArticle: 'Search article (global)',
    searchArticlePh: 'Name, SKU, category…',
    noArticles: 'No articles match your search.',
    pickedArticle: 'Selected',
    expenseTypes: {
      travel: 'Travel',
      per_diem: 'Per diem',
      materials: 'Materials',
      subcontractor: 'Subcontractor',
    },
    deleteAll: 'Delete all',
    deletedToast: 'Planned entry deleted',
    deletedAllToast: 'All planned entries deleted',
    confirmDeleteTitle: 'Delete planned entry?',
    confirmDeleteAllTitle: 'Delete all planned entries?',
    confirmDeleteAll: 'This will remove every planned entry in this section. This action cannot be undone.',
    fromOffer: 'from Offer',
    onJob: 'on Job',
    openSource: 'Open source',
    originOfferTooltip: 'Inherited from the source offer item',
    originJobTooltip: 'Added directly on this service order job',
    durationRequired: 'Planned duration must be greater than 0 minutes.',
    amountRequired: 'Amount must be greater than 0.',
    materialNameRequired: 'Please pick or enter an article name.',
    quantityRequired: 'Quantity must be greater than 0.',
    overrun: {
      onPlan: 'On plan',
      nearLimit: 'Near limit',
      overBudget: 'Over budget',
      over: 'over by',
    },
  },
};
const planningFr = {
  planning: {
    plannedBadge: 'Planifié',
    plannedTimeSection: 'Temps planifié',
    plannedExpensesSection: 'Frais planifiés',
    plannedMaterialsSection: 'Matériel planifié',
    planTime: 'Planifier temps',
    planExpense: 'Planifier frais',
    planMaterial: 'Planifier matériel',
    noTime: 'Aucun temps planifié',
    noExpenses: 'Aucun frais planifié',
    noMaterials: 'Aucun matériel planifié',
    editEntry: 'Modifier l’entrée planifiée',
    jobLabel: 'Intervention',
    noParent: 'Impossible de planifier sans intervention liée',
    savedToast: 'Planification enregistrée',
    confirmDelete: 'Supprimer cette entrée planifiée ?',
    technicianCount: 'Techniciens',
    durationMinutes: 'Durée (min)',
    duration: 'Durée',
    plannedDate: 'Jour planifié',
    hoursShort: 'h',
    minutesShort: 'min',
    hourlyRate: 'Taux horaire (optionnel)',
    expenseType: 'Type de frais',
    amount: 'Montant',
    currency: 'Devise',
    materialName: 'Nom du matériel / article',
    materialNamePh: 'ex. Panneau solaire 450W',
    quantity: 'Quantité',
    unit: 'Unité',
    unitPrice: 'Prix unitaire',
    description: 'Description (optionnel)',
    searchArticle: 'Rechercher un article (global)',
    searchArticlePh: 'Nom, SKU, catégorie…',
    noArticles: 'Aucun article ne correspond à votre recherche.',
    pickedArticle: 'Sélectionné',
    expenseTypes: {
      travel: 'Déplacement',
      per_diem: 'Indemnité journalière',
      materials: 'Matériel',
      subcontractor: 'Sous-traitance',
    },
    deleteAll: 'Tout supprimer',
    deletedToast: 'Entrée planifiée supprimée',
    deletedAllToast: 'Toutes les entrées planifiées ont été supprimées',
    confirmDeleteTitle: 'Supprimer l’entrée planifiée ?',
    confirmDeleteAllTitle: 'Supprimer toutes les entrées planifiées ?',
    confirmDeleteAll: 'Cela supprimera toutes les entrées planifiées de cette section. Cette action est irréversible.',
    fromOffer: 'depuis Offre',
    onJob: 'sur Intervention',
    openSource: 'Ouvrir la source',
    originOfferTooltip: 'Hérité de l’article de l’offre d’origine',
    originJobTooltip: 'Ajouté directement sur cette intervention',
    durationRequired: 'La durée planifiée doit être supérieure à 0 minute.',
    amountRequired: 'Le montant doit être supérieur à 0.',
    materialNameRequired: 'Veuillez choisir ou saisir un nom d’article.',
    quantityRequired: 'La quantité doit être supérieure à 0.',
    overrun: {
      onPlan: 'Conforme',
      nearLimit: 'Proche limite',
      overBudget: 'Dépassement',
      over: 'dépasse de',
    },
  },
};
// dispatches.planning.* — used by dispatch tab drilldown link tooltip.
i18n.addResourceBundle('en', 'translation', { dispatches: { planning: { openSource: 'Open on Service Order' } } }, true, true);
i18n.addResourceBundle('fr', 'translation', { dispatches: { planning: { openSource: 'Ouvrir dans l’ordre d’intervention' } } }, true, true);
i18n.addResourceBundle('en', 'translation', planningEn, true, true);
i18n.addResourceBundle('fr', 'translation', planningFr, true, true);
i18n.addResourceBundle('de', 'translation', planningEn, true, true);

// Register offers namespace so useTranslation('offers') resolves correctly
const offersNamespaceEn = { ...(offersEn as any || {}), ...(offersListEn as any || {}), ...(offersDetailEn as any || {}), ...(offersAddEn as any || {}) };
const offersNamespaceFr = { ...(offersFr as any || {}), ...(offersListFr as any || {}), ...(offersDetailFr as any || {}), ...(offersAddFr as any || {}) };
i18n.addResourceBundle('en', 'offers', offersNamespaceEn, true, true);
i18n.addResourceBundle('fr', 'offers', offersNamespaceFr, true, true);

// Register deals namespace so useTranslation('deals') resolves correctly
i18n.addResourceBundle('en', 'deals', dealsEn, true, true);
i18n.addResourceBundle('fr', 'deals', dealsFr, true, true);

// Register job-detail namespace separately so useTranslation('job-detail') resolves keys
i18n.addResourceBundle('en', 'job-detail', jobDetailEn, true, true);
i18n.addResourceBundle('fr', 'job-detail', jobDetailFr, true, true);
// Register dispatches module namespaces so per-component translations resolve
i18n.addResourceBundle('en', 'dispatches', dispatchesEn, true, true);
i18n.addResourceBundle('fr', 'dispatches', dispatchesFr, true, true);
i18n.addResourceBundle('en', 'attachments', attachmentsEn, true, true);
i18n.addResourceBundle('fr', 'attachments', attachmentsFr, true, true);
// Register time-expenses module namespaces
i18n.addResourceBundle('en', 'time-expenses', timeExpensesEn, true, true);
i18n.addResourceBundle('fr', 'time-expenses', timeExpensesFr, true, true);
i18n.addResourceBundle('en', 'notes', notesEn, true, true);
i18n.addResourceBundle('fr', 'notes', notesFr, true, true);
i18n.addResourceBundle('en', 'time-booking', timeBookingEn, true, true);
i18n.addResourceBundle('fr', 'time-booking', timeBookingFr, true, true);
i18n.addResourceBundle('en', 'technician', technicianEn, true, true);
i18n.addResourceBundle('fr', 'technician', technicianFr, true, true);
i18n.addResourceBundle('en', 'expense-booking', expenseBookingEn, true, true);
i18n.addResourceBundle('fr', 'expense-booking', expenseBookingFr, true, true);
// Dispatches 'common' namespace (module-scoped common translations)
i18n.addResourceBundle('en', 'common', dispatchCommonEn, true, true);
i18n.addResourceBundle('fr', 'common', dispatchCommonFr, true, true);
i18n.addResourceBundle('en', 'common', logsEn, true, true);
i18n.addResourceBundle('fr', 'common', logsFr, true, true);

// Register service orders namespace for proper translation resolution
// Both 'service_orders' (underscore) and 'serviceOrders' (camelCase) for compatibility
i18n.addResourceBundle('en', 'service_orders', serviceOrdersEn, true, true);
i18n.addResourceBundle('fr', 'service_orders', serviceOrdersFr, true, true);
i18n.addResourceBundle('en', 'serviceOrders', serviceOrdersEn, true, true);
i18n.addResourceBundle('fr', 'serviceOrders', serviceOrdersFr, true, true);

// Register articles namespace
// IMPORTANT: keep nested JSON here so dotted keys like "stats.total_articles" and
// "detail.copy_sku" resolve correctly with i18next's default keySeparator.
i18n.addResourceBundle('en', 'articles', articlesEn, true, true);
i18n.addResourceBundle('fr', 'articles', articlesFr, true, true);

// Register auth namespace for login/signup pages
i18n.addResourceBundle('en', 'auth', authEn, true, true);
i18n.addResourceBundle('fr', 'auth', authFr, true, true);

// Register inventory namespace for inventory-services module
// Legacy namespace (some components still use useTranslation('inventory'))
i18n.addResourceBundle('en', 'inventory', inventoryServicesEn, true, true);
i18n.addResourceBundle('fr', 'inventory', inventoryServicesFr, true, true);

// Preferred namespace used by the Inventory & Services module components
i18n.addResourceBundle('en', 'inventory-services', inventoryServicesEn, true, true);
i18n.addResourceBundle('fr', 'inventory-services', inventoryServicesFr, true, true);

// Register skills namespace (local module locales)
i18n.addResourceBundle('en', 'skills', skillsEn, true, true);
i18n.addResourceBundle('fr', 'skills', skillsFr, true, true);

// Register settings namespace with BOTH nested (for keySeparator '.' resolution)
// AND flattened keys (for exact flat-key match). This ensures translations resolve
// regardless of how i18next looks them up.
i18n.addResourceBundle('en', 'settings', settingsEn, true, true);
i18n.addResourceBundle('en', 'settings', flattenToDotted(settingsEn), true, true);
i18n.addResourceBundle('fr', 'settings', settingsFr, true, true);
i18n.addResourceBundle('fr', 'settings', flattenToDotted(settingsFr), true, true);

// Register dashboard namespace for proper translation resolution
i18n.addResourceBundle('en', 'dashboard', dashboardEn, true, true);
i18n.addResourceBundle('fr', 'dashboard', dashboardFr, true, true);

// Register purchases namespace
i18n.addResourceBundle('en', 'purchases', purchasesEn, true, true);
i18n.addResourceBundle('fr', 'purchases', purchasesFr, true, true);
i18n.addResourceBundle('ar', 'purchases', purchasesAr, true, true);

// Register traceability namespace
import traceabilityEn from '../modules/traceability/locale/en.json';
import traceabilityFr from '../modules/traceability/locale/fr.json';
i18n.addResourceBundle('en', 'traceability', traceabilityEn, true, true);
i18n.addResourceBundle('fr', 'traceability', traceabilityFr, true, true);


// Register external namespace
i18n.addResourceBundle('en', 'external', externalEn, true, true);
i18n.addResourceBundle('fr', 'external', externalFr, true, true);

// Register workflow namespace so useTranslation('workflow') resolves correctly
i18n.addResourceBundle('en', 'workflow', workflowEn, true, true);
i18n.addResourceBundle('fr', 'workflow', workflowFr, true, true);

// Register sales namespace for proper translation resolution
// Add BOTH nested and flattened to ensure translations resolve regardless of how i18next looks them up
const flattenedSalesEn = flattenToDotted(salesEn);
const flattenedSalesFr = flattenToDotted(salesFr);
i18n.addResourceBundle('en', 'sales', salesEn, true, true);
i18n.addResourceBundle('en', 'sales', flattenedSalesEn, true, true);
i18n.addResourceBundle('fr', 'sales', salesFr, true, true);
i18n.addResourceBundle('fr', 'sales', flattenedSalesFr, true, true);

// Register invoices namespace so useTranslation('invoices') resolves correctly
i18n.addResourceBundle('en', 'invoices', invoicesEn, true, true);
i18n.addResourceBundle('fr', 'invoices', invoicesFr, true, true);

// Register processes namespace (Administration > Processes page)
i18n.addResourceBundle('en', 'processes', processesEn, true, true);
i18n.addResourceBundle('fr', 'processes', processesFr, true, true);

// Register lookups namespace for proper translation resolution
i18n.addResourceBundle('en', 'lookups', lookupsEn, true, true);
i18n.addResourceBundle('fr', 'lookups', lookupsFr, true, true);

// Register tasks namespace for proper translation resolution
// Add BOTH nested and flattened to ensure translations resolve regardless of how i18next looks them up
i18n.addResourceBundle('en', 'tasks', tasksEn, true, true);
i18n.addResourceBundle('en', 'tasks', flattenToDotted(tasksEn), true, true);
i18n.addResourceBundle('fr', 'tasks', tasksFr, true, true);
i18n.addResourceBundle('fr', 'tasks', flattenToDotted(tasksFr), true, true);

// Register unsaved changes namespace for dialog translations
i18n.addResourceBundle('en', 'unsavedChanges', unsavedChangesEn, true, true);
i18n.addResourceBundle('fr', 'unsavedChanges', unsavedChangesFr, true, true);

// Register contacts namespace for proper translation resolution
// Add BOTH nested and flattened to ensure translations resolve regardless of how i18next looks them up
const flattenedContactsEn = flattenToDotted(contactsEn);
const flattenedContactsFr = flattenToDotted(contactsFr);
i18n.addResourceBundle('en', 'contacts', contactsEn, true, true);
i18n.addResourceBundle('en', 'contacts', flattenedContactsEn, true, true);
i18n.addResourceBundle('fr', 'contacts', contactsFr, true, true);
i18n.addResourceBundle('fr', 'contacts', flattenedContactsFr, true, true);

// Register users namespace for proper translation resolution
// Add BOTH nested and flattened to ensure translations resolve regardless of how i18next looks them up
const flattenedUsersEn = flattenToDotted(usersEn);
const flattenedUsersFr = flattenToDotted(usersFr);
i18n.addResourceBundle('en', 'users', usersEn, true, true);
i18n.addResourceBundle('en', 'users', flattenedUsersEn, true, true);
i18n.addResourceBundle('fr', 'users', usersFr, true, true);
i18n.addResourceBundle('fr', 'users', flattenedUsersFr, true, true);

// Register installations namespace for proper translation resolution
// Add BOTH nested and flattened to ensure translations resolve regardless of how i18next looks them up
const flattenedInstallationsEn = flattenToDotted(installationsEn);
const flattenedInstallationsFr = flattenToDotted(installationsFr);
i18n.addResourceBundle('en', 'installations', installationsEn, true, true);
i18n.addResourceBundle('en', 'installations', flattenedInstallationsEn, true, true);
i18n.addResourceBundle('fr', 'installations', installationsFr, true, true);
i18n.addResourceBundle('fr', 'installations', flattenedInstallationsFr, true, true);

// Register field namespace for proper translation resolution (reports, dispatches, etc.)
// Add BOTH nested and flattened to ensure translations resolve regardless of how i18next looks them up
const flattenedFieldEn = flattenToDotted((fieldEn as any).field || {});
const flattenedFieldFr = flattenToDotted((fieldFr as any).field || {});
i18n.addResourceBundle('en', 'field', (fieldEn as any).field || {}, true, true);
i18n.addResourceBundle('en', 'field', flattenedFieldEn, true, true);
i18n.addResourceBundle('fr', 'field', (fieldFr as any).field || {}, true, true);
i18n.addResourceBundle('fr', 'field', flattenedFieldFr, true, true);

// Register field_customers namespace for proper translation resolution
// Add BOTH nested and flattened to ensure translations resolve regardless of how i18next looks them up
const flattenedFieldCustomersEn = flattenToDotted(fieldCustomersEn);
const flattenedFieldCustomersFr = flattenToDotted(fieldCustomersFr);
i18n.addResourceBundle('en', 'field_customers', fieldCustomersEn, true, true);
i18n.addResourceBundle('en', 'field_customers', flattenedFieldCustomersEn, true, true);
i18n.addResourceBundle('fr', 'field_customers', fieldCustomersFr, true, true);
i18n.addResourceBundle('fr', 'field_customers', flattenedFieldCustomersFr, true, true);

// Register support namespace for proper translation resolution
const flattenedSupportEn = flattenToDotted(supportEn);
const flattenedSupportFr = flattenToDotted(supportFr);
i18n.addResourceBundle('en', 'support', flattenedSupportEn, true, true);
i18n.addResourceBundle('fr', 'support', flattenedSupportFr, true, true);

// Register onboarding namespace for proper translation resolution (product tour)
// NOTE: Do NOT flatten onboarding - the ProductTour component uses nested keys like t('tour.buttons.next')
i18n.addResourceBundle('en', 'onboarding', onboardingEn, true, true);
i18n.addResourceBundle('fr', 'onboarding', onboardingFr, true, true);

// Register testing namespace for proper translation resolution
const flattenedTestingEn = flattenToDotted(testingEn);
const flattenedTestingFr = flattenToDotted(testingFr);
i18n.addResourceBundle('en', 'testing', flattenedTestingEn, true, true);
i18n.addResourceBundle('fr', 'testing', flattenedTestingFr, true, true);

// Register auth namespace for proper translation resolution
const flattenedAuthEn = flattenToDotted(authEn);
const flattenedAuthFr = flattenToDotted(authFr);
i18n.addResourceBundle('en', 'auth', flattenedAuthEn, true, true);
i18n.addResourceBundle('fr', 'auth', flattenedAuthFr, true, true);

// Register dynamic-forms namespace for proper translation resolution
i18n.addResourceBundle('en', 'dynamic-forms', dynamicFormsEn, true, true);
i18n.addResourceBundle('fr', 'dynamic-forms', dynamicFormsFr, true, true);

// Register AI assistant namespace for proper translation resolution
i18n.addResourceBundle('en', 'aiAssistant', aiAssistantEn, true, true);
i18n.addResourceBundle('fr', 'aiAssistant', aiAssistantFr, true, true);

// Register notifications namespace for proper translation resolution
const flattenedNotificationsEn = flattenToDotted(notificationsEn);
const flattenedNotificationsFr = flattenToDotted(notificationsFr);
i18n.addResourceBundle('en', 'notifications', flattenedNotificationsEn, true, true);
i18n.addResourceBundle('fr', 'notifications', flattenedNotificationsFr, true, true);

// Register stock-management namespace for proper translation resolution
i18n.addResourceBundle('en', 'stock-management', stockManagementEn, true, true);
i18n.addResourceBundle('fr', 'stock-management', stockManagementFr, true, true);

// Register HR namespace
i18n.addResourceBundle('en', 'hr', hrEn, true, true);
i18n.addResourceBundle('fr', 'hr', hrFr, true, true);

// Register website-builder namespaces for proper translation resolution
import wbCommonEn from '../modules/website-builder/locale/en/common.json';
import wbCommonFr from '../modules/website-builder/locale/fr/common.json';
import wbManagerEn from '../modules/website-builder/locale/en/manager.json';
import wbManagerFr from '../modules/website-builder/locale/fr/manager.json';
import wbEditorEn from '../modules/website-builder/locale/en/editor.json';
import wbEditorFr from '../modules/website-builder/locale/fr/editor.json';
import wbPaletteEn from '../modules/website-builder/locale/en/palette.json';
import wbPaletteFr from '../modules/website-builder/locale/fr/palette.json';
import wbPropertiesEn from '../modules/website-builder/locale/en/properties.json';
import wbPropertiesFr from '../modules/website-builder/locale/fr/properties.json';
import wbThemeEn from '../modules/website-builder/locale/en/theme.json';
import wbThemeFr from '../modules/website-builder/locale/fr/theme.json';
import wbSeoEn from '../modules/website-builder/locale/en/seo.json';
import wbSeoFr from '../modules/website-builder/locale/fr/seo.json';
import wbPublishEn from '../modules/website-builder/locale/en/publish.json';
import wbPublishFr from '../modules/website-builder/locale/fr/publish.json';
import wbShareEn from '../modules/website-builder/locale/en/share.json';
import wbShareFr from '../modules/website-builder/locale/fr/share.json';
import wbDeployEn from '../modules/website-builder/locale/en/deploy.json';
import wbDeployFr from '../modules/website-builder/locale/fr/deploy.json';
import wbExportOptionsEn from '../modules/website-builder/locale/en/exportOptions.json';
import wbExportOptionsFr from '../modules/website-builder/locale/fr/exportOptions.json';
import wbExportProgressEn from '../modules/website-builder/locale/en/exportProgress.json';
import wbExportProgressFr from '../modules/website-builder/locale/fr/exportProgress.json';
import wbTemplatesEn from '../modules/website-builder/locale/en/templates.json';
import wbTemplatesFr from '../modules/website-builder/locale/fr/templates.json';
import wbAddPageEn from '../modules/website-builder/locale/en/addPage.json';
import wbAddPageFr from '../modules/website-builder/locale/fr/addPage.json';
import wbValidationEn from '../modules/website-builder/locale/en/validation.json';
import wbValidationFr from '../modules/website-builder/locale/fr/validation.json';
import wbGlobalBlocksEn from '../modules/website-builder/locale/en/globalBlocks.json';
import wbGlobalBlocksFr from '../modules/website-builder/locale/fr/globalBlocks.json';
import wbBrandsEn from '../modules/website-builder/locale/en/brands.json';
import wbBrandsFr from '../modules/website-builder/locale/fr/brands.json';
import wbSubmissionsEn from '../modules/website-builder/locale/en/submissions.json';
import wbSubmissionsFr from '../modules/website-builder/locale/fr/submissions.json';
import wbVersionsEn from '../modules/website-builder/locale/en/versions.json';
import wbVersionsFr from '../modules/website-builder/locale/fr/versions.json';
import wbAnimationEn from '../modules/website-builder/locale/en/animation.json';
import wbAnimationFr from '../modules/website-builder/locale/fr/animation.json';
import wbFormSettingsEn from '../modules/website-builder/locale/en/formSettings.json';
import wbFormSettingsFr from '../modules/website-builder/locale/fr/formSettings.json';
import wbDimensionsEn from '../modules/website-builder/locale/en/dimensions.json';
import wbDimensionsFr from '../modules/website-builder/locale/fr/dimensions.json';
import wbErrorsEn from '../modules/website-builder/locale/en/errors.json';
import wbErrorsFr from '../modules/website-builder/locale/fr/errors.json';
import wbBlocksEn from '../modules/website-builder/locale/en/blocks.json';
import wbBlocksFr from '../modules/website-builder/locale/fr/blocks.json';

// Merge all WB sub-namespaces into a single 'wb' namespace
const wbEn = {
  common: wbCommonEn, manager: wbManagerEn, editor: wbEditorEn, palette: wbPaletteEn,
  properties: wbPropertiesEn, theme: wbThemeEn, seo: wbSeoEn, publish: wbPublishEn,
  share: wbShareEn, deploy: wbDeployEn, exportOptions: wbExportOptionsEn,
  exportProgress: wbExportProgressEn, templates: wbTemplatesEn, addPage: wbAddPageEn,
  validation: wbValidationEn, globalBlocks: wbGlobalBlocksEn, brands: wbBrandsEn,
  submissions: wbSubmissionsEn, versions: wbVersionsEn, animation: wbAnimationEn,
  formSettings: wbFormSettingsEn, dimensions: wbDimensionsEn, errors: wbErrorsEn,
  ...wbBlocksEn,
};
const wbFr = {
  common: wbCommonFr, manager: wbManagerFr, editor: wbEditorFr, palette: wbPaletteFr,
  properties: wbPropertiesFr, theme: wbThemeFr, seo: wbSeoFr, publish: wbPublishFr,
  share: wbShareFr, deploy: wbDeployFr, exportOptions: wbExportOptionsFr,
  exportProgress: wbExportProgressFr, templates: wbTemplatesFr, addPage: wbAddPageFr,
  validation: wbValidationFr, globalBlocks: wbGlobalBlocksFr, brands: wbBrandsFr,
  submissions: wbSubmissionsFr, versions: wbVersionsFr, animation: wbAnimationFr,
  formSettings: wbFormSettingsFr, dimensions: wbDimensionsFr, errors: wbErrorsFr,
  ...wbBlocksFr,
};
i18n.addResourceBundle('en', 'wb', wbEn, true, true);
i18n.addResourceBundle('fr', 'wb', wbFr, true, true);

// Register email-calendar namespace for email & calendar integration module
import emailCalendarEn from '../modules/email-calendar/locale/en.json';
import emailCalendarFr from '../modules/email-calendar/locale/fr.json';
const flattenedEmailCalendarEn = flattenToDotted(emailCalendarEn);
const flattenedEmailCalendarFr = flattenToDotted(emailCalendarFr);
i18n.addResourceBundle('en', 'email-calendar', flattenedEmailCalendarEn, true, true);
i18n.addResourceBundle('fr', 'email-calendar', flattenedEmailCalendarFr, true, true);

// Register calendar namespace for the unified calendar module
import calendarEn from '../modules/calendar/locale/en.json';
import calendarFr from '../modules/calendar/locale/fr.json';
const flattenedCalendarEn = flattenToDotted(calendarEn);
const flattenedCalendarFr = flattenToDotted(calendarFr);
i18n.addResourceBundle('en', 'calendar', flattenedCalendarEn, true, true);
i18n.addResourceBundle('fr', 'calendar', flattenedCalendarFr, true, true);

// Register reporting namespace
const flattenedReportingEn = flattenToDotted(reportingEn);
const flattenedReportingFr = flattenToDotted(reportingFr);
i18n.addResourceBundle('en', 'reporting', flattenedReportingEn, true, true);
i18n.addResourceBundle('fr', 'reporting', flattenedReportingFr, true, true);

// Register suppliers namespace for proper translation resolution
// Add BOTH nested and flattened to ensure translations resolve regardless of how i18next looks them up
const flattenedSuppliersEn = flattenToDotted(suppliersEn);
const flattenedSuppliersFr = flattenToDotted(suppliersFr);
i18n.addResourceBundle('en', 'suppliers', suppliersEn, true, true);
i18n.addResourceBundle('en', 'suppliers', flattenedSuppliersEn, true, true);
i18n.addResourceBundle('fr', 'suppliers', suppliersFr, true, true);
i18n.addResourceBundle('fr', 'suppliers', flattenedSuppliersFr, true, true);

export default i18n;
// ─────────────────────────────────────────────────────────────────────────────
// Plugin manifest namespaces (auto-registered)
// ─────────────────────────────────────────────────────────────────────────────
// Plugin manifests reference i18n keys like "<moduleKey>:plugin.name". To keep
// sidebar labels and the Settings → Plugins page localized (EN/FR), we
// auto-register every src/modules/<module>/locale/{en,fr}.json under a
// namespace matching the module folder name. Existing explicitly-registered
// namespaces (offers, contacts, etc.) are preserved — addResourceBundle with
// deep+overwrite merges instead of replacing.
{
  const pluginLocales = import.meta.glob('../modules/*/locale/{en,fr}.json', {
    eager: true,
  }) as Record<string, { default: any }>;
  for (const [path, mod] of Object.entries(pluginLocales)) {
    // path looks like "../modules/contacts/locale/en.json"
    const m = path.match(/\.\.\/modules\/([^/]+)\/locale\/(en|fr)\.json$/);
    if (!m) continue;
    const [, moduleKey, lang] = m;
    try {
      i18n.addResourceBundle(lang, moduleKey, mod.default ?? {}, true, false);
    } catch {
      /* non-fatal — keep app booting */
    }
  }
}
