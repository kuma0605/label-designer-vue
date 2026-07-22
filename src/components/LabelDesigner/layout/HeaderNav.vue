<script setup>
import { actions, state } from '../store/designerState.js';
import html2canvas from 'html2canvas';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';

const props = defineProps({
  modelValue: {
    type: Object,
    default() {
      return {};
    }
  }
});

const emit = defineEmits(['save', 'print']);

const handleClearCanvas = () => {
  const confirmDialog = DialogPlugin.confirm({
    header: '提示',
    body: '确定要清空当前画板上的所有元素吗？此操作不可逆。',
    theme: 'warning',
    onConfirm: () => {
      actions.clearStoreList();
      confirmDialog.destroy();
    }
  });
};

const handleSave = () => {
  const template = {
    id: props.modelValue?.id,
    name: props.modelValue?.name || '标签模板',
    width: state.page.width,
    height: state.page.height,
    data: JSON.parse(JSON.stringify(state.storeList))
  };
  emit('save', template);
  MessagePlugin.success('保存成功！');
};

const handleSaveToImg = async () => {
  const $el = document.querySelector('.drag-canvas-warp.board-canvas');
  if (!$el) return;
  
  try {
    const canvas = await html2canvas($el, {
      allowTaint: true,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: $el.offsetWidth,
      height: $el.offsetHeight,
      dpi: window.devicePixelRatio * 2,
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `标签设计模板_${new Date().getTime()}.png`;
    a.click();
    MessagePlugin.success('保存图片成功！');
  } catch (e) {
    console.error(e);
    MessagePlugin.error('图片保存失败，请检查控制台错误。');
  }
};

const handlePrint = () => {
  emit('print', {
    width: state.page.width,
    height: state.page.height,
    data: state.storeList
  });
};
</script>

<template>
  <div class="header-nav-warp">
    <div class="logo-area">
      标签设计器 <span class="version-tag">Vue3 v1.0</span>
      <div class="zoom-selector-wrapper" style="display: flex; align-items: center; gap: 8px; margin-left: 24px; font-weight: normal;">
        <span style="font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px;">
          <t-icon name="zoom-in" size="14px" />
          缩放比例:
        </span>
        <t-select v-model="state.zoom" style="width: 150px;" size="small">
          <t-option :value="0.378" label="1:1 实物比例 (100%)" />
          <t-option :value="0.5" label="1.3x 放大 (130%)" />
          <t-option :value="0.75" label="2.0x 放大 (200%)" />
          <t-option :value="1.0" label="2.6x 特写 (260%)" />
        </t-select>
      </div>
    </div>
    
    <div class="handle-area">
      <t-button variant="text" theme="primary" @click="handleSave">
        <template #icon><t-icon name="save" /></template>
        保存模板
      </t-button>
      
      <t-button variant="text" theme="primary" @click="handleSaveToImg">
        <template #icon><t-icon name="image" /></template>
        保存为图片
      </t-button>
      
      <t-button variant="text" theme="primary" @click="handlePrint">
        <template #icon><t-icon name="print" /></template>
        打印标签
      </t-button>
      
      <t-button variant="text" theme="danger" @click="handleClearCanvas">
        <template #icon><t-icon name="delete" /></template>
        清空画布
      </t-button>
    </div>
  </div>
</template>

<style lang="scss">
.header-nav-warp {
  width: 100%;
  height: 48px;
  background-color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 21, 41, 0.06);
  position: relative;
  justify-content: space-between;
  z-index: 100;
  border-bottom: 1px solid #e7e7e7;
  box-sizing: border-box;

  .logo-area {
    color: #0052d9;
    font-weight: bold;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    
    .version-tag {
      font-size: 10px;
      background-color: rgba(0, 82, 217, 0.1);
      color: #0052d9;
      padding: 1px 6px;
      border-radius: 10px;
      font-weight: normal;
    }
  }

  .handle-area {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}
</style>
