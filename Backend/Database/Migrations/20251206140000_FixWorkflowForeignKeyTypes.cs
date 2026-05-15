using Microsoft.EntityFrameworkCore.Migrations;

namespace MyApi.Database.Migrations
{
    /// <summary>
    /// Fixes foreign key column types in workflow tables:
    /// - Sales.OfferId: varchar(50) → integer
    /// - ServiceOrders.SaleId: varchar(50) → integer  
    /// - ServiceOrders.OfferId: varchar(50) → integer
    /// - SaleItems.ServiceOrderId: varchar(50) → integer
    /// - OfferItems.InstallationId: varchar(50) → integer
    /// - SaleItems.InstallationId: varchar(50) → integer
    /// - ServiceOrderJobs.InstallationId: varchar(50) → integer
    /// - ServiceOrderJobs.SaleItemId: varchar(50) → integer
    /// </summary>
    public partial class FixWorkflowForeignKeyTypes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop existing data in these columns (they're mostly empty or have string IDs)
            // Then alter the column types

            // ============= SALES TABLE =============
            // Convert OfferId from varchar to integer
            migrationBuilder.Sql(@"
                -- First, update any existing varchar IDs to NULL if they can't be converted
                UPDATE ""Sales"" SET ""OfferId"" = NULL WHERE ""OfferId"" IS NOT NULL AND ""OfferId"" !~ '^\d+$';
                
                -- Alter column type with conversion
                ALTER TABLE ""Sales"" 
                ALTER COLUMN ""OfferId"" TYPE integer 
                USING NULLIF(""OfferId"", '')::integer;
            ");

            // ============= SERVICE ORDERS TABLE =============
            // Convert SaleId from varchar to integer
            migrationBuilder.Sql(@"
                UPDATE ""ServiceOrders"" SET ""SaleId"" = NULL WHERE ""SaleId"" IS NOT NULL AND ""SaleId"" !~ '^\d+$';
                ALTER TABLE ""ServiceOrders"" 
                ALTER COLUMN ""SaleId"" TYPE integer 
                USING NULLIF(""SaleId"", '')::integer;
            ");

            // Convert OfferId from varchar to integer
            migrationBuilder.Sql(@"
                UPDATE ""ServiceOrders"" SET ""OfferId"" = NULL WHERE ""OfferId"" IS NOT NULL AND ""OfferId"" !~ '^\d+$';
                ALTER TABLE ""ServiceOrders"" 
                ALTER COLUMN ""OfferId"" TYPE integer 
                USING NULLIF(""OfferId"", '')::integer;
            ");

            // ============= SALE ITEMS TABLE =============
            // Convert ServiceOrderId from varchar to integer
            migrationBuilder.Sql(@"
                UPDATE ""SaleItems"" SET ""ServiceOrderId"" = NULL WHERE ""ServiceOrderId"" IS NOT NULL AND ""ServiceOrderId"" !~ '^\d+$';
                ALTER TABLE ""SaleItems"" 
                ALTER COLUMN ""ServiceOrderId"" TYPE integer 
                USING NULLIF(""ServiceOrderId"", '')::integer;
            ");

            // Convert InstallationId from varchar to integer
            migrationBuilder.Sql(@"
                UPDATE ""SaleItems"" SET ""InstallationId"" = NULL WHERE ""InstallationId"" IS NOT NULL AND ""InstallationId"" !~ '^\d+$';
                ALTER TABLE ""SaleItems"" 
                ALTER COLUMN ""InstallationId"" TYPE integer 
                USING NULLIF(""InstallationId"", '')::integer;
            ");

            // ============= OFFER ITEMS TABLE =============
            // Convert InstallationId from varchar to integer
            migrationBuilder.Sql(@"
                UPDATE ""OfferItems"" SET ""InstallationId"" = NULL WHERE ""InstallationId"" IS NOT NULL AND ""InstallationId"" !~ '^\d+$';
                ALTER TABLE ""OfferItems"" 
                ALTER COLUMN ""InstallationId"" TYPE integer 
                USING NULLIF(""InstallationId"", '')::integer;
            ");

            // ============= SERVICE ORDER JOBS TABLE =============
            // Convert InstallationId from varchar to integer
            migrationBuilder.Sql(@"
                UPDATE ""ServiceOrderJobs"" SET ""InstallationId"" = NULL WHERE ""InstallationId"" IS NOT NULL AND ""InstallationId"" !~ '^\d+$';
                ALTER TABLE ""ServiceOrderJobs"" 
                ALTER COLUMN ""InstallationId"" TYPE integer 
                USING NULLIF(""InstallationId"", '')::integer;
            ");

            // Convert SaleItemId from varchar to integer
            migrationBuilder.Sql(@"
                UPDATE ""ServiceOrderJobs"" SET ""SaleItemId"" = NULL WHERE ""SaleItemId"" IS NOT NULL AND ""SaleItemId"" !~ '^\d+$';
                ALTER TABLE ""ServiceOrderJobs"" 
                ALTER COLUMN ""SaleItemId"" TYPE integer 
                USING NULLIF(""SaleItemId"", '')::integer;
            ");

            // ============= ADD FOREIGN KEY CONSTRAINTS =============
            migrationBuilder.Sql(@"
                -- Add foreign key constraints where appropriate
                -- Note: Only add if referenced tables exist and data is clean

                -- Sales.OfferId -> Offers.Id
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_Sales_Offers_OfferId'
                    ) THEN
                        ALTER TABLE ""Sales"" 
                        ADD CONSTRAINT ""FK_Sales_Offers_OfferId"" 
                        FOREIGN KEY (""OfferId"") REFERENCES ""Offers""(""Id"") ON DELETE SET NULL;
                    END IF;
                END $$;

                -- ServiceOrders.SaleId -> Sales.Id
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_ServiceOrders_Sales_SaleId'
                    ) THEN
                        ALTER TABLE ""ServiceOrders"" 
                        ADD CONSTRAINT ""FK_ServiceOrders_Sales_SaleId"" 
                        FOREIGN KEY (""SaleId"") REFERENCES ""Sales""(""Id"") ON DELETE SET NULL;
                    END IF;
                END $$;

                -- ServiceOrders.OfferId -> Offers.Id
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_ServiceOrders_Offers_OfferId'
                    ) THEN
                        ALTER TABLE ""ServiceOrders"" 
                        ADD CONSTRAINT ""FK_ServiceOrders_Offers_OfferId"" 
                        FOREIGN KEY (""OfferId"") REFERENCES ""Offers""(""Id"") ON DELETE SET NULL;
                    END IF;
                END $$;

                -- SaleItems.ServiceOrderId -> ServiceOrders.Id  
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_SaleItems_ServiceOrders_ServiceOrderId'
                    ) THEN
                        ALTER TABLE ""SaleItems"" 
                        ADD CONSTRAINT ""FK_SaleItems_ServiceOrders_ServiceOrderId"" 
                        FOREIGN KEY (""ServiceOrderId"") REFERENCES ""ServiceOrders""(""Id"") ON DELETE SET NULL;
                    END IF;
                END $$;

                -- SaleItems.InstallationId -> Installations.Id
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_SaleItems_Installations_InstallationId'
                    ) THEN
                        ALTER TABLE ""SaleItems"" 
                        ADD CONSTRAINT ""FK_SaleItems_Installations_InstallationId"" 
                        FOREIGN KEY (""InstallationId"") REFERENCES ""Installations""(""Id"") ON DELETE SET NULL;
                    END IF;
                END $$;

                -- OfferItems.InstallationId -> Installations.Id
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_OfferItems_Installations_InstallationId'
                    ) THEN
                        ALTER TABLE ""OfferItems"" 
                        ADD CONSTRAINT ""FK_OfferItems_Installations_InstallationId"" 
                        FOREIGN KEY (""InstallationId"") REFERENCES ""Installations""(""Id"") ON DELETE SET NULL;
                    END IF;
                END $$;

                -- ServiceOrderJobs.InstallationId -> Installations.Id
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_ServiceOrderJobs_Installations_InstallationId'
                    ) THEN
                        ALTER TABLE ""ServiceOrderJobs"" 
                        ADD CONSTRAINT ""FK_ServiceOrderJobs_Installations_InstallationId"" 
                        FOREIGN KEY (""InstallationId"") REFERENCES ""Installations""(""Id"") ON DELETE SET NULL;
                    END IF;
                END $$;

                -- ServiceOrderJobs.SaleItemId -> SaleItems.Id
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_ServiceOrderJobs_SaleItems_SaleItemId'
                    ) THEN
                        ALTER TABLE ""ServiceOrderJobs"" 
                        ADD CONSTRAINT ""FK_ServiceOrderJobs_SaleItems_SaleItemId"" 
                        FOREIGN KEY (""SaleItemId"") REFERENCES ""SaleItems""(""Id"") ON DELETE SET NULL;
                    END IF;
                END $$;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove foreign key constraints
            migrationBuilder.Sql(@"
                ALTER TABLE ""Sales"" DROP CONSTRAINT IF EXISTS ""FK_Sales_Offers_OfferId"";
                ALTER TABLE ""ServiceOrders"" DROP CONSTRAINT IF EXISTS ""FK_ServiceOrders_Sales_SaleId"";
                ALTER TABLE ""ServiceOrders"" DROP CONSTRAINT IF EXISTS ""FK_ServiceOrders_Offers_OfferId"";
                ALTER TABLE ""SaleItems"" DROP CONSTRAINT IF EXISTS ""FK_SaleItems_ServiceOrders_ServiceOrderId"";
                ALTER TABLE ""SaleItems"" DROP CONSTRAINT IF EXISTS ""FK_SaleItems_Installations_InstallationId"";
                ALTER TABLE ""OfferItems"" DROP CONSTRAINT IF EXISTS ""FK_OfferItems_Installations_InstallationId"";
                ALTER TABLE ""ServiceOrderJobs"" DROP CONSTRAINT IF EXISTS ""FK_ServiceOrderJobs_Installations_InstallationId"";
                ALTER TABLE ""ServiceOrderJobs"" DROP CONSTRAINT IF EXISTS ""FK_ServiceOrderJobs_SaleItems_SaleItemId"";
            ");

            // Revert column types back to varchar(50)
            migrationBuilder.Sql(@"
                ALTER TABLE ""Sales"" ALTER COLUMN ""OfferId"" TYPE varchar(50) USING ""OfferId""::varchar;
                ALTER TABLE ""ServiceOrders"" ALTER COLUMN ""SaleId"" TYPE varchar(50) USING ""SaleId""::varchar;
                ALTER TABLE ""ServiceOrders"" ALTER COLUMN ""OfferId"" TYPE varchar(50) USING ""OfferId""::varchar;
                ALTER TABLE ""SaleItems"" ALTER COLUMN ""ServiceOrderId"" TYPE varchar(50) USING ""ServiceOrderId""::varchar;
                ALTER TABLE ""SaleItems"" ALTER COLUMN ""InstallationId"" TYPE varchar(50) USING ""InstallationId""::varchar;
                ALTER TABLE ""OfferItems"" ALTER COLUMN ""InstallationId"" TYPE varchar(50) USING ""InstallationId""::varchar;
                ALTER TABLE ""ServiceOrderJobs"" ALTER COLUMN ""InstallationId"" TYPE varchar(50) USING ""InstallationId""::varchar;
                ALTER TABLE ""ServiceOrderJobs"" ALTER COLUMN ""SaleItemId"" TYPE varchar(50) USING ""SaleItemId""::varchar;
            ");
        }
    }
}
