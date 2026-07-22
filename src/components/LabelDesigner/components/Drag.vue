<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { debounce } from 'throttle-debounce';
import { on, off } from '@/utils/dom';
import { checkLine } from '@/utils';
import { state, actions } from '../store/designerState.js';
import DragResize from './DragResize.vue';
import {
  TextUi,
  BarcodeUi,
  QrCodeUi,
  XLineUi,
  YLineUi,
  RectangleUi,
  TableUi
} from '../elements/index.js';

// Map element types to components locally
const componentsList = {
  TextUi,
  BarcodeUi,
  QrCodeUi,
  XLineUi,
  YLineUi,
  RectangleUi,
  TableUi
};

const props = defineProps({
  componentObject: {
    type: Object,
    default() {
      return {};
    },
  },
  isInstance: {
    type: Boolean,
    default: false,
  },
  aimId: {
    type: String,
    default: '',
  },
  defaultX: {
    type: Number,
    default: 0,
  },
  defaultY: {
    type: Number,
    default: 0,
  },
  updateId: {
    type: String,
    default: '',
  },
  default: {
    type: Object,
    default() {
      return {};
    },
  },
});

const emit = defineEmits(['move', 'move-end', 'move-update', 'resize-end']);

const dragRef = ref(null);
const isMove = ref(false);
const x = ref('');
const y = ref('');
const width = ref('');
const height = ref('');

const defaultWidth = ref(20);
const defaultHeight = ref(20);
const downX = ref(0);
const downY = ref(0);
const resizeDownX = ref(0);
const resizeDownY = ref(0);
const downWidth = ref(0);
const downHeight = ref(0);
const offsetLeft = ref(0);
const offsetTop = ref(0);
const resizeOffsetRight = ref(0);
const resizeOffsetBottom = ref(0);
const board = ref({});

const isLine = computed(() => {
  return checkLine(props.componentObject.type);
});

const resizeDisabledY = computed(() => {
  return props.componentObject.type === 'XLineUi';
});

const resizeDisabledX = computed(() => {
  return props.componentObject.type === 'YLineUi';
});

const isActive = computed(() => {
  return state.activeComponent?.id === props.componentObject.id;
});

const selected = computed(() => {
  return state.selected;
});

const activeClass = computed(() => {
  const result = [];
  if (state.activeComponent?.id === props.componentObject.id) {
    result.push('is-active');
  } else if (selected.value.ids.includes(props.aimId)) {
    result.push('is-active');
  }
  if (props.componentObject.type === 'BarcodeUi') {
    result.push('barcode-ui');
  }
  if (isLine.value) {
    result.push('line-ui');
  }
  if (isMove.value) {
    result.push('is-move');
  }
  return result;
});

const resizeVisible = computed(() => {
  return activeClass.value.includes('is-active');
});

const dragStyle = computed(() => {
  const style = {
    padding: isLine.value ? '0' : '0 10px 0 0',
    overflow: isLine.value ? 'unset' : 'hidden',
  };
  if (x.value !== '') {
    style.left = `${x.value}px`;
  }
  if (y.value !== '') {
    style.top = `${y.value}px`;
  }
  if (width.value !== '') {
    style.width = `${width.value}px`;
  }
  if (height.value !== '') {
    style.height = `${height.value}px`;
  }
  return style;
});

const update = () => {
  setTimeout(() => {
    if (!dragRef.value) return;
    const rect = dragRef.value.getBoundingClientRect();
    const dragData = {
      id: props.aimId,
      x: x.value,
      y: y.value,
      instance: true,
      width: width.value || 0,
      height: height.value || 0,
      position: {
        clientX: x.value,
        clientY: y.value,
      },
      rect
    };
    emit('move-update', dragData);
  }, 100);
};

const debounceUpdateComponent = debounce(200, update);

