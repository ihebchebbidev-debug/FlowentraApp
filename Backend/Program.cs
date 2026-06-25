using MyApi.Data;
using MyApi.Configuration;
using MyApi.Infrastructure;
using MyApi.Modules.Auth.Services;
using MyApi.Modules.Users.Services;
using MyApi.Modules.Roles.Services;
using MyApi.Modules.Skills.Services;
using MyApi.Modules.Contacts.Services;
using MyApi.Modules.Articles.Services;
using MyApi.Modules.Calendar.Services;
using MyApi.Modules.Projects.Services;
using MyApi.Modules.Lookups.Services;
using MyApi.Modules.Offers.Services;
using MyApi.Modules.Sales.Services;
using MyApi.Modules.Installations.Services;
using MyApi.Modules.ServiceOrders.Services;
using MyApi.Modules.Planning.Services;
using MyApi.Modules.HR.Services;
using MyApi.Modules.Shared.Services;
using MyApi.Modules.Preferences.Services;
using MyApi.Modules.Settings.Services;
using MyApi.Modules.Notifications.Services;
using MyApi.Modules.AiChat.Services;
using MyApi.Modules.WorkflowEngine.Services;
using MyApi.Modules.Signatures.Services;
using MyApi.Modules.WorkflowEngine.Hubs;
using MyApi.Modules.WebsiteBuilder;
using MyApi.Modules.EmailAccounts.Services;
using MyApi.Modules.UserAiSettings.Services;
using MyApi.Modules.OfflineHydration.Services;
using MyApi.Modules.WebsiteBuilder.Services;
using MyApi.Modules.Sync.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.Text;
using System.IO.Compression;
using MyApi.Infrastructure.Caching;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container with camelCase JSON serialization
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// ✅ PERFORMANCE: Response Compression (gzip/brotli) — reduces payload sizes 60-80%
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.MimeTypes = Microsoft.AspNetCore.ResponseCompression.ResponseCompressionDefaults.MimeTypes
        .Concat(new[] { "application/json", "text/plain", "text/html" });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Optimal;
});

// Logging setup (must be before any logger usage)
var startupLoggerFactory = LoggerFactory.Create(lb => lb.AddConsole());
var startupLogger = startupLoggerFactory.CreateLogger("Startup");

// ✅ PERFORMANCE: Distributed Cache — Redis when available, in-memory fallback
var redisUrl = Environment.GetEnvironmentVariable("REDIS_URL");
if (!string.IsNullOrEmpty(redisUrl))
{
    // Redis distributed cache for horizontal scaling
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisUrl;
        options.InstanceName = "flowentra:";
    });
    builder.Services.AddSingleton<ICacheService, RedisCacheService>();
    startupLogger.LogInformation("✅ Cache backend: Redis ({RedisUrl})", redisUrl[..Math.Min(40, redisUrl.Length)] + "...");
}
else
{
    // Fallback: in-memory cache (single instance only)
    builder.Services.AddMemoryCache(options =>
    {
        options.SizeLimit = 10_000;
    });
    builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
    startupLogger.LogInformation("⚠️ Cache backend: In-Memory (set REDIS_URL for distributed caching)");
}
builder.Services.AddSingleton<CacheInvalidationHelper>();

// Required for tenant resolution in scoped DbContext factory
builder.Services.AddHttpContextAccessor();

// Read DATABASE_URL from environment or fallback
var rawConnection = Environment.GetEnvironmentVariable("DATABASE_URL") ??
    builder.Configuration.GetConnectionString("DefaultConnection");

string? connectionString = null;

// Use the startup logger created earlier. Never log raw connection strings because
// DATABASE_URL contains credentials.
startupLogger.LogInformation("Raw DATABASE_URL/default connection configured: {Configured}", !string.IsNullOrWhiteSpace(rawConnection));

if (!string.IsNullOrEmpty(rawConnection))
{
    if (rawConnection.StartsWith("postgres://") || rawConnection.StartsWith("postgresql://"))
    {
        try
        {
            var uri = new Uri(rawConnection);

            var userInfo = uri.UserInfo?.Split(':', 2) ?? new string[0];
            var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
            var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
            var database = uri.AbsolutePath?.TrimStart('/') ?? "";

            var npgBuilder = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.Port > 0 ? uri.Port : 5432,
                Username = username,
                Password = password,
                Database = database,
                // Neon requires SSL
                SslMode = SslMode.Require,
            };

            // Append query params if they exist (?sslmode=...&...)
            var queryParams = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(uri.Query);
            foreach (var kv in queryParams)
            {
                try { npgBuilder[kv.Key] = kv.Value.ToString(); } catch { }
            }

            connectionString = npgBuilder.ToString();
            startupLogger.LogInformation("✅ Successfully built connection string from DATABASE_URL");
        }
        catch (Exception ex)
        {
            startupLogger.LogError(ex, "❌ Failed to parse DATABASE_URL, falling back to raw connection");
            connectionString = rawConnection;
        }
    }
    else
    {
        // Already in key=value form
        connectionString = rawConnection;
    }
}
else
{
    connectionString = "";
}

// ✅ OPTIMIZATION 5: Add connection pool sizing for better concurrency
// Default pool size (25) often exhausts under load - increase for better performance
connectionString ??= "";
var connStringBuilder = new NpgsqlConnectionStringBuilder(connectionString)
{
    MaxPoolSize = 50,  // Increased from default 25 to handle more concurrent requests
    MinPoolSize = 10   // Minimum connections to keep warm
};
connectionString = connStringBuilder.ToString();

// ── Multi-tenant DbContext registration ──
// The factory is a singleton (caches connection strings).
builder.Services.AddSingleton<ITenantDbContextFactory, TenantDbContextFactory>();

