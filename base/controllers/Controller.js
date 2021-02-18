import DSUStorage from '../libs/DSUStorage';
import PskBindableModel from '../libs/bindableModel.js';

const ControllerHelper = {
  checkEventListener: (eventName, listener, options) => {
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

    if (
      options &&
      typeof options !== 'boolean' &&
      typeof options !== 'object'
    ) {
      throw Error(`
        Argument options is not valid, it must a boolean (true/false) in case of capture, or an options object.
        If no options are needed, this argument can be left empty.
        Provided value: ${options}
      `);
    }
  },
  getTranslationModel: () => {
    const { language, translations } = window.WebCardinal;
    const currentTranslations = translations[language];

    if (!currentTranslations) {
      console.log(`No translations found for current language ${language}`);
      return null;
    }

    const { pathname } = window.location;
    const currentPageTranslations = currentTranslations[pathname];
    if (!currentPageTranslations) {
      console.warn(
        `No translations found for language ${language} and page ${pathname}`,
      );
      return null;
    }

    return currentPageTranslations;
  },
};

class Controller {
  constructor(element, history) {
    this.DSUStorage = new DSUStorage();

    this.element = element;
    this.history = history;
    this.element.componentOnReady().then(this.onReady.bind(this));

    this.tagEventListeners = [];

    this.setLegacyGetModelEventListener();

    this.translationModel = PskBindableModel.setModel(
      ControllerHelper.getTranslationModel() || {},
    );
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
      ControllerHelper.checkEventListener(eventName, listener, options);
      this.element.addEventListener(eventName, listener, options);
    } catch (err) {
      console.error(err);
    }
  }

  off(eventName, listener, options) {
    try {
      ControllerHelper.checkEventListener(eventName, listener, options);
      this.element.removeEventListener(eventName, listener, options);
    } catch (error) {
      console.error(error);
    }
  }

  onReady() {}

  onTagEvent(tag, eventName, listener, options) {
    try {
      ControllerHelper.checkEventListener(eventName, listener, options);

      const eventListener = event => {
        let target = event.target;
        while (target && target !== this.element) {
          const targetTag = target.getAttribute('data-tag');
          if (targetTag === tag) {
            event.preventDefault(); // Cancel the native event
            event.stopPropagation(); // Don't bubble/capture the event any further

            console.log(
              `Found listener for event ${eventName} for tag: ${targetTag}`,
            );
            const dataModelChain = target.getAttribute('data-model');
            const attachedModel = dataModelChain
              ? this.model.toObject(dataModelChain.slice(1))
              : undefined;

            listener(attachedModel, target, event);
            break;
          }

          target = target.parentElement;
        }
      };

      const tagEventListener = { tag, eventName, listener, eventListener };
      this.tagEventListeners.push(tagEventListener);

      this.element.addEventListener(eventName, eventListener, options);
    } catch (err) {
      console.error(err);
    }
  }

  offTagEvent(tag, eventName, listener, options) {
    try {
      ControllerHelper.checkEventListener(eventName, listener, options);

      this.tagEventListeners
        .filter(
          x =>
            x.tag === tag &&
            x.eventName === eventName &&
            x.listener === listener &&
            x.options === options,
        )
        .forEach(x => {
          this.element.removeEventListener(eventName, x.eventListener, options);
        });
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

  t(translationKey) {
    const { language } = window.WebCardinal;
    const { pathname } = window.location;

    if (!this.translationModel) {
      console.warn(
        `No translations found for language ${language} and page ${pathname}`,
      );
      return translationKey;
    }

    const translatedString = this.translationModel[translationKey];
    if (!translatedString) {
      console.warn(
        `No translations found for language ${language}, page ${pathname} and key ${translationKey}`,
      );
      return translationKey;
    }

    return translatedString;
  }
}

export default Controller;
