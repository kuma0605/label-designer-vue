# 矢量商品标签设计器组件 (Vue 3 + TDesign + JSX)

基于 Vue 3 + Vite + TDesign Vue Next + JSX 重构的商品标签设计器。从 Vue 2 + Element UI 旧系统（[manifest-design](https://github.com/SXX19950910/manifest-design)）重写而来，做成**可复用、自闭环**组件，便于整体复制到资产管理系统等宿主项目。

Demo 含两页：**模板管理**（设计/保存）与 **设备打印**（选设备 → 预览填数 → 浏览器或 QZ Tray 打印）。

---

## 核心特性

1. **绝对定位矢量排版 (HTML-DOM)**：用 CSS 绝对定位排版，热敏打印时文字、线条、条码/二维码清晰、不易发糊。
2. **动态变量绑定**：支持 `${asset_num}` 等占位符，模板与真实资产数据分离；预览/打印时注入 `variables` 替换。
3. **自闭环状态**：画布、物料树、选中态由 `designerState.js` 管理，**不依赖 Pinia / Vuex / Vue Router**。
4. **精细交互**：拖拽、八向缩放、方向键微调、Delete/Backspace 删除、磁吸辅助线、框选多选。
5. **条码 / 二维码**：`jsbarcode`、`qrcode`，属性变更时局部重绘。
6. **双通道打印**：
   - **浏览器**：`DesignPreview` 渲染后 `window.print`（适合验版式）。
   - **QZ Tray**：同一预览经 `html2canvas` 转 PNG，再交给 QZ 打到指定打印机（适合标签机）。

尺寸约定：**1mm = 5px**（例如 50×35mm 标签画布为 `250 × 175`）。

---

## 技术栈与依赖

- Vue 3 (Composition API) + `@vitejs/plugin-vue-jsx`
- TDesign Vue Next
- Vite + Sass
- `jsbarcode` / `qrcode` / `html2canvas` / `lodash` / `throttle-debounce`
- `qz-tray`（连接本机 [QZ Tray](https://qz.io/)）

---

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5180/`。

```bash
npm run build
```

### 用 QZ 打标签（设备打印页）

1. 安装并启动 [QZ Tray](https://qz.io/download)
2. 打开「设备资产管理」→ 勾选设备 → 批量打印
3. 打印方式选 **QZ Tray** → 刷新打印机 → 选择打印机 → 确认打印
4. 未配置证书时首次会弹授权框，点 **Allow**（可勾选 Remember）

无标签机时可用系统 PDF 打印机验证内容与尺寸。

静默打印：把 QZ Demo 的 `digital-certificate.txt` + `private-key.pem` 放到 [`public/certs/`](public/certs/README.md)，前端会自动签名，不再弹窗。

---

## 项目结构

```text
src/
├── views/
│   ├── TemplateManagePage.vue   # 模板库 + 设计器
│   └── DevicePrintPage.vue      # 设备列表 + 打印预览 / QZ
├── mock/
│   └── defaultTemplates.json    # demo 种子模板
├── utils/
│   ├── printService.js          # 渲染标签 + browser / qz 适配器
│   ├── qzClient.js              # QZ 连接、列打印机、证书钩子
│   ├── templateStore.js         # 模板 normalize / localStorage demo 存取
│   ├── preview.js               # 预览条码/二维码生成
│   ├── dom.js / index.js / update.js
└── components/LabelDesigner/    # 可移植设计器包
    ├── index.vue
    ├── store/designerState.js
    ├── core/DesignPreview.jsx   # 带变量的预览树
    ├── elements/                # Text / Barcode / QR / Line / Rect / Table
    ├── components/              # Drag / DragCanvas / DragResize
    └── layout/                  # HeaderNav / LeftMenu / RightMenu / Board
```

---

## 移植到宿主项目

### 1. 复制代码

- `src/components/LabelDesigner/` → 宿主 `src/components/`
- `src/utils/` 中与打印/预览相关的文件按需合并：`dom.js`、`index.js`、`update.js`、`preview.js`；若宿主也要打标签，一并带上 `printService.js`、`qzClient.js`

### 2. 安装依赖

```bash
npm install jsbarcode qrcode html2canvas throttle-debounce lodash qz-tray
```

### 3. 挂载设计器

```vue
<script setup>
import { ref } from 'vue';
import LabelDesigner from '@/components/LabelDesigner/index.vue';

const variables = ref([
  { key: 'asset_num', label: '资产编号' },
  { key: 'asset_name', label: '资产名称' },
  { key: 'barcode_code', label: '条形码编码' },
  { key: 'qr_code', label: '二维码数据/链接' },
  { key: 'use_dept', label: '使用部门' },
  { key: 'storage_place', label: '存放地点' }
]);

// 画布像素：物理 mm × 5（例：50×35mm → 250×175）
const templateData = ref({
  id: 'tpl-demo',
  name: '资产默认标签',
  width: 250,
  height: 175,
  data: []
});

const onSaveTemplate = (tpl) => {
  // 持久化到后端 API
  console.log(tpl);
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

### 4. 宿主侧打印（可选）

```js
import { printLabelJobs } from '@/utils/printService.js';

// 浏览器验版
await printLabelJobs([{ template, variables: device }]);

// QZ 打到指定打印机
await printLabelJobs([{ template, variables: device }], {
  adapter: 'qz',
  printer: 'Zebra_Printer'
});
```

正式环境模板/设备数据应由后台 API 提供；本仓库 demo 用 `localStorage` + `src/mock/defaultTemplates.json` 模拟。
