import {
  DATA_FOR_ATTRIBUTE,
  DATA_FOR_NO_DATA_SLOT_NAME,
  DATA_IF_ATTRIBUTE,
  DATA_IF_FALSE_CONDITION_SLOT_NAME,
  DATA_IF_TRUE_CONDITION_SLOT_NAME,
  MODEL_CHAIN_PREFIX,
  MODEL_KEY,
  PSK_CARDINAL_PREFIX,
  SKIP_BINDING_FOR_COMPONENTS,
  TRANSLATION_CHAIN_PREFIX,
} from '../../constants';
import {
  bindElementAttributes,
  bindElementChangeToModel,
  createDomMap,
  diffDomMap,
  getSlots,
  isAttributePresentOnElement,
  removeElementChildNodes,
  removeSlotInfoFromElement,
} from '../../utils';
import ControllerNodeValueBindingService from '../ControllerNodeValueBindingService';

import type { BindElementOptions } from './binding-service-utils';
import { isElementNode, isTextNode, setElementModel } from './binding-service-utils';

function handleDataIfAttributePresence(
  element: Element,
  { model, translationModel, chainPrefix, enableTranslations = false }: BindElementOptions = {
    model: null,
    translationModel: null,
  },
) {
  let conditionChain = element.getAttribute(DATA_IF_ATTRIBUTE);
  if (!conditionChain.startsWith(MODEL_CHAIN_PREFIX)) {
    console.warn(`Attribute "${DATA_IF_ATTRIBUTE}" doesn't start with the chain prefix!`);
    return;
  }

  conditionChain = conditionChain.slice(1);
  const completeConditionChain = chainPrefix ? [chainPrefix, conditionChain].filter(String).join('.') : conditionChain;

  const children = Array.from(element.children);

  let conditionValue;
  let trueSlotElements: ChildNode[] = getSlots(children, DATA_IF_TRUE_CONDITION_SLOT_NAME);
  const falseSlotElements = getSlots(children, DATA_IF_FALSE_CONDITION_SLOT_NAME);

  if (!trueSlotElements.length && !falseSlotElements.length) {
    trueSlotElements = Array.from(element.childNodes);
  }

  removeElementChildNodes(element);

  const setVisibleContent = () => {
    const visibleSlots = conditionValue ? trueSlotElements : falseSlotElements;
    removeElementChildNodes(element);
    visibleSlots.forEach(slot => {
      const slotElement = slot.cloneNode(true) as HTMLElement;
      removeSlotInfoFromElement(slotElement);

      element.appendChild(slotElement);

      BindingService.bindElement(slotElement, {
        model,
        translationModel,
        chainPrefix,
        enableTranslations,
        recursive: true,
      });
    });
  };

  const setExtractedConditionValue = async extractedConditionValue => {
    let value;
    if (extractedConditionValue instanceof Promise) {
      try {
        value = await extractedConditionValue;
      } catch (error) {
        console.error('data-if condition promise failed', error);
        value = false;
      }
    } else {
      value = !!extractedConditionValue; // ensure we have a boolean value
    }

    // the value has changed so the visible content must be updated
    const mustUpdateVisibleContent = conditionValue !== value;
    conditionValue = value;
    if (mustUpdateVisibleContent) {
      setVisibleContent();
    }
  };

  setExtractedConditionValue(model.getChainValue(completeConditionChain));

  // initial binding
  //   bindElementChangeToModel(element, model, completeConditionChain);
  bindElementAttributes(element, model, MODEL_CHAIN_PREFIX, chainPrefix);
  if (enableTranslations) {
    bindElementAttributes(element, translationModel, TRANSLATION_CHAIN_PREFIX, chainPrefix);
  }

  model.onChange(completeConditionChain, () => {
    setExtractedConditionValue(model.getChainValue(completeConditionChain));
  });

  if (model.hasExpression(completeConditionChain)) {
    setExtractedConditionValue(model.evaluateExpression(completeConditionChain));

    model.onChangeExpressionChain(completeConditionChain, () => {
      setExtractedConditionValue(model.evaluateExpression(completeConditionChain));
    });
  }
}

