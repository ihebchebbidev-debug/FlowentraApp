using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApi.Infrastructure;

namespace MyApi.Modules.Sales.Models
{
    [ModuleScope("sales")]
    [Table("SaleItems")]
    public class SaleItem : ITenantEntity
    {
        public int TenantId { get; set; }
        [Key]
        [Column("Id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [Column("SaleId")]
        public int SaleId { get; set; }

        [Column("ArticleId")]
        public int? ArticleId { get; set; }

        [Required]
        [Column("Description")]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Column("Quantity", TypeName = "decimal(18,2)")]
        public decimal Quantity { get; set; } = 1;

        [Required]
        [Column("UnitPrice", TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; } = 0;

        [Column("Discount", TypeName = "decimal(5,2)")]
        public decimal? Discount { get; set; }

        [Required]
        [Column("TaxRate", TypeName = "decimal(5,2)")]
        public decimal TaxRate { get; set; } = 0;

        [Column("LineTotal", TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; } = 0;

        [Column("DisplayOrder")]
        public int DisplayOrder { get; set; } = 0;

        [Column("Type")]
        [MaxLength(20)]
        public string Type { get; set; } = "article";

        [Column("ItemName")]
        [MaxLength(255)]
        public string? ItemName { get; set; }

        [Column("ItemCode")]
        [MaxLength(100)]
        public string? ItemCode { get; set; }

        [Column("InstallationId")]
        [MaxLength(50)]
        public string? InstallationId { get; set; }

        [Column("InstallationName")]
        [MaxLength(255)]
        public string? InstallationName { get; set; }

        [Column("DiscountType")]
        [MaxLength(20)]
        public string DiscountType { get; set; } = "percentage";

        [Column("RequiresServiceOrder")]
        public bool RequiresServiceOrder { get; set; } = false;

        [Column("ServiceOrderGenerated")]
        public bool ServiceOrderGenerated { get; set; } = false;

        [Column("ServiceOrderId")]
        [MaxLength(50)]
        public string? ServiceOrderId { get; set; }

        [Column("FulfillmentStatus")]
        [MaxLength(20)]
        public string? FulfillmentStatus { get; set; }

        // Currency this line was priced in. Populated from Sale.Currency at write
        // time so every historical line remembers its currency even if the parent
        // sale is later re-currencied. Nullable for legacy rows (interpreted as
        // the parent sale's Currency).
        [Column("Currency")]
        [MaxLength(10)]
        public string? Currency { get; set; }

        // Navigation Property
        [ForeignKey("SaleId")]
        public virtual Sale? Sale { get; set; }
    }
}
