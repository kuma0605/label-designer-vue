/**
 * 标签打印服务
 * - 当前：browser（window.print）
 * - 预留：qz（QZ Tray 标签打印机）
 *
 * 用法：
 *   const pages = await renderLabelsToPages([{ template, variables }])
 *   await printLabels(pages) // adapter 默认 browser
 */

import { createApp, h, nextTick } from 'vue';
import DesignPreview from '@/components/LabelDesigner/core/DesignPreview.jsx';

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
 * 浏览器打印适配器
 */
async function browserPrint(pages) {
  if (!pages?.length) {
    const err = new Error('EMPTY_PAGES');
    err.code = 'EMPTY_PAGES';
    throw err;
  }

  // 不能带 noopener：否则拿不到 window 引用，无法写入内容并触发 print
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    const err = new Error('POPUP_BLOCKED');
    err.code = 'POPUP_BLOCKED';
    throw err;
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
  // 部分浏览器在 print 对话框关闭前 close 会取消打印，稍延迟关闭
  setTimeout(() => {
    try {
      printWindow.close();
    } catch {
      /* ignore */
    }
  }, 300);
}

/**
 * QZ Tray 适配器占位 — 后续接入标签打印机时实现
 */
async function qzPrint() {
  const err = new Error('QZ_NOT_READY');
  err.code = 'QZ_NOT_READY';
  throw err;
}

/**
 * 统一打印入口
 * @param {Array<{ html: string, width: number, height: number }>} pages
 * @param {{ adapter?: 'browser' | 'qz' }} options
 */
export async function printLabels(pages, options = {}) {
  const adapter = options.adapter || 'browser';
  if (adapter === 'browser') {
    return browserPrint(pages);
  }
  if (adapter === 'qz') {
    return qzPrint(pages, options);
  }
  const err = new Error(`UNKNOWN_ADAPTER:${adapter}`);
  err.code = 'UNKNOWN_ADAPTER';
  throw err;
}

/**
 * 便捷方法：渲染 + 打印
 */
export async function printLabelJobs(jobs, options = {}) {
  const pages = await renderLabelsToPages(jobs, options);
  await printLabels(pages, options);
  return pages.length;
}
