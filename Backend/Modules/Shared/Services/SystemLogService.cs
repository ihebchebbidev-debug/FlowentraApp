using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Shared.DTOs;
using MyApi.Modules.Shared.Models;
using System.Text.Json;

namespace MyApi.Modules.Shared.Services
{
    public class SystemLogService : ISystemLogService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SystemLogService> _logger;

        public SystemLogService(ApplicationDbContext context, ILogger<SystemLogService> logger)
        {
            _context = context;
            _logger = logger;
        }

        private DbSet<SystemLog> SystemLogs => _context.Set<SystemLog>();

        public async Task<SystemLogListResponseDto> GetLogsAsync(SystemLogSearchRequestDto? searchRequest = null)
        {
            // System logs are an audit trail visible to admins regardless of the
            // current tenant context. Bypass the global tenant query filter so a
            // missing or "view-all" tenant context cannot crash the endpoint.
            var query = SystemLogs.AsNoTracking().IgnoreQueryFilters().AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(searchRequest?.SearchTerm))
            {
                var term = searchRequest.SearchTerm.ToLower();
                query = query.Where(l => 
                    l.Message.ToLower().Contains(term) ||
                    l.Module.ToLower().Contains(term) ||
                    (l.Details != null && l.Details.ToLower().Contains(term)) ||
                    (l.UserName != null && l.UserName.ToLower().Contains(term)) ||
                    (l.EntityType != null && l.EntityType.ToLower().Contains(term))
                );
            }

            if (!string.IsNullOrEmpty(searchRequest?.Level) && searchRequest.Level != "all")
            {
                query = query.Where(l => l.Level == searchRequest.Level);
            }

            if (!string.IsNullOrEmpty(searchRequest?.Module))
            {
                query = query.Where(l => l.Module == searchRequest.Module);
            }

            if (!string.IsNullOrEmpty(searchRequest?.Action))
            {
                query = query.Where(l => l.Action == searchRequest.Action);
            }

            if (!string.IsNullOrEmpty(searchRequest?.UserId))
            {
                query = query.Where(l => l.UserId == searchRequest.UserId);
            }

            if (searchRequest?.StartDate.HasValue == true)
            {
                query = query.Where(l => l.Timestamp >= searchRequest.StartDate.Value);
            }

