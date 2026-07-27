import barcode from 'jsbarcode';
import QrCode from 'qrcode';

/**
 * 将 variables 规范为 { key: value } 映射
 * 兼容设备对象，以及 [{ key, value/label }] 数组
 */
export function toVariablesMap(variables) {
  if (!variables) return {};
  if (Array.isArray(variables)) {
    const map = {};
    variables.forEach((item) => {
      if (!item || item.key == null || item.key === '') return;
      if (item.value !== undefined && item.value !== null) {
        map[item.key] = item.value;
      } else if (item.label !== undefined) {
        map[item.key] = item.label;
      }
    });
    return map;
  }
  return variables;
}

/**
 * 替换文本中的 ${key} 占位符为真实数据
 * @param {string} text - 含占位符的文本
 * @param {object|array} variables - { key: value } 或字段数组
 * @returns {string} 替换后的文本
 */
export function replaceVars(text, variables) {
  if (text == null || text === '') return '';
  const map = toVariablesMap(variables);
  if (!map || !Object.keys(map).length) return String(text);

  // 兼容全角 ＄｛｝ 与 key 两侧空格
  const normalized = String(text)
    .replace(/\uFF04/g, '$') // ＄
    .replace(/\uFF5B/g, '{') // ｛
    .replace(/\uFF5D/g, '}'); // ｝

  return normalized.replace(/\$\{\s*([^}]+?)\s*\}/g, (match, key) => {
    const k = String(key).trim();
    if (!k) return match;
    return map[k] !== undefined && map[k] !== null ? String(map[k]) : match;
  });
}

/**
 * 生成条形码的 dataURL
 * @param {string} data - 条码数据（已替换后的真实值）
 * @param {object} options - { format, lineWidth, bodyHeight }
 * @returns {Promise<string>} dataURL
 */
export function generateBarcodeDataUrl(data, options = {}) {
  return new Promise((resolve, reject) => {
    if (!data) {
      resolve('');
      return;
    }
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      barcode(svg, data, {
        format: options.format || 'CODE128',
        width: options.lineWidth || 2,
        height: options.bodyHeight || 40,
        displayValue: false,
        xmlDocument: document
      });
      const svgString = new XMLSerializer().serializeToString(svg);
      const base64 = btoa(unescape(encodeURIComponent(svgString)));
      resolve('data:image/svg+xml;base64,' + base64);
    } catch (e) {
      console.error('Barcode generation error:', e);
      reject(e);
    }
  });
}

/**
 * 生成二维码的 dataURL
 * @param {string} data - 二维码数据（已替换后的真实值）
 * @param {object} options - { errorCorrectionLevel, margin, scale }
 * @returns {Promise<string>} dataURL
 */
export function generateQrcodeDataUrl(data, options = {}) {
  return new Promise((resolve, reject) => {
    if (!data) {
      resolve('');
      return;
    }
    const config = {
      errorCorrectionLevel: options.errorCorrectionLevel || 'H',
      margin: options.margin || 4,
      scale: options.scale || 4,
      type: 'image/jpeg',
      color: {}
    };
    QrCode.toDataURL(data, config, (err, res) => {
      if (err) {
        console.error('QR Code generation error:', err);
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
