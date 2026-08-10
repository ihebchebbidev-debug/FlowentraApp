import type { ModuleGuideMap } from "../types";

/**
 * Guides for modules that sit outside the five main audit groups:
 * service-orders (field work orders), signatures, sync and plugins.
 */
export const SYSTEM_EXTRA_GUIDES: ModuleGuideMap = {
  "service-orders": {
    key: "service-orders",
    purpose:
      "Service Orders are the bridge between a sold job and the work actually performed on site. One order groups the jobs to be done, the dispatches that assign technicians to a date and time, the hours and expenses booked against it, the materials consumed, checklists, photos and a full activity log. Its status is driven mostly by what happens in the field rather than by manual editing, and when the work is technically complete the order becomes the basis for invoicing.",
    workflows: [
      {
        name: "From sale to service order",
        steps: [
          "A confirmed sale that contains service lines produces (or is linked to) a service order.",
          "The order opens in Pending with the customer, address and ordered work copied over.",
          "Split the work into jobs — each job is one deliverable task at the site.",
          "Set priority and required skills so the dispatcher can match the right technician.",
        ],
      },
      {
        name: "Planning and dispatching",
        steps: [
          "Move the order to Ready for Planning so it appears in the dispatcher board.",
          "Create a dispatch per technician and time window; the order flips to Scheduled.",
          "Technicians see the dispatch in the field app with address, route and job checklist.",
          "When the first technician starts, the order moves to In Progress automatically.",
        ],
      },
      {
        name: "Execution and completion",
        steps: [
          "Technicians log time and expenses, consume materials from stock, tick checklists and attach photos or signatures.",
          "Completing all jobs sets Technically Completed; completing only some sets Partially Completed.",
          "Review the order, correct any time or material lines, then mark it Ready for Invoice.",
          "Invoice it from Finance — the order becomes Invoiced and finally Closed.",
        ],
      },
      {
        name: "Handling interruptions",
        steps: [
          "Put the order On Hold when it is blocked (missing part, customer absent).",
          "Add a note explaining the block — it lands in the activity log with your name and timestamp.",
          "Resume by scheduling a new dispatch; the order returns to Scheduled / In Progress.",
          "Cancel only if the work will never be performed — cancelled orders are terminal.",
        ],
      },
    ],
    rules: [
      {
        title: "Status cascades from dispatch progress",
        detail:
          "The order status is derived from its dispatches and jobs: any started dispatch → In Progress, all jobs done → Technically Completed, some jobs done → Partially Completed. Editing the status by hand is possible but the next field event will re-derive it.",
      },
      {
        title: "Only a valid transition is accepted",
        detail:
          "Transitions follow the documented graph (Pending → Ready for Planning → Scheduled → In Progress → Technically/Partially Completed → Ready for Invoice → Invoiced → Closed). Closed and Cancelled are terminal; jumping backwards from a terminal state is rejected.",
      },
      {
        title: "Material usage moves real stock",
        detail:
          "Booking materials on a service order creates outbound stock movements against the technician's warehouse or van, so the inventory ledger and the order cost stay in sync.",
      },
      {
        title: "Cost and revenue are computed, not typed",
        detail:
          "Order value is the sum of job lines, billable time entries and billable materials; non-billable entries still add to cost, which is what the margin shown on the order is based on.",
      },
      {
        title: "Map view needs coordinates",
        detail:
          "Orders only appear as pins when the customer address has been geocoded. Addresses without coordinates are still listed in the card list below the map.",
      },
    ],
    statuses: [
      { name: "pending", meaning: "Created, not yet released for planning." },
      { name: "ready_for_planning", meaning: "Released — visible to the dispatcher." },
      { name: "planned", meaning: "At least one dispatch has a date and a technician." },
      { name: "in_progress", meaning: "A technician has started work on site." },
      { name: "on_hold", meaning: "Blocked; needs a decision before it can continue." },
      { name: "partially_completed", meaning: "Some jobs done, others still open." },
      { name: "technically_completed", meaning: "All work finished; awaiting administrative review." },
      { name: "ready_for_invoice", meaning: "Reviewed and released to Finance." },
      { name: "invoiced", meaning: "An invoice exists for this order." },
      { name: "closed", meaning: "Terminal — invoiced and archived." },
      { name: "cancelled", meaning: "Terminal — the work will not be performed." },
    ],
    integrations: [
      "Sales — a confirmed sale with service lines is the usual origin of an order, and the order links back to it.",
      "Dispatcher & Scheduling — dispatches created here drive the planning board and the technician calendar.",
      "Field app — technicians read jobs and write time, materials, checklists, photos and signatures back to the order.",
      "Stock management — consumed materials generate outbound movements from the assigned warehouse or van.",
      "Invoices — Ready for Invoice orders are the source for service invoicing.",
      "Documents & E-Signatures — the work report and customer sign-off are stored on the order.",
    ],
    gotchas: [
      "Deleting an order with booked time or materials is blocked; cancel it instead so the history is kept.",
      "Bulk delete only removes orders that are still in a non-terminal, non-invoiced state.",
      "CSV export follows the currently visible columns and active filters, not the full data set.",
    ],
    sources: [
      "src/modules/field/**",
      "src/modules/dispatcher/**",
      "Backend/Modules/Field/**",
    ],
  },

  signatures: {
    key: "signatures",
    purpose:
      "E-Signatures turn any generated PDF — an offer, a contract, a delivery note or an HR document — into a signable document. You place fields on the page, name the signers, and the system sends each of them a private link to a branded public page where they can sign without an account. Every view, signature and decline is recorded, and the finished PDF carries an audit certificate proving who signed what and when.",
    workflows: [
      {
        name: "Send a document for signature",
        steps: [
          "Open the document (offer, contract, HR file) and choose Request signature.",
          "Add signers with name and email, and set the order — sequential or parallel.",
          "Drag signature, initials, date and text fields onto the PDF and assign each field to a signer.",
          "Send — each signer receives a link containing a unique token.",
        ],
      },
      {
        name: "Signing as an external party",
        steps: [
          "The signer opens /sign/:token — no login is required.",
          "They review the document; opening it marks the request as Viewed.",
          "They complete their assigned fields and draw or type a signature.",
          "On submit the signature is stored with timestamp, IP and a hash of the document.",
        ],
      },
      {
        name: "Chasing and closing a request",
        steps: [
          "Track per-signer status on the requests page: Sent, Viewed, Signed, Declined, Expired.",
          "Send a manual nudge, or let the reminder schedule do it automatically.",
          "When the last signer signs, the signed PDF plus the audit certificate is attached to the source record.",
          "If a signer declines, the request stops and their reason is recorded.",
        ],
      },
      {
        name: "Reusing a layout",
        steps: [
          "Save a document with its field placement as a template.",
          "Pick the template next time and only the signer names need to change.",
        ],
      },
    ],
    rules: [
      {
        title: "The token is the authorisation",
        detail:
          "The public signing page authenticates purely by the token in the URL, so tokens are single-purpose, tied to one signer, and stop working once the request is signed, declined or expired.",
      },
      {
        title: "Sequential order is enforced",
        detail:
          "With sequential signing, signer N+1 is only invited after signer N has signed. Their link is not valid before their turn.",
      },
      {
        title: "Every field assigned to a signer is required",
        detail:
          "A signer cannot submit until all fields assigned to them are filled; fields belonging to other signers are visible but read-only.",
      },
      {
        title: "The document is frozen once sent",
        detail:
          "After a request is sent the underlying PDF cannot be edited. Changing the content means cancelling the request and starting a new one, which keeps the hash in the audit trail meaningful.",
      },
      {
        title: "An audit certificate is always appended",
        detail:
          "The completed PDF gets an extra page listing each signer, their email, IP, view and sign timestamps and the document hash chain.",
      },
    ],
    statuses: [
      { name: "draft", meaning: "Fields being placed; nothing sent yet." },
      { name: "sent", meaning: "Invitations delivered, waiting for the first action." },
      { name: "viewed", meaning: "At least one signer opened the document." },
      { name: "signed", meaning: "All signers completed — final PDF available." },
      { name: "declined", meaning: "A signer refused; the request is stopped." },
      { name: "expired", meaning: "The deadline passed before everyone signed." },
    ],
    integrations: [
      "Offers and Sales — customer approval of a quote can be captured as a signature.",
      "Field / Service Orders — customer sign-off on the work report.",
      "HR — contracts and policy acknowledgements sent to employees.",
      "Documents — the signed PDF and certificate are filed against the source record.",
      "Notifications — status changes can trigger a webhook or in-app notification.",
    ],
    gotchas: [
      "Signature links are sent by email, so the tenant needs working outbound mail configured in Settings.",
      "A declined request cannot be reopened — duplicate it and send again.",
      "Very large PDFs render slowly on mobile signing pages.",
    ],
    sources: ["src/modules/signatures/**", "src/modules/documents/**"],
  },

  sync: {
    key: "sync",
    purpose:
      "Offline Sync lets technicians keep working when the network drops. Selected modules are cached in the browser's IndexedDB so lists and detail pages still open, and anything you create, edit or delete is queued locally. When the connection returns, a service worker replays the queue in order, retries failures with backoff, and surfaces anything that conflicts with server-side changes for you to resolve.",
    workflows: [
      {
        name: "Prepare a device for offline use",
        steps: [
          "Open Settings → Sync and choose which modules to hydrate offline.",
          "Trigger a hydration while online; the storage gauge shows how much space is used.",
          "Verify the last-sync timestamp before heading out of coverage.",
        ],
      },
      {
        name: "Working offline",
        steps: [
          "The top bar shows an amber offline pill with the current queue size.",
          "Cached data stays readable; new reads that were never cached fail gracefully.",
          "Each create, update or delete is written to the mutation queue with an idempotency key.",
        ],
      },
      {
        name: "Coming back online",
        steps: [
          "The service worker detects the connection and replays queued mutations in the order they were made.",
          "Failed attempts are retried with exponential backoff and logged with HTTP status and duration.",
          "Anything the server rejected as conflicting is moved to the conflict list instead of being dropped.",
        ],
      },
      {
        name: "Resolving a conflict",
        steps: [
          "Open Settings → Sync → Conflicts to see a side-by-side diff of local and server values.",
          "Choose keep-mine or keep-theirs per field, or discard the local change entirely.",
          "Apply — the resolved record is pushed and removed from the queue.",
        ],
      },
    ],
    rules: [
      {
        title: "Queue order is preserved",
        detail:
          "Mutations replay strictly in the order they were captured, so a create followed by an update to the same record cannot arrive out of sequence.",
      },
      {
        title: "Idempotency keys prevent duplicates",
        detail:
          "Every queued mutation carries a key. If a request actually reached the server before the connection dropped, the retry is recognised and does not create a second record.",
      },
      {
        title: "Retries back off, then stop",
        detail:
          "Failures are retried with increasing delays. After the retry budget is exhausted the entry stays in the queue as failed and needs a manual retry or discard — it is never silently deleted.",
      },
      {
        title: "The configured policy decides conflicts",
        detail:
          "Server-wins and client-wins resolve automatically; the prompt policy parks the record in the conflict viewer until a human chooses.",
      },
      {
        title: "Force resync wipes local data first",
        detail:
          "Rehydrating a module clears its cached copy before downloading, so anything still queued must be flushed first or it will be reported as unsent.",
      },
    ],
    statuses: [
      { name: "queued", meaning: "Captured locally, waiting for a connection." },
      { name: "syncing", meaning: "Currently being replayed to the server." },
      { name: "failed", meaning: "Retry budget exhausted; needs manual action." },
      { name: "conflict", meaning: "Server data changed underneath the local edit." },
      { name: "synced", meaning: "Accepted by the server and removed from the queue." },
    ],
    integrations: [
      "Field app — the main consumer; time, materials and checklists are queued offline.",
      "Service Orders — cached order and job data is what technicians read on site.",
      "Notifications — background sync can push a completion notice when the queue drains.",
    ],
    gotchas: [
      "Browser storage is per-device and per-browser; clearing site data discards the queue.",
      "Offline mode depends on a registered service worker, so it does not work in private windows in some browsers.",
      "Caching many modules on a low-end phone can hit storage quotas — hydrate only what the role needs.",
    ],
    sources: ["src/modules/sync/**", "src/modules/field/**"],
  },

  plugins: {
    key: "plugins",
    purpose:
      "Plugins decide which modules exist for a tenant. Turning a plugin off removes its sidebar entries and blocks its routes and API calls, so this screen is effectively the shape of the product each customer sees. Core plugins that the application cannot run without are locked on, and dependencies between plugins are checked so you cannot enable something whose prerequisites are missing.",
    workflows: [
      {
        name: "Enable a module for a tenant",
        steps: [
          "Open Settings → Plugins and find the plugin in its category.",
          "Toggle it on — any missing dependency is listed and offered for automatic activation.",
          "Confirm; the sidebar refreshes immediately for every open session of the tenant.",
          "Open the plugin's settings deep-link to finish its configuration.",
        ],
      },
      {
        name: "Disable a module",
        steps: [
          "Toggle the plugin off; plugins that others depend on warn you first.",
          "Its menu entries disappear and its routes start returning a no-access page.",
          "Data is not deleted — re-enabling restores the module with its records intact.",
        ],
      },
      {
        name: "Roll out a whole category",
        steps: [
          "Select all plugins in a category and use bulk activate.",
          "Dependencies outside the category are pulled in automatically.",
          "Review the audit log afterwards to confirm exactly what was switched on and by whom.",
        ],
      },
    ],
    rules: [
      {
        title: "Core plugins cannot be disabled",
        detail:
          "System, Settings, Auth and Dashboard are marked core; their toggle is locked because the application cannot boot without them.",
      },
      {
        title: "Dependencies are enforced both ways",
        detail:
          "A plugin cannot be enabled while a prerequisite is off (Sales requires Contacts), and disabling a prerequisite warns about every dependent plugin that would break.",
      },
      {
        title: "Activation is enforced on the server",
        detail:
          "Hiding the menu item is only cosmetic — the backend rejects API calls for inactive plugins, so typing the URL directly does not bypass the restriction.",
      },
      {
        title: "Plan gating overrides the toggle",
        detail:
          "Plugins above the tenant's plan show an upgrade call-to-action instead of a switch and cannot be activated from this screen.",
      },
      {
        title: "Every change is audited and broadcast",
        detail:
          "Each activation or deactivation is written to the audit log with user and timestamp, and a broadcast refreshes the sidebar in all open sessions.",
      },
    ],
    statuses: [
      { name: "core", meaning: "Always on; the toggle is locked." },
      { name: "active", meaning: "Enabled for this tenant." },
      { name: "inactive", meaning: "Disabled — routes blocked, data retained." },
      { name: "beta", meaning: "Available but flagged; enabling asks for confirmation." },
      { name: "plan-locked", meaning: "Requires a higher plan before it can be enabled." },
    ],
    integrations: [
      "Sidebar navigation — the menu is generated from the active plugin list.",
      "Roles & permissions — a route needs both an active plugin and a matching permission.",
      "Settings — each plugin can expose its own configuration page linked from its row.",
      "System audit log — records who changed which plugin and when.",
    ],
    gotchas: [
      "A user reporting a missing screen is usually hitting an inactive plugin rather than a permission problem — check here first.",
      "Disabling a plugin does not remove its scheduled jobs or webhooks; review those separately.",
    ],
    sources: ["src/modules/settings/**", "src/modules/system/**"],
  },
};
