<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import DragCanvas from '../components/DragCanvas.vue';
import { on, off } from '@/utils/dom.js';
import { state, actions } from '../store/designerState.js';
import { debounce } from 'throttle-debounce';
import _ from 'lodash';

const viewRef = ref(null);
const reactRef = ref(null);
const canvasRef = ref(null);

const reactVisible = ref(false);
const reactStyleObj = ref({ width: 0, height: 0, left: 0, top: 0 });

const leftRect = ref({});
const topRect = ref({});
const downX = ref(0);
const downY = ref(0);
const leftTapKey = ref(1);

const viewStyle = computed(() => {
  return {
    width: `${state.page.width}px`,
    height: `${state.page.height}px`
  };
});

const reactStyle = computed(() => {
  return {
    top: `${reactStyleObj.value.top}px`,
    left: `${reactStyleObj.value.left}px`,
    width: `${reactStyleObj.value.width}px`,
    height: `${reactStyleObj.value.height}px`
  };
});

const onViewScroll = () => {
  canvasRef.value?.onWindowResize();
};

const debounceViewScroll = debounce(300, onViewScroll);

const initDraw = (event) => {
  const leftMenu = document.querySelector('.left-menu');
  const navWarp = document.querySelector('.header-nav-warp');
  
  leftRect.value = leftMenu ? leftMenu.getBoundingClientRect() : { width: 0 };
  topRect.value = navWarp ? navWarp.getBoundingClientRect() : { height: 0 };

  const clientX = event.clientX - leftRect.value.width;
  const clientY = event.clientY - topRect.value.height;
  const $view = viewRef.value;
  
  downX.value = clientX + ($view ? $view.scrollLeft : 0);
  downY.value = clientY + ($view ? $view.scrollTop : 0);
  reactVisible.value = true;
};

const handleMouseMove = (e) => {
  const $view = viewRef.value;
  const scrollLeft = $view ? $view.scrollLeft : 0;
  const scrollTop = $view ? $view.scrollTop : 0;

  const clientX = e.clientX - leftRect.value.width;
  const clientY = e.clientY - topRect.value.height;
  
  const moveX = clientX + scrollLeft - downX.value;
  const moveY = clientY + scrollTop - downY.value;
  
  const isReverseX = moveX < 0;
  const isReverseY = moveY < 0;
  
  if (isReverseX) {
    reactStyleObj.value.width = Math.abs(moveX);
    reactStyleObj.value.left = downX.value - reactStyleObj.value.width;
  } else {
    reactStyleObj.value.width = moveX;
    reactStyleObj.value.left = downX.value;
  }
  
  if (isReverseY) {
    reactStyleObj.value.height = Math.abs(moveY);
    reactStyleObj.value.top = downY.value - reactStyleObj.value.height;
  } else {
    reactStyleObj.value.height = moveY;
    reactStyleObj.value.top = downY.value;
  }
};

const resetDraw = () => {
  reactVisible.value = false;
  downX.value = 0;
  downY.value = 0;
  reactStyleObj.value = { top: 0, left: 0, width: 0, height: 0 };
};

const handleSetSelect = () => {
  const select = [];
  const wrap = reactRef.value;
  if (!wrap) return;
  const wrapRect = wrap.getBoundingClientRect();
  
  state.storeList.forEach((item) => {
    const newItem = _.cloneDeep(item);
    const rect = newItem.rect;
    if (rect) {
      const inXArea = (wrapRect.right > rect.right) && (wrapRect.left < rect.left);
      const inYArea = (wrapRect.bottom > rect.bottom) && (wrapRect.top < rect.top);
      if (inXArea && inYArea) {
        select.push(newItem);
      }
    }
  });
  actions.batchSelection(select);
};

const handleMouseUp = () => {
  handleSetSelect();
  resetDraw();
  off(document, 'mousemove', handleMouseMove);
  off(document, 'mouseup', handleMouseUp);
};

const handleMouseDown = (e) => {
  if (e.buttons !== leftTapKey.value) return;
  initDraw(e);
  on(document, 'mousemove', handleMouseMove);
  on(document, 'mouseup', handleMouseUp);
};
</script>

<template>
  <div ref="viewRef" class="board-warp" @scroll="debounceViewScroll">
    <div class="view-wrapper" @mousedown.stop="handleMouseDown">
      <div v-if="reactVisible" ref="reactRef" class="react" :style="reactStyle" />
      <div class="canvas-wrapper" :style="viewStyle">
        <DragCanvas ref="canvasRef" class="board-canvas" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.board-warp {
  position: relative;
  overflow: auto;
  flex-grow: 1;
  height: 100%;
  background-color: #e9eef3;
  .view-wrapper {
    user-select: none;
    touch-action: none;
    position: relative;
    min-width: 100%;
    min-height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    padding: 30px;
    background-image: linear-gradient(45deg,#f5f5f5 25%,rgba(0,0,0,0) 0,rgba(0,0,0,0) 75%,#f5f5f5 0),linear-gradient(45deg,#f5f5f5 25%,rgba(0,0,0,0) 0,rgba(0,0,0,0) 75%,#f5f5f5 0);
    background-size: 20px 20px;
    background-position: 0 0,10px 10px;
    .react {
      position: absolute;
      z-index: 8;
      background-color: rgba(0, 82, 217, 0.15);
      border: 1px dashed #0052d9;
      pointer-events: none;
    }
  }
  .canvas-wrapper {
    background-color: white;
    border-radius: 2px;
    box-shadow: 0 0 15px rgba(0, 21, 41, 0.08);
    position: relative;
    flex-shrink: 0;
    overflow: hidden;
  }
  .board-canvas {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