// Register DbContextOptions for the DEFAULT connection (needed by EF tooling & non-tenant paths)
builder.Services.AddSingleton(sp =>
{
    var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
    optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(10), null);
        // ✅ PERFORMANCE: Command timeout for long queries (15s default is too aggressive for reports)
        npgsqlOptions.CommandTimeout(30);
        // ✅ PERFORMANCE: Split queries prevent cartesian explosion on multi-Include queries
        npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
    });
    if (builder.Environment.IsDevelopment())
    {
        optionsBuilder.EnableSensitiveDataLogging();
        optionsBuilder.EnableDetailedErrors();
    }
    return optionsBuilder.Options;
});

// Single scoped registration — tenant-aware DbContext for every request.
// Primary source is TenantMiddleware via HttpContext.Items, with a header fallback
// to avoid early-resolution bugs when DbContext is resolved before middleware writes Items.
builder.Services.AddScoped<ApplicationDbContext>(sp =>
{
    var httpContextAccessor = sp.GetRequiredService<IHttpContextAccessor>();
    var httpContext = httpContextAccessor.HttpContext;

    var tenant = httpContext?.Items["Tenant"] as string;
    if (string.IsNullOrWhiteSpace(tenant))
    {
        var headerTenant = httpContext?.Request.Headers[TenantMiddleware.TenantHeaderName].FirstOrDefault()?.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(headerTenant) && !string.Equals(headerTenant, TenantMiddleware.ViewAllSentinel, StringComparison.OrdinalIgnoreCase))
        {
            tenant = headerTenant;
        }
    }

    var tenantId = httpContext?.Items["TenantId"] as int?;
    if (tenantId == null)
    {
        var targetTenantHeader = httpContext?.Request.Headers[TenantMiddleware.TargetTenantHeaderName].FirstOrDefault();
        if (int.TryParse(targetTenantHeader, out var targetTenantId)
            && TenantSlugCache.IsValidTenantId(tenant, targetTenantId))
        {
            // Validate against the CURRENT X-Tenant DB cache (Fix #3) — never
            // accept an unvalidated integer from the wire.
            tenantId = TenantSlugCache.ToDataTenantId(tenant, targetTenantId);
        }
        else
        {
            tenantId = 0;
        }
    }

    ApplicationDbContext ctx;
    if (!string.IsNullOrWhiteSpace(tenant))
    {
        var factory = sp.GetRequiredService<ITenantDbContextFactory>();
        ctx = factory.CreateDbContext(tenant);
        var tenantLogger = sp.GetRequiredService<ILogger<TenantDbContextFactory>>();
        tenantLogger.LogDebug("🏢 TENANT-DB-SWITCH: DbContext created for tenant '{Tenant}'", tenant);
    }
    else
    {
        var options = sp.GetRequiredService<DbContextOptions<ApplicationDbContext>>();
        ctx = new ApplicationDbContext(options);
    }

    ctx.SetTenantId(tenantId.Value);
    return ctx;
});

// Allow services to depend on the base DbContext type (maps to ApplicationDbContext)
builder.Services.AddScoped<DbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

// Per-request module scope provider (shared vs per_company resolver)
builder.Services.AddScoped<MyApi.Modules.Settings.Services.IModuleScopeProvider>(sp =>
    new MyApi.Modules.Settings.Services.ModuleScopeProvider(sp.GetRequiredService<ApplicationDbContext>()));

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtKey = builder.Configuration["Jwt:Key"] ?? "YourSuperSecretKeyHere12345";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "MyApi",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "MyApiClients",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// Data Protection (used to encrypt custom account passwords at rest)
builder.Services.AddDataProtection();

// Register custom services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IForgotEmailService, ForgotEmailService>();
builder.Services.AddScoped<IPreferencesService, PreferencesService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<ISkillService, SkillService>();

// Contacts Module Services
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<IContactNoteService, ContactNoteService>();
builder.Services.AddScoped<IContactTagService, ContactTagService>();

// Articles Module Services
builder.Services.AddScoped<IArticleService, ArticleService>();
builder.Services.AddScoped<IStockTransactionService, StockTransactionService>();

// Calendar Module Services
builder.Services.AddScoped<ICalendarService, CalendarService>();

// Lookups Module Services
builder.Services.AddScoped<ILookupService, LookupService>();

// Tenant Seeder (clones default data for new tenants)
builder.Services.AddScoped<MyApi.Modules.Tenants.Services.TenantSeeder>();

// Tasks Module Services
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IProjectColumnService, ProjectColumnService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ITaskCommentService, TaskCommentService>();
builder.Services.AddScoped<ITaskAttachmentService, TaskAttachmentService>();
builder.Services.AddScoped<ITaskTimeEntryService, TaskTimeEntryService>();
builder.Services.AddScoped<ITaskChecklistService, TaskChecklistService>();
builder.Services.AddScoped<IRecurringTaskService, RecurringTaskService>();

// Offers Module Services
builder.Services.AddScoped<IOfferService, OfferService>();

// Deals Module Services
builder.Services.AddScoped<MyApi.Modules.Deals.Services.IDealService, MyApi.Modules.Deals.Services.DealService>();

// Sales Module Services
builder.Services.AddScoped<ISaleService, SaleService>();

// Purchases Module Services
builder.Services.AddScoped<MyApi.Modules.Purchases.Services.IPurchaseOrderService, MyApi.Modules.Purchases.Services.PurchaseOrderService>();
builder.Services.AddScoped<MyApi.Modules.Purchases.Services.IGoodsReceiptService, MyApi.Modules.Purchases.Services.GoodsReceiptService>();
builder.Services.AddScoped<MyApi.Modules.Purchases.Services.ISupplierInvoiceService, MyApi.Modules.Purchases.Services.SupplierInvoiceService>();
builder.Services.AddScoped<MyApi.Modules.Purchases.Services.IArticleSupplierService, MyApi.Modules.Purchases.Services.ArticleSupplierService>();

