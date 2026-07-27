/**
 * 模板数据规范化 / demo 种子数据加载
 * 真环境会换成后台 API，这里只服务本地 demo。
 */

import defaultTemplatesSeed from '@/mock/defaultTemplates.json';

export const TEMPLATES_STORAGE_KEY = 'label_templates_v3';

/** 默认模板 id（历史 asset-tag-default + 当前种子 id） */
const SEED_TEMPLATE_IDS = new Set(['asset-tag-default', 'tpl_xqu324m9']);

/**
 * 种子版本：默认模板 id 在 seedVersion 落后时一次性升级为最新种子。
 * 自定义模板（非 SEED_TEMPLATE_IDS）不会被覆盖。
 */
export const SEED_VERSION = 5;

/** 设计器打印预览用的示例变量（非真实设备） */
export const SAMPLE_PRINT_VARIABLES = {
  asset_num: 'ZC-2026-0001',
  asset_name: '示例设备',
  specification: '规格型号',
  use_dept: '研发部',
  storage_place: 'A栋3楼',
  barcode_code: '697012345601',
  qr_code: 'https://www.baidu.com',
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
  return defaultTemplatesSeed.map((tpl) => {
    const next = normalizeTemplate(structuredClone(tpl));
    next.seedVersion = SEED_VERSION;
    return next;
  });
}

function isLegacyDefaultSize(tpl) {
  return Number(tpl?.width) === 250 && Number(tpl?.height) === 175;
}

function needsSeedContentReplace(tpl) {
  if (!SEED_TEMPLATE_IDS.has(tpl?.id)) return false;
  // 旧 250×175、空画布 → 升级为最新默认模版
  if (isLegacyDefaultSize(tpl)) return true;
  if (!Array.isArray(tpl.data) || tpl.data.length === 0) return true;
  const ver = Number(tpl.seedVersion);
  // 仅当明确落后于当前种子版本时覆盖；缺 seedVersion 但已有内容 → 只补版本号，不抹用户改动
  return Number.isFinite(ver) && ver < SEED_VERSION;
}

/**
 * 从 localStorage 读模板；没有则用 mock JSON 种子。
 * 仅对默认模板做「旧 250×175」内容升级；不再每次加载覆盖用户保存。
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
          if (needsSeedContentReplace(norm)) {
            const seed = defaults[0];
            if (seed) {
              updated = true;
              return { ...structuredClone(seed), id: norm.id, seedVersion: SEED_VERSION };
            }
          }
          // 给已存在的默认模板补上 seedVersion，不改动内容
          if (SEED_TEMPLATE_IDS.has(norm.id) && norm.seedVersion == null) {
            updated = true;
            return { ...norm, seedVersion: SEED_VERSION };
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
 * 用种子 JSON 覆盖指定模板（用于误清空/空 data 恢复）
 * @param {string} templateId
 * @returns {object[]|null} 更新后的列表；未找到种子时返回 null
 */
export function restoreTemplateFromSeed(templateId) {
  const defaults = getDefaultTemplates();
  const seed =
    defaults.find((t) => t.id === templateId) ||
    (SEED_TEMPLATE_IDS.has(templateId) ? defaults[0] : null);
  if (!seed) return null;

  const list = loadTemplatesFromStorage({ persistSeed: false });
  const index = list.findIndex((t) => t.id === templateId);
  const restored = {
    ...structuredClone(seed),
    id: templateId,
    seedVersion: SEED_VERSION
  };
  if (index > -1) {
    // 保留用户改过的名称
    restored.name = list[index].name || restored.name;
    list[index] = restored;
  } else {
    list.unshift(restored);
  }
  saveTemplatesToStorage(list);
  return list;
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
