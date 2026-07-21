<script setup>
import { ref } from 'vue'
import LabelDesigner from './components/LabelDesigner/index.vue'

const variables = ref([
  { key: 'asset_num', label: '资产编号' },
  { key: 'asset_name', label: '资产名称' },
  { key: 'asset_type', label: '资产分类' },
  { key: 'department', label: '使用部门' },
  { key: 'user_name', label: '使用人' },
  { key: 'purchase_date', label: '购入日期' },
])

const templateData = ref({
  name: "资产标签默认模板",
  width: 500,
  height: 350,
  data: [
    {
      id: "txt1",
      name: "customText",
      type: "TextUi",
      classify: "TextMenu",
      title: "固定文本",
      instance: true,
      tag: "span",
      updateId: "1",
      position: { clientX: 20, clientY: 20 },
      variable: { enable: false, textData: [] },
      default: { width: 120, height: 30, x: 20, y: 20 },
      props: {
        text: "资产标签",
        align: "left",
        fontSize: "20px",
        lineHeight: "1.5",
        isBold: true,
        hasBorder: false
      },
      rect: { x: 20, y: 20, width: 120, height: 30, top: 20, left: 20 }
    },
    {
      id: "txt2",
      name: "customText",
      type: "TextUi",
      classify: "TextMenu",
      title: "变量文本",
      instance: true,
      tag: "span",
      updateId: "2",
      position: { clientX: 20, clientY: 70 },
      variable: {
        enable: true,
        textData: [
          { value: "资产编号：", key: "" },
          { value: "${asset_num}", key: "asset_num" }
        ]
      },
      default: { width: 250, height: 30, x: 20, y: 70 },
      props: {
        text: "资产编号：${asset_num}",
        align: "left",
        fontSize: "14px",
        lineHeight: "1.5",
        isBold: false,
        hasBorder: false
      },
      rect: { x: 20, y: 70, width: 250, height: 30, top: 70, left: 20 }
    }
  ]
})

const handleSave = (data) => {
  console.log("保存模板 JSON 数据:", data)
}
</script>

<template>
  <div class="demo-container">
    <LabelDesigner 
      v-model="templateData" 
      :variables="variables" 
      @save="handleSave"
    />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f5f5f5;
}
.demo-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
