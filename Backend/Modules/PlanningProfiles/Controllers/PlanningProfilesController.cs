using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.PlanningProfiles.DTOs;
using MyApi.Modules.PlanningProfiles.Services;

namespace MyApi.Modules.PlanningProfiles.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/planning-profiles")]
    public class PlanningProfilesController : ControllerBase
    {
        private readonly IPlanningProfileService _svc;
        public PlanningProfilesController(IPlanningProfileService svc) { _svc = svc; }

        private string CurrentUserId =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "0";

        [HttpGet]
        public async Task<IActionResult> List() => Ok(await _svc.ListAsync(CurrentUserId));

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            var p = await _svc.GetActiveAsync(CurrentUserId);
            return p == null ? NotFound() : Ok(p);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var p = await _svc.GetByIdAsync(id, CurrentUserId);
            return p == null ? NotFound() : Ok(p);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePlanningProfileDto dto)
            => Ok(await _svc.CreateAsync(dto, CurrentUserId));

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePlanningProfileDto dto)
            => Ok(await _svc.UpdateAsync(id, dto, CurrentUserId));

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _svc.DeleteAsync(id, CurrentUserId);
            return NoContent();
        }

        [HttpPut("active/{id:int}")]
        public async Task<IActionResult> SetActive(int id)
        {
            await _svc.SetActiveAsync(id, CurrentUserId);
            return NoContent();
        }
    }
}
