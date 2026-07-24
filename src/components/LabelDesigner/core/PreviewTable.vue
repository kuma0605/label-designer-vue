<script setup>
import { computed } from 'vue';
import { replaceVars } from '@/utils/preview';

const props = defineProps({
  component: { type: Object, required: true },
  variables: { type: Object, default: () => ({}) }
});

const borderStyle = computed(() => props.component?.props?.borderStyle || 'solid');
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
  fontWeight: isBold.value ? 'bold' : 'normal',
  fontSize: formattedFontSize.value,
  // 避免继承打印弹窗 / TDesign 的 line-height:22px、PingFang，否则行高被撑高、绝对定位矩形上移
  lineHeight: 'normal',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
}));

const tableData = computed(() => {
  const raw = props.component?.props?.tableData;
  if (!Array.isArray(raw) || raw.length === 0) return [];

  return raw.map((row) => {
    const next = {};
    Object.keys(row || {}).forEach((key) => {
      next[key] = replaceVars(String(row[key] ?? ''), props.variables);
    });
    return next;
  });
});

const columns = computed(() => {
  if (!tableData.value.length) return [];
  return Object.keys(tableData.value[0]);
});

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
    :style="{ '--table-border-style': borderStyle }"
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
          <th v-for="col in columns" :key="col">
            <div class="table-wrap__th">
              <p :style="cellTextStyle">{{ col }}</p>
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
          <td v-for="col in columns" :key="col">
            <div class="table-wrap__td">
              <span :style="cellTextStyle">{{ row[col] }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* 与 TableUi.vue 单元格度量保持一致（不做预览侧特化） */
.preview-table-wrap {
  width: 100%;
  height: 100%;
  --table-border-color: #000;
  position: relative;
  line-height: normal;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.preview-table-wrap :deep(.table-wrap__table) {
  width: 100%;
  height: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.preview-table-wrap :deep(th p) {
  margin: 0;
  min-width: 30px;
  outline: none;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-table-wrap :deep(.table-wrap__th) {
  padding: 6px 10px;
  position: relative;
  border: 1px var(--table-border-style) var(--table-border-color);
  border-right: 0;
  background-color: #fafafa;
}

.preview-table-wrap :deep(th:last-child .table-wrap__th) {
  border-right: 1px var(--table-border-style) var(--table-border-color);
}

.preview-table-wrap :deep(td span) {
  display: inline-block;
  width: 100%;
  min-height: 20px;
  outline: none;
  overflow: hidden;
  word-break: break-all;
}

.preview-table-wrap :deep(.table-wrap__td) {
  padding: 6px 10px;
  position: relative;
  border: 1px var(--table-border-style) var(--table-border-color);
  border-top: 0;
  border-right: 0;
}

.preview-table-wrap :deep(td:last-child .table-wrap__td) {
  border-right: 1px var(--table-border-style) var(--table-border-color);
}
</style>
