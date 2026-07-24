/**
 * QZ Tray 客户端封装
 * 文档: https://qz.io/docs/getting-started
 *
 * 静默打印：将 digital-certificate.txt + private-key.pem 放到 public/certs/
 * 即可在前端签名（Demo / 内网可用）。也可改用 setQzSignatureEndpoint 走后端签名。
 */

import qz from 'qz-tray';
import { KEYUTIL, KJUR, hextob64 } from 'jsrsasign';

const DEFAULT_CONNECT_OPTS = { retries: 5, delay: 1 };
const CERT_URL = '/certs/digital-certificate.txt';
const PRIVATE_KEY_URL = '/certs/private-key.pem';

/** @type {boolean} */
let securityConfigured = false;

/**
 * 可选签名接口，例如 '/api/qz/sign?request='
 * 配置后优先走后端；未配置则尝试前端 private-key.pem
 */
let signatureEndpoint = '';

/** @type {string} */
let cachedPrivateKey = '';

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

function looksLikePem(text, marker) {
  return !!(text && text.includes(marker));
}

async function fetchText(url) {
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Content-Type': 'text/plain' }
  });
  if (!res.ok) return '';
  return res.text();
}

function signWithPrivateKey(toSign, privateKeyPem) {
  const pk = KEYUTIL.getKey(privateKeyPem);
  const sig = new KJUR.crypto.Signature({ alg: 'SHA512withRSA' });
  sig.init(pk);
  sig.updateString(toSign);
  return hextob64(sig.sign());
}

/**
 * 若存在 public/certs/digital-certificate.txt 则挂上证书钩子；
 * 签名优先级：signatureEndpoint > private-key.pem 前端签名。
 */
export async function setupQzSecurity() {
  if (securityConfigured) return;

  let hasCert = false;
  let hasPrivateKey = false;

  try {
    const certText = await fetchText(CERT_URL);
    if (looksLikePem(certText, 'BEGIN CERTIFICATE')) {
      hasCert = true;
      qz.security.setCertificatePromise((resolve, reject) => {
        fetchText(CERT_URL).then((text) => {
          if (looksLikePem(text, 'BEGIN CERTIFICATE')) resolve(text);
          else reject(new Error('Invalid QZ certificate'));
        }, reject);
      });
    }
  } catch {
    /* 无证书文件时跳过，走未签名授权弹窗 */
  }

  if (!signatureEndpoint) {
    try {
      const keyText = await fetchText(PRIVATE_KEY_URL);
      if (looksLikePem(keyText, 'BEGIN') && /PRIVATE KEY/.test(keyText)) {
        cachedPrivateKey = keyText;
        hasPrivateKey = true;
      }
    } catch {
      /* 无私钥时跳过 */
    }
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
  } else if (hasPrivateKey) {
    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise((toSign) => {
      return (resolve, reject) => {
        try {
          resolve(signWithPrivateKey(toSign, cachedPrivateKey));
        } catch (err) {
          reject(err);
        }
      };
    });
  }

  securityConfigured = true;
  return {
    hasCert,
    hasSignature: !!(signatureEndpoint || hasPrivateKey),
    signatureMode: signatureEndpoint ? 'endpoint' : hasPrivateKey ? 'client' : 'none'
  };
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
