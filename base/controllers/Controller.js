import DSUStorage from '../libs/DSUStorage';
import PskBindableModel from '../libs/bindableModel.js';

export const DATA_TAG_MODEL_FUNCTION_PROPERTY = 'getDataTagModel';

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

function isSkinEnabled() {
  const { state } = window.WebCardinal || {};
  if (state && state.activeSkin) {
    const { name, translations } = state.activeSkin;
    return name && typeof translations === 'boolean';
  }
  return false;
}

function areTranslationsEnabled() {
  const { state } = window.WebCardinal || {};
  if (state && state.activePage && state.activePage.skin) {
    const { name, translations } = state.activePage.skin;
    return name && translations === true
  }
  return false;
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
  if (!areTranslationsEnabled()) {
    return;
  }

  const { state, translations } = window.WebCardinal;
  const { name: skin } = state.activePage.skin;
  const pathname = getPathname();
  const currentTranslations = translations[skin];

  if (!currentTranslations) {
    console.warn(`No translations found for current skin "${skin}"`);
    return;
  }

  const currentPageTranslations = currentTranslations[pathname];
  if (!currentPageTranslations) {
    console.warn(`No translations found current skin "${skin} and page "${pathname}"`);
    return;
  }

  return currentPageTranslations;
}

export function proxifyModelProperty(model) {
  if (!model || typeof model !== 'object') {
    console.warn('A model must be an object!');
    return;
  }

  /*
   * A valid psk_bindable_model must be a proxy with the following functions
   * addExpression, evaluateExpression, hasExpression, onChangeExpressionChain, toObject
   */

  if (typeof model.onChangeExpressionChain === 'undefined') {
    return PskBindableModel.setModel(model);
  }
  return model;
}

export default class Controller {
  constructor(element, history) {
    this.DSUStorage = new DSUStorage();

    this.element = element;
    this.history = history;
    this.tagEventListeners = [];

    let model;
    Object.defineProperty(this, 'model', {
      get() {
        return model;
      },
      set(modelToSet) {
        if (model) {
          // update the current model without overwriting it
          Object.keys(modelToSet).forEach(modelKey => {
            model[modelKey] = modelToSet[modelKey];
          });
        } else {
          model = PskBindableModel.setModel(modelToSet);
        }
      },
    });

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
    if (props && props.model) {
      props.model = proxifyModelProperty(props.model)
    }
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

            const attachedModel = target[DATA_TAG_MODEL_FUNCTION_PROPERTY]
              ? target[DATA_TAG_MODEL_FUNCTION_PROPERTY]()
              : null;

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
            this.navigateToUrl(path, state);
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
    this.model = model;
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

  setState(state) {
    this.history.location.state = state;
  }

  getState() {
    return this.history.location.state;
  }

  setLanguage() {
    console.warn([
      `'Functions "setLanguage" is deprecated!'`,
      'Use "setSkin" with a new skin if changing of the translations is desired',
    ]);
  }

  setPreferredSkin(skin, { saveOption } = { saveOption: true }) {
    if (!isSkinEnabled()) {
      console.warn("WebCardinal skin is not set by your Application!");
      return;
    }

    if (typeof skin === 'string') {
      skin = {
        ...window.WebCardinal.state.activeSkin,
        name: skin
      }
    }

    if (typeof skin !== 'object') {
      console.warn("Skin must be an object or a string!");
      return;
    }

    if (saveOption && 'localStorage' in window) {
      window.localStorage.setItem('webcardinal.skin', JSON.stringify(skin));
    }

    window.WebCardinal.state.activeSkin = skin;
  }

  getPreferredSkin() {
    if (!isSkinEnabled()) {
      console.warn("WebCardinal skin is not set by your Application!");
      return;
    }

    return window.WebCardinal.state.activeSkin;
  }

  changeSkinForCurrentPage(skin) {
    if (!isSkinEnabled()) {
      console.warn("WebCardinal skin is not set by your Application!");
      return;
    }

    if (typeof skin === 'string') {
      skin = {
        ...window.WebCardinal.state.activePage.skin,
        name: skin
      }
    }

    if (typeof skin !== 'object') {
      console.warn("Skin must be an object or a string!");
      return;
    }

    window.WebCardinal.state.activePage.loader.skin = skin.name;
  }

  translate(translationChain) {
    if (!areTranslationsEnabled()) {
      console.warn([
        `Function "translate" must be called only when translations are enabled!`,
        `Check WebCardinal.state`
      ].join('\n'));
      return;
    }

    const { skin } = window.WebCardinal.state.activePage;
    const pathname = getPathname();

    if (!this.translationModel) {
      console.warn(`No translations found for skin "${skin}" and page "${pathname}"`);
      return translationChain;
    }

    if (translationChain.startsWith('$')) {
      translationChain = translationChain.slice(1);
    }
    const translation = getValueFromModelByChain(this.translationModel, translationChain);
    if (!translation) {
      console.warn(`No translations found for skin "${skin}", page "${pathname}" and chain "${translationChain}"`);
      return translationChain;
    }

    return translation;
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
    return this.element.querySelectorAll(selector);
  }
}
