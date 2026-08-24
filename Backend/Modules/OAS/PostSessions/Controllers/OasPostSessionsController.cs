using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.PostSessions.DTOs;
using MyApi.Modules.OAS.PostSessions.Services;

namespace MyApi.Modules.OAS.PostSessions.Controllers;

/// <summary>Post-session lifecycle (open/relay/close/scan/active) — the operator's own shop-floor flow, exclusively called from `session.ts`/`ScanPage.tsx` (mobile). Never a console concern.</summary>
[Route("api/oas/post-sessions")]
[OasPluginGate("OA0003SHOPFLOOR")]
[OasWorkspace("mobile")]
public class OasPostSessionsController : OasControllerBase
{
    private readonly IOasPostSessionService _service;
    public OasPostSessionsController(IOasPostSessionService service) => _service = service;

    [HttpPost("open")]
    public async Task<IActionResult> Open([FromBody] OasOpenSessionRequestDto request)
    {
        var (success, error, dto) = await _service.OpenAsync(CurrentTenantId, CurrentOasUserId, request);
        if (!success) return error == "post_out_of_scope" ? Problem(statusCode: 403, title: error) : Problem(statusCode: 409, title: error ?? "conflict");
        return Ok(dto);
    }

    [HttpPost("{id}/relay")]
    public async Task<IActionResult> Relay(Guid id, [FromBody] OasRelaySessionRequestDto request)
    {
        var (success, error, dto) = await _service.RelayAsync(CurrentTenantId, CurrentOasUserId, CurrentOasRole, id, request);
        if (!success) return error switch
        {
            "not_found" => NotFound(),
            "post_out_of_scope" or "not_your_session" => Problem(statusCode: 403, title: error),
            _ => Problem(statusCode: 409, title: error),
        };
        return Ok(dto);
    }

    [HttpPost("{id}/close")]
    public async Task<IActionResult> Close(Guid id, [FromBody] OasCloseSessionRequestDto request)
    {
        var (success, error, dto) = await _service.CloseAsync(CurrentTenantId, CurrentOasUserId, CurrentOasRole, id, request);
        if (!success) return error switch
        {
            "post_out_of_scope" or "not_your_session" => Problem(statusCode: 403, title: error),
            _ => NotFound(),
        };
        return Ok(dto);
    }

    [HttpGet("active")]
    public async Task<ActionResult<OasPostSessionDto>> Active()
    {
        var dto = await _service.GetActiveAsync(CurrentTenantId, CurrentOasUserId);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost("scan")]
    public async Task<ActionResult<OasScanResultDto>> Scan([FromBody] OasScanRequestDto request) => Ok(await _service.ScanAsync(CurrentTenantId, request));
}
