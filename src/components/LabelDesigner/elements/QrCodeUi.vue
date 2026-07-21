<script setup>
import { onMounted, watch, ref } from 'vue';
import QrCode from 'qrcode';

const props = defineProps({
  elementId: {
    type: String,
    default: '',
  },
  options: {
    type: Object,
    default() {
      return {};
    }
  },
  data: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['complete']);
const qrDataUrl = ref('');

const renderQrcode = () => {
  const { data, options } = props;
  if (!data) return;
  const config = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'H',
    margin: options.margin || 4,
    scale: options.scale || 4,
    type: 'image/jpeg',
    color: {}
  };
  QrCode.toDataURL(data, config, (err, res) => {
    if (err) {
      console.error('QR Code render error:', err);
      return;
    }
    qrDataUrl.value = res;
  });
};

watch(
  () => [props.data, props.options],
  () => {
    renderQrcode();
  },
  { deep: true, flush: 'post' }
);

onMounted(() => {
  renderQrcode();
  emit('complete');
});
</script>

<template>
  <div class="qr-code-wrap">
    <img
      :class="['qr-code', elementId]"
      :src="qrDataUrl"
      alt="qrcode"
      draggable="false"
    />
  </div>
</template>

<style lang="scss">
.qr-code-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  .qr-code {
    max-width: 100%;
    max-height: 100%;
    vertical-align: middle;
    user-select: none;
  }
}
</style>
