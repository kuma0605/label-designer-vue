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
  <div
    class="preview-table-wrap"
    :style="{ '--table-border-style': borderStyle }"
  >
    <table v-if="columns.length" class="preview-table">
      <colgroup>
        <col
          v-for="(width, index) in columnWidths"
          :key="`preview-col-${index}`"
          :style="{ width: `${width}%` }"
        />
      </colgroup>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col">
            <div
              class="preview-table__th"
              :style="{ textAlign: align, fontWeight: isBold ? 'bold' : 'normal', fontSize: formattedFontSize }"
            >{{ col }}</div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in tableData" :key="rowIndex">
          <td v-for="col in columns" :key="col">
            <div
              class="preview-table__td"
              :style="{ textAlign: align, fontWeight: isBold ? 'bold' : 'normal', fontSize: formattedFontSize }"
            >{{ row[col] }}</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.preview-table-wrap {
  width: 100%;
  height: 100%;
  --table-border-color: #000;
  box-sizing: border-box;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.preview-table th,
.preview-table td {
  vertical-align: middle;
}

.preview-table__th,
.preview-table__td {
  padding: 6px 10px;
  border: 1px var(--table-border-style) var(--table-border-color);
  border-right: 0;
  word-break: break-all;
  box-sizing: border-box;
  overflow: hidden;
}

.preview-table__th {
  background-color: #fafafa;
  font-weight: bold;
  text-align: left;
}

.preview-table th:last-child .preview-table__th,
.preview-table td:last-child .preview-table__td {
  border-right: 1px var(--table-border-style) var(--table-border-color);
}

.preview-table td .preview-table__td {
  border-top: 0;
}
</style>
