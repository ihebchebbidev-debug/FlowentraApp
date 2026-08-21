using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.OAS.Changeovers.DTOs;
using MyApi.Modules.OAS.Changeovers.Services;
using MyApi.Modules.OAS.Common;

namespace MyApi.Modules.OAS.Changeovers.Controllers;

[Route("api/oas/changeovers")]
[OasPluginGate("OA0004DECLARATIONS")]
public class OasChangeoversController : OasControllerBase
{
    private readonly IOasChangeoverService _service;
    public OasChangeoversController(IOasChangeoverService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> CreateOrUpdate([FromBody] OasChangeoverRequestDto request)
    {
        var (success, error, dto) = await _service.CreateOrUpdateAsync(CurrentTenantId, CurrentOasUserId, request);
        if (!success) return error == "post_out_of_scope" ? Problem(statusCode: 403, title: error) : Problem(statusCode: 409, title: error ?? "conflict");
        return Ok(dto);
    }

    [HttpPut("{id}/finish")]
    public async Task<IActionResult> Finish(Guid id)
    {
        var (success, error, dto) = await _service.FinishAsync(CurrentTenantId, CurrentOasUserId, id);
        if (!success)
        {
            if (error == "not_found") return NotFound();
            if (error == "post_out_of_scope") return Problem(statusCode: 403, title: error);
            return Problem(statusCode: 409, title: error);
        }
        return Ok(dto);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OasChangeoverDto>>> GetAll([FromQuery] Guid? postId, [FromQuery] string? status)
        => Ok(await _service.GetAsync(CurrentTenantId, postId, status));
}
