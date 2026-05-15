using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.Purchases.DTOs;
using MyApi.Modules.Purchases.Services;
using MyApi.Modules.Shared.Services;
using System.Security.Claims;

namespace MyApi.Modules.Purchases.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/supplier-invoices")]
    public class SupplierInvoicesController : ControllerBase
    {
        private readonly ISupplierInvoiceService _service;
        private readonly ISystemLogService _systemLogService;
        private readonly ILogger<SupplierInvoicesController> _logger;

        public SupplierInvoicesController(ISupplierInvoiceService service, ISystemLogService systemLogService, ILogger<SupplierInvoicesController> logger)
        {
            _service = service;
            _systemLogService = systemLogService;
            _logger = logger;
        }

        private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        private string GetUserName() => User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value ?? "anonymous";

        [HttpGet]
        public async Task<IActionResult> GetInvoices(
            [FromQuery] string? status = null, [FromQuery] string? supplier_id = null,
            [FromQuery] bool? rs_applicable = null, [FromQuery] DateTime? date_from = null,
            [FromQuery] DateTime? date_to = null, [FromQuery] string? search = null,
            [FromQuery] int page = 1, [FromQuery] int limit = 20,
            [FromQuery] string sort_by = "created_date", [FromQuery] string sort_order = "desc")
        {
            try
            {
                var result = await _service.GetInvoicesAsync(status, supplier_id, rs_applicable, date_from, date_to, search, page, limit, sort_by, sort_order);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplier invoices");
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetInvoice(int id)
        {
            try
            {
                var invoice = await _service.GetInvoiceByIdAsync(id);
                if (invoice == null) return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Invoice not found" } });
                return Ok(new { success = true, data = invoice });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplier invoice {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateSupplierInvoiceDto dto)
        {
            try
            {
                var userId = GetUserId();
                var invoice = await _service.CreateInvoiceAsync(dto, userId, GetUserName());
                await _systemLogService.LogSuccessAsync($"Supplier invoice created: {invoice.InvoiceNumber}", "Purchases", "create", userId, GetUserName(), "SupplierInvoice", invoice.Id.ToString());
                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, new { success = true, data = invoice });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } });
            }
            // Cross-supplier mismatch / orphan PO-item linkage / missing PO ref — these are
            // user-correctable validation errors thrown by the service. Surface them as 400
            // with the actual message instead of a generic 500.
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = new { code = "VALIDATION_ERROR", message = ex.Message } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating supplier invoice");
                await _systemLogService.LogErrorAsync("Failed to create supplier invoice", "Purchases", "create", GetUserId(), GetUserName(), details: ex.Message);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpPatch("{id:int}")]
        public async Task<IActionResult> UpdateInvoice(int id, [FromBody] UpdateSupplierInvoiceDto dto)
        {
            try
            {
                var userId = GetUserId();
                var invoice = await _service.UpdateInvoiceAsync(id, dto, userId, GetUserName());
                await _systemLogService.LogSuccessAsync($"Supplier invoice updated: {invoice.InvoiceNumber}", "Purchases", "update", userId, GetUserName(), "SupplierInvoice", id.ToString());
                return Ok(new { success = true, data = invoice });
            }
            catch (KeyNotFoundException) { return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Invoice not found" } }); }
            catch (InvalidOperationException ex) { return Conflict(new { success = false, error = new { code = "INVALID_TRANSITION", message = ex.Message } }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating supplier invoice {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            try
            {
                var userId = GetUserId();
                if (!await _service.DeleteInvoiceAsync(id, userId, GetUserName()))
                    return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Invoice not found" } });
                await _systemLogService.LogSuccessAsync($"Supplier invoice deleted: {id}", "Purchases", "delete", userId, GetUserName(), "SupplierInvoice", id.ToString());
                return Ok(new { success = true, message = "Deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting supplier invoice {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        // Mark invoice as synced to TEJ (Tunisian e-tax journal).
        // Persists tej_synced=true, tej_sync_date=now, tej_sync_status='synced'.
        [HttpPost("{id:int}/tej-sync")]
        public async Task<IActionResult> SyncTej(int id)
        {
            try
            {
                var userId = GetUserId();
                var dto = new UpdateSupplierInvoiceDto
                {
                    TejSynced = true,
                    TejSyncDate = DateTime.UtcNow,
                    TejSyncStatus = "synced",
                };
                var invoice = await _service.UpdateInvoiceAsync(id, dto, userId, GetUserName());
                await _systemLogService.LogSuccessAsync($"Supplier invoice TEJ-synced: {invoice.InvoiceNumber}", "Purchases", "update", userId, GetUserName(), "SupplierInvoice", id.ToString());
                return Ok(new { success = true, data = invoice });
            }
            catch (KeyNotFoundException) { return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Invoice not found" } }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error TEJ-syncing invoice {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        // Mark invoice as sent to Facture en Ligne.
        [HttpPost("{id:int}/facture-en-ligne")]
        public async Task<IActionResult> SendFactureEnLigne(int id)
        {
            try
            {
                var userId = GetUserId();
                var dto = new UpdateSupplierInvoiceDto
                {
                    FactureEnLigneStatus = "sent",
                    FactureEnLigneSentAt = DateTime.UtcNow,
                };
                var invoice = await _service.UpdateInvoiceAsync(id, dto, userId, GetUserName());
                await _systemLogService.LogSuccessAsync($"Facture en ligne sent: {invoice.InvoiceNumber}", "Purchases", "update", userId, GetUserName(), "SupplierInvoice", id.ToString());
                return Ok(new { success = true, data = invoice });
            }
            catch (KeyNotFoundException) { return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Invoice not found" } }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending facture en ligne for invoice {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        // ── Items (only allowed when invoice.status == 'draft') ──
        [HttpPost("{id:int}/items")]
        public async Task<IActionResult> AddItem(int id, [FromBody] CreateSupplierInvoiceItemDto dto)
        {
            try
            {
                var item = await _service.AddItemAsync(id, dto);
                return Ok(new { success = true, data = item });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }); }
            catch (InvalidOperationException ex) { return BadRequest(new { success = false, error = new { code = "BAD_REQUEST", message = ex.Message } }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding item to invoice {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpPatch("{id:int}/items/{itemId:int}")]
        public async Task<IActionResult> UpdateItem(int id, int itemId, [FromBody] CreateSupplierInvoiceItemDto dto)
        {
            try
            {
                var item = await _service.UpdateItemAsync(id, itemId, dto);
                return Ok(new { success = true, data = item });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }); }
            catch (InvalidOperationException ex) { return BadRequest(new { success = false, error = new { code = "BAD_REQUEST", message = ex.Message } }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating item {ItemId} on invoice {Id}", itemId, id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpDelete("{id:int}/items/{itemId:int}")]
        public async Task<IActionResult> DeleteItem(int id, int itemId)
        {
            try
            {
                if (!await _service.DeleteItemAsync(id, itemId))
                    return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Item not found" } });
                return Ok(new { success = true, message = "Deleted" });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }); }
            catch (InvalidOperationException ex) { return BadRequest(new { success = false, error = new { code = "BAD_REQUEST", message = ex.Message } }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting item {ItemId} on invoice {Id}", itemId, id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }
    }
}
