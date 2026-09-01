using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Causes.Models;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Equipments.Models;
using MyApi.Modules.OAS.Imports.DTOs;
using MyApi.Modules.OAS.Imports.Models;
using MyApi.Modules.OAS.Products.Models;
using System.Text.Json;

namespace MyApi.Modules.OAS.Imports.Services;

public interface IOasImportService
{
    Task<IReadOnlyList<OasImportDto>> GetAllAsync(int tenantId);
    Task<OasImportDto?> GetOneAsync(int tenantId, Guid id);
    Task<IReadOnlyList<OasImportLineDto>> GetLinesAsync(int tenantId, Guid id);
    Task<(bool success, string? error, OasImportDto? dto)> CreateAsync(int tenantId, Guid? importedBy, OasImportCreateRequestDto request);
    Task<(bool success, string? error, OasImportDto? dto)> CommitAsync(int tenantId, Guid id);
}

/// <summary>
/// v12 decision: `commit` returns 400 for an unsupported `datasetType`
/// instead of silently accepting-and-doing-nothing like `ImportPanel.tsx`
/// does today for "posts"/"orders". Supported types are exactly the ones
/// with a real mapping below — nothing is accepted "for later".
/// </summary>
public class OasImportService : IOasImportService
{
    private static readonly HashSet<string> SupportedKinds = new(StringComparer.OrdinalIgnoreCase) { "products", "causes", "equipment" };

    /// <summary>Hard cap on rows accepted per import — <see cref="OasImportCreateRequestDto.Rows"/> had no size limit, so an unbounded payload could be posted straight into <c>oas_import_lines</c> (one row per line) before any processing even begins.</summary>
    private const int MaxRows = 5_000;

    private readonly OasDbContext _db;
    public OasImportService(OasDbContext db) => _db = db;

