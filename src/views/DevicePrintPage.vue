<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import DesignPreview from '../components/LabelDesigner/core/DesignPreview.jsx';
import { MessagePlugin } from 'tdesign-vue-next';
import { printLabelJobs } from '@/utils/printService.js';
import { loadTemplatesFromStorage } from '@/utils/templateStore.js';
import {
  connectQz,
  listPrinters,
  isQzConnected
} from '@/utils/qzClient.js';

// 模板列表（demo：localStorage；种子数据来自 mock JSON）
const templatesList = ref([]);
const selectedTemplateId = ref('');
const printing = ref(false);

/** @type {import('vue').Ref<'browser' | 'qz-html' | 'qz-image'>} */
const printAdapter = ref('qz-html');
const printerList = ref([]);
const selectedPrinter = ref('');
const qzConnecting = ref(false);
const qzConnected = ref(false);
const qzStatusText = computed(() => {
  if (!printAdapter.value.startsWith('qz')) return '';
  if (qzConnecting.value) return '正在连接 QZ Tray…';
  if (qzConnected.value) return 'QZ Tray 已连接';
  return 'QZ Tray 未连接';
});

// 设备 demo 数据
const deviceList = ref([
  { asset_num: 'ZC-2026-0001', asset_name: '联想 ThinkPad X1', specification: 'i7/16G/512G', use_dept: '研发部', storage_place: 'A栋3楼', barcode_code: '697012345601', qr_code: 'https://ams.company.com/device/ZC-2026-0001', serial_no: 'SN20260722001' },
  { asset_num: 'ZC-2026-0002', asset_name: '戴尔 U2723QE 显示器', specification: '27寸 4K', use_dept: '设计部', storage_place: 'B栋2楼', barcode_code: '697012345602', qr_code: 'https://ams.company.com/device/ZC-2026-0002', serial_no: 'SN20260722002' },
  { asset_num: 'ZC-2026-0003', asset_name: 'MacBook Pro 14', specification: 'M3 Pro/18G/512G', use_dept: '研发部', storage_place: 'A栋3楼', barcode_code: '697012345603', qr_code: 'https://ams.company.com/device/ZC-2026-0003', serial_no: 'SN20260722003' },
  { asset_num: 'ZC-2026-0004', asset_name: '华为 MateView', specification: '28.2寸 4K+', use_dept: '市场部', storage_place: 'C栋1楼', barcode_code: '697012345604', qr_code: 'https://ams.company.com/device/ZC-2026-0004', serial_no: 'SN20260722004' },
  { asset_num: 'ZC-2026-0005', asset_name: '罗技 MX Master 3S', specification: '无线鼠标', use_dept: '研发部', storage_place: 'A栋3楼', barcode_code: '697012345605', qr_code: 'https://ams.company.com/device/ZC-2026-0005', serial_no: 'SN20260722005' },
  { asset_num: 'ZC-2026-0006', asset_name: '群晖 DS923+', specification: '4盘位 NAS', use_dept: 'IT部', storage_place: '机房', barcode_code: '697012345606', qr_code: 'https://ams.company.com/device/ZC-2026-0006', serial_no: 'SN20260722006' },
  { asset_num: 'ZC-2026-0007', asset_name: '索尼 WH-1000XM5', specification: '头戴降噪耳机', use_dept: '人事部', storage_place: 'A栋2楼', barcode_code: '697012345607', qr_code: 'https://ams.company.com/device/ZC-2026-0007', serial_no: 'SN20260722007' },
  { asset_num: 'ZC-2026-0008', asset_name: 'iPad Pro 12.9', specification: 'M2/256G', use_dept: '设计部', storage_place: 'B栋2楼', barcode_code: '697012345608', qr_code: 'https://ams.company.com/device/ZC-2026-0008', serial_no: 'SN20260722008' }
]);

const selectedDeviceIds = ref(['ZC-2026-0001', 'ZC-2026-0002', 'ZC-2026-0003']);
const searchKeyword = ref('');
const deptFilter = ref('');
const showPrintModal = ref(false);

// 部门筛选选项
const deptOptions = computed(() => {
  const depts = new Set(deviceList.value.map(d => d.use_dept));
  return Array.from(depts).map(d => ({ label: d, value: d }));
});

