'use strict';

const crypto = require('node:crypto');
const {
  normalizeCertificate,
  normalizeOrder,
  hmac,
  rowsToObjects,
  verificationSql,
  publicResult,
} = require('./core');

const ENV_ID = process.env.TCB_ENV || 'huiyufanwei-d1gxo7j1r82311dae';
const MAX_BODY_BYTES = 2048;
let database;

function getDatabase() {
  if (database) return database;
  const CloudBase = require('@cloudbase/manager-node');
  database = CloudBase.init({ envId: ENV_ID }).database;
  return database;
}

function allowedOrigins() {
  return new Set((process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim().replace(/\/$/, ''))
    .filter(Boolean));
}

function header(event, name) {
  const headers = event?.headers || {};
  const key = Object.keys(headers).find(candidate => candidate.toLowerCase() === name.toLowerCase());
  return key ? String(headers[key]) : '';
}

function requestOrigin(event) {
  return header(event, 'origin').replace(/\/$/, '');
}

function clientAddress(event) {
  return String(
    event?.requestContext?.identity?.sourceIp ||
    event?.requestContext?.sourceIp ||
    header(event, 'x-real-ip') ||
    header(event, 'x-forwarded-for').split(',')[0] ||
    'unknown'
  ).trim().slice(0, 128);
}

function corsHeaders(origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Vary': 'Origin',
  };
  if (origin && allowedOrigins().has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '600';
  }
  return headers;
}

function response(statusCode, payload, origin = '') {
  return { statusCode, headers: corsHeaders(origin), body: JSON.stringify(payload) };
}

function parseBody(event) {
  let body = event?.body || '';
  if (event?.isBase64Encoded && body) body = Buffer.from(body, 'base64').toString('utf8');
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  return body ? JSON.parse(body) : {};
}

async function main(event = {}) {
  const origin = requestOrigin(event);
  const method = String(event.httpMethod || 'POST').toUpperCase();
  if (origin && !allowedOrigins().has(origin)) {
    return response(403, { ok: false, result: 'forbidden', message: '请求来源未获授权。' });
  }
  if (method === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(origin), body: '' };
  if (method === 'GET') return response(200, { ok: true, service: 'verify-authenticity', status: 'ready' }, origin);
  if (method !== 'POST') return response(405, { ok: false, result: 'method_not_allowed' }, origin);

  const requestId = crypto.randomUUID();
  try {
    const pepper = process.env.VERIFICATION_HASH_PEPPER || '';
    if (pepper.length < 32) throw new Error('SERVER_NOT_CONFIGURED');
    const input = parseBody(event);
    const certificate = normalizeCertificate(input.certificate);
    const order = normalizeOrder(input.order);
    if (!/^[A-Z0-9]{12,32}$/.test(certificate) || !/^\d{10,32}$/.test(order)) {
      return response(400, {
        ok: false,
        result: 'invalid_input',
        requestId,
        message: '请输入有效的娃证编号与订单号。',
      }, origin);
    }

    const codeHash = hmac('code', certificate, pepper);
    const orderHash = hmac('order', order, pepper);
    const ipHash = hmac('ip', clientAddress(event), pepper);
    const userAgentHash = hmac('ua', header(event, 'user-agent').slice(0, 512), pepper);
    const sql = verificationSql({ codeHash, orderHash, ipHash, userAgentHash, requestId });
    const raw = await getDatabase().executePGSql({ Sql: sql, EnvId: ENV_ID });
    const result = publicResult(rowsToObjects(raw)[0], requestId);
    return response(result.statusCode, result.body, origin);
  } catch (error) {
    const statusCode = error?.message === 'BODY_TOO_LARGE'
      ? 413
      : error?.message === 'SERVER_NOT_CONFIGURED' ? 503 : 500;
    console.error('verification request failed', { requestId, name: error?.name, message: error?.message });
    return response(statusCode, {
      ok: false,
      result: statusCode === 413 ? 'invalid_input' : 'service_unavailable',
      requestId,
      message: statusCode === 413 ? '提交内容过长。' : '核验服务暂时不可用，请稍后重试。',
    }, origin);
  }
}

module.exports = { main };
