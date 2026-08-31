using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.ShopFloorAuth.DTOs;
using MyApi.Modules.OAS.ShopFloorAuth.Services;

namespace MyApi.Modules.OAS.ShopFloorAuth.Controllers;

/// <summary>
/// Console auth (spec §8.2): POST /oas/setup, POST /api/oas/auth/*.
/// Shopfloor login (PIN/QR) is a separate controller (Lot 2) since it lives
/// under api/oas/shopfloor/* rather than api/oas/auth/*.
/// </summary>
[ApiController]
[Route("api/oas")]
public class OasAuthController : ControllerBase
{
    private readonly IOasAuthService _authService;

    public OasAuthController(IOasAuthService authService) => _authService = authService;

    private string OasSlug => HttpContext.Items["OasSlug"] as string
        ?? throw new InvalidOperationException("OasSlug missing — OasTenantMiddleware did not run.");

    private int TenantId => HttpContext.Items.TryGetValue("TenantId", out var v) && v is int i ? i : 0;

    /// <summary>Non-authenticated, one-time only. Refuses if an admin already exists (spec §8.2).</summary>
    [HttpPost("setup")]
    [AllowAnonymous]
    public async Task<ActionResult<OasAuthResponseDto>> Setup([FromBody] OasSetupRequestDto request)
    {
        var result = await _authService.SetupAsync(OasSlug, TenantId, request);
        return result.Success ? Ok(result) : Conflict(result);
    }

    /// <summary>
    /// Non-authenticated bootstrap probe: tells the console whether this
    /// tenant still needs its first admin, so the login screen can show the
    /// sign-up form instead of sign-in (and hide it forever afterwards).
    /// Leaks nothing beyond "an admin exists" — no emails, no names.
    /// </summary>
    [HttpGet("setup/status")]
    [AllowAnonymous]
    public async Task<IActionResult> SetupStatus()
    {
        var hasAdmin = await _authService.HasAdminAsync();
        return Ok(new { success = true, hasAdmin, needsSetup = !hasAdmin });
    }

    /// <summary>
    /// Maintenance escape hatch: deletes the tenant's admin account(s) so
    /// POST /oas/setup can be replayed after the original credentials are
    /// lost. Gated by the `X-Oas-Setup-Secret` header, which must match the
    /// `OAS_SETUP_SECRET` environment variable (falls back to a built-in
    /// value so it works on the shared test tenant).
    /// </summary>
    [HttpPost("setup/reset")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetSetup()
    {
        var expected = Environment.GetEnvironmentVariable("OAS_SETUP_SECRET") ?? "oas-setup-reset-2026";
        var provided = Request.Headers["X-Oas-Setup-Secret"].ToString();
        if (string.IsNullOrEmpty(provided) || provided != expected)
            return Unauthorized(new { success = false, message = "Invalid setup secret." });

        var removed = await _authService.ResetAdminsAsync();
        return Ok(new { success = true, removed, tenant = OasSlug });
    }

    [HttpPost("auth/login")]
    [AllowAnonymous]
    public async Task<ActionResult<OasAuthResponseDto>> Login([FromBody] OasLoginRequestDto request)
    {
        var result = await _authService.LoginAsync(OasSlug, TenantId, request);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpGet("auth/me")]
    [Authorize(AuthenticationSchemes = OasAuthSchemes.SchemeName)]
    public async Task<ActionResult<OasUserDto>> Me()
    {
        var idClaim = User.FindFirst("oas_user_id")?.Value;
        if (!Guid.TryParse(idClaim, out var id)) return Unauthorized();
        var user = await _authService.GetCurrentUserAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    /// <summary>Self-service profile edit — the signed-in user's own display name / email / phone. Privilege fields (role, scope, active) are deliberately absent: those stay on api/oas/operators/*, admin-gated.</summary>
    [HttpPut("auth/me")]
    [Authorize(AuthenticationSchemes = OasAuthSchemes.SchemeName)]
    public async Task<ActionResult<OasAuthResponseDto>> UpdateMe([FromBody] OasUpdateProfileRequestDto request)
    {
        var idClaim = User.FindFirst("oas_user_id")?.Value;
        if (!Guid.TryParse(idClaim, out var id)) return Unauthorized();
        var result = await _authService.UpdateProfileAsync(id, request);
        if (result.Success) return Ok(result);
        return result.Message == "email_already_exists" ? Conflict(result) : BadRequest(result);
    }

    [HttpPost("auth/refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<OasAuthResponseDto>> Refresh([FromBody] OasRefreshRequestDto request)
    {
        var result = await _authService.RefreshAsync(request);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("auth/logout")]
    [Authorize(AuthenticationSchemes = OasAuthSchemes.SchemeName)]
    public async Task<IActionResult> Logout()
    {
        var idClaim = User.FindFirst("oas_user_id")?.Value;
        if (!Guid.TryParse(idClaim, out var id)) return Unauthorized();
        await _authService.LogoutAsync(id);
        return Ok(new { success = true });
    }

    [HttpPost("auth/change-password")]
    [Authorize(AuthenticationSchemes = OasAuthSchemes.SchemeName)]
    public async Task<ActionResult<OasAuthResponseDto>> ChangePassword([FromBody] OasChangePasswordRequestDto request)
    {
        var idClaim = User.FindFirst("oas_user_id")?.Value;
        if (!Guid.TryParse(idClaim, out var id)) return Unauthorized();
        var result = await _authService.ChangePasswordAsync(id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ── Forgot password (emailed OTP, spec §8.2) ────────────────────────────
    // Anonymous by design — the caller has lost access. All three steps answer
    // without revealing whether the address exists.

    [HttpPost("auth/forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<OasAuthResponseDto>> ForgotPassword([FromBody] OasForgotPasswordRequestDto request)
    {
        var result = await _authService.ForgotPasswordAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("auth/verify-reset-otp")]
    [AllowAnonymous]
    public async Task<ActionResult<OasVerifyResetOtpResponseDto>> VerifyResetOtp([FromBody] OasVerifyResetOtpRequestDto request)
    {
        var result = await _authService.VerifyResetOtpAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("auth/reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<OasAuthResponseDto>> ResetPassword([FromBody] OasResetPasswordRequestDto request)
    {
        var result = await _authService.ResetPasswordAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}