// 筛选后的设备列表
const filteredDevices = computed(() => {
  return deviceList.value.filter(d => {
    const kw = searchKeyword.value.toLowerCase();
    const matchKeyword = !searchKeyword.value || 
      d.asset_num.toLowerCase().includes(kw) ||
      d.asset_name.toLowerCase().includes(kw) ||
      (d.barcode_code && d.barcode_code.includes(kw)) ||
      (d.serial_no && d.serial_no.toLowerCase().includes(kw));
    const matchDept = !deptFilter.value || d.use_dept === deptFilter.value;
    return matchKeyword && matchDept;
  });
});

// 当前选中的设备
const selectedDevices = computed(() => {
  return deviceList.value.filter(d => selectedDeviceIds.value.includes(d.asset_num));
});

// 当前选中的模板
const selectedTemplate = computed(() => {
  return templatesList.value.find(t => t.id === selectedTemplateId.value) || templatesList.value[0] || null;
});

// 全选 / 取消全选
const handleSelectAll = (checked) => {
  if (checked) {
    selectedDeviceIds.value = filteredDevices.value.map(d => d.asset_num);
  } else {
    selectedDeviceIds.value = [];
  }
};

const toggleDevice = (assetNum) => {
  const idx = selectedDeviceIds.value.indexOf(assetNum);
  if (idx > -1) {
    selectedDeviceIds.value.splice(idx, 1);
  } else {
    selectedDeviceIds.value.push(assetNum);
  }
};

// 重新读取本地模板（无缓存时用 mock JSON 种子）
const loadTemplates = () => {
  templatesList.value = loadTemplatesFromStorage();
};

const refreshQzPrinters = async ({ silent = false } = {}) => {
  qzConnecting.value = true;
  try {
    await connectQz();
    qzConnected.value = isQzConnected();
    const printers = await listPrinters();
    printerList.value = printers;
    if (!selectedPrinter.value || !printers.includes(selectedPrinter.value)) {
      selectedPrinter.value = printers[0] || '';
    }
    if (!silent) {
      MessagePlugin.success(`已加载 ${printers.length} 台打印机`);
    }
  } catch (e) {
    qzConnected.value = false;
    printerList.value = [];
    selectedPrinter.value = '';
    if (e?.code === 'QZ_NOT_RUNNING') {
      MessagePlugin.warning('无法连接 QZ Tray，请确认已安装并启动');
    } else if (!silent) {
      MessagePlugin.error(e?.message || '连接 QZ Tray 失败');
    }
  } finally {
    qzConnecting.value = false;
  }
};

watch(printAdapter, (val) => {
  if (val.startsWith('qz') && showPrintModal.value) {
    refreshQzPrinters({ silent: true });
  }
});

watch(showPrintModal, (open) => {
  if (open && printAdapter.value.startsWith('qz')) {
    refreshQzPrinters({ silent: true });
  }
});

// 打开打印弹窗
const handleOpenPrintModal = () => {
  loadTemplates();
  if (selectedDeviceIds.value.length === 0) {
    MessagePlugin.warning('请至少选择一个设备');
    return;
  }
  if (templatesList.value.length > 0) {
    if (!selectedTemplateId.value || !templatesList.value.some(t => t.id === selectedTemplateId.value)) {
      selectedTemplateId.value = templatesList.value[0].id;
    }
  }
  showPrintModal.value = true;
};

// 单打设备
const handleSinglePrint = (assetNum) => {
  loadTemplates();
  selectedDeviceIds.value = [assetNum];
  if (templatesList.value.length > 0) {
    if (!selectedTemplateId.value || !templatesList.value.some(t => t.id === selectedTemplateId.value)) {
      selectedTemplateId.value = templatesList.value[0].id;
    }
  }
  showPrintModal.value = true;
};

// 从打印列表中移除设备
const handleRemoveFromPrint = (assetNum) => {
  const idx = selectedDeviceIds.value.indexOf(assetNum);
  if (idx > -1) {
    selectedDeviceIds.value.splice(idx, 1);
  }
  if (selectedDeviceIds.value.length === 0) {
    showPrintModal.value = false;
    MessagePlugin.info('已清空打印列表');
  }
};

