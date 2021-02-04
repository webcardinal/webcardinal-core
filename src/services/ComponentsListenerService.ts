import {
  MODEL_CHAIN_PREFIX,
  EVENT_TAGS_GET,
  EVENT_MODEL_GET
} from "../constants";

function extractCallback(event) {
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

interface ComponentsListenerServiceOptions {
  model?: any,
  tags?: any
}

class ComponentsListenerService {
  private readonly host: HTMLElement;
  private readonly model: any;
  private readonly tags: any;
  private listeners: {
    [key: string]: (event: CustomEvent) => void
  };

  constructor(host: HTMLElement, { model, tags }: ComponentsListenerServiceOptions) {
    this.host = host;
    this.model = model;
    this.tags = tags;
    this.listeners = {};

    if (model) {
      this.listeners.getModel = (event: CustomEvent) => {
        event.stopImmediatePropagation();

        const callback = extractCallback(event);
        if (!callback) return;

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

    if (tags) {
      this.listeners.getTags = (event: CustomEvent) => {
        event.stopImmediatePropagation();

        const callback = extractCallback(event);
        if (!callback) return;

        if (event.detail.tag) {
          callback(undefined, event.detail.tag ? this.tags[event.detail.tag] : null);
        }

        callback(undefined, this.tags);
      }
    }
  }

  get getModel() {
    if (!this.model) return;

    const eventName = EVENT_MODEL_GET;
    return ({
      add: () => this.host.addEventListener(eventName, this.listeners.getModel),
      remove: () => this.host.removeEventListener(eventName, this.listeners.getModel),
      eventName
    });
  }

  get getTags() {
    if (!this.tags) return;

    const eventName = EVENT_TAGS_GET;
    return ({
      add: () => this.host.addEventListener(eventName, this.listeners.getTags),
      remove: () => this.host.removeEventListener(eventName, this.listeners.getTags),
      eventName
    });
  }
}

export default ComponentsListenerService;
