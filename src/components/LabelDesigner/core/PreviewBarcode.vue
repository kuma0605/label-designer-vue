<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { replaceVars, generateBarcodeDataUrl } from '@/utils/preview';

const props = defineProps({
  component: { type: Object, required: true },
  variables: { type: Object, default: () => ({}) }
});

const barcodeSrc = ref('');
const displayText = ref('');

const displayValue = computed(() => props.component?.props?.displayValue);

// 生成条码：先替换占位符，再调 jsbarcode 生成图片
const renderBarcode = async () => {
  const { props: cProps } = props.component;

  // 替换占位符得到真实数据
  const rawData = replaceVars(cProps.data, props.variables);

  // 人显文本（displayValue）也替换
  displayText.value = rawData;

  if (!rawData) {
    barcodeSrc.value = '';
    return;
  }

  try {
    barcodeSrc.value = await generateBarcodeDataUrl(rawData, {
      format: cProps.format || 'CODE128',
      lineWidth: cProps.lineWidth || 2,
      bodyHeight: cProps.bodyHeight || 40
    });
  } catch (e) {
    console.error('Preview barcode render failed:', e);
    barcodeSrc.value = '';
  }
};

onMounted(renderBarcode);
// 数据变化时重新生成
watch(
  () => [props.variables, props.component.props.data],
  renderBarcode,
  { deep: true }
);
</script>

<template>
  <div class="barcode-wrap">
    <img
      v-if="barcodeSrc"
      class="barcode"
      :src="barcodeSrc"
      alt="barcode"
      draggable="false"
    />
    <p
      v-if="displayValue === '1' && displayText"
      class="barcode-text"
    >{{ displayText }}</p>
  </div>
</template>

<style scoped>
.barcode-wrap {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.barcode {
  max-width: 100%;
  vertical-align: middle;
  user-select: none;
}
.barcode-text {
  font-size: 12px;
  font-weight: normal;
  text-align: center;
  margin: 2px 0 0 0;
}
</style>
