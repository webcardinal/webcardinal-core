import {
  MODEL_KEY,
  MODEL_CHAIN_PREFIX,
  SKIP_BINDING_FOR_PROPERTIES,
  SKIP_BINDING_FOR_COMPONENTS,
  PSK_CARDINAL_PREFIX
} from '../constants';

function isNativeProperty(key) {
  // these values are not visible as attributes over the HTMLElement
  return [
    'value',
    'innerText',
    'innerHTML'
  ].includes(key);
}

function shortcutToProperty(key) {
  switch (key) {
    case 'model':
      return 'data-model';
    case 'tag':
      return 'data-tag';
    case 'text':
      return 'innerText';
    case 'html':
      return 'innerHTML';
    default:
      return key;
  }
}

function setElementValue(element, { key, value }) {
  if (SKIP_BINDING_FOR_PROPERTIES.includes(key)) {
    return;
  }

  if (['innerHTML', 'innerText'].includes(key)) {
    console.warn(
      `Model property "${key}" can be short handed, try "${key.substr(5).toLowerCase()}" instead!\n`,
      `target element:`, element
    );
  }
  if (['data-tag', 'data-model'].includes(key)) {
    console.warn(
      `Model property "${key}" can be shorthanded, try "${key.substr(5)}" instead!\n`,
      `target model:`, element.getAttribute('data-model')
    );
  }

  key = shortcutToProperty(key);

  if (isNativeProperty(key)) {
    element[key] = value;
    return;
  }

  if (key === 'class') {
    if (value === '') {
      element.className = '';
      return;
    }

    if (typeof value === 'string') {
      element.classList.add(value);
      return;
    }

    if (typeof value === 'object') {
      for (const [className, active] of Object.entries(value)) {
        if (active) {
          element.classList.add(className);
        } else {
          element.classList.remove(className);
        }
      }
      return;
    }

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

  if (typeof value === 'string') {
    element.setAttribute(key, value);
    return;
  }

  if (typeof value === 'object') {
    element[key] = value;
    return;
  }
}

function setElementModel(element, model, chain) {
  // model
  const targetModel = model.getChainValue(chain);
  if (targetModel) {
    for (let [key, value] of Object.entries(targetModel)) {
      setElementValue(element, { key, value });
    }

    if (targetModel._saveElement === true) {
      // ensure that each of element's methods have the correct context attached,
      // because the model proxy doesn't set the context accordingly
      for (const property in element) {
        if (typeof element[property] === "function") {
          element[property] = element[property].bind(element);
        }
      }

      model.setChainValue(chain, {
        ...targetModel,
        getElement: () => element
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
      console.warn(
        `Invalid chain found! (chain: "${chain}")!\n`,
        `A valid chain must start with "${MODEL_CHAIN_PREFIX}".\n`,
        `target element:`, element
      );
      return;
    }
    chain = chain.slice(1);

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
};

export default ControllerBindingService;
