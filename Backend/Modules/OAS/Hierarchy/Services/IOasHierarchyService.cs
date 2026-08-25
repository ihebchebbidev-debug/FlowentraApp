using MyApi.Modules.OAS.Hierarchy.DTOs;

namespace MyApi.Modules.OAS.Hierarchy.Services;

public interface IOasHierarchyService
{
    Task<IReadOnlyList<OasSiteDto>> GetSitesAsync(int tenantId, bool includeArchived = false);
    Task<(bool success, string? error, OasSiteDto? dto)> CreateSiteAsync(int tenantId, OasSiteRequestDto request);
    Task<bool> UpdateSiteAsync(int tenantId, Guid id, OasSiteRequestDto request);
    Task<(bool success, string? error)> ArchiveSiteAsync(int tenantId, Guid id);
    Task<(bool success, string? error)> RestoreSiteAsync(int tenantId, Guid id);

    Task<IReadOnlyList<OasZoneDto>> GetZonesAsync(int tenantId, Guid? siteId, bool includeArchived = false);
    Task<(bool success, string? error, OasZoneDto? dto)> CreateZoneAsync(int tenantId, OasZoneRequestDto request);
    Task<bool> UpdateZoneAsync(int tenantId, Guid id, OasZoneRequestDto request);
    Task<(bool success, string? error)> ArchiveZoneAsync(int tenantId, Guid id);
    Task<(bool success, string? error)> RestoreZoneAsync(int tenantId, Guid id);

    Task<IReadOnlyList<OasLineDto>> GetLinesAsync(int tenantId, Guid? zoneId, bool includeArchived = false);
    Task<(bool success, string? error, OasLineDto? dto)> CreateLineAsync(int tenantId, OasLineRequestDto request);
    Task<bool> UpdateLineAsync(int tenantId, Guid id, OasLineRequestDto request);
    Task<(bool success, string? error)> ArchiveLineAsync(int tenantId, Guid id);
    Task<(bool success, string? error)> RestoreLineAsync(int tenantId, Guid id);

    Task<IReadOnlyList<OasPostDto>> GetPostsAsync(int tenantId, Guid? lineId, bool includeArchived = false);
    Task<OasPostDto?> GetPostAsync(int tenantId, Guid id);
    Task<OasPostDto?> GetPostByCodeAsync(int tenantId, string code);
    Task<(bool success, string? error, OasPostDto? dto)> CreatePostAsync(int tenantId, OasPostRequestDto request);
    Task<bool> UpdatePostAsync(int tenantId, Guid id, OasPostRequestDto request);
    Task<bool> UpdatePostAttributesAsync(int tenantId, Guid id, OasPostAttributesRequestDto request);
    Task<bool> SetPostCriticalAsync(int tenantId, Guid id, bool isCritical);
    Task<(bool success, string? error)> ArchivePostAsync(int tenantId, Guid id);
    Task<(bool success, string? error)> RestorePostAsync(int tenantId, Guid id);
    Task<int> GetPostCapacityAsync(int tenantId, Guid id);

    Task<IReadOnlyList<OasHierarchyTreeSiteDto>> GetTreeAsync(int tenantId);

    Task<OasQrTokenDto?> GetPostQrTokenAsync(int tenantId, Guid postId);
    Task<OasQrTokenDto?> RotatePostQrTokenAsync(int tenantId, Guid postId);
    Task<IReadOnlyList<OasQrTokenDto>> GetQrTokensForLineAsync(int tenantId, Guid? lineId);

    Task<OasCompletenessDto> GetCompletenessAsync(int tenantId);

    Task<IReadOnlyList<OasPostLayoutDto>> GetLayoutAsync(int tenantId, Guid? lineId);
    Task PutLayoutAsync(int tenantId, IReadOnlyList<OasPostLayoutDto> entries);
}
