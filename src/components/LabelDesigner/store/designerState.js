import { reactive, nextTick } from 'vue';
import _ from 'lodash';
import { getStringVars } from '@/utils/index.js';
import { normalizeElement } from '@/utils/templateStore.js';

// 带前缀，避免 ID 以数字开头导致 CSS 选择器异常
export const generateId = () => {
  return `el_${Math.random().toString(36).substring(2, 10)}`;
};

export const state = reactive({
  activeComponent: null,
  selected: {
    instance: [],
    ids: []
  },
  line: {
    top: '',
    left: ''
  },
  page: {
    width: 400,
    height: 300
  },
  board: {
    x: '',
    y: '',
    minTop: '',
    maxTop: '',
    minLeft: '',
    maxLeft: ''
  },
  storeLoading: false,
  valve: 0,
  storeList: [],
  componentMap: {
    table: {
      name: 'table',
      type: 'TableUi',
      classify: 'TableMenu',
      title: '列表',
      updateId: '',
      instance: false,
      tag: 'div',
      position: { clientX: '', clientY: '' },
      default: { width: '', height: '', x: '', y: '' },
      variable: { enable: false, textData: [] },
      props: {
        borderStyle: 'solid',
        columnWidths: [33.33, 33.33, 33.34],
        tableData: [
          { '生产日期': '2022-12-1', '产地': '湖北-武汉', '成分': '金子，钻石，翡翠' },
          { '生产日期': '2022-12-2', '产地': '湖北-武汉', '成分': '金子，钻石，翡翠' }
        ]
      }
    },
    barcode: {
      name: 'barCode',
      type: 'BarcodeUi',
      classify: 'BarcodeMenu',
      instance: false,
      title: '条形码',
      tag: 'img',
      updateId: '',
      position: { clientX: '', clientY: '' },
      default: { width: '', height: '', x: '', y: '' },
      variable: { enable: false, textData: [] },
      props: {
        format: 'CODE128',
        lineWidth: 2,
        bodyHeight: 40,
        fontSize: 14,
        displayValue: '1',
        data: '${barcode_code}'
      }
    },
    xLine: {
      name: 'xLine',
      type: 'XLineUi',
      classify: 'LineMenu',
      instance: false,
      title: '横线',
      tag: 'div',
      updateId: '',
      position: { clientX: '', clientY: '' },
      default: { width: 80, height: 1, x: '', y: '' },
      props: { width: 80, height: 1, lineType: 'solid' }
    },
    yLine: {
      name: 'yLine',
      type: 'YLineUi',
      classify: 'LineMenu',
      title: '竖线',
      tag: 'div',
      instance: false,
      updateId: '',
      position: { clientX: '', clientY: '' },
      default: { width: '', height: 60, x: '', y: '' },
      props: { height: 60, width: 1, lineType: 'solid' }
    },
    rectangle: {
      name: 'rectangle',
      type: 'RectangleUi',
      classify: 'RectangleMenu',
      title: '矩形',
      tag: 'div',
      instance: false,
      updateId: '',
      position: { clientX: '', clientY: '' },
      default: { width: 80, height: 60, x: '', y: '' },
      props: { borderWidth: 1, lineType: 'solid' }
    },
    qrCode: {
      name: 'qrCode',
      type: 'QrCodeUi',
      classify: 'QrCodeMenu',
      title: '二维码',
      tag: 'img',
      instance: false,
      updateId: '',
      position: { clientX: '', clientY: '' },
      variable: { enable: false, textData: [] },
      default: { width: '', height: '', x: '', y: '' },
      props: {
        data: '${qr_code}',
        options: { margin: 4, width: '', scale: 4, errorCorrectionLevel: 'H' }
      }
    },
    customText: {
      name: 'customText',
      type: 'TextUi',
      classify: 'TextMenu',
      title: '自定义文本',
      instance: false,
      tag: 'span',
      updateId: '',
      position: { clientX: '', clientY: '' },
      variable: { enable: false, textData: [] },
      default: { width: '', height: '', x: '', y: '' },
      props: {
        text: '自定义文本',
        align: 'left',
        fontFamily: '',
        fontSize: '14px',
        lineHeight: '1.5',
        isBold: false,
        hasBorder: false
      }
    }
  }
});

