using MyApi.Modules.RetenueSource.DTOs;

namespace MyApi.Modules.RetenueSource.Services
{
    public interface IRSService
    {
        // ─── CRUD ───
        Task<PaginatedRSResponse> GetRSRecordsAsync(
            string? entityType = null,
            int? entityId = null,
            int? month = null,
            int? year = null,
            string? status = null,
            string? supplierTaxId = null,
            string? search = null,
            int page = 1,
            int limit = 20
        );

        Task<RSRecordDto?> GetRSRecordByIdAsync(int id);
        Task<RSRecordDto> CreateRSRecordAsync(CreateRSRecordDto dto, string userId);
        Task<RSRecordDto> UpdateRSRecordAsync(int id, UpdateRSRecordDto dto, string userId);
        Task<bool> DeleteRSRecordAsync(int id);

        // ─── Calculation ───
        RSCalculationDto CalculateRS(decimal amountPaid, string rsTypeCode);

        // ─── TEJ Export ───
        Task<TEJExportResponseDto> ExportTEJAsync(TEJExportRequestDto request, string userId);
        Task<List<TEJExportLogDto>> GetTEJExportLogsAsync(int? year = null);

        // ─── Cross-module: create an RS record from a paid supplier invoice ───
        Task<RSRecordDto> CreateForSupplierInvoiceAsync(
            int supplierInvoiceId,
            MyApi.Modules.Purchases.Models.SupplierInvoice invoice,
            MyApi.Modules.Contacts.Models.Contact supplier,
            TEJDeclarantDto declarant,
            string userId);

        // ─── Stats ───
        Task<RSStatsDto> GetRSStatsAsync(string? entityType = null, int? entityId = null, int? month = null, int? year = null);
    }
}