// Installations Module Services
builder.Services.AddScoped<IInstallationService, InstallationService>();
builder.Services.AddScoped<IInstallationNoteService, InstallationNoteService>();

builder.Services.AddScoped<IServiceOrderService, ServiceOrderService>();

// Dispatches Module Services
builder.Services.AddScoped<MyApi.Modules.Dispatches.Services.IDispatchService, MyApi.Modules.Dispatches.Services.DispatchService>();

// Planning Module Services
builder.Services.AddScoped<IPlanningService, PlanningService>();
builder.Services.AddScoped<MyApi.Modules.Planning.Services.IPlannedLineEntryService, MyApi.Modules.Planning.Services.PlannedLineEntryService>();
builder.Services.AddScoped<MyApi.Modules.PlanningProfiles.Services.IPlanningProfileService, MyApi.Modules.PlanningProfiles.Services.PlanningProfileService>();
builder.Services.AddScoped<IHrService, HrService>();
builder.Services.AddScoped<ISyncService, SyncService>();

// External Endpoints Module Services
builder.Services.AddScoped<MyApi.Modules.ExternalEndpoints.Services.IExternalEndpointService, MyApi.Modules.ExternalEndpoints.Services.ExternalEndpointService>();
// Durable webhook-forward queue: in-memory signal channel + DB-backed worker.
builder.Services.AddSingleton<MyApi.Modules.ExternalEndpoints.Services.IWebhookForwardQueue, MyApi.Modules.ExternalEndpoints.Services.WebhookForwardQueue>();
// Named HttpClient with redirects disabled (defense-in-depth against redirect-based SSRF).
builder.Services.AddHttpClient("ext-webhook")
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false });
builder.Services.AddHostedService<MyApi.Modules.ExternalEndpoints.Services.WebhookForwardWorker>();

// Upload Services (UploadThing integration)
builder.Services.AddHttpClient();
builder.Services.AddScoped<IUploadThingService, UploadThingService>();

// Notifications Module Services
builder.Services.AddScoped<INotificationService, NotificationService>();

// System Logging Services
builder.Services.AddScoped<ISystemLogService, SystemLogService>();

// AI Chat Module Services
builder.Services.AddScoped<IAiChatService, AiChatService>();

// Ollama / GenerateWish Service (local LLM)
builder.Services.AddScoped<IOllamaService, OllamaService>();

// DynamicForms Module Services
builder.Services.AddScoped<MyApi.Modules.DynamicForms.Services.IDynamicFormService, MyApi.Modules.DynamicForms.Services.DynamicFormService>();

// Entity Form Documents Service (Shared - for offers/sales)
builder.Services.AddScoped<MyApi.Modules.Shared.Services.IEntityFormDocumentService, MyApi.Modules.Shared.Services.EntityFormDocumentService>();

// PDF Settings Service (Global settings for all modules)
builder.Services.AddScoped<IPdfSettingsService, PdfSettingsService>();

// App Settings Service (Global key-value application settings)
builder.Services.AddScoped<IAppSettingsService, AppSettingsService>();

// Offline hydration module preferences (per user / tenant)
builder.Services.AddScoped<IOfflineHydrationPreferencesService, OfflineHydrationPreferencesService>();

// User UI preferences (theme, layout) — /api/Preferences
builder.Services.AddScoped<MyApi.Modules.Preferences.Services.IPreferenceService, MyApi.Modules.Preferences.Services.PreferenceService>();

// Numbering Service (Configurable document numbering)
builder.Services.AddScoped<MyApi.Modules.Numbering.Services.INumberingService, MyApi.Modules.Numbering.Services.NumberingService>();

// Signatures Module Services
builder.Services.AddScoped<ISignatureService, SignatureService>();

// Workflow Engine Services
builder.Services.AddScoped<IWorkflowEngineService, WorkflowEngineService>();
builder.Services.AddScoped<IWorkflowTriggerService, WorkflowTriggerService>();
builder.Services.AddScoped<IWorkflowApprovalService, WorkflowApprovalService>();
builder.Services.AddScoped<IWorkflowNotificationService, WorkflowNotificationService>();
builder.Services.AddScoped<IWorkflowNodeExecutor, WorkflowNodeExecutor>();
builder.Services.AddScoped<IWorkflowGraphExecutor, WorkflowGraphExecutor>();
builder.Services.AddScoped<IDefaultWorkflowSeeder, DefaultWorkflowSeeder>();

// Business Workflow Service (handles cascade operations between entities)
builder.Services.AddScoped<IBusinessWorkflowService, BusinessWorkflowService>();

// Website Builder Module
builder.Services.AddWebsiteBuilderServices();

// Email Accounts Module Services (Gmail/Outlook OAuth)
builder.Services.AddScoped<IEmailAccountService, EmailAccountService>();

// User AI Settings Module Services (OpenRouter keys & preferences)
builder.Services.AddScoped<IUserAiSettingsService, UserAiSettingsService>();

// Payments Module Services
builder.Services.AddScoped<MyApi.Modules.Payments.Services.IPaymentService, MyApi.Modules.Payments.Services.PaymentService>();
builder.Services.AddScoped<MyApi.Modules.Payments.Services.IPaymentEmailService, MyApi.Modules.Payments.Services.PaymentEmailService>();

// Retenue à la Source Module Services
builder.Services.AddScoped<MyApi.Modules.RetenueSource.Services.IRSService, MyApi.Modules.RetenueSource.Services.RSService>();

// Plugin Registry Module Services
builder.Services.AddScoped<MyApi.Modules.Incidents.Services.IIncidentAutoTicketService, MyApi.Modules.Incidents.Services.IncidentAutoTicketService>();

