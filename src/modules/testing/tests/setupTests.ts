/**
 * Setup & Authentication Tests
 * Bootstrap tests that run first to prepare the test environment
 */

import { TestDefinition } from '../types/testTypes';
import { API_URL, testSessionCredentials, testDataIds, getAuthHeaders, apiCall } from '../utils/testUtils';

// API call tracker for detailed logging
interface ApiCallLog {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  response: {
    status: number;
    statusText: string;
    body?: any;
  };
  curl: string;
  duration: number;
}

// Generate curl command from request data (with masked sensitive data)
const generateCurl = (method: string, url: string, headers: Record<string, string>, body?: any): string => {
  // Mask the URL
  const maskedUrl = url.replace(/https?:\/\/[^\/]+/gi, 'https://******.onrender.com');
  let curl = `curl -X ${method} '${maskedUrl}'`;
  for (const [key, value] of Object.entries(headers)) {
    if (key !== 'Content-Type' || method !== 'GET') {
      // Mask Authorization header
      if (key.toLowerCase() === 'authorization') {
        curl += ` \\\n  -H '${key}: Bearer ****...'`;
      } else {
        curl += ` \\\n  -H '${key}: ${value}'`;
      }
    }
  }
  if (body) {
    curl += ` \\\n  -d '${JSON.stringify(body)}'`;
  }
  return curl;
};

// Tracked fetch wrapper
const trackedFetch = async (
  url: string, 
  options: RequestInit, 
  logs: ApiCallLog[]
): Promise<Response> => {
  const start = performance.now();
  const method = options.method || 'GET';
  const headers = options.headers as Record<string, string> || {};
  let body: any = undefined;
  if (options.body && typeof options.body === 'string') {
    try { body = JSON.parse(options.body); } catch { body = options.body; }
  }
  
  const response = await fetch(url, options);
  const duration = Math.round(performance.now() - start);
  
  let responseBody: any = null;
  const responseClone = response.clone();
  try {
    const text = await responseClone.text();
    if (text) {
      try { responseBody = JSON.parse(text); } catch { responseBody = text; }
    }
  } catch {}
  
  logs.push({
    method,
    url,
    headers,
    body,
    response: {
      status: response.status,
      statusText: response.statusText,
      body: responseBody,
    },
    curl: generateCurl(method, url, headers, body),
    duration,
  });
  
  return response;
};

