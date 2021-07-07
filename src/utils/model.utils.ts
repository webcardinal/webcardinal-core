import { MODEL_CHAIN_PREFIX, MODEL_KEY, VIEW_MODEL_KEY } from '../constants';

const modelChangeHandlersRegistry = new Map();

export function extractChain(element) {
  let chain = element.hasAttribute(VIEW_MODEL_KEY) ? element.getAttribute(VIEW_MODEL_KEY) : null;
  if (!chain && element.hasAttribute(MODEL_KEY)) {
    console.warn(
      `Attribute ${MODEL_KEY} is deprecated for binding! Use the ${VIEW_MODEL_KEY} key attribute instead.`,
      element,
    );
    chain = element.getAttribute(MODEL_KEY);
  }

  if (!chain) {
    return '';
  }

  if (!chain.startsWith(MODEL_CHAIN_PREFIX)) {
    const tagName = element.tagName.toLowerCase();
    console.error(
      [
        `Invalid chain found for ${tagName} (chain: "${chain}")!`,
        `A valid chain must start with "${MODEL_CHAIN_PREFIX}".`,
      ].join('\n'),
    );
    return '';
  }

  return chain;
}

export function setElementChainChangeHandler(element, chain, changeHandler){
  modelChangeHandlersRegistry.set(element, {chain, changeHandler})
}

export function setElementExpressionChangeHandler(element, expression, changeHandler){
  modelChangeHandlersRegistry.set(element, {expression, changeHandler})
}

export function removeChangeHandler(element, model){

  const seekForElementChainChangeHandlers = (element) => {
    if (element.childNodes.length > 0) {
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        if (modelChangeHandlersRegistry.has(child)) {
          const elementChangeChainHandler = modelChangeHandlersRegistry.get(child);

          if (elementChangeChainHandler.chain) {
            model.offChange(elementChangeChainHandler.chain, elementChangeChainHandler.changeHandler)
          } else {
            model.offChangeExpressionChain(elementChangeChainHandler.expression, elementChangeChainHandler.changeHandler)
          }
          modelChangeHandlersRegistry.delete(child);
        }
        seekForElementChainChangeHandlers(child);
      }
    }
  }
  seekForElementChainChangeHandlers(element);

}

