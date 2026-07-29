/** 匹配 $_{key}；兼容历史 ${key} */
const VAR_TOKEN_REG = /\$_\{(.+?)\}|\$\{(.+?)\}/g;

export function getStringVars(text) {
  const data = String(text);
  const all = data.match(VAR_TOKEN_REG) || [];
  const getVarIndexes = (firstIndex, value) => {
    const arr = [];
    for (let i = 0; i < value.length; i++) {
      arr.push(firstIndex + i);
    }
    return arr;
  };
  const vars = all.map((item) => {
    const string = String(item);
    const key = string
      .replace('$_{', '')
      .replace('${', '')
      .replace('}', '');
    return {
      value: string,
      key,
      indexes: getVarIndexes(data.indexOf(string), string)
    };
  });
  return text.split('').reduce((total, item, index) => {
    const textItem = {
      value: item,
      key: '',
      indexes: index
    };
    const varItem = vars.find((v) => v.indexes.includes(textItem.indexes));
    if (!varItem) {
      total.push(textItem);
    } else if (total.findIndex((t) => t.value === varItem.value) < 0) {
      total.push(varItem);
    }
    return total;
  }, []);
}

export function checkLine(type) {
  return type === 'XLineUi' || type === 'YLineUi' || type === 'RectangleUi';
}
