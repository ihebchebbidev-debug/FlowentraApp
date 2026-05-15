using MyApi.Modules.ServiceOrders.DTOs;
using MyApi.Modules.Dispatches.DTOs;

namespace MyApi.Modules.ServiceOrders.Services
{
    public interface IServiceOrderService
    {
        Task<ServiceOrderDto> CreateFromSaleAsync(int saleId, CreateServiceOrderDto createDto, string userId);
        Task<PaginatedServiceOrderResponse> GetServiceOrdersAsync(
            string? status = null,
            string? priority = null,
            int? contactId = null,
            int? saleId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            string? paymentStatus = null,
            string? search = null,
            int page = 1,
            int limit = 20,
            string sortBy = "created_at",
            string sortOrder = "desc"
        );
        Task<ServiceOrderDto?> GetServiceOrderByIdAsync(int id, bool includeJobs = true);
        Task<ServiceOrderJobDto?> GetServiceOrderJobAsync(int serviceOrderId, int jobId);
        Task<ServiceOrderJobDto> PatchServiceOrderJobStatusAsync(int serviceOrderId, int jobId, UpdateServiceOrderJobStatusDto dto, string userId);
        Task<ServiceOrderJobDto> UpdateServiceOrderJobAsync(int serviceOrderId, int jobId, UpdateServiceOrderJobDto dto, string userId);
        Task<ServiceOrderDto> UpdateServiceOrderAsync(int id, UpdateServiceOrderDto updateDto, string userId);
        Task<ServiceOrderDto> PatchServiceOrderAsync(int id, UpdateServiceOrderDto updateDto, string userId);
        Task<ServiceOrderDto> UpdateStatusAsync(int id, UpdateServiceOrderStatusDto statusDto, string userId);
        Task<ServiceOrderDto> ApproveAsync(int id, ApproveServiceOrderDto approveDto, string userId);
        Task<ServiceOrderDto> CompleteAsync(int id, CompleteServiceOrderDto completeDto, string userId);
        Task<ServiceOrderDto> CancelAsync(int id, CancelServiceOrderDto cancelDto, string userId);
        Task<bool> DeleteAsync(int id, string userId);
        Task<ServiceOrderStatsDto> GetStatisticsAsync(DateTime? startDate = null, DateTime? endDate = null, string? status = null, int? contactId = null);
        
        // Aggregation methods
        Task<List<DispatchDto>> GetDispatchesForServiceOrderAsync(int serviceOrderId);
        Task<List<TimeEntryDto>> GetTimeEntriesForServiceOrderAsync(int serviceOrderId);
        Task<List<ExpenseDto>> GetExpensesForServiceOrderAsync(int serviceOrderId);
        Task<List<MaterialDto>> GetMaterialsForServiceOrderAsync(int serviceOrderId);
        Task<List<NoteDto>> GetNotesForServiceOrderAsync(int serviceOrderId);
        Task<ServiceOrderFullSummaryDto> GetFullSummaryAsync(int serviceOrderId);
        
        // Material management
        Task<ServiceOrderMaterialDto> AddMaterialAsync(int serviceOrderId, CreateServiceOrderMaterialDto dto, string userId);
        Task<ServiceOrderMaterialDto?> UpdateMaterialAsync(int serviceOrderId, int materialId, UpdateServiceOrderMaterialDto dto, string userId);
        Task<bool> DeleteMaterialAsync(int serviceOrderId, int materialId, string userId);
        
        // Time entry management (direct on service order)
        Task<ServiceOrderTimeEntryDto> AddTimeEntryAsync(int serviceOrderId, CreateServiceOrderTimeEntryDto dto, string userId);
        Task<bool> DeleteTimeEntryAsync(int serviceOrderId, int timeEntryId, string userId);
        
        // Expense management (direct on service order)
        Task<ServiceOrderExpenseDto> AddExpenseAsync(int serviceOrderId, CreateServiceOrderExpenseDto dto, string userId);
        Task<bool> DeleteExpenseAsync(int serviceOrderId, int expenseId, string userId);
        
        // Invoice preparation
        Task<ServiceOrderDto> PrepareForInvoiceAsync(int id, PrepareInvoiceDto dto, string userId);
    }
}
