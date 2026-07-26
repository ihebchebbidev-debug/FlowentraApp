using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Processes.DTOs;

// ─────────────────────────────────────────────────────────────────────────────
// Core process handlers.
//
// Every handler in this file is:
//   • Idempotent — running twice back-to-back has the same net effect.
//   • Multi-tenant safe — operates across ALL tenants in a single scan so no
//     per-tenant configuration is needed (which is what the user asked for:
//     "run on their own even with normal users").
//   • Pure database work — no external I/O, no user resolution, no scaffolding.
//     If it compiles and the row exists, it runs. That is why every entry
//     here is registered as a REAL_HANDLER_KEY in the frontend.
//
// Handlers use EF Core's ExecuteUpdateAsync / ExecuteDeleteAsync so the change
// is a single SQL statement per operation — no in-memory materialization, no
// tracking overhead, no risk of partial saves.
// ─────────────────────────────────────────────────────────────────────────────

namespace MyApi.Modules.Processes.Services.Handlers
{
    internal static class ProcessConfig
    {
        public static int Int(string json, string key, int fallback, int min = 1, int max = 3650)
        {
            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
                if (doc.RootElement.TryGetProperty(key, out var v) && v.TryGetInt32(out var i))
                    return Math.Clamp(i, min, max);
            }
            catch { /* fall through */ }
            return fallback;
        }
    }

    // ── 1. Invoices: mark past-due invoices as overdue ─────────────────────
    public class InvoicesMarkOverdueHandler : IProcessHandler
    {
        public string Key => "admin.invoices-mark-overdue";
        private readonly IServiceProvider _sp;
        public InvoicesMarkOverdueHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var now = DateTime.UtcNow;
            var updated = await db.Invoices
                .Where(i => !i.IsDeleted
                            && i.DueDate != null && i.DueDate < now
                            && i.AmountPaid < i.GrandTotal
                            && (i.Status == "posted" || i.Status == "sent" || i.Status == "partial"))
                .ExecuteUpdateAsync(s => s
                    .SetProperty(i => i.Status, "overdue")
                    .SetProperty(i => i.UpdatedAt, now), ct);
            return new RunNowResult { Status = "success", ItemsProcessed = updated, Output = new { updated } };
        }
    }

    // ── 2. Offers: expire offers past ValidUntil ───────────────────────────
    public class OffersMarkExpiredHandler : IProcessHandler
    {
        public string Key => "admin.offers-mark-expired";
        private readonly IServiceProvider _sp;
        public OffersMarkExpiredHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var now = DateTime.UtcNow;
            var updated = await db.Offers
                .Where(o => !o.IsDeleted
                            && o.ValidUntil != null && o.ValidUntil < now
                            && (o.Status == "draft" || o.Status == "sent" || o.Status == "pending"))
                .ExecuteUpdateAsync(s => s
                    .SetProperty(o => o.Status, "expired")
                    .SetProperty(o => o.UpdatedAt, now), ct);
            return new RunNowResult { Status = "success", ItemsProcessed = updated, Output = new { updated } };
        }
    }

    // ── 3. Dispatches: mark long-past unattended dispatches as missed ──────
    public class DispatchesMarkMissedHandler : IProcessHandler
    {
        public string Key => "admin.dispatches-mark-missed";
        private readonly IServiceProvider _sp;
        public DispatchesMarkMissedHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int hoursGrace = ProcessConfig.Int(cfg, "grace_hours", 2, 1, 168);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddHours(-hoursGrace);
            var updated = await db.Dispatches
                .Where(d => !d.IsDeleted
                            && d.ScheduledDate < cutoff
                            && d.ActualStartTime == null
                            && (d.Status == "pending" || d.Status == "scheduled" || d.Status == "assigned"))
                .ExecuteUpdateAsync(s => s
                    .SetProperty(d => d.Status, "missed")
                    .SetProperty(d => d.ModifiedDate, DateTime.UtcNow), ct);
            return new RunNowResult { Status = "success", ItemsProcessed = updated, Output = new { grace_hours = hoursGrace, updated } };
        }
    }

    // ── 4. Payment plan installments: mark past-due as overdue ─────────────
    public class PaymentInstallmentsMarkOverdueHandler : IProcessHandler
    {
        public string Key => "admin.payment-installments-mark-overdue";
        private readonly IServiceProvider _sp;
        public PaymentInstallmentsMarkOverdueHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var now = DateTime.UtcNow;
            var updated = await db.PaymentPlanInstallments
                .Where(p => p.Status == "pending" && p.DueDate < now)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Status, "overdue"), ct);
            return new RunNowResult { Status = "success", ItemsProcessed = updated, Output = new { updated } };
        }
    }

    // ── 5. Support tickets: auto-close resolved tickets after N days ──────
    public class SupportTicketsAutocloseHandler : IProcessHandler
    {
        public string Key => "admin.support-tickets-autoclose-resolved";
        private readonly IServiceProvider _sp;
        public SupportTicketsAutocloseHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "days_resolved", 7, 1, 365);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var updated = await db.SupportTickets
                .Where(t => t.Status == "resolved"
                            && (t.LastOccurredAt ?? t.CreatedAt) < cutoff)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.Status, "closed"), ct);
            return new RunNowResult { Status = "success", ItemsProcessed = updated, Output = new { days_resolved = days, updated } };
        }
    }

    // ── 6. Draft offers: purge abandoned drafts ────────────────────────────
    public class DraftOffersPurgeHandler : IProcessHandler
    {
        public string Key => "admin.draft-offers-purge";
        private readonly IServiceProvider _sp;
        public DraftOffersPurgeHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 60, 7, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var deleted = await db.Offers
                .Where(o => o.Status == "draft"
                            && (o.UpdatedAt ?? o.ModifiedDate ?? o.CreatedDate) < cutoff)
                .ExecuteDeleteAsync(ct);
            return new RunNowResult { Status = "success", ItemsProcessed = deleted, Output = new { age_days = days, deleted } };
        }
    }

    // ── 7. Draft invoices: purge abandoned drafts ──────────────────────────
    public class DraftInvoicesPurgeHandler : IProcessHandler
    {
        public string Key => "admin.draft-invoices-purge";
        private readonly IServiceProvider _sp;
        public DraftInvoicesPurgeHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 60, 7, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var deleted = await db.Invoices
                .Where(i => i.Status == "draft"
                            && (i.UpdatedAt ?? i.CreatedAt) < cutoff)
                .ExecuteDeleteAsync(ct);
            return new RunNowResult { Status = "success", ItemsProcessed = deleted, Output = new { age_days = days, deleted } };
        }
    }

    // ── 8. Notifications: purge read notifications older than N days ───────
    public class NotificationsPurgeReadHandler : IProcessHandler
    {
        public string Key => "admin.notifications-purge-read";
        private readonly IServiceProvider _sp;
        public NotificationsPurgeReadHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 30, 1, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var deleted = await db.Notifications
                .Where(n => n.IsRead && n.CreatedAt < cutoff)
                .ExecuteDeleteAsync(ct);
            return new RunNowResult { Status = "success", ItemsProcessed = deleted, Output = new { age_days = days, deleted } };
        }
    }

    // ── 9. Notifications: purge very old unread notifications ──────────────
    public class NotificationsPurgeStaleUnreadHandler : IProcessHandler
    {
        public string Key => "admin.notifications-purge-stale-unread";
        private readonly IServiceProvider _sp;
        public NotificationsPurgeStaleUnreadHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 180, 30, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var deleted = await db.Notifications
                .Where(n => !n.IsRead && n.CreatedAt < cutoff)
                .ExecuteDeleteAsync(ct);
            return new RunNowResult { Status = "success", ItemsProcessed = deleted, Output = new { age_days = days, deleted } };
        }
    }

    // ── 10. Calendar: purge past events completed or cancelled ─────────────
    public class CalendarEventsPurgePastHandler : IProcessHandler
    {
        public string Key => "admin.calendar-events-purge-past";
        private readonly IServiceProvider _sp;
        public CalendarEventsPurgePastHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 180, 30, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var deleted = await db.CalendarEvents
                .Where(e => e.End < cutoff && (e.Status == "completed" || e.Status == "cancelled"))
                .ExecuteDeleteAsync(ct);
            return new RunNowResult { Status = "success", ItemsProcessed = deleted, Output = new { age_days = days, deleted } };
        }
    }

    // ── 11. Sync: purge old SyncChanges ────────────────────────────────────
    public class SyncChangesPurgeHandler : IProcessHandler
    {
        public string Key => "admin.sync-changes-purge";
        private readonly IServiceProvider _sp;
        public SyncChangesPurgeHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 30, 1, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var deleted = await db.SyncChanges
                .Where(c => c.ChangedAt < cutoff)
                .ExecuteDeleteAsync(ct);
            return new RunNowResult { Status = "success", ItemsProcessed = deleted, Output = new { age_days = days, deleted } };
        }
    }

    // ── 12. Sync: purge old SyncOperationReceipts ──────────────────────────
    public class SyncReceiptsPurgeHandler : IProcessHandler
    {
        public string Key => "admin.sync-receipts-purge";
        private readonly IServiceProvider _sp;
        public SyncReceiptsPurgeHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 30, 1, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var deleted = await db.SyncOperationReceipts
                .Where(r => r.CreatedAt < cutoff)
                .ExecuteDeleteAsync(ct);
            return new RunNowResult { Status = "success", ItemsProcessed = deleted, Output = new { age_days = days, deleted } };
        }
    }

    // ── 13. Webhook forward jobs: purge finished jobs ──────────────────────
    public class WebhookJobsPurgeHandler : IProcessHandler
    {
        public string Key => "admin.webhook-jobs-purge";
        private readonly IServiceProvider _sp;
        public WebhookJobsPurgeHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 30, 1, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var deleted = await db.WebhookForwardJobs
                .Where(w => (w.Status == "completed" || w.Status == "dead_letter")
                            && w.CompletedAt != null && w.CompletedAt < cutoff)
                .ExecuteDeleteAsync(ct);
            return new RunNowResult { Status = "success", ItemsProcessed = deleted, Output = new { age_days = days, deleted } };
        }
    }

    // ── 14. External endpoint logs: per-endpoint retention ─────────────────
    public class ExternalEndpointLogsPurgeHandler : IProcessHandler
    {
        public string Key => "admin.external-endpoint-logs-purge";
        private readonly IServiceProvider _sp;
        public ExternalEndpointLogsPurgeHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            int totalDeleted = 0;
            var endpoints = await db.ExternalEndpoints
                .Where(e => !e.IsDeleted)
                .Select(e => new { e.Id, e.LogRetentionDays })
                .ToListAsync(ct);
            foreach (var ep in endpoints)
            {
                var days = Math.Clamp(ep.LogRetentionDays <= 0 ? 30 : ep.LogRetentionDays, 1, 3650);
                var cutoff = DateTime.UtcNow.AddDays(-days);
                totalDeleted += await db.ExternalEndpointLogs
                    .Where(l => l.EndpointId == ep.Id && l.ReceivedAt < cutoff)
                    .ExecuteDeleteAsync(ct);
            }
            return new RunNowResult { Status = "success", ItemsProcessed = totalDeleted, Output = new { endpoints = endpoints.Count, deleted = totalDeleted } };
        }
    }

    // ── 15. Dispatch audit logs: purge older than N days ───────────────────
    public class DispatchAuditPurgeHandler : IProcessHandler
    {
        public string Key => "admin.dispatch-audit-purge";
        private readonly IServiceProvider _sp;
        public DispatchAuditPurgeHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 180, 30, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var deleted = await db.DispatchAuditLogs
                .Where(a => a.CreatedAt < cutoff)
                .ExecuteDeleteAsync(ct);
            return new RunNowResult { Status = "success", ItemsProcessed = deleted, Output = new { age_days = days, deleted } };
        }
    }

    // ── 16. HR audit logs: purge older than N days ─────────────────────────
    public class HrAuditPurgeHandler : IProcessHandler
    {
        public string Key => "admin.hr-audit-purge";
        private readonly IServiceProvider _sp;
        public HrAuditPurgeHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 365, 90, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var deleted = await db.HrAuditLogs
                .Where(a => a.CreatedAt < cutoff)
                .ExecuteDeleteAsync(ct);
            return new RunNowResult { Status = "success", ItemsProcessed = deleted, Output = new { age_days = days, deleted } };
        }
    }

    // ── 17. Soft-deleted rows: hard purge after retention window ───────────
    public class SoftDeletedPurgeHandler : IProcessHandler
    {
        public string Key => "admin.soft-deleted-purge";
        private readonly IServiceProvider _sp;
        public SoftDeletedPurgeHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 90, 30, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);

            var invoices  = await db.Invoices .Where(x => x.IsDeleted && x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(ct);
            var offers    = await db.Offers   .Where(x => x.IsDeleted && x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(ct);
            var deals     = await db.Deals    .Where(x => x.IsDeleted && x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(ct);
            var sales     = await db.Sales    .Where(x => x.IsDeleted && x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(ct);
            var articles  = await db.Articles .Where(x => x.IsDeleted && x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(ct);
            var dispatches = await db.Dispatches.Where(x => x.IsDeleted && x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(ct);
            var serviceOrders = await db.ServiceOrders.Where(x => x.IsDeleted && x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(ct);

            var total = invoices + offers + deals + sales + articles + dispatches + serviceOrders;
            return new RunNowResult
            {
                Status = "success",
                ItemsProcessed = total,
                Output = new { age_days = days, invoices, offers, deals, sales, articles, dispatches, service_orders = serviceOrders },
            };
        }
    }

    // ── 18. Recurring task logs: purge history older than N days ───────────
    public class RecurringTaskLogsPurgeHandler : IProcessHandler
    {
        public string Key => "admin.recurring-task-logs-purge";
        private readonly IServiceProvider _sp;
        public RecurringTaskLogsPurgeHandler(IServiceProvider sp) { _sp = sp; }
        public async Task<RunNowResult> ExecuteAsync(string cfg, CancellationToken ct)
        {
            int days = ProcessConfig.Int(cfg, "age_days", 180, 30, 3650);
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var deleted = await db.RecurringTaskLogs
                .Where(l => l.GeneratedDate < cutoff)
                .ExecuteDeleteAsync(ct);
            return new RunNowResult { Status = "success", ItemsProcessed = deleted, Output = new { age_days = days, deleted } };
        }
    }
}
