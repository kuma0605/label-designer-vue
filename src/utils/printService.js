/**
 * 标签打印服务
 * - browser：window.print（HTML）
 * - qz：html2canvas → PNG base64 → QZ Tray pixel/image
 *
 * 用法：
 *   await printLabelJobs(jobs, { adapter: 'browser' })
 *   await printLabelJobs(jobs, { adapter: 'qz', printer: '打印机名' })
 */

import { createApp, h, nextTick } from 'vue';
import html2canvas from 'html2canvas';
import DesignPreview from '@/components/LabelDesigner/core/DesignPreview.jsx';
import { connectQz, getDefaultPrinter, qz } from '@/utils/qzClient.js';

/** 画布约定：1mm = 5px */
export const PX_PER_MM = 5;

const PRINT_CSS = `
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-page {
    page-break-after: always;
    break-after: page;
    overflow: hidden;
    position: relative;
    background: #fff;
  }
  .print-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .template-wrap { position: relative; overflow: hidden; background: #fff; }
  .component { position: absolute; box-sizing: border-box; }
  .barcode-wrap {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  .barcode { max-width: 100%; }
  .barcode-text { font-size: 12px; font-weight: normal; text-align: center; margin: 2px 0 0 0; }
  .qr-code-wrap {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .qr-code { max-width: 100%; max-height: 100%; }
  .x-line-wrap, .y-line-wrap, .rectangle-wrap { box-sizing: border-box; }
  .table-wrap { width: 100%; border-collapse: collapse; }
  .table-wrap th, .table-wrap td { border: 1px solid #000; padding: 5px; text-align: left; }
  @media print {
    @page { margin: 0; }
    body { margin: 0; }
  }
`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function makeError(code, message, cause) {
  const err = new Error(message || code);
  err.code = code;
  if (cause) err.cause = cause;
  return err;
}

/**
 * 离屏挂载 DesignPreview，等条码/二维码生成后取出 HTML
 * @param {Array<{ template: object, variables?: object }>} jobs
 * @param {{ settleMs?: number }} options
 * @returns {Promise<Array<{ html: string, width: number, height: number }>>}
 */
export async function renderLabelsToPages(jobs, options = {}) {
  const settleMs = options.settleMs ?? 450;
  const host = document.createElement('div');
  host.setAttribute('data-print-render-host', '1');
  host.style.cssText =
    'position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;';
  document.body.appendChild(host);

  const pages = [];
  try {
    for (const job of jobs) {
      const template = job.template;
      if (!template) continue;

      const mountEl = document.createElement('div');
      host.appendChild(mountEl);

      const app = createApp({
        render: () =>
          h(DesignPreview, {
            template,
            variables: job.variables || {}
          })
      });
      app.mount(mountEl);
      await nextTick();
      await sleep(settleMs);

      const wrap = mountEl.querySelector('.template-wrap');
      pages.push({
        html: wrap ? wrap.outerHTML : mountEl.innerHTML,
        width: template.width || 250,
        height: template.height || 175
      });

      app.unmount();
      mountEl.remove();
    }
  } finally {
    host.remove();
  }
  return pages;
}

