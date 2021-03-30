import DSUStorage from '../libs/DSUStorage';
import PskBindableModel from '../libs/bindableModel.js';

function checkEventListener(eventName, listener, options) {
  if (typeof eventName !== 'string' || eventName.trim().length === 0) {
    throw Error(`
      Argument eventName is not valid. It must be a non-empty string.
      Provided value: ${eventName}
    `);
  }

  if (typeof listener !== 'function') {
    throw Error(`
      Argument listener is not valid, it must be a function.
      Provided value: ${listener}
    `);
  }

  if (options && typeof options !== 'boolean' && typeof options !== 'object') {
    throw Error(`
      Argument options is not valid, it must a boolean (true/false) in case of capture, or an options object.
      If no options are needed, this argument can be left empty.
      Provided value: ${options}
    `);
  }
}

function getPathname() {
  let { pathname } = window.location;
  if (pathname === '/') {
    return pathname;
  }
  if (pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function getValueFromModelByChain(model, chain) {
  if (typeof chain === 'string') {
    chain = chain.split('.');
  }
  const key = chain.shift();
  return chain.length ? getValueFromModelByChain(model[key], chain) : model[key];
}

function getTranslationModel() {
  const { language, translations } = window.WebCardinal;
  const pathname = getPathname();
  const currentTranslations = translations[language];

  if (!currentTranslations) {
    console.warn(`No translations found for current language ${language}`);
    return null;
  }

  const currentPageTranslations = currentTranslations[pathname];
  if (!currentPageTranslations) {
    console.warn(`No translations found for language ${language} and page ${pathname}`);
    return null;
  }

  return currentPageTranslations;
}

class Controller {
  constructor(element, history) {
    this.DSUStorage = new DSUStorage();

    this.element = element;
    this.history = history;
    this.tagEventListeners = [];

    this.setLegacyGetModelEventListener();

    this.translationModel = PskBindableModel.setModel(getTranslationModel() || {});

    // will need to be called when the controller will be removed
    this.disconnectedCallback = () => {
      this.removeAllTagEventListeners();
      this.onDisconnectedCallback();
    };

    if (typeof this.element.componentOnReady === 'function') {
      this.element.componentOnReady().then(this.onReady.bind(this));
    } else {
      this.onReady();
    }
  }

  createElement(elementName, props) {
    return Object.assign(document.createElement(elementName), props);
  }

  createAndAddElement(elementName, props) {
    const element = this.createElement(elementName, props);
    this.element.appendChild(element);
    return element;
  }

  on(eventName, listener, options) {
    try {
      checkEventListener(eventName, listener, options);
      this.element.addEventListener(eventName, listener, options);
    } catch (err) {
      console.error(err);
    }
  }

  off(eventName, listener, options) {
    try {
      checkEventListener(eventName, listener, options);
      this.element.removeEventListener(eventName, listener, options);
    } catch (error) {
      console.error(error);
    }
  }

  onReady() {}

  onDisconnectedCallback() {}

  removeAllTagEventListeners() {
    this.tagEventListeners.forEach(x => {
      this.element.removeEventListener(x.eventName, x.eventListener, x.options);
    });
  }

  onTagEvent(tag, eventName, listener, options) {
    try {
      checkEventListener(eventName, listener, options);

      const eventListener = event => {
        let target = event.target;
        while (target && target !== this.element) {
          const targetTag = target.getAttribute('data-tag');
          if (targetTag === tag) {
            event.preventDefault(); // Cancel the native event
            event.stopPropagation(); // Don't bubble/capture the event any further

            const dataModelChain = target.getAttribute('data-model');
            const attachedModel = dataModelChain ? this.model.toObject(dataModelChain.slice(1)) : undefined;

            listener(attachedModel, target, event);
            break;
          }

          target = target.parentElement;
        }
      };

      const tagEventListener = {
        tag,
        eventName,
        listener,
        eventListener,
        options,
      };
      this.tagEventListeners.push(tagEventListener);

      this.element.addEventListener(eventName, eventListener, options);
    } catch (err) {
      console.error(err);
    }
  }

  offTagEvent(tag, eventName, listener, options) {
    try {
      checkEventListener(eventName, listener, options);

      const tagEventListenerIndexesToRemove = [];
      this.tagEventListeners
        .filter((x, index) => {
          const isMatch =
            x.tag === tag && x.eventName === eventName && x.listener === listener && x.options === options;
          if (isMatch) {
            tagEventListenerIndexesToRemove.push(index);
          }
          return isMatch;
        })
        .forEach(x => {
          this.element.removeEventListener(eventName, x.eventListener, options);
        });

      // remove the listeners also  from this.tagEventListeners
      if (tagEventListenerIndexesToRemove.length) {
        tagEventListenerIndexesToRemove.reverse();
        tagEventListenerIndexesToRemove.forEach(indexToRemove => {
          this.tagEventListeners.splice(indexToRemove, 1);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  onTagClick(tag, listener, options) {
    this.onTagEvent(tag, 'click', listener, options);
  }

  offTagClick(tag, listener, options) {
    this.offTagEvent(tag, 'click', listener, options);
  }

  navigateToUrl(url, state) {
    this.history.push(url, state);
  }

  navigateToPageTag(tag, state) {
    this.element.dispatchEvent(
      new CustomEvent('webcardinal:tags:get', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: {
          tag,
          callback: (error, path) => {
            if (error) {
              console.error(error);
              return;
            }
            this.history.push(path, state);
          },
        },
      }),
    );
  }

  send(eventName, detail, options = {}) {
    let eventOptions = {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail,
      ...options,
    };

    this.element.dispatchEvent(new CustomEvent(eventName, eventOptions));
  }

  setModel(model) {
    this.model = PskBindableModel.setModel(model);
  }

  setLegacyGetModelEventListener() {
    let dispatchModel = function (bindValue, model, callback) {
      if (bindValue && model[bindValue]) {
        callback(null, model[bindValue]);
      }

      if (!bindValue) {
        callback(null, model);
      }
    };

    this.element.addEventListener('getModelEvent', e => {
      e.preventDefault();
      e.stopImmediatePropagation();

      let { bindValue, callback } = e.detail;

      if (typeof callback === 'function') {
        return dispatchModel(bindValue, this.model, callback);
      }

      callback(new Error('No callback provided'));
    });
  }

  translate(translationChain) {
    const { language } = window.WebCardinal;
    const pathname = getPathname();

    if (!this.translationModel) {
      console.warn(`No translations found for language ${language} and page ${pathname}`);
      return translationChain;
    }

    if (translationChain.startsWith('$')) {
      translationChain = translationChain.slice(1);
    }
    const translation = getValueFromModelByChain(this.translationModel, translationChain);
    if (!translation) {
      console.warn(`No translations found for language ${language}, page ${pathname} and key ${translationChain}`);
      return translationChain;
    }

    return translation;
  }

  setLanguage(language) {
    if ('localStorage' in window) {
      window.localStorage.setItem('language', language);
    }
    window.location.reload();
  }

  getElementByTag(tag) {
    return this.element.querySelector(`[data-tag="${tag}"]`);
  }

  getElementsByTag(tag) {
    return this.element.querySelectorAll(`[data-tag="${tag}"]`);
  }

  querySelector(selector) {
    return this.element.querySelector(selector);
  }

  querySelectorAll(selector) {
    return this.element.querySelectorAll(selector)
  }
}

export default Controller;
