/**
 * QZ Tray 客户端封装
 * 文档: https://qz.io/docs/getting-started
 *
 * 本阶段可不签名（每次弹授权框）。若放置证书到 /certs/digital-certificate.txt
 * 并配置签名接口，即可升级为静默打印。
 */

import qz from 'qz-tray';

const DEFAULT_CONNECT_OPTS = { retries: 5, delay: 1 };
const CERT_URL = '/certs/digital-certificate.txt';

/** @type {boolean} */
let securityConfigured = false;

/**
 * 可选签名接口，例如 '/api/qz/sign?request='
 * 未配置时仅加载证书（若有），打印仍可能弹授权框
 */
let signatureEndpoint = '';

export function setQzSignatureEndpoint(url) {
  signatureEndpoint = url || '';
  securityConfigured = false;
}

export function isQzConnected() {
  try {
    return !!qz.websocket.isActive();
  } catch {
    return false;
  }
}

/**
 * 若存在 public/certs/digital-certificate.txt 则挂上证书钩子；
 * 若配置了 signatureEndpoint 则挂签名钩子。
 */
export async function setupQzSecurity() {
  if (securityConfigured) return;

  let hasCert = false;
  try {
    const res = await fetch(CERT_URL, {
      cache: 'no-store',
      headers: { 'Content-Type': 'text/plain' }
    });
    if (res.ok) {
      const text = await res.text();
      // 占位 README 不是证书
      if (text && text.includes('BEGIN CERTIFICATE')) {
        hasCert = true;
        qz.security.setCertificatePromise((resolve, reject) => {
          fetch(CERT_URL, {
            cache: 'no-store',
            headers: { 'Content-Type': 'text/plain' }
          }).then((data) => (data.ok ? resolve(data.text()) : reject(data.text())));
        });
      }
    }
  } catch {
    /* 无证书文件时跳过，走未签名授权弹窗 */
  }

  if (signatureEndpoint) {
    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise((toSign) => {
      return (resolve, reject) => {
        const url = signatureEndpoint.includes('=')
          ? `${signatureEndpoint}${encodeURIComponent(toSign)}`
          : `${signatureEndpoint}${signatureEndpoint.includes('?') ? '&' : '?'}request=${encodeURIComponent(toSign)}`;
        fetch(url, {
          cache: 'no-store',
          headers: { 'Content-Type': 'text/plain' }
        }).then((data) => (data.ok ? resolve(data.text()) : reject(data.text())));
      };
    });
  }

  securityConfigured = true;
  return { hasCert, hasSignature: !!signatureEndpoint };
}

function makeQzError(code, message, cause) {
  const err = new Error(message || code);
  err.code = code;
  if (cause) err.cause = cause;
  return err;
}

/**
 * 连接本地 QZ Tray（已连接则复用）
 */
export async function connectQz(options = {}) {
  await setupQzSecurity();

  if (isQzConnected()) {
    return true;
  }

  try {
    await qz.websocket.connect({ ...DEFAULT_CONNECT_OPTS, ...options });
    return true;
  } catch (e) {
    const msg = String(e?.message || e || '');
    if (/refus|closed|Unable to establish|failed to connect|ECONNREFUSED/i.test(msg)) {
      throw makeQzError(
        'QZ_NOT_RUNNING',
        '无法连接 QZ Tray，请确认已安装并启动 QZ Tray',
        e
      );
    }
    throw makeQzError('QZ_CONNECT_FAILED', msg || 'QZ Tray 连接失败', e);
  }
}

export async function disconnectQz() {
  if (!isQzConnected()) return;
  try {
    await qz.websocket.disconnect();
  } catch {
    /* ignore */
  }
}

/**
 * 列出本机打印机名称
 * @returns {Promise<string[]>}
 */
export async function listPrinters() {
  await connectQz();
  const found = await qz.printers.find();
  if (Array.isArray(found)) return found;
  if (typeof found === 'string' && found) return [found];
  return [];
}

/**
 * 获取默认打印机名称（若 API 可用）
 */
export async function getDefaultPrinter() {
  await connectQz();
  try {
    if (typeof qz.printers.getDefault === 'function') {
      const name = await qz.printers.getDefault();
      if (name) return name;
    }
  } catch {
    /* fall through */
  }
  const list = await listPrinters();
  return list[0] || '';
}

export { qz };
