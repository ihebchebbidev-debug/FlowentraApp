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
    [Route("api/purchase-orders")]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly IPurchaseOrderService _service;
        private readonly ISystemLogService _systemLogService;
        private readonly ILogger<PurchaseOrdersController> _logger;

        public PurchaseOrdersController(IPurchaseOrderService service, ISystemLogService systemLogService, ILogger<PurchaseOrdersController> logger)
        {
            _service = service;
            _systemLogService = systemLogService;
            _logger = logger;
        }

        private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        private string GetUserName() => User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value ?? "anonymous";

        [HttpGet]
        public async Task<IActionResult> GetOrders(
            [FromQuery] string? status = null, [FromQuery] string? supplier_id = null,
            [FromQuery] string? payment_status = null, [FromQuery] DateTime? date_from = null,
            [FromQuery] DateTime? date_to = null, [FromQuery] string? search = null,
            [FromQuery] int page = 1, [FromQuery] int limit = 20,
            [FromQuery] string sort_by = "created_date", [FromQuery] string sort_order = "desc")
        {
            try
            {
                var result = await _service.GetOrdersAsync(status, supplier_id, payment_status, date_from, date_to, search, page, limit, sort_by, sort_order);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchase orders");
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred while fetching purchase orders" } });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] DateTime? date_from = null, [FromQuery] DateTime? date_to = null)
        {
            try
            {
                var stats = await _service.GetStatsAsync(date_from, date_to);
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchase order stats");
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            try
            {
                var order = await _service.GetOrderByIdAsync(id);
                if (order == null) return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Purchase order not found" } });
                return Ok(new { success = true, data = order });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchase order {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreatePurchaseOrderDto dto)
        {
            try
            {
                var userId = GetUserId();
                var order = await _service.CreateOrderAsync(dto, userId, GetUserName());
                await _systemLogService.LogSuccessAsync($"Purchase order created: {order.OrderNumber}", "Purchases", "create", userId, GetUserName(), "PurchaseOrder", order.Id.ToString());
                return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, new { success = true, data = order });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating purchase order");
                await _systemLogService.LogErrorAsync("Failed to create purchase order", "Purchases", "create", GetUserId(), GetUserName(), details: ex.Message);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpPatch("{id:int}")]
        public async Task<IActionResult> UpdateOrder(int id, [FromBody] UpdatePurchaseOrderDto dto)
        {
            try
            {
                var userId = GetUserId();
                var order = await _service.UpdateOrderAsync(id, dto, userId, GetUserName());
                await _systemLogService.LogSuccessAsync($"Purchase order updated: {order.OrderNumber}", "Purchases", "update", userId, GetUserName(), "PurchaseOrder", id.ToString());
                return Ok(new { success = true, data = order });
            }
            catch (KeyNotFoundException) { return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Purchase order not found" } }); }
            // Status-machine and item-mutation guards throw this — surface the message
            // (e.g. "Cannot move PO from received back to draft") to the user instead of a 500.
            catch (InvalidOperationException ex) { return BadRequest(new { success = false, error = new { code = "INVALID_TRANSITION", message = ex.Message } }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating purchase order {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            try
            {
                var userId = GetUserId();
                if (!await _service.DeleteOrderAsync(id, userId, GetUserName()))
                    return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Purchase order not found" } });
                await _systemLogService.LogSuccessAsync($"Purchase order deleted: {id}", "Purchases", "delete", userId, GetUserName(), "PurchaseOrder", id.ToString());
                return Ok(new { success = true, message = "Deleted successfully" });
            }
            catch (InvalidOperationException ex) { return BadRequest(new { success = false, error = new { code = "BAD_REQUEST", message = ex.Message } }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting purchase order {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpGet("{id:int}/activities")]
        public async Task<IActionResult> GetActivities(int id, [FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            try
            {
                var activities = await _service.GetActivitiesAsync(id, page, limit);
                return Ok(new { success = true, data = activities });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching activities for PO {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpPost("{id:int}/items")]
        public async Task<IActionResult> AddItem(int id, [FromBody] CreatePurchaseOrderItemDto dto)
        {
            try
            {
                var item = await _service.AddItemAsync(id, dto);
                return CreatedAtAction(nameof(GetOrder), new { id }, new { success = true, data = item });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }); }
            // EnsureItemsMutable throws this when PO is ordered/received/cancelled/closed.
            catch (InvalidOperationException ex) { return BadRequest(new { success = false, error = new { code = "ITEMS_FROZEN", message = ex.Message } }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding item to PO {Id}", id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }

        [HttpPatch("{id:int}/items/{itemId:int}")]
        public async Task<IActionResult> UpdateItem(int id, int itemId, [FromBody] CreatePurchaseOrderItemDto dto)
        {
            try
            {
                var item = await _service.UpdateItemAsync(id, itemId, dto);
                return Ok(new { success = true, data = item });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }); }
            // Surfaces "Quantity (X) cannot be less than already-received qty (Y)" and ITEMS_FROZEN.
            catch (InvalidOperationException ex) { return BadRequest(new { success = false, error = new { code = "BAD_REQUEST", message = ex.Message } }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating item {ItemId} in PO {Id}", itemId, id);
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
                return Ok(new { success = true, message = "Item deleted" });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }); }
            // Surfaces "Cannot delete an item that already has received quantity" and ITEMS_FROZEN.
            catch (InvalidOperationException ex) { return BadRequest(new { success = false, error = new { code = "BAD_REQUEST", message = ex.Message } }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting item {ItemId} from PO {Id}", itemId, id);
                return StatusCode(500, new { success = false, error = new { code = "INTERNAL_ERROR", message = "An error occurred" } });
            }
        }
    }
}
