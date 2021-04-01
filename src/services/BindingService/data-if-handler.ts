import {
  IF_ATTRIBUTE,
  IF_FALSE_CONDITION_SLOT_NAME,
  IF_TRUE_CONDITION_SLOT_NAME,
  MODEL_CHAIN_PREFIX,
  TRANSLATION_CHAIN_PREFIX,
} from '../../constants';
import { bindElementAttributes, getSlots, removeElementChildNodes, removeSlotInfoFromElement } from '../../utils';

import type { BindElementOptions } from './binding-service-utils';

export function handleDataIfAttributePresence(
  element: Element,
  bindElement: (element: Element | ChildNode, options: BindElementOptions) => void,
  { model, translationModel, chainPrefix, enableTranslations = false }: BindElementOptions = {
    model: null,
    translationModel: null,
  },
) {
  let conditionChain = element.getAttribute(IF_ATTRIBUTE);
  if (!conditionChain.startsWith(MODEL_CHAIN_PREFIX)) {
    console.warn(`Attribute "${IF_ATTRIBUTE}" doesn't start with the chain prefix!`);
    return;
  }

  conditionChain = conditionChain.slice(1);
  const completeConditionChain = chainPrefix ? [chainPrefix, conditionChain].filter(Boolean).join('.') : conditionChain;

  const children = Array.from(element.children);

  let conditionValue;
  let trueSlotElements: ChildNode[] = getSlots(children, IF_TRUE_CONDITION_SLOT_NAME);
  const falseSlotElements = getSlots(children, IF_FALSE_CONDITION_SLOT_NAME);

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

      bindElement(slotElement, {
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