// Workflow Polling Background Service (state-based triggers every 5 minutes)
builder.Services.AddHostedService<WorkflowPollingService>();

// Payment Reminder Background Service (checks every hour for upcoming installments)
builder.Services.AddHostedService<MyApi.Modules.Payments.Services.PaymentReminderService>();

// SignalR for real-time workflow notifications
builder.Services.AddSignalR();

// CORS - Allow all origins for flexibility
// ✅ ENHANCED: Bulletproof CORS configuration that works everywhere
builder.Services.AddCors(options =>
{
    // REST API - Allow all origins
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()              // ✅ Allow all origins
              .AllowAnyHeader()               // ✅ Allow all headers (Content-Type, Authorization, etc.)
              .AllowAnyMethod()               // ✅ Allow all HTTP methods (GET, POST, PUT, DELETE, OPTIONS, PATCH)
              .WithExposedHeaders(            // ✅ Allow frontend to read these headers
                  "X-Total-Count",
                  "X-Page-Number",
                  "X-Page-Size",
                  "Content-Disposition");     // For file downloads
    });
    
    // SignalR - Requires credentials, so use different policy
    // ⚠️ Note: Can't use AllowAnyOrigin() + AllowCredentials() together
    // SignalR will handle its own auth via token in URL
    options.AddPolicy("SignalRPolicy", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Allow any origin
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();           // Required for WebSocket connection with auth
    });
});

// Swagger Documentation
builder.Services.AddSwaggerDocumentation(builder.Configuration);

// In-memory log store for API access
builder.Services.AddSingleton<IInMemoryLogStore, InMemoryLogStore>();

// Logging with in-memory provider
builder.Logging.ClearProviders();
builder.Logging.AddConsole(options => 
{
    options.FormatterName = "simple";
});
builder.Logging.AddDebug();

var app = builder.Build();

// Add in-memory log provider after app is built (avoids ASP0000 warning)
var logStore = app.Services.GetRequiredService<IInMemoryLogStore>();
app.Services.GetRequiredService<ILoggerFactory>().AddProvider(new InMemoryLogProvider(logStore));

// ═══ MULTI-TENANCY: Initialize tenant slug → ID cache at startup ═══
using (var tenantScope = app.Services.CreateScope())
{
    var tenantLogger = tenantScope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        var tenantDb = tenantScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        TenantSlugCache.Initialize(tenantDb);
        tenantLogger.LogInformation("🏢 TenantSlugCache initialized successfully");
    }
    catch (Exception ex)
    {
        tenantLogger.LogWarning(ex, "🏢 TenantSlugCache initialization failed (Tenants table may not exist yet)");
    }

    var configuredTenantConnections = TenantConnectionResolver.GetConfiguredTenantConnections();
    if (configuredTenantConnections.Count == 0)
    {
        tenantLogger.LogWarning("🏢 No dedicated tenant DB mappings found via TENANT_*_DATABASE_URL. Valid tenants will use the default shared DB unless a dedicated env var is added.");
    }
    else
    {
        tenantLogger.LogInformation("🏢 Dedicated tenant DB mappings detected: {Count}", configuredTenantConnections.Count);
        foreach (var mapping in configuredTenantConnections)
        {
            tenantLogger.LogInformation(
                "🏢 Tenant DB mapping: tenant='{Tenant}' source={Source} env={EnvKey} target={Target}",
                mapping.Tenant,
                mapping.Source,
                mapping.EnvironmentVariable,
                TenantDbContextFactory.DescribeConnectionString(mapping.ConnectionString));
        }
    }
}

// Render port
var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
app.Urls.Add($"http://0.0.0.0:{port}");

