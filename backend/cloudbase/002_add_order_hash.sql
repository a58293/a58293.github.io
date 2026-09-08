BEGIN;

ALTER TABLE anti_counterfeit.authenticity_codes
  ADD COLUMN IF NOT EXISTS order_hash CHAR(64);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'authenticity_codes_order_hash_format'
      AND conrelid = 'anti_counterfeit.authenticity_codes'::regclass
  ) THEN
    ALTER TABLE anti_counterfeit.authenticity_codes
      ADD CONSTRAINT authenticity_codes_order_hash_format
      CHECK (order_hash IS NULL OR order_hash ~ '^[0-9a-f]{64}$');
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_authenticity_codes_code_order
  ON anti_counterfeit.authenticity_codes(code_hash, order_hash);

COMMIT;

SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'anti_counterfeit'
  AND table_name = 'authenticity_codes'
  AND column_name = 'order_hash';
