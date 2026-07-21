<script setup>
import { ref } from 'vue';
import { actions } from '../store/designerState.js';

const props = defineProps({
  variables: {
    type: Array,
    default() {
      return [];
    }
  }
});

const menu = ref(['variable_fields', 'elements']);

// List of design components
const drawingElements = [
  { id: 'customText', title: '自定义文本', icon: 'font-size' },
  { id: 'barcode', title: '条形码', icon: 'barcode' },
  { id: 'qrCode', title: '二维码', icon: 'qrcode' },
  { id: 'xLine', title: '横线', icon: 'minus' },
  { id: 'yLine', title: '竖线', icon: 'border-left' },
  { id: 'rectangle', title: '矩形', icon: 'border-outer' },
  { id: 'table', title: '表格/列表', icon: 'table' }
];

const handleDragStartElement = (e, componentId) => {
  e.dataTransfer.setData('componentId', componentId);
  e.dataTransfer.effectAllowed = 'copy';
};

const handleDragStartVariable = (e, variable) => {
  e.dataTransfer.setData('componentId', 'customText');
  e.dataTransfer.setData('variableKey', variable.key);
  e.dataTransfer.setData('variableLabel', variable.label);
  e.dataTransfer.effectAllowed = 'copy';
};
</script>

<template>
  <div class="left-menu">
    <t-collapse v-model="menu" expand-on-row-click>
      <!-- Variable Fields Section -->
      <t-collapse-panel value="variable_fields" header="动态变量字段">
        <div class="component-list">
          <div
            v-for="item in variables"
            :key="item.key"
            class="item variable-item"
            draggable="true"
            @dragstart="handleDragStartVariable($event, item)"
          >
            <span class="name">{{ item.label }}</span>
            <span class="key-tag">{{ item.key }}</span>
          </div>
          <div v-if="!variables.length" class="empty-tip">
            暂无可用字段，请从外部传入 variables。
          </div>
        </div>
      </t-collapse-panel>

      <!-- Draw Components Section -->
      <t-collapse-panel value="elements" header="基础绘图物料">
        <div class="component-list">
          <div
            v-for="tag in drawingElements"
            :key="tag.id"
            class="item"
            draggable="true"
            @dragstart="handleDragStartElement($event, tag.id)"
          >
            <span class="name">{{ tag.title }}</span>
            <span class="icon-wrap">
              <t-icon :name="tag.icon" size="16px" style="color: #666;" />
            </span>
          </div>
        </div>
      </t-collapse-panel>
    </t-collapse>
  </div>
</template>

<style lang="scss">
.left-menu {
  width: 260px;
  flex-shrink: 0;
  background-color: white;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.08);
  position: relative;
  z-index: 90;
  height: 100%;
  overflow-y: auto;

  .t-collapse-panel__header {
    font-weight: 600;
    font-size: 13px;
    background-color: #fafafa !important;
  }
  .t-collapse-panel__content {
    padding: 0 !important;
  }

  .component-list {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .empty-tip {
      color: #999;
      font-size: 12px;
      text-align: center;
      padding: 15px 0;
    }

    .item {
      cursor: pointer;
      padding: 10px 12px;
      border: 1px solid #e7e7e7;
      border-radius: 4px;
      color: #333;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      background-color: #fff;
      user-select: none;
      
      &:hover {
        color: #0052d9;
        border-color: #0052d9;
        background-color: rgba(0, 82, 217, 0.02);
        box-shadow: 0 2px 4px rgba(0, 82, 217, 0.08);
      }
      
      .key-tag {
        font-size: 11px;
        background-color: #f3f3f3;
        color: #666;
        padding: 2px 6px;
        border-radius: 2px;
        font-family: monospace;
      }
    }
    
    .variable-item {
      border-left: 3px solid #0052d9;
    }
  }
}
</style>
