<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { on, off } from '@/utils/dom';
import { state, actions } from '../store/designerState.js';
import Drag from './Drag.vue';
import { throttle } from 'throttle-debounce';

const boardRef = ref(null);
const dragRefs = ref([]);

const yStyle = computed(() => {
  return {
    left: `${state.line.left}px`
  };
});

const xStyle = computed(() => {
  return {
    top: `${state.line.top}px`
  };
});

const onWindowResize = () => {
  const rect = boardRef.value?.getBoundingClientRect();
  if (rect) {
    actions.setLayoutData({
      minLeft: rect.left,
      maxLeft: rect.right,
      minTop: rect.top,
      maxTop: rect.bottom,
      x: rect.left,
      y: rect.top
    });
  }
  // Call init on all drag instances to recalibrate positions
  if (dragRefs.value && dragRefs.value.length > 0) {
    dragRefs.value.forEach((item) => {
      if (item && item.init) {
        item.init();
      }
    });
  }
};

const throttleUpdateValve = throttle(100, () => {
  actions.updateValve();
});

const onKeyDown = (e) => {
  const keyCode = e.keyCode;
  const activeId = state.activeComponent?.id;
  if (!activeId) return;

  // Arrow keys micro-adjustment
  const keysHandler = [
    { code: 38, handler: 'up' },
    { code: 40, handler: 'down' },
    { code: 37, handler: 'left' },
    { code: 39, handler: 'right' }
  ];

  const targetDrag = dragRefs.value.find((item) => item?.aimId === activeId);
  const worker = keysHandler.find((item) => item.code === keyCode);
  
  if (worker && targetDrag && targetDrag[worker.handler]) {
    throttleUpdateValve();
    targetDrag[worker.handler]();
    e.preventDefault();
  }
};

const onDeleteKeyUp = (e) => {
  // If the user is currently typing in an input field or textarea, do not trigger canvas component deletion
  const activeEl = document.activeElement;
  if (activeEl) {
    const tagName = activeEl.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || activeEl.isContentEditable) {
      return;
    }
  }

  if (e.keyCode === 8 || e.keyCode === 46) { // Backspace or Delete
    actions.removeActiveComponent();
  }
  actions.updateValve(0);
};

const handleDrop = (e) => {
  e.preventDefault();
  const componentId = e.dataTransfer.getData('componentId');
  if (!componentId) return;

  const clientX = e.clientX;
  const clientY = e.clientY;

  // Verify drop inside boundaries
  const boardRect = boardRef.value.getBoundingClientRect();
  const xArea = clientX < boardRect.right && clientX > boardRect.left;
  const yArea = clientY < boardRect.bottom && clientY > boardRect.top;

  if (xArea && yArea) {
    const varKey = e.dataTransfer.getData('variableKey');
    const varLabel = e.dataTransfer.getData('variableLabel');
    
    const canvasX = clientX - boardRect.left;
    const canvasY = clientY - boardRect.top;

    const defaultProps = {
      position: {
        clientX: canvasX,
        clientY: canvasY
      }
    };

    if (varKey) {
      defaultProps.text = `${varLabel}：\${${varKey}}`;
    }

    actions.addComponent(componentId, defaultProps);
    
    if (varKey) {
      actions.setComponentVariable();
    }
  }
};

const onMove = () => {
  //
};

const onMoveEnd = () => {
  actions.setLine({ left: '', top: '' });
};

const onMoveUpdate = (data) => {
  const { height, width, x, y, position, instance, id, rect } = data;
  const updateData = {
    default: { height, width, x, y },
    instance,
    position,
    rect
  };
  actions.updateComponent(id, updateData);
};

onMounted(() => {
  onWindowResize();
  on(window, 'resize', onWindowResize);
  on(window, 'keydown', onKeyDown);
  on(window, 'keyup', onDeleteKeyUp);
});

onUnmounted(() => {
  off(window, 'resize', onWindowResize);
  off(window, 'keydown', onKeyDown);
  off(window, 'keyup', onDeleteKeyUp);
});

defineExpose({
  onWindowResize
});
</script>

<template>
  <div
    ref="boardRef"
    class="drag-canvas-warp board-canvas"
    @dragover.prevent
    @drop="handleDrop"
  >
    <!-- Alignment helper lines -->
    <div v-if="state.line.top" class="x-help-line" :style="xStyle" />
    <div v-if="state.line.left" class="y-help-line" :style="yStyle" />
    
    <template v-for="item in state.storeList" :key="item.id">
      <Drag
        v-show="!state.storeLoading"
        ref="dragRefs"
        :default-x="item.position.clientX"
        :default-y="item.position.clientY"
        :aim-id="item.id"
        :update-id="item.updateId"
        :component-object="item"
        :is-instance="item.instance"
        :default="item.default"
        @move-update="onMoveUpdate"
        @move-end="onMoveEnd"
        @move="onMove"
      />
    </template>
  </div>
</template>

<style lang="scss">
.drag-canvas-warp {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  * {
    user-select: none;
  }
  .x-help-line {
    width: 100%;
    border-bottom: 1px dashed #0052d9;
    position: absolute;
    z-index: 100;
    pointer-events: none;
  }
  .y-help-line {
    height: 100%;
    border-left: 1px dashed #0052d9;
    position: absolute;
    z-index: 100;
    pointer-events: none;
  }
}
</style>
