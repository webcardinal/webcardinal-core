import {
  IF_ATTRIBUTE,
  IF_FALSE_CONDITION_SLOT_NAME,
  IF_LOADIBNG_SLOT_NAME,
  IF_TRUE_CONDITION_SLOT_NAME,
  MODEL_CHAIN_PREFIX,
  TRANSLATION_CHAIN_PREFIX,
} from '../../constants';
import {
  bindElementAttributes,
  getCompleteChain,
  getSlots,
  removeElementChildNodes,
  removeSlotInfoFromElement,
  setElementChainChangeHandler,
  setElementExpressionChangeHandler,
} from '../../utils';

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
  const completeConditionChain = getCompleteChain(chainPrefix, conditionChain);

  const children = Array.from(element.children);

  let conditionValue: string | boolean | undefined = 'webcardinal:data-if:undefined';

  let trueSlotElements: ChildNode[] = getSlots(children, IF_TRUE_CONDITION_SLOT_NAME);
  const falseSlotElements = getSlots(children, IF_FALSE_CONDITION_SLOT_NAME);
  const loadingSlotElements = getSlots(children, IF_LOADIBNG_SLOT_NAME);

  if (!trueSlotElements.length && !falseSlotElements.length) {
    trueSlotElements = Array.from(element.childNodes);
  }

  removeElementChildNodes(element, model);

  const parseConditionValue = async (value: unknown): Promise<boolean | undefined> => {
    switch (typeof value) {
      case 'boolean':
        return value;
      case 'object': {
        if (value instanceof Promise) {
          try {
            // set loading state before promise awaiting
            conditionValue = undefined;
            setVisibleContent();

            return await value;
          } catch (error) {
            console.error('data-if condition async function failed!', error);
          }
        }
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const setVisibleContent = () => {
    let visibleSlots;
    switch (conditionValue) {
      case true:
        visibleSlots = trueSlotElements;
        break;
      case false:
        visibleSlots = falseSlotElements;
        break;
      default:
        visibleSlots = loadingSlotElements;
      }

    removeElementChildNodes(element, model);

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
    const value = await parseConditionValue(extractedConditionValue);

    // the value has changed so the visible content must be updated
    const mustUpdateVisibleContent = conditionValue !== value;
    conditionValue = value;

    if (mustUpdateVisibleContent) {
      setVisibleContent();
    }
  };

  setExtractedConditionValue(model.getChainValue(completeConditionChain));

  bindElementAttributes(element, model, MODEL_CHAIN_PREFIX, chainPrefix);

  if (enableTranslations) {
    bindElementAttributes(element, translationModel, TRANSLATION_CHAIN_PREFIX, chainPrefix);
  }

  if (model.hasExpression(completeConditionChain)) {
    setExtractedConditionValue(model.evaluateExpression(completeConditionChain));
    const expressionChangeHandler = () => {
      setExtractedConditionValue(model.evaluateExpression(completeConditionChain));
    };
    model.onChangeExpressionChain(completeConditionChain, expressionChangeHandler);
    setElementExpressionChangeHandler(element, completeConditionChain, expressionChangeHandler);
  } else {
    const chainChangeHandler = () => {
      setExtractedConditionValue(model.getChainValue(completeConditionChain));
    };
    model.onChange(completeConditionChain, chainChangeHandler);
    setElementChainChangeHandler(element, completeConditionChain, chainChangeHandler);
  }
}
