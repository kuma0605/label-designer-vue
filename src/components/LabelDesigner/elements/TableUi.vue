<script setup>
import { computed, onMounted } from 'vue';
import { actions, state } from '../store/designerState.js';

const props = defineProps({
  elementId: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: false
  },
  borderStyle: {
    type: String,
    default: 'solid'
  },
  tableData: {
    type: Array,
    default() {
      return [];
    }
  }
});

const emit = defineEmits(['complete']);

const getItemStyle = computed(() => {
  return {
    '--table-border-style': props.borderStyle || 'solid'
  };
});

onMounted(() => {
  emit('complete');
});

const onKeyChange = (e, oldKey) => {
  const newKey = e.target.innerText.trim();
  if (newKey && newKey !== oldKey) {
    actions.setTableColumnKey(oldKey, newKey);
  }
};

const onValueChange = (e, key, index) => {
  const value = e.target.innerText;
  actions.setTableRowValue(key, value, index);
};

const handleAddRow = (index) => {
  const active = state.storeList.find((item) => item.id === props.elementId);
  if (active && active.props.tableData.length) {
    const item = active.props.tableData[0];
    const row = {};
    for (const key in item) {
      row[key] = '';
    }
    active.props.tableData.splice(index + 1, 0, row);
  }
};

const handleRemoveRow = (index) => {
  actions.removeTableRow(index);
};

const handleAddColumn = (index) => {
  actions.addTableColumn(index);
};

const handleRemoveColumn = (key) => {
  actions.removeTableColumn(key);
};
</script>

<template>
  <div class="table-wrap" :style="getItemStyle">
    <table class="w-100 table-wrap__table" border="0" cellspacing="1px" cellpadding="0" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th v-for="(item, key, index) in tableData[0]" :key="index">
            <div class="table-wrap__th">
              <p contenteditable="true" @blur="onKeyChange($event, key)">{{ key }}</p>
              <t-popup
                v-if="isActive"
                placement="right"
                trigger="click"
              >
                <template #content>
                  <div class="func-list">
                    <div class="item" @click.stop="handleAddColumn(index)">插入列</div>
                    <div class="item" @click.stop="handleRemoveColumn(key)">删除列</div>
                  </div>
                </template>
                <div class="table-wrap__add"></div>
              </t-popup>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in tableData" :key="index" class="table-wrap__tr">
          <td v-for="(child, itemKey, itemIndex) in item" :key="itemIndex">
            <div class="table-wrap__td">
              <span contenteditable="true" @blur="onValueChange($event, itemKey, index)">{{ item[itemKey] }}</span>
              <t-popup
                v-if="isActive"
                placement="right"
                trigger="click"
              >
                <template #content>
                  <div class="func-list">
                    <div class="item" @click.stop="handleAddRow(index)">插入行</div>
                    <div class="item" @click.stop="handleRemoveRow(index)">删除行</div>
                  </div>
                </template>
                <div class="table-wrap__insert" />
              </t-popup>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="table-wrap__place" />
  </div>
</template>

<style lang="scss">
.func-list {
  padding: 5px 0;
  .item {
    line-height: 32px;
    cursor: pointer;
    padding: 0 15px;
    font-size: 12px;
    color: #333;
    &:hover {
      color: #0052d9;
      background-color: #f3f3f3;
    }
  }
}
.table-wrap {
  width: 100%;
  --table-border-color: #000;
  position: relative;

  &__place {
    height: 30px;
  }
  &__tr {
    position: relative;
  }
  &__insert {
    width: 100%;
    height: 3px;
    background-color: #0052d9;
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 100;
    cursor: pointer;
    opacity: 0.2;
    &:hover {
      opacity: 1;
      height: 5px;
    }
  }

  &__add {
    position: absolute;
    top: 0;
    right: -2px;
    z-index: 100;
    width: 3px;
    height: 100%;
    background-color: #0052d9;
    cursor: pointer;
    opacity: 0.2;
    &:hover {
      opacity: 1;
      width: 5px;
    }
  }
  th {
    p {
      margin: 0;
      min-width: 30px;
      outline: none;
    }
    .table-wrap__th {
      padding: 6px 10px;
      position: relative;
      border: 1px var(--table-border-style) var(--table-border-color);
      border-right: 0;
      background-color: #fafafa;
    }
    &:last-child {
      .table-wrap__th {
        border-right: 1px var(--table-border-style) var(--table-border-color);
      }
    }
  }
  td {
    span {
      display: inline-block;
      width: 100%;
      min-height: 20px;
      outline: none;
    }
    .table-wrap__td {
      padding: 6px 10px;
      position: relative;
      border: 1px var(--table-border-style) var(--table-border-color);
      border-top: 0;
      border-right: 0;
    }
    &:last-child {
      .table-wrap__td {
        border-right: 1px var(--table-border-style) var(--table-border-color);
      }
    }
  }
}
</style>
