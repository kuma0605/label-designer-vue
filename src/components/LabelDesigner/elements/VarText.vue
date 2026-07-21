<script setup>
import { computed } from 'vue';
import { getStringVars } from '@/utils/index.js';

const props = defineProps({
  text: {
    type: String,
    default: ''
  }
});

const textData = computed(() => {
  return getStringVars(props.text);
});
</script>

<template>
  <span class="var-text-wrap">
    <template v-for="(item, index) in textData" :key="index">
      <span v-if="!item.key">{{ item.value }}</span>
      <span v-else class="var" :data-field-key="item.key">{{ item.value }}</span>
    </template>
  </span>
</template>

<style lang="scss">
.var-text-wrap {
  .var {
    cursor: pointer;
    color: #0052d9;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
