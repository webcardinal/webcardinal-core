import {
  EVENT_MODEL_GET,
  EVENT_ROUTING_GET,
  EVENT_TAGS_GET,
  EVENT_TRANSLATION_MODEL_GET,
  MODEL_CHAIN_PREFIX,
  TRANSLATION_CHAIN_PREFIX
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
  model?: any
  translationModel?: any
  tags?: any
  routing?: any
}

class ComponentsListenerService {
  private readonly host: HTMLElement;
  private readonly model: any;
  private readonly translationModel: any;
  private readonly tags: any;
  private readonly routing: any;
  private listeners: {
    [key in 'getModel' | 'getTranslationModel' | 'getTags' | 'getRouting']: (event: CustomEvent) => void
  } = {
    getModel: () => null,
    getTranslationModel: () => null,
    getTags: () => null,
    getRouting: () => null,
  };

  constructor(host: HTMLElement, {
    model,
    translationModel,
    tags,
    routing
  }: ComponentsListenerServiceOptions) {
    this.host = host;

    if (model) {
      this.model = model;
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

    if (translationModel) {
      this.translationModel = translationModel;
      this.listeners.getTranslationModel = (event: CustomEvent) => {
        event.stopImmediatePropagation();

        const callback = extractCallback(event);
        if (!callback) return;

        if (event.detail.chain) {
          let chain = event.detail.chain;
          if (!chain.startsWith(TRANSLATION_CHAIN_PREFIX)) {
            console.warn([
              `Invalid chain found for ${event} (chain: "${chain}")!`,
              `A valid chain must start with "${TRANSLATION_CHAIN_PREFIX}".`
            ].join('\n'));
            callback(undefined, translationModel);
            return;
          }
          chain = chain.slice(1);
          callback(undefined, translationModel.getChainValue(chain));
          return;
        }

        callback(undefined, translationModel);
      }
    }

    if (tags) {
      this.tags = tags;
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

    if (routing) {
      this.routing = routing;
      this.listeners.getRouting = (event: CustomEvent) => {
        event.stopImmediatePropagation();

        const callback = extractCallback(event);
        if (!callback) return;

        callback(undefined, this.routing);
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

  get getTranslationModel() {
    if (!this.translationModel) return;

    const eventName = EVENT_TRANSLATION_MODEL_GET;
    return ({
      add: () => this.host.addEventListener(eventName, this.listeners.getTranslationModel),
      remove: () => this.host.removeEventListener(eventName, this.listeners.getTranslationModel),
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

  get getRouting() {
    if (!this.routing) return;

    const eventName = EVENT_ROUTING_GET;
    return ({
      add: () => this.host.addEventListener(eventName, this.listeners.getRouting),
      remove: () => this.host.removeEventListener(eventName, this.listeners.getRouting),
      eventName
    });
  }
}

export default ComponentsListenerService;
