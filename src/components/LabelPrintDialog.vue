<script setup>
import { ref, computed, watch } from 'vue';
import DesignPreview from './LabelDesigner/core/DesignPreview.jsx';
import { MessagePlugin } from 'tdesign-vue-next';
import { printLabelJobs } from '@/utils/printService.js';
import { useQzPrintOptions } from '@/composables/useQzPrintOptions.js';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  header: {
    type: String,
    default: '标签打印'
  },
  /** 固定模板（无模板选择器时使用） */
  template: {
    type: Object,
    default: null
  },
  /** 可选模板列表（传入后显示模板选择器） */
  templates: {
    type: Array,
    default: () => []
  },
  selectedTemplateId: {
    type: String,
    default: ''
  },
  /** 打印项：{ id, variables, title?, subtitle? } */
  items: {
    type: Array,
    default: () => []
  },
  removable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:visible',
  'update:selectedTemplateId',
  'remove-item',
  'printed'
]);

const printing = ref(false);
const PREVIEW_WIDTH = 240;

const {
  printAdapter,
  printerList,
  selectedPrinter,
  qzConnecting,
  qzConnected,
  qzStatusText,
  refreshQzPrinters,
  onDialogOpen
} = useQzPrintOptions(() => props.visible);

const showTemplateSelector = computed(() => props.templates.length > 0);

const activeTemplate = computed(() => {
  if (showTemplateSelector.value) {
    return props.templates.find((t) => t.id === props.selectedTemplateId) || props.templates[0] || null;
  }
  return props.template;
});

const getPreviewScale = (tplWidth) => PREVIEW_WIDTH / (tplWidth || 250);

watch(
  () => props.visible,
  (open) => {
    if (open) onDialogOpen();
  }
);

const handleClose = () => {
  emit('update:visible', false);
};

const handleRemove = (id) => {
  emit('remove-item', id);
};

const handleConfirmPrint = async () => {
  const tpl = activeTemplate.value;
  if (!tpl) {
    MessagePlugin.warning('请先选择标签模板');
    return;
  }
  if (!props.items.length) {
    MessagePlugin.warning('没有可打印的标签');
    return;
  }
  if (printAdapter.value.startsWith('qz') && !selectedPrinter.value) {
    MessagePlugin.warning('请先选择打印机，或点击刷新连接 QZ Tray');
    return;
  }

  printing.value = true;
  try {
    const jobs = props.items.map((item) => ({
      template: tpl,
      variables: item.variables
    }));
    const count = await printLabelJobs(jobs, {
      adapter: printAdapter.value,
      printer: selectedPrinter.value
    });
    if (printAdapter.value.startsWith('qz')) {
      MessagePlugin.success(`已通过 QZ Tray 发送 ${count} 张标签到「${selectedPrinter.value}」`);
    } else {
      MessagePlugin.success(`已打开打印对话框，共 ${count} 张标签`);
    }
    emit('printed', count);
    emit('update:visible', false);
  } catch (e) {
    if (e?.code === 'POPUP_BLOCKED') {
      MessagePlugin.warning('打印窗口被浏览器拦截，请允许本站点弹窗后重试');
    } else if (e?.code === 'QZ_NOT_RUNNING') {
      MessagePlugin.warning('无法连接 QZ Tray，请确认已安装并启动');
    } else if (e?.code === 'QZ_NO_PRINTER') {
      MessagePlugin.warning('未找到可用打印机，请选择打印机后重试');
    } else if (e?.code === 'QZ_PRINT_FAILED' || e?.code === 'QZ_CONNECT_FAILED') {
      MessagePlugin.error(e.message || 'QZ 打印失败');
    } else {
      console.error(e);
      MessagePlugin.error(e?.message || '打印失败，请查看控制台');
    }
  } finally {
    printing.value = false;
  }
};
</script>

