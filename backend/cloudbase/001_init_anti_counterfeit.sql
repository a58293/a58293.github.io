BEGIN;

CREATE SCHEMA IF NOT EXISTS anti_counterfeit;

CREATE TABLE IF NOT EXISTS anti_counterfeit.products (
  id BIGSERIAL PRIMARY KEY,
  product_key VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  series_name VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'archived')),
  public_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anti_counterfeit.batches (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL
    REFERENCES anti_counterfeit.products(id) ON DELETE RESTRICT,
  batch_code VARCHAR(80) NOT NULL UNIQUE,
  production_date DATE,
  quantity INTEGER CHECK (quantity IS NULL OR quantity >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anti_counterfeit.authenticity_codes (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL
    REFERENCES anti_counterfeit.batches(id) ON DELETE RESTRICT,
  serial_number VARCHAR(100) NOT NULL UNIQUE,
  code_hash CHAR(64) NOT NULL UNIQUE
    CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  order_hash CHAR(64)
    CHECK (order_hash IS NULL OR order_hash ~ '^[0-9a-f]{64}$'),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'blocked', 'void')),
  first_verified_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  verification_count INTEGER NOT NULL DEFAULT 0
    CHECK (verification_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anti_counterfeit.verification_events (
  id BIGSERIAL PRIMARY KEY,
  request_id VARCHAR(80) NOT NULL UNIQUE,
  authenticity_code_id BIGINT
    REFERENCES anti_counterfeit.authenticity_codes(id) ON DELETE SET NULL,
  submitted_hash CHAR(64) NOT NULL
    CHECK (submitted_hash ~ '^[0-9a-f]{64}$'),
  result VARCHAR(30) NOT NULL
    CHECK (result IN (
      'valid_first',
      'valid_repeat',
      'not_found',
      'blocked',
      'void',
      'rate_limited',
      'error'
    )),
  ip_hash CHAR(64)
    CHECK (ip_hash IS NULL OR ip_hash ~ '^[0-9a-f]{64}$'),
  user_agent_hash CHAR(64)
    CHECK (user_agent_hash IS NULL OR user_agent_hash ~ '^[0-9a-f]{64}$'),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_product_id
  ON anti_counterfeit.batches(product_id);

CREATE INDEX IF NOT EXISTS idx_authenticity_codes_batch_id
  ON anti_counterfeit.authenticity_codes(batch_id);

CREATE INDEX IF NOT EXISTS idx_authenticity_codes_status
  ON anti_counterfeit.authenticity_codes(status);

CREATE INDEX IF NOT EXISTS idx_authenticity_codes_code_order
  ON anti_counterfeit.authenticity_codes(code_hash, order_hash);

CREATE INDEX IF NOT EXISTS idx_verification_events_code_time
  ON anti_counterfeit.verification_events(authenticity_code_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_events_submitted_time
  ON anti_counterfeit.verification_events(submitted_hash, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_events_ip_time
  ON anti_counterfeit.verification_events(ip_hash, occurred_at DESC);

INSERT INTO anti_counterfeit.products (
  product_key,
  name,
  series_name,
  public_details
)
VALUES (
  'flower-gods-jingxin',
  '镜昕',
  '花神卷',
  '{"size":"70 3分","material":"环保三抗树脂","skinTones":["Mia白","Mia粉","普肌"],"productionCycle":"约90个工作日"}'::jsonb
)
ON CONFLICT (product_key) DO UPDATE SET
  name = EXCLUDED.name,
  series_name = EXCLUDED.series_name,
  public_details = EXCLUDED.public_details,
  updated_at = NOW();

INSERT INTO anti_counterfeit.batches (product_id, batch_code, notes)
SELECT id, 'JX-001', '镜昕首批；正式生产前补充数量与生产日期。'
FROM anti_counterfeit.products
WHERE product_key = 'flower-gods-jingxin'
ON CONFLICT (batch_code) DO NOTHING;

COMMIT;

SELECT
  p.product_key,
  p.name,
  b.batch_code,
  b.created_at
FROM anti_counterfeit.products AS p
JOIN anti_counterfeit.batches AS b ON b.product_id = p.id
WHERE p.product_key = 'flower-gods-jingxin';
