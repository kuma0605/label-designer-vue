<script setup>
import { computed } from 'vue';
import { replaceVars } from '@/utils/preview';

const props = defineProps({
  component: { type: Object, required: true },
  variables: { type: Object, default: () => ({}) }
});

const textStyle = computed(() => {
  const { isBold } = props.component.props || {};
  return {
    fontWeight: isBold ? 'bold' : 'normal'
  };
});

// 渲染文本：将 ${key} 占位符替换为真实数据
const renderedHtml = computed(() => {
  const { variable, props: cProps = {} } = props.component || {};
  const vars = props.variables || {};

  // 有变量标记且 textData 数组非空：按 textData 分段渲染
  if (
    variable &&
    variable.enable &&
    Array.isArray(variable.textData) &&
    variable.textData.length > 0
  ) {
    return variable.textData
      .map((item) => {
        if (item.key && vars[item.key] !== undefined) {
          // 有真实值 → 替换（转义防 XSS）
          return `<span>${escapeHtml(String(vars[item.key]))}</span>`;
        }
        // 无真实值 → 显示占位符字面量
        return `<span class="var-placeholder">${escapeHtml(item.value || '')}</span>`;
      })
      .join('')
      .replace(/\n/g, '<br/>');
  }

  // 纯文本或 textData 为空的情况：直接对 text / data 执行 replaceVars 替换
  const raw = cProps.text || cProps.data || '';
  const replaced = replaceVars(raw, vars);
  return escapeHtml(replaced).replace(/\n/g, '<br/>');
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
</script>

<template>
  <div
    class="detail"
    :style="textStyle"
    v-html="renderedHtml"
  />
</template>

<style scoped>
.detail {
  display: inline-block;
  word-break: break-all;
  word-wrap: break-word;
  width: 100%;
  height: 100%;
}
.var-placeholder {
  color: #0052d9;
  border-bottom: 1px dashed #0052d9;
}
</style>
