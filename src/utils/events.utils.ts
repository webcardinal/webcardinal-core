import { EVENT_PARENT_CHAIN_GET, FOR_ATTRIBUTE, FOR_TEMPLATE_SIZE } from '../constants';

import { getCompleteChain } from './element.utils';

export function extractCallback(event) {
  let callback;
  if (typeof event.detail === 'function') {
    callback = event.detail;
  } else if (event.detail && typeof event.detail.callback === 'function') {
    callback = event.detail.callback;
  }

  if (!callback) {
    console.warn(`Invalid callback for event`, event);
    return;
  }

  return callback;
}

export function listenForPrefixChainEvents(element, completeChain) {
  if (!element.hasAttribute(FOR_TEMPLATE_SIZE)) {
    element.setAttribute(FOR_TEMPLATE_SIZE, `${element.children.length}`);
  }

  element.addEventListener(EVENT_PARENT_CHAIN_GET, (evt: CustomEvent) => {
    evt.stopImmediatePropagation();
    const callback = extractCallback(evt);
    if (!callback) {
      return;
    }

    if (evt.target && typeof evt.target['tagName'] !== 'string') {
      return callback(undefined, completeChain);
    }

    let node = evt.target as HTMLElement;
    if (evt.target['tagName'].toLowerCase() === 'webc-component') {
      node = node.parentElement;
    }

    let curentIterationNode = node;
    while (curentIterationNode.parentElement && !curentIterationNode.parentElement.hasAttribute(FOR_ATTRIBUTE)) {
      curentIterationNode = curentIterationNode.parentElement;
    }

    if (!curentIterationNode) {
      return callback(undefined, completeChain);
    }

    let index = Array.from(element.children).indexOf(curentIterationNode);
    if (index < 0) {
      return callback(undefined, completeChain);
    }

    let stepper = Number.parseInt(element.getAttribute(FOR_TEMPLATE_SIZE));
    if (Number.isNaN(stepper) || stepper <= 0) {
      stepper = 1;
    }
    index = Math.floor(index / stepper);
    const chain = getCompleteChain(completeChain, index);
    return callback(undefined, chain);
  });
}