// Cleanup function to remove old test data
const cleanupTestData = async (): Promise<{ deleted: string[]; errors: string[]; requestData: any; responseData: any }> => {
  const deleted: string[] = [];
  const errors: string[] = [];
  const apiLogs: ApiCallLog[] = [];
  const token = testSessionCredentials.token || localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Clean up test installations FIRST (they depend on contacts)
  try {
    const installRes = await trackedFetch(`${API_URL}/api/Installations?pageSize=100`, { headers }, apiLogs);
    if (installRes.ok) {
      const installData = await installRes.json();
      const installations = installData.installations || installData.data || installData.items || (Array.isArray(installData) ? installData : []);
      for (const inst of installations) {
        const name = inst.installationType || inst.name || inst.notes || '';
        // Match test installations by type or notes containing test patterns
        if (name.match(/^(HVAC|Solar|Security|TestInstall_|Install_|apitest_|test_|Updated)/i) ||
            inst.notes?.match(/(HVAC_System_|Solar_Panels_|Security_System_|test)/i)) {
          const delRes = await trackedFetch(`${API_URL}/api/Installations/${inst.id}`, { method: 'DELETE', headers }, apiLogs);
          if (delRes.ok || delRes.status === 204) deleted.push(`Installation: ${name || inst.id}`);
        }
      }
    }
  } catch (e) { errors.push(`Installations cleanup: ${e}`); }

  // Clean up test skills
  try {
    const skillsRes = await trackedFetch(`${API_URL}/api/Skills`, { headers }, apiLogs);
    if (skillsRes.ok) {
      const skillsData = await skillsRes.json();
      const skills = Array.isArray(skillsData) ? skillsData : (skillsData.data || skillsData.items || []);
      for (const skill of skills) {
        // Match all test skill patterns
        if (skill.name?.match(/^(HVAC_|TestSkill_|apitest_|test_|Electrical_|Communication_|Networking_|AdvancedElectrical_)/i)) {
          const delRes = await trackedFetch(`${API_URL}/api/Skills/${skill.id}`, { method: 'DELETE', headers }, apiLogs);
          if (delRes.ok || delRes.status === 204) deleted.push(`Skill: ${skill.name}`);
        }
      }
    }
  } catch (e) { errors.push(`Skills cleanup: ${e}`); }

  // Clean up test roles
  try {
    const rolesRes = await trackedFetch(`${API_URL}/api/Roles`, { headers }, apiLogs);
    if (rolesRes.ok) {
      const rolesData = await rolesRes.json();
      const roles = Array.isArray(rolesData) ? rolesData : (rolesData.data || rolesData.items || []);
      for (const role of roles) {
        // Match all test role patterns
        if (role.name?.match(/^(Test|apitest_|test_|Admin_|Technician_|Dispatcher_|SuperAdmin_)/i)) {
          const delRes = await trackedFetch(`${API_URL}/api/Roles/${role.id}`, { method: 'DELETE', headers }, apiLogs);
          if (delRes.ok || delRes.status === 204) deleted.push(`Role: ${role.name}`);
        }
      }
    }
  } catch (e) { errors.push(`Roles cleanup: ${e}`); }

  // Clean up test contacts (both persons and companies)
  try {
    const contactsRes = await trackedFetch(`${API_URL}/api/Contacts?pageSize=100`, { headers }, apiLogs);
    if (contactsRes.ok) {
      const contactsData = await contactsRes.json();
      const contacts = contactsData.contacts || contactsData.data || contactsData.items || [];
      for (const contact of contacts) {
        const email = contact.email || '';
        const firstName = contact.firstName || '';
        const company = contact.company || '';
        const name = contact.name || '';
        // Match test contacts - persons (individual) and companies
        if (email.includes('@test.flowservice.com') || 
            email.includes('@test.com') ||
            email.includes('person_') ||
            email.includes('company_') ||
            email.includes('contact_') ||
            email.includes('install') ||
            email.includes('notes_') ||
            firstName.match(/^(apitest_|test_|Install|Updated|Emma|James|Maria|Notes|GlobalTech|CloudSoft|SmartBuild)/i) ||
            name.match(/^(GlobalTech|CloudSoft|SmartBuild|TestContact_|Install|Customer)/i) ||
            company.match(/^(GlobalTech|CloudSoft|SmartBuild|Alpha|Beta|Gamma)/i)) {
          const delRes = await trackedFetch(`${API_URL}/api/Contacts/${contact.id}`, { method: 'DELETE', headers }, apiLogs);
          if (delRes.ok || delRes.status === 204) deleted.push(`Contact: ${email || name || firstName}`);
        }
      }
    }
  } catch (e) { errors.push(`Contacts cleanup: ${e}`); }

  // Clean up test articles (materials and services)
  try {
    const articlesRes = await trackedFetch(`${API_URL}/api/Articles?pageSize=100`, { headers }, apiLogs);
    if (articlesRes.ok) {
      const articlesData = await articlesRes.json();
      const articles = Array.isArray(articlesData) ? articlesData : (articlesData.data || articlesData.items || []);
      for (const article of articles) {
        // Match test articles - materials (CopperWire, PVCPipe, HVACFilter) and services
        if (article.name?.match(/^(Test|apitest_|test_|Updated|CopperWire|PVCPipe|HVACFilter|InstallService|MaintenanceService|EmergencyRepair)/i) || 
            article.articleNumber?.match(/^(MAT-|SRV-|ART-|SKU_|TEST)/i)) {
          const delRes = await trackedFetch(`${API_URL}/api/Articles/${article.id}`, { method: 'DELETE', headers }, apiLogs);
          if (delRes.ok || delRes.status === 204) deleted.push(`Article: ${article.name}`);
        }
      }
    }
  } catch (e) { errors.push(`Articles cleanup: ${e}`); }

  // Clean up test projects
  try {
    const projectsRes = await trackedFetch(`${API_URL}/api/Projects?pageSize=100`, { headers }, apiLogs);
    if (projectsRes.ok) {
      const projectsData = await projectsRes.json();
      const projects = projectsData.projects || projectsData.data || projectsData.items || [];
      for (const project of projects) {
        // Match all test projects - WebsiteRedesign, MobileApp, CRMIntegration, TaskTestProject
        if (project.name?.match(/^(Test|apitest_|test_|TaskTest|Project_|Website|MobileApp|CRMIntegration|Updated)/i)) {
          const delRes = await trackedFetch(`${API_URL}/api/Projects/${project.id}`, { method: 'DELETE', headers }, apiLogs);
          if (delRes.ok || delRes.status === 204) deleted.push(`Project: ${project.name}`);
        }
      }
    }
  } catch (e) { errors.push(`Projects cleanup: ${e}`); }

  // Clean up test contact tags
  try {
    const tagsRes = await trackedFetch(`${API_URL}/api/ContactTags`, { headers }, apiLogs);
    if (tagsRes.ok) {
      const tagsData = await tagsRes.json();
      const tags = tagsData.tags || tagsData.data || (Array.isArray(tagsData) ? tagsData : []);
      for (const tag of tags) {
        if (tag.name?.match(/^(VIP_|Urgent_|Followup_|Priority_|Important_|Updated|Test)/i)) {
          const delRes = await trackedFetch(`${API_URL}/api/ContactTags/${tag.id}`, { method: 'DELETE', headers }, apiLogs);
          if (delRes.ok || delRes.status === 204) deleted.push(`Tag: ${tag.name}`);
        }
      }
    }
  } catch (e) { errors.push(`Contact tags cleanup: ${e}`); }

  // Clean up test lookup items (priorities, statuses, etc.)
  const lookupTypes = ['priorities', 'task-statuses', 'project-statuses', 'event-types', 'article-categories', 'service-categories'];
  for (const lookupType of lookupTypes) {
    try {
      const lookupRes = await trackedFetch(`${API_URL}/api/Lookups/${lookupType}`, { headers }, apiLogs);
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json();
        const items = lookupData.items || lookupData.data || (Array.isArray(lookupData) ? lookupData : []);
        for (const item of items) {
          // Match all test lookup items
          if (item.name?.match(/^(Test|Updated|apitest_|Priority_|Status_|Event_|Category_)/i)) {
            const delRes = await trackedFetch(`${API_URL}/api/Lookups/${lookupType}/${item.id}`, { method: 'DELETE', headers }, apiLogs);
            if (delRes.ok || delRes.status === 204) deleted.push(`Lookup(${lookupType}): ${item.name}`);
          }
        }
      }
    } catch (e) { errors.push(`${lookupType} cleanup: ${e}`); }
  }

  // Build curl commands summary
  const curlCommands = apiLogs.map((log, i) => 
    `# Request ${i + 1}: ${log.method} (${log.duration}ms) -> ${log.response.status}\n${log.curl}`
  ).join('\n\n');

  return { 
    deleted, 
    errors,
    requestData: { 
      method: 'BATCH', 
      url: `${apiLogs.length} API calls executed`,
      headers,
      body: {
        totalCalls: apiLogs.length,
        curlCommands,
        calls: apiLogs.map(log => ({
          method: log.method,
          url: log.url,
          duration: `${log.duration}ms`,
          status: log.response.status,
        })),
      }
    },
    responseData: { 
      status: 200, 
      statusText: 'Cleanup Complete',
      body: {
        deletedCount: deleted.length,
        deletedItems: deleted,
        errors,
        apiCallDetails: apiLogs.map(log => ({
          request: { method: log.method, url: log.url, body: log.body },
          response: log.response,
          curl: log.curl,
          duration: `${log.duration}ms`,
        })),
      }
    }
  };
};