const initLayoutScheme = () => {
  const $drag = dragRef.value;
  if (!$drag) return;
  const isInstance = props.isInstance;
  const element = $drag.firstElementChild;
  const defaultData = props.default;
  const canvas = document.querySelector('.drag-canvas-warp.board-canvas');
  if (!canvas || !element) return;

  const rect = $drag.getBoundingClientRect();
  board.value = canvas.getBoundingClientRect();
  offsetLeft.value = board.value.left;
  offsetTop.value = board.value.top;

  if (isInstance) {
    x.value = defaultData.x;
    y.value = defaultData.y;
    width.value = defaultData.width;
    height.value = defaultData.height || '';
  } else {
    // handleDrop already stores canvas-relative coords in position.clientX/Y
    x.value = props.defaultX;
    y.value = props.defaultY;

    if (defaultData.width !== '' && defaultData.width !== undefined) {
      width.value = defaultData.width;
    } else {
      width.value = rect.width;
    }
    if (defaultData.height !== '' && defaultData.height !== undefined) {
      height.value = defaultData.height;
    } else {
      height.value = rect.height;
    }
  }
  nextTick(() => {
    debounceUpdateComponent();
  });
};

const init = () => {
  nextTick(() => {
    initLayoutScheme();
  });
};

const handleSetCurrent = () => {
  const { id = '' } = props.componentObject;
  actions.setActive(id);
};

const emitMoving = () => {
  isMove.value = true;
  emit('move');
};

const emitMoveEnd = () => {
  isMove.value = false;
  emit('move-end');
};

const up = () => {
  y.value = y.value - state.valve;
  if (y.value <= 0) y.value = 0;
  debounceUpdateComponent();
};

const down = () => {
  const boardHeight = state.page.height || 500;
  y.value = y.value + state.valve;
  if ((y.value + height.value) >= boardHeight) {
    y.value = boardHeight - height.value;
  }
  debounceUpdateComponent();
};

const left = () => {
  x.value = x.value - state.valve;
  if (x.value <= 0) x.value = 0;
  debounceUpdateComponent();
};

const right = () => {
  const boardWidth = state.page.width || 500;
  x.value = x.value + state.valve;
  if ((x.value + width.value) >= boardWidth) {
    x.value = boardWidth - width.value;
  }
  debounceUpdateComponent();
};

const lineChecker = () => {
  const liner = () => {
    const roundX = Math.round(x.value);
    const roundY = Math.round(y.value);
    const result = { left: 0, top: 0 };
    state.storeList.forEach((item) => {
      const itemLeft = Math.round(item.position.clientX);
      const itemTop = Math.round(item.position.clientY);
      if (props.aimId !== item.id) {
        if (roundX === itemLeft) result.left = itemLeft;
        if (roundY === itemTop) result.top = itemTop;
      }
    });
    return result;
  };
  const line = liner();
  actions.setLine(line);
};

const handleMouseMove = (e) => {
  isMove.value = true;
  const canvas = document.querySelector('.drag-canvas-warp.board-canvas');
  if (!canvas) return;
  const canvasRect = canvas.getBoundingClientRect();

  const mouseCanvasX = e.clientX - canvasRect.left;
  const mouseCanvasY = e.clientY - canvasRect.top;

  const newX = mouseCanvasX - downX.value;
  const newY = mouseCanvasY - downY.value;

  const boardWidth = state.page.width || 500;
  const boardHeight = state.page.height || 500;

  if (newX <= 0) {
    x.value = 0;
  } else if ((width.value + newX) >= boardWidth) {
    x.value = boardWidth - width.value;
  } else {
    x.value = newX;
  }

  if (newY <= 0) {
    y.value = 0;
  } else if ((height.value + newY) >= boardHeight) {
    y.value = boardHeight - height.value;
  } else {
    y.value = newY;
  }

  emitMoving();
  lineChecker();
  debounceUpdateComponent();
};

const handleMouseUp = () => {
  emitMoveEnd();
  off(document, 'mousemove', handleMouseMove);
  off(document, 'mouseup', handleMouseUp);
};

const handleMouseDown = (e) => {
  actions.clearSelection();
  const canvas = document.querySelector('.drag-canvas-warp.board-canvas');
  if (!canvas) return;
  const canvasRect = canvas.getBoundingClientRect();

  const mouseCanvasX = e.clientX - canvasRect.left;
  const mouseCanvasY = e.clientY - canvasRect.top;

  downX.value = mouseCanvasX - x.value;
  downY.value = mouseCanvasY - y.value;

  on(document, 'mousemove', handleMouseMove);
  on(document, 'mouseup', handleMouseUp);
  handleSetCurrent();
};

