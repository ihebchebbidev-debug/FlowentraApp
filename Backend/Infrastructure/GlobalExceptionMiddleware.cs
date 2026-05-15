using System.Net;
using System.Text.Json;

namespace MyApi.Infrastructure;

/// <summary>
/// Production-grade global exception handler.
/// Catches ALL unhandled exceptions and returns consistent JSON error responses
/// instead of crashing the process or leaking stack traces.
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client disconnected — don't log as error
            _logger.LogDebug("Request cancelled by client: {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = 499; // Client Closed Request
        }
        catch (InvalidOperationException ex)
        {
            // Business logic errors → 400 Bad Request
            _logger.LogWarning(ex, "Business rule violation: {Message}", ex.Message);
            await WriteErrorResponse(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt: {Path}", context.Request.Path);
            await WriteErrorResponse(context, HttpStatusCode.Forbidden, "Access denied");
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found: {Message}", ex.Message);
            await WriteErrorResponse(context, HttpStatusCode.NotFound, ex.Message);
        }
        catch (TimeoutException ex)
        {
            _logger.LogError(ex, "Operation timed out: {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorResponse(context, HttpStatusCode.GatewayTimeout, "The operation timed out. Please try again.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
            
            var message = _env.IsDevelopment() 
                ? ex.Message 
                : "An internal error occurred. Please try again later.";
            
            await WriteErrorResponse(context, HttpStatusCode.InternalServerError, message);
        }
    }

    private static async Task WriteErrorResponse(HttpContext context, HttpStatusCode statusCode, string message)
    {
        if (context.Response.HasStarted) return;

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var response = new
        {
            status = (int)statusCode,
            error = statusCode.ToString(),
            message,
            timestamp = DateTime.UtcNow
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
