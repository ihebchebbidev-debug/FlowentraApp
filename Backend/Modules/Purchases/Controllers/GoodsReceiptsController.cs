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
    [Route("api/goods-receipts")]
    public class GoodsReceiptsController : ControllerBase
    {
        private readonly IGoodsReceiptService _service;
        private readonly ISystemLogService _systemLogService;
        private readonly ILogger<GoodsReceiptsController> _logger;

        public GoodsReceiptsController(IGoodsReceiptService service, ISystemLogService systemLogService, ILogger<GoodsReceiptsController> logger)
        {
            _service = service;
            _systemLogService = systemLogService;
            _logger = logger;
        }

        private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        private string GetUserName() => User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value ?? "anonymous";

        [HttpGet]
        public async Task<IActionResult> GetReceipts(
            [FromQuery] int? purchase_order_id = null, [FromQuery] string? supplier_id = null,
            [FromQuery] string? status = null, [FromQuery] DateTime? date_from = null,
            [FromQuery] DateTime? date_to = null, [FromQuery] string? search = null,
            [FromQuery] int page = 1, [FromQuery] int limit = 20,
            [FromQuery] string sort_by = "created_date", [FromQuery] string sort_order = "desc")
        {
            try
            {
                var result = await _service.GetReceiptsAsync(purchase_order_id, supplier_id, status, date_from, date_to, search, page, limit, sort_by, sort_order);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching goods receipts");
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetReceipt(int id)
        {
            try
            {
                var receipt = await _service.GetReceiptByIdAsync(id);
                if (receipt == null) return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Goods receipt not found" } });
                return Ok(new { success = true, data = receipt });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching goods receipt {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateReceipt([FromBody] CreateGoodsReceiptDto dto)
        {
            try
            {
                var userId = GetUserId();
                var receipt = await _service.CreateReceiptAsync(dto, userId, GetUserName());
                await _systemLogService.LogSuccessAsync($"Goods receipt created: {receipt.ReceiptNumber}", "Purchases", "create", userId, GetUserName(), "GoodsReceipt", receipt.Id.ToString());
                return CreatedAtAction(nameof(GetReceipt), new { id = receipt.Id }, new { success = true, data = receipt });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } });
            }
            // Service throws InvalidOperationException for: PO status guard
            // ("Cannot receive goods on a PO in status 'X'"), over-receipt, negative qty,
            // and orphan PurchaseOrderItemId. Surface the message instead of a 500.
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = new { code = "BAD_REQUEST", message = ex.Message } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating goods receipt");
                await _systemLogService.LogErrorAsync("Failed to create goods receipt", "Purchases", "create", GetUserId(), GetUserName(), details: ex.Message);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateReceipt(int id, [FromBody] UpdateGoodsReceiptDto dto)
        {
            try
            {
                var userId = GetUserId();
                var receipt = await _service.UpdateReceiptAsync(id, dto, userId, GetUserName());
                await _systemLogService.LogSuccessAsync($"Goods receipt updated: {receipt.ReceiptNumber}", "Purchases", "update", userId, GetUserName(), "GoodsReceipt", receipt.Id.ToString());
                return Ok(new { success = true, data = receipt });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } });
            }
            // Service throws InvalidOperationException for: linked-invoice block,
            // over-receipt, negative qty, orphan PO item, PO-item relink attempt.
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = new { code = "BAD_REQUEST", message = ex.Message } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating goods receipt {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteReceipt(int id)
        {
            try
            {
                var userId = GetUserId();
                if (!await _service.DeleteReceiptAsync(id, userId, GetUserName()))
                    return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Goods receipt not found" } });
                await _systemLogService.LogSuccessAsync($"Goods receipt deleted: {id}", "Purchases", "delete", userId, GetUserName(), "GoodsReceipt", id.ToString());
                return Ok(new { success = true, message = "Deleted successfully" });
            }
            // Stock reversal failures bubble up here; surface the reason.
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = new { code = "BAD_REQUEST", message = ex.Message } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting goods receipt {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }
    }
}
