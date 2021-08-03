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
    if (!callback) return;

    const composedPathEventTargets: EventTarget [] = Array.from(evt.composedPath());
    const index = Array.from(element.children).findIndex((child: Element) => {
      return composedPathEventTargets.indexOf(child) !== -1
    });
    const chain = getCompleteChain(completeChain, index);
    callback(undefined, chain);
  });
}