// Actions
export const actions = {
  setComponentVariable() {
    const active = state.storeList.find((item) => item.id === state.activeComponent?.id);
    if (active) {
      const value = getStringVars(active.props?.text || active.props?.data || '');
      if (!active.variable) {
        active.variable = { enable: false, textData: [] };
      }
      const enable = value.some((item) => item.key);
      // 派生字段无变化时不写回，避免误触发脏检查
      if (
        active.variable.enable === enable &&
        JSON.stringify(active.variable.textData) === JSON.stringify(value)
      ) {
        return;
      }
      active.variable.textData = value;
      active.variable.enable = enable;
    }
  },

  updateValve(payload) {
    if (typeof payload !== 'undefined') {
      state.valve = payload;
    } else if (state.valve < 10) {
      state.valve = state.valve + 1;
    }
  },

  setPageSize(width, height) {
    state.page.width = width;
    state.page.height = height;
  },

  setLine(payload = { left: 0, top: 0 }) {
    state.line.top = payload.top;
    state.line.left = payload.left;
  },

  updateStoreList(template) {
    state.storeLoading = true;
    state.storeList = (template || []).map((item) => normalizeElement(_.cloneDeep(item)));
    setTimeout(() => {
      state.storeLoading = false;
    }, 300);
  },

  removeActiveComponent() {
    const id = state.activeComponent?.id;
    if (id) {
      _.remove(state.storeList, (item) => item.id === id);
      state.activeComponent = null;
    } else {
      state.selected.instance.forEach((item) => {
        _.remove(state.storeList, (c) => c.id === item.id);
      });
      this.clearSelection();
    }
  },

  addComponent(componentId, data = {}) {
    const id = generateId();
    const entity = state.componentMap[componentId];
    if (!entity) {
      throw new Error(`${componentId} 未找到该组件`);
    }
    const component = _.cloneDeep(entity);
    component.id = id;
    
    if (data.position) {
      component.position = data.position;
    }
    if (data.text) {
      component.props.text = data.text;
    }
    
    state.storeList.push(component);
    this.setActive(id);
  },

  setLayoutData(payload) {
    const { minTop, maxTop, minLeft, maxLeft } = payload;
    state.board.maxLeft = maxLeft;
    state.board.maxTop = maxTop;
    state.board.minLeft = minLeft;
    state.board.minTop = minTop;
  },

  setActive(id) {
    state.activeComponent = state.storeList.find((item) => item.id === id) || null;
  },

  batchSelection(payload) {
    state.selected = payload.reduce((total, current) => {
      total.ids.push(current.id);
      total.instance.push(current);
      return total;
    }, { instance: [], ids: [] });
  },

  clearSelection() {
    state.selected.ids = [];
    state.selected.instance = [];
  },

  clearStoreList() {
    state.storeList = [];
    state.activeComponent = null;
    this.clearSelection();
  },

  updateComponent(id, update) {
    const current = state.storeList.find((item) => item.id === id);
    if (current) {
      current.updateId = new Date().getTime().toString();
      Object.assign(current, update);
    }
  },

  addTableRow() {
    const active = state.storeList.find((item) => item.id === state.activeComponent?.id);
    if (active && active.props.tableData.length) {
      const item = active.props.tableData[0];
      const row = {};
      for (const key in item) {
        row[key] = '';
      }
      active.props.tableData.push(row);
    }
  },

  removeTableRow(removeIndex) {
    const active = state.storeList.find((item) => item.id === state.activeComponent?.id);
    if (active) {
      active.props.tableData.splice(removeIndex, 1);
    }
  },

  ensureTableColumnWidths(active) {
    if (!active?.props?.tableData?.length) return [];
    const colCount = Object.keys(active.props.tableData[0]).length;
    const widths = active.props.columnWidths;
    if (Array.isArray(widths) && widths.length === colCount) {
      return widths.slice();
    }
    const equal = Number((100 / colCount).toFixed(2));
    const next = Array(colCount).fill(equal);
    const sum = equal * colCount;
    if (next.length) {
      next[next.length - 1] = Number((100 - (sum - equal)).toFixed(2));
    }
    active.props.columnWidths = next;
    return next;
  },

  setTableColumnWidths(widths, elementId) {
    const id = elementId || state.activeComponent?.id;
    const target = state.storeList.find((item) => item.id === id);
    if (target && Array.isArray(widths)) {
      target.props.columnWidths = widths.map((w) => Number(Number(w).toFixed(2)));
    }
  },

  removeTableColumn(removeKey) {
    const active = state.storeList.find((item) => item.id === state.activeComponent?.id);
    if (active) {
      const keys = Object.keys(active.props.tableData[0] || {});
      const removeIndex = keys.indexOf(removeKey);
      const widths = this.ensureTableColumnWidths(active);

      active.props.tableData = active.props.tableData.map(item => {
        const newItem = {};
        for (const key in item) {
          if (key !== removeKey) {
            newItem[key] = item[key];
          }
        }
        return newItem;
      });

      if (removeIndex >= 0 && widths.length > 1) {
        const next = widths.slice();
        const removedWidth = next.splice(removeIndex, 1)[0];
        if (removeIndex === 0) {
          next[0] = Number((next[0] + removedWidth).toFixed(2));
        } else {
          next[removeIndex - 1] = Number((next[removeIndex - 1] + removedWidth).toFixed(2));
        }
        active.props.columnWidths = next;
      } else if (widths.length <= 1) {
        active.props.columnWidths = [];
      }
    }
  },

  addTableColumn(insertIndex) {
    const active = state.storeList.find((item) => item.id === state.activeComponent?.id);
    if (active) {
      const widths = this.ensureTableColumnWidths(active);
      const beforeCount = Object.keys(active.props.tableData[0] || {}).length;

      active.props.tableData = active.props.tableData.map(item => {
        let keyIndex = 0;
        const newItem = {};
        for (const key in item) {
          keyIndex++;
          newItem[key] = item[key];
          if (keyIndex === insertIndex) {
            newItem['新增列'] = '';
          }
        }
        return newItem;
      });

      const afterCount = Object.keys(active.props.tableData[0] || {}).length;
      if (afterCount === beforeCount + 1 && widths.length) {
        // New column is inserted after the insertIndex-th key → 0-based index insertIndex
        // Split width from the preceding column (insertIndex - 1).
        const next = widths.slice();
        const sourceIdx = Math.max(0, Math.min(insertIndex - 1, next.length - 1));
        const half = Number((next[sourceIdx] / 2).toFixed(2));
        const rest = Number((next[sourceIdx] - half).toFixed(2));
        next[sourceIdx] = rest;
        next.splice(sourceIdx + 1, 0, half);
        active.props.columnWidths = next;
      }
    }
  },

  setTableRowValue(key, value, currentIndex) {
    const active = state.storeList.find((item) => item.id === state.activeComponent?.id);
    if (active) {
      active.props.tableData = active.props.tableData.map((item, index) => {
        const newItem = { ...item };
        if (index === currentIndex) {
          newItem[key] = value;
        }
        return newItem;
      });
    }
  },

  setTableColumnKey(oldKey, newKey) {
    const active = state.storeList.find((item) => item.id === state.activeComponent?.id);
    if (active) {
      active.props.tableData = active.props.tableData.map(item => {
        const newItem = {};
        for (const key in item) {
          if (key !== oldKey) {
            newItem[key] = item[key];
          } else {
            newItem[newKey] = item[oldKey];
          }
        }
        return newItem;
      });
    }
  }
};
