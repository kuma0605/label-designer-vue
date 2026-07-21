<script setup>
import { computed } from 'vue';
import { state } from '../store/designerState.js';

const props = defineProps({
  componentObject: {
    type: Object,
    default() {
      return {};
    },
  },
});

const emit = defineEmits(['resize-down']);

const currentComponent = computed(() => {
  const activeId = state.activeComponent?.id;
  if (!activeId) return null;
  return state.storeList.find((item) => item.id === activeId);
});

const isLine = computed(() => {
  const type = props.componentObject.type;
  return type === 'XLineUi' || type === 'YLineUi';
});

const isYLine = computed(() => {
  return props.componentObject.type === 'YLineUi';
});

const resizeDisabledY = computed(() => {
  return props.componentObject.type === 'XLineUi';
});

const resizeDisabledX = computed(() => {
  return props.componentObject.type === 'YLineUi';
});

const resizeStyle = computed(() => {
  const style = {};
  if (isYLine.value && currentComponent.value) {
    style.width = `${currentComponent.value.props.height}px`;
  }
  return style;
});

const cursorType = computed(() => {
  const type = {
    'XLineUi': 'col-resize',
    'YLineUi': 'row-resize',
  };
  return type[props.componentObject.type] || 'se-resize';
});

const iconStyle = computed(() => {
  return {
    cursor: isLine.value ? cursorType.value : 'se-resize',
  };
});

const barStyle = computed(() => {
  const style = {
    cursor: isLine.value ? cursorType.value : 'se-resize',
    width: resizeDisabledX.value ? '100%' : '16px',
    height: resizeDisabledY.value ? '100%' : '16px',
  };
  if (resizeDisabledX.value) {
    style.bottom = 0;
    style.left = 0;
  }
  if (resizeDisabledY.value) {
    style.top = 0;
    style.right = 0;
  }
  if (isYLine.value && currentComponent.value) {
    style.width = `${currentComponent.value.props.width}px`;
  }
  return style;
});

const resizeClass = computed(() => {
  return isLine.value ? '' : 'resize-btn';
});

const handleResizeDown = (e) => {
  emit('resize-down', e);
};
</script>

<template>
  <div :class="[resizeClass, 'resize-area']" :style="resizeStyle">
    <!-- Resize Icon for Non-Line components -->
    <svg
      v-if="!isLine"
      class="icontuozhuaidaxiao"
      :style="iconStyle"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0052d9"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      @click.stop
      @mousedown="handleResizeDown"
    >
      <path d="M15 19l-4-4 4-4" />
      <path d="M9 5l4 4-4 4" />
    </svg>
    <div
      v-else
      class="resize-bar"
      :style="barStyle"
      @click.stop
      @mousedown="handleResizeDown"
    />
  </div>
</template>

<style lang="scss">
.resize-area {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 10;
  .icontuozhuaidaxiao {
    font-size: 12px;
    background: #ffffff;
    border: 1px solid #0052d9;
    border-radius: 50%;
    cursor: se-resize;
  }
  .resize-bar {
    position: absolute;
    height: 100%;
    width: 16px;
    display: flex;
    align-items: center;
    background-color: #0052d9;
    &:after {
      content: '';
      width: 8px;
      height: 8px;
      background-color: #0052d9;
      border: 2px solid #ffffff;
      border-radius: 100%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
}
</style>
