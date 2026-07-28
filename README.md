# 矢量商品标签设计器组件 (Vue 3 + TDesign + JSX)

基于 Vue 3 + Vite + TDesign Vue Next + JSX 的商品标签设计器，做成**可复用、自闭环**组件，便于整体复制到资产管理系统等宿主项目。早期排版思路参考过 [manifest-design](https://github.com/SXX19950910/manifest-design)，当前实现与功能已大幅演进。

Demo 含两页：**模板管理**（设计/保存）与 **设备打印**（选设备 → 预览填数 → 浏览器或 QZ Tray 打印）。

---

## 核心特性

1. **绝对定位矢量排版 (HTML-DOM)**：用 CSS 绝对定位排版，热敏打印时文字、线条、条码/二维码清晰、不易发糊。
2. **动态变量绑定**：支持 `${asset_num}` 等占位符，模板与真实资产数据分离；预览/打印时注入 `variables` 替换。详见 [`docs/05_template-variables-and-device-print.md`](docs/05_template-variables-and-device-print.md)。
3. **自闭环状态**：画布、物料树、选中态由 `designerState.js` 管理，**不依赖 Pinia / Vuex / Vue Router**。
4. **精细交互**：拖拽、八向缩放、方向键微调、Delete/Backspace 删除、磁吸辅助线、框选多选。
5. **条码 / 二维码**：`jsbarcode`、`qrcode`，属性变更时局部重绘。
6. **三通道打印**（设备打印页可选）：
   - **浏览器**（`browser`）：`DesignPreview` 渲染后 `window.print`（验版）。
   - **QZ HTML**（`qz-html`，默认推荐译维 A42）：完整 HTML → QZ `format: 'html'` → Windows 驱动。
   - **QZ 位图**（`qz-image`）：同一预览经 `html2canvas`（scale 3）转 PNG → QZ `format: 'image'`。

尺寸约定：**1mm = 5px**（例如 50×35mm 标签画布为 `250 × 175`）。热敏机纸张 / 裁切 / 字重等实践见 [`docs/04_yiwei-a42-qz-tray-bitmap-print-guide.md`](docs/04_yiwei-a42-qz-tray-bitmap-print-guide.md)（发表稿：[`docs/04_yiwei-a42-qz-tray-bitmap-print-guide.publish.md`](docs/04_yiwei-a42-qz-tray-bitmap-print-guide.publish.md)）。

---

## 技术栈与依赖

- Vue 3 (Composition API) + `@vitejs/plugin-vue-jsx`
- TDesign Vue Next
- Vite + Sass
- `jsbarcode` / `qrcode` / `html2canvas` / `lodash` / `throttle-debounce`
- `qz-tray`（连接本机 [QZ Tray](https://qz.io/)）；静默签名用 `jsrsasign`
- UI：`tdesign-vue-next` / `tdesign-icons-vue-next`

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
3. 打印方式选 **QZ Tray HTML**（推荐 A42）或 **QZ Tray 位图** → 刷新打印机 → 选择打印机 → 确认打印
4. 未配置证书时首次会弹授权框，点 **Allow**（可勾选 Remember）

无标签机时可用 **浏览器打印** 或系统 PDF 打印机验版式与尺寸。

静默打印：把 QZ Demo 的 `digital-certificate.txt` + `private-key.pem` 放到 [`public/certs/`](public/certs/README.md)，前端会自动签名，不再弹窗。证书与私钥已在 `.gitignore` 中忽略，**勿提交公开仓库**。换电脑时网站证书不变，另一台用 QZ **Site Manager → Browse** 导入同一份信任证书即可。

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

设计器面板依赖 **TDesign**，预览树是 **JSX**（`DesignPreview.jsx`），宿主需已用 Vue 3，并具备 `@` → `src` 别名。顶栏「打印预览」会调用 `printService`，因此打印相关 utils **不是可选附件**。

### 1. 复制代码

保留目录名，复制到宿主对应路径：

| 来源 | 说明 |
| :--- | :--- |
| `src/components/LabelDesigner/` | 设计器整包（勿拆散） |
| `src/utils/dom.js` | DOM 事件 |
| `src/utils/index.js` | 辅助线等 |
| `src/utils/update.js` | 元素更新 |
| `src/utils/preview.js` | 条码 / 二维码 DataURL |
| `src/utils/templateStore.js` | `normalizeElement`、示例打印变量等（设计器必用） |
| `src/utils/printService.js` | 渲染 + browser / qz-html / qz-image |
| `src/utils/qzClient.js` | QZ 连接与证书钩子 |
| `src/mock/defaultTemplates.json` | `templateStore` 的种子 import；宿主若改用纯 API，需改掉该 import 或保留占位 JSON |

静默打印时再按 [`public/certs/README.md`](public/certs/README.md) 配置证书（勿把私钥提交仓库）。

### 2. 安装依赖

运行时：

```bash
npm install tdesign-vue-next tdesign-icons-vue-next \
  jsbarcode qrcode html2canvas throttle-debounce lodash \
  qz-tray jsrsasign
```

构建侧（若宿主尚未具备）：

- Vite：`@vitejs/plugin-vue` + `@vitejs/plugin-vue-jsx`（必须能编译 `.jsx`）
- `sass`（组件内 `lang="scss"`）

入口注册 TDesign（与本仓库 `main.js` 类似）：

```js
import { createApp } from 'vue'
import TDesign from 'tdesign-vue-next'
import 'tdesign-vue-next/es/style/index.css'
import App from './App.vue'

createApp(App).use(TDesign).mount('#app')
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
  { key: 'serial_no', label: '序列号 SN' },
  { key: 'specification', label: '规格型号' },
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
  // 若沿用本仓库种子升级逻辑，持久化时请保留 seedVersion
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

### 4. 宿主侧打印

```js
import { printLabelJobs } from '@/utils/printService.js';

// 浏览器验版
await printLabelJobs([{ template, variables: device }], { adapter: 'browser' });

// QZ HTML（推荐 A42）/ 位图 → 指定打印机
await printLabelJobs([{ template, variables: device }], {
  adapter: 'qz-html', // 或 'qz-image'；'qz' 与 'qz-html' 等价
  printer: 'Your_Printer_Name'
});
```

正式环境模板 / 设备数据应由后台 API 提供；本仓库 demo 用 `localStorage` + `src/mock/defaultTemplates.json` 模拟。

变量注入与设备页流程见 [`docs/05_template-variables-and-device-print.md`](docs/05_template-variables-and-device-print.md)；热敏机纸张与 QZ 踩坑见 [`docs/04_yiwei-a42-qz-tray-bitmap-print-guide.md`](docs/04_yiwei-a42-qz-tray-bitmap-print-guide.md)。
