import {
  getSkinFromState,
  getTranslationsFromState,
  getPathname,
  MODEL_CHAIN_PREFIX,
  VIEW_MODEL_KEY,
  TAG_ATTRIBUTE,
  TAG_MODEL_FUNCTION_PROPERTY,
  URLHelper,
  PAGES_PATH,
} from '../../src';
import PskBindableModel from '../libs/bindableModel.js';

const virtualHistory = new Set();
let isLocationListenerActive = false;

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

function isRequireAvailable() {
  // eslint-disable-next-line no-undef
  return window['$$'] && $$.require;
}

function isSkinEnabled() {
  const { state } = window.WebCardinal || {};
  return state && state.skin && typeof state.skin === 'string';
}

function getValueFromModelByChain(model, chain) {
  if (typeof chain === 'string') {
    chain = chain.split('.');
  }
  const key = chain.shift();
  return chain.length ? getValueFromModelByChain(model[key], chain) : model[key];
}

function clearVirtualHistory() {
  if (!document.querySelector('webc-app-loader[data-key]')) {
    virtualHistory.clear();
  }
}

function locationListener_v1(history) {
  /**
   It supports: goBack(), goForward()
   But the DOM is full with instances of webc-app-loader when a new page is requested
   */
  const inactiveKeys = Array.from(virtualHistory).filter(key => key !== history.location.key);

  const loaders = document.querySelectorAll('webc-app-loader[data-key]');
  const originalLoader = document.querySelector('webc-app-loader[save-state]:not([data-key])');
  originalLoader.setAttribute('hidden', '');

  for (const loader of Array.from(loaders)) {
    if (inactiveKeys.includes(loader.dataset.key)) {
      loader.setAttribute('hidden', '');
      continue;
    }

    loader.removeAttribute('hidden');
  }

  for (const loader of Array.from(loaders)) {
    if (!loader.hasAttribute('hidden')) {
      return;
    }
  }

  originalLoader.removeAttribute('hidden');
}

