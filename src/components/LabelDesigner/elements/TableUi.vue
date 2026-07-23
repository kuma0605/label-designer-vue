<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { on, off } from '@/utils/dom';
import { actions, state } from '../store/designerState.js';

const MIN_COL_PERCENT = 8;

const props = defineProps({
  elementId: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: false
  },
  borderStyle: {
    type: String,
    default: 'solid'
  },
  align: {
    type: String,
    default: 'left'
  },
  isBold: {
    type: Boolean,
    default: false
  },
  fontSize: {
    type: [String, Number],
    default: '12px'
  },
  tableData: {
    type: Array,
    default() {
      return [];
    }
  },
  columnWidths: {
    type: Array,
    default() {
      return [];
    }
  }
});

const emit = defineEmits(['complete']);

const tableRef = ref(null);
const resizeIndex = ref(-1);
const resizeStartX = ref(0);
const resizeStartWidths = ref([]);
const didResizeDrag = ref(false);

const formattedFontSize = computed(() => {
  if (!props.fontSize) return '12px';
  const str = String(props.fontSize);
  return str.includes('px') ? str : `${str}px`;
});

const getItemStyle = computed(() => {
  return {
    '--table-border-style': props.borderStyle || 'solid'
  };
});

const columns = computed(() => {
  if (!props.tableData?.length) return [];
  return Object.keys(props.tableData[0] || {});
});

const resolvedWidths = computed(() => {
  const colCount = columns.value.length;
  if (!colCount) return [];
  const widths = props.columnWidths;
  if (Array.isArray(widths) && widths.length === colCount) {
    return widths;
  }
  const equal = Number((100 / colCount).toFixed(2));
  const next = Array(colCount).fill(equal);
  next[next.length - 1] = Number((100 - equal * (colCount - 1)).toFixed(2));
  return next;
});

onMounted(() => {
  emit('complete');
});

onUnmounted(() => {
  clearResizeListeners();
});

const onKeyChange = (e, oldKey) => {
  const newKey = e.target.innerText.trim();
  if (newKey && newKey !== oldKey) {
    actions.setTableColumnKey(oldKey, newKey);
  }
};

const onValueChange = (e, key, index) => {
  const value = e.target.innerText;
  actions.setTableRowValue(key, value, index);
};

const handleAddRow = (index) => {
  const active = state.storeList.find((item) => item.id === props.elementId);
  if (active && active.props.tableData.length) {
    const item = active.props.tableData[0];
    const row = {};
    for (const key in item) {
      row[key] = '';
    }
    active.props.tableData.splice(index + 1, 0, row);
  }
};

const handleRemoveRow = (index) => {
  actions.removeTableRow(index);
};

const handleAddColumn = (index) => {
  actions.addTableColumn(index);
};

const handleRemoveColumn = (key) => {
  actions.removeTableColumn(key);
};

const clearResizeListeners = () => {
  off(document, 'mousemove', handleResizeMove);
  off(document, 'mouseup', handleResizeUp);
};

const handleResizeMove = (e) => {
  if (resizeIndex.value < 0 || !tableRef.value) return;
  const deltaX = e.clientX - resizeStartX.value;
  if (Math.abs(deltaX) > 2) {
    didResizeDrag.value = true;
  }

  const tableWidth = tableRef.value.getBoundingClientRect().width || 1;
  const deltaPercent = (deltaX / tableWidth) * 100;
  const leftIdx = resizeIndex.value;
  const rightIdx = leftIdx + 1;
  const start = resizeStartWidths.value;
  if (rightIdx >= start.length) return;

  const pairTotal = start[leftIdx] + start[rightIdx];
  let nextLeft = start[leftIdx] + deltaPercent;
  nextLeft = Math.max(MIN_COL_PERCENT, Math.min(pairTotal - MIN_COL_PERCENT, nextLeft));
  const nextRight = pairTotal - nextLeft;

  const next = start.slice();
  next[leftIdx] = Number(nextLeft.toFixed(2));
  next[rightIdx] = Number(nextRight.toFixed(2));
  actions.setTableColumnWidths(next, props.elementId);
};

const handleResizeUp = () => {
  clearResizeListeners();
  resizeIndex.value = -1;
  if (didResizeDrag.value) {
    const suppressClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.removeEventListener('click', suppressClick, true);
      didResizeDrag.value = false;
    };
    document.addEventListener('click', suppressClick, true);
  }
};

const handleColResizeDown = (e, colIndex) => {
  if (colIndex >= columns.value.length - 1) return;
  e.preventDefault();
  e.stopPropagation();
  didResizeDrag.value = false;
  resizeIndex.value = colIndex;
  resizeStartX.value = e.clientX;
  resizeStartWidths.value = resolvedWidths.value.slice();
  on(document, 'mousemove', handleResizeMove);
  on(document, 'mouseup', handleResizeUp);
};

const onColHandleClick = (e) => {
  if (didResizeDrag.value) {
    e.preventDefault();
    e.stopPropagation();
  }
};
</script>

