import QrCode from 'qrcode';

export function updateQrcode(id, data, options) {
  const config = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    margin: options.margin || 4,
    scale: options.scale || 4,
    type: 'image/jpeg',
    color: {}
  };
  QrCode.toDataURL(data, config, (err, res) => {
    if (err) throw err;
    const element = document.querySelector('.' + id);
    if (element) {
      element.src = res;
    }
  });
}
