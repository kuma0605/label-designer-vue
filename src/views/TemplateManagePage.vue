<script setup>
import { ref, onMounted } from 'vue';
import LabelDesigner from '../components/LabelDesigner/index.vue';
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next';
import {
  loadTemplatesFromStorage,
  saveTemplatesToStorage,
  createId
} from '@/utils/templateStore.js';

// 视图：'dashboard' | 'editor'
const currentView = ref('dashboard');

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

const activeTemplate = ref(null);
const templatesList = ref([]);
const editSnapshot = ref('');

const loadTemplates = () => {
  templatesList.value = loadTemplatesFromStorage();
};

const saveToLocal = () => {
  saveTemplatesToStorage(templatesList.value);
};

const isEditorDirty = () => {
  if (!activeTemplate.value) return false;
  return JSON.stringify(activeTemplate.value) !== editSnapshot.value;
};

const handleEdit = (template) => {
  activeTemplate.value = JSON.parse(JSON.stringify(template));
  editSnapshot.value = JSON.stringify(activeTemplate.value);
  currentView.value = 'editor';
};

const handleCreate = () => {
  activeTemplate.value = {
    id: createId('tpl'),
    name: '新建自定义模板',
    width: 250,
    height: 175,
    data: []
  };
  editSnapshot.value = JSON.stringify(activeTemplate.value);
  currentView.value = 'editor';
};

const handleDelete = (id, e) => {
  e.stopPropagation();
  const confirm = DialogPlugin.confirm({
    header: '警告',
    body: '确定要删除此标签模板吗？此操作不可撤销。',
    theme: 'danger',
    onConfirm: () => {
      templatesList.value = templatesList.value.filter(item => item.id !== id);
      saveToLocal();
      MessagePlugin.success('模板删除成功');
      confirm.destroy();
    }
  });
};

const handleSave = (savedTpl) => {
  const targetIndex = templatesList.value.findIndex(item => item.id === activeTemplate.value.id);
  const finalTpl = {
    ...activeTemplate.value,
    ...savedTpl
  };
  if (targetIndex > -1) {
    templatesList.value[targetIndex] = finalTpl;
  } else {
    templatesList.value.push(finalTpl);
  }
  saveToLocal();
  MessagePlugin.success('模板已保存');
  currentView.value = 'dashboard';
  activeTemplate.value = null;
  editSnapshot.value = '';
};

const leaveEditor = () => {
  currentView.value = 'dashboard';
  activeTemplate.value = null;
  editSnapshot.value = '';
};

const handleClose = () => {
  if (!isEditorDirty()) {
    leaveEditor();
    return;
  }
  const confirm = DialogPlugin.confirm({
    header: '未保存的修改',
    body: '当前模板有未保存的修改，确定返回并丢弃吗？',
    theme: 'warning',
    onConfirm: () => {
      leaveEditor();
      confirm.destroy();
    }
  });
};

const getMiniLabelStyle = (width, height) => {
  const maxW = 180;
  const maxH = 110;
  const scale = Math.min(maxW / width, maxH / height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  return {
    width: `${w}px`,
    height: `${h}px`
  };
};

onMounted(() => {
  loadTemplates();
});
</script>

<template>
  <div class="template-manage-page">
    <!-- 仪表盘视图 -->
    <div v-if="currentView === 'dashboard'" class="dashboard-warp">
      <div class="dashboard-header">
        <div class="header-title">
          <t-icon name="dashboard" size="24px" style="color: #0052d9;" />
          <h2>商品标签设计器模板管理库</h2>
        </div>
        <t-button theme="primary" size="large" @click="handleCreate">
          <template #icon><t-icon name="add" /></template>
          创建全新标签模板
        </t-button>
      </div>

      <div class="templates-grid">
        <div
          v-for="item in templatesList"
          :key="item.id"
          class="template-card"
          @click="handleEdit(item)"
        >
          <div class="card-preview">
            <div class="mini-label-box" :style="getMiniLabelStyle(item.width, item.height)">
              <span class="preview-text">尺寸: {{ item.width / 5 }} x {{ item.height / 5 }} mm</span>
              <span class="preview-count">包含物料: {{ item.data?.length || 0 }} 个</span>
            </div>
          </div>
          <div class="card-info">
            <div class="card-name">{{ item.name }}</div>
            <div class="card-actions">
              <t-button variant="text" theme="primary" @click.stop="handleEdit(item)">
                <template #icon><t-icon name="edit" /></template>
                编辑设计
              </t-button>
              <t-button variant="text" theme="danger" @click.stop="handleDelete(item.id, $event)">
                <template #icon><t-icon name="delete" /></template>
                删除
              </t-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑器视图 -->
    <div v-if="currentView === 'editor'" class="editor-view-container">
      <div class="editor-back-nav">
        <t-button variant="outline" theme="default" @click="handleClose">
          <template #icon><t-icon name="chevron-left" /></template>
          返回模板库
        </t-button>
        <div class="template-editing-name">
          正在编辑: <strong>{{ activeTemplate.name }}</strong>
        </div>
        <t-input
          v-model="activeTemplate.name"
          placeholder="修改模板名称"
          style="width: 250px; margin-left: 20px;"
        />
      </div>
      <div class="editor-mount-wrapper">
        <LabelDesigner
          v-model="activeTemplate"
          :variables="variables"
          @save="handleSave"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.template-manage-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.dashboard-warp {
  width: 100%;
  height: 100%;
  padding: 30px;
  overflow-y: auto;
  box-sizing: border-box;

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    border-bottom: 2px solid #e7e7e7;
    padding-bottom: 20px;

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      h2 {
        margin: 0;
        font-size: 20px;
        color: #333;
      }
    }
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 25px;

    .template-card {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid #e7e7e7;
      display: flex;
      flex-direction: column;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0, 82, 217, 0.1);
        border-color: #0052d9;
      }

      .card-preview {
        height: 160px;
        background-color: #fafafa;
        display: flex;
        align-items: center;
        justify-content: center;
        border-bottom: 1px solid #eee;
        overflow: hidden;

        .mini-label-box {
          background-color: white;
          border: 1px dashed #bbb;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          border-radius: 3px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
          box-sizing: border-box;
          gap: 6px;

          .preview-text {
            font-size: 11px;
            color: #666;
          }
          .preview-count {
            font-size: 10px;
            background-color: #f3f3f3;
            color: #999;
            padding: 2px 6px;
            border-radius: 10px;
          }
        }
      }

      .card-info {
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex-grow: 1;

        .card-name {
          font-weight: bold;
          font-size: 14px;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-actions {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #f3f3f3;
          padding-top: 10px;
          margin-top: auto;
        }
      }
    }
  }
}

.editor-view-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .editor-back-nav {
    height: 52px;
    background-color: white;
    border-bottom: 1px solid #e7e7e7;
    display: flex;
    align-items: center;
    padding: 0 20px;
    box-sizing: border-box;
    z-index: 100;

    .template-editing-name {
      margin-left: 20px;
      font-size: 13px;
      color: #666;
      strong {
        color: #333;
        font-size: 14px;
      }
    }
  }

  .editor-mount-wrapper {
    flex-grow: 1;
    height: calc(100% - 52px);
    overflow: hidden;
  }
}
</style>
