<script setup>
import { ref, computed, onMounted } from 'vue';
import DesignPreview from '../components/LabelDesigner/core/DesignPreview.jsx';
import { MessagePlugin } from 'tdesign-vue-next';

// 模板列表（从 localStorage 读取）
const templatesList = ref([]);
const selectedTemplateId = ref('');

// 设备列表（demo 数据）
const deviceList = ref([
  { asset_num: 'ZC-2026-0001', asset_name: '联想 ThinkPad X1', specification: 'i7/16G/512G', use_dept: '研发部', storage_place: 'A栋3楼' },
  { asset_num: 'ZC-2026-0002', asset_name: '戴尔 U2723QE 显示器', specification: '27寸 4K', use_dept: '设计部', storage_place: 'B栋2楼' },
  { asset_num: 'ZC-2026-0003', asset_name: 'MacBook Pro 14', specification: 'M3 Pro/18G/512G', use_dept: '研发部', storage_place: 'A栋3楼' },
  { asset_num: 'ZC-2026-0004', asset_name: '华为 MateView', specification: '28.2寸 4K+', use_dept: '市场部', storage_place: 'C栋1楼' },
  { asset_num: 'ZC-2026-0005', asset_name: '罗技 MX Master 3S', specification: '无线鼠标', use_dept: '研发部', storage_place: 'A栋3楼' },
  { asset_num: 'ZC-2026-0006', asset_name: '群晖 DS923+', specification: '4盘位 NAS', use_dept: 'IT部', storage_place: '机房' },
  { asset_num: 'ZC-2026-0007', asset_name: '索尼 WH-1000XM5', specification: '头戴降噪耳机', use_dept: '人事部', storage_place: 'A栋2楼' },
  { asset_num: 'ZC-2026-0008', asset_name: 'iPad Pro 12.9', specification: 'M2/256G', use_dept: '设计部', storage_place: 'B栋2楼' }
]);

const selectedDeviceIds = ref([]);
const showPreview = ref(false);

// 当前选中的设备
const selectedDevices = computed(() => {
  return deviceList.value.filter(d => selectedDeviceIds.value.includes(d.asset_num));
});

// 当前选中的模板
const selectedTemplate = computed(() => {
  return templatesList.value.find(t => t.id === selectedTemplateId.value) || null;
});

const handleSelectAll = (checked) => {
  if (checked) {
    selectedDeviceIds.value = deviceList.value.map(d => d.asset_num);
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

const handlePrintPreview = () => {
  if (selectedDeviceIds.value.length === 0) {
    MessagePlugin.warning('请至少选择一个设备');
    return;
  }
  if (!selectedTemplateId.value) {
    MessagePlugin.warning('请选择一个标签模板');
    return;
  }
  showPreview.value = true;
};

const handleClosePreview = () => {
  showPreview.value = false;
};

const handleConfirmPrint = () => {
  MessagePlugin.success(`已发送打印任务：${selectedDeviceIds.value.length} 个设备`);
  showPreview.value = false;
};

const getMiniLabelStyle = (width, height) => {
  const maxW = 180;
  const maxH = 110;
  const scale = Math.min(maxW / width, maxH / height);
  return {
    width: `${Math.round(width * scale)}px`,
    height: `${Math.round(height * scale)}px`
  };
};

onMounted(() => {
  const local = localStorage.getItem('label_templates_v3');
  if (local) {
    try {
      templatesList.value = JSON.parse(local);
    } catch (e) {
      templatesList.value = [];
    }
  }
  if (templatesList.value.length > 0) {
    selectedTemplateId.value = templatesList.value[0].id;
  }
});
</script>

<template>
  <div class="device-print-page">
    <div class="device-layout">
      <!-- 左侧：设备列表 -->
      <div class="device-panel">
        <div class="panel-header">
          <h3>设备列表</h3>
          <span class="selected-count">已选 {{ selectedDeviceIds.length }} / {{ deviceList.length }}</span>
        </div>
        <div class="device-table-wrapper">
          <table class="device-table">
            <thead>
              <tr>
                <th style="width: 50px;">
                  <t-checkbox
                    :checked="selectedDeviceIds.length === deviceList.length && deviceList.length > 0"
                    :indeterminate="selectedDeviceIds.length > 0 && selectedDeviceIds.length < deviceList.length"
                    @change="handleSelectAll"
                  />
                </th>
                <th>资产编号</th>
                <th>资产名称</th>
                <th>使用部门</th>
                <th>存放地点</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="device in deviceList"
                :key="device.asset_num"
                :class="{ selected: selectedDeviceIds.includes(device.asset_num) }"
                @click="toggleDevice(device.asset_num)"
              >
                <td>
                  <t-checkbox
                    :checked="selectedDeviceIds.includes(device.asset_num)"
                    @click.stop
                    @change="(checked) => {
                      if (checked && !selectedDeviceIds.includes(device.asset_num)) selectedDeviceIds.push(device.asset_num);
                      if (!checked && selectedDeviceIds.includes(device.asset_num)) selectedDeviceIds.splice(selectedDeviceIds.indexOf(device.asset_num), 1);
                    }"
                  />
                </td>
                <td class="asset-num">{{ device.asset_num }}</td>
                <td>{{ device.asset_name }}</td>
                <td>{{ device.use_dept }}</td>
                <td>{{ device.storage_place }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 右侧：模板选择 + 预览 -->
      <div class="preview-panel">
        <div class="panel-header">
          <h3>打印设置</h3>
        </div>

        <div class="print-settings">
          <div class="setting-item">
            <label class="setting-label">选择模板</label>
            <t-select
              v-model="selectedTemplateId"
              placeholder="请选择标签模板"
              style="width: 100%;"
            >
              <t-option
                v-for="tpl in templatesList"
                :key="tpl.id"
                :value="tpl.id"
                :label="tpl.name"
              />
            </t-select>
          </div>

          <div class="setting-item">
            <label class="setting-label">已选设备</label>
            <div class="selected-devices-tags">
              <t-tag
                v-for="device in selectedDevices"
                :key="device.asset_num"
                theme="primary"
                variant="light"
                closable
                @close="toggleDevice(device.asset_num)"
              >
                {{ device.asset_num }}
              </t-tag>
              <span v-if="selectedDevices.length === 0" class="no-devices">暂未选择设备</span>
            </div>
          </div>

          <div class="setting-item template-mini-preview" v-if="selectedTemplate">
            <label class="setting-label">模板预览</label>
            <div class="mini-preview-box">
              <div class="mini-label-render" :style="getMiniLabelStyle(selectedTemplate.width, selectedTemplate.height)">
                <DesignPreview
                  :template="selectedTemplate"
                  :variables="selectedTemplate.data.reduce((acc, c) => {
                    if (c.variable?.enable && c.variable.textData) {
                      c.variable.textData.forEach(t => { if (t.key) acc[t.key] = '[' + t.key + ']' });
                    }
                    return acc;
                  }, {})"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="print-actions">
          <t-button
            theme="primary"
            size="large"
            :disabled="selectedDeviceIds.length === 0 || !selectedTemplateId"
            @click="handlePrintPreview"
          >
            <template #icon><t-icon name="print" /></template>
            打印预览 ({{ selectedDevices.length }})
          </t-button>
        </div>
      </div>
    </div>

    <!-- 打印预览弹窗 -->
    <t-dialog
      v-model:visible="showPreview"
      header="标签打印预览"
      width="900"
      :footer="false"
      @close="handleClosePreview"
    >
      <div class="print-preview-content">
        <div class="preview-toolbar">
          <span class="preview-info">
            共 <strong>{{ selectedDevices.length }}</strong> 个标签，模板：<strong>{{ selectedTemplate?.name }}</strong>
          </span>
        </div>
        <div class="preview-labels-container">
          <div
            v-for="device in selectedDevices"
            :key="device.asset_num"
            class="preview-label-item"
          >
            <div class="label-scaled-wrapper">
              <DesignPreview
                v-if="selectedTemplate"
                :template="selectedTemplate"
                :variables="device"
              />
            </div>
            <div class="label-device-name">{{ device.asset_name }}</div>
          </div>
        </div>
      </div>
      <div class="preview-footer-actions">
        <t-button variant="outline" @click="handleClosePreview">取消</t-button>
        <t-button theme="primary" @click="handleConfirmPrint">
          <template #icon><t-icon name="print" /></template>
          确认打印
        </t-button>
      </div>
    </t-dialog>
  </div>
