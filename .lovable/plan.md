# Cross-Tenant Public Tickets API — Simple & Open

A single set of public endpoints that fan out across every tenant database (demo, dev, krossier, …) and let you **list tickets, read one, change status, and add comments** — exactly like inside the main app. No API key. No headers. Just call the URL.

---

## 1. Endpoints

Base: `https://api.flowentra.app/api/public/tickets`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | List tickets across **all tenants** (filters + pagination) |
| `GET` | `/{tenant}/{ticketId}` | Get one ticket (with comments + history) |
| `PATCH` | `/{tenant}/{ticketId}/status` | Change status |
| `POST` | `/{tenant}/{ticketId}/comments` | Add a comment |
| `GET` | `/tenants` | List available tenants (slugs) |

`{tenant}` is the subdomain slug: `demo`, `dev`, `krossier`, …

---

## 2. Ticket response shape (fully typed)

Every ticket returned by the API carries **who / where / how it was created**:

```json
{
  "id": "f2c1...",
  "tenant": "krossier",                    // which tenant DB it lives in
  "tenantUrl": "https://krossier.flowentra.app",
  "title": "Checkout fails on Safari",
  "description": "…",
  "status": "open",                        // open | in_progress | resolved | closed
  "priority": "high",
  "category": "bug",
  "createdAt": "2026-07-20T10:32:11Z",
  "updatedAt": "2026-07-22T08:15:00Z",

  "origin": {
    "type": "manual",                      // "manual" | "auto"
    "source": "user_form",                 // user_form | incident_monitor | email | api
    "errorFingerprint": null,              // set when type = "auto"
    "occurrenceCount": null,
    "firstSeenAt": null
  },

  "reporter": {
    "userId": "u_123",
    "email": "sara@krossier.com",
    "name": "Sara D.",
    "isAnonymous": false,
    "isSystem": false                      // true for auto-created tickets
  },

  "assignee": { "userId": "u_9", "email": "ops@flowentra.app", "name": "Ops" },
  "commentsCount": 4,
  "tags": ["safari", "payments"]
}
```

An **auto-created** ticket looks like:

```json
"origin": {
  "type": "auto",
  "source": "incident_monitor",
  "errorFingerprint": "TypeError:cart.total",
  "occurrenceCount": 27,
  "firstSeenAt": "2026-07-19T02:11:00Z"
},
"reporter": { "isSystem": true, "email": "system@flowentra.app", "name": "System" }
```

List responses wrap this:

```json
{
  "items": [ /* tickets */ ],
  "total": 142,
  "page": 1,
  "pageSize": 50,
  "tenantsQueried": ["demo","dev","krossier"],
  "tenantErrors": []                       // any tenant DB that failed is reported here, others still return
}
```

---

## 3. How to use it

### List all tickets everywhere
```bash
curl "https://api.flowentra.app/api/public/tickets"
```

### Filter
```bash
curl "https://api.flowentra.app/api/public/tickets?status=open&priority=high&origin=auto&tenant=krossier,demo&page=1&pageSize=50&search=checkout"
```
Supported query params: `status`, `priority`, `category`, `origin` (`manual`|`auto`), `tenant` (csv), `reporterEmail`, `assigneeEmail`, `from`, `to` (ISO dates), `search`, `page`, `pageSize`, `sort` (`createdAt:desc` default).

### Get one ticket (with comments + history)
```bash
curl "https://api.flowentra.app/api/public/tickets/krossier/f2c1abcd"
```

### Change status
```bash
curl -X PATCH "https://api.flowentra.app/api/public/tickets/krossier/f2c1abcd/status" \
  -H "Content-Type: application/json" \
  -d '{ "status": "in_progress", "note": "Investigating" }'
```

### Add a comment
```bash
curl -X POST "https://api.flowentra.app/api/public/tickets/krossier/f2c1abcd/comments" \
  -H "Content-Type: application/json" \
  -d '{ "body": "Reproduced on Safari 17", "authorEmail": "you@flowentra.app", "authorName": "You" }'
```

### List tenants
```bash
curl "https://api.flowentra.app/api/public/tickets/tenants"
# → { "tenants": [{ "slug":"demo","url":"https://demo.flowentra.app"}, ...] }
```

---

## 4. Implementation (technical)

**Route group:** `Backend/Modules/SupportTickets/Controllers/PublicTicketsController.cs`, mounted at `/api/public/tickets`, marked `[AllowAnonymous]`, excluded from `TenantMiddleware` in `Program.cs` (path prefix skip) so it does NOT require a tenant subdomain.

**Fan-out list flow:**
1. `TenantConnectionResolver.GetAll()` → all tenant slugs + connection strings from env.
2. For each tenant, in parallel (`Task.WhenAll` + `SemaphoreSlim(8)`), open a scoped `TenantDbContext`, apply filters, project to `PublicTicketDto`, stamp `tenant` + `tenantUrl`, derive `origin` from existing `Source`/`ErrorFingerprint` columns and `reporter.isSystem` from `CreatedByUserId is null || CreatedBySystem == true`.
3. Merge, sort, paginate in memory. Any tenant that throws is caught and added to `tenantErrors` — other tenants still return.

**Single-tenant flows** (`GET /{tenant}/{id}`, `PATCH .../status`, `POST .../comments`):
- Resolve the tenant's connection string by slug via `TenantConnectionResolver.Resolve(slug)`; 404 if unknown.
- Reuse the **existing** app services (`TicketService.UpdateStatusAsync`, `CommentService.AddAsync`) so validation, status transitions, timeline entries, notifications, and audit logs behave **identically to the in-app flow**.
- For comments where no logged-in user exists, persist `authorEmail`/`authorName` and flag `viaPublicApi = true` on the comment record.

**DTO files:**
- `DTOs/PublicTicketDto.cs`, `PublicTicketOrigin.cs`, `PublicTicketReporter.cs`, `PublicTicketListResponse.cs`, `TenantErrorDto.cs`, `UpdateStatusRequest.cs`, `AddCommentRequest.cs`.

**Removed from previous plan:** `ApiKeyAuthAttribute`, `PUBLIC_TICKETS_API_KEY` secret, all `X-Api-Key` handling. Endpoints are fully open.

**Safety rails kept minimal (not auth):**
- Basic per-IP rate limit (e.g. 60 req/min) via existing rate-limit middleware.
- Response cap: `pageSize ≤ 200`.
- Status transitions still validated by `TicketService` (can't jump to invalid states).

---

## 5. Files to add / modify

- **Add** `Backend/Modules/SupportTickets/Controllers/PublicTicketsController.cs`
- **Add** `Backend/Modules/SupportTickets/DTOs/PublicTicket*.cs` (5 files above)
- **Add** `Backend/Modules/SupportTickets/Services/CrossTenantTicketQuery.cs` (fan-out logic)
- **Modify** `Backend/Program.cs` → skip `TenantMiddleware` for paths starting with `/api/public/`
- **Modify** `Backend/Infrastructure/Tenancy/TenantConnectionResolver.cs` → add `GetAll()` + `Resolve(slug)` if not already present
- **Delete** (from earlier plan) `Backend/Infrastructure/ApiKeyAuthAttribute.cs`

No DB migrations required — reuses existing tickets/comments tables in every tenant DB.
