import { useMemo, useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, Book, X, Maximize2, ChevronLeft, ChevronRight,
  User, Building2, Lock, SlidersHorizontal, Database, Building,
  Users as UsersIcon, ShieldCheck, Plug, CreditCard, Cog, RefreshCw,
  FileText, MousePointerClick, FormInput, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type Field = { name: string; type?: string; description: string; required?: boolean };
type Action = { label: string; description: string };
type Modal = { name: string; trigger: string; fields?: Field[]; actions?: Action[]; notes?: string };
type Screenshot = { src: string; caption: string };
type Section = {
  key: string;
  group: "Personal" | "Administration";
  name: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  fields?: Field[];
  actions?: Action[];
  modals?: Modal[];
  notes?: string[];
  screenshots: Screenshot[];
};

const SECTIONS: Section[] = [
  {
    key: "profile",
    group: "Personal",
    name: "Profile",
    route: "/dashboard/settings",
    icon: User,
    summary: "Personal identity card. Edit your avatar, display name, contact details and timezone.",
    fields: [
      { name: "Avatar", type: "image", description: "Click to upload a square photo (PNG/JPG, < 2 MB). Used in the top bar and audit logs." },
      { name: "First name", type: "text", description: "Shown across the app and in generated PDFs.", required: true },
      { name: "Last name", type: "text", description: "Combined with first name in the user pickers.", required: true },
      { name: "Email", type: "email", description: "Used for sign-in. Changing it triggers a verification email.", required: true },
      { name: "Phone", type: "tel", description: "Optional phone number, surfaced in contact cards." },
      { name: "Job title", type: "text", description: "Free-text role label (e.g. CTO, Account Manager)." },
      { name: "Language", type: "select", description: "EN / FR — overrides the org default." },
      { name: "Timezone", type: "select", description: "Used for all relative timestamps shown to you." },
    ],
    actions: [
      { label: "Save changes", description: "Persists profile fields and re-broadcasts the user record to all open tabs." },
      { label: "Cancel", description: "Discards unsaved field edits." },
    ],
    screenshots: [{ src: "/docs-screenshots/settings-01-profile.png", caption: "Profile section — avatar, identity & contact" }],
  },
  {
    key: "company",
    group: "Personal",
    name: "Company",
    route: "/dashboard/settings",
    icon: Building2,
    summary: "Branding & identity of the currently scoped company (logo, name, website, contact).",
    fields: [
      { name: "Company logo", type: "image", description: "Square logo used on PDFs, the sidebar, and the login screen." },
      { name: "Company name", type: "text", description: "Legal or trade name. Appears in invoices and emails.", required: true },
      { name: "Website", type: "url", description: "Public URL — rendered as a link in the contact card." },
      { name: "Phone", type: "tel", description: "Main switchboard number." },
      { name: "Industry", type: "select", description: "Used by analytics segmentation." },
      { name: "Default currency", type: "select", description: "Currency seeded into new offers / sales / purchases." },
    ],
    screenshots: [{ src: "/docs-screenshots/settings-02-company.png", caption: "Company branding & identity" }],
  },
  {
    key: "security",
    group: "Personal",
    name: "Security",
    route: "/dashboard/settings",
    icon: Lock,
    summary: "Change your password and manage active sessions.",
    fields: [
      { name: "Current password", type: "password", description: "Required to authorize a password change.", required: true },
      { name: "New password", type: "password", description: "Min 8 chars. Strength meter displayed inline.", required: true },
      { name: "Confirm new password", type: "password", description: "Must match the new password.", required: true },
    ],
    actions: [
      { label: "Update password", description: "Re-authenticates and rotates the JWT. Other sessions are invalidated." },
    ],
    screenshots: [{ src: "/docs-screenshots/settings-03-security.png", caption: "Password change form" }],
  },
  {
    key: "preferences",
    group: "Personal",
    name: "Preferences",
    route: "/dashboard/settings",
    icon: SlidersHorizontal,
    summary: "Personal UI preferences: theme, accent color, layout density.",
    fields: [
      { name: "Theme", type: "radio", description: "Light · Dark · System (follows OS)." },
      { name: "Primary color", type: "color-swatch", description: "Choose an accent. Updates CSS variables live without reload." },
      { name: "Layout style", type: "radio", description: "Compact · Comfortable — drives spacing tokens." },
      { name: "Sidebar collapsed", type: "toggle", description: "Persisted per device in localStorage." },
    ],
    screenshots: [{ src: "/docs-screenshots/settings-04-preferences-top.png", caption: "Theme, accent color & layout density" }],
  },
  {
    key: "offline-data",
    group: "Personal",
    name: "Offline data",
    route: "/dashboard/settings",
    icon: Database,
    summary: "Pick which modules are cached locally for offline use; see last refresh timestamp.",
    fields: [
      { name: "Per-module toggles", type: "checkbox-list", description: "Contacts, Articles, Offers, Sales, Service Orders, HR — each toggleable." },
      { name: "Last cache refresh", type: "readonly", description: "Timestamp of the last successful background hydration." },
    ],
    actions: [
      { label: "Refresh now", description: "Forces a re-pull of the selected datasets into IndexedDB." },
      { label: "Clear cache", description: "Drops the local store; next online load will rehydrate." },
    ],
    screenshots: [{ src: "/docs-screenshots/settings-05-offline-data.png", caption: "Per-module offline cache toggles" }],
  },
  {
    key: "companies",
    group: "Administration",
    name: "Companies",
    route: "/dashboard/settings",
    icon: Building,
    summary: "Multi-tenant company manager. Pin a default company; create additional companies in this tenant.",
    actions: [
      { label: "Pin company", description: "Marks the company as the default 'Target Company' on next login." },
      { label: "+ New company", description: "Opens the New Company modal." },
      { label: "Edit", description: "Inline edit name, website, currency, branding." },
      { label: "Delete", description: "Soft-deletes the company; data is retained for 30 days." },
    ],
    modals: [
      {
        name: "New Company",
        trigger: "+ New company button",
        fields: [
          { name: "Company name", type: "text", description: "Required.", required: true },
          { name: "Legal name", type: "text", description: "Used on invoices when different from trade name." },
          { name: "Tax ID", type: "text", description: "Matricule Fiscale (TN) or VAT (EU)." },
          { name: "Country", type: "select", description: "Drives default tax rules and currency." },
          { name: "Default currency", type: "select", description: "Pre-fills offers/sales currency." },
          { name: "Logo", type: "image", description: "Optional, uploaded immediately." },
        ],
        actions: [
          { label: "Create", description: "Persists the company and switches the Target Company picker to it." },
          { label: "Cancel", description: "Closes the modal without saving." },
        ],
      },
    ],
    screenshots: [
      { src: "/docs-screenshots/settings-06-companies.png", caption: "Companies list with pinned & target indicators" },
      { src: "/docs-screenshots/settings-06b-companies-new-modal.png", caption: "New Company modal" },
    ],
  },
  {
    key: "users",
    group: "Administration",
    name: "Users",
    route: "/dashboard/settings",
    icon: UsersIcon,
    summary: "Invite, edit and deactivate users. Search, filter by role/status, bulk-export.",
    actions: [
      { label: "+ New user", description: "Opens the Create User modal." },
      { label: "Search", description: "Full-text on name + email." },
      { label: "Filter", description: "By role and active/inactive status." },
      { label: "Row · Edit", description: "Update profile, role, status." },
      { label: "Row · Deactivate", description: "Revokes access while preserving history." },
    ],
    modals: [
      {
        name: "Create User",
        trigger: "+ New user button",
        fields: [
          { name: "First name", type: "text", description: "Required.", required: true },
          { name: "Last name", type: "text", description: "Required.", required: true },
          { name: "Email", type: "email", description: "Receives the invitation link.", required: true },
          { name: "Role", type: "select", description: "Pick from defined Roles. Drives permissions.", required: true },
          { name: "Initial password", type: "password", description: "Optional — if blank, an invitation email is sent." },
          { name: "Send invite email", type: "toggle", description: "When on, the user receives a sign-in link." },
        ],
        actions: [
          { label: "Create", description: "Provisions the user and (if enabled) emails the invite." },
          { label: "Cancel", description: "Discards the form." },
        ],
      },
    ],
    screenshots: [
      { src: "/docs-screenshots/settings-07-users.png", caption: "Users table — search, filters, status" },
      { src: "/docs-screenshots/settings-07b-users-create-modal.png", caption: "Create User modal" },
    ],
  },
  {
    key: "roles",
    group: "Administration",
    name: "Roles",
    route: "/dashboard/settings",
    icon: ShieldCheck,
    summary: "RBAC roles with a granular permissions matrix per module/action.",
    actions: [
      { label: "+ New role", description: "Opens the Create Role modal." },
      { label: "Row · Actions menu", description: "Edit, Duplicate, Delete (if no users assigned)." },
    ],
    modals: [
      {
        name: "Create Role",
        trigger: "+ New role button",
        fields: [
          { name: "Role name", type: "text", description: "Unique within the tenant.", required: true },
          { name: "Description", type: "textarea", description: "Free-text purpose for the role." },
        ],
        actions: [
          { label: "Create", description: "Creates the role with no permissions; opens the Edit modal." },
        ],
      },
      {
        name: "Edit Role — General tab",
        trigger: "Row · Edit",
        fields: [
          { name: "Name", type: "text", description: "Rename the role.", required: true },
          { name: "Description", type: "textarea", description: "Update the description." },
          { name: "Color", type: "color-swatch", description: "Visual tag used in the user list." },
        ],
      },
      {
        name: "Edit Role — Permissions tab",
        trigger: "Row · Edit → Permissions tab",
        fields: [
          { name: "Permissions matrix", type: "grid", description: "For each module: View / Create / Edit / Delete checkboxes. Rows scroll, header sticky." },
        ],
        actions: [
          { label: "Save permissions", description: "Broadcasts a permission update — all open sessions refresh in place." },
        ],
        notes: "Changes apply without re-login thanks to a realtime broadcast channel.",
      },
    ],
    screenshots: [
      { src: "/docs-screenshots/settings-08-roles.png", caption: "Roles table" },
      { src: "/docs-screenshots/settings-08b-roles-create-modal.png", caption: "Create Role modal" },
      { src: "/docs-screenshots/settings-08c-roles-actions-menu.png", caption: "Row actions menu (Edit / Duplicate / Delete)" },
      { src: "/docs-screenshots/settings-08d-roles-edit-general.png", caption: "Edit Role — General tab" },
      { src: "/docs-screenshots/settings-08e-roles-edit-permissions.png", caption: "Edit Role — Permissions matrix" },
    ],
  },
  {
    key: "integrations",
    group: "Administration",
    name: "Integrations",
    route: "/dashboard/settings",
    icon: Plug,
    summary: "Catalog of available integrations and their connection status (4 available, 0 connected by default).",
    actions: [
      { label: "Connect", description: "Opens the OAuth / API-key flow for the chosen integration." },
      { label: "Disconnect", description: "Revokes the stored credentials." },
      { label: "Configure", description: "Per-integration settings (sync interval, scopes…)." },
    ],
    screenshots: [{ src: "/docs-screenshots/settings-09-integrations.png", caption: "Integrations catalog" }],
  },
  {
    key: "subscription",
    group: "Administration",
    name: "Subscription",
    route: "/dashboard/settings",
    icon: CreditCard,
    summary: "Plan summary and module activation overview (38/38 modules enabled by default).",
    actions: [
      { label: "Open full plan manager", description: "Deep-links to the Plugins page where each module can be toggled." },
      { label: "View invoices", description: "Lists past billing documents." },
    ],
    screenshots: [{ src: "/docs-screenshots/settings-10-subscription.png", caption: "Subscription overview — modules enabled & plan" }],
  },
  {
    key: "system",
    group: "Administration",
    name: "System",
    route: "/dashboard/settings",
    icon: Cog,
    summary: "System logs, sync dashboard shortcut, and document numbering formats with token reference.",
    actions: [
      { label: "Open system logs", description: "Navigate to the full system log viewer." },
      { label: "Open sync dashboard", description: "Shortcut to the Sync Dashboard page." },
      { label: "Edit numbering format", description: "Inline editor with a token reference table (year, month, sequence…)." },
    ],
    notes: ["Numbering tokens: {YYYY}, {YY}, {MM}, {DD}, {SEQ}, {COMPANY}, {USER}."],
    screenshots: [{ src: "/docs-screenshots/settings-11-system.png", caption: "System tools — logs, sync, numbering formats" }],
  },
  {
    key: "sync-history",
    group: "Administration",
    name: "Sync history",
    route: "/dashboard/settings",
    icon: RefreshCw,
    summary: "Card surfaced from the System area — opens the full Sync Dashboard.",
    actions: [
      { label: "Open Sync Dashboard", description: "Navigate to /dashboard/settings/sync for queue length, retry status and conflict log." },
    ],
    screenshots: [{ src: "/docs-screenshots/settings-12-sync-history.png", caption: "Sync history shortcut card" }],
  },
];

type Match = { kind: "section" | "field" | "action" | "modal" | "modal-field" | "modal-action"; section: Section; label: string; sub?: string };

export default function SettingsDocumentationPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string>(SECTIONS[0].key);
  const [lightbox, setLightbox] = useState<{ key: string; index: number } | null>(null);

  const lightboxShots = lightbox ? SECTIONS.find((s) => s.key === lightbox.key)?.screenshots ?? [] : [];
  const currentShot = lightbox ? lightboxShots[lightbox.index] : null;

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevShot = useCallback(() => {
    setLightbox((lb) => {
      if (!lb) return lb;
      const len = SECTIONS.find((s) => s.key === lb.key)?.screenshots.length ?? 1;
      return { ...lb, index: (lb.index - 1 + len) % len };
    });
  }, []);
  const nextShot = useCallback(() => {
    setLightbox((lb) => {
      if (!lb) return lb;
      const len = SECTIONS.find((s) => s.key === lb.key)?.screenshots.length ?? 1;
      return { ...lb, index: (lb.index + 1) % len };
    });
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") prevShot();
      else if (e.key === "ArrowRight") nextShot();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox, prevShot, nextShot]);

  const q = query.trim().toLowerCase();

  const matches = useMemo<Match[]>(() => {
    if (!q) return [];
    const out: Match[] = [];
    for (const s of SECTIONS) {
      if (s.name.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q)) {
        out.push({ kind: "section", section: s, label: s.name, sub: s.summary });
      }
      s.fields?.forEach((f) => {
        if (f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)) {
          out.push({ kind: "field", section: s, label: f.name, sub: f.description });
        }
      });
      s.actions?.forEach((a) => {
        if (a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) {
          out.push({ kind: "action", section: s, label: a.label, sub: a.description });
        }
      });
      s.modals?.forEach((m) => {
        if (m.name.toLowerCase().includes(q)) {
          out.push({ kind: "modal", section: s, label: m.name, sub: `Triggered by: ${m.trigger}` });
        }
        m.fields?.forEach((f) => {
          if (f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)) {
            out.push({ kind: "modal-field", section: s, label: `${m.name} → ${f.name}`, sub: f.description });
          }
        });
        m.actions?.forEach((a) => {
          if (a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) {
            out.push({ kind: "modal-action", section: s, label: `${m.name} → ${a.label}`, sub: a.description });
          }
        });
      });
    }
    return out.slice(0, 60);
  }, [q]);

  const grouped = useMemo(() => {
    const map: Record<string, Section[]> = { Personal: [], Administration: [] };
    for (const s of SECTIONS) map[s.group].push(s);
    return map;
  }, []);

  const totals = useMemo(() => {
    let fields = 0, actions = 0, modals = 0, shots = 0;
    for (const s of SECTIONS) {
      fields += s.fields?.length ?? 0;
      actions += s.actions?.length ?? 0;
      modals += s.modals?.length ?? 0;
      shots += s.screenshots.length;
      s.modals?.forEach((m) => {
        fields += m.fields?.length ?? 0;
        actions += m.actions?.length ?? 0;
      });
    }
    return { fields, actions, modals, shots };
  }, []);

  const KIND_ICON: Record<Match["kind"], React.ComponentType<{ className?: string }>> = {
    section: Layers, field: FormInput, action: MousePointerClick,
    modal: FileText, "modal-field": FormInput, "modal-action": MousePointerClick,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b">
        <div className="px-3 sm:px-4 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/settings/documentation")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
                <Book className="h-6 w-6 text-primary" />
                Settings Documentation
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Searchable index of every Settings section, field, action and modal flow.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="secondary">{SECTIONS.length} sections</Badge>
              <Badge variant="outline">{totals.fields} fields</Badge>
              <Badge variant="outline">{totals.actions} actions</Badge>
              <Badge variant="outline">{totals.modals} modals</Badge>
              <Badge variant="outline">{totals.shots} screenshots</Badge>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sections, fields, actions, modals…"
              className="pl-9"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 lg:px-8 py-6">
        <div className="flex gap-6 max-w-[1600px] mx-auto min-w-0">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-44">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Index</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[calc(100vh-20rem)] pr-2">
                    {(["Personal", "Administration"] as const).map((g) => (
                      <div key={g} className="mb-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
                          {g}
                        </div>
                        <ul className="space-y-0.5">
                          {grouped[g].map((s) => {
                            const Icon = s.icon;
                            const active = activeKey === s.key && !q;
                            return (
                              <li key={s.key}>
                                <a
                                  href={`#sec-${s.key}`}
                                  onClick={() => setActiveKey(s.key)}
                                  className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md transition-colors ${
                                    active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground/80"
                                  }`}
                                >
                                  <Icon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{s.name}</span>
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0 space-y-6">
            {q ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    {matches.length} result{matches.length === 1 ? "" : "s"} for "{query}"
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {matches.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No matches. Try another keyword.
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {matches.map((m, i) => {
                        const KIcon = KIND_ICON[m.kind];
                        const SIcon = m.section.icon;
                        return (
                          <li key={i}>
                            <a
                              href={`#sec-${m.section.key}`}
                              onClick={() => { setActiveKey(m.section.key); setQuery(""); }}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                            >
                              <KIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{m.label}</span>
                                  <Badge variant="outline" className="text-[10px] capitalize">{m.kind.replace("-", " ")}</Badge>
                                </div>
                                {m.sub && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.sub}</p>}
                                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                                  <SIcon className="h-3 w-3" />
                                  <span>{m.section.group} → {m.section.name}</span>
                                </div>
                              </div>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {(["Personal", "Administration"] as const).map((g) => (
              <section key={g} className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <h2 className="text-lg font-semibold">{g}</h2>
                  <Badge variant="secondary">{grouped[g].length}</Badge>
                </div>
                {grouped[g].map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.key} id={`sec-${s.key}`} className="scroll-mt-44">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">{s.name}</CardTitle>
                            <CardDescription className="mt-1">{s.summary}</CardDescription>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {s.fields && <Badge variant="outline" className="text-[10px]">{s.fields.length} fields</Badge>}
                              {s.actions && <Badge variant="outline" className="text-[10px]">{s.actions.length} actions</Badge>}
                              {s.modals && <Badge variant="outline" className="text-[10px]">{s.modals.length} modals</Badge>}
                              <Link to={s.route} className="text-[11px] text-primary hover:underline ml-1">Open in app →</Link>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {s.fields?.length ? (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Fields</p>
                            <ul className="space-y-1.5">
                              {s.fields.map((f) => (
                                <li key={f.name} className="text-sm flex flex-wrap items-baseline gap-x-2">
                                  <span className="font-medium">{f.name}</span>
                                  {f.type && <Badge variant="outline" className="text-[10px] font-mono">{f.type}</Badge>}
                                  {f.required && <Badge className="text-[10px]" variant="destructive">required</Badge>}
                                  <span className="text-muted-foreground">— {f.description}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {s.actions?.length ? (
                          <>
                            <Separator />
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Actions</p>
                              <ul className="space-y-1.5">
                                {s.actions.map((a) => (
                                  <li key={a.label} className="text-sm">
                                    <span className="font-medium">{a.label}</span>
                                    <span className="text-muted-foreground"> — {a.description}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        ) : null}

                        {s.modals?.length ? (
                          <>
                            <Separator />
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Modals & flows</p>
                              <div className="space-y-3">
                                {s.modals.map((m) => (
                                  <div key={m.name} className="rounded-md border bg-muted/30 p-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <FileText className="h-4 w-4 text-primary" />
                                      <span className="font-medium text-sm">{m.name}</span>
                                      <Badge variant="outline" className="text-[10px]">Trigger: {m.trigger}</Badge>
                                    </div>
                                    {m.fields?.length ? (
                                      <div className="mt-2">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">Fields</p>
                                        <ul className="text-xs space-y-1">
                                          {m.fields.map((f) => (
                                            <li key={f.name} className="flex flex-wrap items-baseline gap-x-2">
                                              <span className="font-medium">{f.name}</span>
                                              {f.type && <Badge variant="outline" className="text-[10px] font-mono">{f.type}</Badge>}
                                              {f.required && <Badge variant="destructive" className="text-[10px]">required</Badge>}
                                              <span className="text-muted-foreground">— {f.description}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : null}
                                    {m.actions?.length ? (
                                      <div className="mt-2">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">Actions</p>
                                        <ul className="text-xs space-y-1">
                                          {m.actions.map((a) => (
                                            <li key={a.label}>
                                              <span className="font-medium">{a.label}</span>
                                              <span className="text-muted-foreground"> — {a.description}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : null}
                                    {m.notes && <p className="text-[11px] text-muted-foreground italic mt-2">{m.notes}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : null}

                        {s.notes?.length ? (
                          <>
                            <Separator />
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
                              <ul className="text-xs list-disc pl-5 space-y-1 text-muted-foreground">
                                {s.notes.map((n, i) => <li key={i}>{n}</li>)}
                              </ul>
                            </div>
                          </>
                        ) : null}

                        {s.screenshots.length ? (
                          <>
                            <Separator />
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Screenshots</p>
                              <div className="grid gap-3 sm:grid-cols-2">
                                {s.screenshots.map((shot, idx) => (
                                  <figure key={shot.src} className="space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => setLightbox({ key: s.key, index: idx })}
                                      className="block w-full relative group"
                                    >
                                      <img
                                        src={shot.src}
                                        alt={shot.caption}
                                        loading="lazy"
                                        className="w-full rounded-md border bg-muted/20 group-hover:opacity-90 transition-opacity cursor-zoom-in"
                                      />
                                      <span className="absolute top-1.5 right-1.5 rounded bg-background/80 backdrop-blur p-1 opacity-0 group-hover:opacity-100 transition-opacity border">
                                        <Maximize2 className="h-3.5 w-3.5" />
                                      </span>
                                    </button>
                                    <figcaption className="text-xs text-muted-foreground">{shot.caption}</figcaption>
                                  </figure>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </section>
            ))}
          </main>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && currentShot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col" onClick={closeLightbox}>
          <div className="flex items-center justify-between px-4 py-2 bg-background/80 border-b">
            <div className="text-sm font-medium truncate">{currentShot.caption}</div>
            <Button variant="ghost" size="icon" onClick={closeLightbox} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 relative flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary" size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full shadow-lg z-10"
              onClick={(e) => { e.stopPropagation(); prevShot(); }}
              disabled={lightboxShots.length < 2}
              aria-label="Previous"
            ><ChevronLeft className="h-5 w-5" /></Button>
            <img
              src={currentShot.src}
              alt={currentShot.caption}
              className="max-h-full max-w-full object-contain rounded shadow-2xl"
            />
            <Button
              variant="secondary" size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full shadow-lg z-10"
              onClick={(e) => { e.stopPropagation(); nextShot(); }}
              disabled={lightboxShots.length < 2}
              aria-label="Next"
            ><ChevronRight className="h-5 w-5" /></Button>
          </div>
          <div className="border-t bg-background/80 px-4 py-2 text-[11px] text-muted-foreground text-center">
            {lightbox.index + 1} / {lightboxShots.length} · ← / → to navigate · Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
