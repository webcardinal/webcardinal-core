import {
  IF_ATTRIBUTE,
  IF_FALSE_CONDITION_SLOT_NAME,
  IF_LOADIBNG_SLOT_NAME,
  IF_NO_DATA_SLOT_NAME,
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

  enum types {
    TRUE = 'webcardinal:data-if:true',
    FALSE = 'webcardinal:data-if:false',
    LOADING = 'webcardinal:data-if:loading',
    NO_DATA = 'webcardinal:data-if:no-data'
  }

  let conditionValue: string | undefined = 'webcardinal:data-if:first-render';
  let trueSlotElements: ChildNode[];
  trueSlotElements = getSlots(children, IF_TRUE_CONDITION_SLOT_NAME);
  const falseSlotElements = getSlots(children, IF_FALSE_CONDITION_SLOT_NAME);
  const loadingSlotElements = getSlots(children, IF_LOADIBNG_SLOT_NAME);
  const noDataSlotElements = getSlots(children, IF_NO_DATA_SLOT_NAME);

  const slottedElements = [trueSlotElements, falseSlotElements, loadingSlotElements, noDataSlotElements].find(elements => elements.length > 0)
  if (!slottedElements) {
    trueSlotElements = Array.from(element.childNodes);
  }

  removeElementChildNodes(element, model);

  const parseConditionValue = async (value: unknown): Promise<string> => {
    switch (typeof value) {
      case 'boolean':
        return value ? types.TRUE : types.FALSE;
      case "number":
        return Number.isNaN(value) ? types.FALSE : types.TRUE;
      case "string":
        return value.length === 0 ? types.FALSE : types.TRUE;
      case 'object': {
        // parse Promises/Async functions
        if (value instanceof Promise) {
          try {
            // set loading state before promise awaiting
            conditionValue = types.LOADING;
            setVisibleContent();

            return parseConditionValue(await value);
          } catch (error) {
            console.error('data-if condition async function failed!', error);
            return types.LOADING;
          }
        }

        // check for null
        if (value === null) {
          return types.FALSE;
        }

        // parse Arrays
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return types.NO_DATA;
          }
          return types.TRUE;
        }

        // parse Objects
        if (Object.keys(value).length === 0) {
          return types.NO_DATA;
        }

        return types.TRUE;
      }
      case "undefined":
        return types.LOADING;
      default:
        return types.TRUE;
    }
  };

  const setVisibleContent = () => {
    let visibleSlots;
    switch (conditionValue) {
      // for slot="no-data" fallback is slot="true"
      case types.NO_DATA: {
        if (noDataSlotElements.length === 0) {
          visibleSlots = trueSlotElements;
          break;
        }
        visibleSlots = noDataSlotElements;
        break;
      }
      // for slot="loading" fallback is slot="false"
      case types.LOADING: {
        if (loadingSlotElements.length === 0) {
          visibleSlots = falseSlotElements;
          break;
        }
        visibleSlots = loadingSlotElements;
        break;
      }
      case types.FALSE: {
        visibleSlots = falseSlotElements;
        break;
      }
      default:
        visibleSlots = trueSlotElements;
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
