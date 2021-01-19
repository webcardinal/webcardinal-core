function isNativeProperty(key) {
  return [
    'value',
    'innerText',
    'innerHTML'
  ].includes(key);
}

function setElementModel(element, model, chain) {
  const setElementValue = ({ key, value }) => {
    if (typeof value === 'object') {
      return;
    }

    if (typeof value === 'boolean') {
      if (value) {
        element.setAttribute(key, '');
      } else {
        element.removeAttribute(key);
      }
      return;
    }

    if (isNativeProperty(key)) {
      element[key] = value;
      return;
    }

    if (typeof value !== 'string') {
      return;
    }

    if (key === 'class') {
      element.classList.add(value);
      return;
    }

    element.setAttribute(key, value);
  }

  // model
  const targetModel = model.getChainValue(chain);
  if (targetModel) {
    for (let [key, value] of Object.entries(targetModel)) {
      setElementValue({ key, value });
    }
  }

  // expressions
  if (model.hasExpression(chain)) {
    const targetModel = model.evaluateExpression(chain);
    for (let [key, value] of Object.entries(targetModel)) {
      setElementValue({ key, value });
    }
  }
}

const ControllerBindingService = {
  bindModel: (element: Element, controller: any) => {
    if (!controller.model) {
      return;
    }

    const { model } = controller;
    for (let i = 0; i < element.children.length; i++) {
      const target = element.children[i];

      if (target.getAttribute('model')) {
        const chain = target.getAttribute('model');
        setElementModel(target, model, chain);

        model.onChange(chain, _ => setElementModel(target, model, chain));

        if (model.hasExpression(chain)) {
          model.onChangeExpressionChain(chain, _ => setElementModel(target, model, chain));
        }
      }

      if (target.children) {
        ControllerBindingService.bindModel(target, controller);
      }
    }
  }
}

export default ControllerBindingService;
