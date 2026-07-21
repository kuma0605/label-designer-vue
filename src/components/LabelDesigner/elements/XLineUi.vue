<script setup>
import { onMounted, computed } from 'vue';

const props = defineProps({
  elementId: {
    type: String,
    default: '',
  },
  height: {
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
  const { height, lineType } = props;
  const style = {
    width: '100%',
  };
  if (lineType === 'solid') {
    style.height = `${height}px`;
    style.backgroundColor = '#000';
  } else if (lineType === 'dashed') {
    style.borderTop = `${height}px ${lineType} #000`;
    style.height = '0px';
  }
  return style;
});

onMounted(() => {
  emit('complete');
});
</script>

<template>
  <div :id="elementId" class="x-line-wrap" :style="getStyle"></div>
</template>

<style lang="scss">
.x-line-wrap {
  box-sizing: border-box;
}
</style>
