<script setup>
import { onMounted, onUnmounted, watch, ref } from 'vue';
import HeaderNav from './layout/HeaderNav.vue';
import LeftMenu from './layout/LeftMenu.vue';
import RightMenu from './layout/RightMenu.vue';
import Board from './layout/Board.vue';
import { state, actions } from './store/designerState.js';
import { on, off } from '@/utils/dom.js';

const props = defineProps({
  modelValue: {
    type: Object,
    default() {
      return {
        name: '',
        width: 500,
        height: 500,
        data: []
      };
    }
  },
  variables: {
    type: Array,
    default() {
      return [];
    }
  }
});

const emit = defineEmits(['update:modelValue', 'save', 'print']);

// 防止 modelValue ↔ storeList 双向 watch 互相震荡的标志位
const _isSyncingFromParent = ref(false);

// Watch modelValue from parent → 加载到内部 store
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) return;
    // 仅当外部数据与内部 store 不一致时才重新加载，避免内部更新回写时再触发
    if (newVal.data && JSON.stringify(newVal.data) !== JSON.stringify(state.storeList)) {
      _isSyncingFromParent.value = true;
      actions.updateStoreList(newVal.data);
      if (newVal.width && newVal.height) {
        actions.setPageSize(newVal.width, newVal.height);
      }
      // 下一个微任务后解除标志，让内部操作恢复正常同步
      Promise.resolve().then(() => { _isSyncingFromParent.value = false; });
    } else if (newVal.width && newVal.height) {
      actions.setPageSize(newVal.width, newVal.height);
    }
  },
  { deep: false, immediate: true }
);

// Watch storeList inside local store → 同步回父组件 v-model
// 用标志位保护：当正在从父组件同步进来时，不向上 emit，避免震荡
watch(
  () => [state.storeList, state.page],
  () => {
    if (_isSyncingFromParent.value) return;
    emit('update:modelValue', {
      id: props.modelValue?.id,
      name: props.modelValue?.name || '标签模板',
      width: state.page.width,
      height: state.page.height,
      data: state.storeList
    });
  },
  { deep: true }
);

const handleSave = (template) => {
  emit('save', template);
};

const handlePrint = (template) => {
  emit('print', template);
  
  // Standard simple print: open a new window and call print on the DesignPreview
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write('<html><head><title>打印标签</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { margin: 0; padding: 0; background-color: white; font-family: sans-serif; }
      .template-wrap { box-sizing: border-box; overflow: hidden; position: relative; width: ${state.page.width}px; height: ${state.page.height}px; }
      .component { position: absolute; box-sizing: border-box; }
      .barcode-wrap { display: flex; align-items: center; flex-direction: column; justify-content: center; width: 100%; height: 100%; }
      .barcode { max-width: 100%; }
      .barcode-text { font-size: 12px; font-weight: normal; text-align: center; margin: 2px 0 0 0; }
      .qr-code-wrap { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
      .qr-code { max-width: 100%; max-height: 100%; }
      .x-line-wrap { width: 100%; box-sizing: border-box; }
      .y-line-wrap { box-sizing: border-box; height: 100%; }
      .rectangle-wrap { box-sizing: border-box; }
      .table-wrap { width: 100%; border-collapse: collapse; }
      .table-wrap th, .table-wrap td { border: 1px solid black; padding: 5px; text-align: left; }
    `);
    printWindow.document.write('</style></head><body>');
    
    // Renders the HTML of the designed canvas. 
    // Let's get the innerHTML of .drag-canvas-warp.board-canvas to print it directly
    const boardCanvas = document.querySelector('.drag-canvas-warp.board-canvas');
    if (boardCanvas) {
      // Clone it to remove handles, bounds, guide lines
      const clone = boardCanvas.cloneNode(true);
      // Remove help lines
      clone.querySelectorAll('.x-help-line, .y-help-line, .resize-area').forEach(el => el.remove());
      // For each element inside the cloned DOM, remove resize indicators or selection classes
      clone.querySelectorAll('.drag-warp').forEach(el => {
        el.className = 'component'; // simplify class to component
        el.style.backgroundColor = 'transparent';
        el.style.border = 'none';
      });
      printWindow.document.write(`<div class="template-wrap" style="width:${state.page.width}px; height:${state.page.height}px; position: relative;">${clone.innerHTML}</div>`);
    }
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }
};

const handleCancelCurrent = (e) => {
  // 只响应在画布背景区（view-wrapper）上的点击，不影响功能面板区域
  // 如果点击发生在 .drag-warp 组件本身上，由 Drag.vue 的 @click.stop 拦截，不会冒泡至此
  const target = e.target;

  // 右侧属性面板内部点击，不反选
  const rightMenu = document.querySelector('.right-menu');
  if (rightMenu && rightMenu.contains(target)) return;

  // 左侧物料栏内部点击，不反选
  const leftMenu = document.querySelector('.left-menu');
  if (leftMenu && leftMenu.contains(target)) return;

  // 顶部导航栏内部点击，不反选
  const headerNav = document.querySelector('.header-nav-warp');
  if (headerNav && headerNav.contains(target)) return;

  // 只有点击在画布背景或画布容器本身时才取消选中
  const viewWrapper = document.querySelector('.view-wrapper');
  const canvasWrapper = document.querySelector('.drag-canvas-warp.board-canvas');
  if (
    (viewWrapper && viewWrapper === target) ||
    (canvasWrapper && canvasWrapper === target)
  ) {
    actions.setActive('');
    actions.clearSelection();
  }
};

onMounted(() => {
  on(document, 'click', handleCancelCurrent);
});

onUnmounted(() => {
  actions.clearStoreList();
  off(document, 'click', handleCancelCurrent);
});
</script>

<template>
  <div class="label-designer-main-container">
    <HeaderNav :model-value="props.modelValue" @save="handleSave" @print="handlePrint" />
    <div class="designer-body">
      <LeftMenu :variables="variables" />
      <Board />
      <RightMenu />
    </div>
  </div>
</template>

<style lang="scss">
.label-designer-main-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  box-sizing: border-box;

  .designer-body {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    height: calc(100% - 48px);
    overflow: hidden;
    position: relative;
    box-sizing: border-box;
  }
}
</style>
