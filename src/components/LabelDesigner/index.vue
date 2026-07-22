<script setup>
import { onMounted, onUnmounted, watch, ref } from 'vue';
import HeaderNav from './layout/HeaderNav.vue';
import LeftMenu from './layout/LeftMenu.vue';
import RightMenu from './layout/RightMenu.vue';
import Board from './layout/Board.vue';
import { state, actions } from './store/designerState.js';
import { on, off } from '@/utils/dom.js';
import { printLabelJobs } from '@/utils/printService.js';
import { SAMPLE_PRINT_VARIABLES } from '@/utils/templateStore.js';
import { MessagePlugin } from 'tdesign-vue-next';

const props = defineProps({
  modelValue: {
    type: Object,
    default() {
      return {
        name: '',
        width: 250,
        height: 175,
        data: []
      };
    }
  },
  variables: {
    type: Array,
    default() {
      return [
        { key: 'asset_num', label: '资产编号' },
        { key: 'asset_name', label: '资产名称' },
        { key: 'barcode_code', label: '条形码编码' },
        { key: 'qr_code', label: '二维码数据/链接' },
        { key: 'serial_no', label: '序列号 SN' },
        { key: 'specification', label: '规格型号' },
        { key: 'use_dept', label: '使用部门' },
        { key: 'storage_place', label: '存放地点' }
      ];
    }
  }
});

const emit = defineEmits(['update:modelValue', 'save', 'print']);

// 防止 modelValue ↔ storeList 双向 watch 互相震荡的标志位
const _isSyncingFromParent = ref(false);
const printing = ref(false);

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

const handlePrint = async (template) => {
  emit('print', template);
  if (printing.value) return;

  printing.value = true;
  try {
    const tpl = {
      id: props.modelValue?.id,
      name: props.modelValue?.name || '标签模板',
      width: state.page.width,
      height: state.page.height,
      data: state.storeList
    };
    await printLabelJobs([{ template: tpl, variables: SAMPLE_PRINT_VARIABLES }]);
    MessagePlugin.success('已打开打印对话框（使用示例数据预览，正式打印请走设备打印页）');
  } catch (e) {
    if (e?.code === 'POPUP_BLOCKED') {
      MessagePlugin.warning('打印窗口被浏览器拦截，请允许本站点弹窗后重试');
    } else {
      console.error(e);
      MessagePlugin.error('打印失败，请查看控制台');
    }
  } finally {
    printing.value = false;
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
