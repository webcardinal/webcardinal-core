import {
  MODEL_KEY,
  MODEL_CHAIN_PREFIX,
  SKIP_BINDING_FOR_COMPONENTS,
} from '../constants';
import { bindElementAttributes, setElementValue } from '../utils';

function setElementModel(element, model, chain) {
  // model
  const targetModel = model.getChainValue(chain);
  if (targetModel) {
    for (const [key, value] of Object.entries(targetModel)) {
      setElementValue(element, { key, value });
    }

    if (targetModel._saveElement === true) {
      // ensure that each of element's methods have the correct context attached,
      // because the model proxy doesn't set the context accordingly
      for (const property in element) {
        if (typeof element[property] === 'function') {
          element[property] = element[property].bind(element);
        }
      }

      if (!targetModel.getElement) {
        // we first the getElement function only on the initialization step in order to not generate useless model change events
        // which can lead to infinite loops
        model.setChainValue(chain, {
          ...targetModel,
          getElement: () => element,
        });
      }
    }
  }

  // expressions
  if (model.hasExpression(chain)) {
    const targetModel = model.evaluateExpression(chain);
    for (const [key, value] of Object.entries(targetModel)) {
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
    // for some webc-<components> binding is managed by component itself
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
    // for some webc-<components> binding is managed by component itself
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
        `target element:`,
        element,
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
      model.onChangeExpressionChain(chain, _ =>
        setElementModel(element, model, chain),
      );
    }
  },

  /**
   * @description - Binds all attributes for an Element
   * @param element
   * @param model - Object in which the specified chain (<attribute>="@chain") is searched
   */
  bindAttributes: (element: Element, model) => {
    bindElementAttributes(element, model);
  },
};

export default ControllerBindingService;
