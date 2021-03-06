import { MODEL_CHAIN_PREFIX, MODEL_KEY, VIEW_MODEL_KEY } from '../constants';

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
