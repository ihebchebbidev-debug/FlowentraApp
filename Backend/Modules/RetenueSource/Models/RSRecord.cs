using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApi.Infrastructure;

namespace MyApi.Modules.RetenueSource.Models
{
    [Table("RSRecords")]
    public class RSRecord : ITenantEntity
    {
        public int TenantId { get; set; }
        [Key]
        [Column("Id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [Column("EntityType")]
        [MaxLength(20)]
        public string EntityType { get; set; } = string.Empty; // "offer" or "sale"

        [Required]
        [Column("EntityId")]
        public int EntityId { get; set; }

        [Column("EntityNumber")]
        [MaxLength(50)]
        public string? EntityNumber { get; set; }

        [Required]
        [Column("InvoiceNumber")]
        [MaxLength(100)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        [Column("InvoiceDate")]
        public DateTime InvoiceDate { get; set; }

        [Required]
        [Column("InvoiceAmount", TypeName = "decimal(15,2)")]
        public decimal InvoiceAmount { get; set; }

        [Required]
        [Column("PaymentDate")]
        public DateTime PaymentDate { get; set; }

        [Required]
        [Column("AmountPaid", TypeName = "decimal(15,2)")]
        public decimal AmountPaid { get; set; }

        [Required]
        [Column("RSAmount", TypeName = "decimal(15,2)")]
        public decimal RSAmount { get; set; }

        [Required]
        [Column("RSTypeCode")]
        [MaxLength(10)]
        public string RSTypeCode { get; set; } = "10"; // 10, 05, 03, 20

        [Required]
        [Column("SupplierName")]
        [MaxLength(255)]
        public string SupplierName { get; set; } = string.Empty;

        [Required]
        [Column("SupplierTaxId")]
        [MaxLength(50)]
        public string SupplierTaxId { get; set; } = string.Empty; // Matricule Fiscal

        [Column("SupplierAddress")]
        [MaxLength(500)]
        public string? SupplierAddress { get; set; }

        [Required]
        [Column("PayerName")]
        [MaxLength(255)]
        public string PayerName { get; set; } = string.Empty;

        [Required]
        [Column("PayerTaxId")]
        [MaxLength(50)]
        public string PayerTaxId { get; set; } = string.Empty;

        [Column("PayerAddress")]
        [MaxLength(500)]
        public string? PayerAddress { get; set; }

        [Required]
        [Column("Status")]
        [MaxLength(20)]
        public string Status { get; set; } = "pending"; // pending, exported, error

        [Column("TEJExported")]
        public bool TEJExported { get; set; } = false;

        [Column("TEJFileName")]
        [MaxLength(255)]
        public string? TEJFileName { get; set; }

        /// <summary>
        /// COMPLIANCE CRITICAL: Declaration deadline (20th of month following payment)
        /// </summary>
        [Column("DeclarationDeadline")]
        public DateTime? DeclarationDeadline { get; set; }

        /// <summary>
        /// COMPLIANCE CRITICAL: Is this record past declaration deadline?
        /// </summary>
        [Column("IsOverdue")]
        public bool IsOverdue { get; set; } = false;

        /// <summary>
        /// COMPLIANCE CRITICAL: Days past deadline (for penalty calculation)
        /// </summary>
        [Column("DaysLate")]
        public int DaysLate { get; set; } = 0;

        /// <summary>
        /// COMPLIANCE CRITICAL: Penalty amount for late declaration (Tunisia requirement)
        /// </summary>
        [Column("PenaltyAmount", TypeName = "decimal(15,2)")]
        public decimal PenaltyAmount { get; set; } = 0m;

        /// <summary>
        /// COMPLIANCE MEDIUM: Supplier classification (individual/company/non_resident)
        /// </summary>
        [Column("SupplierType")]
        [MaxLength(20)]
        public string? SupplierType { get; set; } // individual, company, non_resident

        /// <summary>
        /// COMPLIANCE MEDIUM: Is this supplier exempt by bilateral treaty (EU-TN, AGTC, etc)?
        /// </summary>
        [Column("IsExemptByTreaty")]
        public bool IsExemptByTreaty { get; set; } = false;

        /// <summary>
        /// COMPLIANCE MEDIUM: Treaty code if exempt (e.g., "EU-TN", "AGTC")
        /// </summary>
        [Column("TreatyCode")]
        [MaxLength(20)]
        public string? TreatyCode { get; set; }

        /// <summary>
        /// COMPLIANCE MEDIUM: TEJ acceptance number from tax authority
        /// </summary>
        [Column("TEJAcceptanceNumber")]
        [MaxLength(255)]
        public string? TEJAcceptanceNumber { get; set; }

        /// <summary>
        /// COMPLIANCE MEDIUM: TEJ transmission status (pending/accepted/rejected)
        /// </summary>
        [Column("TEJTransmissionStatus")]
        [MaxLength(20)]
        public string TEJTransmissionStatus { get; set; } = "pending"; // pending, accepted, rejected

        [Column("Notes")]
        [MaxLength(1000)]
        public string? Notes { get; set; }

        [Required]
        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [Column("CreatedBy")]
        [MaxLength(100)]
        public string CreatedBy { get; set; } = string.Empty;

        [Column("ModifiedAt")]
        public DateTime? ModifiedAt { get; set; }

        [Column("ModifiedBy")]
        [MaxLength(100)]
        public string? ModifiedBy { get; set; }
    }
}