const handleResizeMove = (e) => {
  const { clientX, clientY } = e;
  const defaultW = defaultWidth.value;
  const defaultH = defaultHeight.value;
  const downW = downWidth.value;
  const downH = downHeight.value;
  
  const moveX = clientX - resizeDownX.value;
  const moveY = clientY - resizeDownY.value;
  
  const offsetR = resizeOffsetRight.value;
  const offsetB = resizeOffsetBottom.value;
  const newWidth = downW + moveX;
  const newHeight = downH + moveY;
  const heightLimit = newHeight <= defaultH;
  const widthLimit = newWidth <= defaultW;
  const xEdge = moveX >= offsetR;
  const yEdge = moveY >= offsetB;

  if (!resizeDisabledX.value) {
    if (widthLimit) {
      width.value = defaultW;
    } else if (xEdge) {
      width.value = downW + offsetR;
    } else {
      width.value = newWidth;
    }
  }
  if (!resizeDisabledY.value) {
    if (heightLimit) {
      height.value = defaultH;
    } else if (yEdge) {
      height.value = downH + offsetB;
    } else {
      height.value = newHeight;
    }
  }
  debounceUpdateComponent();
};

const handleResizeUp = () => {
  off(document, 'mousemove', handleResizeMove);
  off(document, 'mouseup', handleResizeUp);
  emit('resize-end');
};

const handleResizeDown = (e) => {
  const w = width.value || 20;
  const h = height.value || 20;
  const boardWidth = state.page.width || 500;
  const boardHeight = state.page.height || 500;
  resizeOffsetRight.value = boardWidth - x.value - w;
  resizeOffsetBottom.value = boardHeight - y.value - h;
  resizeDownX.value = e.clientX;
  resizeDownY.value = e.clientY;
  downWidth.value = w;
  downHeight.value = h;
  on(document, 'mousemove', handleResizeMove);
  on(document, 'mouseup', handleResizeUp);
  e.stopPropagation();
};

const handleContextMenu = () => {
  clearAllListener();
};

const clearAllListener = () => {
  off(document, 'mousemove', handleResizeMove);
  off(document, 'mouseup', handleResizeUp);
  off(document, 'mousemove', handleMouseMove);
  off(document, 'mouseup', handleMouseUp);
};

onMounted(() => {
  init();
});

onUnmounted(() => {
  clearAllListener();
});

defineExpose({
  init,
  up,
  down,
  left,
  right,
  aimId: props.aimId
});
</script>

<template>
  <div
    ref="dragRef"
    :id="aimId"
    class="drag-warp"
    :class="activeClass"
    :style="dragStyle"
    @mousedown.stop="handleSetCurrent(); handleMouseDown($event)"
    @click.stop="handleSetCurrent()"
    @contextmenu="handleContextMenu"
  >
    <component
      :is="componentsList[componentObject.type]"
      v-bind="componentObject.props"
      :is-active="isActive"
      :element-id="componentObject.id"
      :update-id="componentObject.updateId"
      @complete="init"
    />
    <DragResize
      v-if="resizeVisible"
      :component-object="componentObject"
      @resize-down="handleResizeDown"
    />
  </div>
</template>

<style lang="scss">
.drag-warp {
  position: absolute;
  cursor: pointer;
  border: 1px solid transparent;
  color: #000;
  border-radius: 2px;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  &.is-active {
    border: 1px solid #0052d9;
    background-color: rgba(0, 82, 217, 0.05);
  }
  &.is-move {
    border-color: transparent;
  }
  .resize-btn {
    position: absolute;
    right: -1px;
    bottom: -3px;
    font-size: 12px;
    transform: scale(.6);
    color: #0052d9;
  }
  &:hover {
    background-color: rgba(0, 82, 217, 0.08);
  }
  &.line-ui {
    border: none;
    .line-resize {
      position: absolute;
      height: 100%;
      width: 10px;
      right: 0;
      top: 0;
      background-color: #0052d9;
    }
  }
}
</style>
