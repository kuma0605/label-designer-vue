<script setup>
import { computed, onMounted } from 'vue';
import VarText from './VarText.vue';

const props = defineProps({
  elementId: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    default: '',
  },
  fontFamily: {
    type: String,
    default: '',
  },
  fontSize: {
    type: String,
    default: '',
  },
  lineHeight: {
    type: String,
    default: '',
  },
  isBold: {
    type: Boolean,
    default: false,
  },
  hasBorder: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['complete']);

const getTextStyle = computed(() => {
  const { fontFamily, fontSize, lineHeight, isBold, hasBorder } = props;
  const size = fontSize ? (fontSize.includes('px') ? fontSize : fontSize + 'px') : '14px';
  return {
    fontFamily,
    fontSize: size,
    lineHeight: lineHeight || '1.5',
    fontWeight: isBold ? 'bold' : 'normal',
    border: hasBorder ? '1px solid #000' : '1px solid transparent',
  };
});

onMounted(() => {
  emit('complete');
});
</script>

<template>
  <div :id="elementId" class="text-component">
    <span class="detail" :style="getTextStyle">
      <VarText :text="text" />
    </span>
  </div>
</template>

<style lang="scss">
.text-component {
  width: 100%;
  height: 100%;
  .detail {
    display: inline-block;
    width: 100%;
    height: 100%;
    font-weight: normal;
    word-break: break-all;
    word-wrap: break-word;
    box-sizing: border-box;
  }
}
</style>