function buildPrintDocument(pages) {
  const body = pages
    .map(
      (page) =>
        `<div class="print-page" style="width:${page.width}px;height:${page.height}px;">${page.html}</div>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>打印标签</title>
  <style>${PRINT_CSS}</style>
</head>
<body>${body}</body>
</html>`;
}

/**
 * 将标签页转成 PNG base64（不含 data URL 前缀），供 QZ 使用
 * @param {Array<{ html: string, width: number, height: number }>} pages
 * @returns {Promise<Array<{ base64: string, width: number, height: number, widthMm: number, heightMm: number }>>}
 */
export async function pagesToPngBase64(pages) {
  const host = document.createElement('div');
  host.setAttribute('data-qz-raster-host', '1');
  host.style.cssText =
    'position:fixed;left:-99999px;top:0;background:#fff;pointer-events:none;';
  document.body.appendChild(host);

  const results = [];
  try {
    for (const page of pages) {
      const wrap = document.createElement('div');
      wrap.style.cssText = `width:${page.width}px;height:${page.height}px;background:#fff;overflow:hidden;position:relative;`;
      wrap.innerHTML = `<style>${PRINT_CSS}</style>${page.html}`;
      host.appendChild(wrap);

      await sleep(50);
      const canvas = await html2canvas(wrap, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        width: page.width,
        height: page.height,
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      results.push({
        base64,
        width: page.width,
        height: page.height,
        widthMm: page.width / PX_PER_MM,
        heightMm: page.height / PX_PER_MM
      });
      wrap.remove();
    }
  } finally {
    host.remove();
  }
  return results;
}

/**
 * 浏览器打印适配器
 */
async function browserPrint(pages) {
  if (!pages?.length) {
    throw makeError('EMPTY_PAGES', '没有可打印的标签');
  }

  // 不能带 noopener：否则拿不到 window 引用，无法写入内容并触发 print
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    throw makeError('POPUP_BLOCKED', '打印窗口被浏览器拦截');
  }
  try {
    printWindow.opener = null;
  } catch {
    /* ignore */
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintDocument(pages));
  printWindow.document.close();

  await new Promise((resolve) => {
    const done = () => resolve();
    if (printWindow.document.readyState === 'complete') {
      setTimeout(done, 100);
    } else {
      printWindow.onload = () => setTimeout(done, 100);
    }
  });

  printWindow.focus();
  printWindow.print();
  setTimeout(() => {
    try {
      printWindow.close();
    } catch {
      /* ignore */
    }
  }, 300);
}

/**
 * QZ Tray 适配器：PNG pixel 打印
 * @param {Array<{ html: string, width: number, height: number }>} pages
 * @param {{ printer?: string }} options
 */
async function qzPrint(pages, options = {}) {
  if (!pages?.length) {
    throw makeError('EMPTY_PAGES', '没有可打印的标签');
  }

  await connectQz();

  let printerName = options.printer;
  if (!printerName) {
    printerName = await getDefaultPrinter();
  }
  if (!printerName) {
    throw makeError('QZ_NO_PRINTER', '未找到可用打印机，请先选择打印机');
  }

  const images = await pagesToPngBase64(pages);

  // 逐张打印，保证每张使用对应标签尺寸
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const config = qz.configs.create(printerName, {
      units: 'mm',
      size: { width: img.widthMm, height: img.heightMm },
      margins: 0,
      colorType: 'grayscale',
      interpolation: 'nearest-neighbor',
      scaleContent: false,
      jobName: `标签-${i + 1}/${images.length}`
    });

    const data = [
      {
        type: 'pixel',
        format: 'image',
        flavor: 'base64',
        data: img.base64
      }
    ];

    try {
      await qz.print(config, data);
    } catch (e) {
      throw makeError(
        'QZ_PRINT_FAILED',
        `第 ${i + 1} 张标签发送失败：${e?.message || e}`,
        e
      );
    }
  }
}

/**
 * 统一打印入口
 * @param {Array<{ html: string, width: number, height: number }>} pages
 * @param {{ adapter?: 'browser' | 'qz', printer?: string }} options
 */
export async function printLabels(pages, options = {}) {
  const adapter = options.adapter || 'browser';
  if (adapter === 'browser') {
    return browserPrint(pages);
  }
  if (adapter === 'qz') {
    return qzPrint(pages, options);
  }
  throw makeError('UNKNOWN_ADAPTER', `未知打印适配器: ${adapter}`);
}

/**
 * 便捷方法：渲染 + 打印
 */
export async function printLabelJobs(jobs, options = {}) {
  const pages = await renderLabelsToPages(jobs, options);
  await printLabels(pages, options);
  return pages.length;
}
