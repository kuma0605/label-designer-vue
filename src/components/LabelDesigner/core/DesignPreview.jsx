import { defineComponent } from 'vue';
import { checkLine } from '@/utils';
import PreviewText from './PreviewText.vue';
import PreviewBarcode from './PreviewBarcode.vue';
import PreviewQrcode from './PreviewQrcode.vue';

export default defineComponent({
  name: 'DesignPreview',
  components: {
    PreviewText,
    PreviewBarcode,
    PreviewQrcode
  },
  props: {
    template: {
      type: Object,
      required: true
    },
    // 真实数据，用于替换模板中的 ${key} 占位符
    // 格式: { asset_num: 'ZC-001', asset_name: '联想笔记本', ... }
    variables: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const formatFontSize = (fontSize) => {
      if (!fontSize) return '14px';
      const str = String(fontSize);
      return str.includes('px') ? str : `${str}px`;
    };

    const getSelfStyle = (component) => {
      const style = {};
      const { props: cProps, type } = component;
      const {
        width,
        fontSize,
        align,
        borderWidth = '1',
        lineHeight,
        isBold,
        hasBorder,
        height,
        lineType = 'solid'
      } = cProps;

      const isXLine = type === 'XLineUi';
      const isYLine = type === 'YLineUi';
      const isBarcode = type === 'BarcodeUi';
      const isText = type.includes('Text');
      const isRectangle = type === 'RectangleUi';

      if (isXLine) {
        style.width = '100%';
        style.borderTop = `${height}px`;
        if (lineType === 'solid') {
          style.height = `${height}px`;
          style.backgroundColor = '#000';
        } else if (lineType === 'dashed') {
          style.borderTop = `${height}px ${lineType} #000`;
        }
      } else if (isYLine) {
        style.width = `${width}px`;
        style.minHeight = '100%';
        if (lineType === 'solid') {
          style.backgroundColor = '#000';
        } else if (lineType === 'dashed') {
          style.borderLeft = `${width}px ${lineType} #000`;
        }
      } else if (isBarcode) {
        style.fontSize = formatFontSize(fontSize);
      } else if (isText) {
        style.textAlign = align;
        style.fontSize = formatFontSize(fontSize);
        style.lineHeight = lineHeight || '1.5';
        style.border = hasBorder ? '1px solid #000' : '1px solid transparent';
        style.fontWeight = isBold ? 'bold' : 'normal';
      } else if (isRectangle) {
        style.border = `${borderWidth}px ${lineType} #000`;
      }
      return style;
    };

    const getContainerStyle = (component) => {
      const { props: cProps = {}, position, rect, default: defaultRect, type } = component;
      const { fontSize, fontFamily, lineHeight, align, isBold } = cProps;
      const fontWeight = isBold ? 'bold' : 'normal';
      const isLine = checkLine(type);
      // 优先用 rect（编辑态实时计算），否则 fallback 到 default（模板存储的尺寸）
      const width = rect?.width ?? defaultRect?.width ?? 100;
      const height = rect?.height ?? defaultRect?.height ?? 30;

      const topVal = position?.clientY ?? defaultRect?.y ?? 0;
      const leftVal = position?.clientX ?? defaultRect?.x ?? 0;

      return {
        fontSize: formatFontSize(fontSize),
        fontFamily,
        lineHeight: lineHeight || '1.5',
        textAlign: align,
        top: topVal + 'px',
        left: leftVal + 'px',
        fontWeight,
        width: width + 'px',
        height: height + 'px',
        padding: isLine ? '0' : '0 10px 0 0',
        position: 'absolute',
        boxSizing: 'border-box'
      };
    };

    const renderContent = (component) => {
      const selfStyle = getSelfStyle(component);
      const sharedProps = {
        component: component,
        variables: props.variables
      };

      switch (component.name) {
        case 'barCode':
          return (
            <div
              class="barcode-wrap"
              style={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
              }}
            >
              <PreviewBarcode {...sharedProps} />
            </div>
          );
        case 'qrCode':
          return (
            <div class="qr-code-wrap" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <PreviewQrcode {...sharedProps} />
            </div>
          );
        case 'xLine':
          return <div class="x-line-wrap" style={selfStyle} />;
        case 'yLine':
          return <div class="y-line-wrap" style={selfStyle} />;
        case 'rectangle':
          return <div class="rectangle-wrap" style={{ ...selfStyle, width: '100%', height: '100%' }} />;
        default:
          // Custom Text
          return (
            <div
              class="detail"
              style={{ ...selfStyle, width: '100%', height: '100%' }}
            >
              <PreviewText {...sharedProps} />
            </div>
          );
      }
    };

    return () => {
      const { data = [], options = {} } = props.template;
      return (
        <div
          class="template-wrap"
          style={{
            width: `${options.width || 500}px`,
            height: `${options.height || 500}px`,
            position: 'relative',
            backgroundColor: '#ffffff'
          }}
        >
          {data.map((component) => (
            <div
              key={component.id}
              id={component.id}
              class="component"
              style={getContainerStyle(component)}
            >
              {renderContent(component)}
            </div>
          ))}
        </div>
      );
    };
  }
});
