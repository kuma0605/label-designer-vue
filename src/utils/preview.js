import barcode from 'jsbarcode';
import QrCode from 'qrcode';

/**
 * 替换文本中的 ${key} 占位符为真实数据
 * @param {string} text - 含占位符的文本
 * @param {object} variables - { key: value } 真实数据
 * @returns {string} 替换后的文本
 */
export function replaceVars(text, variables) {
  if (!text) return '';
  if (!variables) return text;
  return String(text).replace(/\${(.+?)}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
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
