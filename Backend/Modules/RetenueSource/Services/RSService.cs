using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.RetenueSource.DTOs;
using MyApi.Modules.RetenueSource.Models;
using MyApi.Modules.Documents.Models;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;

namespace MyApi.Modules.RetenueSource.Services
{
    public class RSService : IRSService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<RSService> _logger;
        private readonly IWebHostEnvironment _env;

        // RS rates by type code
        private static readonly Dictionary<string, decimal> RS_RATES = new()
        {
            { "10", 10m },
            { "05", 0.5m },
            { "03", 3m },
            { "20", 20m }
        };

        public RSService(ApplicationDbContext db, ILogger<RSService> logger, IWebHostEnvironment env)
        {
            _db = db;
            _logger = logger;
            _env = env;
        }

        // ─── CRUD ───

        public async Task<PaginatedRSResponse> GetRSRecordsAsync(
            string? entityType, int? entityId, int? month, int? year,
            string? status, string? supplierTaxId, string? search,
            int page, int limit)
        {
            var query = _db.RSRecords.AsQueryable();

            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(r => r.EntityType == entityType);
            if (entityId.HasValue)
                query = query.Where(r => r.EntityId == entityId.Value);
            if (month.HasValue)
                query = query.Where(r => r.PaymentDate.Month == month.Value);
            if (year.HasValue)
                query = query.Where(r => r.PaymentDate.Year == year.Value);
            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);
            if (!string.IsNullOrEmpty(supplierTaxId))
                query = query.Where(r => r.SupplierTaxId == supplierTaxId);
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(r =>
                    r.InvoiceNumber.ToLower().Contains(s) ||
                    r.SupplierName.ToLower().Contains(s) ||
                    r.SupplierTaxId.ToLower().Contains(s));
            }

            var total = await query.CountAsync();
            var records = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return new PaginatedRSResponse
            {
                Records = records.Select(MapToDto).ToList(),
                Pagination = new RSPaginationInfo
                {
                    Page = page,
                    Limit = limit,
                    Total = total,
                    TotalPages = (int)Math.Ceiling(total / (double)limit)
                }
            };
        }

        public async Task<RSRecordDto?> GetRSRecordByIdAsync(int id)
        {
            var record = await _db.RSRecords.FindAsync(id);
            return record == null ? null : MapToDto(record);
        }

        public async Task<RSRecordDto> CreateRSRecordAsync(CreateRSRecordDto dto, string userId)
        {
            // ─── CRITICAL COMPLIANCE VALIDATIONS ───
            
            // 1. CRITICAL: Tax ID Format Validation (Matricule Fiscal)
            if (string.IsNullOrWhiteSpace(dto.SupplierTaxId))
                throw new ArgumentException("Supplier Tax ID (Matricule Fiscal) is required");
            if (!Regex.IsMatch(dto.SupplierTaxId, @"^\d{10,15}$"))
                throw new ArgumentException("Invalid Matricule Fiscal format: must be 10-15 digits");

            // 2. CRITICAL: Date Validations
            if (dto.PaymentDate > DateTime.UtcNow.Date)
                throw new ArgumentException("Payment date cannot be in the future");
            if (dto.InvoiceDate > dto.PaymentDate)
                throw new ArgumentException("Invoice date cannot be after payment date");

            // 3. Standard Validations
            if (string.IsNullOrWhiteSpace(dto.InvoiceNumber))
                throw new ArgumentException("Invoice number is required");
            if (dto.InvoiceAmount <= 0)
                throw new ArgumentException("Invoice amount must be positive");
            if (dto.AmountPaid <= 0)
                throw new ArgumentException("Amount paid must be positive");
            if (!RS_RATES.ContainsKey(dto.RSTypeCode))
                throw new ArgumentException($"Unknown RS type code: {dto.RSTypeCode}");

            // 4. MEDIUM PRIORITY: Supplier Type & Treaty Validations
            if (dto.IsExemptByTreaty && string.IsNullOrWhiteSpace(dto.TreatyCode))
                throw new ArgumentException("Treaty code is required when exemption by treaty is claimed");

            var rsAmount = CalculateRSAmountInternal(dto.AmountPaid, dto.RSTypeCode);

            // Check for duplicates
            var duplicate = await _db.RSRecords.AnyAsync(r =>
                r.InvoiceNumber == dto.InvoiceNumber &&
                r.PaymentDate == dto.PaymentDate &&
                r.EntityId == dto.EntityId &&
                r.EntityType == dto.EntityType);
            if (duplicate)
                throw new InvalidOperationException("Duplicate RS entry for this invoice and payment date");

            // ─── CRITICAL COMPLIANCE: Calculate Declaration Deadline ───
            // Tunisia requirement: Declaration must be filed by 20th of month following payment
            var paymentNextMonth = dto.PaymentDate.AddMonths(1);
            var declarationDeadline = new DateTime(paymentNextMonth.Year, paymentNextMonth.Month, 20);
            var isOverdue = DateTime.UtcNow > declarationDeadline;
            var daysLate = isOverdue ? (int)(DateTime.UtcNow - declarationDeadline).TotalDays : 0;
            
            // CRITICAL COMPLIANCE: Calculate penalty for late declaration
            // Tunisia: Typically 5% of RS amount per month late (simplified approach)
            decimal penaltyAmount = 0m;
            if (isOverdue && daysLate > 0)
            {
                // 5% per month or part thereof
                int monthsLate = (daysLate / 30) + (daysLate % 30 > 0 ? 1 : 0);
                penaltyAmount = rsAmount * 0.05m * monthsLate;
                _logger.LogWarning("RS Record {Invoice} is overdue by {DaysLate} days, penalty: {Penalty} TND",
                    dto.InvoiceNumber, daysLate, penaltyAmount);
            }

            var record = new RSRecord
            {
                EntityType = dto.EntityType,
                EntityId = dto.EntityId,
                EntityNumber = dto.EntityNumber,
                InvoiceNumber = dto.InvoiceNumber,
                InvoiceDate = dto.InvoiceDate,
                InvoiceAmount = dto.InvoiceAmount,
                PaymentDate = dto.PaymentDate,
                AmountPaid = dto.AmountPaid,
                RSAmount = rsAmount,
                RSTypeCode = dto.RSTypeCode,
                SupplierName = dto.SupplierName,
                SupplierTaxId = dto.SupplierTaxId,
                SupplierAddress = dto.SupplierAddress,
                PayerName = dto.PayerName,
                PayerTaxId = dto.PayerTaxId,
                PayerAddress = dto.PayerAddress,
                Notes = dto.Notes,
                Status = "pending",
                TEJExported = false,
                
                // ─── CRITICAL COMPLIANCE FIELDS ───
                DeclarationDeadline = declarationDeadline,
                IsOverdue = isOverdue,
                DaysLate = daysLate,
                PenaltyAmount = penaltyAmount,
                
                // ─── MEDIUM PRIORITY COMPLIANCE FIELDS ───
                SupplierType = dto.SupplierType,
                IsExemptByTreaty = dto.IsExemptByTreaty,
                TreatyCode = dto.TreatyCode,
                TEJTransmissionStatus = "pending",
                
                // ─── AUDIT TRAIL ───
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId
            };

            _db.RSRecords.Add(record);
            await _db.SaveChangesAsync();

            _logger.LogInformation("RS record created: ID={Id}, Invoice={Invoice}, Amount={Amount}",
                record.Id, record.InvoiceNumber, record.RSAmount);

            return MapToDto(record);
        }

        public async Task<RSRecordDto> UpdateRSRecordAsync(int id, UpdateRSRecordDto dto, string userId)
        {
            var record = await _db.RSRecords.FindAsync(id);
            if (record == null)
                throw new KeyNotFoundException("RS record not found");

            if (record.TEJExported)
                throw new InvalidOperationException("Cannot update an already-exported RS record");

            if (dto.InvoiceNumber != null) record.InvoiceNumber = dto.InvoiceNumber;
            if (dto.InvoiceDate.HasValue) record.InvoiceDate = dto.InvoiceDate.Value;
            if (dto.InvoiceAmount.HasValue) record.InvoiceAmount = dto.InvoiceAmount.Value;
            if (dto.PaymentDate.HasValue) record.PaymentDate = dto.PaymentDate.Value;
            if (dto.AmountPaid.HasValue) record.AmountPaid = dto.AmountPaid.Value;
            if (dto.RSTypeCode != null) record.RSTypeCode = dto.RSTypeCode;
            if (dto.SupplierName != null) record.SupplierName = dto.SupplierName;
            if (dto.SupplierTaxId != null) record.SupplierTaxId = dto.SupplierTaxId;
            if (dto.SupplierAddress != null) record.SupplierAddress = dto.SupplierAddress;
            if (dto.PayerName != null) record.PayerName = dto.PayerName;
            if (dto.PayerTaxId != null) record.PayerTaxId = dto.PayerTaxId;
            if (dto.PayerAddress != null) record.PayerAddress = dto.PayerAddress;
            if (dto.Notes != null) record.Notes = dto.Notes;
            if (dto.Status != null) record.Status = dto.Status;

            // Recalculate RS amount if amount or type changed
            if (dto.AmountPaid.HasValue || dto.RSTypeCode != null)
            {
                record.RSAmount = CalculateRSAmountInternal(record.AmountPaid, record.RSTypeCode);
            }

            // ─── Update Compliance Fields ───
            if (dto.SupplierType != null) record.SupplierType = dto.SupplierType;
            if (dto.IsExemptByTreaty.HasValue) record.IsExemptByTreaty = dto.IsExemptByTreaty.Value;
            if (dto.TreatyCode != null) record.TreatyCode = dto.TreatyCode;
            if (dto.TEJAcceptanceNumber != null) record.TEJAcceptanceNumber = dto.TEJAcceptanceNumber;
            if (dto.TEJTransmissionStatus != null) record.TEJTransmissionStatus = dto.TEJTransmissionStatus;

            record.ModifiedAt = DateTime.UtcNow;
            record.ModifiedBy = userId;

            await _db.SaveChangesAsync();
            return MapToDto(record);
        }

        public async Task<bool> DeleteRSRecordAsync(int id)
        {
            var record = await _db.RSRecords.FindAsync(id);
            if (record == null) return false;
            if (record.TEJExported)
                throw new InvalidOperationException("Cannot delete an already-exported RS record");

            _db.RSRecords.Remove(record);
            await _db.SaveChangesAsync();
            return true;
        }

        // ─── Calculation ───

        public RSCalculationDto CalculateRS(decimal amountPaid, string rsTypeCode)
        {
            if (!RS_RATES.TryGetValue(rsTypeCode, out var rate))
                throw new ArgumentException($"Unknown RS type code: {rsTypeCode}");

            var rsAmount = CalculateRSAmountInternal(amountPaid, rsTypeCode);
            return new RSCalculationDto
            {
                AmountPaid = amountPaid,
                RSTypeCode = rsTypeCode,
                RSRate = rate,
                RSAmount = rsAmount,
                NetPayment = Math.Round(amountPaid - rsAmount, 2)
            };
        }

        // ─── TEJ Export ───

        /// <summary>
        /// CRITICAL COMPLIANCE: Validate all records meet Tunisia tax authority requirements before export
        /// </summary>
        private void ValidateComplianceBeforeExport(List<RSRecord> records)
        {
            var complianceErrors = new List<string>();

            foreach (var record in records)
            {
                // Check for overdue records
                if (record.IsOverdue)
                    complianceErrors.Add($"Invoice {record.InvoiceNumber}: Past declaration deadline by {record.DaysLate} days (penalty: {record.PenaltyAmount:F2} TND)");

                // Check declaration deadline is set
                if (record.DeclarationDeadline == null)
                    complianceErrors.Add($"Invoice {record.InvoiceNumber}: Declaration deadline not calculated");

                // Warn if supplier type not classified (medium priority, not blocking)
                if (string.IsNullOrEmpty(record.SupplierType))
                    _logger.LogWarning("RS Record {Invoice}: Supplier type not classified", record.InvoiceNumber);
            }

            // Block export if critical compliance issues found
            if (complianceErrors.Count > 0)
            {
                throw new InvalidOperationException($"Compliance validation failed:\n{string.Join("\n", complianceErrors)}");
            }

            _logger.LogInformation("Compliance validation passed for {Count} records", records.Count);
        }

        public async Task<TEJExportResponseDto> ExportTEJAsync(TEJExportRequestDto request, string userId)
        {
            var records = await _db.RSRecords
                .Where(r => r.PaymentDate.Month == request.Month &&
                            r.PaymentDate.Year == request.Year &&
                            r.Status == "pending" &&
                            !r.TEJExported)
                .ToListAsync();

            if (records.Count == 0)
                throw new InvalidOperationException("No pending RS records found for the selected month");

            // ─── CRITICAL: Validate all records comply before export ───
            try
            {
                ValidateComplianceBeforeExport(records);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Export blocked: Compliance validation failed for {Month}/{Year}", request.Month, request.Year);
                throw new InvalidOperationException($"Cannot export: {ex.Message}");
            }

            // Determine declarant
            var declarant = request.Declarant ?? new TEJDeclarantDto
            {
                Name = records.First().PayerName,
                TaxId = records.First().PayerTaxId,
                Address = records.First().PayerAddress ?? ""
            };

            // Generate TEJ XML
            var fileName = $"{declarant.TaxId}-{request.Year}-{request.Month:D2}-0.xml";
            string xmlContent;
            try
            {
                xmlContent = GenerateTEJXml(declarant, records);
            }
            catch (Exception ex)
            {
                var errorLog = new TEJExportLog
                {
                    FileName = fileName,
                    ExportDate = DateTime.UtcNow,
                    ExportedBy = userId,
                    Month = request.Month,
                    Year = request.Year,
                    RecordCount = records.Count,
                    TotalRSAmount = records.Sum(r => r.RSAmount),
                    Status = "error",
                    ErrorMessage = ex.Message
                };
                _db.TEJExportLogs.Add(errorLog);
                await _db.SaveChangesAsync();

                return new TEJExportResponseDto
                {
                    LogId = errorLog.Id,
                    FileName = fileName,
                    RecordCount = records.Count,
                    TotalRSAmount = errorLog.TotalRSAmount,
                    Status = "error",
                    ErrorMessage = ex.Message
                };
            }

            // Save XML file as a Document
            int? documentId = null;
            try
            {
                documentId = await SaveTEJFileAsDocument(fileName, xmlContent, request, userId, records);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save TEJ file as document, continuing without document link");
            }

            // Mark records as exported
            foreach (var r in records)
            {
                r.Status = "exported";
                r.TEJExported = true;
                r.TEJFileName = fileName;
                r.ModifiedAt = DateTime.UtcNow;
                r.ModifiedBy = userId;
            }

            var log = new TEJExportLog
            {
                FileName = fileName,
                ExportDate = DateTime.UtcNow,
                ExportedBy = userId,
                Month = request.Month,
                Year = request.Year,
                RecordCount = records.Count,
                TotalRSAmount = records.Sum(r => r.RSAmount),
                Status = "success",
                DocumentId = documentId
            };

            _db.TEJExportLogs.Add(log);
            await _db.SaveChangesAsync();

            _logger.LogInformation("TEJ export completed: {FileName}, {Count} records, total RS={Total}",
                fileName, records.Count, log.TotalRSAmount);

            return new TEJExportResponseDto
            {
                LogId = log.Id,
                FileName = fileName,
                RecordCount = records.Count,
                TotalRSAmount = log.TotalRSAmount,
                Status = "success",
                DocumentId = documentId
            };
        }

        public async Task<List<TEJExportLogDto>> GetTEJExportLogsAsync(int? year = null)
        {
            var query = _db.TEJExportLogs.AsQueryable();
            if (year.HasValue)
                query = query.Where(l => l.Year == year.Value);

            var logs = await query.OrderByDescending(l => l.ExportDate).ToListAsync();
            return logs.Select(l => new TEJExportLogDto
            {
                Id = l.Id,
                FileName = l.FileName,
                ExportDate = l.ExportDate,
                ExportedBy = l.ExportedBy,
                Month = l.Month,
                Year = l.Year,
                RecordCount = l.RecordCount,
                TotalRSAmount = l.TotalRSAmount,
                Status = l.Status,
                ErrorMessage = l.ErrorMessage,
                DocumentId = l.DocumentId
            }).ToList();
        }

        // ─── Stats ───

        public async Task<RSStatsDto> GetRSStatsAsync(string? entityType, int? entityId, int? month, int? year)
        {
            var query = _db.RSRecords.AsQueryable();
            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(r => r.EntityType == entityType);
            if (entityId.HasValue)
                query = query.Where(r => r.EntityId == entityId.Value);
            if (month.HasValue)
                query = query.Where(r => r.PaymentDate.Month == month.Value);
            if (year.HasValue)
                query = query.Where(r => r.PaymentDate.Year == year.Value);

            return new RSStatsDto
            {
                TotalRecords = await query.CountAsync(),
                PendingRecords = await query.CountAsync(r => r.Status == "pending"),
                ExportedRecords = await query.CountAsync(r => r.Status == "exported"),
                TotalRSAmount = await query.SumAsync(r => r.RSAmount),
                TotalAmountPaid = await query.SumAsync(r => r.AmountPaid)
            };
        }

        // ─── Private Helpers ───

        private decimal CalculateRSAmountInternal(decimal amountPaid, string rsTypeCode)
        {
            if (!RS_RATES.TryGetValue(rsTypeCode, out var rate))
                throw new ArgumentException($"Unknown RS type code: {rsTypeCode}");
            return Math.Round(amountPaid * rate / 100m, 2);
        }

        private string GenerateTEJXml(TEJDeclarantDto declarant, List<RSRecord> records)
        {
            var settings = new XmlWriterSettings
            {
                Indent = true,
                Encoding = Encoding.UTF8,
                OmitXmlDeclaration = false
            };

            using var ms = new MemoryStream();
            using (var writer = XmlWriter.Create(ms, settings))
            {
                writer.WriteStartDocument();
                
                // Root element with metadata attributes
                writer.WriteStartElement("Declaration");
                writer.WriteAttributeString("Version", "2.0");
                writer.WriteAttributeString("TransmissionDateTime", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"));
                writer.WriteAttributeString("DeclarationPeriod", $"{records.First().PaymentDate.Year}-{records.First().PaymentDate.Month:D2}");

                // ─── Declaration Header ───
                writer.WriteStartElement("DeclarationHeader");
                writer.WriteElementString("DeclarationType", "RETENUE_A_LA_SOURCE");
                writer.WriteElementString("TaxYear", records.First().PaymentDate.Year.ToString());
                writer.WriteElementString("DeclarationMonth", records.First().PaymentDate.Month.ToString());
                writer.WriteElementString("TotalRecords", records.Count.ToString());
                writer.WriteElementString("TotalWithheldAmount", records.Sum(r => r.RSAmount).ToString("F2"));
                writer.WriteElementString("CurrentDateTime", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss"));
                writer.WriteEndElement(); // DeclarationHeader

                // ─── Declarant (Enhanced) ───
                writer.WriteStartElement("Declarant");
                writer.WriteElementString("Name", declarant.Name);
                writer.WriteElementString("TaxID", declarant.TaxId);
                writer.WriteElementString("Country", "TN"); // Tunisia
                writer.WriteElementString("Address", declarant.Address);
                if (!string.IsNullOrEmpty(declarant.Email))
                    writer.WriteElementString("Email", declarant.Email);
                if (!string.IsNullOrEmpty(declarant.Phone))
                    writer.WriteElementString("Phone", declarant.Phone);
                writer.WriteElementString("ActivityCode", ""); // Could be mapped from entity
                writer.WriteEndElement(); // Declarant

                // ─── Beneficiaries (Enhanced) ───
                writer.WriteStartElement("Beneficiaries");
                
                decimal totalAmount = 0;
                decimal totalRSAmount = 0;
                
                foreach (var r in records)
                {
                    totalAmount += r.AmountPaid;
                    totalRSAmount += r.RSAmount;

                    writer.WriteStartElement("Beneficiary");
                    
                    // Basic Info
                    writer.WriteElementString("Name", r.SupplierName);
                    writer.WriteElementString("TaxID", r.SupplierTaxId);
                    writer.WriteElementString("Address", r.SupplierAddress ?? "");
                    writer.WriteElementString("Country", "TN"); // Default to Tunisia
                    
                    // Invoice Details
                    writer.WriteStartElement("Invoice");
                    writer.WriteElementString("Number", r.InvoiceNumber);
                    writer.WriteElementString("Date", r.InvoiceDate.ToString("yyyy-MM-dd"));
                    writer.WriteElementString("Amount", r.InvoiceAmount.ToString("F2"));
                    writer.WriteEndElement(); // Invoice

                    // Payment Details
                    writer.WriteStartElement("Payment");
                    writer.WriteElementString("Date", r.PaymentDate.ToString("yyyy-MM-dd"));
                    writer.WriteElementString("Amount", r.AmountPaid.ToString("F2"));
                    writer.WriteEndElement(); // Payment

                    // Withholding Details
                    writer.WriteStartElement("Withholding");
                    writer.WriteElementString("TypeCode", r.RSTypeCode);
                    writer.WriteElementString("Rate", GetRSRate(r.RSTypeCode).ToString("F2"));
                    writer.WriteElementString("Amount", r.RSAmount.ToString("F2"));
                    writer.WriteElementString("Stage", "FINAL"); // Could be provisional/advance/final
                    writer.WriteElementString("IsPartial", "false"); // Could reference IsPartialWithholding if model has it
                    writer.WriteEndElement(); // Withholding

                    // Compliance Metadata
                    writer.WriteStartElement("Compliance");
                    writer.WriteElementString("RecordID", r.Id.ToString());
                    writer.WriteElementString("CreatedDate", r.CreatedAt.ToString("yyyy-MM-dd"));
                    writer.WriteElementString("Status", r.Status ?? "PENDING");
                    writer.WriteElementString("Notes", r.Notes ?? "");
                    writer.WriteEndElement(); // Compliance

                    writer.WriteEndElement(); // Beneficiary
                }
                
                writer.WriteEndElement(); // Beneficiaries

                // ─── Summary Statistics ───
                writer.WriteStartElement("Summary");
                writer.WriteElementString("RecordCount", records.Count.ToString());
                writer.WriteElementString("TotalPaymentAmount", totalAmount.ToString("F2"));
                writer.WriteElementString("TotalWithheldAmount", totalRSAmount.ToString("F2"));
                decimal avgRate = records.Count > 0 ? (totalRSAmount / totalAmount) * 100 : 0;
                writer.WriteElementString("AverageWithholdingRate", avgRate.ToString("F2"));
                writer.WriteEndElement(); // Summary

                writer.WriteEndElement(); // Declaration
                writer.WriteEndDocument();
            }

            return Encoding.UTF8.GetString(ms.ToArray());
        }

        private async Task<int> SaveTEJFileAsDocument(
            string fileName, string xmlContent,
            TEJExportRequestDto request, string userId,
            List<RSRecord> records)
        {
            // Save the XML file to disk
            var backendRoot = _env.ContentRootPath;
            var parentDir = Directory.GetParent(backendRoot)?.FullName ?? backendRoot;
            var uploadsDir = Path.Combine(parentDir, "uploads", "tej_exports");
            if (!Directory.Exists(uploadsDir))
                Directory.CreateDirectory(uploadsDir);

            var diskPath = Path.Combine(uploadsDir, fileName);
            await File.WriteAllTextAsync(diskPath, xmlContent, Encoding.UTF8);

            var fileSize = new FileInfo(diskPath).Length;

            // Determine moduleType based on records
            var entityTypes = records.Select(r => r.EntityType).Distinct().ToList();
            var moduleType = entityTypes.Count == 1 ? entityTypes[0] + "s" : "retenue_source"; // "offers" or "sales"
            var moduleId = entityTypes.Count == 1 && records.Select(r => r.EntityId).Distinct().Count() == 1
                ? records.First().EntityId.ToString()
                : null;

            var doc = new Document
            {
                FileName = fileName,
                OriginalName = fileName,
                FilePath = $"/uploads/tej_exports/{fileName}",
                FileSize = fileSize,
                ContentType = "application/xml",
                ModuleType = moduleType,
                ModuleId = moduleId,
                ModuleName = $"TEJ Export {request.Year}-{request.Month:D2}",
                Category = "fiscal",
                Description = $"TEJ XML export for {request.Month:D2}/{request.Year} - {records.Count} records, total RS: {records.Sum(r => r.RSAmount):F2} TND",
                Tags = "tej,retenue-source,fiscal",
                IsPublic = false,
                UploadedBy = userId,
                UploadedAt = DateTime.UtcNow
            };

            _db.Documents.Add(doc);
            await _db.SaveChangesAsync();

            return doc.Id;
        }

        private decimal GetRSRate(string typeCode)
        {
            return RS_RATES.ContainsKey(typeCode) ? RS_RATES[typeCode] : 0m;
        }

        private static RSRecordDto MapToDto(RSRecord r) => new()
        {
            Id = r.Id,
            EntityType = r.EntityType,
            EntityId = r.EntityId,
            EntityNumber = r.EntityNumber,
            InvoiceNumber = r.InvoiceNumber,
            InvoiceDate = r.InvoiceDate,
            InvoiceAmount = r.InvoiceAmount,
            PaymentDate = r.PaymentDate,
            AmountPaid = r.AmountPaid,
            RSAmount = r.RSAmount,
            RSTypeCode = r.RSTypeCode,
            SupplierName = r.SupplierName,
            SupplierTaxId = r.SupplierTaxId,
            SupplierAddress = r.SupplierAddress,
            PayerName = r.PayerName,
            PayerTaxId = r.PayerTaxId,
            PayerAddress = r.PayerAddress,
            Status = r.Status,
            TEJExported = r.TEJExported,
            TEJFileName = r.TEJFileName,
            Notes = r.Notes,
            
            // CRITICAL COMPLIANCE FIELDS
            DeclarationDeadline = r.DeclarationDeadline,
            IsOverdue = r.IsOverdue,
            DaysLate = r.DaysLate,
            PenaltyAmount = r.PenaltyAmount,
            
            // MEDIUM PRIORITY COMPLIANCE FIELDS
            SupplierType = r.SupplierType,
            IsExemptByTreaty = r.IsExemptByTreaty,
            TreatyCode = r.TreatyCode,
            TEJAcceptanceNumber = r.TEJAcceptanceNumber,
            TEJTransmissionStatus = r.TEJTransmissionStatus,
            
            // AUDIT TRAIL
            CreatedAt = r.CreatedAt,
            CreatedBy = r.CreatedBy,
            ModifiedAt = r.ModifiedAt,
            ModifiedBy = r.ModifiedBy
        };
    }
}