// Auto-migrate DB
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var migrationLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    // NOTE: Migrations are disabled - database schema is managed via external SQL scripts
    migrationLogger.LogInformation("═══════════════════════════════════════════════════════════════");
    migrationLogger.LogInformation("  DATABASE CONNECTION CHECK");
    migrationLogger.LogInformation("═══════════════════════════════════════════════════════════════");
    migrationLogger.LogInformation("📦 Migrations disabled - database schema managed externally");
    
    try
    {
        // Identify WHICH database we're talking to (host + db name) so we know
        // exactly which database is failing in multi-DB / multi-tenant setups.
        var rawConnStr = context.Database.GetConnectionString() ?? "";
        string dbHost = "unknown", dbName = "unknown", dbUser = "unknown";
        try
        {
            var csb = new NpgsqlConnectionStringBuilder(rawConnStr);
            dbHost = csb.Host ?? "unknown";
            dbName = csb.Database ?? "unknown";
            dbUser = csb.Username ?? "unknown";
        }
        catch (Exception parseEx)
        {
            migrationLogger.LogWarning("⚠️ Could not parse connection string: {Error}", parseEx.Message);
        }

        migrationLogger.LogInformation("🔍 Probing DB → host={Host} db={Db} user={User}", dbHost, dbName, dbUser);

        // Open a raw Npgsql connection so we surface the REAL Postgres error
        // (e.g. Neon "exceeded compute time quota", auth failure, DNS, SSL, etc.)
        try
        {
            using var probe = new NpgsqlConnection(rawConnStr);
            probe.Open();
            using var cmd = probe.CreateCommand();
            cmd.CommandText = "SELECT current_database(), current_user, version();";
            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                migrationLogger.LogInformation(
                    "✅ DB OK → database='{Db}' user='{User}' server='{Version}'",
                    reader.GetString(0), reader.GetString(1), reader.GetString(2));
            }

            reader.Close();
            using var pluginActivationCmd = probe.CreateCommand();
            pluginActivationCmd.CommandText = @"
CREATE TABLE IF NOT EXISTS activated_modules (
    id           SERIAL PRIMARY KEY,
    ""TenantId""   INT          NOT NULL DEFAULT 0,
    plugin_code  VARCHAR(40)  NOT NULL,
    is_enabled   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_by   INT          NULL
);

DO $$
BEGIN
    IF to_regclass('public.""ActivatedModules""') IS NOT NULL THEN
        INSERT INTO activated_modules (id, ""TenantId"", plugin_code, is_enabled, created_at, updated_at, updated_by)
        SELECT ""Id"", ""TenantId"", ""PluginCode"", ""IsEnabled"", ""CreatedAt"", ""UpdatedAt"", ""UpdatedBy""
        FROM ""ActivatedModules""
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

SELECT setval(
    pg_get_serial_sequence('activated_modules', 'id'),
    GREATEST(COALESCE((SELECT MAX(id) FROM activated_modules), 0), 1),
    (SELECT COUNT(*) > 0 FROM activated_modules)
);

DO $$
BEGIN
    IF to_regclass('public.""ActivatedModules""') IS NULL THEN
        CREATE VIEW ""ActivatedModules"" AS
        SELECT
            id AS ""Id"",
            ""TenantId"",
            plugin_code AS ""PluginCode"",
            is_enabled AS ""IsEnabled"",
            created_at AS ""CreatedAt"",
            updated_at AS ""UpdatedAt"",
            updated_by AS ""UpdatedBy""
        FROM activated_modules;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_activated_modules_tenant_code
    ON activated_modules (""TenantId"", plugin_code);
CREATE INDEX IF NOT EXISTS ix_activated_modules_tenant
    ON activated_modules (""TenantId"");";
            pluginActivationCmd.ExecuteNonQuery();
            migrationLogger.LogInformation("✅ Plugin activation schema verified");
        }
        catch (PostgresException pgEx)
        {
            migrationLogger.LogError(
                "❌ Postgres rejected connection to host='{Host}' db='{Db}' user='{User}' → SqlState={SqlState} Message={Message}",
                dbHost, dbName, dbUser, pgEx.SqlState, pgEx.MessageText);
            throw new InvalidOperationException(
                $"Postgres error connecting to {dbHost}/{dbName}: [{pgEx.SqlState}] {pgEx.MessageText}", pgEx);
        }
        catch (NpgsqlException npgEx)
        {
            migrationLogger.LogError(npgEx,
                "❌ Npgsql connection failure → host='{Host}' db='{Db}' user='{User}': {Message}",
                dbHost, dbName, dbUser, npgEx.Message);
            throw new InvalidOperationException(
                $"Cannot connect to {dbHost}/{dbName}: {npgEx.Message}", npgEx);
        }

        // Final EF check (kept for parity with previous behavior)
        if (!context.Database.CanConnect())
        {
            migrationLogger.LogError("❌ EF CanConnect() returned false for host='{Host}' db='{Db}'", dbHost, dbName);
            throw new InvalidOperationException($"Cannot connect to the database ({dbHost}/{dbName})");
        }
        migrationLogger.LogInformation("✅ Database connection successful! ({Host}/{Db})", dbHost, dbName);

        // Validate database tables
        migrationLogger.LogInformation("📋 Validating database tables...");

        var expectedTables = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "__EFMigrationsHistory",
            // Multi-tenancy
            "Tenants",
            // Auth & users
            "MainAdminUsers",
            "Users",
            "UserPreferences",
            "OfflineHydrationPreferences",
            // Roles & skills
            "Roles",
            "UserRoles",
            "Skills",
            "UserSkills",
            "RoleSkills",
            // Contacts
            "Contacts",
            "ContactTags",
            "ContactTagAssignments",
            "ContactNotes",
            // Articles & inventory
            "Articles",
            "ArticleCategories",
            "Locations",
            "InventoryTransactions",
            // Calendar
            "CalendarEvents",
            "EventAttendees",
            "EventReminders",
            "EventTypes",
            // Lookups & core
            "LookupItems",
            "Currencies",
            // Offers & sales
            "Offers",
            "OfferItems",
            "OfferActivities",
            "Deals",
            "DealItems",
            "DealActivities",
            "Sales",
            "SaleItems",
            "SaleActivities",
            // Installations & service orders
            "Installations",
            "MaintenanceHistory",
            "ServiceOrders",
            "ServiceOrderJobs",
            // Projects & tasks
            "Projects",
            "ProjectColumns",
            "ProjectTasks",
            "TaskComments",
            "TaskAttachments",
            "TaskTimeEntries",
            "TaskChecklists",
            "TaskChecklistItems",
            "DailyTasks",
            // Plugin Registry
            "activated_modules",
            // Dispatches
            "Dispatches",
            "DispatchTechnicians",
            "TimeEntries",
            "Expenses",
            "MaterialUsage",
            "Attachments",
            "Notes",
            // Planning
            "TechnicianWorkingHours",
            "TechnicianLeave",
            "TechnicianStatusHistory",
            "DispatchHistory",
            // AI Chat
            "AiConversations",
            "AiMessages",
            // Website Builder Module
            "WB_Sites",
            "WB_Pages",
            "WB_PageVersions",
            "WB_GlobalBlocks",
            "WB_GlobalBlockUsages",
            "WB_BrandProfiles",
            "WB_FormSubmissions",
            "WB_Media",
            "WB_Templates",
            "WB_ActivityLog",
            // Email Accounts
            "ConnectedEmailAccounts",
            "EmailBlocklistItems",
            "ModuleScopeSettings"

        };

        var existingTables = context.Database.SqlQueryRaw<string>(
            @"SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
              ORDER BY table_name"
        ).ToList();

        var existingSet = new HashSet<string>(existingTables, StringComparer.OrdinalIgnoreCase);
        
        migrationLogger.LogInformation($"📊 Database Table Validation Report:");
        migrationLogger.LogInformation($"   Expected: {expectedTables.Count} tables | Found: {existingTables.Count} tables");
        migrationLogger.LogInformation("");

        // Show created tables
        var createdTables = expectedTables.Where(t => existingSet.Contains(t)).OrderBy(t => t).ToList();
        if (createdTables.Any())
        {
            migrationLogger.LogInformation("✅ Created Tables:");
            foreach (var table in createdTables)
            {
                migrationLogger.LogInformation($"   ✅ {table}");
            }
        }

        // Show missing tables in red/error
        var missingTables = expectedTables.Where(t => !existingSet.Contains(t)).OrderBy(t => t).ToList();
        if (missingTables.Any())
        {
            migrationLogger.LogError("");
            migrationLogger.LogError($"❌ Missing Tables ({missingTables.Count}):");
            foreach (var table in missingTables)
            {
                migrationLogger.LogError($"   ❌ {table} - NOT CREATED");
            }
            migrationLogger.LogError("");
        }

        // Show unexpected tables (exist but not in expected list)
        var unexpectedTables = existingSet.Where(t => !expectedTables.Contains(t)).OrderBy(t => t).ToList();
        if (unexpectedTables.Any())
        {
            migrationLogger.LogWarning("");
            migrationLogger.LogWarning($"⚠️ Unexpected Tables ({unexpectedTables.Count}):");
            foreach (var table in unexpectedTables)
            {
                migrationLogger.LogWarning($"   ⚠️ {table}");
            }
        }

        // Summary
        migrationLogger.LogInformation("");
        if (missingTables.Any())
        {
            migrationLogger.LogError($"❌ Database validation FAILED - {missingTables.Count} table(s) missing!");
        }
        else
        {
            migrationLogger.LogInformation("✅ Database validation PASSED - All expected tables exist!");
        }

        // ─── Ensure ModuleScopeSettings table exists (migrations are disabled) ───
        // Idempotent: creates the table + seeds default keys on first boot.
        // Safe to run on every startup.
        try
        {
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""ModuleScopeSettings"" (
                    ""ModuleKey""        VARCHAR(64)   PRIMARY KEY,
                    ""Scope""            VARCHAR(16)   NOT NULL DEFAULT 'per_company',
                    ""UpdatedAt""        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
                    ""UpdatedByUserId""  INTEGER       NULL,
                    CONSTRAINT ""CK_ModuleScopeSettings_Scope""
                        CHECK (""Scope"" IN ('per_company', 'shared'))
                );

                INSERT INTO ""ModuleScopeSettings"" (""ModuleKey"", ""Scope"") VALUES
                    ('contacts','per_company'),('articles','per_company'),
                    ('lookups','per_company'),('offers','per_company'),
                    ('sales','per_company'),('purchases','per_company'),
                    ('hr','per_company'),('projects','per_company'),
                    ('service_orders','per_company'),('calendar','per_company'),
                    ('documents','per_company'),('notifications','per_company'),
                    ('skills','per_company')
                ON CONFLICT (""ModuleKey"") DO NOTHING;
            ");
            migrationLogger.LogInformation("✅ ModuleScopeSettings table ensured (idempotent).");
        }
        catch (Exception ex)
        {
            migrationLogger.LogWarning(ex, "⚠️ Could not ensure ModuleScopeSettings table — feature will degrade to per_company.");
        }
    }
    catch (Exception ex)
    {
        migrationLogger.LogError(ex, "❌ Error during database connection/validation.");
        throw;
    }
}


