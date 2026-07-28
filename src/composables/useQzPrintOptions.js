import { ref, computed, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { connectQz, listPrinters, isQzConnected } from '@/utils/qzClient.js';

/**
 * QZ Tray 打印方式、打印机列表与连接状态（设备打印 / 设计器预览共用）
 */
export function useQzPrintOptions(getActive = () => true) {
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
    if (val.startsWith('qz') && getActive()) {
      refreshQzPrinters({ silent: true });
    }
  });

  const onDialogOpen = () => {
    if (printAdapter.value.startsWith('qz')) {
      refreshQzPrinters({ silent: true });
    }
  };

  return {
    printAdapter,
    printerList,
    selectedPrinter,
    qzConnecting,
    qzConnected,
    qzStatusText,
    refreshQzPrinters,
    onDialogOpen
  };
}