function handleDataForAttributePresence(
  element: Element,
  { model, translationModel, chainPrefix, enableTranslations = false }: BindElementOptions = {
    model: null,
    translationModel: null,
  },
) {
  let dataForAttributeChain = element.getAttribute(DATA_FOR_ATTRIBUTE);
  if (!dataForAttributeChain.startsWith(MODEL_CHAIN_PREFIX)) {
    console.warn(`Attribute "${DATA_FOR_ATTRIBUTE}" doesn't start with the chain prefix!`);
    return;
  }

  dataForAttributeChain = dataForAttributeChain.slice(1);
  const completeChain = chainPrefix
    ? [chainPrefix, dataForAttributeChain].filter(String).join('.')
    : dataForAttributeChain;

  const dataForAttributeModelValue = model.getChainValue(completeChain);

  if (!Array.isArray(dataForAttributeModelValue)) {
    console.error(`Attribute "${DATA_FOR_ATTRIBUTE}" must be an array in the model!`);
    return;
  }

  const noDatatemplates = [];
  const templates: ChildNode[] = [];
  while (element.childNodes.length > 0) {
    const firstChild = element.childNodes[0];
    if (isElementNode(firstChild) && (firstChild as Element).getAttribute('slot') === DATA_FOR_NO_DATA_SLOT_NAME) {
      noDatatemplates.push(firstChild);
    } else {
      templates.push(firstChild);
    }

    firstChild.remove();
  }

  const existingNodes = [];
  const renderTemplate = () => {
    dataForAttributeModelValue.forEach((modelElement, modelElementIndex) => {
      const updatedNodes = [];

      templates.forEach(templateNode => {
        const childElement = templateNode.cloneNode(true) as HTMLElement;
        const modelElementChainPrefix = [completeChain, modelElementIndex].filter(String).join('.');

        BindingService.bindElement(childElement, {
          model,
          translationModel,
          chainPrefix: modelElementChainPrefix,
          enableTranslations,
          recursive: true,
        });
        updatedNodes.push(childElement);
      });

      if (existingNodes[modelElementIndex]) {
        // we have existing nodes that we need to update
        updatedNodes.forEach((element, index) => {
          const updatedElement = document.createElement('div');
          updatedElement.appendChild(element);

          const existingElement = document.createElement('div');
          existingElement.appendChild(existingNodes[modelElementIndex][index].cloneNode(true) as HTMLElement);

          const templateMap = createDomMap(updatedElement);
          const domMap = createDomMap(existingElement);
          diffDomMap(templateMap, domMap, existingNodes[modelElementIndex][index]);
        });
      } else {
        updatedNodes.forEach(childElement => {
          element.appendChild(childElement);
        });
      }

      existingNodes[modelElementIndex] = updatedNodes;
    });
  };

  renderTemplate();

  // initial binding
  //   bindElementChangeToModel(element, model, completeChain);
  bindElementAttributes(element, model, MODEL_CHAIN_PREFIX, chainPrefix);
  if (enableTranslations) {
    bindElementAttributes(element, translationModel, TRANSLATION_CHAIN_PREFIX, chainPrefix);
  }

  model.onChange(completeChain, () => {
    // todo: further optimize the rendering by checking exactly which element of the array triggered the change
    renderTemplate();
  });

  if (model.hasExpression(completeChain)) {
    model.onChangeExpressionChain(completeChain, () => {
      renderTemplate();
    });
  }
}

const BindingService = {
  bindElement: (
    element: Element,
    options: BindElementOptions = {
      model: null,
      translationModel: null,
    },
  ) => {
    const { model, translationModel, chainPrefix, enableTranslations = false, recursive = false } = options;
    if (!model) {
      const tagName = isElementNode(element) ? element.tagName.toLowerCase() : 'text node';
      console.warn(`No model found for: ${tagName}!`);
      return;
    }

    if (isTextNode(element)) {
      ControllerNodeValueBindingService.bindNodeValue(element, model, translationModel, chainPrefix);
      return;
    }

    if (isElementNode(element)) {
      // for some webc-<components> binding is managed by component itself
      if (SKIP_BINDING_FOR_COMPONENTS.includes(element.tagName.toLowerCase())) {
        return;
      }

      if (isAttributePresentOnElement(element, DATA_IF_ATTRIBUTE)) {
        handleDataIfAttributePresence(element, options);
        return;
      } else if (isAttributePresentOnElement(element, DATA_FOR_ATTRIBUTE)) {
        handleDataForAttributePresence(element, options);
        return;
      }

      // for psk-<components> @BindModel decorator is design for this task
      if (!element.tagName.startsWith(PSK_CARDINAL_PREFIX.toUpperCase())) {
        if (element.getAttribute(MODEL_KEY)) {
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
          const completeChain = chainPrefix ? [chainPrefix, chain].filter(String).join('.') : chain;

          // initial binding
          setElementModel(element, model, completeChain);
          bindElementChangeToModel(element, model, completeChain);

          // onChange
          model.onChange(completeChain, () => setElementModel(element, model, completeChain));

          // onChangeExpressionChain
          if (model.hasExpression(completeChain)) {
            model.onChangeExpressionChain(completeChain, () => setElementModel(element, model, completeChain));
          }
        }

        bindElementAttributes(element, model, MODEL_CHAIN_PREFIX, chainPrefix);
      }

      if (enableTranslations) {
        bindElementAttributes(element, translationModel, TRANSLATION_CHAIN_PREFIX, chainPrefix);
      }

      Array.from(element.childNodes)
        .filter(isTextNode)
        .forEach(node => {
          ControllerNodeValueBindingService.bindNodeValue(node, model, translationModel, chainPrefix);
        });

      if (recursive) {
        Array.from(element.children).forEach(child => {
          BindingService.bindElement(child, options);
        });
      }
    }
  },
};

export default BindingService;
