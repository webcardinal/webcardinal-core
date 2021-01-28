import DSUStorage from "../libs/DSUStorage";
import PskBindableModel from "../libs/bindableModel.js";

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

    if (options && typeof options !== 'boolean' && typeof options !== 'object') {
      throw Error(`
        Argument options is not valid, it must a boolean (true/false) in case of capture, or an options object.
        If no options are needed, this argument can be left empty.
        Provided value: ${options}
      `);
    }
  }
}

class Controller {
  constructor(element, history) {
    this.DSUStorage = new DSUStorage();

    this.element = element;
    this.history = history;
    this.element.componentOnReady().then(this.onReady.bind(this));
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

  send(eventName, detail, options = {}) {
    let eventOptions = {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail,
      ...options
    };

    this.element.dispatchEvent(new CustomEvent(eventName, eventOptions));
  }

  async onReady() {
    // TODO: a queue with all requests for listeners added with on method
    //       than the onReady mechanism will be removed for the end user
  }

  navigateToUrl(url, state) {
    this.history.push(url, state);
  }

  navigateToTag(tag, state) {
    // TODO: get URL from page tag
    const url = tag;
    this.history.push(url, state);
  }

  setModel(model) {
    this.model = PskBindableModel.setModel(model);
  }
}

export default Controller;