</template>

<style lang="scss">
.device-print-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 20px;

  .device-layout {
    display: flex;
    gap: 20px;
    height: 100%;
  }

  .device-panel {
    flex: 1;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .preview-panel {
    width: 380px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #333;
    }

    .selected-count {
      font-size: 13px;
      color: #0052d9;
      background-color: #f0f6ff;
      padding: 2px 10px;
      border-radius: 12px;
    }
  }

  .device-table-wrapper {
    flex: 1;
    overflow-y: auto;
  }

  .device-table {
    width: 100%;
    border-collapse: collapse;

    th {
      text-align: left;
      padding: 12px 16px;
      font-size: 13px;
      color: #666;
      font-weight: 500;
      background-color: #fafafa;
      border-bottom: 1px solid #eee;
      position: sticky;
      top: 0;
    }

    td {
      padding: 12px 16px;
      font-size: 13px;
      color: #333;
      border-bottom: 1px solid #f5f5f5;
    }

    tbody tr {
      cursor: pointer;
      transition: background-color 0.15s;

      &:hover {
        background-color: #f8f8f8;
      }

      &.selected {
        background-color: #f0f6ff;
      }

      .asset-num {
        font-family: monospace;
        color: #0052d9;
        font-weight: 500;
      }
    }
  }

  .print-settings {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .setting-item {
    margin-bottom: 24px;
  }

  .setting-label {
    display: block;
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .selected-devices-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 32px;

    .no-devices {
      font-size: 13px;
      color: #999;
    }
  }

  .template-mini-preview {
    .mini-preview-box {
      background-color: #f8f8f8;
      border-radius: 6px;
      padding: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 140px;
    }

    .mini-label-render {
      background: white;
      border: 1px dashed #ccc;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      transform: scale(0.5);
      transform-origin: center center;
    }
  }

  .print-actions {
    padding: 16px 20px;
    border-top: 1px solid #eee;

    button {
      width: 100%;
    }
  }
}

// 打印预览弹窗
.print-preview-content {
  .preview-toolbar {
    padding: 12px 0;
    border-bottom: 1px solid #eee;
    margin-bottom: 16px;

    .preview-info {
      font-size: 14px;
      color: #666;

      strong {
        color: #0052d9;
      }
    }
  }

  .preview-labels-container {
    max-height: 500px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 8px 0;
  }

  .preview-label-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .label-scaled-wrapper {
      transform: scale(0.6);
      transform-origin: top center;
      background: white;
      border: 1px solid #ddd;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .label-device-name {
      font-size: 13px;
      color: #666;
      margin-top: -30px;
    }
  }
}

.preview-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  margin-top: 16px;
}
</style>