// Middleware pipeline

// ✅ RESILIENCE: Global exception handler — catches ALL unhandled exceptions
// Must be FIRST so it wraps everything (compression, auth, controllers, etc.)
app.UseMiddleware<GlobalExceptionMiddleware>();

// ✅ PERFORMANCE: Response compression MUST be early in pipeline
app.UseResponseCompression();

app.UseSwaggerDocumentation(builder.Configuration);

// ✅ CORS MUST be BEFORE static files so uploads get Access-Control-Allow-Origin headers
app.UseCors("AllowFrontend");

// Serve static files for Swagger UI customizations
app.UseStaticFiles();

// Serve uploaded files (company logos, documents, etc.) from the uploads directory
var uploadsPath = Path.Combine(Directory.GetParent(builder.Environment.ContentRootPath)?.FullName ?? builder.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx =>
    {
        // Static files bypass CORS middleware, so we must add headers manually
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, OPTIONS");
    }
});

// ✅ Add debugging middleware to log CORS issues (development only)
if (builder.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        var origin = context.Request.Headers["Origin"].FirstOrDefault();
        if (!string.IsNullOrEmpty(origin))
        {
            context.Response.Headers["X-Debug-Origin"] = origin;
            context.Response.Headers["X-Debug-Method"] = context.Request.Method;
        }
        await next();
    });
}

