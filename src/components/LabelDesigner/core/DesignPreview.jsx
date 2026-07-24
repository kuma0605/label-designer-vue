import { defineComponent } from 'vue';
import { checkLine } from '@/utils';
import PreviewText from './PreviewText.vue';
import PreviewBarcode from './PreviewBarcode.vue';
import PreviewQrcode from './PreviewQrcode.vue';
import PreviewTable from './PreviewTable.vue';

export default defineComponent({
  name: 'DesignPreview',
  components: {
    PreviewText,
    PreviewBarcode,
    PreviewQrcode,
    PreviewTable
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
      const isText = typeof type === 'string' && type.includes('Text');
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
      const isLine = checkLine(type);
      const isText = typeof type === 'string' && type.includes('Text');

      // 优先使用模板存储的实际画布尺寸与位置 (defaultRect.width / height, position.clientX / clientY)
      const width = defaultRect?.width ?? rect?.width ?? 100;
      const height = defaultRect?.height ?? rect?.height ?? 30;

      const topVal = position?.clientY ?? defaultRect?.y ?? 0;
      const leftVal = position?.clientX ?? defaultRect?.x ?? 0;

      // 与画布 Drag.vue 对齐：普通组件 1px 透明边框；线/矩形无边框。
      // 排版样式只给文本——表格若继承 line-height:1.5 会改变行高，导致绝对定位的矩形与行线错开。
      const style = {
        top: topVal + 'px',
        left: leftVal + 'px',
        width: width + 'px',
        height: height + 'px',
        padding: '0',
        position: 'absolute',
        boxSizing: 'border-box',
        border: isLine ? 'none' : '1px solid transparent'
      };

      if (isText) {
        style.fontSize = formatFontSize(fontSize);
        style.fontFamily = fontFamily;
        style.lineHeight = lineHeight || '1.5';
        style.textAlign = align;
        style.fontWeight = isBold ? 'bold' : 'normal';
      }

      return style;
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
        case 'table':
          return (
            <div class="table-wrap" style={{ width: '100%', height: '100%' }}>
              <PreviewTable {...sharedProps} />
            </div>
          );
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
      const width = props.template.width || options.width || 500;
      const height = props.template.height || options.height || 350;
      return (
        <div
          class="template-wrap"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            position: 'relative',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            boxSizing: 'border-box'
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