const formatSize = (bytes: number): string => `${(bytes / 1024).toFixed(2)} KB`;

export const setupTests: TestDefinition[] = [
  // 1. Check backend health first (no auth needed)
  {
    id: 'setup-check-backend',
    name: 'Check Backend & Database',
    category: 'Setup',
    description: 'Verify backend is healthy and database is connected',
    test: async () => {
      try {
        const healthUrl = `${API_URL}/health`;
        const healthResponse = await fetch(healthUrl);
        const healthText = await healthResponse.text();
        let healthData: any = {};
        try { healthData = JSON.parse(healthText); } catch {}
        
        if (!healthResponse.ok) {
          return {
            success: false,
            error: `Backend health failed: HTTP ${healthResponse.status}. Server may be starting.`,
            httpStatus: healthResponse.status,
            requestData: { method: 'GET', url: healthUrl, headers: {} },
            responseData: { status: healthResponse.status, statusText: healthResponse.statusText, body: healthData },
          };
        }
        
        const dbUrl = `${API_URL}/api/Auth/test-db`;
        const dbTestResponse = await fetch(dbUrl);
        const dbTestText = await dbTestResponse.text();
        let dbData: any = {};
        try { dbData = JSON.parse(dbTestText); } catch {}
        
        if (!dbTestResponse.ok || dbData.databaseConnected === false) {
          return {
            success: false,
            error: `DB Error: ${dbData.error || dbData.message || 'Connection failed'}`,
            httpStatus: dbTestResponse.status,
            responseSize: formatSize(new Blob([dbTestText]).size),
            requestData: { method: 'GET', url: dbUrl, headers: {} },
            responseData: { status: dbTestResponse.status, statusText: dbTestResponse.statusText, body: dbData },
          };
        }
        
        return { 
          success: true, 
          details: `API: ${healthData.status || 'healthy'} | DB: ${dbData.databaseConnected ? 'Connected' : 'Unknown'}`, 
          httpStatus: 200,
          responseSize: formatSize(new Blob([dbTestText]).size),
          requestData: { method: 'GET', url: dbUrl, headers: {} },
          responseData: { status: dbTestResponse.status, statusText: dbTestResponse.statusText, body: dbData },
        };
      } catch (error) {
        return {
          success: false,
          error: `Backend unreachable: ${error}. Cold start may take ~30s.`,
          httpStatus: 503
        };
      }
    },
  },
  // 2. Check if already authenticated
  {
    id: 'setup-check-existing-auth',
    name: 'Check Existing Authentication',
    category: 'Setup',
    description: 'Check if user is already logged in with valid token',
    dependsOn: ['setup-check-backend'],
    test: async () => {
      const existingToken = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${existingToken}` };
      
      if (existingToken) {
        const statusUrl = `${API_URL}/api/Auth/status`;
        const verifyResponse = await fetch(statusUrl, { headers });
        
        if (verifyResponse.ok) {
          testSessionCredentials.token = existingToken;
          
          const meUrl = `${API_URL}/api/Auth/me`;
          const meResponse = await fetch(meUrl, { headers });
          const meText = await meResponse.text();
          let meData: any = {};
          try { meData = JSON.parse(meText); } catch {}
          
          if (meResponse.ok && meData) {
            const userId = meData.id || meData.userId || meData.user?.id;
            if (userId) {
              testSessionCredentials.userId = userId;
            }
            const userName = meData.firstName ? `${meData.firstName} ${meData.lastName}` : meData.email;
            return { 
              success: true, 
              details: `✓ Logged in as: ${userName} (ID: ${userId || 'N/A'})`, 
              httpStatus: 200,
              responseSize: formatSize(new Blob([meText]).size),
              requestData: { method: 'GET', url: meUrl, headers },
              responseData: { status: meResponse.status, statusText: meResponse.statusText, body: meData },
            };
          }
          
          return { 
            success: true, 
            details: '✓ Using existing session', 
            httpStatus: 200,
            requestData: { method: 'GET', url: statusUrl, headers },
            responseData: { status: verifyResponse.status, statusText: verifyResponse.statusText, body: {} },
          };
        }
      }
      
      return { 
        success: true, 
        details: 'No existing session - will create test user',
        httpStatus: 200,
        requestData: { method: 'N/A', url: 'No API call - checking localStorage', headers: {} },
        responseData: { status: 200, statusText: 'OK', body: { hasToken: !!existingToken } },
      };
    },
  },
  // 3. Create or login test user
  {
    id: 'setup-create-test-user',
    name: 'Create or Login Test User',
    category: 'Setup',
    description: 'Create a new test user or login with existing credentials',
    dependsOn: ['setup-check-existing-auth'],
    test: async () => {
      if (testSessionCredentials.token) {
        return { 
          success: true, 
          details: 'Skipped - using existing session', 
          httpStatus: 200,
          requestData: { method: 'N/A', url: 'Skipped - already authenticated', headers: {} },
          responseData: { status: 200, statusText: 'OK', body: { skipped: true } },
        };
      }
      
      const testUser = {
        email: `flowtest_${Math.random().toString(36).substring(7)}@flowservice.test`,
        password: 'FlowTest!@#2024Secure',
        firstName: 'Flow',
        lastName: 'TestUser',
        phoneNumber: '+1555000' + Math.floor(1000 + Math.random() * 9000),
        country: 'US',
        industry: 'Technology',
        companyName: 'FlowService Test',
      };

      const signupUrl = `${API_URL}/api/Auth/test-signup`;
      const signupHeaders = { 'Content-Type': 'application/json' };
      const diagResponse = await fetch(signupUrl, {
        method: 'POST',
        headers: signupHeaders,
        body: JSON.stringify(testUser),
      });
      
      const diagText = await diagResponse.text();
      let diagData: any = null;
      try { diagData = JSON.parse(diagText); } catch {}
      
      // Extract token from various possible response structures
      const extractToken = (data: any): string | null => {
        if (!data) return null;
        return data.accessToken || data.token || data.access_token || 
               data.data?.accessToken || data.data?.token || 
               data.result?.accessToken || data.result?.token || null;
      };
      
      const signupToken = extractToken(diagData);
      
      if (diagResponse.ok && signupToken) {
        testSessionCredentials.token = signupToken;
        testSessionCredentials.userId = diagData.user?.id || diagData.data?.user?.id || diagData.userId || 0;
        testSessionCredentials.email = testUser.email;
        testSessionCredentials.password = testUser.password;
        localStorage.setItem('access_token', signupToken);
        const refreshToken = diagData.refreshToken || diagData.refresh_token || diagData.data?.refreshToken;
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        
        const meResponse = await fetch(`${API_URL}/api/Auth/me`, {
          headers: { 'Authorization': `Bearer ${signupToken}` },
        });
        if (meResponse.ok) {
          const meData = await meResponse.json();
          testSessionCredentials.userId = meData.id || meData.userId || testSessionCredentials.userId;
        }
        
        return { 
          success: true, 
          details: `✓ Created & logged in: ${testUser.firstName} ${testUser.lastName}`, 
          httpStatus: diagResponse.status,
          requestData: { method: 'POST', url: signupUrl, headers: signupHeaders, body: testUser },
          responseData: { status: diagResponse.status, statusText: diagResponse.statusText, body: diagData },
        };
      }
      
      // If signup succeeded but no token, try to login with the new credentials
      if (diagResponse.ok && (diagData?.success || diagData?.message?.toLowerCase().includes('success') || diagData?.message?.toLowerCase().includes('created'))) {
        // Account was created, now login
        const loginAfterSignupUrl = `${API_URL}/api/Auth/login`;
        const loginAfterSignupResponse = await fetch(loginAfterSignupUrl, {
          method: 'POST',
          headers: signupHeaders,
          body: JSON.stringify({ email: testUser.email, password: testUser.password }),
        });
        const loginAfterSignupText = await loginAfterSignupResponse.text();
        let loginAfterSignupData: any = null;
        try { loginAfterSignupData = JSON.parse(loginAfterSignupText); } catch {}
        
        const loginToken = extractToken(loginAfterSignupData);
        if (loginAfterSignupResponse.ok && loginToken) {
          testSessionCredentials.token = loginToken;
          testSessionCredentials.userId = loginAfterSignupData.user?.id || loginAfterSignupData.userId || 0;
          testSessionCredentials.email = testUser.email;
          testSessionCredentials.password = testUser.password;
          localStorage.setItem('access_token', loginToken);
          
          return { 
            success: true, 
            details: `✓ Created & logged in: ${testUser.firstName} ${testUser.lastName}`, 
            httpStatus: loginAfterSignupResponse.status,
            requestData: { method: 'POST', url: loginAfterSignupUrl, headers: signupHeaders, body: { email: testUser.email, password: '***' } },
            responseData: { status: loginAfterSignupResponse.status, statusText: loginAfterSignupResponse.statusText, body: loginAfterSignupData },
          };
        }
      }
      
      const loginUrl = `${API_URL}/api/Auth/login`;
      const fixedUser = { email: 'testadmin@flowservice.com', password: 'TestAdmin!@#2024' };
      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: signupHeaders,
        body: JSON.stringify(fixedUser),
      });
      
      const loginText = await loginResponse.text();
      let loginData: any = null;
      try { loginData = JSON.parse(loginText); } catch {}
      
      const fallbackToken = extractToken(loginData);
      if (loginResponse.ok && fallbackToken) {
        testSessionCredentials.token = fallbackToken;
        testSessionCredentials.userId = loginData.user?.id || loginData.userId || 0;
        testSessionCredentials.email = fixedUser.email;
        testSessionCredentials.password = fixedUser.password;
        localStorage.setItem('access_token', fallbackToken);
        return { 
          success: true, 
          details: `✓ Logged in: ${loginData.user?.firstName || 'Test'} ${loginData.user?.lastName || 'Admin'}`, 
          httpStatus: loginResponse.status,
          requestData: { method: 'POST', url: loginUrl, headers: signupHeaders, body: fixedUser },
          responseData: { status: loginResponse.status, statusText: loginResponse.statusText, body: loginData },
        };
      }
      
      return { 
        success: false,
        error: `Auth failed: ${diagData?.message || loginData?.message || 'Unknown error'}`,
        httpStatus: loginResponse.status,
        requestData: { method: 'POST', url: loginUrl, headers: signupHeaders, body: fixedUser },
        responseData: { status: loginResponse.status, statusText: loginResponse.statusText, body: loginData || diagData },
      };
    },
  },
  // 4. Verify authentication is ready
  {
    id: 'setup-verify-auth',
    name: 'Verify Authentication Ready',
    category: 'Setup',
    description: 'Confirm token is valid for API testing',
    dependsOn: ['setup-create-test-user'],
    test: async () => {
      if (!testSessionCredentials.token) {
        return { success: false, error: '⚠️ Authentication setup failed.' };
      }
      
      const meUrl = `${API_URL}/api/Auth/me`;
      const headers = { 
        'Authorization': `Bearer ${testSessionCredentials.token}`,
        'Content-Type': 'application/json',
      };
      const response = await fetch(meUrl, { headers });
      
      const text = await response.text();
      const responseSize = formatSize(new Blob([text]).size);
      let data: any = {};
      try { data = JSON.parse(text); } catch {}
      
      if (response.ok) {
        const email = data.email || data.user?.email || 'Unknown';
        const name = data.firstName ? `${data.firstName} ${data.lastName}` : email;
        return { 
          success: true, 
          details: `✓ Auth ready: ${name}`, 
          httpStatus: response.status, 
          responseSize,
          requestData: { method: 'GET', url: meUrl, headers },
          responseData: { status: response.status, statusText: response.statusText, body: data },
        };
      }
      
      return { 
        success: false, 
        error: `Auth verification failed (${response.status})`, 
        httpStatus: response.status, 
        responseSize,
        requestData: { method: 'GET', url: meUrl, headers },
        responseData: { status: response.status, statusText: response.statusText, body: data },
      };
    },
  },
  // 5. CLEANUP - NOW RUNS AFTER AUTH IS ESTABLISHED
  {
    id: 'setup-cleanup-old-data',
    name: 'Cleanup Old Test Data',
    category: 'Setup',
    description: 'Remove leftover test data from previous runs (after auth)',
    dependsOn: ['setup-verify-auth'],
    test: async () => {
      try {
        const { deleted, errors, requestData, responseData } = await cleanupTestData();
        const details = deleted.length > 0 
          ? `Cleaned up ${deleted.length} items: ${deleted.slice(0, 10).join(', ')}${deleted.length > 10 ? '...' : ''}`
          : 'No old test data found';
        return { 
          success: true, 
          details: errors.length > 0 ? `${details} (${errors.length} errors)` : details,
          httpStatus: 200,
          requestData,
          responseData
        };
      } catch (error) {
        return { success: true, details: `Cleanup skipped: ${error}`, httpStatus: 200 };
      }
    },
  },
];

export const systemHealthTests: TestDefinition[] = [
  {
    id: 'health-api',
    name: 'API Health Check',
    category: 'System Health',
    description: 'Basic API connectivity test',
    test: async () => {
      const start = performance.now();
      const url = `${API_URL}/health`;
      const response = await fetch(url);
      const duration = Math.round(performance.now() - start);
      const text = await response.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}
      
      const requestData = { method: 'GET', url, headers: {} };
      const responseData = { status: response.status, statusText: response.statusText, body: data };
      
      if (response.ok) {
        return { success: true, details: `API healthy (${duration}ms) - ${data.status || 'ok'}`, httpStatus: response.status, requestData, responseData };
      }
      return { success: false, error: `API unhealthy: ${response.status}`, httpStatus: response.status, requestData, responseData };
    },
  },
  {
    id: 'health-db',
    name: 'Database Connectivity Check',
    category: 'System Health',
    description: 'Verify database connection is active',
    test: async () => {
      const start = performance.now();
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Skills');
      const duration = Math.round(performance.now() - start);
      
      if (status === 200) {
        const skills = data?.skills || data?.data || (Array.isArray(data) ? data : []);
        return { success: true, details: `DB connected (${duration}ms) - ${skills.length} skills found`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `DB check failed: ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'health-latency',
    name: 'API Latency Test',
    category: 'System Health',
    description: 'Measure average API response time',
    test: async () => {
      const endpoints = ['/health', '/api/Auth/status', '/api/Skills'];
      const times: number[] = [];
      const requests: any[] = [];
      
      for (const endpoint of endpoints) {
        const start = performance.now();
        const url = `${API_URL}${endpoint}`;
        const response = await fetch(url, { headers: getAuthHeaders() });
        times.push(performance.now() - start);
        requests.push({ method: 'GET', url, status: response.status });
      }
      
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const rating = avg < 500 ? 'Excellent' : avg < 1000 ? 'Good' : avg < 2000 ? 'Fair' : 'Poor';
      return { 
        success: true, 
        details: `Avg latency: ${avg}ms (${rating})`,
        requestData: { method: 'BATCH', url: 'Multiple endpoints', requests },
        responseData: { status: 200, statusText: 'OK', body: { endpoints, times, avg, rating } }
      };
    },
  },
];

export const authTests: TestDefinition[] = [
  {
    id: 'auth-status',
    name: 'Check Authentication Status',
    category: 'Authentication',
    description: 'Verify user authentication token is valid',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      const { status, error, responseSize, requestData, responseData } = await apiCall('/api/Auth/status');
      if (status === 200) {
        return { success: true, details: 'Authentication valid', httpStatus: status, responseSize, requestData, responseData };
      }
      if (status === 401) {
        return { success: false, error: 'Not authenticated', httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'auth-me',
    name: 'Get Current User Profile',
    category: 'Authentication',
    description: 'Retrieve current authenticated user details',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Auth/me');
      if (status === 200 && data) {
        const email = data.email || data.user?.email || 'N/A';
        const name = data.firstName ? `${data.firstName} ${data.lastName}` : email;
        return { success: true, details: `User: ${name} (${email})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
];
