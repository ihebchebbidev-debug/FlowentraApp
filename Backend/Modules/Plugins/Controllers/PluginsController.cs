using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.Plugins.DTOs;
using MyApi.Modules.Plugins.Services;

namespace MyApi.Modules.Plugins.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/plugins")]
    public class PluginsController : ControllerBase
    {
        private readonly IPluginService _svc;

        public PluginsController(IPluginService svc) { _svc = svc; }

        private int? GetUserId()
        {
            var raw = User?.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? User?.FindFirstValue("sub")
                   ?? User?.FindFirstValue("id");
            return int.TryParse(raw, out var id) ? id : (int?)null;
        }

        [HttpGet]
        public async Task<IActionResult> List() =>
            Ok(new { success = true, data = await _svc.GetActivationsAsync() });

        [HttpGet("stats")]
        public async Task<IActionResult> Stats() =>
            Ok(new { success = true, data = await _svc.GetStatsAsync() });

        [HttpPatch("{code}")]
        public async Task<IActionResult> Toggle(string code, [FromBody] PluginToggleRequest body)
        {
            try
            {
                var dto = await _svc.SetActivationAsync(code, body.IsEnabled, GetUserId());
                return Ok(new { success = true, data = dto });
            }
            catch (PluginCoreLockedException ex)
            {
                return BadRequest(new { success = false, error = "coreLocked", message = ex.Message, code = ex.Code });
            }
            catch (PluginDependencyConflictException ex)
            {
                return Conflict(new
                {
                    success = false,
                    error = "dependencyConflict",
                    message = ex.Message,
                    code = ex.Code,
                    blockingDependents = ex.BlockingDependents,
                });
            }
            catch (PluginUnknownException ex)
            {
                return NotFound(new { success = false, error = "unknown", message = ex.Message });
            }
        }

        [HttpPost("bulk")]
        public async Task<IActionResult> Bulk([FromBody] PluginBulkToggleRequest body)
        {
            var data = await _svc.BulkSetAsync(body.Codes ?? new(), body.IsEnabled, GetUserId());
            return Ok(new { success = true, data });
        }
    }
}
