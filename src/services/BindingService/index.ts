import {
  TAG_ATTRIBUTE,
  TAG_MODEL_FUNCTION_PROPERTY,
  FOR_ATTRIBUTE,
  IF_ATTRIBUTE,
  MODEL_CHAIN_PREFIX,
  MODEL_KEY,
  VIEW_MODEL_KEY,
  PSK_CARDINAL_PREFIX,
  SKIP_BINDING_FOR_COMPONENTS,
  TRANSLATION_CHAIN_PREFIX,
  DISABLE_BINDING
} from '../../constants';
import {
  bindElementAttributes,
  bindElementChangeToModel,
  getCompleteChain,
  isAttributePresentOnElement, setElementChainChangeHandler, setElementExpressionChangeHandler,
} from '../../utils';

import type { BindElementOptions } from './binding-service-utils';
import { isElementNode, isTextNode, setElementModel } from './binding-service-utils';
import { handleDataForAttributePresence } from './data-for-handler';
import { handleDataIfAttributePresence } from './data-if-handler';
import { bindNodeValue } from './node-value-binding-utils';

const BindingService = {
  bindElement: (
    elementOrChildNode: Element | ChildNode,
    options: BindElementOptions = {
      model: null,
      translationModel: null,
    },
  ) => {
    const { model, translationModel, chainPrefix, enableTranslations = false, recursive = false } = options;
    if (!model) {
      const tagName = isElementNode(elementOrChildNode)
        ? (elementOrChildNode as Element).tagName.toLowerCase()
        : 'text node';
      console.warn(`No model found for: ${tagName}!`);
      return;
    }

    if (isTextNode(elementOrChildNode)) {
      bindNodeValue(elementOrChildNode, model, translationModel, chainPrefix);
      return;
    }

    if (isElementNode(elementOrChildNode)) {
      const element = elementOrChildNode as Element;
      // for some webc-<components> binding is managed by component itself
      //but let the attributes binding to pass
      if (SKIP_BINDING_FOR_COMPONENTS.includes(element.tagName.toLowerCase())) {
        return bindElementAttributes(element, model, MODEL_CHAIN_PREFIX, chainPrefix);
      }

      if (element.hasAttribute(TAG_ATTRIBUTE)) {
        let currentChain;
        if (element.hasAttribute(MODEL_KEY)) {
          // take the current chain from the MODEL_KEY
          currentChain = element.getAttribute(MODEL_KEY);
          if (currentChain?.startsWith(MODEL_CHAIN_PREFIX)) {
            currentChain = currentChain.slice(1);
          }
        }
        const completeChain = getCompleteChain(chainPrefix, currentChain);

        element[TAG_MODEL_FUNCTION_PROPERTY] = () => {
          if (model.hasExpression(completeChain)) {
            return model.evaluateExpression(completeChain);
          }

          return model.toObject(completeChain);
        };

        // element[TAG_MODEL_PROPERTY] = model.toObject(completeChain);
        // model.onChange(completeChain, _ => {
        //   element[TAG_MODEL_PROPERTY] = model.toObject(completeChain);
        // });

        // if (model.hasExpression(completeChain)) {
        //   element[TAG_MODEL_PROPERTY] = model.evaluateExpression(completeChain);
        //   model.onChangeExpressionChain(completeChain, _ => {
        //     element[TAG_MODEL_PROPERTY] = model.evaluateExpression(completeChain);
        //   });
        // }
      }

      const hasDataIfAttribute = isAttributePresentOnElement(element, IF_ATTRIBUTE);
      const hasDataForAttribute = isAttributePresentOnElement(element, FOR_ATTRIBUTE);
      if (hasDataIfAttribute && hasDataForAttribute) {
        console.error('Cannot use both data-if and data-for attributes on the same element', element);
      } else if (hasDataIfAttribute) {
        handleDataIfAttributePresence(element, BindingService.bindElement, options);
      } else if (hasDataForAttribute) {
        handleDataForAttributePresence(element, BindingService.bindElement, options);
      } else {
        const hasViewModelAttribute = element.hasAttribute(VIEW_MODEL_KEY);
        const hasModelAttribute = element.hasAttribute(MODEL_KEY);
        const hasDisableBinding = element.hasAttribute(DISABLE_BINDING);

        if (!hasDisableBinding) {
          if (hasViewModelAttribute || hasModelAttribute) {
            let chain;
            if (hasViewModelAttribute) {
              chain = element.getAttribute(VIEW_MODEL_KEY);
            } else {
              console.warn(
                `Attribute "${MODEL_KEY}" is deprecated for binding! Use the "${VIEW_MODEL_KEY}" key attribute instead.`,
                element,
              );
              chain = element.getAttribute(MODEL_KEY);
            }

            if (chain.startsWith(MODEL_CHAIN_PREFIX)) {
              chain = chain.slice(1);
              const completeChain = getCompleteChain(chainPrefix, chain);

              // update VIEW_MODEL_KEY
              element.setAttribute(VIEW_MODEL_KEY, `${MODEL_CHAIN_PREFIX}${completeChain}`);
              if (hasModelAttribute) {
                // temporary update deprecated MODEL_KEY attribute
                element.setAttribute(MODEL_KEY, `${MODEL_CHAIN_PREFIX}${completeChain}`);
              }

              // initial binding
              setElementModel(element, model, completeChain);
              bindElementChangeToModel(element, model, completeChain);

              // onChange
              const changeHandler = () => setElementModel(element, model, completeChain);
              model.onChange(completeChain, changeHandler);
              setElementChainChangeHandler(element,chain, changeHandler)

              // onChangeExpressionChain
              if (model.hasExpression(completeChain)) {
                const changeExpressionChainHandler = () => setElementModel(element, model, completeChain)
                model.onChangeExpressionChain(completeChain, changeExpressionChainHandler);
                setElementExpressionChangeHandler(element, completeChain, changeExpressionChainHandler);
              }
            } else {
              console.warn(
                `Invalid chain found! (chain: "${chain}")!\n`,
                `A valid chain must start with "${MODEL_CHAIN_PREFIX}".\n`,
                `target element:`,
                element,
              );
            }
          }

          // for psk-<components> @BindModel decorator is design for this task
          if (!element.tagName.startsWith(PSK_CARDINAL_PREFIX.toUpperCase())) {
            bindElementAttributes(element, model, MODEL_CHAIN_PREFIX, chainPrefix);
          }

          if (enableTranslations) {
            bindElementAttributes(element, translationModel, TRANSLATION_CHAIN_PREFIX, chainPrefix);
          }

          Array.from(element.childNodes)
            .filter(isTextNode)
            .forEach(node => {
              bindNodeValue(node, model, translationModel, chainPrefix);
            });
        }

        if (recursive) {
          Array.from(element.children).forEach(child => {
            BindingService.bindElement(child, options);
          });
        }
      }
    }
  },

  bindChildNodes: (element: Element | ShadowRoot, options: BindElementOptions) => {
    Array.from(element.childNodes).forEach(child => {
      BindingService.bindElement(child, { ...options });
    });
  },
};

export default BindingService;