    public async Task<IReadOnlyList<OasImportDto>> GetAllAsync(int tenantId)
    {
        var rows = await _db.Set<OasImport>().OrderByDescending(i => i.CreatedAt).ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    public async Task<OasImportDto?> GetOneAsync(int tenantId, Guid id)
    {
        var import = await _db.Set<OasImport>().FindAsync(id);
        return import is null ? null : ToDto(import);
    }

    public async Task<IReadOnlyList<OasImportLineDto>> GetLinesAsync(int tenantId, Guid id)
    {
        var rows = await _db.Set<OasImportLine>().Where(l => l.ImportId == id).OrderBy(l => l.RowNumber).ToListAsync();
        return rows.Select(l => new OasImportLineDto { RowNumber = l.RowNumber, Status = l.Status, Error = l.Error }).ToList();
    }

    public async Task<(bool success, string? error, OasImportDto? dto)> CreateAsync(int tenantId, Guid? importedBy, OasImportCreateRequestDto request)
    {
        if (!SupportedKinds.Contains(request.Kind))
        {
            return (false, $"unsupported_dataset_type: {request.Kind}", null);
        }

        if (request.Rows.Count > MaxRows)
        {
            return (false, "too_many_rows", null);
        }

        var import = new OasImport { TenantId = tenantId, Kind = request.Kind, Status = OasImportStatus.pending, RowsTotal = request.Rows.Count, ImportedBy = importedBy };
        _db.Set<OasImport>().Add(import);
        await _db.SaveChangesAsync();

        var rowNumber = 0;
        foreach (var row in request.Rows)
        {
            rowNumber++;
            _db.Set<OasImportLine>().Add(new OasImportLine
            {
                TenantId = tenantId, ImportId = import.Id, RowNumber = rowNumber,
                Raw = JsonSerializer.Serialize(row), Status = "pending",
            });
        }
        await _db.SaveChangesAsync();

        return (true, null, ToDto(import));
    }

    public async Task<(bool success, string? error, OasImportDto? dto)> CommitAsync(int tenantId, Guid id)
    {
        var import = await _db.Set<OasImport>().FindAsync(id);
        if (import is null) return (false, "not_found", null);
        if (import.Status == OasImportStatus.committed) return (true, null, ToDto(import)); // idempotent

        if (!SupportedKinds.Contains(import.Kind))
        {
            return (false, $"unsupported_dataset_type: {import.Kind}", null);
        }

        var lines = await _db.Set<OasImportLine>().Where(l => l.ImportId == id).OrderBy(l => l.RowNumber).ToListAsync();
        var ok = 0; var errors = 0;

        // Per-row isolation (EF-M6-08). Previously every row was only staged
        // with Add() and a single SaveChangesAsync ran at the very end, so a
        // row that passed the in-memory mapping but violated a DB constraint
        // (duplicate reference, bad enum, FK) threw at flush time and rolled
        // back the ENTIRE sheet — 4999 valid rows lost because of one typo,
        // while the per-line "error" statuses this code carefully computed
        // were rolled back with it.
        //
        // Now each row is written inside its own savepoint: a failing row is
        // rolled back to the savepoint alone, marked "error" with its message,
        // and the import continues. Partial success is the documented
        // behaviour — the caller sees rowsOk / rowsError and can fix and
        // re-import only the rejected rows.
        await using var tx = await _db.Database.BeginTransactionAsync();

        foreach (var line in lines)
        {
            const string savepoint = "oas_import_row";
            await tx.CreateSavepointAsync(savepoint);
            try
            {
                var row = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(line.Raw) ?? new();
                switch (import.Kind.ToLowerInvariant())
                {
                    case "products": CommitProductRow(tenantId, row); break;
                    case "causes": CommitCauseRow(tenantId, row); break;
                    case "equipment": CommitEquipmentRow(tenantId, row); break;
                }
                await _db.SaveChangesAsync();
                await tx.ReleaseSavepointAsync(savepoint);
                line.Status = "ok";
                ok++;
            }
            catch (Exception ex)
            {
                await tx.RollbackToSavepointAsync(savepoint);
                // The failed entity is still tracked as Added after a rollback
                // and would be retried (and fail again) on the next flush —
                // detach everything still pending so the next row starts clean.
                DetachPending();
                line.Status = "error";
                line.Error = RootMessage(ex);
                errors++;
            }
        }

        import.RowsOk = ok;
        import.RowsError = errors;
        import.Status = OasImportStatus.committed;
        import.CommittedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return (true, null, ToDto(import));
    }

    /// <summary>Drops entities staged by a row that failed, so they don't leak into the next row's flush.</summary>
    private void DetachPending()
    {
        foreach (var entry in _db.ChangeTracker.Entries().Where(e => e.State == EntityState.Added).ToList())
        {
            entry.State = EntityState.Detached;
        }
    }

    /// <summary>Postgres puts the actionable text (constraint name, detail) on the inner exception; EF's own wrapper message is generic.</summary>
    private static string RootMessage(Exception ex)
    {
        var inner = ex;
        while (inner.InnerException is not null) inner = inner.InnerException;
        return inner.Message.Length > 500 ? inner.Message[..500] : inner.Message;
    }

    private static string RequireString(Dictionary<string, JsonElement> row, string key)
        => row.TryGetValue(key, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString()! : throw new InvalidOperationException($"missing or invalid '{key}'");

    private static string? OptString(Dictionary<string, JsonElement> row, string key)
        => row.TryGetValue(key, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private void CommitProductRow(int tenantId, Dictionary<string, JsonElement> row)
    {
        _db.Set<OasProduct>().Add(new OasProduct
        {
            TenantId = tenantId, Reference = RequireString(row, "reference"), Name = RequireString(row, "name"),
            Customer = OptString(row, "customer"), Unit = OptString(row, "unit") ?? "pcs",
        });
    }

    private void CommitCauseRow(int tenantId, Dictionary<string, JsonElement> row)
    {
        _db.Set<OasCause>().Add(new OasCause
        {
            TenantId = tenantId, Domain = Enum.Parse<OasCauseDomain>(RequireString(row, "domain"), true),
            Code = RequireString(row, "code"), LabelFr = RequireString(row, "labelFr"), LabelAr = OptString(row, "labelAr") ?? RequireString(row, "labelFr"),
        });
    }

    private void CommitEquipmentRow(int tenantId, Dictionary<string, JsonElement> row)
    {
        _db.Set<OasEquipment>().Add(new OasEquipment
        {
            TenantId = tenantId, Code = RequireString(row, "code"), Name = RequireString(row, "name"),
            SerialNumber = OptString(row, "serialNumber"), Manufacturer = OptString(row, "manufacturer"),
        });
    }

    private static OasImportDto ToDto(OasImport i) => new()
    {
        Id = i.Id, Kind = i.Kind, Status = i.Status.ToString(),
        RowsTotal = i.RowsTotal, RowsOk = i.RowsOk, RowsError = i.RowsError, CreatedAt = i.CreatedAt,
    };
}