<template>
  <t-dialog
    :visible="visible"
    :header="header"
    width="980px"
    :footer="false"
    destroy-on-close
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="activeTemplate" class="print-dialog-wrapper">
      <div class="dialog-top-bar">
        <div class="template-selector-group">
          <template v-if="showTemplateSelector">
            <span class="label-title">选择标签模板：</span>
            <t-select
              :model-value="selectedTemplateId"
              placeholder="请选择标签模板"
              style="width: 260px;"
              @update:model-value="emit('update:selectedTemplateId', $event)"
            >
              <t-option
                v-for="tpl in templates"
                :key="tpl.id"
                :value="tpl.id"
                :label="tpl.name"
              />
            </t-select>
          </template>
          <template v-else>
            <span class="label-title">当前模板：</span>
            <span class="template-name-badge">{{ activeTemplate.name }}</span>
          </template>

          <span class="template-size-badge">
            物理尺寸: {{ Math.round(activeTemplate.width / 5) }} × {{ Math.round(activeTemplate.height / 5) }} mm
          </span>
        </div>

        <div class="batch-count-info">
          准备打印 <strong class="highlight">{{ items.length }}</strong> 张标签
        </div>
      </div>

      <div class="dialog-preview-grid">
        <div
          v-for="item in items"
          :key="item.id"
          class="label-card-item"
        >
          <div class="card-header">
            <div class="device-info">
              <span v-if="item.title" class="code">{{ item.title }}</span>
              <span v-if="item.subtitle" class="name" :title="item.subtitle">{{ item.subtitle }}</span>
            </div>
            <t-icon
              v-if="removable"
              name="close"
              class="remove-icon"
              title="从本次打印中移除"
              @click="handleRemove(item.id)"
            />
          </div>

          <div class="card-body">
            <div
              class="scaled-preview-container"
              :style="{
                width: `${PREVIEW_WIDTH}px`,
                height: `${Math.round(activeTemplate.height * getPreviewScale(activeTemplate.width))}px`
              }"
            >
              <div
                class="scaled-preview-inner"
                :style="{
                  width: `${activeTemplate.width}px`,
                  height: `${activeTemplate.height}px`,
                  transform: `scale(${getPreviewScale(activeTemplate.width)})`,
                  transformOrigin: 'top left'
                }"
              >
                <DesignPreview
                  :template="activeTemplate"
                  :variables="item.variables"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <div class="footer-left">
          <div class="footer-summary">
            已关联模板【<strong>{{ activeTemplate.name }}</strong>】，共计 {{ items.length }} 张标签
          </div>
          <div class="print-options">
            <span class="opt-label">打印方式</span>
            <t-radio-group v-model="printAdapter" variant="default-filled" size="small">
              <t-radio-button value="qz-html">QZ Tray HTML (推荐 A42)</t-radio-button>
              <t-radio-button value="qz-image">QZ Tray 位图</t-radio-button>
              <t-radio-button value="browser">浏览器原生</t-radio-button>
            </t-radio-group>

            <template v-if="printAdapter.startsWith('qz')">
              <span
                class="qz-status"
                :class="{ ok: qzConnected, busy: qzConnecting }"
              >{{ qzStatusText }}</span>
              <t-select
                v-model="selectedPrinter"
                placeholder="选择打印机"
                filterable
                style="width: 220px;"
                :loading="qzConnecting"
                :options="printerList.map((name) => ({ label: name, value: name }))"
              />
              <t-button
                variant="outline"
                size="small"
                :loading="qzConnecting"
                @click="refreshQzPrinters()"
              >
                刷新打印机
              </t-button>
            </template>
          </div>

          <t-alert v-if="printAdapter === 'qz-html'" theme="info" size="small" style="margin-top: 10px;">
            <template #message>
              <strong>💡 译维 A42 / 标签打印机排版提示：</strong><br />
              1. 当前采用 <b>HTML 驱动渲染</b> 模式，精准进行矢量渲染与边界锁尺。<br />
              2. <strong>关键步骤：</strong> 请在 Windows「控制面板 -> 设备和打印机 -> 译维 A42 打印首选项」中建立并选中与物理标签相符的规格（如 50×35mm），避免默认 A4 纸张高度导致连续走纸；<br />
              3. 重新开机或换纸后，建议长按打印机进纸键完成缝隙/黑标学习。
            </template>
          </t-alert>
        </div>
        <div class="footer-btns">
          <t-button variant="outline" @click="handleClose">取消</t-button>
          <t-button
            theme="primary"
            size="medium"
            :loading="printing"
            @click="handleConfirmPrint"
          >
            <template #icon><t-icon name="print" /></template>
            确认打印
          </t-button>
        </div>
      </div>
    </div>
  </t-dialog>
</template>

<style lang="scss" scoped>
.print-dialog-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;

  .dialog-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f7f8fa;
    padding: 12px 18px;
    border-radius: 6px;

    .template-selector-group {
      display: flex;
      align-items: center;
      gap: 12px;

      .label-title {
        font-size: 14px;
        font-weight: 500;
        color: #1d2129;
      }

      .template-name-badge {
        font-size: 13px;
        font-weight: 500;
        color: #0052d9;
        background: #e8f3ff;
        padding: 4px 10px;
        border-radius: 4px;
      }

      .template-size-badge {
        font-size: 12px;
        color: #4e5969;
        background: #e5e6eb;
        padding: 4px 8px;
        border-radius: 4px;
      }
    }

    .batch-count-info {
      font-size: 14px;
      color: #4e5969;

      .highlight {
        color: #0052d9;
        font-size: 16px;
      }
    }
  }

  .dialog-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 16px;
    max-height: 480px;
    overflow-y: auto;
    padding: 8px 4px;
  }

  .label-card-item {
    background: white;
    border: 1px solid #e5e6eb;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.2s ease;

    &:hover {
      border-color: #0052d9;
      box-shadow: 0 4px 12px rgba(0, 82, 217, 0.12);
    }

    .card-header {
      padding: 10px 14px;
      background: #fafbfc;
      border-bottom: 1px solid #edf0f4;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .device-info {
        display: flex;
        align-items: center;
        gap: 8px;
        overflow: hidden;

        .code {
          font-family: monospace;
          font-size: 12px;
          color: #0052d9;
          font-weight: 600;
          background: #e8f3ff;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .name {
          font-size: 13px;
          color: #1d2129;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
      }

      .remove-icon {
        cursor: pointer;
        color: #86909c;
        font-size: 14px;
        transition: color 0.15s;

        &:hover {
          color: #f53f3f;
        }
      }
    }

    .card-body {
      padding: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f2f3f5;
    }

    .scaled-preview-container {
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-radius: 4px;
      background: white;
    }

    .scaled-preview-inner {
      position: absolute;
      top: 0;
      left: 0;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    border-top: 1px solid #edf0f4;
    padding-top: 14px;

    .footer-left {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .footer-summary {
      font-size: 13px;
      color: #4e5969;

      strong {
        color: #1d2129;
      }
    }

    .print-options {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;

      .opt-label {
        font-size: 13px;
        color: #4e5969;
      }

      .qz-status {
        font-size: 12px;
        color: #f53f3f;

        &.ok {
          color: #00a870;
        }

        &.busy {
          color: #e37318;
        }
      }
    }

    .footer-btns {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
    }
  }
}
</style>
