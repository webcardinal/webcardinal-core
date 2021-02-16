import { MODEL_CHAIN_PREFIX, MODEL_KEY } from '../constants';

export function extractChain(element) {
  const chain = element.getAttribute(MODEL_KEY);
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
