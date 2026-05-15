using Microsoft.EntityFrameworkCore;
using MyApi.Modules.Purchases.Models;
using MyApi.Modules.Shared.Data.Configurations;

namespace MyApi.Modules.Purchases.Data
{
    public class PurchaseOrderConfiguration : IEntityConfiguration
    {
        public void Configure(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PurchaseOrder>(entity =>
            {
                entity.ToTable("PurchaseOrders");
                entity.HasKey(e => e.Id);
                entity.HasMany(e => e.Items).WithOne(i => i.PurchaseOrder).HasForeignKey(i => i.PurchaseOrderId).OnDelete(DeleteBehavior.Cascade);
                entity.HasMany(e => e.Activities).WithOne().HasForeignKey("EntityId").IsRequired(false);
            });
        }
    }

    public class PurchaseOrderItemConfiguration : IEntityConfiguration
    {
        public void Configure(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PurchaseOrderItem>(entity =>
            {
                entity.ToTable("PurchaseOrderItems");
                entity.HasKey(e => e.Id);
            });
        }
    }

    public class GoodsReceiptConfiguration : IEntityConfiguration
    {
        public void Configure(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<GoodsReceipt>(entity =>
            {
                entity.ToTable("GoodsReceipts");
                entity.HasKey(e => e.Id);
                entity.HasMany(e => e.Items).WithOne(i => i.GoodsReceipt).HasForeignKey(i => i.GoodsReceiptId).OnDelete(DeleteBehavior.Cascade);
            });
        }
    }

    public class GoodsReceiptItemConfiguration : IEntityConfiguration
    {
        public void Configure(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<GoodsReceiptItem>(entity =>
            {
                entity.ToTable("GoodsReceiptItems");
                entity.HasKey(e => e.Id);
            });
        }
    }

    public class SupplierInvoiceConfiguration : IEntityConfiguration
    {
        public void Configure(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SupplierInvoice>(entity =>
            {
                entity.ToTable("SupplierInvoices");
                entity.HasKey(e => e.Id);
                entity.HasMany(e => e.Items).WithOne(i => i.SupplierInvoice).HasForeignKey(i => i.SupplierInvoiceId).OnDelete(DeleteBehavior.Cascade);
            });
        }
    }

    public class SupplierInvoiceItemConfiguration : IEntityConfiguration
    {
        public void Configure(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SupplierInvoiceItem>(entity =>
            {
                entity.ToTable("SupplierInvoiceItems");
                entity.HasKey(e => e.Id);
            });
        }
    }

    public class ArticleSupplierConfiguration : IEntityConfiguration
    {
        public void Configure(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ArticleSupplier>(entity =>
            {
                entity.ToTable("ArticleSuppliers");
                entity.HasKey(e => e.Id);
                // Restrict (was Cascade): we now soft-delete ArticleSupplier so price
                // history must remain intact. Restrict prevents a future hard delete
                // from silently dropping the historical price audit trail.
                entity.HasMany(e => e.PriceHistory).WithOne(h => h.ArticleSupplier).HasForeignKey(h => h.ArticleSupplierId).OnDelete(DeleteBehavior.Restrict);
            });
        }
    }

    public class ArticleSupplierPriceHistoryConfiguration : IEntityConfiguration
    {
        public void Configure(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ArticleSupplierPriceHistory>(entity =>
            {
                entity.ToTable("ArticleSupplierPriceHistory");
                entity.HasKey(e => e.Id);
            });
        }
    }

    public class PurchaseActivityConfiguration : IEntityConfiguration
    {
        public void Configure(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PurchaseActivity>(entity =>
            {
                entity.ToTable("PurchaseActivities");
                entity.HasKey(e => e.Id);
            });
        }
    }
}
