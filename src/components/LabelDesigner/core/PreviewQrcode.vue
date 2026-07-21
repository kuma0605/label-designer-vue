<script setup>
import { ref, onMounted, watch } from 'vue';
import { replaceVars, generateQrcodeDataUrl } from '@/utils/preview';

const props = defineProps({
  component: { type: Object, required: true },
  variables: { type: Object, default: () => ({}) }
});

const qrSrc = ref('');

// 生成二维码：先替换占位符，再调 qrcode 生成图片
const renderQrcode = async () => {
  const { props: cProps } = props.component;

  // 替换占位符得到真实数据
  const rawData = replaceVars(cProps.data, props.variables);

  if (!rawData) {
    qrSrc.value = '';
    return;
  }

  try {
    qrSrc.value = await generateQrcodeDataUrl(rawData, cProps.options || {});
  } catch (e) {
    console.error('Preview QR code render failed:', e);
    qrSrc.value = '';
  }
};

onMounted(renderQrcode);
// 数据变化时重新生成
watch(
  () => [props.variables, props.component.props.data],
  renderQrcode,
  { deep: true }
);
</script>

<template>
  <div class="qr-code-wrap">
    <img
      v-if="qrSrc"
      class="qr-code"
      :src="qrSrc"
      alt="qrcode"
      draggable="false"
    />
  </div>
</template>

<style scoped>
.qr-code-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.qr-code {
  max-width: 100%;
  max-height: 100%;
  vertical-align: middle;
  user-select: none;
}
</style>
