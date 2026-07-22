<script setup>
import { ref, computed, watch } from 'vue';
import { state, actions } from '../store/designerState.js';

const emit = defineEmits(['page-size-change']);

const activeTab = ref('style');

// Page sizes definition
const formPage = ref({
  width: 50,
  height: 35,
  pageName: 'label-5035'
});

// 约定：1mm = 5px（编辑折中比例）
const pageSizeOptions = [
  { label: '标签纸 40×30 mm', value: 'label-4030', size: [200, 150] },
  { label: '标签纸 50×35 mm', value: 'label-5035', size: [250, 175] },
  { label: '标签纸 60×40 mm', value: 'label-6040', size: [300, 200] },
  { label: '标签纸 80×50 mm', value: 'label-8050', size: [400, 250] },
  { label: '自定义尺寸', value: 'custom', size: [250, 175] }
];

const lineOptions = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' }
];

const barcodeFormats = [
  { label: 'CODE128', value: 'CODE128' },
  { label: 'CODE39', value: 'CODE39' },
  { label: 'EAN13', value: 'EAN13' },
  { label: 'ITF', value: 'ITF' }
];

const qrErrorLevels = [
  { label: 'L (低纠错)', value: 'L' },
  { label: 'M (中等)', value: 'M' },
  { label: 'Q (高)', value: 'Q' },
  { label: 'H (极高)', value: 'H' }
];

