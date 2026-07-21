<script setup>
import { onMounted, computed } from 'vue';

const props = defineProps({
  elementId: {
    type: String,
    default: '',
  },
  width: {
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
  const { width, lineType } = props;
  const style = {
    minHeight: '100%'
  };
  if (lineType === 'solid') {
    style.width = `${width}px`;
    style.backgroundColor = '#000';
  } else if (lineType === 'dashed') {
    style.borderLeft = `${width}px ${lineType} #000`;
    style.width = '0px';
  }
  return style;
});

onMounted(() => {
  emit('complete');
});
</script>

<template>
  <div :id="elementId" class="y-line-wrap" :style="getStyle"></div>
</template>

<style lang="scss">
.y-line-wrap {
  box-sizing: border-box;
  height: 100%;
}
</style>
