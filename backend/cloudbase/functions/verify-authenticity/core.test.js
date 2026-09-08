'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeCertificate,
  normalizeOrder,
  hmac,
  rowsToObjects,
  verificationSql,
  publicResult,
} = require('./core');

test('normalizes printed certificate and order values', () => {
  assert.equal(normalizeCertificate(' la-jx 01-ab23-cd45 '), 'LAJX01AB23CD45');
  assert.equal(normalizeOrder(' 1234-5678 9012 '), '123456789012');
});

test('uses separate HMAC namespaces', () => {
  const pepper = 'a-secure-test-pepper-that-is-long-enough';
  assert.match(hmac('code', 'ABC123', pepper), /^[0-9a-f]{64}$/);
  assert.notEqual(hmac('code', 'ABC123', pepper), hmac('order', 'ABC123', pepper));
});

test('maps CloudBase PostgreSQL rows to objects', () => {
  assert.deepEqual(rowsToObjects({
    Columns: ['result', 'verification_count'],
    Rows: ['["valid_first","1"]'],
  }), [{ result: 'valid_first', verification_count: '1' }]);
});

test('SQL contains only hashed identifiers and atomic logging', () => {
  const values = {
    codeHash: 'a'.repeat(64),
    orderHash: 'b'.repeat(64),
    ipHash: 'c'.repeat(64),
    userAgentHash: 'd'.repeat(64),
    requestId: '2a344bb2-d825-4c96-8d0d-1f812671bcde',
  };
  const sql = verificationSql(values);
  assert.match(sql, /FOR UPDATE OF ac/);
  assert.match(sql, /INSERT INTO anti_counterfeit\.verification_events/);
  assert.match(sql, new RegExp(values.codeHash));
  assert.match(sql, new RegExp(values.orderHash));
});

test('returns first and repeat verification states', () => {
  const first = publicResult({
    result: 'valid_first', product_name: '镜昕', series_name: '花神卷',
    batch_code: 'JX-001', serial_number: 'JX-001-0001', verification_count: '1',
    first_verified_at: '2026-09-07T00:00:00Z', last_verified_at: '2026-09-07T00:00:00Z',
    public_details: '{"material":"环保三抗树脂"}',
  }, 'request-1');
  assert.equal(first.body.ok, true);
  assert.equal(first.body.result, 'valid_first');
  assert.equal(first.body.product.name, '镜昕');
  assert.equal(first.body.verification.count, 1);

  const repeat = publicResult({ ...first.body, result: 'valid_repeat', verification_count: '2' }, 'request-2');
  assert.equal(repeat.body.result, 'valid_repeat');
  assert.equal(repeat.body.verification.count, 2);
});

test('does not reveal product data for unknown codes', () => {
  const result = publicResult({ result: 'not_found' }, 'request-3');
  assert.equal(result.body.ok, false);
  assert.equal('product' in result.body, false);
});
