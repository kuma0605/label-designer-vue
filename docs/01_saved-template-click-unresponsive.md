# 已保存模板点击画布元素无响应问题修复说明

## 1. 问题现象
编辑已保存的“资产管理常规标签 (50x35mm)”等模板时，点击画布内的任何元素（如文本、条码、二维码），画布无任何选中反馈，右侧属性面板也无法正常切换为该元素的专属配置面板（仍停留在画布设置面板）。而编辑新建的空白模板时，元素又能正常响应并切换面板。

## 2. 根本原因分析
* **数据结构缺失：** 通过数据库或静态数据预加载已保存的标签模板时，内部元素的 JSON 数据通常不包含 `variable`（变量绑定）属性。
* **致命 JavaScript 异常阻断：**
  当选中某个组件时，右侧菜单组件 `RightMenu.vue` 会监听到当前选中组件的 `props.text` 或 `props.data` 变化，从而触发：
  ```javascript
  actions.setComponentVariable();
  ```
  而在原先的 `designerState.js` 动作中，执行了如下赋值：
  ```javascript
  const value = getStringVars ? getStringVars(active.props.text || active.props.data) : [];
  active.variable.textData = value; // 报错：TypeError: Cannot set properties of undefined (setting 'textData')
  ```
  由于导入模板数据时没有 `variable` 属性，此时 `active.variable` 是 `undefined`，对其赋属性值会直接抛出严重的运行时异常。
* **连锁反应：** 抛出异常直接中断了 Vue 3 的响应式派发、重绘及选中状态传播，导致整套点击选中交互彻底瘫痪，无任何响应。

## 3. 修复方案及核心代码

### 3.1 属性安全防御与自动初始化
在 `src/components/LabelDesigner/store/designerState.js` 中增加安全防御校验。当目标元素的 `variable` 字段不存在时，自动对其进行补全和初始化，并在获取绑定文本或数据时加入 `''` 兜底：

```javascript
  setComponentVariable() {
    const active = state.storeList.find((item) => item.id === state.activeComponent?.id);
    if (active) {
      const { getStringVars } = import.meta.glob('@/utils/index.js', { eager: true })['/src/utils/index.js'] || {};
      const value = getStringVars ? getStringVars(active.props.text || active.props.data || '') : [];
      if (!active.variable) {
        active.variable = { enable: false, textData: [] };
      }
      active.variable.textData = value;
      active.variable.enable = value.some((item) => item.key);
    }
  },
```

### 3.2 优化元素点击及鼠标按下逻辑
在 `src/components/LabelDesigner/components/Drag.vue` 中，将选中逻辑 `@click` 与 `@mousedown` 联合处理，并在按下鼠标一瞬间抢先激活当前组件，让操作更流畅，极速响应。

```vue
  <div
    ref="dragRef"
    :id="aimId"
    class="drag-warp"
    :class="activeClass"
    :style="dragStyle"
    @mousedown.stop="handleSetCurrent(); handleMouseDown($event)"
    @click.stop="handleSetCurrent()"
    @contextmenu="handleContextMenu"
  >
```

### 3.3 精确控制反选范围，防止误失焦
在 `src/components/LabelDesigner/index.vue` 的全局反选处理器 `handleCancelCurrent` 中，不再采取“点击非菜单和导航区域即反选”的粗暴逻辑。限制只有点击在画布背景（`.view-wrapper`）或画布容器本身（`.board-canvas`）时才清空选中状态：

```javascript
const handleCancelCurrent = (e) => {
  const target = e.target;

  // 1. 右侧属性面板内部点击，不反选
  const rightMenu = document.querySelector('.right-menu');
  if (rightMenu && rightMenu.contains(target)) return;

  // 2. 左侧物料栏内部点击，不反选
  const leftMenu = document.querySelector('.left-menu');
  if (leftMenu && leftMenu.contains(target)) return;

  // 3. 顶部导航栏内部点击，不反选
  const headerNav = document.querySelector('.header-nav-warp');
  if (headerNav && headerNav.contains(target)) return;

  // 4. 只有点击在画布背景或画布容器本身时才取消选中
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
```
