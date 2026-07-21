<script setup>
import { onMounted, computed } from 'vue';

const props = defineProps({
  elementId: {
    type: String,
    default: '',
  },
  borderWidth: {
    type: Number,
    default: 1,
  },
  lineType: {
    type: String,
    default: 'solid',
  },
});

const emit = defineEmits(['complete']);

const getStyle = computed(() => {
  const { borderWidth, lineType } = props;
  return {
    width: '100%',
    height: '100%',
    border: `${borderWidth}px ${lineType} #000`,
  };
});

onMounted(() => {
  emit('complete');
});
</script>

<template>
  <div :id="elementId" class="rectangle-wrap" :style="getStyle"></div>
</template>

<style lang="scss">
.rectangle-wrap {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 10px;
  min-height: 10px;
}
</style>
