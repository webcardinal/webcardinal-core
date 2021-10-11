import {EVENT_PARENT_CHAIN_GET} from "../constants";
import {getCompleteChain} from "./element.utils";

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
  element.addEventListener(EVENT_PARENT_CHAIN_GET, (evt: CustomEvent) => {
    evt.stopImmediatePropagation()
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

    const index = Array.from(element.children).indexOf(node);

    node.dataset.count = element.children.length;
    node.dataset.index = `${index}`;

    if (index < 0) {
      return callback(undefined, completeChain);
    }

    let stepper = Number.parseInt(element.dataset.forChildrenCount);
    if (Number.isNaN(stepper) || stepper <= 0) {
      stepper = 1;
    }

    const chain = getCompleteChain(completeChain, Math.floor(index / stepper));
    return callback(undefined, chain);
  });
}
