import { setElementValue } from '../../utils';

export interface BindElementOptions {
  model: any;
  translationModel: any;
  chainPrefix?: string;
  enableTranslations?: boolean;
  recursive?: boolean;
}

export function setElementModel(element, model, chain) {
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

export function isElementNode(node: ChildNode) {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function isTextNode(node: ChildNode) {
  return node.nodeType === Node.TEXT_NODE && node.nodeValue && node.nodeValue.trim();
}
