<script setup>
import { computed } from 'vue';
import { replaceVars } from '@/utils/preview';

const props = defineProps({
  component: { type: Object, required: true },
  variables: { type: [Object, Array], default: () => ({}) }
});

const borderStyle = computed(() => props.component?.props?.borderStyle || 'solid');
const borderWidth = computed(() => {
  const w = Number(props.component?.props?.borderWidth);
  return Number.isFinite(w) && w > 0 ? w : 2;
});
const align = computed(() => props.component?.props?.align || 'left');
const isBold = computed(() => !!props.component?.props?.isBold);
const formattedFontSize = computed(() => {
  const f = props.component?.props?.fontSize;
  if (!f) return '12px';
  const str = String(f);
  return str.includes('px') ? str : `${str}px`;
});

const cellTextStyle = computed(() => ({
  textAlign: align.value || 'left',
  fontWeight: isBold.value ? 700 : 400,
  fontSize: formattedFontSize.value,
  lineHeight: '1.25',
  // 加粗时雅黑优先，与打印 PRINT_CSS 一致（位图 / HTML 同粗细）
  fontFamily: isBold.value
    ? '"Microsoft YaHei", "Microsoft YaHei UI", Arial, sans-serif'
    : 'Arial, "Helvetica Neue", "Microsoft YaHei", sans-serif'
}));

/** 原始列 key（可能含 $_{var}），用于取数；展示用 label（已替换） */
const columns = computed(() => {
  const raw = props.component?.props?.tableData;
  if (!Array.isArray(raw) || !raw.length) return [];
  return Object.keys(raw[0] || {}).map((key) => ({
    key,
    label: replaceVars(String(key), props.variables)
  }));
});

const tableData = computed(() => {
  const raw = props.component?.props?.tableData;
  if (!Array.isArray(raw) || raw.length === 0) return [];

  return raw.map((row) => {
    const next = {};
    Object.keys(row || {}).forEach((key) => {
      // 单元格值与表头（列名）都支持 $_{asset_num} 等占位符
      next[key] = replaceVars(String(row[key] ?? ''), props.variables);
    });
    return next;
  });
});

const tableRowCount = computed(() => tableData.value.length + 1); // + header

const tableWrapStyle = computed(() => ({
  '--table-border-style': borderStyle.value,
  '--table-border-width': `${borderWidth.value}px`,
  // 与画布一致：按容器实际高度均分，勿用 default.height 写死 px（未扣 1px 边框会把行撑高，二维码相对上移）
  '--table-row-count': String(Math.max(tableRowCount.value, 1))
}));

const columnWidths = computed(() => {
  const colCount = columns.value.length;
  if (!colCount) return [];
  const widths = props.component?.props?.columnWidths;
  if (Array.isArray(widths) && widths.length === colCount) {
    return widths;
  }
  const equal = Number((100 / colCount).toFixed(2));
  const next = Array(colCount).fill(equal);
  next[next.length - 1] = Number((100 - equal * (colCount - 1)).toFixed(2));
  return next;
});
</script>

<template>
  <!-- DOM/CSS 对齐 TableUi，保证打印预览与画布行高一致 -->
  <div
    class="table-wrap preview-table-wrap"
    :class="{ 'is-bold': isBold }"
    :style="tableWrapStyle"
  >
    <table
      v-if="columns.length"
      class="table-wrap__table"
      cellspacing="0"
      cellpadding="0"
    >
      <colgroup>
        <col
          v-for="(width, index) in columnWidths"
          :key="`preview-col-${index}`"
          :style="{ width: `${width}%` }"
        />
      </colgroup>
      <thead>
        <tr class="table-wrap__tr">
          <th v-for="col in columns" :key="col.key">
            <div class="table-wrap__th">
              <p :style="cellTextStyle">{{ col.label }}</p>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in tableData"
          :key="rowIndex"
          class="table-wrap__tr"
        >
          <td v-for="col in columns" :key="col.key">
            <div class="table-wrap__td">
              <span :style="cellTextStyle">{{ row[col.key] }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* 与 TableUi.vue 一致：边框在 th/td 上，左右列必然同高 */
.preview-table-wrap {
  width: 100%;
  height: 100%;
  --table-border-color: #000;
  position: relative;
  line-height: 1.25;
  font-family: Arial, "Helvetica Neue", "Microsoft YaHei", sans-serif;
}

.preview-table-wrap :deep(.table-wrap__table) {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  border-top: var(--table-border-width, 2px) var(--table-border-style) var(--table-border-color);
  border-left: var(--table-border-width, 2px) var(--table-border-style) var(--table-border-color);
}

.preview-table-wrap :deep(.table-wrap__tr) {
  height: calc(100% / var(--table-row-count, 6));
}

.preview-table-wrap :deep(th),
.preview-table-wrap :deep(td) {
  position: relative;
  box-sizing: border-box;
  padding: 4px 8px;
  vertical-align: middle;
  border: 0;
  border-right: var(--table-border-width, 2px) var(--table-border-style) var(--table-border-color);
  border-bottom: var(--table-border-width, 2px) var(--table-border-style) var(--table-border-color);
  line-height: 1.25;
  height: inherit;
}

.preview-table-wrap :deep(th) {
  background-color: #fafafa;
}

.preview-table-wrap :deep(th p) {
  margin: 0;
  min-width: 30px;
  width: 100%;
  outline: none;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
  font-family: Arial, "Helvetica Neue", "Microsoft YaHei", sans-serif;
}

.preview-table-wrap :deep(td span) {
  display: block;
  width: 100%;
  outline: none;
  overflow: hidden;
  word-break: break-all;
  line-height: 1.25;
  font-family: Arial, "Helvetica Neue", "Microsoft YaHei", sans-serif;
}
</style>
