-- One sale per converted offer.
--
-- sales.offer_id previously carried only a non-unique index (idx_sales_offer_id),
-- so a double-click or client retry on POST /api/sales/from-offer/{id} could insert
-- two sales for the same offer. SaleService.CreateSaleFromOfferAsync now checks for
-- an existing sale and re-checks inside a serializable transaction; this index is the
-- final backstop against a race that slips past both.
--
-- Partial index: offer_id is nullable (sales created directly, not from an offer) and
-- NULLs must stay non-unique. Empty strings are excluded for the same reason.
--
-- Safe to re-run. If duplicates already exist the index is skipped with a NOTICE
-- rather than failing the migration — merge the duplicate sales, then re-run.

DO $$
DECLARE dup_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
        SELECT COUNT(*) INTO dup_count FROM (
            SELECT offer_id FROM sales
            WHERE offer_id IS NOT NULL AND offer_id <> ''
            GROUP BY offer_id HAVING COUNT(*) > 1
        ) d;

        IF dup_count > 0 THEN
            RAISE NOTICE 'Skipping unique index on sales(offer_id): % offer(s) already have duplicate sales.', dup_count;
            RAISE NOTICE 'Inspect with: SELECT offer_id, array_agg(id) FROM sales WHERE offer_id IS NOT NULL GROUP BY offer_id HAVING COUNT(*) > 1;';
        ELSE
            CREATE UNIQUE INDEX IF NOT EXISTS ux_sales_offer_id
                ON sales(offer_id)
                WHERE offer_id IS NOT NULL AND offer_id <> '';
            RAISE NOTICE 'Created unique index ux_sales_offer_id.';
        END IF;
    END IF;
END $$;
