using MyApi.Modules.OAS.ShopFloorAuth.DTOs;

namespace MyApi.Modules.OAS.ShopFloorAuth.Services;

public interface IOasAuthService
{
    Task<OasAuthResponseDto> SetupAsync(string oasSlug, int tenantId, OasSetupRequestDto request);
    /// <summary>Maintenance: hard-deletes every admin of the current tenant so /oas/setup can run again. Secret-gated at the controller.</summary>
    Task<int> ResetAdminsAsync();
    Task<OasAuthResponseDto> LoginAsync(string oasSlug, int tenantId, OasLoginRequestDto request);
    Task<OasUserDto?> GetCurrentUserAsync(Guid oasUserId);
    Task<OasAuthResponseDto> RefreshAsync(OasRefreshRequestDto request);
    Task<bool> LogoutAsync(Guid oasUserId);
    Task<OasAuthResponseDto> ChangePasswordAsync(Guid oasUserId, OasChangePasswordRequestDto request);
}
