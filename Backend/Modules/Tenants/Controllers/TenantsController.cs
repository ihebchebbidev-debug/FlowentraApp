using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Infrastructure;
using MyApi.Modules.Tenants.Models;
using MyApi.Modules.Tenants.Services;

namespace MyApi.Modules.Tenants.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TenantsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TenantsController> _logger;
        private readonly TenantSeeder _tenantSeeder;

        public TenantsController(ApplicationDbContext context, ILogger<TenantsController> logger, TenantSeeder tenantSeeder)
        {
            _context = context;
            _logger = logger;
            _tenantSeeder = tenantSeeder;
        }

        /// <summary>
        /// Get the MainAdminUser ID from JWT claims.
        /// Only MainAdminUser (login_type=admin) can manage tenants.
        /// </summary>
        private int? GetMainAdminUserId()
        {
            var loginType = User.FindFirst("login_type")?.Value;
            if (loginType != "admin") return null;

            var userIdClaim = User.FindFirst("UserId")?.Value 
                           ?? User.FindFirst("user_id")?.Value 
                           ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                           ?? User.FindFirst("sub")?.Value;
                           
            if (int.TryParse(userIdClaim, out var userId))
                return userId;

            return null;
        }

        /// <summary>
        /// GET /api/Tenants — List all tenants for the current MainAdminUser.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var adminId = GetMainAdminUserId();
            if (adminId == null)
                return Forbid();

            var tenants = await _context.Tenants
                .Where(t => t.MainAdminUserId == adminId.Value)
                .OrderByDescending(t => t.IsDefault)
                .ThenBy(t => t.CompanyName)
                .ToListAsync();

            return Ok(tenants);
        }

        /// <summary>
        /// GET /api/Tenants/{id} — Get a single tenant by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var adminId = GetMainAdminUserId();
            if (adminId == null) return Forbid();

            var tenant = await _context.Tenants
                .FirstOrDefaultAsync(t => t.Id == id && t.MainAdminUserId == adminId.Value);

            if (tenant == null) return NotFound();
            return Ok(tenant);
        }

        /// <summary>
        /// POST /api/Tenants — Create a new tenant/company.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTenantRequest request)
        {
            var adminId = GetMainAdminUserId();
            if (adminId == null) return Forbid();

            // Validate slug uniqueness
            var slugExists = await _context.Tenants.AnyAsync(t => t.Slug == request.Slug.ToLower());
            if (slugExists)
                return BadRequest(new { message = "A company with this slug already exists." });

            var tenant = new Tenant
            {
                MainAdminUserId = adminId.Value,
                Slug = request.Slug.ToLower().Trim(),
                CompanyName = request.CompanyName,
                CompanyLogoUrl = request.CompanyLogoUrl,
                CompanyWebsite = request.CompanyWebsite,
                CompanyPhone = request.CompanyPhone,
                CompanyAddress = request.CompanyAddress,
                CompanyCountry = request.CompanyCountry,
                Industry = request.Industry,
                IsActive = true,
                IsDefault = false,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            // Refresh cache
            TenantSlugCache.Refresh(_context);

            // Seed default data (LookupItems, Currencies, NumberingSettings) from first tenant
            try
            {
                await _tenantSeeder.SeedForNewTenantAsync(tenant.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Tenant seeding failed for {Slug} (Id={Id}), tenant created but without default data",
                    tenant.Slug, tenant.Id);
            }

            _logger.LogInformation("🏢 Tenant created: {Slug} (Id={Id}) by admin {AdminId}",
                tenant.Slug, tenant.Id, adminId.Value);

            return CreatedAtAction(nameof(GetById), new { id = tenant.Id }, tenant);
        }

        /// <summary>
        /// PUT /api/Tenants/{id} — Update tenant company info.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTenantRequest request)
        {
            var adminId = GetMainAdminUserId();
            if (adminId == null) return Forbid();

            var tenant = await _context.Tenants
                .FirstOrDefaultAsync(t => t.Id == id && t.MainAdminUserId == adminId.Value);

            if (tenant == null) return NotFound();

            // Update fields
            if (request.CompanyName != null) tenant.CompanyName = request.CompanyName;
            if (request.CompanyLogoUrl != null) tenant.CompanyLogoUrl = request.CompanyLogoUrl;
            if (request.CompanyWebsite != null) tenant.CompanyWebsite = request.CompanyWebsite;
            if (request.CompanyPhone != null) tenant.CompanyPhone = request.CompanyPhone;
            if (request.CompanyAddress != null) tenant.CompanyAddress = request.CompanyAddress;
            if (request.CompanyCountry != null) tenant.CompanyCountry = request.CompanyCountry;
            if (request.Industry != null) tenant.Industry = request.Industry;
            if (request.IsActive.HasValue) tenant.IsActive = request.IsActive.Value;
            tenant.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Refresh cache
            TenantSlugCache.Refresh(_context);

            return Ok(tenant);
        }

        /// <summary>
        /// DELETE /api/Tenants/{id} — Soft-delete (deactivate) a tenant.
        /// Cannot delete the default tenant.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var adminId = GetMainAdminUserId();
            if (adminId == null) return Forbid();

            var tenant = await _context.Tenants
                .FirstOrDefaultAsync(t => t.Id == id && t.MainAdminUserId == adminId.Value);

            if (tenant == null) return NotFound();

            if (tenant.IsDefault)
                return BadRequest(new { message = "Cannot delete the default company." });

            tenant.IsActive = false;
            tenant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Refresh cache
            TenantSlugCache.Refresh(_context);

            return Ok(new { message = "Company deactivated successfully." });
        }

        /// <summary>
        /// POST /api/Tenants/{id}/set-default — Set a tenant as the default company.
        /// </summary>
        [HttpPost("{id}/set-default")]
        public async Task<IActionResult> SetDefault(int id)
        {
            var adminId = GetMainAdminUserId();
            if (adminId == null) return Forbid();

            var tenant = await _context.Tenants
                .FirstOrDefaultAsync(t => t.Id == id && t.MainAdminUserId == adminId.Value);

            if (tenant == null) return NotFound();

            // Unset all other defaults for this admin
            var allTenants = await _context.Tenants
                .Where(t => t.MainAdminUserId == adminId.Value)
                .ToListAsync();

            foreach (var t in allTenants)
            {
                t.IsDefault = (t.Id == id);
                t.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            TenantSlugCache.Refresh(_context);

            return Ok(new { message = "Default company updated." });
        }
    }

    // ─── Request DTOs ───

    public class CreateTenantRequest
    {
        public string Slug { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string? CompanyLogoUrl { get; set; }
        public string? CompanyWebsite { get; set; }
        public string? CompanyPhone { get; set; }
        public string? CompanyAddress { get; set; }
        public string? CompanyCountry { get; set; }
        public string? Industry { get; set; }
    }

    public class UpdateTenantRequest
    {
        public string? CompanyName { get; set; }
        public string? CompanyLogoUrl { get; set; }
        public string? CompanyWebsite { get; set; }
        public string? CompanyPhone { get; set; }
        public string? CompanyAddress { get; set; }
        public string? CompanyCountry { get; set; }
        public string? Industry { get; set; }
        public bool? IsActive { get; set; }
    }
}
