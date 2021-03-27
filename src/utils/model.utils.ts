import { BindingService } from "../services";
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

export async function bindChain(host, {
  chain,
  model, translationModel
}: {
  chain?: string,
  model?: object, translationModel?: object
}, options: {
  recursive?: boolean,
  enableTranslations?: boolean
} = {}) {
  if (!options) {
    options = {};
  }

  if (model) {
    Array.from(host.childNodes).forEach((child: Element | ChildNode) => {
      BindingService.bindElement(child, {
        model,
        translationModel,
        chainPrefix: chain ? chain.slice(1) : null,
        recursive: true,
        enableTranslations: true,
        ...options
      });
    });
  }

  return {
    model,
    translationModel
  }
}
