<script setup>
import { onMounted, watch, computed } from 'vue';
import barcode from 'jsbarcode';
import VarText from './VarText.vue';

const props = defineProps({
  elementId: {
    type: String,
    default: '',
  },
  bodyHeight: {
    type: Number,
    default: 40,
  },
  lineWidth: {
    type: Number,
    default: 2,
  },
  format: {
    type: String,
    default: 'CODE128',
  },
  displayValue: {
    type: String,
    default: '1',
  },
  data: {
    type: String,
    default: '',
  },
  fontSize: {
    type: [Number, String],
    default: 14,
  }
});

const emit = defineEmits(['complete']);

const getStyle = computed(() => {
  const size = props.fontSize ? (String(props.fontSize).includes('px') ? props.fontSize : props.fontSize + 'px') : '14px';
  return {
    maxWidth: '100%',
    verticalAlign: 'middle',
    userSelect: 'none',
    fontSize: size
  };
});

const renderBarcode = () => {
  const { elementId, bodyHeight, lineWidth, format, data } = props;
  if (!elementId || !data) return;
  try {
    barcode(`.${elementId}`, data, {
      format,
      width: lineWidth,
      height: bodyHeight,
      textMargin: 10,
      displayValue: false, // We render value text ourselves
    });
  } catch (e) {
    console.error('Barcode rendering error:', e);
  }
};

watch(
  () => [props.data, props.format, props.lineWidth, props.bodyHeight],
  () => {
    renderBarcode();
  },
  { flush: 'post' }
);

onMounted(() => {
  renderBarcode();
  emit('complete');
});
</script>

<template>
  <div class="barcode-wrap">
    <img
      ref="img"
      :class="['barcode', elementId]"
      :style="getStyle"
      alt="barcode"
      draggable="false"
    />
    <VarText v-if="displayValue === '1'" class="barcode-text" :style="getStyle" :text="data" />
  </div>
</template>

<style lang="scss">
.barcode-wrap {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
  .barcode {
    max-width: 100%;
    vertical-align: middle;
    user-select: none;
  }
  .barcode-text {
    font-weight: normal;
    text-align: center;
  }
}
</style>