function locationListener_v2(history) {
  /**
   It supports: goBack() only
   The DOM is managed better then @ref locationListener_v1
   */
  const activeKey = history.location.key;

  let shouldBeRemove = true;
  let loaders = document.querySelectorAll('webc-app-loader[data-key]');
  for (const loader of Array.from(loaders)) {
    if (loader.dataset.key === activeKey || loader.dataset.key === 'not-generated-yet') {
      loader.removeAttribute('hidden');
      window.WebCardinal.state.page.loader = loader;
      window.WebCardinal.state.page.src = loader.src;
      shouldBeRemove = false;
      continue;
    }

    if (shouldBeRemove) {
      loader.remove();
      continue;
    }

    loader.setAttribute('hidden', '');
  }

  const originalLoader = document.querySelector('webc-app-loader[save-state]:not([data-key])');
  originalLoader.setAttribute('hidden', '');

  loaders = document.querySelectorAll('webc-app-loader[data-key]');
  for (const loader of Array.from(loaders)) {
    if (!loader.hasAttribute('hidden')) {
      return;
    }
  }

  originalLoader.removeAttribute('hidden');
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

export function getTranslationModel() {
  if (!getTranslationsFromState()) {
    return;
  }

  let { translations } = window.WebCardinal;
  const skin = getSkinFromState();
  const pathname = getPathname();

  const skinTranslations = translations[skin];
  const defaultTranslations = translations['default'];

  if (!skinTranslations && !defaultTranslations) {
    console.warn(`No translations found for skins: "${skin}"${skin !== 'default' ? ' and "default"' : ''}`);
    return;
  }

  let pageTranslations = skinTranslations?.[pathname];

  if (pageTranslations) {
    return pageTranslations;
  }

  pageTranslations = defaultTranslations?.[pathname];

  if (!pageTranslations) {
    console.warn(
      `No translations found for page: "${pathname}" (skins: "${skin}"${skin !== 'default' ? ' and "default"' : ''}`,
    );
    return;
  }

  return pageTranslations;
}

export function translate(translationChain, translationModel) {
  if (!getTranslationsFromState()) {
    console.warn(
      [`Function "translate" must be called only when translations are enabled!`, `Check WebCardinal.state`].join(
        '\n',
      ),
    );
    return;
  }

  const skin = getSkinFromState();
  const pathname = getPathname();

  if (!translationModel) {
    console.warn(
      `No translations found for page: "${pathname}" (skins: "${skin}"${skin !== 'default' ? ' and "default"' : ''})`,
    );
    return translationChain;
  }

  if (translationChain.startsWith('$')) {
    translationChain = translationChain.slice(1);
  }
  const translation = getValueFromModelByChain(translationModel, translationChain);
  if (!translation) {
    console.warn(
      `No translations found for chain: "${translationChain}" (page: "${pathname}", skins: "${skin}"${
        skin !== 'default' ? ' and "default"' : ''
      })`,
    );
    return translationChain;
  }

  return translation;
}

export default class Controller {
  /**
   * Controller exposes the main functions used in the WebCardinal
   * (WebCardinal Controllers API)
   *
   * @param {HTMLElement} element - Controller is applied to this element
   * @param {RouterHistory} history - Custom History object received from Stencil Router
   * @param {Proxy | undefined} [_model]  - The model received from another WebcComponent if data-view-model is present
   * @param {Proxy | {}} [_translationModel] - The translationModel received from an above WebcComponent
   */
  constructor(element, history, _model, _translationModel) {
    this.element = element;
    this.history = history;
    this.tagEventListeners = [];
    this._dsuStorage = undefined;

    let model;
    if (_model && this.element.hasAttribute(VIEW_MODEL_KEY)) {
      let chain = this.element.getAttribute(VIEW_MODEL_KEY);
      if (chain.startsWith(MODEL_CHAIN_PREFIX)) {
        chain = chain.slice(1);
      }
      model = PskBindableModel.setModel(_model);
    }

    Object.defineProperty(this, 'model', {
      get() {
        //return a friendly non-undefined model that will be well digested by the binding services
        if (!model) {
          model = PskBindableModel.setModel({});
        }
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

    this.translationModel = _translationModel || PskBindableModel.setModel(getTranslationModel() || {});

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

    // listener required for virtual pages created with "this.pushPage"
    if (!isLocationListenerActive) {
      this.history.listen(() => locationListener_v2(this.history));
      isLocationListenerActive = true;
    }
  }

  /**
   * It creates an element by its tag name and applies all the given properties
   *
   * @param {string} tagName - The name of the HTMLElement that will be created
   * @param {object} properties - Properties of the new created element
   *
   * @returns {HTMLElement}
   *
   * If "is" functionality from ElementCreationOptions is desired, use "document.createElement instead
   */
  createElement(tagName, properties) {
    if (properties && properties.model) {
      properties.model = proxifyModelProperty(properties.model);
    }
    return Object.assign(document.createElement(tagName), properties);
  }

  /**
   * It creates an element by its tag name, applies all the given properties
   * then the element is appended in current context of this Controller (this.element)
   *
   * @param {string} tagName - The name of the HTMLElement that will be created
   * @param {object} properties - Properties of the new created element
   *
   * @returns {HTMLElement}
   */
  createAndAddElement(tagName, properties) {
    const element = this.createElement(tagName, properties);
    this.element.append(element);
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
          if (target.getAttribute(TAG_ATTRIBUTE) === tag) {
            event.preventDefault(); // Cancel the native event
            event.stopPropagation(); // Don't bubble/capture the event any further

            const attachedModel = target[TAG_MODEL_FUNCTION_PROPERTY] ? target[TAG_MODEL_FUNCTION_PROPERTY]() : null;

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

      // if this.element is a custom element with "shadow" created with webc-component
      // all the listeners must be attached inside of the shadowRoot
      // (if this custom element has a Controller, listeners are attached to webc-container)
      let listenersElement = this.element;
      if (this.element.hasAttribute('shadow') && this.element.shadowRoot) {
        listenersElement = this.element.shadowRoot;
      }
      listenersElement.addEventListener(eventName, eventListener, options);
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

  async pushPage(src, options) {
    clearVirtualHistory();

    if (!options) {
      options = {};
    }
    if (!options.parentElement) {
      options.parentElement = document.querySelector('stencil-route:not([style="display: none;"])');
    }
    if (!options.namespace) {
      options.namespace = PAGES_PATH;
    }
    if (!options.skin) {
      options.skin = this.getSkin();
    }
    if (typeof options.tag !== 'string') {
      options.tag = undefined;
    }

    const { basePath } = window.WebCardinal;
    const { parentElement, namespace, skin, tag } = options;
    const { pathname } = this.history.location;

    src = URLHelper.join('', namespace, src).pathname;
    if (src.startsWith('/')) {
      src = `.${src}`;
    }
    if (!src.endsWith('.html')) {
      src += '.html';
    }

    const backData = {
      src: window.WebCardinal.state.page.loader.src,
      key: this.history.location.key,
    };

    const oldLoader = window.WebCardinal.state.page.loader;
    const pageLoader = this.createElement('webc-app-loader', { src, basePath, skin, tag, saveState: true });
    pageLoader.setAttribute('hidden', '');
    pageLoader.dataset.key = 'not-generated-yet';
    parentElement.prepend(pageLoader);

    await pageLoader.componentOnReady();
    oldLoader.setAttribute('hidden', '');
    pageLoader.removeAttribute('hidden');

    this.history.push(pathname, options.state);
    const forwardData = {
      src,
      key: this.history.location.key,
    };
    pageLoader.dataset.key = forwardData.key;

    virtualHistory.add(forwardData.key);
    virtualHistory.add(backData.key);
  }

  getVirtualHistory() {
    return Object.freeze(virtualHistory);
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

  updateState(key, value) {
    this.setState({
      ...(this.getState() || {}),
      [key]: value,
    });
  }

  removeFromState(key) {
    const state = this.getState();
    delete state[key];
    this.setState(state);
  }

  setSkin(skin, { save } = { save: true }) {
    if (!isSkinEnabled()) {
      console.warn('WebCardinal skin is not set by your Application!');
      return;
    }

    if (typeof skin !== 'string') {
      console.log('"skin" must be a valid non-empty string!');
      return;
    }

    if (save && 'localStorage' in window) {
      window.localStorage.setItem('webcardinal.skin', skin);
    }

    window.WebCardinal.state.skin = skin;
  }

  getSkin() {
    if (!isSkinEnabled()) {
      console.warn('WebCardinal skin is not set by your Application!');
      return;
    }

    return window.WebCardinal.state.skin;
  }

  applySkinForCurrentPage(skin) {
    if (!isSkinEnabled()) {
      console.warn('WebCardinal skin is not set by your Application!');
      return;
    }

    if (typeof skin !== 'string') {
      console.log('"skin" must be a valid non-empty string!');
      return;
    }

    window.WebCardinal.state.page.loader.skin = skin;
  }

  translate(translationChain) {
    return translate(translationChain, this.translationModel);
  }

  getElementByTag(tag) {
    return this.element.querySelector(`[${TAG_ATTRIBUTE}="${tag}"]`);
  }

  getElementsByTag(tag) {
    return this.element.querySelectorAll(`[${TAG_ATTRIBUTE}="${tag}"]`);
  }

  querySelector(selector) {
    return this.element.querySelector(selector);
  }

  querySelectorAll(selector) {
    return this.element.querySelectorAll(selector);
  }

  getMainEnclaveDB(callback) {
    if (!isRequireAvailable()) {
      console.error('"this.getMainEnclaveDB" is available only inside an SSApp!');
      return undefined;
    }

    // eslint-disable-next-line no-undef, @typescript-eslint/no-var-requires
    const dbAPI = require('opendsu').loadAPI('db');
    dbAPI.getMainEnclaveDB(callback);
  }

  /**
   * @deprecated
   *
   * Use "this.model = <YOUR_MODEL>" instead
   */
  setModel(model) {
    console.warn(
      [
        `Function "setModel" is applied in a redundant manner and it is also deprecated.`,
        `This function will be removed in a future release`,
        `Use "this.model = <YOUR_MODEL>" instead`,
      ].join('\n'),
    );
    this.model = model;
  }

  /**
   * @deprecated
   */
  setLanguage() {
    console.warn(
      [
        `Function "setLanguage" is deprecated!`,
        'Use "setSkin" with a new skin if changing of the translations is desired',
      ].join('\n'),
    );
  }

  /**
   * @deprecated
   */
  setPreferredSkin(skin, { saveOption } = { saveOption: true }) {
    console.warn(
      [
        `Function "setPreferredSkin" is deprecated!`,
        `Use "setSkin" instead, "saveOptions" flag is now "save" (store your skin in localStorage).`,
      ].join('\n'),
    );
    this.setSkin(skin, { save: saveOption });
  }

  /**
   * @deprecated
   */
  getPreferredSkin() {
    console.warn([`Function "getPreferredSkin" is deprecated!`, `Use "getSkin" instead!`].join('\n'));
    return this.getSkin();
  }

  /**
   * @deprecated
   */
  changeSkinForCurrentPage(skin) {
    console.warn(
      [`Function "changeSkinForCurrentPage" is deprecated!`, `Use "applySkinForCurrentPage" instead!`].join('\n'),
    );
    this.applySkinForCurrentPage(skin);
  }

  /**
   * @deprecated
   */
  get DSUStorage() {
    if (!isRequireAvailable()) {
      console.error('"this.DSUStorage" is available only inside an SSApp!');
      return this._dsuStorage;
    }

    if (!this._dsuStorage) {
      // eslint-disable-next-line no-undef, @typescript-eslint/no-var-requires
      const { getDSUStorage } = require('opendsu').loadAPI('storage');
      this._dsuStorage = getDSUStorage();
    }

    return this._dsuStorage;
  }

  /**
   * @deprecated
   */
  set DSUStorage(dsuStorage) {
    console.warn('Overriding "this.DSUStorage" is not recommended!');

    this._dsuStorage = dsuStorage;
  }
}