            if (searchRequest?.EndDate.HasValue == true)
            {
                query = query.Where(l => l.Timestamp <= searchRequest.EndDate.Value);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Pagination
            var pageNumber = searchRequest?.PageNumber ?? 1;
            var pageSize = searchRequest?.PageSize ?? 50;
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var logs = await query
                .OrderByDescending(l => l.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(l => MapToDto(l))
                .ToListAsync();

            return new SystemLogListResponseDto
            {
                Logs = logs,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = totalPages
            };
        }

        public async Task<SystemLogDto?> GetLogByIdAsync(int id)
        {
            var log = await SystemLogs
                .AsNoTracking()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(l => l.Id == id);
            return log != null ? MapToDto(log) : null;
        }

        public async Task<SystemLogDto> CreateLogAsync(CreateSystemLogRequestDto createDto, string? ipAddress = null)
        {
            var log = new SystemLog
            {
                Timestamp = DateTime.UtcNow,
                Level = ValidateLevel(createDto.Level),
                Message = createDto.Message,
                Module = createDto.Module,
                Action = ValidateAction(createDto.Action),
                UserId = createDto.UserId,
                UserName = createDto.UserName,
                EntityType = createDto.EntityType,
                EntityId = createDto.EntityId,
                Details = createDto.Details,
                IpAddress = ipAddress ?? createDto.IpAddress,
                UserAgent = createDto.UserAgent,
                Metadata = createDto.Metadata != null ? JsonSerializer.Serialize(createDto.Metadata) : null
            };

            await PersistLogResilientlyAsync(log, "CreateLogAsync");
            return MapToDto(log);
        }

        public async Task<SystemLogStatisticsDto> GetStatisticsAsync()
        {
            var now = DateTime.UtcNow;
            var last24Hours = now.AddHours(-24);
            var last7Days = now.AddDays(-7);

            var stats = await SystemLogs
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(l => l.Timestamp >= last7Days)
                .GroupBy(l => 1)
                .Select(g => new SystemLogStatisticsDto
                {
                    TotalLogs = g.Count(),
                    InfoCount = g.Count(l => l.Level == "info"),
                    WarningCount = g.Count(l => l.Level == "warning"),
                    ErrorCount = g.Count(l => l.Level == "error"),
                    SuccessCount = g.Count(l => l.Level == "success"),
                    Last24Hours = g.Count(l => l.Timestamp >= last24Hours),
                    Last7Days = g.Count()
                })
                .FirstOrDefaultAsync();

            return stats ?? new SystemLogStatisticsDto();
        }

        public async Task<List<string>> GetModulesAsync()
        {
            return await SystemLogs
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Select(l => l.Module)
                .Distinct()
                .OrderBy(m => m)
                .ToListAsync();
        }

        public async Task<CleanupResultDto> CleanupOldLogsAsync(int daysOld = 7)
        {
            List<SystemLog> logsToDelete;
            
            if (daysOld == 0)
            {
                // Delete ALL logs
                logsToDelete = await SystemLogs.IgnoreQueryFilters().ToListAsync();
            }
            else
            {
                // Delete logs older than specified days
                var cutoffDate = DateTime.UtcNow.AddDays(-daysOld);
                logsToDelete = await SystemLogs
                    .IgnoreQueryFilters()
                    .Where(l => l.Timestamp < cutoffDate)
                    .ToListAsync();
            }

            var count = logsToDelete.Count;
            
            if (count > 0)
            {
                SystemLogs.RemoveRange(logsToDelete);
                await _context.SaveChangesAsync();
            }

            var message = daysOld == 0 
                ? $"Successfully deleted all {count} logs"
                : $"Successfully deleted {count} logs older than {daysOld} days";

            _logger.LogInformation("Cleaned up {Count} system logs (daysOld={Days})", count, daysOld);

            return new CleanupResultDto
            {
                DeletedCount = count,
                Message = message
            };
        }

        // Quick logging methods
        public Task LogInfoAsync(string message, string module, string action = "other", string? userId = null, string? userName = null, string? entityType = null, string? entityId = null, string? details = null)
            => CreateQuickLogAsync("info", message, module, action, userId, userName, entityType, entityId, details);

        public Task LogWarningAsync(string message, string module, string action = "other", string? userId = null, string? userName = null, string? entityType = null, string? entityId = null, string? details = null)
            => CreateQuickLogAsync("warning", message, module, action, userId, userName, entityType, entityId, details);

        public Task LogErrorAsync(string message, string module, string action = "other", string? userId = null, string? userName = null, string? entityType = null, string? entityId = null, string? details = null)
            => CreateQuickLogAsync("error", message, module, action, userId, userName, entityType, entityId, details);

        public Task LogSuccessAsync(string message, string module, string action = "other", string? userId = null, string? userName = null, string? entityType = null, string? entityId = null, string? details = null)
            => CreateQuickLogAsync("success", message, module, action, userId, userName, entityType, entityId, details);

        private async Task CreateQuickLogAsync(string level, string message, string module, string action, string? userId, string? userName, string? entityType, string? entityId, string? details)
        {
            var log = new SystemLog
            {
                Timestamp = DateTime.UtcNow,
                Level = level,
                Message = message,
                Module = module,
                Action = action,
                UserId = userId,
                UserName = userName,
                EntityType = entityType,
                EntityId = entityId,
                Details = details
            };

            await PersistLogResilientlyAsync(log, "CreateQuickLogAsync");
        }

        /// <summary>
        /// Persist a SystemLog while tolerating missing/invalid tenant context.
        /// If the primary save fails (e.g. view-all mode without X-Target-Tenant,
        /// detached entries, transient DB errors) we detach the entity, stamp a
        /// safe fallback TenantId (0 = system/global) and retry once. If that
        /// also fails, we swallow the exception so logging never breaks callers.
        /// </summary>
        private async Task PersistLogResilientlyAsync(SystemLog log, string source)
        {
            try
            {
                SystemLogs.Add(log);
                await _context.SaveChangesAsync();
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SystemLog primary persist failed in {Source}; retrying with fallback tenant", source);
                // Detach the failed entry so we can retry cleanly
                try
                {
                    var entry = _context.Entry(log);
                    if (entry.State != EntityState.Detached)
                    {
                        entry.State = EntityState.Detached;
                    }
                }
                catch { /* best-effort detach */ }
            }

            // Fallback path: explicitly stamp a safe tenant id (0 = system/global)
            // and try again. Wrap in try/catch so logging never throws to callers.
            // Temporarily switch the DbContext tenant to 0 so StampTenantIdOnNewEntities
            // does not re-throw the "view-all mode" guard or overwrite our fallback id.
            var previousTenantId = _context.GetTenantId();
            try
            {
                _context.SetTenantId(0);
                var fallback = new SystemLog
                {
                    TenantId = 0,
                    Timestamp = log.Timestamp == default ? DateTime.UtcNow : log.Timestamp,
                    Level = string.IsNullOrEmpty(log.Level) ? "error" : log.Level,
                    Message = string.IsNullOrEmpty(log.Message)
                        ? "(system log written without tenant context)"
                        : log.Message,
                    Module = string.IsNullOrEmpty(log.Module) ? "System" : log.Module,
                    Action = string.IsNullOrEmpty(log.Action) ? "other" : log.Action,
                    UserId = log.UserId,
                    UserName = log.UserName,
                    EntityType = log.EntityType,
                    EntityId = log.EntityId,
                    Details = log.Details,
                    IpAddress = log.IpAddress,
                    UserAgent = log.UserAgent,
                    Metadata = log.Metadata
                };

                SystemLogs.Add(fallback);
                await _context.SaveChangesAsync();

                // Mirror the persisted Id back so callers (CreateLogAsync) get a usable DTO
                log.Id = fallback.Id;
                log.TenantId = fallback.TenantId;
            }
            catch (Exception fallbackEx)
            {
                // Last resort: never break the caller because of logging.
                _logger.LogWarning(fallbackEx, "SystemLog fallback persist also failed in {Source}; dropping log entry", source);
            }
            finally
            {
                // Always restore the original tenant context so we don't leak
                // tenant=0 into subsequent queries on this scoped DbContext.
                try { _context.SetTenantId(previousTenantId); } catch { /* ignore */ }
            }
        }

        private static SystemLogDto MapToDto(SystemLog log)
        {
            return new SystemLogDto
            {
                Id = log.Id,
                Timestamp = log.Timestamp,
                Level = log.Level,
                Message = log.Message,
                Module = log.Module,
                Action = log.Action,
                UserId = log.UserId,
                UserName = log.UserName,
                EntityType = log.EntityType,
                EntityId = log.EntityId,
                Details = log.Details,
                IpAddress = log.IpAddress,
                UserAgent = log.UserAgent,
                Metadata = !string.IsNullOrEmpty(log.Metadata) 
                    ? JsonSerializer.Deserialize<object>(log.Metadata) 
                    : null
            };
        }

        private static string ValidateLevel(string level)
        {
            var validLevels = new[] { "info", "warning", "error", "success" };
            return validLevels.Contains(level.ToLower()) ? level.ToLower() : "info";
        }

        private static string ValidateAction(string action)
        {
            var validActions = new[] { "create", "read", "update", "delete", "login", "logout", "export", "import", "other" };
            return validActions.Contains(action.ToLower()) ? action.ToLower() : "other";
        }
    }
}
