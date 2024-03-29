import {
  FOR_ATTRIBUTE,
  FOR_NO_DATA_SLOT_NAME,
  MODEL_CHAIN_PREFIX,
  TRANSLATION_CHAIN_PREFIX,
  FOR_OPTIONS,
  FOR_OPTIMISTIC,
  FOR_WRAPPER_RERENDER,
  FOR_EVENTS,
  FOR_CONTENT_REPLACED_EVENT,
  FOR_CONTENT_UPDATED_EVENT,
  FOR_LOADIBNG_SLOT_NAME,
} from '../../constants';
import {
  bindElementAttributes,
  createDomMap,
  diffDomMap,
  getCompleteChain,
  listenForPrefixChainEvents,
  removeChangeHandler,
  removeElementChildNodes,
  removeSlotInfoFromElement,
  setElementChainChangeHandler,
  setElementExpressionChangeHandler,
} from '../../utils';

import type { BindElementOptions } from './binding-service-utils';
import { isElementNode } from './binding-service-utils';

function getForOptions(element: Element) {
  return (element.getAttribute(FOR_OPTIONS) || '').split(' ').filter(String);
}

function isForSlot(node: ChildNode, slot: string) {
  return isElementNode(node) && (node as Element).getAttribute('slot') === slot;
}

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
  const forOptions = getForOptions(element);
  const areEventsActivated = forOptions.includes(FOR_EVENTS);
  const isOptimisticMode = forOptions.includes(FOR_OPTIMISTIC);
  const isWrapperRerenderMode = forOptions.includes(FOR_WRAPPER_RERENDER);
  const noDataTemplates = [];
  const loadingTemplates = [];
  const templates: ChildNode[] = [];

  let dataForAttributeModelValue, dataForAttributeModelValueLength;
  let existingNodes = [];

  const updateDataForAttributeModel = newValue => {
    if (Array.isArray(newValue)) {
      dataForAttributeModelValue = newValue;
      dataForAttributeModelValueLength = newValue.length;
    } else {
      dataForAttributeModelValue = undefined;
      dataForAttributeModelValueLength = -1;
    }
  };

  const renderSlotFromTemplate = slots => {
    slots.forEach(templateNode => {
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
  };

  const renderTemplate = () => {
    if (dataForAttributeModelValueLength === -1) {
      removeElementChildNodes(element, model);
      renderSlotFromTemplate(loadingTemplates);
      return;
    }

    if (dataForAttributeModelValueLength === 0) {
      removeElementChildNodes(element, model);
      renderSlotFromTemplate(noDataTemplates);
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
        removeElementChildNodes(node, model);
        node.remove();
      });
    }
    existingNodes.splice(dataForAttributeModelValueLength);
  };

  const updateAndRenderTemplate = (newValue, forceRefresh = false) => {
    const newLength = Array.isArray(newValue) ? newValue.length : -1;
    const hasContentLengthChanged = dataForAttributeModelValueLength !== newLength;

    updateDataForAttributeModel(newValue);

    if (isOptimisticMode) {
      // in optimistic mode there is no need to cleanup the existing content,
      // since there is an optimized comparison process that is being executed instead
      renderTemplate();

      if (areEventsActivated) {
        element.dispatchEvent(
          new CustomEvent(FOR_CONTENT_UPDATED_EVENT, {
            bubbles: true,
            cancelable: true,
            composed: true,
          }),
        );
      }
      return;
    }

    if (forceRefresh || hasContentLengthChanged) {
      // if we have a force refresh or the length of the list has changed,
      // then we will cleanup the existing content and recreated it from scratch
      // to make sure there are no leftover content/binding that could generate issues
      removeElementChildNodes(element, model);
      existingNodes = [];
      renderTemplate();

      if (areEventsActivated) {
        element.dispatchEvent(
          new CustomEvent(FOR_CONTENT_REPLACED_EVENT, {
            bubbles: true,
            cancelable: true,
            composed: true,
          }),
        );
      }
      return;
    }
  };

  const modelChangeHandler = ({ targetChain }) => {
    // if completeChain === targetChain then it means the array has been changed by an array method (e.g. splice)
    const forceRefresh = completeChain === targetChain;
    updateAndRenderTemplate(model.getChainValue(completeChain), forceRefresh);
  };

  updateDataForAttributeModel(model.getChainValue(completeChain));

  // Event delegation: Custom handling on the parent instead of using ComponentsListenerService for each child
  listenForPrefixChainEvents(element, completeChain);

  // fill all template arrays: templates, loadingTemplates, noDataTemplates
  while (element.childNodes.length > 0) {
    const child = element.childNodes[0];
    if (isForSlot(child, FOR_NO_DATA_SLOT_NAME)) {
      noDataTemplates.push(child);
    } else if (isForSlot(child, FOR_LOADIBNG_SLOT_NAME)) {
      loadingTemplates.push(child);
    } else {
      templates.push(child);
    }
    removeChangeHandler(child, model);
    child.remove();
  }

  renderTemplate();

  // initial binding
  bindElementAttributes(element, model, MODEL_CHAIN_PREFIX, chainPrefix);
  if (enableTranslations) {
    bindElementAttributes(element, translationModel, TRANSLATION_CHAIN_PREFIX, chainPrefix);
  }

  model.onChange(completeChain, modelChangeHandler);
  setElementChainChangeHandler(element, completeChain, modelChangeHandler);

  if (model.hasExpression(completeChain)) {
    const expressionChangeHandler = () => {
      updateAndRenderTemplate(model.evaluateExpression(completeChain));
    };

    model.onChangeExpressionChain(completeChain, expressionChangeHandler);
    setElementExpressionChangeHandler(element, completeChain, expressionChangeHandler);
  }
}
