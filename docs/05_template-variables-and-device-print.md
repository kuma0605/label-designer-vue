# 模板动态变量与设备打印数据注入

> 说明：设计器模板里的 `$_{key}` 占位符，如何在「设备打印」预览/打印时被设备列表数据替换。

## 1. 核心约定

| 概念 | 说明 |
|------|------|
| 模板 | 只保存排版与占位符（如 `$_{asset_num}`），不含某台设备的真实值 |
| `variables` | 一份「字段 → 值」映射；打印时通常等于**当前设备对象** |
| 替换时机 | **渲染时**替换，不改写模板 JSON |
| 匹配规则 | `$_{key}` 与 `variables[key]` **精确匹配**；无对应字段或值为空则显示 `/` |

尺寸约定仍为 **1mm = 5px**（与打印无关，见主 README）。

## 2. 数据流

```text
勾选设备列表
    │
    ▼
jobs = selectedDevices.map(device => ({
  template: 当前选中模板,
  variables: device          // 整行设备对象
}))
    │
    ▼
printLabelJobs(jobs) / 预览 DesignPreview
    │
    ▼
离屏或弹窗挂载 DesignPreview({ template, variables })
    │
    ▼
PreviewText / PreviewTable / PreviewBarcode / PreviewQrcode
    │
    ▼
replaceVars(文本, variables)   // src/utils/preview.js
    │
    ▼
已填数的 HTML → 浏览器打印 / QZ HTML / QZ 位图
```

要点：**一台设备 = 一次渲染 = 一张标签**。N 台设备循环 N 次，共用同一模板、不同 `variables`。

## 3. 关键代码位置

| 步骤 | 文件 | 说明 |
|------|------|------|
| 组任务 | `src/views/DevicePrintPage.vue` | `variables: device` |
| 预览 | 同上，`<DesignPreview :variables="device" />` | 弹窗内逐卡预览 |
| 批量渲染 | `src/utils/printService.js` → `renderLabelsToPages` | `h(DesignPreview, { template, variables })` |
| 占位符替换 | `src/utils/preview.js` → `replaceVars` / `toVariablesMap` | 支持对象或 `{ key, value }[]` |
| 文本 | `src/components/LabelDesigner/core/PreviewText.vue` | `text` / `variable.textData` |
| 表格 | `PreviewTable.vue` | **表头（列名）与单元格值**均替换 |
| 条码 / 二维码 | `PreviewBarcode.vue` / `PreviewQrcode.vue` | 对 `props.data` 先替换再生成图 |

设备打印页组任务示例：

```js
const jobs = selectedDevices.value.map((device) => ({
  template: tpl,
  variables: device
}));
await printLabelJobs(jobs, { adapter: 'qz-html' | 'qz-image' | 'browser', printer });
```

## 4. 模板里怎么写占位符

### 4.1 写法

- 推荐：`$_{asset_num}`（不用 `${key}`，避免与 Spring 等属性占位符冲突）
- 兼容历史：`${asset_num}` 仍可被解析
- 允许 key 两侧空格：`$_{ asset_num }`
- 兼容全角：`＄｛asset_num｝`（会先规范化再匹配）

### 4.2 可出现的位置

| 位置 | 示例 |
|------|------|
| 文本组件 | `资产编号：$_{asset_num}` |
| 表格**单元格** | 内容填 `$_{specification}` |
| 表格**列名（表头）** | 列 key 写成 `$_{asset_name}`（打印时表头显示设备名） |
| 条码 / 二维码数据 | `props.data = "$_{barcode_code}"` / `"$_{qr_code}"` |

设计器左侧「动态变量字段」拖到画布会生成带 `$_{key}` 的文本；也可拖进表格单元格/表头。

### 4.3 两种 `variables` 形态

1. **打印 / 预览真实数据**（对象）  
   `{ asset_num: 'ZC-001', qr_code: 'https://...', ... }`

2. **设计器左侧字段列表**（数组，仅供拖拽选字段）  
   `[{ key: 'asset_num', label: '资产编号' }, ...]`  
   设计阶段一般**不会**用数组去替换成真实值；真实替换发生在设备打印页传入的设备对象上。

## 5. Demo 设备字段（可扩展）

与 `DevicePrintPage.vue` / 设计器左侧字段对齐，当前 demo 常用 key：

| key | 含义 |
|-----|------|
| `asset_num` | 资产编号 |
| `asset_name` | 资产名称 |
| `specification` | 规格型号 |
| `use_dept` | 使用部门 |
| `storage_place` | 存放地点 |
| `barcode_code` | 条形码内容 |
| `qr_code` | 二维码内容 / 链接（须为真实可访问 URL，扫码才会打开网页） |
| `serial_no` | 序列号 |

宿主接入时：后台设备 DTO 的字段名与模板里 `$_{key}` 保持一致即可；不必改设计器内核。

### 二维码注意

| 场景 | `props.data` | 扫码结果 |
|------|----------------|----------|
| 设计器画布 | 原样编码（未替换） | 若仍是 `$_{qr_code}`，扫出来是这段**文字**；若改成 `https://www.baidu.com`，则打开百度 |
| 打印预览 / 正式打印 | `replaceVars` 后用设备的 `qr_code` | 打开设备数据里的链接；链接无效会提示网络错误 |

动态绑定请保留 `$_{qr_code}`，由设备列表提供真实 URL。固定链接可直接写死在二维码「数据」里并保存（保存会保留，不会被默认种子误覆盖）。

## 6. 宿主接入示例

```js
import { printLabelJobs } from '@/utils/printService.js';

// 单台
await printLabelJobs([{ template, variables: deviceFromApi }]);

// 批量：同一模板，每台设备一份 variables
const jobs = devices.map((d) => ({ template, variables: d }));
await printLabelJobs(jobs, { adapter: 'qz-image', printer: '译维 A42' });
```

正式环境模板与设备列表应由 API 提供；本仓库用 `localStorage` + `defaultTemplates.json` + 页面内 demo `deviceList` 模拟。

## 7. 相关文档

- 主 README：特性与移植说明
- [`public/certs/README.md`](../public/certs/README.md)：QZ 静默打印证书
- [`docs/04_yiwei-a42-qz-tray-bitmap-print-guide.md`](./04_yiwei-a42-qz-tray-bitmap-print-guide.md)：译维 A42 / QZ 位图与排版陷阱
