<script setup>
import { ref } from 'vue';
import DevicePrintPage from './views/DevicePrintPage.vue';
import TemplateManagePage from './views/TemplateManagePage.vue';

const currentView = ref('device-print');
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航 -->
    <div class="global-nav">
      <div class="nav-title">
        <t-icon name="bulletpoint" size="20px" style="color: #0052d9;" />
        <span>商品标签设计器 v3</span>
      </div>
      <div class="nav-tabs">
        <div
          class="nav-tab"
          :class="{ active: currentView === 'device-print' }"
          @click="currentView = 'device-print'"
        >
          <t-icon name="printer" size="16px" />
          <span>设备标签打印</span>
        </div>
        <div
          class="nav-tab"
          :class="{ active: currentView === 'template-manage' }"
          @click="currentView = 'template-manage'"
        >
          <t-icon name="dashboard" size="16px" />
          <span>模板管理</span>
        </div>
      </div>
    </div>

    <!-- 页面内容 -->
    <div class="app-content">
      <DevicePrintPage v-if="currentView === 'device-print'" />
      <TemplateManagePage v-if="currentView === 'template-manage'" />
    </div>
  </div>
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}

.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.global-nav {
  height: 52px;
  background-color: white;
  border-bottom: 1px solid #e7e7e7;
  display: flex;
  align-items: center;
  padding: 0 24px;
  z-index: 100;
  flex-shrink: 0;

  .nav-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-right: 40px;
  }

  .nav-tabs {
    display: flex;
    gap: 4px;
    height: 100%;
  }

  .nav-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    height: 100%;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;

    &:hover {
      color: #0052d9;
      background-color: #f0f6ff;
    }

    &.active {
      color: #0052d9;
      border-bottom-color: #0052d9;
      font-weight: 500;
    }
  }
}

.app-content {
  flex: 1;
  overflow: hidden;
}
</style>
