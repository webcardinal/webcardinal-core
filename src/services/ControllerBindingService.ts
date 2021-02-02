import {
  MODEL_KEY,
  MODEL_CHAIN_PREFIX,
  SKIP_BINDING_FOR_PROPERTIES,
  SKIP_BINDING_FOR_COMPONENTS,
  PSK_CARDINAL_PREFIX
} from '../constants';

function isNativeProperty(key) {
  return [
    'value',
    'innerText',
    'innerHTML'
  ].includes(key);
}

function setElementValue(element, { key, value }) {
  if (SKIP_BINDING_FOR_PROPERTIES.includes(key)) {
    return;
  }

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

function setElementModel(element, model, chain) {
  // model
  const targetModel = model.getChainValue(chain);
  if (targetModel) {
    for (let [key, value] of Object.entries(targetModel)) {
      setElementValue(element, { key, value });
    }

    if (targetModel.element === true) {
      // ensure that each of element's methods have the correct context attached, because the model proxy doesn't set the context accordingly
      for (const property in element) {
        if (typeof element[property] === "function") {
          element[property] = element[property].bind(element);
        }
      }
      model.setChainValue(chain, {
        ...targetModel,
        element
      });
    }
  }

  // expressions
  if (model.hasExpression(chain)) {
    const targetModel = model.evaluateExpression(chain);
    for (let [key, value] of Object.entries(targetModel)) {
      setElementValue(element, { key, value });
    }
  }
}

const ControllerBindingService = {
  /**
   * @description - Binds all attributes and values from the model for any child of the element
   * @param element
   * @param model
   */
  bindRecursive: (element: Element, model) => {
    const tagName = element.tagName.toLowerCase();
    if (!model) {
      console.warn(`No model found for ${tagName}!`);
      return;
    }
    // for some wcc-<components> binding is managed by component itself
    if (SKIP_BINDING_FOR_COMPONENTS.includes(element.tagName.toLowerCase())) {
      return;
    }

    for (let i = 0; i < element.children.length; i++) {
      const target = element.children[i];

      // bind model
      ControllerBindingService.bindModel(target, model);

      // bind attributes
      ControllerBindingService.bindAttributes(target, model);

      if (target.children) {
        ControllerBindingService.bindRecursive(target, model);
      }
    }
  },

  /**
   * @description - Binds all values/properties from the specified model
   * @param element
   * @param model - Object in which the specified chain (model="@chain") is searched
   */
  bindModel: (element: Element, model) => {
    // for some wcc-<components> binding is managed by component itself
    if (SKIP_BINDING_FOR_COMPONENTS.includes(element.tagName.toLowerCase())) {
      return;
    }

    if (!element.getAttribute(MODEL_KEY)) {
      return;
    }

    let chain = element.getAttribute(MODEL_KEY);
    if (!chain.startsWith(MODEL_CHAIN_PREFIX)) {
      const tagName = element.tagName.toLowerCase();
      console.warn([
        `Invalid chain found for ${tagName} (chain: "${chain}")!`,
        `A valid chain must start with "${MODEL_CHAIN_PREFIX}".`
      ].join('\n'));
      return;
    }
    chain = chain.slice(1);

    element.removeAttribute(MODEL_KEY);

    // initial binding
    setElementModel(element, model, chain);

    // onChange
    model.onChange(chain, () => setElementModel(element, model, chain));

    // onChangeExpressionChain
    if (model.hasExpression(chain)) {
      model.onChangeExpressionChain(chain, _ => setElementModel(element, model, chain));
    }
  },

  /**
   * @description - Binds all attributes for an Element
   * @param element
   * @param model - Object in which the specified chain (<attribute>="@chain") is searched
   */
  bindAttributes: (element: Element, model) => {
    // for some wcc-<components> binding is managed by component itself
    if (SKIP_BINDING_FOR_COMPONENTS.includes(element.tagName.toLowerCase())) {
      return;
    }

    // for psk-<components> @BindModel decorator is design for this task
    if (element.tagName.startsWith(PSK_CARDINAL_PREFIX.toUpperCase())) {
      return;
    }

    for (let i = 0; i < element.attributes.length; i++) {
      let key = element.attributes[i].nodeName;
      let chain = element.attributes[i].nodeValue;

      if (key === MODEL_KEY) {
        continue;
      }

      if (!chain.startsWith(MODEL_CHAIN_PREFIX)) {
        continue;
      }
      chain = chain.slice(1);

      setElementValue(element, { key, value: model.getChainValue(chain) });

      model.onChange(chain, _ => {
        setElementValue(element, { key, value: model.getChainValue(chain) });
      });
    }
  }
}

export default ControllerBindingService;
