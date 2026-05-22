-- ============================================================
-- TEJ / RiTEJ Compliance Migration
-- Implements official DGI cahier de charges (v1.0):
--   * Structured Beneficiaire (TypeIdentifiant + CategorieContribuable + Residence)
--   * Per-certificate operation code (IdTypeOperation: RS1_xxx, RS2_xxx, ...)
--   * Supplier invoices participate in RS / TEJ exports
--   * Rectification metadata (acte de dépôt, année facturation, ref. certif.)
-- ============================================================

-- ── 1. Contacts: fiscal identity (PM/PP, resident, ID type, birth date, country) ──
ALTER TABLE "Contacts"
    ADD COLUMN IF NOT EXISTS "CategorieContribuable" varchar(2) NULL,   -- 'PM' or 'PP'
    ADD COLUMN IF NOT EXISTS "IsResident"           boolean   NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS "IdTaxpayerType"       smallint  NULL,     -- 1=MF, 2=CIN, 3=Passeport, 4=Carte Séjour, 5=Autre
    ADD COLUMN IF NOT EXISTS "DateNaissance"        date      NULL,
    ADD COLUMN IF NOT EXISTS "PaysCode"             varchar(3) NOT NULL DEFAULT 'TN',
    ADD COLUMN IF NOT EXISTS "AutreIdentifiantFiscal" varchar(50) NULL;

COMMENT ON COLUMN "Contacts"."CategorieContribuable" IS 'TEJ: PM (Personne Morale) | PP (Personne Physique)';
COMMENT ON COLUMN "Contacts"."IdTaxpayerType" IS 'TEJ TypeIdentifiant: 1=MF 2=CIN 3=Passeport 4=CarteSejour 5=Autre';

-- ── 2. SupplierInvoices: TEJ operation code + rectification + RS-TVA + Tunisia-specific ──
ALTER TABLE "SupplierInvoices"
    ADD COLUMN IF NOT EXISTS "RsOperationCode"        varchar(20) NULL,   -- e.g. 'RS1_000001'
    ADD COLUMN IF NOT EXISTS "Cnpc"                   varchar(20) NULL,   -- Code Nature Prestation/Contribuable
    ADD COLUMN IF NOT EXISTS "PriseEnCharge"          boolean    NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "AnneeFacturation"       integer    NULL,
    ADD COLUMN IF NOT EXISTS "RefCertifChezDeclarant" varchar(50) NULL,
    ADD COLUMN IF NOT EXISTS "RsTvaCode"              varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS "RsTvaTaux"              decimal(5,2) NULL,
    ADD COLUMN IF NOT EXISTS "RsTvaAmount"            decimal(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "TejActe"                smallint   NOT NULL DEFAULT 0; -- 0=Ajouter 1=Modifier 2=Annuler

COMMENT ON COLUMN "SupplierInvoices"."RsOperationCode" IS 'TEJ IdTypeOperation (RS1_xxxxxx)';
COMMENT ON COLUMN "SupplierInvoices"."TejActe" IS '0=AjouterCertificats 1=ModifierCertificats 2=AnnulerCertificats';

-- ── 3. RSRecords: extend EntityType + operation + RS-TVA + rectification ──
ALTER TABLE "RSRecords"
    ADD COLUMN IF NOT EXISTS "OperationCode"         varchar(20) NULL,   -- IdTypeOperation
    ADD COLUMN IF NOT EXISTS "Cnpc"                  varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS "PriseEnCharge"         boolean    NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "AnneeFacturation"      integer    NULL,
    ADD COLUMN IF NOT EXISTS "RefCertifChezDeclarant" varchar(50) NULL,
    ADD COLUMN IF NOT EXISTS "RsTvaCode"             varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS "RsTvaTaux"             decimal(5,2) NULL,
    ADD COLUMN IF NOT EXISTS "RsTvaAmount"           decimal(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "MontantNetServi"       decimal(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "BeneficiaireCategorie" varchar(2)  NULL,    -- PM/PP
    ADD COLUMN IF NOT EXISTS "BeneficiaireIsResident" boolean    NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS "BeneficiaireIdType"    smallint    NULL,
    ADD COLUMN IF NOT EXISTS "BeneficiaireDateNaissance" date    NULL,
    ADD COLUMN IF NOT EXISTS "BeneficiairePaysCode"  varchar(3)  NOT NULL DEFAULT 'TN',
    ADD COLUMN IF NOT EXISTS "Acte"                  smallint    NOT NULL DEFAULT 0; -- 0/1/2

-- Drop and recreate the EntityType CHECK so 'supplier_invoice' is accepted alongside offer/sale.
DO $$
DECLARE c text;
BEGIN
    SELECT conname INTO c
      FROM pg_constraint
     WHERE conrelid = '"RSRecords"'::regclass
       AND contype  = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%EntityType%';
    IF c IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "RSRecords" DROP CONSTRAINT %I', c);
    END IF;
END $$;

ALTER TABLE "RSRecords"
    ADD CONSTRAINT "CK_RSRecords_EntityType"
    CHECK ("EntityType" IN ('offer','sale','supplier_invoice'));

CREATE INDEX IF NOT EXISTS "IX_RSRecords_OperationCode" ON "RSRecords" ("OperationCode");
CREATE INDEX IF NOT EXISTS "IX_RSRecords_EntityType_EntityId" ON "RSRecords" ("EntityType", "EntityId");
CREATE INDEX IF NOT EXISTS "IX_SupplierInvoices_TejSynced" ON "SupplierInvoices" ("TejSynced", "TejSyncStatus");

-- Backfill: MontantNetServi = AmountPaid - RSAmount (no RS-TVA yet on legacy rows)
UPDATE "RSRecords" SET "MontantNetServi" = "AmountPaid" - "RSAmount"
WHERE "MontantNetServi" = 0;
