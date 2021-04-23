import {
  FOR_ATTRIBUTE,
  FOR_NO_DATA_SLOT_NAME,
  MODEL_CHAIN_PREFIX,
  TRANSLATION_CHAIN_PREFIX,
  FOR_OPTIONS,
  FOR_OPTIMISTIC,
  FOR_WRAPPER_RERENDER,
} from '../../constants';
import {
  bindElementAttributes,
  createDomMap,
  diffDomMap,
  getCompleteChain,
  removeElementChildNodes,
  removeSlotInfoFromElement,
} from '../../utils';

import type { BindElementOptions } from './binding-service-utils';
import { isElementNode } from './binding-service-utils';

export function handleDataForAttributePresence(
  element: Element,
  bindElement: (element: Element | ChildNode, options: BindElementOptions) => void,
  { model, translationModel, chainPrefix, enableTranslations = false }: BindElementOptions = {
    model: null,
    translationModel: null,
  },
) {
  let dataForAttributeChain = element.getAttribute(FOR_ATTRIBUTE);
  if (!dataForAttributeChain.startsWith(MODEL_CHAIN_PREFIX)) {
    console.warn(`Attribute "${FOR_ATTRIBUTE}" doesn't start with the chain prefix!`);
    return;
  }

  dataForAttributeChain = dataForAttributeChain.slice(1);
  const completeChain = getCompleteChain(chainPrefix, dataForAttributeChain);

  let dataForAttributeModelValue = model.getChainValue(completeChain);
  if (!Array.isArray(dataForAttributeModelValue)) {
    console.error(
      `Attribute "${FOR_ATTRIBUTE}" (${dataForAttributeChain}) must be a chain to an array in the model!`,
      element,
    );
    return;
  }

  let dataForAttributeModelValueLength = dataForAttributeModelValue.length;

  const forOptions = (element.getAttribute(FOR_OPTIONS) || '').split(' ').filter(String);

  const isOptimisticMode = forOptions.includes(FOR_OPTIMISTIC);
  let isWrapperRerenderMode = forOptions.includes(FOR_WRAPPER_RERENDER);

  const noDataTemplates = [];
  const templates: ChildNode[] = [];

  while (element.childNodes.length > 0) {
    const firstChild = element.childNodes[0];
    if (isElementNode(firstChild) && (firstChild as Element).getAttribute('slot') === FOR_NO_DATA_SLOT_NAME) {
      noDataTemplates.push(firstChild);
    } else {
      templates.push(firstChild);
    }

    firstChild.remove();
  }

  let existingNodes = [];

  const renderTemplate = () => {
    if (!dataForAttributeModelValueLength) {
      removeElementChildNodes(element);
      noDataTemplates.forEach(templateNode => {
        const childElement = templateNode.cloneNode(true) as HTMLElement;
        // when nesting multiple data-for attributes, the inner slots will have the hidden property set automatically
        removeSlotInfoFromElement(childElement);

        element.appendChild(childElement);
        bindElement(childElement, {
          model,
          translationModel,
          chainPrefix: chainPrefix,
          enableTranslations,
          recursive: true,
        });
      });
      return;
    }

    if (isWrapperRerenderMode) {
      const wrapper = document.createElement(element.tagName);
      const attributes = Array.prototype.slice.call(element.attributes);
      let attribute;
      while ((attribute = attributes.pop())) {
        if (attribute.nodeName === FOR_OPTIONS) continue;
        wrapper.setAttribute(attribute.nodeName, attribute.nodeValue);
      }
      if (forOptions.length > 0) {
        wrapper.setAttribute(FOR_OPTIONS, forOptions.join(' '));
      }
      element.insertAdjacentElement('afterend', wrapper);
      element.remove();
      element = wrapper;
    }

    dataForAttributeModelValue.forEach((_modelElement, modelElementIndex) => {
      const updatedNodes = [];

      templates.forEach(templateNode => {
        const childElement = templateNode.cloneNode(true) as HTMLElement;
        const modelElementChainPrefix = getCompleteChain(completeChain, modelElementIndex);

        bindElement(childElement, {
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
          const existingElement = document.createElement('div');
          existingElement.appendChild(existingNodes[modelElementIndex][index].cloneNode(true) as HTMLElement);

          const templateMap = createDomMap(element);
          const domMap = createDomMap(existingNodes[modelElementIndex][index]);
          diffDomMap(templateMap, domMap, existingNodes[modelElementIndex][index]);
        });
      } else {
        updatedNodes.forEach(childElement => {
          element.appendChild(childElement);
        });
        existingNodes[modelElementIndex] = updatedNodes;
      }
    });

    // remove any leftover existingNodes
    for (let index = dataForAttributeModelValueLength; index < existingNodes.length; index++) {
      const nodes = existingNodes[index];
      nodes.forEach(node => {
        removeElementChildNodes(node);
        node.remove();
      });
    }
    existingNodes.splice(dataForAttributeModelValueLength);
  };

  const updateAndRenderTemplate = (newValue, forceRefresh = false) => {
    if (!Array.isArray(newValue)) {
      console.error(`Attribute "${FOR_ATTRIBUTE}" must be an array in the model!`);
      newValue = [];
    }

    newValue = newValue || [];
    const hasContentLengthChanged = dataForAttributeModelValueLength !== newValue.length;

    dataForAttributeModelValue = newValue;
    dataForAttributeModelValueLength = dataForAttributeModelValue.length;

    if (isOptimisticMode) {
      // in optimistic mode there is no need to cleanup the existing content,
      // since there is an optimized comparison process that is being executed instead
      renderTemplate();
      return;
    }

    if (forceRefresh || hasContentLengthChanged) {
      // if we have a force refresh or the length of the list has changed,
      // then we will cleanup the existing content and recreated it from scratch
      // to make sure there are no leftover content/binding that could generate issues
      removeElementChildNodes(element);
      existingNodes = [];
      renderTemplate();
    }
  };

  renderTemplate();

  // initial binding
  //   bindElementChangeToModel(element, model, completeChain);
  bindElementAttributes(element, model, MODEL_CHAIN_PREFIX, chainPrefix);
  if (enableTranslations) {
    bindElementAttributes(element, translationModel, TRANSLATION_CHAIN_PREFIX, chainPrefix);
  }

  model.onChange(completeChain, ({ targetChain }) => {
    // if completeChain === targetChain then it means the array has been changed by an array method (e.g. splice)
    const forceRefresh = completeChain === targetChain;
    updateAndRenderTemplate(model.getChainValue(completeChain), forceRefresh);
  });

  if (model.hasExpression(completeChain)) {
    model.onChangeExpressionChain(completeChain, () => {
      updateAndRenderTemplate(model.evaluateExpression(completeChain));
    });
  }
}
