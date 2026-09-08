'use strict';

const crypto = require('node:crypto');

const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_ATTEMPTS = 30;

function normalizeCertificate(value) {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().toUpperCase().replace(/[\s-]+/g, '')
    : '';
}

function normalizeOrder(value) {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().replace(/[\s-]+/g, '')
    : '';
}

function hmac(namespace, value, pepper) {
  return crypto.createHmac('sha256', pepper).update(`${namespace}:${value}`, 'utf8').digest('hex');
}

function rowsToObjects(raw) {
  const result = raw?.Response || raw || {};
  const columns = result.Columns || [];
  const rows = result.Rows || [];
  return rows.map(row => {
    const values = typeof row === 'string' ? JSON.parse(row) : row;
    return Object.fromEntries(columns.map((column, index) => [column, values[index]]));
  });
}

function verificationSql({ codeHash, orderHash, ipHash, userAgentHash, requestId }) {
  return `
WITH recent AS (
  SELECT COUNT(*)::integer AS attempts
  FROM anti_counterfeit.verification_events
  WHERE ip_hash = '${ipHash}'
    AND occurred_at >= NOW() - INTERVAL '${RATE_LIMIT_WINDOW_MINUTES} minutes'
),
matched AS (
  SELECT
    ac.id,
    ac.serial_number,
    ac.status,
    b.batch_code,
    p.name AS product_name,
    p.series_name,
    p.public_details
  FROM anti_counterfeit.authenticity_codes AS ac
  JOIN anti_counterfeit.batches AS b ON b.id = ac.batch_id
  JOIN anti_counterfeit.products AS p ON p.id = b.product_id
  CROSS JOIN recent
  WHERE ac.code_hash = '${codeHash}'
    AND ac.order_hash = '${orderHash}'
    AND recent.attempts < ${RATE_LIMIT_ATTEMPTS}
  FOR UPDATE OF ac
),
updated AS (
  UPDATE anti_counterfeit.authenticity_codes AS ac
  SET
    verification_count = ac.verification_count + 1,
    first_verified_at = CASE
      WHEN ac.status = 'active' THEN COALESCE(ac.first_verified_at, NOW())
      ELSE ac.first_verified_at
    END,
    last_verified_at = NOW()
  FROM matched
  WHERE ac.id = matched.id
  RETURNING
    ac.id,
    ac.serial_number,
    ac.status,
    ac.verification_count,
    ac.first_verified_at,
    ac.last_verified_at
),
decision AS (
  SELECT
    CASE
      WHEN recent.attempts >= ${RATE_LIMIT_ATTEMPTS} THEN 'rate_limited'
      WHEN updated.id IS NULL THEN 'not_found'
      WHEN updated.status = 'blocked' THEN 'blocked'
      WHEN updated.status = 'void' THEN 'void'
      WHEN updated.verification_count = 1 THEN 'valid_first'
      ELSE 'valid_repeat'
    END AS result,
    updated.id AS authenticity_code_id,
    updated.serial_number,
    updated.verification_count,
    updated.first_verified_at,
    updated.last_verified_at,
    matched.batch_code,
    matched.product_name,
    matched.series_name,
    matched.public_details
  FROM recent
  LEFT JOIN updated ON TRUE
  LEFT JOIN matched ON matched.id = updated.id
),
logged AS (
  INSERT INTO anti_counterfeit.verification_events (
    request_id,
    authenticity_code_id,
    submitted_hash,
    result,
    ip_hash,
    user_agent_hash
  )
  SELECT
    '${requestId}',
    authenticity_code_id,
    '${codeHash}',
    result,
    '${ipHash}',
    '${userAgentHash}'
  FROM decision
  RETURNING id
)
SELECT
  decision.result,
  decision.serial_number,
  decision.verification_count,
  decision.first_verified_at,
  decision.last_verified_at,
  decision.batch_code,
  decision.product_name,
  decision.series_name,
  decision.public_details
FROM decision
CROSS JOIN logged;
`;
}

function publicResult(row, requestId) {
  const result = row?.result || 'error';
  if (result === 'rate_limited') {
    return { statusCode: 429, body: { ok: false, result, requestId, message: '查询过于频繁，请稍后再试。' } };
  }
  if (result === 'not_found') {
    return { statusCode: 200, body: { ok: false, result, requestId, message: '未找到匹配记录，请核对编号与订单号。' } };
  }
  if (result === 'blocked' || result === 'void') {
    return { statusCode: 200, body: { ok: false, result, requestId, message: '该凭证当前无法通过核验，请联系绘屿造物客服。' } };
  }

  let publicDetails = row?.public_details || {};
  if (typeof publicDetails === 'string') {
    try { publicDetails = JSON.parse(publicDetails); } catch { publicDetails = {}; }
  }
  return {
    statusCode: 200,
    body: {
      ok: true,
      result,
      requestId,
      product: {
        name: row.product_name,
        seriesName: row.series_name,
        batchCode: row.batch_code,
        serialNumber: row.serial_number,
        publicDetails,
      },
      verification: {
        count: Number(row.verification_count || 0),
        firstVerifiedAt: row.first_verified_at,
        lastVerifiedAt: row.last_verified_at,
      },
      message: result === 'valid_first'
        ? '首次核验通过。'
        : '凭证有效，但此前已被查询，请核对首次核验时间。',
    },
  };
}

module.exports = {
  RATE_LIMIT_ATTEMPTS,
  normalizeCertificate,
  normalizeOrder,
  hmac,
  rowsToObjects,
  verificationSql,
  publicResult,
};