const fontFamilies = [
  { label: '默认字体', value: '' },
  { label: '宋体', value: 'SimSun' },
  { label: '黑体', value: 'SimHei' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' }
];

const currentComponent = computed(() => {
  return state.activeComponent;
});

const isXLine = computed(() => {
  return currentComponent.value?.type === 'XLineUi';
});

const isYLine = computed(() => {
  return currentComponent.value?.type === 'YLineUi';
});

// Watch currentComponent changes to run setComponentVariable if text changes
watch(
  () => currentComponent.value?.props?.text,
  () => {
    if (currentComponent.value?.type === 'TextUi') {
      actions.setComponentVariable();
    }
  }
);

watch(
  () => [state.page.width, state.page.height],
  ([newWidth, newHeight]) => {
    if (newWidth && newHeight) {
      formPage.value.width = newWidth / 5;
      formPage.value.height = newHeight / 5;
      
      const matchingOption = pageSizeOptions.find(
        opt => opt.size[0] === newWidth && opt.size[1] === newHeight
      );
      formPage.value.pageName = matchingOption ? matchingOption.value : 'custom';
    }
  },
  { immediate: true }
);

watch(
  () => currentComponent.value?.props?.data,
  () => {
    if (currentComponent.value?.type === 'BarcodeUi' || currentComponent.value?.type === 'QrCodeUi') {
      actions.setComponentVariable();
    }
  }
);

const onPageSizeChange = (val) => {
  const selectedOption = pageSizeOptions.find(item => item.value === val);
  if (selectedOption) {
    const [w, h] = selectedOption.size;
    formPage.value.width = w / 5;
    formPage.value.height = h / 5;
    actions.setPageSize(w, h);
    emit('page-size-change', selectedOption.size);
  }
};

const handleSetCustomPageSize = () => {
  const w = Math.round(formPage.value.width * 5);
  const h = Math.round(formPage.value.height * 5);
  actions.setPageSize(w, h);
  emit('page-size-change', [w, h]);
};
</script>

<template>
  <div class="right-menu">
    <div class="title-area">
      {{ currentComponent ? currentComponent.title : '画布属性' }}
    </div>

    <!-- Active component properties form -->
    <div v-if="currentComponent" class="props-form-container">
      <t-tabs v-model="activeTab">
        <t-tab-panel value="style" label="样式属性">
          <t-form label-align="top" style="padding: 15px;">
            <!-- Text Ui Menu -->
            <template v-if="currentComponent.type === 'TextUi'">
              <t-form-item label="文本内容">
                <t-textarea v-model="currentComponent.props.text" placeholder="请输入文本" autosize />
              </t-form-item>
              <t-form-item label="字体家族">
                <t-select v-model="currentComponent.props.fontFamily" clearable>
                  <t-option v-for="item in fontFamilies" :key="item.value" :value="item.value" :label="item.label" />
                </t-select>
              </t-form-item>
              <t-form-item label="字体大小">
                <t-input v-model="currentComponent.props.fontSize" placeholder="如 14px, 20px" />
              </t-form-item>
              <t-form-item label="文字对齐">
                <t-radio-group v-model="currentComponent.props.align" variant="default-filled">
                  <t-radio-button value="left">左对齐</t-radio-button>
                  <t-radio-button value="center">居中</t-radio-button>
                  <t-radio-button value="right">右对齐</t-radio-button>
                </t-radio-group>
              </t-form-item>
              <t-form-item label="文本行高">
                <t-input v-model="currentComponent.props.lineHeight" placeholder="如 1.5" />
              </t-form-item>
              <t-form-item>
                <t-checkbox v-model="currentComponent.props.isBold">加粗</t-checkbox>
                <t-checkbox v-model="currentComponent.props.hasBorder" style="margin-left: 15px;">边框</t-checkbox>
              </t-form-item>
            </template>

            <!-- Barcode Ui Menu -->
            <template v-if="currentComponent.type === 'BarcodeUi'">
              <t-form-item label="条码数据">
                <t-input v-model="currentComponent.props.data" placeholder="请输入条码数据" />
              </t-form-item>
              <t-form-item label="条码格式">
                <t-select v-model="currentComponent.props.format">
                  <t-option v-for="item in barcodeFormats" :key="item.value" :value="item.value" :label="item.label" />
                </t-select>
              </t-form-item>
              <t-form-item label="条码高度">
                <t-slider v-model="currentComponent.props.bodyHeight" :min="10" :max="150" />
              </t-form-item>
              <t-form-item label="单线宽度">
                <t-slider v-model="currentComponent.props.lineWidth" :min="1" :max="6" />
              </t-form-item>
              <t-form-item label="字体大小">
                <t-slider v-model="currentComponent.props.fontSize" :min="8" :max="36" />
              </t-form-item>
              <t-form-item>
                <t-checkbox v-model="currentComponent.props.displayValue" true-value="1" false-value="0">显示数值</t-checkbox>
              </t-form-item>
            </template>

            <!-- QrCode Ui Menu -->
            <template v-if="currentComponent.type === 'QrCodeUi'">
              <t-form-item label="二维码数据">
                <t-input v-model="currentComponent.props.data" placeholder="请输入二维码数据" />
              </t-form-item>
              <t-form-item label="纠错级别">
                <t-select v-model="currentComponent.props.options.errorCorrectionLevel">
                  <t-option v-for="item in qrErrorLevels" :key="item.value" :value="item.value" :label="item.label" />
                </t-select>
              </t-form-item>
              <t-form-item label="边距比例 (Margin)">
                <t-input-number v-model="currentComponent.props.options.margin" :min="0" :max="10" />
              </t-form-item>
              <t-form-item label="缩放比例 (Scale)">
                <t-input-number v-model="currentComponent.props.options.scale" :min="1" :max="20" />
              </t-form-item>
            </template>

            <!-- Line Menu (XLine, YLine) -->
            <template v-if="currentComponent.type === 'XLineUi' || currentComponent.type === 'YLineUi'">
              <t-form-item label="线条粗细 (px)">
                <t-input-number v-if="isXLine" v-model="currentComponent.props.height" :min="1" :max="20" />
                <t-input-number v-else-if="isYLine" v-model="currentComponent.props.width" :min="1" :max="20" />
              </t-form-item>
              <t-form-item label="线条类型">
                <t-select v-model="currentComponent.props.lineType">
                  <t-option v-for="item in lineOptions" :key="item.value" :value="item.value" :label="item.label" />
                </t-select>
              </t-form-item>
            </template>

            <!-- Rectangle Menu -->
            <template v-if="currentComponent.type === 'RectangleUi'">
              <t-form-item label="边框粗细 (px)">
                <t-input-number v-model="currentComponent.props.borderWidth" :min="1" :max="20" />
              </t-form-item>
              <t-form-item label="边框类型">
                <t-select v-model="currentComponent.props.lineType">
                  <t-option v-for="item in lineOptions" :key="item.value" :value="item.value" :label="item.label" />
                </t-select>
              </t-form-item>
            </template>

            <!-- Table Menu -->
            <template v-if="currentComponent.type === 'TableUi'">
              <t-form-item label="表格边框粗细">
                <t-select v-model="currentComponent.props.borderStyle">
                  <t-option value="solid" label="实线" />
                  <t-option value="dashed" label="虚线" />
                  <t-option value="dotted" label="点状线" />
                  <t-option value="none" label="无边框" />
                </t-select>
              </t-form-item>
            </template>

            <t-form-item style="margin-top: 24px;">
              <t-button block theme="danger" variant="outline" @click="actions.removeActiveComponent()">
                <template #icon><t-icon name="delete" /></template>
                删除当前物料
              </t-button>
            </t-form-item>
          </t-form>
        </t-tab-panel>
      </t-tabs>
    </div>

    <!-- Canvas default page settings form -->
    <div v-else class="page-form-container">
      <t-form label-align="top" style="padding: 15px;">
        <t-form-item label="常用纸张尺寸">
          <t-select v-model="formPage.pageName" @change="onPageSizeChange">
            <t-option v-for="item in pageSizeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </t-select>
        </t-form-item>
        
        <t-form-item label="纸张宽度 (mm)">
          <t-input-number v-model="formPage.width" :min="10" :max="1000" style="width: 100%;" />
        </t-form-item>
        
        <t-form-item label="纸张高度 (mm)">
          <t-input-number v-model="formPage.height" :min="10" :max="1000" style="width: 100%;" />
        </t-form-item>

        <t-form-item style="margin-top: 20px;">
          <t-button block theme="primary" @click="handleSetCustomPageSize">
            应用尺寸 (宽度 X 高度)
          </t-button>
        </t-form-item>
      </t-form>
    </div>
  </div>
</template>

<style lang="scss">
.right-menu {
  width: 300px;
  flex-shrink: 0;
  background-color: white;
  box-shadow: -2px 0 6px rgba(0, 21, 41, 0.08);
  position: relative;
  z-index: 90;
  height: 100%;
  overflow-y: auto;

  .title-area {
    padding: 15px;
    background-color: #fafafa;
    font-weight: bold;
    border-bottom: 1px solid #e7e7e7;
    font-size: 14px;
    color: #333;
  }
}
</style>