// 确认打印
const handleConfirmPrint = async () => {
  const tpl = selectedTemplate.value;
  if (!tpl) {
    MessagePlugin.warning('请先选择标签模板');
    return;
  }
  if (!selectedDevices.value.length) {
    MessagePlugin.warning('请至少选择一个设备');
    return;
  }
  if (printAdapter.value.startsWith('qz') && !selectedPrinter.value) {
    MessagePlugin.warning('请先选择打印机，或点击刷新连接 QZ Tray');
    return;
  }

  printing.value = true;
  try {
    const jobs = selectedDevices.value.map((device) => ({
      template: tpl,
      variables: device
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
    showPrintModal.value = false;
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

const PREVIEW_WIDTH = 240;

// 动态计算缩放参数
const getPreviewScale = (tplWidth) => {
  return PREVIEW_WIDTH / (tplWidth || 250);
};

onMounted(() => {
  loadTemplates();
  if (templatesList.value.length > 0) {
    selectedTemplateId.value = templatesList.value[0].id;
  }
});
</script>

<template>
  <div class="device-manage-page">
    <!-- 主界面：设备资产管理 -->
    <div class="device-card-panel">
      <!-- 头部工具栏 -->
      <div class="table-toolbar">
        <div class="toolbar-left">
          <h2 class="title">设备资产管理</h2>
          <span class="count-badge">共 {{ deviceList.length }} 个设备，已选 {{ selectedDeviceIds.length }} 个</span>
        </div>

        <div class="toolbar-right">
          <t-input
            v-model="searchKeyword"
            placeholder="搜索资产编号 / 名称"
            clearable
            style="width: 220px;"
          >
            <template #prefix-icon><t-icon name="search" /></template>
          </t-input>

          <t-select
            v-model="deptFilter"
            placeholder="全部部门"
            clearable
            style="width: 140px;"
          >
            <t-option
              v-for="opt in deptOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </t-select>

          <t-button
            theme="primary"
            size="medium"
            :disabled="selectedDeviceIds.length === 0"
            @click="handleOpenPrintModal"
          >
            <template #icon><t-icon name="print" /></template>
            批量打印设备标签 ({{ selectedDeviceIds.length }})
          </t-button>
        </div>
      </div>

      <!-- 设备表格 -->
      <div class="table-container">
        <table class="device-table">
          <thead>
            <tr>
              <th style="width: 50px;">
                <t-checkbox
                  :checked="selectedDeviceIds.length === filteredDevices.length && filteredDevices.length > 0"
                  :indeterminate="selectedDeviceIds.length > 0 && selectedDeviceIds.length < filteredDevices.length"
                  @change="handleSelectAll"
                />
              </th>
              <th>资产编号</th>
              <th>资产名称</th>
              <th>对应条形码</th>
              <th>序列号 / 二维码</th>
              <th>规格型号</th>
              <th>使用部门</th>
              <th>存放地点</th>
              <th style="width: 110px; text-align: center;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="device in filteredDevices"
              :key="device.asset_num"
              :class="{ selected: selectedDeviceIds.includes(device.asset_num) }"
              @click="toggleDevice(device.asset_num)"
            >
              <td>
                <t-checkbox
                  :checked="selectedDeviceIds.includes(device.asset_num)"
                  @click.stop
                  @change="() => toggleDevice(device.asset_num)"
                />
              </td>
              <td class="asset-code">{{ device.asset_num }}</td>
              <td class="asset-name">{{ device.asset_name }}</td>
              <td><span class="barcode-tag">{{ device.barcode_code }}</span></td>
              <td><span class="sn-tag">{{ device.serial_no }}</span></td>
              <td>{{ device.specification }}</td>
              <td><span class="dept-tag">{{ device.use_dept }}</span></td>
              <td>{{ device.storage_place }}</td>
              <td style="text-align: center;" @click.stop>
                <t-button
                  variant="text"
                  theme="primary"
                  size="small"
                  @click="handleSinglePrint(device.asset_num)"
                >
                  <template #icon><t-icon name="print" /></template>
                  打印标签
                </t-button>
              </td>
            </tr>
            <tr v-if="filteredDevices.length === 0">
              <td colspan="7" class="empty-cell">未搜索到相关设备</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 弹窗：标签打印与预览 -->
    <t-dialog
      v-model:visible="showPrintModal"
      header="设备标签打印"
      width="980px"
      :footer="false"
      destroy-on-close
    >
      <div class="print-dialog-wrapper" v-if="selectedTemplate">
        <!-- 弹窗顶部：模板选择 & 统计栏 -->
        <div class="dialog-top-bar">
          <div class="template-selector-group">
            <span class="label-title">选择标签模板：</span>
            <t-select
              v-model="selectedTemplateId"
              placeholder="请选择标签模板"
              style="width: 260px;"
            >
              <t-option
                v-for="tpl in templatesList"
                :key="tpl.id"
                :value="tpl.id"
                :label="tpl.name"
              />
            </t-select>

            <span class="template-size-badge">
              物理尺寸: {{ Math.round(selectedTemplate.width / 5) }} × {{ Math.round(selectedTemplate.height / 5) }} mm
            </span>
          </div>

          <div class="batch-count-info">
            准备打印 <strong class="highlight">{{ selectedDevices.length }}</strong> 张标签
          </div>
        </div>

        <!-- 弹窗中部：设备标签预览网格（一行至少2-3个，保真等比例模拟） -->
        <div class="dialog-preview-grid">
          <div
            v-for="device in selectedDevices"
            :key="device.asset_num"
            class="label-card-item"
          >
            <!-- 卡片头部：设备名称与移除按钮 -->
            <div class="card-header">
              <div class="device-info">
                <span class="code">{{ device.asset_num }}</span>
                <span class="name" :title="device.asset_name">{{ device.asset_name }}</span>
              </div>
              <t-icon
                name="close"
                class="remove-icon"
                title="从本次打印中移除"
                @click="handleRemoveFromPrint(device.asset_num)"
              />
            </div>

            <!-- 卡片主体：保真模拟实际宽高与布局 -->
            <div class="card-body">
              <div
                class="scaled-preview-container"
                :style="{
                  width: `${PREVIEW_WIDTH}px`,
                  height: `${Math.round(selectedTemplate.height * getPreviewScale(selectedTemplate.width))}px`
                }"
              >
                <div
                  class="scaled-preview-inner"
                  :style="{
                    width: `${selectedTemplate.width}px`,
                    height: `${selectedTemplate.height}px`,
                    transform: `scale(${getPreviewScale(selectedTemplate.width)})`,
                    transformOrigin: 'top left'
                  }"
                >
                  <DesignPreview
                    :template="selectedTemplate"
                    :variables="device"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 弹窗底部操作区 -->
        <div class="dialog-footer">
          <div class="footer-left">
            <div class="footer-summary">
              已关联模板【<strong>{{ selectedTemplate.name }}</strong>】，共计 {{ selectedDevices.length }} 张设备标签
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
            <t-button variant="outline" @click="showPrintModal = false">取消</t-button>
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
  </div>
</template>

<style lang="scss" scoped>
.device-manage-page {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #f5f7fa;

  .device-card-panel {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .table-toolbar {
    padding: 16px 24px;
    border-bottom: 1px solid #edf0f4;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1d2129;
      }

      .count-badge {
        font-size: 13px;
        color: #0052d9;
        background-color: #f0f6ff;
        padding: 4px 12px;
        border-radius: 14px;
        font-weight: 500;
      }
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .table-container {
    flex: 1;
    overflow-y: auto;
  }

  .device-table {
    width: 100%;
    border-collapse: collapse;

    th {
      text-align: left;
      padding: 14px 20px;
      font-size: 13px;
      color: #4e5969;
      font-weight: 600;
      background-color: #fafbfc;
      border-bottom: 1px solid #e5e6eb;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    td {
      padding: 14px 20px;
      font-size: 13px;
      color: #1d2129;
      border-bottom: 1px solid #f2f3f5;
    }

    tbody tr {
      cursor: pointer;
      transition: background-color 0.15s;

      &:hover {
        background-color: #f7f8fa;
      }

      &.selected {
        background-color: #f0f6ff;
      }

      .asset-code {
        font-family: monospace;
        color: #0052d9;
        font-weight: 600;
      }

      .asset-name {
        font-weight: 500;
      }

      .dept-tag {
        display: inline-block;
        padding: 2px 8px;
        background: #f2f3f5;
        color: #4e5969;
        border-radius: 4px;
        font-size: 12px;
      }

      .barcode-tag {
        font-family: monospace;
        font-size: 12px;
        color: #2ba471;
        background-color: #e8f8f0;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .sn-tag {
        font-family: monospace;
        font-size: 12px;
        color: #722ed1;
        background-color: #f9f0ff;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }

    .empty-cell {
      text-align: center;
      padding: 40px;
      color: #86909c;
    }
  }
}

// 打印设置与预览弹窗样式
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

  // 多列网格（一行至少2-3个）
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

    // 保真等比例模拟框
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
