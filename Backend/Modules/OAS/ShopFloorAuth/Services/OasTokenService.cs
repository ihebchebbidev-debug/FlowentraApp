using Microsoft.IdentityModel.Tokens;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.ShopFloorAuth.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MyApi.Modules.OAS.ShopFloorAuth.Services;

public interface IOasTokenService
{
    /// <param name="deviceId">Stable device identifier sent at login; embedded as the `oas_device_id` claim so a single device can later be revoked (EF-M2-09). Null when the client did not identify itself.</param>
    (string accessToken, string refreshToken, DateTimeOffset expiresAt) IssueTokens(OasUser user, string oasSlug, string? deviceId = null);
}

/// <summary>Shared JWT issuance for both console (OasAuthService) and shopfloor (OasShopFloorAuthService) logins — one implementation so the two never drift (spec §3.3, §8.2).</summary>
public class OasTokenService : IOasTokenService
{
    private static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromHours(8);
    private readonly IConfiguration _configuration;

    public OasTokenService(IConfiguration configuration) => _configuration = configuration;

    public (string accessToken, string refreshToken, DateTimeOffset expiresAt) IssueTokens(OasUser user, string oasSlug, string? deviceId = null)
    {
        // Falls back to the built-in OAS key when 'Jwt__Key' is not configured,
        // matching OasModuleRegistration so tokens stay verifiable.
        var jwtKey = _configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey == OasModuleRegistration.OasJwtKeyPlaceholder)
        {
            jwtKey = OasModuleRegistration.OasJwtKeyFallback;
        }
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "MyApi";
        var audience = user.Workspace == OasWorkspace.mobile ? OasAuthSchemes.ShopfloorAudience : OasAuthSchemes.ConsoleAudience;

        var claims = new List<Claim>
        {
            new("oas_user_id", user.Id.ToString()),
            new("oas_slug", oasSlug.Trim().ToLowerInvariant()),
            new("oas_role", user.Role.ToString()),
            new("oas_workspace", user.Workspace.ToString()),
            new(ClaimTypes.Email, user.Email),
        };
        if (!string.IsNullOrWhiteSpace(deviceId)) claims.Add(new Claim("oas_device_id", deviceId.Trim()));
        if (user.ScopeSiteId is not null) claims.Add(new Claim("oas_scope_site_id", user.ScopeSiteId.Value.ToString()));
        if (user.ScopeZoneId is not null) claims.Add(new Claim("oas_scope_zone_id", user.ScopeZoneId.Value.ToString()));
        if (user.ScopeLineId is not null) claims.Add(new Claim("oas_scope_line_id", user.ScopeLineId.Value.ToString()));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTimeOffset.UtcNow.Add(AccessTokenLifetime);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

        var refreshBytes = new byte[64];
        RandomNumberGenerator.Fill(refreshBytes);
        var refreshToken = Convert.ToBase64String(refreshBytes);

        return (accessToken, refreshToken, expiresAt);
    }
}
