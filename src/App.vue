<script setup lang="jsx">
import { ref, onMounted } from 'vue';
import LabelDesigner from './components/LabelDesigner/index.vue';
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next';

// Injected dynamic parameters available for bindings
const variables = ref([
  { key: 'asset_num', label: '资产编号' },
  { key: 'asset_name', label: '资产名称' },
  { key: 'specification', label: '规格型号' },
  { key: 'use_dept', label: '使用部门' },
  { key: 'storage_place', label: '存放地点' }
]);

// Selection states
const activeTemplate = ref(null);
const isEditing = ref(false);
const templatesList = ref([]);

// Default fallback templates
const defaultTemplates = [
  {
    id: 'asset-tag-default',
    name: '资产管理常规标签 (50x35mm)',
    width: 500,
    height: 350,
    data: [
      {
        id: 'title-text-0',
        name: 'customText',
        type: 'TextUi',
        title: '固定资产标签',
        instance: true,
        position: { clientX: 300, clientY: 100 },
        default: { width: 460, height: 35, x: 20, y: 15 },
        props: {
          text: '固定资产设备卡片',
          align: 'center',
          fontFamily: '',
          fontSize: '18px',
          isBold: true,
          hasBorder: false
        }
      },
      {
        id: 'asset-num-var',
        name: 'customText',
        type: 'TextUi',
        title: '资产编号',
        instance: true,
        position: { clientX: 300, clientY: 150 },
        default: { width: 280, height: 25, x: 20, y: 70 },
        props: {
          text: '资产编号：${asset_num}',
          align: 'left',
          fontFamily: '',
          fontSize: '13px',
          isBold: false,
          hasBorder: false
        }
      },
      {
        id: 'asset-name-var',
        name: 'customText',
        type: 'TextUi',
        title: '资产名称',
        instance: true,
        position: { clientX: 300, clientY: 180 },
        default: { width: 280, height: 25, x: 20, y: 105 },
        props: {
          text: '资产名称：${asset_name}',
          align: 'left',
          fontFamily: '',
          fontSize: '13px',
          isBold: false,
          hasBorder: false
        }
      },
      {
        id: 'asset-place-var',
        name: 'customText',
        type: 'TextUi',
        title: '存放地点',
        instance: true,
        position: { clientX: 300, clientY: 210 },
        default: { width: 280, height: 25, x: 20, y: 140 },
        props: {
          text: '使用地点：${storage_place}',
          align: 'left',
          fontFamily: '',
          fontSize: '13px',
          isBold: false,
          hasBorder: false
        }
      },
      {
        id: 'barcode-el-0',
        name: 'barCode',
        type: 'BarcodeUi',
        title: '条码',
        instance: true,
        position: { clientX: 300, clientY: 260 },
        default: { width: 280, height: 75, x: 20, y: 190 },
        props: {
          format: 'CODE128',
          lineWidth: 2,
          bodyHeight: 40,
          fontSize: 12,
          displayValue: '1',
          data: '12345678'
        }
      },
      {
        id: 'qrcode-el-0',
        name: 'qrCode',
        type: 'QrCodeUi',
        title: '二维码',
        instance: true,
        position: { clientX: 600, clientY: 200 },
        default: { width: 140, height: 140, x: 330, y: 70 },
        props: {
          data: 'https://shixiaoxi.cn/',
          options: { margin: 2, scale: 4, errorCorrectionLevel: 'H' }
        }
      },
      {
        id: 'divider-line',
        name: 'xLine',
        type: 'XLineUi',
        title: '分隔线',
        instance: true,
        position: { clientX: 300, clientY: 240 },
        default: { width: 460, height: 1, x: 20, y: 60 },
        props: { width: 460, height: 1, lineType: 'solid' }
      }
    ]
  }
];

const loadTemplates = () => {
  const local = localStorage.getItem('label_templates_v3');
  if (local) {
    try {
      const list = JSON.parse(local);
      // 防御性修复：确保加载出来的每个模板都有唯一的 id，防止历史测试中的脏数据导致 id 为 undefined 产生冲突
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

const saveToLocal = () => {
  localStorage.setItem('label_templates_v3', JSON.stringify(templatesList.value));
};

const handleEdit = (template) => {
  activeTemplate.value = JSON.parse(JSON.stringify(template));
  isEditing.value = true;
};

const handleCreate = () => {
  activeTemplate.value = {
    id: `tpl-${Date.now()}`,
    name: '新建自定义模板',
    width: 500,
    height: 350,
    data: []
  };
  isEditing.value = true;
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
  MessagePlugin.success('保存模板并持久化成功！');
  isEditing.value = false;
  activeTemplate.value = null;
};

const handleClose = () => {
  isEditing.value = false;
  activeTemplate.value = null;
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
  <div class="app-container">
    <!-- Template dashboard view -->
    <div v-if="!isEditing" class="dashboard-warp">
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
              <span class="preview-text">尺寸: {{ item.width / 10 }} x {{ item.height / 10 }} mm</span>
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

    <!-- Active editor view -->
    <div v-else class="editor-view-container">
      <div class="editor-back-nav">
        <t-button variant="outline" theme="default" @click="handleClose">
          <template #icon><t-icon name="chevron-left" /></template>
          返回模板库首页
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
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f5;
  box-sizing: border-box;
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
