const isNativeProperty = (key) => {
  return [
    'value',
    'innerText',
    'innerHTML'
  ].includes(key);
}

const getModelKeys = (node: Element) => {
  const keys = node.getAttribute('model').split('.');
  if (keys[0].startsWith('@')) {
    keys[0] = keys[0].slice(1);
  }
  return keys
}

const getBondedModel = (model, keys) => {
  if (keys.length > 1) {
    return getBondedModel(model[keys[0]], keys.slice(1));
  }
  return model[keys[0]];
}

const ControllerBindableService = {
  bindModel: (node: Element, controller: any) => {
    for (let i = 0; i < node.children.length; i++) {
      let child = node.children[i];

      if (child.getAttribute('model')) {
        const { model: controllerModel } = controller;
        const keys = getModelKeys(child);
        const model = getBondedModel(controllerModel, keys);

        for (let [key, value] of Object.entries(model)) {
          if (typeof value === 'object') {
            continue;
          }

          if (typeof value === 'boolean') {
            if (value) {
              child.setAttribute(key, '');
            } else {
              child.removeAttribute(key);
            }
            continue;
          }

          if (isNativeProperty(key)) {
            child[key] = value;
            continue;
          }

          if (typeof value !== 'string') {
            continue;
          }

          if (key === 'class') {
            child.classList.add(value);
            continue;
          }

          child.setAttribute(key, value);
        }
      }

      if (child.children) {
        ControllerBindableService.bindModel(child, controller);
      }
    }
  }
}

export default ControllerBindableService;
