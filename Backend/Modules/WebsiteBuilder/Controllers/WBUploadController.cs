using MyApi.Modules.WebsiteBuilder.DTOs;
using MyApi.Modules.WebsiteBuilder.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;
using System.Security.Claims;

namespace MyApi.Modules.WebsiteBuilder.Controllers
{
    /// <summary>
    /// Website Builder file upload controller.
    /// Saves files to the local disk under ../uploads/wb_uploads/{folder}/
    /// following the same pattern as the Documents module.
    /// Stores metadata + file path in WB_Media.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WBUploadController : ControllerBase
    {
        private readonly IWBMediaService _mediaService;
        private readonly ILogger<WBUploadController> _logger;
        private readonly IWebHostEnvironment _env;

        // Max file size: 16MB
        private const long MaxFileSize = 16 * 1024 * 1024;

        // Allowed MIME types for website builder
        private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            // Images
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif",
            // Documents
            "application/pdf",
            // Video
            "video/mp4", "video/webm",
            // Audio
            "audio/mpeg", "audio/wav", "audio/ogg",
            // Fonts
            "font/woff", "font/woff2", "application/font-woff", "application/font-woff2"
        };

        // Compressible file types (text-based, SVG, etc.)
        private static readonly HashSet<string> CompressibleContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/svg+xml", "application/pdf"
        };

        public WBUploadController(
            IWBMediaService mediaService,
            ILogger<WBUploadController> logger,
            IWebHostEnvironment env)
        {
            _mediaService = mediaService;
            _logger = logger;
            _env = env;
        }

        /// <summary>
        /// Get the uploads root folder (one level above the backend folder),
        /// same as the Documents module.
        /// </summary>
        private string GetUploadsRoot()
        {
            var backendRoot = _env.ContentRootPath;
            var parentDir = Directory.GetParent(backendRoot)?.FullName ?? backendRoot;
            var uploadsDir = Path.Combine(parentDir, "uploads", "wb_uploads");

            if (!Directory.Exists(uploadsDir))
            {
                Directory.CreateDirectory(uploadsDir);
                _logger.LogInformation("Created WB uploads directory at: {Path}", uploadsDir);
            }

            return uploadsDir;
        }

        /// <summary>
        /// Resolve a DB FilePath to an absolute disk path.
        /// FilePath is stored as "/uploads/wb_uploads/folder/file.ext".
        /// </summary>
        private string ResolveFilePath(string dbFilePath)
        {
            var relative = dbFilePath.TrimStart('/');
            if (relative.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
                relative = relative.Substring("uploads/".Length);
            if (relative.StartsWith("wb_uploads/", StringComparison.OrdinalIgnoreCase))
                relative = relative.Substring("wb_uploads/".Length);

            return Path.Combine(GetUploadsRoot(), relative);
        }

        /// <summary>
        /// Upload a single file for the Website Builder.
        /// Saves to local disk under ../uploads/wb_uploads/{folder}/
        /// and stores metadata in WB_Media. Returns the full media record
        /// including a FileUrl pointing to the download endpoint.
        /// </summary>
        [HttpPost("file")]
        [RequestSizeLimit(16 * 1024 * 1024)]
        public async Task<ActionResult<WBUploadResponseDto>> UploadFile(
            IFormFile file,
            [FromQuery] int? siteId = null,
            [FromQuery] string? folder = null,
            [FromQuery] string? altText = null)
        {
            // Validate file before delegating
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "No file provided" });

            if (file.Length > MaxFileSize)
                return BadRequest(new { error = $"File size exceeds {MaxFileSize / (1024 * 1024)}MB limit" });

            var contentType = file.ContentType ?? "application/octet-stream";
            if (!AllowedContentTypes.Contains(contentType))
                return BadRequest(new { error = $"File type '{contentType}' is not allowed for website builder uploads" });

            _logger.LogInformation("WB Upload: Starting upload for {FileName}, Size: {Size}, SiteId: {SiteId}",
                file.FileName, file.Length, siteId);

            var result = await UploadSingleFileInternal(file, siteId, folder, altText);

            if (!result.Success)
            {
                _logger.LogError("WB Upload: Failed for {FileName}: {Error}", file.FileName, result.Error);
                return StatusCode(500, new { error = result.Error ?? "An error occurred while uploading the file" });
            }

            return Ok(result);
        }

        /// <summary>
        /// Upload multiple files at once for the Website Builder.
        /// </summary>
        [HttpPost("files")]
        [RequestSizeLimit(160 * 1024 * 1024)] // 10 files * 16MB
        public async Task<ActionResult<WBUploadMultipleResponseDto>> UploadFiles(
            [FromForm] List<IFormFile> files,
            [FromQuery] int? siteId = null,
            [FromQuery] string? folder = null)
        {
            try
            {
                if (files == null || files.Count == 0)
                    return BadRequest(new { error = "No files provided" });

                if (files.Count > 10)
                    return BadRequest(new { error = "Maximum 10 files allowed per upload" });

                // Validate all files first
                foreach (var file in files)
                {
                    if (file.Length > MaxFileSize)
                        return BadRequest(new { error = $"File '{file.FileName}' exceeds {MaxFileSize / (1024 * 1024)}MB limit" });

                    var ct = file.ContentType ?? "application/octet-stream";
                    if (!AllowedContentTypes.Contains(ct))
                        return BadRequest(new { error = $"File type '{ct}' for '{file.FileName}' is not allowed" });
                }

                _logger.LogInformation("WB Upload: Batch uploading {Count} files, SiteId: {SiteId}", files.Count, siteId);

                var results = new List<WBUploadResponseDto>();

                foreach (var file in files)
                {
                    // Reuse single-file upload logic via internal method
                    var result = await UploadSingleFileInternal(file, siteId, folder, null);
                    results.Add(result);
                }

                return Ok(new WBUploadMultipleResponseDto
                {
                    Results = results,
                    SuccessCount = results.Count(r => r.Success),
                    FailedCount = results.Count(r => !r.Success)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WB Upload: Error batch uploading files");
                return StatusCode(500, new { error = "An error occurred while uploading files" });
            }
        }

        /// <summary>
        /// GET /api/WBUpload/file/{mediaId} — Download/serve a WB media file.
        /// Auto-decompresses gzipped files on-the-fly.
        /// </summary>
        [HttpGet("file/{mediaId}")]
        [AllowAnonymous] // Public so published sites can reference images
        public async Task<ActionResult> ServeFile(int mediaId)
        {
            try
            {
                var media = await _mediaService.GetMediaByIdInternalAsync(mediaId);
                if (media == null)
                    return NotFound(new { error = "File not found" });

                var fullPath = ResolveFilePath(media.FilePath);

                if (!System.IO.File.Exists(fullPath))
                {
                    _logger.LogWarning("WB Upload: File not found on disk: {Path} (DB Id={Id})", fullPath, mediaId);
                    return NotFound(new { error = "File not found on server" });
                }

                var contentType = media.ContentType ?? "application/octet-stream";

                // If compressed (.gz), decompress on-the-fly
                if (fullPath.EndsWith(".gz", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, true);
                        var gzipStream = new GZipStream(fileStream, CompressionMode.Decompress, leaveOpen: false);
                        return File(gzipStream, contentType, media.OriginalName ?? media.FileName);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "WB Upload: Error decompressing file {Id}", mediaId);
                        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, true);
                        return File(stream, contentType, media.OriginalName ?? media.FileName);
                    }
                }

                // Serve uncompressed file
                var uncompressedStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, true);

                // For images, serve inline (browser displays directly)
                if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                {
                    return File(uncompressedStream, contentType);
                }

                return File(uncompressedStream, contentType, media.OriginalName ?? media.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WB Upload: Error serving file {MediaId}", mediaId);
                return StatusCode(500, new { error = "Error serving file" });
            }
        }

        /// <summary>
        /// Delete a media file. Removes from disk AND soft-deletes from WB_Media.
        /// </summary>
        [HttpDelete("{mediaId}")]
        public async Task<ActionResult> DeleteMedia(int mediaId)
        {
            try
            {
                var media = await _mediaService.GetMediaByIdInternalAsync(mediaId);
                if (media == null)
                    return NotFound(new { error = $"Media with ID {mediaId} not found" });

                // Delete physical file from disk
                var fullPath = ResolveFilePath(media.FilePath);
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                    _logger.LogInformation("WB Upload: Deleted file from disk: {Path}", fullPath);
                }

                // Soft-delete from database
                var deleted = await _mediaService.DeleteMediaAsync(mediaId);
                if (!deleted)
                    return NotFound(new { error = $"Media with ID {mediaId} not found in database" });

                _logger.LogInformation("WB Upload: Media {MediaId} deleted from disk and database", mediaId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WB Upload: Error deleting media {MediaId}", mediaId);
                return StatusCode(500, new { error = "An error occurred while deleting the file" });
            }
        }

        // ── Internal helpers ──

        private async Task<WBUploadResponseDto> UploadSingleFileInternal(
            IFormFile file, int? siteId, string? folder, string? altText)
        {
            try
            {
                var contentType = file.ContentType ?? "application/octet-stream";
                var subFolder = folder ?? "general";
                var targetDir = Path.Combine(GetUploadsRoot(), subFolder);
                if (!Directory.Exists(targetDir))
                    Directory.CreateDirectory(targetDir);

                var safeFileName = SanitizeFileName(file.FileName);
                var uniqueFileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid().ToString("N")[..8]}_{safeFileName}";
                var diskPath = Path.Combine(targetDir, uniqueFileName);

                await using (var stream = new FileStream(diskPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, true))
                {
                    await file.CopyToAsync(stream);
                }

                var relativePath = $"/uploads/wb_uploads/{subFolder}/{uniqueFileName}";
                var actualFileSize = file.Length;

                // Compress if applicable
                if (CompressibleContentTypes.Contains(contentType))
                {
                    try
                    {
                        var compressedPath = diskPath + ".gz";
                        await using (var sourceStream = new FileStream(diskPath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, true))
                        await using (var targetStream = new FileStream(compressedPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, true))
                        await using (var gzipStream = new GZipStream(targetStream, CompressionMode.Compress, leaveOpen: true))
                        {
                            await sourceStream.CopyToAsync(gzipStream, 81920);
                        }
                        System.IO.File.Delete(diskPath);
                        relativePath += ".gz";
                        actualFileSize = new FileInfo(compressedPath).Length;
                    }
                    catch { /* Use uncompressed */ }
                }

                var createDto = new CreateWBMediaRequestDto
                {
                    SiteId = siteId,
                    FileName = safeFileName,
                    OriginalName = file.FileName,
                    FilePath = relativePath,
                    FileUrl = "",
                    FileSize = actualFileSize,
                    ContentType = contentType,
                    Folder = subFolder,
                    AltText = altText
                };

                var currentUser = GetCurrentUser();
                var mediaRecord = await _mediaService.CreateMediaAsync(createDto, currentUser);

                var downloadUrl = $"/api/WBUpload/file/{mediaRecord.Id}";
                await _mediaService.UpdateFileUrlAsync(mediaRecord.Id, downloadUrl);
                mediaRecord.FileUrl = downloadUrl;

                return new WBUploadResponseDto { Success = true, Media = mediaRecord };
            }
            catch (Exception ex)
            {
                return new WBUploadResponseDto
                {
                    Success = false,
                    Error = $"Upload failed for {file.FileName}: {ex.Message}"
                };
            }
        }

        private static string SanitizeFileName(string fileName)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            var sanitized = string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
            while (sanitized.Contains("__"))
                sanitized = sanitized.Replace("__", "_");
            return sanitized.Trim('_');
        }

        private string GetCurrentUser()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value ??
                   User.FindFirst(ClaimTypes.Name)?.Value ??
                   User.FindFirst("email")?.Value ??
                   "system";
        }
    }

    // ── Upload-specific DTOs ──

    public class WBUploadResponseDto
    {
        public bool Success { get; set; }
        public WBMediaResponseDto? Media { get; set; }
        public string? Error { get; set; }
    }

    public class WBUploadMultipleResponseDto
    {
        public List<WBUploadResponseDto> Results { get; set; } = new();
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
    }
}