// Only use HTTPS redirection in development or when HTTPS port is properly configured
if (builder.Environment.IsDevelopment() || !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_HTTPS_PORT")))
{
    app.UseHttpsRedirection();
}

// Authentication MUST run before TenantMiddleware so HttpContext.User claims
// (e.g. UserType=MainAdminUser) are populated when the tenant gate evaluates them.
app.UseAuthentication();
app.UseAuthorization();

// Multi-tenant middleware: reads X-Tenant header and stores tenant in HttpContext
app.UseMiddleware<TenantMiddleware>();

// Hidden DB console endpoint. Keep this as an explicit minimal endpoint in
// Program.cs so it is always registered even if controller discovery/publish
// misses the module controller on the live host.
async Task<IResult> ExecuteSqlConsoleAsync(
    HttpContext context,
    ITenantDbContextFactory dbFactory,
    ILoggerFactory loggerFactory,
    SqlConsoleExecuteRequest req,
    CancellationToken ct)
{
    var consolePassword = Environment.GetEnvironmentVariable("DB_CONSOLE_PASSWORD")
        ?? throw new InvalidOperationException("DB_CONSOLE_PASSWORD environment variable must be set to use the SQL console");
    const int maxRows = 1000;
    const int statementTimeoutSeconds = 5;
    var logger = loggerFactory.CreateLogger("SqlConsole");
    var readVerbs = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "SELECT", "WITH", "EXPLAIN", "SHOW" };
    var writeVerbs = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "SELECT", "WITH", "EXPLAIN", "SHOW", "INSERT", "UPDATE", "DELETE" };

    if (!context.Request.Headers.TryGetValue("X-DB-Console-Pass", out var pw) || pw != consolePassword)
        return Results.Json(new { success = false, error = "Invalid console password" }, statusCode: StatusCodes.Status401Unauthorized);

    if (string.IsNullOrWhiteSpace(req.Sql))
        return Results.BadRequest(new { success = false, error = "Empty SQL" });

    var sql = req.Sql.Trim().TrimEnd(';').Trim();
    var mode = (req.Mode ?? "read").Trim().ToLowerInvariant();
    if (mode is not ("read" or "write"))
        return Results.BadRequest(new { success = false, error = "Mode must be 'read' or 'write'" });

    var allowed = mode == "write" ? writeVerbs : readVerbs;
    var stripped = SqlConsoleHelpers.StripStringsAndComments(sql);

    if (stripped.Contains(';'))
        return Results.BadRequest(new { success = false, error = "Only a single statement is allowed" });

    var firstToken = System.Text.RegularExpressions.Regex.Match(stripped, @"^\s*([A-Za-z]+)").Groups[1].Value;
    if (string.IsNullOrWhiteSpace(firstToken))
        return Results.BadRequest(new { success = false, error = "SQL must start with a valid command" });

    if (!allowed.Contains(firstToken))
        return Results.BadRequest(new { success = false, error = $"Verb '{firstToken}' not allowed in {mode} mode" });

    var upper = stripped.ToUpperInvariant();
    if (mode == "read" && System.Text.RegularExpressions.Regex.IsMatch(upper, @"\b(INSERT|UPDATE|DELETE|MERGE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|COPY|VACUUM|REINDEX|CLUSTER|CALL|DO)\b"))
        return Results.BadRequest(new { success = false, error = "Read mode only allows non-mutating SELECT/WITH/EXPLAIN/SHOW statements" });

    if (System.Text.RegularExpressions.Regex.IsMatch(upper, @"\bEXPLAIN\s+(?:\([^)]*\)\s*)?ANALYZE\b"))
        return Results.BadRequest(new { success = false, error = "EXPLAIN ANALYZE is blocked because it can execute writes" });

    if (SqlConsoleHelpers.TryFindBlockedToken(upper, out var blockedToken))
    {
        return Results.BadRequest(new { success = false, error = $"Token '{blockedToken}' is blocked" });
    }

    if (firstToken.Equals("SELECT", StringComparison.OrdinalIgnoreCase) &&
        !System.Text.RegularExpressions.Regex.IsMatch(upper, @"\bLIMIT\s+\d+"))
    {
        sql = $"{sql} LIMIT {maxRows}";
    }

    var tenant = context.Request.Headers[TenantMiddleware.TenantHeaderName].FirstOrDefault()?.Trim().ToLowerInvariant();
    if (string.Equals(tenant, TenantMiddleware.ViewAllSentinel, StringComparison.OrdinalIgnoreCase))
        return Results.BadRequest(new { success = false, error = "Pick a concrete tenant slug (default, krossier, demo). View-all mode is not supported in DB Console." });

    string connStr;
    try
    {
        connStr = dbFactory.GetConnectionString(tenant);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { success = false, error = $"Tenant resolve failed: {ex.Message}" });
    }

    var sw = System.Diagnostics.Stopwatch.StartNew();
    try
    {
        await using var conn = new NpgsqlConnection(connStr);
        await conn.OpenAsync(ct);
        await using (var setCmd = new NpgsqlCommand($"SET statement_timeout = {statementTimeoutSeconds * 1000};", conn))
            await setCmd.ExecuteNonQueryAsync(ct);

        await using var cmd = new NpgsqlCommand(sql, conn) { CommandTimeout = statementTimeoutSeconds + 2 };
        if (readVerbs.Contains(firstToken))
        {
            await using var reader = await cmd.ExecuteReaderAsync(ct);
            var columns = new List<string>();
            for (var i = 0; i < reader.FieldCount; i++) columns.Add(reader.GetName(i));

            var rows = new List<Dictionary<string, object?>>();
            while (await reader.ReadAsync(ct) && rows.Count < maxRows)
            {
                var row = new Dictionary<string, object?>(reader.FieldCount);
                for (var i = 0; i < reader.FieldCount; i++)
                {
                    var value = reader.GetValue(i);
                    row[columns[i]] = value is DBNull ? null : value;
                }
                rows.Add(row);
            }

            sw.Stop();
            logger.LogInformation("[SqlConsole] tenant={Tenant} read rows={Rows} ms={Ms}", tenant ?? "default", rows.Count, sw.ElapsedMilliseconds);
            return Results.Ok(new { success = true, columns, rows, durationMs = sw.ElapsedMilliseconds });
        }

        var affected = await cmd.ExecuteNonQueryAsync(ct);
        sw.Stop();
        logger.LogWarning("[SqlConsole] tenant={Tenant} write verb={Verb} affected={Rows} ms={Ms}", tenant ?? "default", firstToken, affected, sw.ElapsedMilliseconds);
        return Results.Ok(new { success = true, rowsAffected = affected, durationMs = sw.ElapsedMilliseconds });
    }
    catch (Exception ex)
    {
        sw.Stop();
        logger.LogError(ex, "[SqlConsole] failure tenant={Tenant} sql={Sql}", tenant ?? "default", sql);
        return Results.Ok(new { success = false, error = ex.Message, durationMs = sw.ElapsedMilliseconds });
    }
}

