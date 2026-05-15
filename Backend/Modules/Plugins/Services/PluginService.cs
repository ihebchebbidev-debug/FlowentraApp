using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Plugins.DTOs;
using MyApi.Modules.Plugins.Models;

namespace MyApi.Modules.Plugins.Services
{
    public class PluginService : IPluginService
    {
        private readonly ApplicationDbContext _db;

        public PluginService(ApplicationDbContext db) { _db = db; }

        public async Task<List<PluginActivationDto>> GetActivationsAsync()
        {
            // Only the rows that have been explicitly toggled. Frontend treats
            // missing codes as enabled (default-on).
            var rows = await _db.ActivatedModules.AsNoTracking().ToListAsync();
            return rows.Select(r => new PluginActivationDto
            {
                Code = r.PluginCode,
                IsEnabled = r.IsEnabled,
                UpdatedAt = r.UpdatedAt,
            }).ToList();
        }

        public async Task<PluginActivationDto> SetActivationAsync(string code, bool isEnabled, int? userId)
        {
            if (string.IsNullOrWhiteSpace(code))
                throw new PluginUnknownException(code ?? "");

            // Validate against known catalog if registered. Allow unknown codes
            // through (frontend may add new manifests ahead of backend deploys),
            // but still apply core/dependency checks when the code IS known.
            var known = KnownPlugins.ByCode.TryGetValue(code, out var entry) ? entry : null;

            if (!isEnabled && known != null && known.IsCore)
                throw new PluginCoreLockedException(code);

            if (!isEnabled && known != null)
            {
                // Find dependents that are still enabled (no row OR row.IsEnabled=true)
                var dependents = KnownPlugins.Dependents(code).Select(d => d.Code).ToList();
                if (dependents.Any())
                {
                    var rows = await _db.ActivatedModules
                        .Where(a => dependents.Contains(a.PluginCode))
                        .ToListAsync();
                    var blocking = dependents
                        .Where(dc =>
                        {
                            var r = rows.FirstOrDefault(x => x.PluginCode == dc);
                            return r == null || r.IsEnabled; // default-on or explicitly on
                        })
                        .ToList();
                    if (blocking.Any())
                        throw new PluginDependencyConflictException(code, blocking);
                }
            }

            var existing = await _db.ActivatedModules
                .FirstOrDefaultAsync(a => a.PluginCode == code);

            if (existing == null)
            {
                existing = new ActivatedModule
                {
                    PluginCode = code,
                    IsEnabled = isEnabled,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = userId,
                };
                _db.ActivatedModules.Add(existing);
            }
            else
            {
                existing.IsEnabled = isEnabled;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;
            }

            await _db.SaveChangesAsync();

            return new PluginActivationDto
            {
                Code = existing.PluginCode,
                IsEnabled = existing.IsEnabled,
                UpdatedAt = existing.UpdatedAt,
            };
        }

        public async Task<List<PluginActivationDto>> BulkSetAsync(List<string> codes, bool isEnabled, int? userId)
        {
            var results = new List<PluginActivationDto>();
            foreach (var code in codes.Distinct())
            {
                try
                {
                    var dto = await SetActivationAsync(code, isEnabled, userId);
                    results.Add(dto);
                }
                catch (PluginCoreLockedException) { /* skip core */ }
                catch (PluginDependencyConflictException) { /* skip blocked */ }
            }
            return results;
        }

        public async Task<PluginStatsDto> GetStatsAsync()
        {
            var total = KnownPlugins.All.Count;
            var disabledCount = await _db.ActivatedModules
                .Where(a => !a.IsEnabled)
                .Select(a => a.PluginCode)
                .Distinct()
                .CountAsync();
            return new PluginStatsDto { Active = total - disabledCount, Total = total };
        }
    }
}
