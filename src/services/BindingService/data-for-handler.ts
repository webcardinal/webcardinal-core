import {
  FOR_ATTRIBUTE,
  FOR_NO_DATA_SLOT_NAME,
  MODEL_CHAIN_PREFIX,
  TRANSLATION_CHAIN_PREFIX,
} from '../../constants';
import {
  bindElementAttributes,
  createDomMap,
  diffDomMap,
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
  const completeChain = chainPrefix
    ? [chainPrefix, dataForAttributeChain].filter(Boolean).join('.')
    : dataForAttributeChain;

  let dataForAttributeModelValue = model.getChainValue(completeChain);
  let dataForAttributeModelValueLength = dataForAttributeModelValue.length;

  if (!Array.isArray(dataForAttributeModelValue)) {
    console.error(`Attribute "${FOR_ATTRIBUTE}" must be an array in the model!`);
    return;
  }

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

    dataForAttributeModelValue.forEach((_modelElement, modelElementIndex) => {
      const updatedNodes = [];

      templates.forEach(templateNode => {
        const childElement = templateNode.cloneNode(true) as HTMLElement;
        const modelElementChainPrefix = [completeChain, modelElementIndex].filter(Boolean).join('.');

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

  const updateAndRenderTemplate = newValue => {
    if (!Array.isArray(newValue)) {
      console.error(`Attribute "${FOR_ATTRIBUTE}" must be an array in the model!`);
      newValue = [];
    }

    newValue = newValue || [];

    const hasContentLengthChanged = dataForAttributeModelValueLength !== newValue.length;
    if (hasContentLengthChanged) {
      removeElementChildNodes(element);
      existingNodes = [];
    }

    dataForAttributeModelValue = newValue;
    dataForAttributeModelValueLength = dataForAttributeModelValue.length;

    renderTemplate();
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
    updateAndRenderTemplate(model.getChainValue(completeChain));
  });

  if (model.hasExpression(completeChain)) {
    model.onChangeExpressionChain(completeChain, () => {
      updateAndRenderTemplate(model.evaluateExpression(completeChain));
    });
  }
}