<template>
  <div class="table-wrap" :style="getItemStyle">
    <table
      ref="tableRef"
      class="w-100 table-wrap__table"
      border="0"
      cellspacing="1px"
      cellpadding="0"
    >
      <colgroup>
        <col
          v-for="(width, index) in resolvedWidths"
          :key="`col-${index}`"
          :style="{ width: `${width}%` }"
        />
      </colgroup>
      <thead>
        <tr>
          <th v-for="(item, key, index) in tableData[0]" :key="index">
            <div class="table-wrap__th">
              <p
                contenteditable="true"
                :style="{ textAlign: align || 'left', fontWeight: isBold ? 'bold' : 'normal', fontSize: formattedFontSize }"
                @blur="onKeyChange($event, key)"
              >{{ key }}</p>
              <!-- 非末列：拖拽改宽；选中时单击仍可打开插删列菜单 -->
              <template v-if="index < columns.length - 1">
                <t-popup
                  v-if="isActive"
                  placement="right"
                  trigger="click"
                  :disabled="didResizeDrag"
                >
                  <template #content>
                    <div class="func-list">
                      <div class="item" @click.stop="handleAddColumn(index)">插入列</div>
                      <div class="item" @click.stop="handleRemoveColumn(key)">删除列</div>
                    </div>
                  </template>
                  <div
                    class="table-wrap__col-handle"
                    @mousedown="handleColResizeDown($event, index)"
                    @click="onColHandleClick"
                  />
                </t-popup>
                <div
                  v-else
                  class="table-wrap__col-handle"
                  @mousedown="handleColResizeDown($event, index)"
                />
              </template>
              <t-popup
                v-else-if="isActive"
                placement="right"
                trigger="click"
              >
                <template #content>
                  <div class="func-list">
                    <div class="item" @click.stop="handleAddColumn(index)">插入列</div>
                    <div class="item" @click.stop="handleRemoveColumn(key)">删除列</div>
                  </div>
                </template>
                <div class="table-wrap__add" @mousedown.stop />
              </t-popup>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in tableData" :key="index" class="table-wrap__tr">
          <td v-for="(child, itemKey, itemIndex) in item" :key="itemIndex">
            <div class="table-wrap__td">
              <span
                contenteditable="true"
                :style="{ textAlign: align || 'left', fontWeight: isBold ? 'bold' : 'normal', fontSize: formattedFontSize }"
                @blur="onValueChange($event, itemKey, index)"
              >{{ item[itemKey] }}</span>
              <t-popup
                v-if="isActive"
                placement="right"
                trigger="click"
              >
                <template #content>
                  <div class="func-list">
                    <div class="item" @click.stop="handleAddRow(index)">插入行</div>
                    <div class="item" @click.stop="handleRemoveRow(index)">删除行</div>
                  </div>
                </template>
                <div class="table-wrap__insert" />
              </t-popup>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="table-wrap__place" />
  </div>
</template>

<style lang="scss">
.func-list {
  padding: 5px 0;
  .item {
    line-height: 32px;
    cursor: pointer;
    padding: 0 15px;
    font-size: 12px;
    color: #333;
    &:hover {
      color: #0052d9;
      background-color: #f3f3f3;
    }
  }
}
.table-wrap {
  width: 100%;
  --table-border-color: #000;
  position: relative;

  &__table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  &__place {
    height: 30px;
  }
  &__tr {
    position: relative;
  }
  &__insert {
    width: 100%;
    height: 3px;
    background-color: #0052d9;
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 100;
    cursor: pointer;
    opacity: 0.2;
    &:hover {
      opacity: 1;
      height: 5px;
    }
  }

  &__col-handle {
    position: absolute;
    top: 0;
    right: -3px;
    z-index: 110;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    background-color: #0052d9;
    opacity: 0.15;
    &:hover {
      opacity: 0.7;
      width: 6px;
    }
  }

  &__add {
    position: absolute;
    top: 0;
    right: -2px;
    z-index: 100;
    width: 3px;
    height: 100%;
    background-color: #0052d9;
    cursor: pointer;
    opacity: 0.2;
    &:hover {
      opacity: 1;
      width: 5px;
    }
  }
  th {
    p {
      margin: 0;
      min-width: 30px;
      outline: none;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .table-wrap__th {
      padding: 6px 10px;
      position: relative;
      border: 1px var(--table-border-style) var(--table-border-color);
      border-right: 0;
      background-color: #fafafa;
    }
    &:last-child {
      .table-wrap__th {
        border-right: 1px var(--table-border-style) var(--table-border-color);
      }
    }
  }
  td {
    span {
      display: inline-block;
      width: 100%;
      min-height: 20px;
      outline: none;
      overflow: hidden;
      word-break: break-all;
    }
    .table-wrap__td {
      padding: 6px 10px;
      position: relative;
      border: 1px var(--table-border-style) var(--table-border-color);
      border-top: 0;
      border-right: 0;
    }
    &:last-child {
      .table-wrap__td {
        border-right: 1px var(--table-border-style) var(--table-border-color);
      }
    }
  }
}
</style>
