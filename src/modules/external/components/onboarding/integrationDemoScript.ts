// Integration Hub autopilot demo — 7 chapters, 44 steps.

export type DemoPhase = 'hub' | 'create-connection' | 'success';

export interface DemoConnectorGroup {
  connectorId: string;
  connectorName: string;
  logo: string;
  color: string;
  endpointCount: number;
  totalReceived: number;
  totalSent: number;
}

export interface IntegrationDemoState {
  phase: DemoPhase;
  activeTab: 'connections' | 'webhooks';
  catalogCategory: string;
  catalogSearch: string;
  highlightedConnector: string | null;
  connectorGroups: DemoConnectorGroup[];
  selectedConnectorId: string | null;
  selectedEntities: string[];
  showInstructions: boolean;
  showSuccess: boolean;
  createdEndpointName: string;
  // Formats & multi-company chapter
  showEndpointDetail: boolean;
  highlightedLogFormat: string | null;
  activeCompanyFilter: string;
  showContentTypeConfig: boolean;
  showTestModal: boolean;
  testModalContentType: string;
}

export const initialDemoState: IntegrationDemoState = {
  phase: 'hub',
  activeTab: 'connections',
  catalogCategory: 'all',
  catalogSearch: '',
  highlightedConnector: null,
  connectorGroups: [],
  selectedConnectorId: null,
  selectedEntities: [],
  showInstructions: false,
  showSuccess: false,
  createdEndpointName: '',
  showEndpointDetail: false,
  highlightedLogFormat: null,
  activeCompanyFilter: '',
  showContentTypeConfig: false,
  showTestModal: false,
  testModalContentType: 'application/json',
};

export interface DemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: IntegrationDemoState) => IntegrationDemoState;
}

export interface DemoChapter {
  id: string;
  title: string;
  start: number;
  end: number;
}

const pure = (apply: (s: IntegrationDemoState) => Partial<IntegrationDemoState>) =>
  (s: IntegrationDemoState): IntegrationDemoState => ({ ...s, ...apply(s) });

