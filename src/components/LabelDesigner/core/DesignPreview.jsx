import { defineComponent } from 'vue';
import { checkLine } from '@/utils';

export default defineComponent({
  name: 'DesignPreview',
  props: {
    template: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const getFields = (component) => {
      return component.variable?.enable
        ? component.variable.textData
            .filter((item) => item.key)
            .map((item) => item.key)
            .join('')
        : null;
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
        style.fontSize = fontSize ? (fontSize.includes('px') ? fontSize : fontSize + 'px') : '14px';
      } else if (isText) {
        style.textAlign = align;
        style.fontSize = fontSize ? (fontSize.includes('px') ? fontSize : fontSize + 'px') : '14px';
        style.lineHeight = lineHeight || '1.5';
        style.border = hasBorder ? '1px solid #000' : '1px solid transparent';
        style.fontWeight = isBold ? 'bold' : 'normal';
      } else if (isRectangle) {
        style.border = `${borderWidth}px ${lineType} #000`;
      }
      return style;
    };

    const getContainerStyle = (component) => {
      const { props: cProps = {}, position, rect, type } = component;
      const { fontSize, fontFamily, lineHeight, align, isBold } = cProps;
      const fontWeight = isBold ? 'bold' : 'normal';
      const isLine = checkLine(type);

      return {
        fontSize: fontSize ? (fontSize.includes('px') ? fontSize : fontSize + 'px') : '14px',
        fontFamily,
        lineHeight: lineHeight || '1.5',
        textAlign: align,
        top: position.clientY + 'px',
        left: position.clientX + 'px',
        fontWeight,
        width: rect.width + 'px',
        height: rect.height + 'px',
        padding: isLine ? '0' : '0 10px 0 0',
        position: 'absolute',
        boxSizing: 'border-box'
      };
    };

    const renderText = (component) => {
      let result = '';
      const { variable } = component;
      if (variable && variable.enable) {
        component.variable.textData.forEach((item) => {
          result += `<span class="${item.key}">${item.value || ''}</span>`;
        });
      } else {
        result = component.props.text || component.props.data || '';
      }
      return result;
    };

    const renderBarcode = (component) => {
      const fields = getFields(component);
      const style = getSelfStyle(component);

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
          <img
            class={['barcode', component.id, component.type]}
            style={{ ...style, width: '100%', height: 'auto' }}
            alt="barcode"
            draggable="false"
          />
          {component.props.displayValue === '1' && (
            <p
              class="barcode-text"
              style={style}
              data-fields={fields}
              v-html={renderText(component)}
            />
          )}
        </div>
      );
    };

    const renderQrcode = (component) => {
      return (
        <div class="qr-code-wrap" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img
            class={['qr-code', component.id]}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              verticalAlign: 'middle',
              userSelect: 'none'
            }}
            alt="qrcode"
            draggable="false"
            data-fields={getFields(component)}
          />
        </div>
      );
    };

    const renderHorizontalLine = (component) => {
      return (
        <div
          class="x-line-wrap"
          style={getSelfStyle(component)}
        />
      );
    };

    const renderVerticalLine = (component) => {
      return (
        <div
          class="y-line-wrap"
          style={getSelfStyle(component)}
        />
      );
    };

    const renderRectangle = (component) => {
      return (
        <div
          class="rectangle-wrap"
          style={{ ...getSelfStyle(component), width: '100%', height: '100%' }}
        />
      );
    };

    const generateWidget = (component) => {
      const isLine = checkLine(component.type);

      const renderContent = () => {
        switch (component.name) {
          case 'barCode':
            return renderBarcode(component);
          case 'qrCode':
            return renderQrcode(component);
          case 'xLine':
            return renderHorizontalLine(component);
          case 'yLine':
            return renderVerticalLine(component);
          case 'rectangle':
            return renderRectangle(component);
          default:
            // Custom Text
            return (
              <div
                class="detail"
                style={{ ...getSelfStyle(component), width: '100%', height: '100%' }}
                data-fields={getFields(component)}
              >
                <span
                  class={[component.id, component.type]}
                  v-html={renderText(component)}
                />
              </div>
            );
        }
      };

      return (
        <div
          id={component.id}
          key={component.id}
          class="component"
          style={getContainerStyle(component)}
        >
          {renderContent()}
        </div>
      );
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
          {data.map((component) => generateWidget(component))}
        </div>
      );
    };
  }
});