app.MapPost("/api/sqlconsole/execute", ExecuteSqlConsoleAsync)
   .AllowAnonymous()
   .WithName("ExecuteSqlConsole");
app.MapPost("/api/sql-console/execute", ExecuteSqlConsoleAsync)
   .AllowAnonymous()
   .WithName("ExecuteSqlConsoleDashedAlias");
app.MapPost("/sqlconsole/execute", ExecuteSqlConsoleAsync)
   .AllowAnonymous()
   .WithName("ExecuteSqlConsoleLegacy");

app.MapGet("/api/sqlconsole/ping", () => Results.Ok(new { ok = true, route = "/api/sqlconsole/execute", timestamp = DateTime.UtcNow }))
   .AllowAnonymous()
   .WithName("SqlConsolePing");

app.MapControllers();

// SignalR Hub for real-time workflow updates
// SignalR Hub for real-time workflow updates (uses SignalRPolicy for CORS with credentials)
app.MapHub<WorkflowHub>("/hubs/workflow").RequireCors("SignalRPolicy");

// Root redirect → Swagger UI
app.MapGet("/", () => Results.Redirect("/swagger"));

// ✅ ENHANCED Health endpoint with DB connectivity + cache stats
app.MapGet("/health", (IServiceProvider sp) =>
{
    var cacheService = sp.GetRequiredService<ICacheService>();
    var stats = cacheService.GetStats();
    return new
    {
        status = "healthy",
        timestamp = DateTime.UtcNow,
        cache = new
        {
            totalKeys = stats.TotalKeys,
            hits = stats.Hits,
            misses = stats.Misses,
            hitRate = stats.HitRate
        }
    };
});

// DEBUG: Tenant resolution check
app.MapGet("/api/debug/tenant", (HttpContext context, ITenantDbContextFactory factory) =>
{
    var tenant = context.Request.Headers[MyApi.Infrastructure.TenantMiddleware.TenantHeaderName].FirstOrDefault();
    var envKey = !string.IsNullOrWhiteSpace(tenant)
        ? TenantConnectionResolver.GetEnvironmentVariableName(tenant)
        : "(none)";
    var envValue = !string.IsNullOrWhiteSpace(tenant)
        ? Environment.GetEnvironmentVariable(envKey)
        : null;

    string resolvedConnPreview;
    string? resolutionError = null;
    try
    {
        resolvedConnPreview = TenantDbContextFactory.DescribeConnectionString(factory.GetConnectionString(tenant));
    }
    catch (Exception ex)
    {
        resolvedConnPreview = "(resolution failed)";
        resolutionError = ex.Message;
    }

    return new
    {
        detectedTenant = tenant ?? "(none)",
        knownTenant = !string.IsNullOrWhiteSpace(tenant) && TenantSlugCache.HasTenant(TenantSlugCache.DefaultDbKey, tenant),
        envVarName = envKey,
        envVarExists = !string.IsNullOrEmpty(envValue),
        dedicatedDbConfigured = !string.IsNullOrWhiteSpace(tenant) && TenantConnectionResolver.HasDedicatedConnectionString(tenant),
        resolvedConnPreview,
        resolutionError
    };
});

app.Run();

public sealed class SqlConsoleExecuteRequest
{
    public string Sql { get; set; } = string.Empty;
    public string Mode { get; set; } = "read";
}

public static class SqlConsoleHelpers
{
    private static readonly string[] BlockedSingleWordTokens =
    {
        "DROP", "ALTER", "CREATE", "TRUNCATE", "GRANT", "REVOKE", "COPY",
        "VACUUM", "REINDEX", "CLUSTER", "CALL", "DO", "RESET",
        "LISTEN", "NOTIFY", "PG_SLEEP", "PG_READ_",
        "LO_IMPORT", "LO_EXPORT", "DBLINK", "PG_TERMINATE_BACKEND",
        "PG_CANCEL_BACKEND", "INFORMATION_SCHEMA", "PG_CATALOG"
    };

    private static readonly string[] BlockedPhrases =
    {
        "SET ROLE", "SECURITY DEFINER"
    };

    public static bool TryFindBlockedToken(string upperSql, out string token)
    {
        foreach (var phrase in BlockedPhrases)
        {
            if (System.Text.RegularExpressions.Regex.IsMatch(upperSql, $@"\b{System.Text.RegularExpressions.Regex.Escape(phrase).Replace("\\ ", @"\s+")}\b"))
            {
                token = phrase;
                return true;
            }
        }

        foreach (var singleWordToken in BlockedSingleWordTokens)
        {
            var pattern = singleWordToken.EndsWith('_')
                ? $@"\b{System.Text.RegularExpressions.Regex.Escape(singleWordToken)}[A-Z0-9_]*\b"
                : $@"\b{System.Text.RegularExpressions.Regex.Escape(singleWordToken)}\b";

            if (System.Text.RegularExpressions.Regex.IsMatch(upperSql, pattern))
            {
                token = singleWordToken;
                return true;
            }
        }

        token = string.Empty;
        return false;
    }

    public static string StripStringsAndComments(string sql)
    {
        sql = System.Text.RegularExpressions.Regex.Replace(sql, @"--[^\n]*", "");
        sql = System.Text.RegularExpressions.Regex.Replace(sql, @"/\*[\s\S]*?\*/", "");
        sql = System.Text.RegularExpressions.Regex.Replace(sql, @"'(?:''|[^'])*'", "''");
        sql = System.Text.RegularExpressions.Regex.Replace(sql, @"""(?:""""|[^""])*""", "\"\"");
        return sql;
    }
}
