/**
 * 模板数据规范化 / demo 种子数据加载
 * 真环境会换成后台 API，这里只服务本地 demo。
 */

import defaultTemplatesSeed from '@/mock/defaultTemplates.json';

export const TEMPLATES_STORAGE_KEY = 'label_templates_v3';

/** 设计器打印预览用的示例变量（非真实设备） */
export const SAMPLE_PRINT_VARIABLES = {
  asset_num: 'ZC-2026-0001',
  asset_name: '示例设备',
  specification: '规格型号',
  use_dept: '研发部',
  storage_place: 'A栋3楼',
  barcode_code: '697012345601',
  qr_code: 'https://ams.company.com/device/ZC-2026-0001',
  serial_no: 'SN20260722001'
};

export function createId(prefix = 'el') {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * 补齐元素缺失字段，避免旧数据缺 variable 导致选中崩溃
 */
export function normalizeElement(el) {
  if (!el || typeof el !== 'object') return el;
  const next = { ...el };

  if (!next.id) {
    next.id = createId('el');
  }
  if (!next.position) {
    next.position = {
      clientX: next.default?.x ?? 0,
      clientY: next.default?.y ?? 0
    };
  }
  if (!next.default) {
    next.default = {
      width: next.rect?.width ?? 100,
      height: next.rect?.height ?? 30,
      x: next.position.clientX ?? 0,
      y: next.position.clientY ?? 0
    };
  }
  if (!next.variable) {
    next.variable = { enable: false, textData: [] };
  }
  if (!next.props) {
    next.props = {};
  }
  return next;
}

export function normalizeTemplate(tpl) {
  if (!tpl || typeof tpl !== 'object') return tpl;
  const next = { ...tpl };
  if (!next.id) {
    next.id = createId('tpl');
  }
  if (!next.name) {
    next.name = '未命名模板';
  }
  if (!next.width) {
    next.width = 400;
  }
  if (!next.height) {
    next.height = 300;
  }
  next.data = Array.isArray(next.data) ? next.data.map(normalizeElement) : [];
  return next;
}

export function getDefaultTemplates() {
  return defaultTemplatesSeed.map((tpl) => normalizeTemplate(structuredClone(tpl)));
}

/**
 * 从 localStorage 读模板；没有则用 mock JSON 种子；若存在旧的 250×175 种子模板则升级到 80×60mm (400×300)
 * @param {{ persistSeed?: boolean }} options
 */
export function loadTemplatesFromStorage(options = {}) {
  const persistSeed = options.persistSeed !== false;
  const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
  const defaults = getDefaultTemplates();

  if (raw) {
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        let updated = false;
        const normalized = list.map((tpl) => {
          const norm = normalizeTemplate(tpl);
          // 自动同步/升级默认模板到 80x60mm 中医院固定资产标签
          if (norm.id === 'asset-tag-default' || norm.id === 'tpl_xqu324m9') {
            const seed = defaults[0];
            if (seed) {
              updated = true;
              return { ...structuredClone(seed), id: norm.id };
            }
          }
          return norm;
        });
        if (updated && persistSeed) {
          saveTemplatesToStorage(normalized);
        }
        return normalized;
      }
    } catch (e) {
      console.error('解析本地模板失败，回退到默认模板:', e);
    }
  }

  if (persistSeed) {
    saveTemplatesToStorage(defaults);
  }
  return defaults;
}

export function saveTemplatesToStorage(list) {
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(list));
}

/**
 * 将指定 ID 的模板设为系统首选默认模板（置顶）
 */
export function setDefaultTemplate(templateId) {
  const list = loadTemplatesFromStorage();
  const index = list.findIndex((t) => t.id === templateId);
  if (index > -1) {
    const [target] = list.splice(index, 1);
    list.unshift(target);
    saveTemplatesToStorage(list);
    return list;
  }
  return list;
}
