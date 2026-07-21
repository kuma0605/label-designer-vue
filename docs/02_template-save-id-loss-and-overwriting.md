# 保存模板丢失 ID 及模板被同名覆盖问题修复说明

## 1. 问题现象
* **现象 A：** 修改已保存的模板（如“资产管理常规标签 (50x35mm)”）添加新元素并点击保存，重新进入该模板，发现没有任何变化，新增的物料在原模板卡片中没有体现。
* **现象 B：** 点击保存后，列表中的“标签模板”卡片的内容被强制覆盖，变得和刚刚保存的“资产管理常规标签”模板一模一样。

## 2. 根本原因分析
上述两个相互关联的现象都是由于**模板唯一标识 ID 在双向同步中丢失**以及**保存命名被硬编码覆盖**引起的：

### 2.1 同步导致 ID 被抹除
在 `LabelDesigner/index.vue` 中，有一个用来监听本地物料或画布尺寸修改并同步回父组件 `activeTemplate` 的 `watch`：
```javascript
// 原先 index.vue 里的 watch
watch(
  () => [state.storeList, state.page],
  () => {
    emit('update:modelValue', {
      name: props.modelValue?.name || '标签模板',
      width: state.page.width,
      height: state.page.height,
      data: state.storeList
    }); // 缺失了 id 属性！
  }
);
```
当你在画布中拖拽、修改、或者新增任何元素时，由于缺少 `id` 属性，同步给父组件 `activeTemplate.value` 的对象里不含 `id`。此时，父组件当前选中的编辑模板 `activeTemplate` 的 `id` 被覆盖成了 `undefined`。

### 2.2 保存名称被硬编码
在顶部导航 `HeaderNav.vue` 的保存逻辑中，传回的保存数据没有读取原模板 `id` 且把 `name` 强制写死了：
```javascript
// 原先 HeaderNav.vue 里的保存逻辑
const handleSave = () => {
  const template = {
    name: '标签模板', // 硬编码，覆盖了原来的模板名字
    width: state.page.width,
    height: state.page.height,
    data: JSON.parse(JSON.stringify(state.storeList)) // 依旧没有 id 属性！
  };
  emit('save', template);
};
```

### 2.3 连锁灾难反应
当点击“保存”按钮并传回父组件 `App.vue` 时：
1. 父组件在 `templatesList` 中定位被编辑的模板索引：
   ```javascript
   const targetIndex = templatesList.value.findIndex(item => item.id === activeTemplate.value.id);
   ```
   因为 `activeTemplate.value.id` 是 `undefined`，`findIndex` 找不到对应匹配（返回 `-1`）。
2. `App.vue` 误以为这是一个崭新的自定义模板，于是将其 `push` 到数组末尾。
   此时产生了一个拥有新增物料、且 `id: undefined`、`name: '标签模板'` 的多余卡片。**原来的“常规标签”（有正确 id）在数组头纹丝未动，并没有更新**。
3. 当下一次再次编辑并保存“常规标签”时，它的 `id` 又在编辑中丢失。此时 `App.vue` 执行 `findIndex(item => item.id === undefined)`：
   由于第一次保存已经在列表中留下了一个 `id === undefined` 的“标签模板”卡片，这次查找直接锁定了这个“标签模板”，并把最新的数据**覆盖**在它身上。
   这就导致“标签模板”和“常规标签”完全同步了一样。

## 3. 修复方案及核心代码

### 3.1 `index.vue` 同步保留 `id`
在 `LabelDesigner/index.vue` 向外 emit `update:modelValue` 时，把 `id` 和名字完整传回：

```javascript
watch(
  () => [state.storeList, state.page],
  () => {
    if (_isSyncingFromParent.value) return;
    emit('update:modelValue', {
      id: props.modelValue?.id, // 显式传回 ID 字段
      name: props.modelValue?.name || '标签模板',
      width: state.page.width,
      height: state.page.height,
      data: state.storeList
    });
  },
  { deep: true }
);
```

并在组件挂载处将 `props.modelValue` 传递给子组件 `<HeaderNav>`：
```vue
<HeaderNav :model-value="props.modelValue" @save="handleSave" @print="handlePrint" />
```

### 3.2 `HeaderNav.vue` 支持属性提取，解开硬编码
给 `HeaderNav.vue` 增加 `modelValue` 的 prop 属性，动态填充 `id` 并保留原模板的 `name`（只有在没有名字时才兜底 `标签模板`）：

```javascript
const props = defineProps({
  modelValue: {
    type: Object,
    default() {
      return {};
    }
  }
});

const handleSave = () => {
  const template = {
    id: props.modelValue?.id, // 读取原来的 ID 并向上传递
    name: props.modelValue?.name || '标签模板', // 优先保留原名称
    width: state.page.width,
    height: state.page.height,
    data: JSON.parse(JSON.stringify(state.storeList))
  };
  emit('save', template);
  MessagePlugin.success('保存成功！');
};
```

### 3.3 `App.vue` 脏数据自愈逻辑
考虑到历史测试产生的脏数据（LocalStorage 已经有 `id` 丢失的模板），在 `App.vue` 模板读取加载入口增加自愈机制，自动将所有丢失 `id` 的模板分配唯一的 `tpl-` ID 标记，彻底纠正所有 `undefined` 节点冲突：

```javascript
const loadTemplates = () => {
  const local = localStorage.getItem('label_templates_v3');
  if (local) {
    try {
      const list = JSON.parse(local);
      // 防御性自愈：确保加载出来的每个模板都有唯一的 id，防止历史测试中的脏数据导致 id 为 undefined 产生冲突
      templatesList.value = list.map(item => {
        if (!item.id) {
          item.id = `tpl-${Math.random().toString(36).substring(2, 10)}`;
        }
        return item;
      });
    } catch (e) {
      templatesList.value = [...defaultTemplates];
    }
  } else {
    templatesList.value = [...defaultTemplates];
    saveToLocal();
  }
};
```
