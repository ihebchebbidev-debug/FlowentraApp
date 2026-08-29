using MyApi.Modules.OAS.ShopFloorAuth.DTOs;

namespace MyApi.Modules.OAS.ShopFloorAuth.Services;

public interface IOasAuthService
{
    Task<OasAuthResponseDto> SetupAsync(string oasSlug, int tenantId, OasSetupRequestDto request);
    /// <summary>Maintenance: hard-deletes every admin of the current tenant so /oas/setup can run again. Secret-gated at the controller.</summary>
    Task<int> ResetAdminsAsync();
    Task<bool> HasAdminAsync();
    Task<OasAuthResponseDto> LoginAsync(string oasSlug, int tenantId, OasLoginRequestDto request);
    Task<OasUserDto?> GetCurrentUserAsync(Guid oasUserId);
    Task<OasAuthResponseDto> RefreshAsync(OasRefreshRequestDto request);
    Task<bool> LogoutAsync(Guid oasUserId);
    Task<OasAuthResponseDto> ChangePasswordAsync(Guid oasUserId, OasChangePasswordRequestDto request);
    Task<OasAuthResponseDto> ForgotPasswordAsync(OasForgotPasswordRequestDto request);
    Task<OasVerifyResetOtpResponseDto> VerifyResetOtpAsync(OasVerifyResetOtpRequestDto request);
    Task<OasAuthResponseDto> ResetPasswordAsync(OasResetPasswordRequestDto request);
}
