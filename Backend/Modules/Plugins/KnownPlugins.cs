using System.Collections.Generic;
using System.Linq;

namespace MyApi.Modules.Plugins
{
    /// <summary>
    /// Minimal mirror of the frontend manifest registry — used for server-side
    /// validation (core-locking, dependency checks, total-count for stats).
    /// Keep codes in sync with src/modules/<module>/plugin.ts.
    /// </summary>
    public static class KnownPlugins
    {
        public record Entry(string Code, bool IsCore, string[] Dependencies);

        // Codes are immutable. Order is irrelevant. Add new plugins below.
        public static readonly IReadOnlyList<Entry> All = new List<Entry>
        {
            // ── Core / System (cannot be disabled) ──
            new("PL0033SYSTEM",        true,  new string[0]),
            new("PL0034SETTINGS",      true,  new string[0]),
            new("PL0035AUTH",          true,  new string[0]),
            new("PL0036DASHBOARD",     true,  new string[0]),

            // ── CRM ──
            new("PL0001CONTACTS",      false, new string[0]),
            new("PL0002SALES",         false, new[] { "PL0001CONTACTS" }),
            new("PL0003DEALS",         false, new[] { "PL0001CONTACTS" }),
            new("PL0004PROJECTS",      false, new[] { "PL0001CONTACTS" }),
            new("PL0005OFFERS",        false, new[] { "PL0001CONTACTS" }),
            new("PL0006SUPPORT",       false, new string[0]),

            // ── Inventory & Stock ──
            new("PL0007ARTICLES",      false, new string[0]),
            new("PL0008INVSERVICES",   false, new string[0]),
            new("PL0009STOCK",         false, new[] { "PL0007ARTICLES" }),

            // ── Calendar / Tasks / Documents ──
            new("PL0010CALENDAR",      false, new string[0]),
            new("PL0011TASKS",         false, new string[0]),
            new("PL0012DOCUMENTS",     false, new string[0]),

            // ── HR ──
            new("PL0013HR",            false, new string[0]),
            new("PL0014SKILLS",        false, new string[0]),

            // ── Field ──
            new("PL0015FIELD",         false, new string[0]),
            new("PL0016SERVICEORDERS", false, new[] { "PL0015FIELD" }),
            new("PL0017DISPATCHES",    false, new[] { "PL0015FIELD" }),
            new("PL0018INSTALLATIONS", false, new[] { "PL0015FIELD" }),
            new("PL0019FIELDINV",      false, new[] { "PL0015FIELD" }),
            new("PL0020FIELDREPORTS",  false, new[] { "PL0015FIELD" }),
            new("PL0021TIMEEXPENSES",  false, new[] { "PL0015FIELD" }),
            new("PL0022FIELDCUSTOMERS",false, new[] { "PL0015FIELD" }),
            new("PL0023SCHEDULING",    false, new[] { "PL0015FIELD" }),
            new("PL0024DISPATCHER",    false, new[] { "PL0015FIELD" }),

            // ── Finance / Purchases / Payments ──
            new("PL0025PURCHASES",     false, new string[0]),
            new("PL0026PAYMENTS",      false, new string[0]),

            // ── Comms ──
            new("PL0027COMMUNICATION", false, new string[0]),
            new("PL0028EMAILCALENDAR", false, new string[0]),
            new("PL0029NOTIFICATIONS", false, new string[0]),
            new("PL0030EXTERNAL",      false, new string[0]),

            // ── Workflow / Forms / Lookups ──
            new("PL0031WORKFLOW",      false, new string[0]),
            new("PL0032DYNAMICFORMS",  false, new string[0]),
            new("PL0037LOOKUPS",       false, new string[0]),

            // ── Builders ──
            new("PL0038WEBSITEBLDR",   false, new string[0]),
            new("PL0039DASHBLDR",      false, new string[0]),

            // ── Analytics / Audit / Sync ──
            new("PL0040ANALYTICS",     false, new string[0]),
            new("PL0041AIASSISTANT",   false, new string[0]),
            new("PL0042AUTOMATION",    false, new string[0]),
            new("PL0043USERS",         false, new string[0]),
            new("PL0044PREFERENCES",   false, new string[0]),
            new("PL0045ONBOARDING",    false, new string[0]),
        };

        public static readonly Dictionary<string, Entry> ByCode =
            All.ToDictionary(e => e.Code, e => e);

        public static bool IsCore(string code) =>
            ByCode.TryGetValue(code, out var e) && e.IsCore;

        public static bool Exists(string code) => ByCode.ContainsKey(code);

        public static IEnumerable<Entry> Dependents(string code) =>
            All.Where(e => e.Dependencies.Contains(code));
    }
}