export const INT_STEPS: DemoStep[] = [
  // ── Chapter 1 · Introduction ─────────────────────────────────────────────
  {
    target: 'demo-hub-title',
    caption: 'Welcome to the Integration Hub — your command centre for connecting Flowentra to any ERP, CRM, e-commerce platform, or automation tool.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-stat-connections',
    caption: 'The stats bar shows how many active connector integrations, total webhook endpoints, and events received today are running in your account.',
    duration: 4500,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-tab-connections',
    caption: 'The Connections tab is where you browse the pre-built connector catalog and set up integrations with a few clicks — no code required.',
    duration: 4200,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-tab-webhooks',
    caption: 'The Webhooks tab gives you raw, fully customisable HTTP endpoints for sources that are not yet in the catalog.',
    duration: 3800,
    apply: pure(() => ({ activeTab: 'webhooks' as const })),
  },
  {
    target: 'demo-tab-connections',
    caption: 'Let us head back to Connections and explore the catalog.',
    duration: 2500,
    apply: pure(() => ({ activeTab: 'connections' as const })),
  },

  // ── Chapter 2 · Browse the catalog ───────────────────────────────────────
  {
    target: 'demo-catalog-search',
    caption: 'The search bar lets you find any integration instantly — try typing a vendor name, product name, or category keyword.',
    duration: 4000,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-cat-erp',
    caption: 'Category filters let you narrow the catalog to ERP systems, CRM tools, e-commerce platforms, and more.',
    duration: 3800,
    apply: pure(() => ({ catalogCategory: 'erp' })),
  },
  {
    target: 'demo-connector-microsoft-dynamics-bc',
    caption: 'Microsoft Dynamics 365 Business Central syncs sales orders, customers, and purchase invoices in real time via API subscriptions.',
    duration: 4800,
    apply: pure(() => ({ highlightedConnector: 'microsoft-dynamics-bc' })),
  },
  {
    target: 'demo-connector-sap-b1',
    caption: 'SAP Business One targets small-to-mid enterprises. This connector receives orders, deliveries, and business partner updates via the SAP Service Layer event framework.',
    duration: 5200,
    apply: pure(() => ({ highlightedConnector: 'sap-b1' })),
  },
  {
    target: 'demo-connector-odoo',
    caption: 'Odoo\'s open-source ERP pushes sale orders, contacts, and inventory events through its Automated Actions webhook system — no extra middleware needed.',
    duration: 5000,
    apply: pure(() => ({ highlightedConnector: 'odoo' })),
  },
  {
    target: 'demo-cat-crm',
    caption: 'Switching to the CRM category — Salesforce and HubSpot let you push deals, contacts, and pipeline data straight into Flowentra offers.',
    duration: 4200,
    apply: pure(() => ({ catalogCategory: 'crm', highlightedConnector: null })),
  },
  {
    target: 'demo-cat-ecommerce',
    caption: 'E-commerce connectors for WooCommerce and Shopify automatically turn new online orders into Flowentra sales records — zero manual entry.',
    duration: 4500,
    apply: pure(() => ({ catalogCategory: 'ecommerce' })),
  },
  {
    target: 'demo-cat-automation',
    caption: 'Automation platform connectors — Zapier, Make, and n8n — let you chain Flowentra webhooks to thousands of other apps without writing a single line of code.',
    duration: 5000,
    apply: pure(() => ({ catalogCategory: 'automation' })),
  },
  {
    target: 'demo-cat-all',
    caption: 'Let us go back to the full catalog and walk through connecting an ERP step by step.',
    duration: 3000,
    apply: pure(() => ({ catalogCategory: 'all', highlightedConnector: null })),
  },

  // ── Chapter 3 · Connect ERP wizard ───────────────────────────────────────
  {
    target: 'demo-connector-sap-b1',
    caption: 'Clicking Connect on SAP Business One opens the setup wizard — it previews exactly what will be created before you commit anything.',
    duration: 4500,
    apply: pure(() => ({ highlightedConnector: 'sap-b1', selectedConnectorId: 'sap-b1', phase: 'create-connection' as const })),
  },
  {
    target: 'demo-wizard-title',
    caption: 'The wizard title confirms the connector. Below it you can read a concise description of what this integration does.',
    duration: 3800,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-entity-sales_orders',
    caption: 'Sales Orders is already pre-selected — it creates a dedicated webhook endpoint that fires every time an order is created or updated in SAP.',
    duration: 4500,
    apply: pure(() => ({ selectedEntities: ['sales_orders'] })),
  },
  {
    target: 'demo-entity-business_partners',
    caption: 'Adding Business Partners means Flowentra also receives customer create and update events, automatically populating your Contacts module.',
    duration: 4500,
    apply: pure(() => ({ selectedEntities: ['sales_orders', 'business_partners'] })),
  },
  {
    target: 'demo-entity-purchase_orders',
    caption: 'Purchase Orders closes the loop: every supplier order in SAP flows directly into Flowentra\'s Purchases module.',
    duration: 4200,
    apply: pure(() => ({ selectedEntities: ['sales_orders', 'business_partners', 'purchase_orders'] })),
  },
  {
    target: 'demo-will-create',
    caption: 'The "What will be created" panel lists the exact webhook endpoints Flowentra is about to generate — one per selected entity.',
    duration: 4000,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-instructions-toggle',
    caption: 'The Setup Instructions section gives you a numbered guide for configuring the outbound webhook on the ERP side.',
    duration: 4200,
    apply: pure(() => ({ showInstructions: true })),
  },
  {
    target: 'demo-instruction-1',
    caption: 'Step one: open the ERP Webhook Manager and create a new outbound webhook pointing at Flowentra.',
    duration: 3500,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-instruction-2',
    caption: 'Step two: paste the Flowentra endpoint URL and set the X-API-Key header to authenticate incoming events.',
    duration: 4000,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-create-btn',
    caption: 'When you are ready, clicking Create Integration generates all endpoints in one go and shows the success screen.',
    duration: 4000,
    apply: pure(() => ({ showSuccess: true, createdEndpointName: 'ERP — Sales Orders', phase: 'success' as const })),
  },

  // ── Chapter 4 · Success & back to hub ────────────────────────────────────
  {
    target: 'demo-success-title',
    caption: 'Integration created! Flowentra confirms how many endpoints were generated and which connector owns them.',
    duration: 4000,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-success-endpoints',
    caption: 'Each endpoint card shows its name and a link to the detail page where you can copy the public URL and API key.',
    duration: 4500,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-success-api-hint',
    caption: 'The API key hint reminds you to add the X-API-Key header in your external system so Flowentra can authenticate the incoming events.',
    duration: 4500,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-back-hub',
    caption: 'Returning to the hub, the Active Connections section now shows the connector with three live endpoints and a green checkmark.',
    duration: 4000,
    apply: pure(() => ({
      phase: 'hub' as const,
      showSuccess: false,
      selectedConnectorId: null,
      connectorGroups: [
        { connectorId: 'sap-b1', connectorName: 'SAP Business One', logo: '🔵', color: '#0070F3', endpointCount: 3, totalReceived: 47, totalSent: 0 },
      ],
    })),
  },
  {
    target: 'demo-active-sap-b1',
    caption: 'The connection card summarises all active webhooks, total events received, and gives a quick-manage button.',
    duration: 4500,
    apply: pure(() => ({})),
  },

  // ── Chapter 5 · Webhooks tab ──────────────────────────────────────────────
  {
    target: 'demo-tab-webhooks',
    caption: 'The Webhooks tab is your power-user area. Every endpoint — whether from a connector or created manually — appears here.',
    duration: 4200,
    apply: pure(() => ({ activeTab: 'webhooks' as const })),
  },
  {
    target: 'demo-webhooks-desc',
    caption: 'Custom inbound endpoints let you receive data from any HTTP-capable source: contact forms, IoT devices, custom scripts, and more.',
    duration: 4500,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-create-endpoint-btn',
    caption: 'The Create Endpoint button opens a form where you can define the URL slug, allowed HTTP methods, expected schema, and accepted content types.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-webhook-table',
    caption: 'The table lists every endpoint. Let us open one to explore its incoming request log — including XML payloads and multi-company traffic.',
    duration: 4800,
    apply: pure(() => ({})),
  },

  // ── Chapter 6 · Formats & Multi-Company Routing ───────────────────────────
  {
    target: 'demo-logs-header',
    caption: 'The Received Requests log captures every inbound call with method, status, format, and which company sent it.',
    duration: 4200,
    apply: pure(() => ({ showEndpointDetail: true })),
  },
  {
    target: 'demo-log-xml',
    caption: 'Flowentra natively accepts JSON, XML, and form-urlencoded payloads. XML logs are highlighted in orange so your team can spot them at a glance.',
    duration: 5000,
    apply: pure(() => ({ highlightedLogFormat: 'xml' })),
  },
  {
    target: 'demo-log-json',
    caption: 'JSON logs appear in blue, and form-urlencoded in purple. The raw body is preserved exactly as received — nothing is lost or transformed in storage.',
    duration: 4800,
    apply: pure(() => ({ highlightedLogFormat: 'json' })),
  },
  {
    target: 'demo-log-company-col',
    caption: 'The Company column reads the X-Company-ID request header — or the ?company_id= query parameter as a fallback. One endpoint can serve many ERP tenants simultaneously.',
    duration: 5500,
    apply: pure(() => ({ highlightedLogFormat: null })),
  },
  {
    target: 'demo-company-filter',
    caption: 'The company filter dropdown instantly isolates logs from a specific company — perfect when several subsidiaries all post to the same endpoint.',
    duration: 4800,
    apply: pure(() => ({ activeCompanyFilter: 'company-001' })),
  },
  {
    target: 'demo-content-type-config',
    caption: 'In the endpoint settings, Accepted Content Types controls which formats are allowed. Leave it on "Accept any" for maximum compatibility, or restrict to XML-only for strict ERP enforcement.',
    duration: 5500,
    apply: pure(() => ({ activeCompanyFilter: '', showContentTypeConfig: true })),
  },
  {
    target: 'demo-test-modal-ct',
    caption: 'The built-in test tool has a Content-Type selector. Pick JSON, XML, or form-urlencoded — the body textarea auto-fills with a sample payload built from the endpoint\'s expected schema.',
    duration: 5200,
    apply: pure(() => ({ showTestModal: true, testModalContentType: 'application/xml' })),
  },
  {
    target: 'demo-test-modal-body',
    caption: 'Hit Send and the test fires a real HTTP request to the public URL with your API key. The response appears immediately, so you can verify format acceptance before going live.',
    duration: 5000,
    apply: pure(() => ({})),
  },

  // ── Chapter 7 · Wrap-up ───────────────────────────────────────────────────
  {
    target: 'demo-hub-title',
    caption: 'That is the full Integration Hub tour. Pre-built connectors for ERPs and CRMs, custom webhooks for everything else, XML and multi-company support built in.',
    duration: 5500,
    apply: pure(() => ({
      activeTab: 'connections' as const,
      showEndpointDetail: false,
      showContentTypeConfig: false,
      showTestModal: false,
      highlightedLogFormat: null,
      activeCompanyFilter: '',
    })),
  },
  {
    target: 'demo-stat-connections',
    caption: 'Every connection flows data directly into your Flowentra modules — Contacts, Offers, Sales, and Purchases — automatically and in real time.',
    duration: 5500,
    apply: pure(() => ({})),
  },
  {
    target: 'demo-cat-all',
    caption: 'Now it is your turn. Pick a connector, follow the wizard, and your first integration will be live in under two minutes.',
    duration: 5000,
    apply: pure(() => ({})),
  },
];

export const INT_CHAPTERS: DemoChapter[] = [
  { id: 'intro',    title: 'Introduction',      start: 0,  end: 5  },
  { id: 'catalog',  title: 'Catalog',            start: 5,  end: 14 },
  { id: 'wizard',   title: 'Connect ERP',        start: 14, end: 24 },
  { id: 'success',  title: 'Live Setup',         start: 24, end: 29 },
  { id: 'webhooks', title: 'Webhooks',           start: 29, end: 33 },
  { id: 'formats',  title: 'Formats & Routing',  start: 33, end: 41 },
  { id: 'wrapup',   title: 'Wrap-up',            start: 41, end: INT_STEPS.length },
];
