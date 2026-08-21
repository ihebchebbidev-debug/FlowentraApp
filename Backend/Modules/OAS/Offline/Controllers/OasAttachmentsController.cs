using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Offline.DTOs;
using MyApi.Modules.OAS.Offline.Services;

namespace MyApi.Modules.OAS.Offline.Controllers;

[Route("api/oas/attachments")]
public class OasAttachmentsController : OasControllerBase
{
    // Shop-floor photo/document attachments only — not a general-purpose
    // upload target. Sits in the same band as the socle's own generic
    // upload caps (16MB UploadController, 50MB DocumentsController).
    private const long MaxAttachmentSizeBytes = 25L * 1024 * 1024;

    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "application/pdf",
    };

    private readonly IOasOfflineSyncService _service;
    public OasAttachmentsController(IOasOfflineSyncService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<OasAttachmentDto>> Create([FromBody] OasAttachmentRequestDto request)
    {
        // The actual bytes were already uploaded elsewhere (UploadThing or
        // the socle's local /uploads endpoint, per OasAttachment's model
        // doc) — this endpoint only records metadata about that upload, but
        // every field is still client-asserted and was previously trusted
        // with no validation at all.
        if (request.SizeBytes is null || request.SizeBytes < 0 || request.SizeBytes > MaxAttachmentSizeBytes)
        {
            return Problem(StatusCodes.Status400BadRequest, "invalid_size_bytes",
                $"sizeBytes must be present, non-negative, and no more than {MaxAttachmentSizeBytes} bytes.");
        }

        if (string.IsNullOrWhiteSpace(request.MimeType) || !AllowedMimeTypes.Contains(request.MimeType))
        {
            return Problem(StatusCodes.Status400BadRequest, "invalid_mime_type",
                $"mimeType must be one of: {string.Join(", ", AllowedMimeTypes)}.");
        }

        if (!IsSafeAttachmentPath(request.Path))
        {
            return Problem(StatusCodes.Status400BadRequest, "invalid_path",
                "path must be a relative path under the upload root (e.g. /uploads/...) or an https URL, without any '..' segment.");
        }

        return Ok(await _service.CreateAttachmentAsync(CurrentTenantId, CurrentOasUserId, request));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OasAttachmentDto>>> GetAll([FromQuery] string entity, [FromQuery] Guid id)
        => Ok(await _service.GetAttachmentsAsync(CurrentTenantId, entity, id));

    /// <summary>
    /// Basic path-traversal guard. A "..", anywhere, is always rejected.
    /// Otherwise a value is only accepted if it is either a relative path
    /// under the socle's local upload root ("/uploads/...", matching the
    /// convention every other module's own upload endpoint already writes
    /// — e.g. DocumentsController, WBUploadController) or a well-formed
    /// https URL (UploadThing-hosted files) — never a bare filesystem path,
    /// a file:// URI, or any other scheme.
    /// </summary>
    private static bool IsSafeAttachmentPath(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return false;
        if (path.Contains("..", StringComparison.Ordinal)) return false;

        if (Uri.TryCreate(path, UriKind.Absolute, out var uri))
        {
            return uri.Scheme == Uri.UriSchemeHttps;
        }

        return path.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase);
    }
}
