using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.Invoices.DTOs;
using MyApi.Modules.Invoices.Services;

namespace MyApi.Modules.Invoices.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/invoices")]
    public class InvoicesController : ControllerBase
    {
        private readonly IInvoiceService _service;
        public InvoicesController(IInvoiceService service) { _service = service; }

        private string UserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] InvoiceQueryParams q)
            => Ok(await _service.GetInvoicesAsync(q));

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var invoice = await _service.GetInvoiceByIdAsync(id);
            return invoice == null ? NotFound() : Ok(invoice);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateInvoiceDto dto)
        {
            var invoice = await _service.CreateDraftAsync(dto, UserId());
            return CreatedAtAction(nameof(Get), new { id = invoice.Id }, invoice);
        }

        [HttpPost("from-sale/{saleId:int}")]
        public async Task<IActionResult> CreateFromSale(int saleId, [FromQuery] int? serviceOrderId = null)
        {
            var invoice = await _service.CreateDraftFromSaleAsync(saleId, UserId(), serviceOrderId);
            return CreatedAtAction(nameof(Get), new { id = invoice.Id }, invoice);
        }

        [HttpPatch("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateInvoiceDto dto)
            => Ok(await _service.UpdateDraftAsync(id, dto, UserId()));

        [HttpPost("{id:int}/post")]
        public async Task<IActionResult> Post(int id, [FromBody] PostInvoiceDto dto)
            => Ok(await _service.PostAsync(id, dto ?? new PostInvoiceDto(), UserId()));

        [HttpPost("{id:int}/void")]
        public async Task<IActionResult> Void(int id, [FromBody] VoidInvoiceDto dto)
            => Ok(await _service.VoidAsync(id, dto ?? new VoidInvoiceDto(), UserId()));

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _service.DeleteDraftAsync(id, UserId());
            return ok ? NoContent() : NotFound();
        }
    }
}