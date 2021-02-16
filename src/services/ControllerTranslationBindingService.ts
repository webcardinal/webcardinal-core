import {
  TRANSLATION_CHAIN_PREFIX,
  SKIP_BINDING_FOR_COMPONENTS,
} from '../constants';
import { bindElementAttributes } from '../utils';

const ControllerTranslationBindingService = {
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

      // bind attributes
      bindElementAttributes(target, model, TRANSLATION_CHAIN_PREFIX);

      if (target.children) {
        ControllerTranslationBindingService.bindRecursive(target, model);
      }
    }
  },
};

export default ControllerTranslationBindingService;
