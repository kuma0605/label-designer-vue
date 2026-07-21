# 矢量商品标签设计器组件 (Vue 3 + TDesign + JSX)

这是一个基于 Vue 3 + Vite + TDesign Vue Next + JSX 重构的高性能、低耦合商品标签设计器组件。它从 Vue 2 + Element UI 的旧标签系统（[manifest-design](https://github.com/SXX19950910/manifest-design)）重写而来，设计成了一个**纯自闭环**的可复用组件，可以非常便捷地整体复制并移植到您的资产管理或其他宿主系统中。

---

## 核心特性

1. **绝对定位矢量排版 (HTML-DOM 方案)**：直接使用 CSS 样式排版，而非 canvas 或图片。在热敏标签打印机上能保证文字、线条、条形码和二维码完全是**矢量高清晰度渲染**，打印无毛边、不模糊。
2. **动态变量数据解析**：支持接收外部传入的动态资产属性字段（如资产编号、资产名称、规格型号等），支持 `${asset_num}` 的占位符正则解析，实现设计模板与真实资产数据的动态绑定渲染。
3. **高复用自闭环架构**：设计器内部状态（包含组件树、纸张尺寸、选框状态）均由组件包内的响应式闭环 Store（`designerState.js`）管理，**不依赖 Pinia / Vuex / Vue-Router**。移植时只需复制整个文件夹即可开箱即用。
4. **精细交互与磁吸辅助线**：
   - 拖拽与八方向拉伸无级缩放。
   - 键盘方向键微调元素位置（1px 级微调），退格键（Backspace）与删除键（Delete）快捷删除。
   - 拖拽边界溢出控制，对齐时自动吸附并绘制虚线辅助指导线。
   - 支持画布空白处点击反选与框选多选。
5. **条码与二维码响应式重绘**：条形码（基于 `jsbarcode`）与二维码（基于 `qrcode`）在各自物料组件内利用 Composition API 精确监听属性改变并实现响应式局部的重绘渲染，性能极高。
6. **无损矢量页面打印**：内置直接调用浏览器打印的矢量提取逻辑。通过提取画布 DOM 树，自动清除辅助线、拉伸句柄、选中框等编辑节点，输出最干净的绝对定位结构给打印机进行高清晰度热敏打印。

---

## 技术栈与主要依赖

- **框架核心**：Vue 3 (Composition API) + `@vitejs/plugin-vue-jsx` (JSX 渲染引擎)
- **UI 组件库**：TDesign Vue Next (腾讯开源 Vue 3 组件库)
- **编译工具**：Vite + Sass
- **外部依赖**：
  - `jsbarcode` (条码矢量图渲染)
  - `qrcode` (二维码图片渲染)
  - `html2canvas` (支持导出为 PNG 图片)
  - `throttle-debounce` & `lodash` (交互防抖与数据深度克隆)

---

## 快速开发与预览

### 1. 安装项目依赖
```bash
npm install
```

### 2. 启动本地开发与联调服务
```bash
npm run dev
```
启动后可在浏览器中直接打开 `http://localhost:5180/` 进行交互设计、属性调整、拖拽定位、及打印效果预览。

### 3. 项目生产构建
```bash
npm run build
```

---

## 项目结构指引

所有与设计器核心功能相关的代码均收拢在 `src/components/LabelDesigner/` 目录下：

```text
src/components/LabelDesigner/
├── index.vue                  # 设计器主要入口 (承载 v-model 数据流与布局)
├── store/
│   └── designerState.js       # 响应式自闭环状态管理 (添加/删除/对齐/纸张设置等 Action)
├── core/
│   └── DesignPreview.jsx      # Vue 3 JSX 矢量预览树渲染引擎
├── elements/                  # 基础绘图物料渲染组件
│   ├── index.js               # 统一物料组件导出
│   ├── TextUi.vue             # 自定义文本 / 动态变量解析物料
│   ├── BarcodeUi.vue          # 条形码矢量图物料
│   ├── QrCodeUi.vue           # 二维码图片渲染物料
│   ├── XLineUi.vue            # 横向辅助线物料
│   ├── YLineUi.vue            # 纵向辅助线物料
│   ├── RectangleUi.vue        # 矩形边框物料
│   └── TableUi.vue            # 表格/列表物料
├── components/                # 交互外壳组件
│   ├── DragCanvas.vue         # 拖动绘图板画布 (处理 HTML5 拖放接收与辅助线对齐)
│   ├── Drag.vue               # 拖拽包裹壳 (处理鼠标/键盘位移与阻尼控制)
│   └── DragResize.vue         # 无级拉伸句柄
└── layout/                    # 功能性布局面板
    ├── HeaderNav.vue          # 顶部控制栏 (保存模板、保存图片、打印)
    ├── LeftMenu.vue           # 左侧物料箱 (动态资产属性卡片 + 绘图基本图形)
    └── RightMenu.vue          # 右侧 TDesign 重构属性表单控制器 (统一属性面板)
```

---

## 如何将设计器移植进您的宿主项目？

当您需要在您已有的 Vue 3 + TDesign JSX 项目（例如 `assets-manage-vue3-tdesign-jsx`）中启用此商品标签设计器时，只需跟随以下 3 个步骤：

### 第一步：复制组件和工具代码
1. 将本项目中的 `src/components/LabelDesigner` 文件夹整体复制到您宿主项目的 `src/components/` 目录下。
2. 将本项目中的 `src/utils/` 目录下的 `dom.js`、`index.js`、`update.js` 三个工具类代码复制或合并进您宿主项目对应的工具函数包中。

### 第二步：安装必要运行依赖
在您的目标项目根目录下执行安装支持包：
```bash
npm install jsbarcode qrcode html2canvas throttle-debounce lodash
```

### 第三步：直接挂载与双向数据流绑定
在您宿主的标签设置页面（如 `LabelSettings.vue`）中直接挂载使用即可。它支持标准的 `v-model` 双向数据更新：

```vue
<script setup lang="jsx">
import LabelDesigner from '@/components/LabelDesigner/index.vue';
import { ref } from 'vue';

// 1. 定义您希望暴露给标签的可绑定动态资产变量（由左侧栏拖入）
const variables = ref([
  { key: 'asset_num', label: '资产编号' },
  { key: 'asset_name', label: '资产名称' },
  { key: 'specification', label: '规格型号' },
  { key: 'use_dept', label: '使用部门' },
  { key: 'storage_place', label: '存放地点' }
]);

// 2. 绑定的双向模板数据 (可从您的后端数据库 API 中获取 JSON 字符串反序列化填入)
const templateData = ref({
  name: "资产商品默认标签",
  width: 500,  // 画布宽度 (等比映射 mm)
  height: 350, // 画布高度
  data: []     // 设计树元素列表 (JSON Array)
});

// 3. 点击顶部“保存模板”时的回调事件
const onSaveTemplate = (newTemplate) => {
  console.log('最新的商品标签模板 JSON 树:', newTemplate);
  // 可直接将 newTemplate 序列化存入后端数据库
};
</script>

<template>
  <div style="width: 100vw; height: 100vh; overflow: hidden;">
    <LabelDesigner 
      v-model="templateData" 
      :variables="variables" 
      @save="onSaveTemplate" 
    />
  </div>
</template>
```
