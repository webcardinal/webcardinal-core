import {
  MODEL_CHAIN_PREFIX,
  EVENT_MODEL_GET
} from "../constants";

class ComponentsListenerService {
  private readonly host: HTMLElement;
  private listeners: {
    [key: string]: (event: CustomEvent) => void
  };

  constructor(host: HTMLElement, model) {
    this.host = host;
    this.listeners = {
      getModel: (event: CustomEvent) => {
        event.stopImmediatePropagation();

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

        if (event.detail.chain) {
          let chain = event.detail.chain;
          if (!chain.startsWith(MODEL_CHAIN_PREFIX)) {
            console.warn([
              `Invalid chain found for ${event} (chain: "${chain}")!`,
              `A valid chain must start with "${MODEL_CHAIN_PREFIX}".`
            ].join('\n'));
            callback(undefined, model);
            return;
          }
          chain = chain.slice(1);
          callback(undefined, model.getChainValue(chain));
          return;
        }

        callback(undefined, model);
      }
    }
  }

  get getModel() {
    const eventName = EVENT_MODEL_GET;
    return ({
      add: () => this.host.addEventListener(eventName, this.listeners.getModel),
      remove: () => this.host.removeEventListener(eventName, this.listeners.getModel),
      eventName
    })
  }
}

export default ComponentsListenerService;
